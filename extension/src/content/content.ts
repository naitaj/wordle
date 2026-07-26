import { detectActiveAdapter } from '../adapters/adapterRegistry';
import type { GameAdapter } from '../adapters/types';

// ─── Configuration ───
const DEFAULT_TYPING_DELAY = 120; // ms between keystrokes
let typingDelay = DEFAULT_TYPING_DELAY;
let currentMode: 'auto' | 'assist' = 'auto';

// Active Adapter Detection
const activeAdapter: GameAdapter | null = detectActiveAdapter();

// ─── DOM Interaction Helpers ───

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let assistLoopTimeout: number | null = null;

function stopAssistLoop(): void {
  if (assistLoopTimeout !== null) {
    window.clearTimeout(assistLoopTimeout);
    assistLoopTimeout = null;
  }
}

function startAssistLoop(initialRow: number): void {
  stopAssistLoop();
  let lastCheckedRow = initialRow;

  const poll = () => {
    if (!activeAdapter) return;
    const boardState = activeAdapter.readBoard(0);
    const currentRow = boardState.currentRow;

    if (boardState.gameStatus === 'won') {
      updateBadge('🏆 SOLVED!');
      stopAssistLoop();
      return;
    }
    if (boardState.gameStatus === 'lost') {
      updateBadge('❌ GAME OVER');
      stopAssistLoop();
      return;
    }

    if (currentRow > lastCheckedRow) {
      lastCheckedRow = currentRow;
      updateBadge('🧠 Thinking...');

      chrome.runtime.sendMessage({ type: 'GET_STATE' }, (response) => {
        if (chrome.runtime.lastError) return;
        if (response?.success && response.data) {
          const state = response.data;
          if (state.currentGuess) {
            updateBadge(`💡 Rec: ${state.currentGuess}`);
          } else {
            updateBadge('💡 Thinking...');
          }
        }
      });
    }

    assistLoopTimeout = window.setTimeout(poll, 500);
  };

  poll();
}

// ─── Floating Status Badge Widget ───

let shadowRootRef: ShadowRoot | null = null;

function getShadowElement(id: string): HTMLElement | null {
  return shadowRootRef ? (shadowRootRef.getElementById(id) as HTMLElement) : null;
}

function updateBadgeModeIndicator(): void {
  const badge = getShadowElement('wordle-solver-badge');
  if (badge) {
    const txt = badge.textContent || '';
    if (txt === '🧠 Solver Ready' || txt === '🤝 Assist Ready' || txt.startsWith('💡 Rec:') || txt === '💡 No Rec' || txt === '🧠 Thinking...') {
      badge.textContent = currentMode === 'auto' ? '🧠 Solver Ready' : '🤝 Assist Ready';
    }
  }
  
  const autoItem = getShadowElement('wordle-solver-item-auto');
  const assistItem = getShadowElement('wordle-solver-item-assist');
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

function createStatusBadge(): HTMLElement {
  const existing = document.getElementById('wordle-solver-host');
  if (existing) existing.remove();

  const host = document.createElement('div');
  host.id = 'wordle-solver-host';
  document.body.appendChild(host);

  const shadowRoot = host.attachShadow({ mode: 'open' });
  shadowRootRef = shadowRoot;

  const styleEl = document.createElement('style');
  styleEl.textContent = `
#wordle-solver-wrapper {
  position: fixed;
  top: 16px;
  right: 0px !important;
  z-index: 99999;
  display: flex;
  align-items: center;
  background: #ffffff;
  border: 1px solid #000000;
  border-radius: 4px;
  height: 32px;
  font-family: 'Bebas Neue', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

#wordle-solver-wrapper:hover {
  background: #f4f4f5;
}

#wordle-solver-badge {
  color: #000000;
  padding: 0 10px 0 12px;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.05em;
  display: flex;
  align-items: center;
  justify-content: center;
  text-transform: uppercase;
  cursor: pointer;
  user-select: none;
  height: 100%;
}

#wordle-solver-menu-btn {
  background: transparent;
  color: #000000;
  border: none;
  border-left: 1px solid rgba(0, 0, 0, 0.2);
  width: 28px;
  height: 100%;
  border-radius: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  outline: none;
  transition: all 0.2s ease;
}

#wordle-solver-menu-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}

#wordle-solver-menu-btn:active {
  background: rgba(0, 0, 0, 0.1);
}

#wordle-solver-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 6px;
  min-width: 150px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(12px);
  display: flex;
  flex-direction: column;
  gap: 2px;
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
  pointer-events: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

#wordle-solver-dropdown.show {
  opacity: 1;
  transform: translateY(0) scale(1);
  pointer-events: auto;
}

.wordle-solver-dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  color: #e2e8f0;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}

.wordle-solver-dropdown-item:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
}

.wordle-solver-dropdown-item .check {
  margin-left: auto;
  color: #10b981;
  font-weight: bold;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.wordle-solver-dropdown-item.active .check {
  opacity: 1;
}
  `;
  shadowRoot.appendChild(styleEl);

  const wrapper = document.createElement('div');
  wrapper.id = 'wordle-solver-wrapper';

  const badge = document.createElement('div');
  badge.id = 'wordle-solver-badge';
  badge.textContent = currentMode === 'auto' ? '🧠 Solver Ready' : '🤝 Assist Ready';

  const menuBtn = document.createElement('button');
  menuBtn.id = 'wordle-solver-menu-btn';
  menuBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
    if (!activeAdapter) {
      updateBadge('⚠️ Unsupported Site');
      return;
    }
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
    if (!e.composedPath().includes(wrapper)) {
      dropdown.classList.remove('show');
    }
  });

  wrapper.appendChild(badge);
  wrapper.appendChild(menuBtn);
  wrapper.appendChild(dropdown);

  shadowRoot.appendChild(wrapper);
  return badge;
}

