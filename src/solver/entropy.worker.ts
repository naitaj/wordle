import { computeEntropy } from './entropySolver';
import { answerList } from '../data/wordList';
import type { ScoredWord } from './types';

self.onmessage = (e: MessageEvent) => {
  const { candidates, fullDictionary, type } = e.data;
  if (type !== 'RANK_GUESSES') return;

  let poolToScore = candidates;
  if (fullDictionary && candidates.length > 1) {
    poolToScore = fullDictionary;
  } else {
    // We can score more candidates in a worker without freezing the UI
    const MAX_SCORED_GUESSES = 1500;
    poolToScore = candidates.slice(0, MAX_SCORED_GUESSES);
  }

  const scored: ScoredWord[] = poolToScore.map((word: string) => {
    return {
      word,
      entropy: computeEntropy(word, candidates),
      remainingCount: candidates.length
    };
  });

  scored.sort((a, b) => {
    // 0. Primary Sort: Entropy (descending)
    if (Math.abs(b.entropy - a.entropy) > 1e-6) {
      return b.entropy - a.entropy;
    }

    // 1. Prefer valid candidates
    const aIsPossible = candidates.includes(a.word);
    const bIsPossible = candidates.includes(b.word);
    if (aIsPossible && !bIsPossible) return -1;
    if (!aIsPossible && bIsPossible) return 1;

    // 2. Prefer answerList (valid targets)
    const aIsAnswer = answerList.includes(a.word);
    const bIsAnswer = answerList.includes(b.word);
    if (aIsAnswer && !bIsAnswer) return -1;
    if (!aIsAnswer && bIsAnswer) return 1;

    // 3. More unique letters
    const aUnique = new Set(a.word).size;
    const bUnique = new Set(b.word).size;
    if (aUnique !== bUnique) {
      return bUnique - aUnique; // descending
    }

    // 4. Higher word frequency proxy (answerList index)
    const aRank = answerList.indexOf(a.word);
    const bRank = answerList.indexOf(b.word);
    if (aRank !== -1 && bRank !== -1 && aRank !== bRank) {
      return aRank - bRank;
    }

    // 5. Alphabetical fallback
    return a.word.localeCompare(b.word);
  });

  self.postMessage({ type: 'RANK_GUESSES_RESULT', scored });
};
