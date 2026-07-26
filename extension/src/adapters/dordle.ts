import type { GameAdapter, GameInfo, BoardState, TileData, KeyboardState } from './types';

export class DordleAdapter implements GameAdapter {
  readonly info: GameInfo = {
    id: 'dordle',
    name: 'Dordle (2 Boards)',
    boardCount: 2,
    isMultiBoard: true,
    isMultiRound: false,
    isSequential: false,
    supportsAutoPlay: true
  };

  detectGame(): boolean {
    const host = window.location.hostname;
    return host.includes('dordle.io') || host.includes('zaratustra.itch.io/dordle');
  }

  readBoard(boardIndex: number = 0): BoardState {
    const boardContainers = Array.from(document.querySelectorAll('.board, [class*="board"], [id*="board"]'));
    const targetBoard = boardContainers[boardIndex] || document.body;

    const tiles = Array.from(targetBoard.querySelectorAll('.tile, [class*="tile"], [data-state]'));
    const rows: TileData[][] = [];
    
    // Dordle has 7 rows x 5 letters per board
    for (let r = 0; r < 7; r++) {
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

    let currentRow = 7;
    for (let r = 0; r < 7; r++) {
      const isEval = rows[r].every(t => t.state === 'correct' || t.state === 'present' || t.state === 'absent');
      if (!isEval) {
        currentRow = r;
        break;
      }
    }

    let gameStatus: 'playing' | 'won' | 'lost' = 'playing';
    if (currentRow > 0) {
      if (rows[currentRow - 1].every(t => t.state === 'correct')) gameStatus = 'won';
      else if (currentRow >= 7) gameStatus = 'lost';
    }

    return { rows, currentRow, gameStatus };
  }

  readAllBoards(): BoardState[] {
    return [this.readBoard(0), this.readBoard(1)];
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
    await new Promise(r => setTimeout(r, 1800));
    return this.readBoard(boardIndex).rows[rowIndex] || [];
  }

  getKeyboardState(): KeyboardState {
    const kb: KeyboardState = {};
    const keys = Array.from(document.querySelectorAll('button[data-key], .key'));
    for (const k of keys) {
      const txt = (k.getAttribute('data-key') || k.textContent || '').trim().toLowerCase();
      if (txt.length === 1 && txt >= 'a' && txt <= 'z') {
        const cls = (k.className || '').toLowerCase();
        const state = (k.getAttribute('data-state') || '').toLowerCase();
        if (cls.includes('correct') || state.includes('correct')) kb[txt] = 'correct';
        else if (cls.includes('present') || state.includes('present')) kb[txt] = 'present';
        else if (cls.includes('absent') || state.includes('absent')) kb[txt] = 'absent';
        else kb[txt] = 'empty';
      }
    }
    return kb;
  }

  isGameFinished(): boolean {
    const b1 = this.readBoard(0);
    const b2 = this.readBoard(1);
    return (b1.gameStatus !== 'playing') && (b2.gameStatus !== 'playing');
  }
}