function updateBadge(text: string): void {
  let badge = getShadowElement('wordle-solver-badge');
  if (!badge) {
    createStatusBadge();
    badge = getShadowElement('wordle-solver-badge');
  }
  if (badge) badge.textContent = text;
}


// ─── Message Listener ───

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const handler = async () => {
    if (!activeAdapter) {
      if (message.type === 'PING') {
        sendResponse({ success: true, isSupported: false, error: 'Unsupported Website' });
      } else {
        sendResponse({ success: false, error: 'Unsupported Website: This Wordle variant is not supported yet.' });
      }
      return;
    }

    switch (message.type) {
      case 'GET_GAME_INFO': {
        sendResponse({ success: true, gameInfo: activeAdapter.info });
        break;
      }

      case 'READ_BOARD': {
        const boardIdx = message.boardIndex || 0;
        const boardState = activeAdapter.readBoard(boardIdx);
        sendResponse({ success: true, data: boardState, gameInfo: activeAdapter.info });
        break;
      }

      case 'READ_ALL_BOARDS': {
        const boards = activeAdapter.readAllBoards();
        sendResponse({ success: true, data: boards, gameInfo: activeAdapter.info });
        break;
      }

      case 'TYPE_WORD':
      case 'SUBMIT_GUESS': {
        const delay = message.delay ?? typingDelay;
        await activeAdapter.submitGuess(message.word || '', delay);
        sendResponse({ success: true });
        break;
      }

      case 'WAIT_REVEAL': {
        try {
          const boardIdx = message.boardIndex || 0;
          const results = await activeAdapter.waitForReveal(boardIdx, message.row);
          sendResponse({ success: true, data: results });
        } catch (err) {
          sendResponse({ success: false, error: String(err) });
        }
        break;
      }

      case 'RESET_GAME': {
        if (activeAdapter.reset) {
          await activeAdapter.reset();
        }
        sendResponse({ success: true });
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
        sendResponse({ success: true, data: 'pong', isSupported: true, gameInfo: activeAdapter.info });
        break;
      }

      default:
        sendResponse({ success: false, error: `Unknown message type: ${message.type}` });
    }
  };

  handler();
  return true;
});

// ─── Initialization ───
const isWebsite = window.location.hostname.includes('localhost') || 
                  window.location.hostname.includes('vercel.app') ||
                  window.location.pathname.endsWith('/check');

if (isWebsite) {
  document.documentElement.dataset.wordleEntropySolverInstalled = 'true';
  window.dispatchEvent(new CustomEvent('WORDLE_SOLVER_INSTALLED'));
} else {
  createStatusBadge();
  chrome.storage.local.get(['solverMode'], (result) => {
    if (chrome.runtime.lastError) return;
    if (result.solverMode === 'auto' || result.solverMode === 'assist') {
      currentMode = result.solverMode;
      updateBadgeModeIndicator();
    }
  });
}
