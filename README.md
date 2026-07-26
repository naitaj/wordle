# Wordle Entropy Solver

Wordle Entropy Solver is an autonomous AI-powered browser extension and companion website that helps users solve Wordle puzzles using information theory (Shannon Entropy). The extension calculates expected information gain to find guesses that eliminate the maximum possible candidate words per turn.

---

## Supported Wordle Games & Clones

The extension features a **Modular Game Adapter Architecture** that automatically detects and adapts to 11+ different Wordle variants:

### Tier 1 Variants
| Game | URL / Host | Boards | Mode |
|---|---|---|---|
| **Official NYT Wordle** | `nytimes.com/games/wordle` | 1 | Auto-Solve & Assist |
| **Wordle Unlimited** | `wordleunlimited.org` | 1 | Auto-Solve & Assist |
| **Hello Wordl** | `hellowordl.net` | 1 | Auto-Solve & Assist |
| **Dordle** | `dordle.io` | 2 Simultaneous | Auto-Solve & Assist |
| **Quordle** | `quordle.com` | 4 Simultaneous | Auto-Solve & Assist |
| **Octordle** | `octordle.com` | 8 Simultaneous | Auto-Solve & Assist |
| **Sedecordle** | `sedecordle.com` | 16 Simultaneous | Auto-Solve & Assist |
| **Hurdle** | `arkadium.com/games/hurdle` | Multi-Round | Auto-Solve & Assist |

### Tier 2 Variants
| Game | URL / Host | Type | Mode |
|---|---|---|---|
| **Absurdle** | `qntm.org/files/absurdle` | Adversarial | Auto-Solve & Assist |
| **Evil Wordle** | `swag.github.io/evil-wordle` | Adaptive Feedback | Auto-Solve & Assist |
| **Kilordle** | `kilordle.com` | 1000 Sequential Boards | Auto-Solve & Assist |
| **Lingle** | `lingle.today` | Custom Layout | Auto-Solve & Assist |

---

## Modular Adapter Architecture

Instead of hardcoding DOM logic inside the solver, all site-specific interaction is isolated into `/extension/src/adapters/`.

```
/extension/src/adapters
  ├── types.ts           # GameAdapter interface & data structures
  ├── adapterRegistry.ts # Domain auto-detection & adapter factory
  ├── nyt.ts             # NYT & Wordle Unlimited adapter
  ├── hellowordl.ts      # Hello Wordl adapter
  ├── dordle.ts          # Dordle 2-board adapter
  ├── quordle.ts         # Quordle 4-board adapter
  ├── octordle.ts        # Octordle 8-board adapter
  ├── sedecordle.ts      # Sedecordle 16-board adapter
  ├── hurdle.ts          # Hurdle multi-round adapter
  ├── absurdle.ts        # Absurdle adversarial adapter
  ├── evilwordle.ts      # Evil Wordle adapter
  ├── kilordle.ts        # Kilordle sequential adapter
  └── lingle.ts          # Lingle adapter
```

### GameAdapter Interface

Every adapter implements the standard `GameAdapter` contract:

```typescript
export interface GameAdapter {
  info: GameInfo;
  detectGame(): boolean;
  readBoard(boardIndex?: number): BoardState;
  readAllBoards(): BoardState[];
  submitGuess(word: string, delay: number): Promise<void>;
  waitForReveal(boardIndex: number, rowIndex: number): Promise<TileData[]>;
  getKeyboardState(): KeyboardState;
  isGameFinished(): boolean;
  reset?(): Promise<void>;
}
```

The entropy engine never needs to know which game is active. It interacts solely with the generic `GameAdapter` interface.

---

## Adding Support for Future Wordle Clones

To add a new Wordle clone:

1. Create a new file in `extension/src/adapters/myclone.ts` implementing `GameAdapter`.
2. Register the adapter in `extension/src/adapters/adapterRegistry.ts`.
3. Add the match URL pattern to `extension/manifest.json` under `host_permissions` and `content_scripts[0].matches`.
4. Rebuild the extension with `node extension/build.js`.

---

## Development & Building

### Build the Extension
```bash
node extension/build.js
```
The compiled unpacked Chrome Extension files are emitted to `extension/dist/`.

### Load Unpacked Extension in Chrome
1. Navigate to `chrome://extensions/`
2. Toggle **Developer Mode** ON in the top-right corner.
3. Click **Load unpacked** in the top-left corner.
4. Select the `extension/dist` directory.

### Run Website Locally
```bash
npm run dev
```

---

## License

MIT License
