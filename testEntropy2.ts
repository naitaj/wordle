import { evaluateGuess, filterWordList } from './src/solver/wordleRules';
import { wordList } from './src/data/wordList';
import { rankGuesses, computeEntropy } from './src/solver/entropySolver';

let remaining = [...wordList];
const guesses = ['CRANE', 'PETAL', 'ABBEY', 'ASKEW'];
const target = 'ADIEU';

for (const guess of guesses) {
  const result = evaluateGuess(guess, target);
  remaining = filterWordList(remaining, guess, result);
}

const scored = rankGuesses(remaining, wordList);
console.log(`Remaining length: ${remaining.length}`);
console.log(`AMAZE entropy: ${computeEntropy('AMAZE', remaining)}`);
console.log(`ADIEU entropy: ${computeEntropy('ADIEU', remaining)}`);
console.log(`AGAVE entropy: ${computeEntropy('AGAVE', remaining)}`);
