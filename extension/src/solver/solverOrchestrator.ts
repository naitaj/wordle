/**
 * Solver Orchestrator — Framework-agnostic solve loop.
 * Extracted from useAutoSolver.ts (React hook) into a pure TypeScript class.
 * 
 * This is the brain of the Chrome Extension. It preserves the exact same
 * algorithm: ADIEU opener → entropy ranking → dynamic exploratory breakout → LLM fallback.
 * 
 * Instead of manipulating React state, it communicates via callbacks and
 * a BrowserBridge interface for DOM operations.
 */

import type { SolverState, SolverConfig, GuessRecord, GuessResult, LetterResult, ScoredWord, BoardRow, Tile } from './types';
import { filterWordList } from './wordleRules';
import { rankGuessesAsync, clearPatternCache } from './entropySolver';
import { askGrokForGuess } from './llmFallback';
import { answerList, wordList } from '../data/wordList';

// ─── Browser Bridge Interface ───
// Abstracts away Chrome content script communication.

export interface TileResult {
  letter: string;
  state: 'correct' | 'present' | 'absent';
}

export interface BoardReading {
  rows: { letter: string; state: string }[][];
  currentRow: number;
  gameStatus: 'playing' | 'won' | 'lost';
}

export interface BrowserBridge {
  readBoard(): Promise<BoardReading>;
  typeWord(word: string, delay: number): Promise<void>;
  submitGuess(): Promise<void>;
  waitForReveal(rowIndex: number): Promise<TileResult[]>;
  updateBadge(text: string): Promise<void>;
}

// ─── State Update Callback ───
export type OnStateUpdate = (state: Partial<SolverState> & { isRunning: boolean; mode: 'auto' | 'assist' }) => void;

// ─── Default Config ───
const DEFAULT_CONFIG: SolverConfig = {
  hardMode: false,
  llmFallbackEnabled: false,
  typingDelay: 120,
  groqApiKey: '',
};

// ─── Win Probability Helper ───
function calculateWinProbability(N: number, currentRow: number, entropy: number, isExploratory: boolean): number {
  if (N <= 0) return 0.0;
  if (N === 1) return 1.0;
  
  let attemptsLeft = 6 - currentRow;
  if (isExploratory) {
    attemptsLeft--; // Spent this turn on an exploratory guess
  }
  
  if (attemptsLeft <= 0) return 0.0;
  if (attemptsLeft === 1) return 1 / N;
  
  if (N <= attemptsLeft) return 1.0;
  
  const expectedGuesses = Math.log2(N) / Math.max(0.5, entropy);
  const expectedGuessesRequired = 0.5 + expectedGuesses;
  const margin = attemptsLeft - expectedGuessesRequired;
  
  // Sigmoid mapping for success rate
  const sigmoidP = 1 / (1 + Math.exp(-1.5 * margin));
  
  // Make sure it is bounded by 1/N on the lower side and 0.99 on the upper side
  return Math.min(0.99, Math.max(1 / N, sigmoidP));
}

// ─── Orchestrator ───

export class SolverOrchestrator {
  private config: SolverConfig = { ...DEFAULT_CONFIG };
  private isRunning = false;
  private shouldStop = false;
  private onUpdate: OnStateUpdate;
  
  // Solver state
  private remainingWords: string[] = [];
  private guessHistory: GuessRecord[] = [];
  private currentRow = 0;
  private topCandidates: ScoredWord[] = [];
  private expectedRemaining = 0;
  private winProbability = 0;

  constructor(onUpdate: OnStateUpdate) {
    this.onUpdate = onUpdate;
  }

  updateConfig(config: Partial<SolverConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): SolverConfig {
    return { ...this.config };
  }

  stop(): void {
    this.shouldStop = true;
    this.isRunning = false;
    this.emit({ phase: 'idle', statusMessage: 'Stopped by user.' });
  }

  private emit(partial: Partial<SolverState>): void {
    this.onUpdate({
      ...partial,
      isRunning: this.isRunning,
      mode: 'auto',
    });
  }

