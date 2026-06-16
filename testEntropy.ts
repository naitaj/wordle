import { evaluateGuess, filterWordList } from './src/solver/wordleRules';
import { wordList } from './src/data/wordList';
import { rankGuesses } from './src/solver/entropySolver';

let remaining = [...wordList];
const guesses = ['CRANE', 'PETAL', 'ABBEY', 'ASKEW'];
const target = 'ADIEU';

for (const guess of guesses) {
  const result = evaluateGuess(guess, target);
  remaining = filterWordList(remaining, guess, result);
}

const scored = rankGuesses(remaining, wordList);
console.log("Top 5 guesses:");
for (let i = 0; i < 5; i++) {
  console.log(`${scored[i].word} - entropy: ${scored[i].entropy}`);
}
