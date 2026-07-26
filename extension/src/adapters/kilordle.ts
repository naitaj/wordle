import type { GameAdapter, GameInfo, BoardState, TileData, KeyboardState } from './types';

export class KilordleAdapter implements GameAdapter {
  readonly info: GameInfo = {
    id: 'kilordle',
    name: 'Kilordle (Sequential 1000 Boards)',
    boardCount: 1,
    isMultiBoard: false,
    isMultiRound: false,
    isSequential: true,
    supportsAutoPlay: true
  };

  detectGame(): boolean {
    return window.location.hostname.includes('kilordle.com');
  }

  readBoard(boardIndex: number = 0): BoardState {
    const tiles = Array.from(document.querySelectorAll('.tile, [class*="tile"], [data-state]'));
    const rows: TileData[][] = [];
    
    for (let r = 0; r < 6; r++) {
      const row: TileData[] = [];
      for (let c = 0; c < 5; c++) {
        const el = tiles[r * 5 + c];
        if (el) {
          const letter = (el.textContent || '').trim().toLowerCase();
          const cls = (el.className || '').toLowerCase();
          let state: TileData['state'] = 'empty';
          if (cls.includes('correct')) state = 'correct';
          else if (cls.includes('present')) state = 'present';
          else if (cls.includes('absent')) state = 'absent';
          row.push({ letter, state });
        } else {
          row.push({ letter: '', state: 'empty' });
        }
      }
      rows.push(row);
    }

    let currentRow = 6;
    for (let r = 0; r < 6; r++) {
      const isEval = rows[r].every(t => t.state === 'correct' || t.state === 'present' || t.state === 'absent');
      if (!isEval) {
        currentRow = r;
        break;
      }
    }

    let gameStatus: 'playing' | 'won' | 'lost' = 'playing';
    if (currentRow > 0 && rows[currentRow - 1].every(t => t.state === 'correct')) {
      gameStatus = 'won';
    }

    return { rows, currentRow, gameStatus };
  }

  readAllBoards(): BoardState[] {
    return [this.readBoard(0)];
  }

  async submitGuess(word: string, delay: number): Promise<void> {
    for (const char of word) {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: char, code: `Key${char.toUpperCase()}`, bubbles: true }));
      await new Promise(r => setTimeout(r, delay));
    }
    await new Promise(r => setTimeout(r, delay));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }));
  }

  async waitForReveal(boardIndex: number, rowIndex: number): Promise<TileData[]> {
    await new Promise(r => setTimeout(r, 1200));
    return this.readBoard(0).rows[rowIndex] || [];
  }

  getKeyboardState(): KeyboardState {
    const kb: KeyboardState = {};
    const keys = Array.from(document.querySelectorAll('.key, button'));
    for (const k of keys) {
      const txt = (k.textContent || '').trim().toLowerCase();
      if (txt.length === 1 && txt >= 'a' && txt <= 'z') {
        const cls = (k.className || '').toLowerCase();
        if (cls.includes('correct')) kb[txt] = 'correct';
        else if (cls.includes('present')) kb[txt] = 'present';
        else if (cls.includes('absent')) kb[txt] = 'absent';
        else kb[txt] = 'empty';
      }
    }
    return kb;
  }

  isGameFinished(): boolean {
    return this.readBoard(0).gameStatus === 'won';
  }

  async reset(): Promise<void> {
    // Reset solver memory when Kilordle auto-advances to next target word
    await new Promise(r => setTimeout(r, 300));
  }
}
