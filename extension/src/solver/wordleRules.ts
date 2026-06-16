import type { GuessResult, LetterResult } from './types';

export function evaluateGuess(guess: string, target: string): GuessResult {
  const g = guess.toUpperCase().split('');
  const t = target.toUpperCase().split('');
  const result: LetterResult[] = new Array(5).fill('absent');
  const targetPool = [...t];

  // Pass 1: greens
  for (let i = 0; i < 5; i++) {
    if (g[i] === t[i]) {
      result[i] = 'correct';
      targetPool[i] = '';
    }
  }

  // Pass 2: yellows
  for (let i = 0; i < 5; i++) {
    if (result[i] === 'correct') continue;
    const poolIdx = targetPool.indexOf(g[i]);
    if (poolIdx !== -1) {
      result[i] = 'present';
      targetPool[poolIdx] = '';
    }
  }

  return result as GuessResult;
}

export function filterWordList(words: string[], guess: string, result: GuessResult): string[] {
  const letterMap = new Map<string, { confirmed: number; hasGrey: boolean }>();
  
  for (let i = 0; i < 5; i++) {
    const letter = guess[i].toUpperCase();
    const res = result[i];
    const current = letterMap.get(letter) ?? { confirmed: 0, hasGrey: false };
    
    if (res === 'correct' || res === 'present') {
      current.confirmed += 1;
    } else {
      current.hasGrey = true;
    }
    letterMap.set(letter, current);
  }

  return words.filter(candidateStr => {
    const candidate = candidateStr.toUpperCase();
    for (let i = 0; i < 5; i++) {
      if (result[i] === 'correct' && candidate[i] !== guess[i].toUpperCase()) return false;
      if (result[i] === 'present' && candidate[i] === guess[i].toUpperCase()) return false;
      if (result[i] === 'absent' && candidate[i] === guess[i].toUpperCase()) return false;
    }

    for (const [letter, { confirmed, hasGrey }] of letterMap.entries()) {
      let countInCandidate = 0;
      for (const char of candidate) {
        if (char === letter) countInCandidate++;
      }

      if (confirmed === 0) {
        if (countInCandidate > 0) return false;
      } else if (hasGrey) {
        if (countInCandidate !== confirmed) return false;
      } else {
        if (countInCandidate < confirmed) return false;
      }
    }

    return true;
  });
}
