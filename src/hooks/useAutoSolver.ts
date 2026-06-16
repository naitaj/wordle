import { useState, useRef, useCallback } from 'react';
import type { SolverState, BoardRow, Tile } from '../solver/types';
import { evaluateGuess, filterWordList } from '../solver/wordleRules';
import { rankGuessesAsync } from '../solver/entropySolver';
import { answerList, wordList } from '../data/wordList';
import { askGrokForGuess } from '../solver/llmFallback';

const LETTER_DELAY_MS = 150;
const EVAL_PAUSE_MS = 400;

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function makeInitialState(target: string): SolverState {
  const board: BoardRow[] = Array.from({ length: 6 }).map(() => ({
    tiles: Array.from({ length: 5 }).map(() => ({ letter: '', status: 'empty' })),
    status: 'idle'
  }));
  return {
    board,
    keyboardState: {},
    currentRow: 0,
    guessHistory: [],
    remainingWords: answerList,
    targetWord: target,
    currentGuess: '',
    phase: 'idle',
    topCandidates: [],
    statusMessage: 'Ready',
    hardMode: false,
    defaultOpener: 'ADIEU',
    llmFallbackEnabled: false,
    expectedRemaining: 0,
    winProbability: 0,
  };
}

export function useWordleAutoSolver(initialTarget?: string) {
  const [state, setState] = useState<SolverState>(() => {
    const target = initialTarget || answerList[Math.floor(Math.random() * answerList.length)];
    return makeInitialState(target);
  });

  const runIdRef = useRef(0);

  const reset = useCallback((newTarget?: string) => {
    runIdRef.current += 1;
    setState(makeInitialState(newTarget || answerList[Math.floor(Math.random() * answerList.length)]));
  }, []);

  const start = useCallback(async (customWord?: string) => {
    runIdRef.current += 1;
    const runId = runIdRef.current;
    const target = customWord || answerList[Math.floor(Math.random() * answerList.length)];
    setState(makeInitialState(target));

    const cancelled = () => runIdRef.current !== runId;

    await sleep(200);
    if (cancelled()) return;

    let currentState: SolverState = { ...makeInitialState(target), phase: 'thinking' };
    
    // Preserve configs across runs
    currentState.hardMode = state.hardMode;
    currentState.defaultOpener = state.defaultOpener;
    currentState.llmFallbackEnabled = state.llmFallbackEnabled;
    
    setState(currentState);

    while (currentState.currentRow < 6 && currentState.phase !== 'won' && currentState.phase !== 'lost') {
      if (cancelled()) return;

      currentState = { ...currentState, phase: 'thinking', statusMessage: 'Calculating entropy...' };
      setState(currentState);
      await sleep(50);
      if (cancelled()) return;

      let bestGuess: string = '';
      let candidates: any[] = [];
      let expectedRem = 0;
      let winProb = 0;

      // Zero-Candidate State Treatment
      if (currentState.remainingWords.length === 0) {
        let fullDictRemaining = [...wordList];
        for (const g of currentState.guessHistory) {
          fullDictRemaining = filterWordList(fullDictRemaining, g.word, g.result);
        }

        if (fullDictRemaining.length > 0) {
          // Switch to wordList pool
          currentState = { ...currentState, remainingWords: fullDictRemaining, statusMessage: 'Switched to full dictionary pool...' };
          setState(currentState);
        } else {
          // Genuine invariant violation
          if (!currentState.llmFallbackEnabled) {
            currentState = { ...currentState, phase: 'lost', statusMessage: 'Zero candidates remaining. LLM Fallback disabled.' };
            setState(currentState);
            return;
          }

          currentState = { ...currentState, phase: 'thinking', statusMessage: '🤖 Asking Groq for help...' };
          setState(currentState);
          await sleep(100);

          let llmValid = false;
          let retries = 2;
          while (!llmValid && retries >= 0) {
            const llmResult = await askGrokForGuess(
              currentState.guessHistory,
              `The word has ${currentState.currentRow} guesses so far. Use the clues to deduce the answer.`,
              []
            );
            if (!('error' in llmResult)) {
              bestGuess = llmResult.word;
              llmValid = true;
            }
            retries--;
          }
          if (!llmValid) {
            bestGuess = 'CRANE'; // ultimate fallback
          }

          candidates = [{ word: bestGuess, entropy: 0, remainingCount: 0 }];
        }
      }

      if (!bestGuess) {
        if (currentState.currentRow === 0) {
          bestGuess = currentState.defaultOpener;
          candidates = [{ word: bestGuess, entropy: 5.74, remainingCount: currentState.remainingWords.length }];
          expectedRem = currentState.remainingWords.length / Math.pow(2, 5.74);
          winProb = 1 / currentState.remainingWords.length;
        } else {
          candidates = await rankGuessesAsync(currentState.remainingWords);
          if (candidates.length === 0) {
            currentState = { ...currentState, phase: 'lost', statusMessage: 'No valid words left!' };
            setState(currentState);
            return;
          }

          bestGuess = candidates[0].word;
          expectedRem = currentState.remainingWords.length / Math.pow(2, candidates[0].entropy);
          winProb = 1 / currentState.remainingWords.length;

          // Dynamic Exploratory Strategy
          if (!currentState.hardMode && currentState.remainingWords.length > 1 && currentState.remainingWords.length <= 150) {
            const fullScored = await rankGuessesAsync(currentState.remainingWords, wordList);
            const bestValid = candidates[0];
            const bestFull = fullScored[0];

            if (bestFull && bestValid) {
              const marginalGain = bestFull.entropy - bestValid.entropy;
              // Thresholds for triggering exploration
              if (marginalGain > 0.15 && winProb < 0.34) {
                candidates = fullScored;
                bestGuess = bestFull.word;
                expectedRem = currentState.remainingWords.length / Math.pow(2, bestFull.entropy);
                winProb = 0; // Not a valid candidate, so win prob this turn is 0
                currentState = { ...currentState, statusMessage: `Exploratory guess: ${bestGuess}` };
                setState(currentState);
              }
            }
          }
        }
      }

      currentState = { 
        ...currentState, 
        topCandidates: candidates,
        expectedRemaining: expectedRem,
        winProbability: winProb,
        phase: 'typing', 
        statusMessage: 'Typing guess...' 
      };
      setState(currentState);

      for (let col = 0; col < 5; col++) {
        await sleep(LETTER_DELAY_MS);
        if (cancelled()) return;

        const newBoard = [...currentState.board];
        const newRow = { ...newBoard[currentState.currentRow] };
        const newTiles = [...newRow.tiles];
        newTiles[col] = { ...newTiles[col], letter: bestGuess[col] };
        newRow.tiles = newTiles;
        newRow.status = 'active';
        newBoard[currentState.currentRow] = newRow;

        currentState = { ...currentState, board: newBoard, currentGuess: bestGuess };
        setState(currentState);
      }

      currentState = { ...currentState, phase: 'evaluating', statusMessage: 'Evaluating...' };
      setState(currentState);
      await sleep(EVAL_PAUSE_MS);
      if (cancelled()) return;

      const result = evaluateGuess(bestGuess, target);
      const isWon = result.every(r => r === 'correct');

      const newBoard = [...currentState.board];
      const newRow = { ...newBoard[currentState.currentRow] };
      const newTiles = newRow.tiles.map((t, i) => ({ ...t, status: result[i] as Tile['status'] }));
      newRow.tiles = newTiles;
      newRow.status = 'evaluated';
      newBoard[currentState.currentRow] = newRow;

      const newHistory = [...currentState.guessHistory, { word: bestGuess, result }];
      const newRemaining = filterWordList(currentState.remainingWords, bestGuess, result);

      const priority: Record<string, number> = { correct: 3, present: 2, absent: 1, empty: 0 };
      const newKeyboard = { ...currentState.keyboardState };
      for (let i = 0; i < 5; i++) {
        const letter = bestGuess[i];
        const incoming = result[i];
        const existing = newKeyboard[letter] || 'empty';
        if (priority[incoming] > priority[existing]) {
          newKeyboard[letter] = incoming;
        }
      }

      const nextRow = currentState.currentRow + 1;
      let nextPhase = currentState.phase;
      let nextMsg = 'Ready';

      if (isWon) {
        nextPhase = 'won';
        nextMsg = 'Solver won!';
      } else if (nextRow >= 6) {
        nextPhase = 'lost';
        nextMsg = `Solver lost! Answer was ${target}`;
      } else {
        nextPhase = 'thinking';
      }

      currentState = {
        ...currentState,
        board: newBoard,
        keyboardState: newKeyboard,
        guessHistory: newHistory,
        remainingWords: newRemaining,
        currentRow: nextRow,
        phase: nextPhase as any,
        statusMessage: nextMsg
      };
      setState(currentState);

      if (isWon || currentState.currentRow >= 6) break;
    }
  }, []);

  const updateConfig = useCallback((config: Partial<SolverState>) => {
    setState(prev => ({ ...prev, ...config }));
  }, []);

  return [state, { start, reset, updateConfig }] as const;
}