  private emitAssist(partial: Partial<SolverState>): void {
    this.onUpdate({
      ...partial,
      isRunning: this.isRunning,
      mode: 'assist',
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ─── Main Auto-Solve Loop ───
  
  async startAutoSolve(bridge: BrowserBridge): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    this.shouldStop = false;
    clearPatternCache();

    try {
      // Read initial board state
      await bridge.updateBadge('🧠 Reading board...');
      const boardState = await bridge.readBoard();

      if (boardState.gameStatus !== 'playing') {
        this.emit({ phase: boardState.gameStatus === 'won' ? 'won' : 'lost', statusMessage: `Game already ${boardState.gameStatus}.` });
        this.isRunning = false;
        return;
      }

      // Initialize solver state from the live board
      this.currentRow = boardState.currentRow;
      this.guessHistory = [];
      this.remainingWords = [...answerList];

      // Reconstruct constraints from already-played rows
      for (let r = 0; r < this.currentRow; r++) {
        const row = boardState.rows[r];
        const word = row.map(t => t.letter).join('').toUpperCase();
        const result = row.map(t => {
          if (t.state === 'correct') return 'correct';
          if (t.state === 'present') return 'present';
          return 'absent';
        }) as GuessResult;

        if (word.length === 5) {
          this.guessHistory.push({ word, result });
          this.remainingWords = filterWordList(this.remainingWords, word, result);
        }
      }

      this.emit({
        phase: 'thinking',
        currentRow: this.currentRow,
        remainingWords: this.remainingWords,
        guessHistory: this.guessHistory,
        statusMessage: `Resuming from row ${this.currentRow + 1}. ${this.remainingWords.length} words.`,
      });

      // ─── Solve Loop ───
      while (this.currentRow < 6 && !this.shouldStop) {
        await bridge.updateBadge(`🧠 Attempt ${this.currentRow + 1}/6`);

        const guess = await this.computeBestGuess();
        if (this.shouldStop) break;

        if (!guess) {
          this.emit({ phase: 'lost', statusMessage: 'No valid guess found.' });
          break;
        }

        // Type the word
        this.emit({ phase: 'typing', currentGuess: guess, statusMessage: `Typing: ${guess}` });
        await bridge.updateBadge(`⌨️ ${guess}`);
        await bridge.typeWord(guess, this.config.typingDelay);
        if (this.shouldStop) break;

        // Submit
        await bridge.submitGuess();
        this.emit({ phase: 'evaluating', statusMessage: 'Waiting for reveal...' });

        // Wait for tile animation to complete
        await this.sleep(300); // Small buffer for animation to start
        
        let results: TileResult[];
        try {
          results = await bridge.waitForReveal(this.currentRow);
        } catch (err: any) {
          if (err.message === 'NOT_IN_WORD_LIST') {
            this.emit({
              phase: 'thinking',
              statusMessage: `Word rejected by dictionary: ${guess}. Retrying...`,
            });
            // Remove the rejected word from candidates pool
            this.remainingWords = this.remainingWords.filter(w => w.toUpperCase() !== guess.toUpperCase());
            // Retry the same row
            continue;
          }
          throw err;
        }
        
        if (this.shouldStop) break;

        // Wait 3 seconds after entering and revealing the word
        this.emit({ phase: 'evaluating', statusMessage: 'Word entered. Waiting 3 seconds...' });
        await this.sleep(3000);
        if (this.shouldStop) break;

        // Convert results to GuessResult
        const guessResult = results.map(r => r.state) as GuessResult;
        const isWon = guessResult.every(r => r === 'correct');

        // Update solver state
        this.guessHistory.push({ word: guess, result: guessResult });
        this.remainingWords = filterWordList(this.remainingWords, guess, guessResult);
        this.currentRow++;

        if (isWon) {
          await bridge.updateBadge(`🎉 Solved in ${this.currentRow}!`);
          this.emit({
            phase: 'won',
            currentRow: this.currentRow,
            guessHistory: this.guessHistory,
            remainingWords: this.remainingWords,
            statusMessage: `Solved in ${this.currentRow} attempt${this.currentRow > 1 ? 's' : ''}!`,
          });
          break;
        }

        if (this.currentRow >= 6) {
          await bridge.updateBadge('❌ Failed');
          this.emit({
            phase: 'lost',
            currentRow: this.currentRow,
            guessHistory: this.guessHistory,
            remainingWords: this.remainingWords,
            statusMessage: 'Failed to solve within 6 attempts.',
          });
          break;
        }

        // Continue loop
        this.emit({
          phase: 'thinking',
          currentRow: this.currentRow,
          guessHistory: this.guessHistory,
          remainingWords: this.remainingWords,
          topCandidates: this.topCandidates,
          expectedRemaining: this.expectedRemaining,
          winProbability: this.winProbability,
          statusMessage: `${this.remainingWords.length} words remaining.`,
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.emit({ phase: 'lost', statusMessage: `Error: ${msg}` });
      await bridge.updateBadge(`❌ Error`);
    } finally {
      this.isRunning = false;
      this.emit({}); // Emit status to ensure popup UI gets isRunning = false
    }
  }

  // ─── Assist Mode ───
  
  async computeAssist(bridge: BrowserBridge): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    this.shouldStop = false;
    clearPatternCache();

    try {
      const boardState = await bridge.readBoard();

      this.currentRow = boardState.currentRow;
      this.guessHistory = [];
      this.remainingWords = [...answerList];

      // Reconstruct constraints
      for (let r = 0; r < this.currentRow; r++) {
        const row = boardState.rows[r];
        const word = row.map(t => t.letter).join('').toUpperCase();
        const result = row.map(t => {
          if (t.state === 'correct') return 'correct';
          if (t.state === 'present') return 'present';
          return 'absent';
        }) as GuessResult;

        if (word.length === 5) {
          this.guessHistory.push({ word, result });
          this.remainingWords = filterWordList(this.remainingWords, word, result);
        }
      }

      // Compute recommendation
      const guess = await this.computeBestGuess();
      
      this.emitAssist({
        phase: 'idle',
        currentRow: this.currentRow,
        guessHistory: this.guessHistory,
        remainingWords: this.remainingWords,
        topCandidates: this.topCandidates,
        expectedRemaining: this.expectedRemaining,
        winProbability: this.winProbability,
        currentGuess: guess || '',
        statusMessage: guess 
          ? `Recommended: ${guess} (${this.remainingWords.length} words)` 
          : 'No recommendation available.',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.emitAssist({ phase: 'idle', statusMessage: `Error: ${msg}` });
    } finally {
      this.isRunning = false;
    }
  }

  // ─── Core Guess Computation (preserved from useAutoSolver) ───

  private async computeBestGuess(): Promise<string | null> {
    let bestGuess: string | null = null;

    // Zero-Candidate State Treatment
    if (this.remainingWords.length === 0) {
      let fullDictRemaining = [...wordList];
      for (const g of this.guessHistory) {
        fullDictRemaining = filterWordList(fullDictRemaining, g.word, g.result);
      }

      if (fullDictRemaining.length > 0) {
        this.remainingWords = fullDictRemaining;
        this.emit({ remainingWords: fullDictRemaining, statusMessage: 'Switched to full dictionary pool...' });
      } else {
        // Genuine invariant violation — try LLM
        if (!this.config.llmFallbackEnabled) {
          return null;
        }

        this.emit({ statusMessage: '🤖 Asking Groq for help...' });
        let retries = 2;
        while (retries >= 0) {
          const llmResult = await askGrokForGuess(
            this.guessHistory,
            `The word has ${this.currentRow} guesses so far.`,
            []
          );
          if (!('error' in llmResult)) {
            bestGuess = llmResult.word;
            this.topCandidates = [{ word: bestGuess, entropy: 0, remainingCount: 0 }];
            break;
          }
          retries--;
        }
        return bestGuess || 'CRANE';
      }
    }

    // Attempt 1: hardcoded opener
    if (this.currentRow === 0 && this.guessHistory.length === 0) {
      bestGuess = 'ADIEU';
      this.topCandidates = [{ word: bestGuess, entropy: 5.74, remainingCount: this.remainingWords.length }];
      this.expectedRemaining = this.remainingWords.length / Math.pow(2, 5.74);
      this.winProbability = calculateWinProbability(this.remainingWords.length, this.currentRow, 5.74, false);
      return bestGuess;
    }

    // Entropy ranking
    const candidates = await rankGuessesAsync(this.remainingWords);
    if (candidates.length === 0) return null;

    bestGuess = candidates[0].word;
    this.topCandidates = candidates.slice(0, 10);
    this.expectedRemaining = this.remainingWords.length / Math.pow(2, candidates[0].entropy);
    this.winProbability = calculateWinProbability(this.remainingWords.length, this.currentRow, candidates[0].entropy, false);

    // Dynamic Exploratory Strategy
    if (!this.config.hardMode && this.remainingWords.length > 1 && this.remainingWords.length <= 150) {
      const fullScored = await rankGuessesAsync(this.remainingWords, wordList);
      const bestValid = candidates[0];
      const bestFull = fullScored[0];

      if (bestFull && bestValid) {
        const marginalGain = bestFull.entropy - bestValid.entropy;
        // Equivalent to 1/N < 0.34 (N >= 3)
        if (marginalGain > 0.15 && this.remainingWords.length >= 3) {
          this.topCandidates = fullScored.slice(0, 10);
          bestGuess = bestFull.word;
          this.expectedRemaining = this.remainingWords.length / Math.pow(2, bestFull.entropy);
          this.winProbability = calculateWinProbability(this.remainingWords.length, this.currentRow, bestFull.entropy, true);
          this.emit({ statusMessage: `Exploratory guess: ${bestGuess}` });
        }
      }
    }

    return bestGuess;
  }
}
