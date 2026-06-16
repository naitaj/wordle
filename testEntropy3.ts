import { evaluateGuess, filterWordList } from './src/solver/wordleRules';
import { wordList, answerList } from './src/data/wordList';
import { rankGuesses } from './src/solver/entropySolver';

let remaining = [...answerList];
const guesses = ['CRANE', 'PETAL', 'ABBEY', 'ASKEW'];
const target = 'ADIEU';

for (const guess of guesses) {
  const result = evaluateGuess(guess, target);
  remaining = filterWordList(remaining, guess, result);
}

console.log(`Remaining length: ${remaining.length}`);
console.log(`Remaining words: ${remaining.join(', ')}`);

const scored = rankGuesses(remaining, wordList);
console.log("Top 5 guesses:");
for (let i = 0; i < 5; i++) {
  console.log(`${scored[i].word} - entropy: ${scored[i].entropy}`);
}
