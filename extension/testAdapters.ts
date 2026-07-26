/**
 * Automated Verification Script for Wordle Extension Adapters.
 */

import { getAllAdapters } from './src/adapters/adapterRegistry';

console.log('─── Running Adapter Verification Suite ───');

const adapters = getAllAdapters();
console.log(`Total Adapters Registered: ${adapters.length}`);

let passed = 0;
let failed = 0;

for (const adapter of adapters) {
  try {
    const info = adapter.info;
    if (!info.id || !info.name || typeof info.boardCount !== 'number') {
      throw new Error(`Invalid info object on adapter ${adapter.constructor.name}`);
    }

    if (typeof adapter.detectGame !== 'function' ||
        typeof adapter.readBoard !== 'function' ||
        typeof adapter.readAllBoards !== 'function' ||
        typeof adapter.submitGuess !== 'function' ||
        typeof adapter.getKeyboardState !== 'function' ||
        typeof adapter.isGameFinished !== 'function') {
      throw new Error(`Missing required GameAdapter interface methods on ${info.name}`);
    }

    console.log(`✅ Passed: [${info.id.toUpperCase()}] ${info.name} (${info.boardCount} ${info.boardCount > 1 ? 'Boards' : 'Board'})`);
    passed++;
  } catch (err: any) {
    console.error(`❌ Failed: ${adapter.constructor.name} -`, err.message);
    failed++;
  }
}

console.log(`\nResults: ${passed} passed, ${failed} failed.`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('All 11 Wordle clone adapters validated successfully!');
}
