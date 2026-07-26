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

function updateBadgeModeIndicator(): void {
  const modeText = currentMode === 'auto' ? '⚡ AUTO' : '💡 ASSIST';
  updateBadge(modeText);
}

function createStatusBadge(): HTMLElement {
  const existing = document.getElementById('wordle-solver-badge-wrapper');
  if (existing) existing.remove();

  const wrapper = document.createElement('div');
  wrapper.id = 'wordle-solver-badge-wrapper';
  wrapper.style.cssText = `
    position: fixed;
    top: 20px;
    left: 20px;
    z-index: 999999;
    display: flex;
    align-items: center;
    gap: 2px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  `;

  const badge = document.createElement('div');
  badge.id = 'wordle-solver-badge';
  const isSupported = activeAdapter !== null;
  badge.textContent = isSupported ? `${currentMode === 'auto' ? '⚡ AUTO' : '💡 ASSIST'}` : '⚠️ UNSUPPORTED SITE';
  badge.style.cssText = `
    background: ${isSupported ? '#000000' : '#b91c1c'};
    color: #ffffff;
    padding: 10px 16px;
    border-radius: 8px 0 0 8px;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.05em;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    cursor: pointer;
    user-select: none;
    transition: all 0.2s ease;
  `;

  const menuBtn = document.createElement('button');
  menuBtn.id = 'wordle-solver-menu-btn';
  menuBtn.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  `;
  menuBtn.style.cssText = `
    background: ${isSupported ? '#18181b' : '#991b1b'};
    color: #ffffff;
    border: none;
    padding: 10px 10px;
    border-radius: 0 8px 8px 0;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  `;

  const dropdown = document.createElement('div');
  dropdown.id = 'wordle-solver-dropdown';
  dropdown.style.cssText = `
    position: absolute;
    top: 100%;
    left: 0;
    margin-top: 8px;
    background: #ffffff;
    border: 2px solid #000000;
    border-radius: 8px;
    padding: 6px;
    display: none;
    flex-direction: column;
    gap: 4px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.2);
    min-width: 170px;
  `;

  const modes: { id: 'auto' | 'assist'; label: string; desc: string }[] = [
    { id: 'auto', label: '⚡ Auto-Solve', desc: 'Types & solves automatically' },
    { id: 'assist', label: '💡 Assist Mode', desc: 'Shows recommendations only' },
  ];

  modes.forEach((mode) => {
    const item = document.createElement('div');
    item.style.cssText = `
      padding: 8px 12px;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 2px;
      transition: background 0.15s ease;
      background: ${currentMode === mode.id ? '#f4f4f5' : 'transparent'};
    `;

    const label = document.createElement('span');
    label.textContent = mode.label;
    label.style.cssText = 'font-size: 12px; font-weight: 700; color: #000000;';

    const desc = document.createElement('span');
    desc.textContent = mode.desc;
    desc.style.cssText = 'font-size: 10px; color: #71717a;';

    item.appendChild(label);
    item.appendChild(desc);

    item.addEventListener('click', (e) => {
      e.stopPropagation();
      currentMode = mode.id;
      chrome.storage.local.set({ solverMode: currentMode });

      if (currentMode === 'auto') {
        stopAssistLoop();
      }

      updateBadgeModeIndicator();
      dropdown.classList.remove('show');
    });

    dropdown.appendChild(item);
  });

  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('show');
  });

  badge.addEventListener('click', () => {
    if (!activeAdapter) {
      updateBadge('⚠️ UNSUPPORTED VARIANT');
      return;
    }
    chrome.runtime.sendMessage({ type: 'GET_STATE' }, (response) => {
      if (chrome.runtime.lastError) return;
      if (response?.success && response.data) {
        const isRunning = response.data.isRunning;
        if (isRunning) {
          chrome.runtime.sendMessage({ type: 'STOP_SOLVER' });
        } else {
          chrome.runtime.sendMessage({ type: 'START_SOLVER', mode: currentMode });
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
