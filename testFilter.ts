import { evaluateGuess, filterWordList } from './src/solver/wordleRules';
import { wordList } from './src/data/wordList';

let remaining = [...wordList];

const guesses = ['CRANE', 'PETAL', 'ABBEY', 'ASKEW'];
const target = 'ADIEU';

for (const guess of guesses) {
  const result = evaluateGuess(guess, target);
  remaining = filterWordList(remaining, guess, result);
}
console.log(`Remaining words: ${remaining.join(', ')}`);
