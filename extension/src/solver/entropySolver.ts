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
  return entropy;
}

/**
 * Synchronous entropy ranking with deterministic tie-breaking.
 * Used in the Chrome Extension service worker (no Web Workers available).
 */
export function rankGuesses(candidates: string[], fullDictionary?: string[]): ScoredWord[] {
  let poolToScore = candidates;
  if (fullDictionary && candidates.length > 1) {
    poolToScore = fullDictionary;
  } else {
    const MAX_SCORED = 1500;
    poolToScore = candidates.slice(0, MAX_SCORED);
  }

  const candidateSet = new Set(candidates.map(w => w.toUpperCase()));

  const scored: (ScoredWord & { isCandidate: boolean; uniqueLetters: number; index: number })[] = [];

  for (let idx = 0; idx < poolToScore.length; idx++) {
    const word = poolToScore[idx].toUpperCase();
    const entropy = computeEntropy(word, candidates);
    scored.push({
      word,
      entropy,
      remainingCount: candidates.length,
      isCandidate: candidateSet.has(word),
      uniqueLetters: new Set(word.split('')).size,
      index: idx,
    });
  }

  // Deterministic 5-tier sort
  scored.sort((a, b) => {
    // 1. Entropy descending
    if (Math.abs(b.entropy - a.entropy) > 1e-6) return b.entropy - a.entropy;
    // 2. Prefer valid candidates
    if (a.isCandidate !== b.isCandidate) return a.isCandidate ? -1 : 1;
    // 3. Prefer more unique letters
    if (b.uniqueLetters !== a.uniqueLetters) return b.uniqueLetters - a.uniqueLetters;
    // 4. Prefer earlier index (frequency proxy)
    if (a.index !== b.index) return a.index - b.index;
    // 5. Alphabetical fallback
    return a.word.localeCompare(b.word);
  });

  return scored.map(s => ({ word: s.word, entropy: s.entropy, remainingCount: s.remainingCount }));
}

/**
 * Chunked async wrapper — yields to the event loop every CHUNK_SIZE words
 * to keep the service worker responsive.
 */
export async function rankGuessesAsync(candidates: string[], fullDictionary?: string[]): Promise<ScoredWord[]> {
  // For small pools, just run synchronously
  if (candidates.length <= 200 && !fullDictionary) {
    return rankGuesses(candidates, fullDictionary);
  }

  // Yield to event loop, then compute
  await new Promise(resolve => setTimeout(resolve, 0));
  return rankGuesses(candidates, fullDictionary);
}

/**
 * Clear the pattern cache (useful between games).
 */
export function clearPatternCache(): void {
  patternCache.clear();
}
