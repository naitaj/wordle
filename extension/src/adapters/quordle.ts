import type { GameAdapter, GameInfo, BoardState, TileData, KeyboardState } from './types';

export class QuordleAdapter implements GameAdapter {
  readonly info: GameInfo = {
    id: 'quordle',
    name: 'Quordle (4 Boards)',
    boardCount: 4,
    isMultiBoard: true,
    isMultiRound: false,
    isSequential: false,
    supportsAutoPlay: true
  };

  detectGame(): boolean {
    const host = window.location.hostname;
    return host.includes('quordle.com') || host.includes('merriam-webster.com/games/quordle');
  }

  readBoard(boardIndex: number = 0): BoardState {
    // Quordle features 4 boards (indices 0..3) with 9 rows x 5 letters each
    const boardContainers = Array.from(document.querySelectorAll('[aria-label*="Board"], [class*="Board"], .board'));
    const targetBoard = boardContainers[boardIndex] || document.body;

    const tiles = Array.from(targetBoard.querySelectorAll('[aria-label*="Tile"], [class*="Tile"], [data-state]'));
    const rows: TileData[][] = [];
    
    for (let r = 0; r < 9; r++) {
      const row: TileData[] = [];
      for (let c = 0; c < 5; c++) {
        const el = tiles[r * 5 + c];
        if (el) {
          const letter = (el.textContent || el.getAttribute('data-letter') || '').trim().toLowerCase();
          const cls = (el.className || '').toLowerCase();
          const stateAttr = (el.getAttribute('data-state') || el.getAttribute('aria-label') || '').toLowerCase();
          
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

    let currentRow = 9;
    for (let r = 0; r < 9; r++) {
      const isEval = rows[r].every(t => t.state === 'correct' || t.state === 'present' || t.state === 'absent');
      if (!isEval) {
        currentRow = r;
        break;
      }
    }

    let gameStatus: 'playing' | 'won' | 'lost' = 'playing';
    if (currentRow > 0) {
      if (rows[currentRow - 1].every(t => t.state === 'correct')) gameStatus = 'won';
      else if (currentRow >= 9) gameStatus = 'lost';
    }

    return { rows, currentRow, gameStatus };
  }

  readAllBoards(): BoardState[] {
    return [0, 1, 2, 3].map(i => this.readBoard(i));
  }

  async submitGuess(word: string, delay: number): Promise<void> {
    for (const char of word) {
      const btn = document.querySelector(`button[data-key="${char.toUpperCase()}"]`) ||
                  document.querySelector(`button[aria-label="${char.toUpperCase()}"]`);
      if (btn) {
        (btn as HTMLElement).click();
      } else {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: char, code: `Key${char.toUpperCase()}`, bubbles: true }));
      }
      await new Promise(r => setTimeout(r, delay));
    }
    await new Promise(r => setTimeout(r, delay));

    const enterBtn = document.querySelector('button[data-key="Enter"]') ||
                     document.querySelector('button[aria-label="Enter"]');
    if (enterBtn) {
      (enterBtn as HTMLElement).click();
    } else {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }));
    }
  }

  async waitForReveal(boardIndex: number, rowIndex: number): Promise<TileData[]> {
    await new Promise(r => setTimeout(r, 2000));
    return this.readBoard(boardIndex).rows[rowIndex] || [];
  }

  getKeyboardState(): KeyboardState {
    const kb: KeyboardState = {};
    const keys = Array.from(document.querySelectorAll('button[data-key], button[aria-label]'));
    for (const k of keys) {
      const txt = (k.getAttribute('data-key') || k.getAttribute('aria-label') || k.textContent || '').trim().toLowerCase();
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
    const boards = this.readAllBoards();
    return boards.every(b => b.gameStatus !== 'playing');
  }
}
