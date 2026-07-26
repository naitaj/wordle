import type { GameAdapter, GameInfo, BoardState, TileData, KeyboardState } from './types';

/**
 * Adapter for Official NYT Wordle and Wordle Unlimited.
 */
export class NytAdapter implements GameAdapter {
  readonly info: GameInfo = {
    id: 'nyt',
    name: 'NYT Wordle / Unlimited',
    boardCount: 1,
    isMultiBoard: false,
    isMultiRound: false,
    isSequential: false,
    supportsAutoPlay: true
  };

  detectGame(): boolean {
    const host = window.location.hostname;
    return host.includes('nytimes.com') || host.includes('wordleunlimited.org');
  }

  readBoard(boardIndex: number = 0): BoardState {
    const isUnlimited = window.location.hostname.includes('wordleunlimited.org');
    let tiles: Element[] = [];

    if (isUnlimited) {
      const gameApp = document.querySelector('game-app');
      if (gameApp && gameApp.shadowRoot) {
        const gameRows = Array.from(gameApp.shadowRoot.querySelectorAll('game-row'));
        for (const row of gameRows) {
          if (row.shadowRoot) {
            const rowTiles = Array.from(row.shadowRoot.querySelectorAll('game-tile'));
            tiles.push(...rowTiles);
          }
        }
      }
    } else {
      let stateTiles = Array.from(document.querySelectorAll('[data-state]'));
      stateTiles = stateTiles.filter(el => el.tagName !== 'BUTTON');
      if (stateTiles.length === 30) {
        tiles = stateTiles;
      } else {
        tiles = Array.from(document.querySelectorAll('[class*="Tile-module"]'));
      }
    }

    const rows: TileData[][] = [];
    for (let r = 0; r < 6; r++) {
      const row: TileData[] = [];
      for (let c = 0; c < 5; c++) {
        const tile = tiles[r * 5 + c];
        if (tile) {
          const letter = (tile.getAttribute('data-letter') || tile.textContent || '').trim().toLowerCase();
          const rawState = (tile.getAttribute('data-state') || tile.getAttribute('evaluation') || 'empty').toLowerCase();
          let state: TileData['state'] = 'empty';
          if (rawState.includes('correct')) state = 'correct';
          else if (rawState.includes('present')) state = 'present';
          else if (rawState.includes('absent')) state = 'absent';
          else if (rawState.includes('tbd')) state = 'tbd';
          row.push({ letter, state });
        } else {
          row.push({ letter: '', state: 'empty' });
        }
      }
      rows.push(row);
    }

    let currentRow = 6;
    for (let r = 0; r < 6; r++) {
      const rowStates = rows[r].map(t => t.state);
      const isEvaluated = rowStates.every(s => s === 'correct' || s === 'present' || s === 'absent');
      const isEmpty = rowStates.every(s => s === 'empty');
      const hasTbd = rowStates.some(s => s === 'tbd');
      if (isEmpty || hasTbd || !isEvaluated) {
        currentRow = r;
        break;
      }
    }

    let gameStatus: 'playing' | 'won' | 'lost' = 'playing';
    try {
      if (isUnlimited) {
        const stored = JSON.parse(localStorage.getItem('gameState') || '{}');
        if (stored.gameStatus === 'WIN') gameStatus = 'won';
        else if (stored.gameStatus === 'FAIL') gameStatus = 'lost';
      } else {
        const keys = Object.keys(localStorage);
        const stateKey = keys.find(k => k.includes('wordle') && k.includes('state'));
        if (stateKey) {
          const stored = JSON.parse(localStorage.getItem(stateKey) || '{}');
          if (stored.gameStatus === 'WIN') gameStatus = 'won';
          else if (stored.gameStatus === 'FAIL') gameStatus = 'lost';
        }
      }
    } catch {
      if (currentRow > 0) {
        const lastEvalRow = currentRow - 1;
        const allCorrect = rows[lastEvalRow]?.every(t => t.state === 'correct');
        if (allCorrect) gameStatus = 'won';
        else if (currentRow >= 6) gameStatus = 'lost';
      }
    }

    return { rows, currentRow, gameStatus };
  }

  readAllBoards(): BoardState[] {
    return [this.readBoard(0)];
  }

  async submitGuess(word: string, delay: number): Promise<void> {
    const isUnlimited = window.location.hostname.includes('wordleunlimited.org');
    
    for (const char of word) {
      this.dispatchKey(char, isUnlimited);
      await new Promise(r => setTimeout(r, delay));
    }
    await new Promise(r => setTimeout(r, delay));
    this.dispatchKey('Enter', isUnlimited);
  }

  private dispatchKey(key: string, isUnlimited: boolean): void {
    const keyUpper = key.toUpperCase();
    if (isUnlimited) {
      const gameApp = document.querySelector('game-app');
      if (gameApp && gameApp.shadowRoot) {
        const keyboard = gameApp.shadowRoot.querySelector('game-keyboard');
        if (keyboard && keyboard.shadowRoot) {
          const btn = keyboard.shadowRoot.querySelector(`button[data-key="${keyUpper === 'ENTER' ? '↵' : keyUpper}"]`) ||
                      keyboard.shadowRoot.querySelector(`button[data-key="${keyUpper}"]`);
          if (btn) {
            (btn as HTMLElement).click();
            return;
          }
        }
      }
    }

    const keyButton = document.querySelector(`button[data-key="${keyUpper}"]`) ||
                      document.querySelector(`button[data-key="${key}"]`);
    if (keyButton) {
      (keyButton as HTMLElement).click();
    } else {
      window.dispatchEvent(new KeyboardEvent('keydown', { key, code: `Key${keyUpper}`, bubbles: true }));
    }
  }

  async waitForReveal(boardIndex: number, rowIndex: number): Promise<TileData[]> {
    await new Promise(r => setTimeout(r, 1800));
    return this.readBoard(0).rows[rowIndex] || [];
  }

  getKeyboardState(): KeyboardState {
    const kb: KeyboardState = {};
    const keyButtons = Array.from(document.querySelectorAll('button[data-key]'));
    for (const btn of keyButtons) {
      const key = (btn.getAttribute('data-key') || '').toLowerCase();
      const state = (btn.getAttribute('data-state') || 'empty').toLowerCase();
      if (key && key.length === 1 && key >= 'a' && key <= 'z') {
        if (state.includes('correct')) kb[key] = 'correct';
        else if (state.includes('present')) kb[key] = 'present';
        else if (state.includes('absent')) kb[key] = 'absent';
        else kb[key] = 'empty';
      }
    }
    return kb;
  }

  isGameFinished(): boolean {
    const state = this.readBoard(0);
    return state.gameStatus === 'won' || state.gameStatus === 'lost';
  }
}
