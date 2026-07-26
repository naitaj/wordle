/**
 * Automated Verification & Simulation Suite for Wordle Extension Adapters.
 */

import { getAllAdapters, detectActiveAdapter } from './src/adapters/adapterRegistry';

console.log('─── Running Adapter Verification & Simulation Suite ───\n');

// 1. Interface Validation
const adapters = getAllAdapters();
console.log(`[Suite 1] Total Adapters Registered: ${adapters.length}`);

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

    console.log(`  ✅ Interface Verified: [${info.id.toUpperCase()}] ${info.name} (${info.boardCount} ${info.boardCount > 1 ? 'Boards' : 'Board'})`);
    passed++;
  } catch (err: any) {
    console.error(`  ❌ Failed: ${adapter.constructor.name} -`, err.message);
    failed++;
  }
}

// 2. Domain Auto-Detection Simulation
console.log('\n[Suite 2] Simulated Domain Detection Test:');

const testCases = [
  { url: 'https://www.nytimes.com/games/wordle/index.html', expectedId: 'nyt' },
  { url: 'https://wordleunlimited.org/', expectedId: 'nyt' },
  { url: 'https://hellowordl.net/', expectedId: 'hellowordl' },
  { url: 'https://dordle.io/', expectedId: 'dordle' },
  { url: 'https://www.quordle.com/', expectedId: 'quordle' },
  { url: 'https://octordle.com/', expectedId: 'octordle' },
  { url: 'https://sedecordle.com/', expectedId: 'sedecordle' },
  { url: 'https://www.arkadium.com/games/hurdle/', expectedId: 'hurdle' },
  { url: 'https://qntm.org/files/absurdle/', expectedId: 'absurdle' },
  { url: 'https://swag.github.io/evil-wordle/', expectedId: 'evilwordle' },
  { url: 'https://kilordle.com/', expectedId: 'kilordle' },
  { url: 'https://lingle.today/', expectedId: 'lingle' },
];

for (const tc of testCases) {
  try {
    const parsed = new URL(tc.url);
    // Mock global window location
    (globalThis as any).window = {
      location: {
        hostname: parsed.hostname,
        pathname: parsed.pathname,
        href: tc.url
      }
    };

    const active = detectActiveAdapter();
    if (!active) {
      throw new Error(`No adapter detected for URL: ${tc.url}`);
    }

    if (active.info.id !== tc.expectedId) {
      throw new Error(`Expected adapter ID '${tc.expectedId}' for ${tc.url}, but got '${active.info.id}'`);
    }

    console.log(`  ✅ Detection Passed: ${tc.url} ➔ ${active.info.name}`);
    passed++;
  } catch (err: any) {
    console.error(`  ❌ Detection Failed for ${tc.url}:`, err.message);
    failed++;
  }
}

console.log(`\nFinal Summary: ${passed} passed, ${failed} failed.`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 All 11 Wordle clone adapters & domain detection verified successfully!');
}
