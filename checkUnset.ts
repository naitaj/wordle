import { evaluateGuess, filterWordList } from './src/solver/wordleRules';
import { wordList } from './src/data/wordList';

let remaining = [...wordList];
const target = 'KNEES';
const guesses = ['CRANE', 'OLDEN', 'SINEW', 'UNSET'];

for (const guess of guesses) {
  const result = evaluateGuess(guess, target);
  remaining = filterWordList(remaining, guess, result);
}
console.log(`Remaining after UNSET: ${remaining.length} words`);
console.log(remaining);
