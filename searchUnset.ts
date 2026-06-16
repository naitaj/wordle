import { wordList } from './src/data/wordList';
const matches = wordList.filter(w => {
  if (w[1] !== 'N') return false;
  if (w[3] !== 'E') return false;
  if (!w.includes('S')) return false;
  if (w[2] === 'S') return false;
  return true;
});
console.log('Words matching UNSET constraints:', matches);
