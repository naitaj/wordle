import type { GuessResult, ScoredWord } from './types';
import { evaluateGuess } from './wordleRules';

function encodeResult(result: GuessResult): string {
  return result.map(r => r === 'correct' ? 'G' : r === 'present' ? 'Y' : 'X').join('');
}

const patternCache = new Map<string, string>();

function getPattern(word: string, target: string): string {
  const key = `${word}:${target}`;
  let pattern = patternCache.get(key);
  if (!pattern) {
    pattern = encodeResult(evaluateGuess(word, target));
    patternCache.set(key, pattern);
  }
  return pattern;
}

export function computeEntropy(word: string, remainingWords: string[]): number {
  const buckets = new Map<string, number>();
  for (const answer of remainingWords) {
    const key = getPattern(word, answer);
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  let entropy = 0;
  for (const count of buckets.values()) {
    const p = count / remainingWords.length;
    entropy -= p * Math.log2(p);
  }
  return entropy; // bits
}

// Global worker instance for async solving
let solverWorker: Worker | null = null;

export function rankGuessesAsync(candidates: string[], fullDictionary?: string[]): Promise<ScoredWord[]> {
  return new Promise((resolve) => {
    if (!solverWorker) {
      solverWorker = new Worker(new URL('./entropy.worker.ts', import.meta.url), { type: 'module' });
    }

    const handler = (e: MessageEvent) => {
      if (e.data.type === 'RANK_GUESSES_RESULT') {
        solverWorker?.removeEventListener('message', handler);
        resolve(e.data.scored);
      }
    };

    solverWorker.addEventListener('message', handler);
    solverWorker.postMessage({ type: 'RANK_GUESSES', candidates, fullDictionary });
  });
}

export function rankGuesses(candidates: string[], fullDictionary?: string[]): ScoredWord[] {
  if (candidates.length === 2309) {
    // Hard-coded opener skips calculation
    return [{
      word: 'CRANE',
      entropy: 5.74, 
      remainingCount: candidates.length,
    }];
  }

  // If fullDictionary is provided (e.g. for the 5th attempt exploratory guess)
  // and we have multiple candidates left, we score the whole dictionary to find 
  // the best word to break traps.
  let poolToScore = candidates;
  if (fullDictionary && candidates.length > 1) {
    poolToScore = fullDictionary;
  } else {
    const MAX_SCORED_GUESSES = 500;
    poolToScore = candidates.slice(0, MAX_SCORED_GUESSES);
  }

  const scored: ScoredWord[] = poolToScore.map(word => {
    return {
      word,
      entropy: computeEntropy(word, candidates),
      remainingCount: candidates.length
    };
  });

  scored.sort((a, b) => b.entropy - a.entropy);

  // If entropy is tied, strongly prefer valid candidates so we can potentially win early
  // (Deterministic tie-breaker logic is duplicated in the worker)
  scored.sort((a, b) => {
    if (Math.abs(b.entropy - a.entropy) > 1e-6) {
      return b.entropy - a.entropy;
    }
    
    const aIsPossible = candidates.includes(a.word);
    const bIsPossible = candidates.includes(b.word);
    if (aIsPossible && !bIsPossible) return -1;
    if (!aIsPossible && bIsPossible) return 1;
    return a.word.localeCompare(b.word);
  });

  return scored;
}
