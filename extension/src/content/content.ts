import { findAllTiles, getTileState, getTileLetter, TILE_STATES, type NytTileState } from './selectors';

interface TileResult {
  letter: string;
  state: 'correct' | 'present' | 'absent';
}

interface BoardState {
  rows: { letter: string; state: NytTileState }[][];
  currentRow: number;
  gameStatus: 'playing' | 'won' | 'lost';
}

// ─── Configuration ───
const DEFAULT_TYPING_DELAY = 120; // ms between keystrokes
let typingDelay = DEFAULT_TYPING_DELAY;

// ─── DOM Reading ───

function readBoardState(): BoardState {
  const tiles = findAllTiles();
  const rows: { letter: string; state: NytTileState }[][] = [];
  
  for (let r = 0; r < 6; r++) {
    const row: { letter: string; state: NytTileState }[] = [];
    for (let c = 0; c < 5; c++) {
      const tile = tiles[r * 5 + c];
      if (tile) {
        row.push({
          letter: getTileLetter(tile),
          state: getTileState(tile),
        });
      } else {
        row.push({ letter: '', state: TILE_STATES.empty });
      }
    }
    rows.push(row);
  }
  
  // Determine current row: first row that has any empty/tbd tile
  let currentRow = 6; // default: all rows filled
  for (let r = 0; r < 6; r++) {
    const rowStates = rows[r].map(t => t.state);
    const isEvaluated = rowStates.every(s => s === 'correct' || s === 'present' || s === 'absent');
    const isEmpty = rowStates.every(s => s === 'empty');
    const hasTbd = rowStates.some(s => s === 'tbd');
    
    if (isEmpty || hasTbd) {
      currentRow = r;
      break;
    }
    if (!isEvaluated) {
      currentRow = r;
      break;
    }
  }
  
  // Determine game status
  let gameStatus: 'playing' | 'won' | 'lost' = 'playing';
  
  // Check localStorage for reliable game state
  try {
    if (window.location.hostname.includes('wordle.name')) {
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
    // Fallback: check DOM
    if (currentRow > 0) {
      const lastEvalRow = currentRow - 1;
      const allCorrect = rows[lastEvalRow]?.every(t => t.state === 'correct');
      if (allCorrect) gameStatus = 'won';
      else if (currentRow >= 6) gameStatus = 'lost';
    }
  }
  
  return { rows, currentRow, gameStatus };
}

// ─── DOM Interaction ───

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function simulateKeyPress(key: string): void {
  // Dispatch on both window and document for maximum compatibility
  const eventInit: KeyboardEventInit = {
    key: key,
    code: key === 'Enter' ? 'Enter' : key === 'Backspace' ? 'Backspace' : `Key${key.toUpperCase()}`,
    keyCode: key === 'Enter' ? 13 : key === 'Backspace' ? 8 : key.toUpperCase().charCodeAt(0),
    which: key === 'Enter' ? 13 : key === 'Backspace' ? 8 : key.toUpperCase().charCodeAt(0),
    bubbles: true,
    cancelable: true,
  };
  
  window.dispatchEvent(new KeyboardEvent('keydown', eventInit));
}

async function typeWord(word: string, delay: number): Promise<void> {
  for (const letter of word.toLowerCase()) {
    simulateKeyPress(letter);
    await sleep(delay);
  }
}

async function submitGuess(): Promise<void> {
  simulateKeyPress('Enter');
}

function isRowInvalid(rowIndex: number): boolean {
  // 1. Support for wordle.name: game-row custom element gets 'invalid' attribute
  const rows = document.querySelectorAll('game-row');
  if (rows[rowIndex]?.hasAttribute('invalid')) {
    return true;
  }
  
  // 2. Support for NYT Wordle: row element gets class containing 'invalid' or 'shake'
  const nytRows = document.querySelectorAll('[role="group"][aria-label*="Row"]');
  if (nytRows[rowIndex]) {
    const className = nytRows[rowIndex].className.toLowerCase();
    if (className.includes('invalid') || className.includes('shake')) {
      return true;
    }
  }

  // 3. Fallback: check for visible toasts containing "not in" or "word list"
  const toasts = Array.from(document.querySelectorAll('game-toast, [class*="toast"]'));
  for (const toast of toasts) {
    const text = toast.textContent?.toLowerCase() || '';
    if (text.includes('not in word list') || text.includes('not in') || text.includes('invalid')) {
      return true;
    }
  }

  return false;
}

async function clearInvalidGuess(): Promise<void> {
  for (let i = 0; i < 5; i++) {
    simulateKeyPress('Backspace');
    await sleep(60);
  }
}

function waitForReveal(rowIndex: number): Promise<TileResult[]> {
  return new Promise((resolve, reject) => {
    // Check for "Not in word list" rejections periodically
    const checkInterval = setInterval(() => {
      if (isRowInvalid(rowIndex)) {
        clearInterval(checkInterval);
        clearTimeout(timeout);
        observer.disconnect();
        
        // Clear the rejected guess so we can try the next one
        clearInvalidGuess().then(() => {
          reject(new Error('NOT_IN_WORD_LIST'));
        });
      }
    }, 150);

    const timeout = setTimeout(() => {
      clearInterval(checkInterval);
      observer.disconnect();
      // Try reading anyway
      const results = readRowResults(rowIndex);
      if (results) resolve(results);
      else reject(new Error('Tile reveal timeout'));
    }, 5000); // 5s timeout
    
    const tiles = findAllTiles();
    const rowTiles = tiles.slice(rowIndex * 5, rowIndex * 5 + 5);
    
    // If already revealed, resolve immediately
    const existing = readRowResults(rowIndex);
    if (existing) {
      clearInterval(checkInterval);
      clearTimeout(timeout);
      resolve(existing);
      return;
    }
    
    const observer = new MutationObserver(() => {
      const results = readRowResults(rowIndex);
      if (results) {
        clearInterval(checkInterval);
        clearTimeout(timeout);
        observer.disconnect();
        resolve(results);
      }
    });
    
    // Observe each tile in the row for state changes (NYT: data-state, wordle.name: evaluation/reveal)
    const attributeFilter = ['data-state', 'evaluation', 'reveal'];
    for (const tile of rowTiles) {
      observer.observe(tile, { attributes: true, attributeFilter });
    }
    
    // Also observe parent elements in case tiles are replaced
    if (rowTiles[0]?.parentElement) {
      observer.observe(rowTiles[0].parentElement, { childList: true, subtree: true, attributes: true, attributeFilter });
    }
  });
}

function readRowResults(rowIndex: number): TileResult[] | null {
  const tiles = findAllTiles();
  const rowTiles = tiles.slice(rowIndex * 5, rowIndex * 5 + 5);
  
  const results: TileResult[] = [];
  for (const tile of rowTiles) {
    const state = getTileState(tile);
    const letter = getTileLetter(tile);
    
    if (state === 'correct' || state === 'present' || state === 'absent') {
      results.push({ letter, state });
    } else {
      return null; // Not fully revealed yet
    }
  }
  
  return results.length === 5 ? results : null;
}

let currentMode: 'auto' | 'assist' = 'auto';
let assistLoopActive = false;

async function startAssistLoop(startRow: number): Promise<void> {
  if (assistLoopActive) return;
  assistLoopActive = true;
  
  let r = startRow;
  while (currentMode === 'assist' && r < 6) {
    try {
      // Wait for the user to type and enter a word, and for it to be revealed
      await waitForReveal(r);
      
      // Word is revealed! Wait 300ms for animations to settle
      await sleep(300);
      
      if (currentMode !== 'assist') break;
      
      // Automatically request the next recommendation
      updateBadge('🧠 Thinking...');
      
      const response = await new Promise<any>((resolve) => {
        chrome.runtime.sendMessage({ type: 'START_SOLVER', mode: 'assist' }, (res) => {
          if (chrome.runtime.lastError) {
            resolve({ success: false, error: chrome.runtime.lastError.message });
          } else {
            resolve(res);
          }
        });
      });
      
      if (response?.success) {
        const stateResponse = await new Promise<any>((resolve) => {
          chrome.runtime.sendMessage({ type: 'GET_STATE' }, (res) => {
            if (chrome.runtime.lastError) {
              resolve({ success: false });
            } else {
              resolve(res);
            }
          });
        });
        
        if (stateResponse?.success && stateResponse.data) {
          const state = stateResponse.data;
          if (state.currentGuess) {
            updateBadge(`💡 Rec: ${state.currentGuess}`);
          } else {
            updateBadge('💡 No Rec');
          }
          r = state.currentRow;
        } else {
          break;
        }
      } else {
        break;
      }
    } catch (err: any) {
      if (err.message === 'NOT_IN_WORD_LIST') {
        continue;
      }
      await sleep(1000);
    }
  }
  
  assistLoopActive = false;
}

function updateBadgeModeIndicator(): void {
  const badge = document.getElementById('wordle-solver-badge');
  if (badge) {
    const txt = badge.textContent || '';
    if (txt === '🧠 Solver Ready' || txt === '🤝 Assist Ready' || txt.startsWith('💡 Rec:') || txt === '💡 No Rec' || txt === '🧠 Thinking...') {
      badge.textContent = currentMode === 'auto' ? '🧠 Solver Ready' : '🤝 Assist Ready';
    }
  }
  
  const autoItem = document.getElementById('wordle-solver-item-auto');
  const assistItem = document.getElementById('wordle-solver-item-assist');
  if (autoItem && assistItem) {
    if (currentMode === 'auto') {
      autoItem.classList.add('active');
      assistItem.classList.remove('active');
    } else {
      autoItem.classList.remove('active');
      assistItem.classList.add('active');
    }
  }
}

function createStatusBadge(): HTMLDivElement {
  const wrapper = document.createElement('div');
  wrapper.id = 'wordle-solver-wrapper';

  const badge = document.createElement('div');
  badge.id = 'wordle-solver-badge';
  badge.textContent = currentMode === 'auto' ? '🧠 Solver Ready' : '🤝 Assist Ready';

  const menuBtn = document.createElement('button');
  menuBtn.id = 'wordle-solver-menu-btn';
  menuBtn.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
      <circle cx="12" cy="5" r="1.5" fill="currentColor"/>
      <circle cx="12" cy="19" r="1.5" fill="currentColor"/>
    </svg>
  `;

  const dropdown = document.createElement('div');
  dropdown.id = 'wordle-solver-dropdown';
  
  const autoItem = document.createElement('div');
  autoItem.id = 'wordle-solver-item-auto';
  autoItem.className = `wordle-solver-dropdown-item${currentMode === 'auto' ? ' active' : ''}`;
  autoItem.innerHTML = `
    <span class="icon">🤖</span>
    <span class="label">Auto Solver</span>
    <span class="check">✓</span>
  `;
  autoItem.addEventListener('click', (e) => {
    e.stopPropagation();
    currentMode = 'auto';
    chrome.storage.local.set({ solverMode: 'auto' });
    updateBadgeModeIndicator();
    dropdown.classList.remove('show');
  });

  const assistItem = document.createElement('div');
  assistItem.id = 'wordle-solver-item-assist';
  assistItem.className = `wordle-solver-dropdown-item${currentMode === 'assist' ? ' active' : ''}`;
  assistItem.innerHTML = `
    <span class="icon">🤝</span>
    <span class="label">Assist Mode</span>
    <span class="check">✓</span>
  `;
  assistItem.addEventListener('click', (e) => {
    e.stopPropagation();
    currentMode = 'assist';
    chrome.storage.local.set({ solverMode: 'assist' });
    updateBadgeModeIndicator();
    dropdown.classList.remove('show');
  });

  dropdown.appendChild(autoItem);
  dropdown.appendChild(assistItem);

  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('show');
  });

  badge.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'GET_STATE' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Failed to get state:', chrome.runtime.lastError);
        return;
      }
      if (response?.success && response.data) {
        const isRunning = response.data.isRunning;
        if (isRunning) {
          chrome.runtime.sendMessage({ type: 'STOP_SOLVER' });
        } else {
          if (currentMode === 'assist') {
            updateBadge('🧠 Thinking...');
          }
          chrome.runtime.sendMessage({ type: 'START_SOLVER', mode: currentMode }, (startResponse) => {
            if (chrome.runtime.lastError) {
              console.error('Failed to start solver from badge:', chrome.runtime.lastError);
              updateBadgeModeIndicator();
              return;
            }
            if (!startResponse?.success) {
              console.error('Failed to start solver from badge:', startResponse?.error);
              updateBadgeModeIndicator();
            } else if (currentMode === 'assist') {
              chrome.runtime.sendMessage({ type: 'GET_STATE' }, (stateResponse) => {
                if (stateResponse?.success && stateResponse.data) {
                  const state = stateResponse.data;
                  if (state.currentGuess) {
                    updateBadge(`💡 Rec: ${state.currentGuess}`);
                    startAssistLoop(state.currentRow);
                  } else {
                    updateBadge('💡 No Rec');
                  }
                }
              });
            }
          });
        }
      }
    });
  });

  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target as Node)) {
      dropdown.classList.remove('show');
    }
  });

  wrapper.appendChild(badge);
  wrapper.appendChild(menuBtn);
  wrapper.appendChild(dropdown);

  document.body.appendChild(wrapper);
  return badge;
}

function updateBadge(text: string): void {
  let badge = document.getElementById('wordle-solver-badge');
  if (!badge) badge = createStatusBadge();
  badge.textContent = text;
}

// ─── Message Handler ───

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const handler = async () => {
    switch (message.type) {
      case 'START_ASSIST_LOOP': {
        startAssistLoop(message.currentRow);
        sendResponse({ success: true });
        break;
      }
      
      case 'READ_BOARD': {
        const board = readBoardState();
        sendResponse({ success: true, data: board });
        break;
      }
      
      case 'TYPE_WORD': {
        const delay = message.delay ?? typingDelay;
        await typeWord(message.word, delay);
        sendResponse({ success: true });
        break;
      }
      
      case 'SUBMIT_GUESS': {
        await submitGuess();
        sendResponse({ success: true });
        break;
      }
      
      case 'WAIT_REVEAL': {
        try {
          const results = await waitForReveal(message.row);
          sendResponse({ success: true, data: results });
        } catch (err) {
          sendResponse({ success: false, error: String(err) });
        }
        break;
      }
      
      case 'SET_TYPING_DELAY': {
        typingDelay = message.delay ?? DEFAULT_TYPING_DELAY;
        sendResponse({ success: true });
        break;
      }
      
      case 'UPDATE_BADGE': {
        updateBadge(message.text);
        sendResponse({ success: true });
        break;
      }
      
      case 'PING': {
        sendResponse({ success: true, data: 'pong' });
        break;
      }
      
      default:
        sendResponse({ success: false, error: `Unknown message type: ${message.type}` });
    }
  };
  
  handler();
  return true; // Keep channel open for async response
});

// ─── Initialization ───
console.log('[Wordle Solver] Content script loaded on', window.location.href);
createStatusBadge();

// Initialize mode from storage
chrome.storage.local.get(['solverMode'], (result) => {
  if (chrome.runtime.lastError) return;
  if (result.solverMode === 'auto' || result.solverMode === 'assist') {
    currentMode = result.solverMode;
    updateBadgeModeIndicator();
  }
});
