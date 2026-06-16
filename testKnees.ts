import { evaluateGuess, filterWordList } from './src/solver/wordleRules';
import { wordList } from './src/data/wordList';
import { rankGuesses } from './src/solver/entropySolver';

let remaining = [...wordList];
const target = 'KNEES';
const guesses = ['CRANE', 'OLDEN', 'SINEW', 'UNSET'];

for (const guess of guesses) {
  const result = evaluateGuess(guess, target);
  remaining = filterWordList(remaining, guess, result);
}

console.log(`Remaining after UNSET: ${remaining.join(', ')}`);

const scored5 = rankGuesses(remaining, wordList);
console.log(`Top 5 for guess 5:`);
for (let i = 0; i < 5; i++) {
  console.log(`${scored5[i].word} - entropy: ${scored5[i].entropy}`);
}

const guess5 = scored5[0].word;
console.log(`\nGuess 5 is: ${guess5}`);
const result5 = evaluateGuess(guess5, target);
remaining = filterWordList(remaining, guess5, result5);

console.log(`Remaining after Guess 5: ${remaining.join(', ')}`);

const scored6 = rankGuesses(remaining);
console.log(`Top 5 for guess 6:`);
for (let i = 0; i < 5; i++) {
  console.log(`${scored6[i]?.word} - entropy: ${scored6[i]?.entropy}`);
}
