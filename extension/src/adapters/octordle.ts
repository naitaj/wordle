import type { GameAdapter, GameInfo, BoardState, TileData, KeyboardState } from './types';

export class OctordleAdapter implements GameAdapter {
  readonly info: GameInfo = {
    id: 'octordle',
    name: 'Octordle (8 Boards)',
    boardCount: 8,
    isMultiBoard: true,
    isMultiRound: false,
    isSequential: false,
    supportsAutoPlay: true
  };

  detectGame(): boolean {
    return window.location.hostname.includes('octordle.com');
  }

  readBoard(boardIndex: number = 0): BoardState {
    // Octordle features 8 boards with 13 rows x 5 tiles each
    const boardContainers = Array.from(document.querySelectorAll('[id*="board"], [class*="board"], .octordle-board'));
    const targetBoard = boardContainers[boardIndex] || document.body;

    const tiles = Array.from(targetBoard.querySelectorAll('.tile, [class*="tile"], [data-state]'));
    const rows: TileData[][] = [];
    
    for (let r = 0; r < 13; r++) {
      const row: TileData[] = [];
      for (let c = 0; c < 5; c++) {
        const el = tiles[r * 5 + c];
        if (el) {
          const letter = (el.textContent || el.getAttribute('data-letter') || '').trim().toLowerCase();
          const cls = (el.className || '').toLowerCase();
          const stateAttr = (el.getAttribute('data-state') || '').toLowerCase();
          
          let state: TileData['state'] = 'empty';
          if (cls.includes('correct') || stateAttr.includes('correct')) state = 'correct';
          else if (cls.includes('present') || stateAttr.includes('present')) state = 'present';
          else if (cls.includes('absent') || stateAttr.includes('absent')) state = 'absent';
          row.push({ letter, state });
        } else {
          row.push({ letter: '', state: 'empty' });
        }
      }
      rows.push(row);
    }

    let currentRow = 13;
    for (let r = 0; r < 13; r++) {
      const isEval = rows[r].every(t => t.state === 'correct' || t.state === 'present' || t.state === 'absent');
      if (!isEval) {
        currentRow = r;
        break;
      }
    }

    let gameStatus: 'playing' | 'won' | 'lost' = 'playing';
    if (currentRow > 0) {
      if (rows[currentRow - 1].every(t => t.state === 'correct')) gameStatus = 'won';
      else if (currentRow >= 13) gameStatus = 'lost';
    }

    return { rows, currentRow, gameStatus };
  }

  readAllBoards(): BoardState[] {
    return Array.from({ length: 8 }, (_, i) => this.readBoard(i));
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
    await new Promise(r => setTimeout(r, 2200));
    return this.readBoard(boardIndex).rows[rowIndex] || [];
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
    return this.readAllBoards().every(b => b.gameStatus !== 'playing');
  }
}
