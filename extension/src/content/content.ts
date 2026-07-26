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

let dropdownOpen = false;

function updateBadgeModeIndicator(): void {
  const modeText = currentMode === 'auto' ? '⚡ AUTO' : '💡 ASSIST';
  updateBadge(modeText);
  // Also update badge styling for mode
  const badge = document.getElementById('wordle-solver-badge');
  if (badge) {
    badge.style.background = currentMode === 'auto' ? '#ffffff' : '#ffffff';
    badge.style.color = '#000000';
  }
}

function createStatusBadge(): HTMLElement {
  const existing = document.getElementById('wordle-solver-badge-wrapper');
  if (existing) existing.remove();

  const wrapper = document.createElement('div');
  wrapper.id = 'wordle-solver-badge-wrapper';
  wrapper.style.cssText = `
    position: fixed;
    top: 16px;
    right: 16px;
    z-index: 999999;
    display: flex;
    align-items: center;
    gap: 0px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  `;

  const badge = document.createElement('div');
  badge.id = 'wordle-solver-badge';
  const isSupported = activeAdapter !== null;
  badge.textContent = isSupported ? `${currentMode === 'auto' ? '⚡ AUTO' : '💡 ASSIST'}` : '⚠️ UNSUPPORTED';
  badge.style.cssText = `
    background: ${isSupported ? '#ffffff' : '#fef2f2'};
    color: ${isSupported ? '#000000' : '#b91c1c'};
    padding: 8px 14px;
    border-radius: 8px 0 0 8px;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0.08em;
    box-shadow: 0 2px 8px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.08);
    cursor: pointer;
    user-select: none;
    transition: all 0.15s ease;
    border: 1.5px solid ${isSupported ? '#e4e4e7' : '#fca5a5'};
    border-right: none;
  `;

  badge.addEventListener('mouseenter', () => {
    badge.style.background = isSupported ? '#f4f4f5' : '#fee2e2';
  });
  badge.addEventListener('mouseleave', () => {
    badge.style.background = isSupported ? '#ffffff' : '#fef2f2';
  });

  const menuBtn = document.createElement('button');
  menuBtn.id = 'wordle-solver-menu-btn';
  menuBtn.innerHTML = `
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  `;
  menuBtn.style.cssText = `
    background: ${isSupported ? '#000000' : '#b91c1c'};
    color: #ffffff;
    border: 1.5px solid ${isSupported ? '#000000' : '#b91c1c'};
    padding: 8px 10px;
    border-radius: 0 8px 8px 0;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.12);
    transition: all 0.15s ease;
  `;

  menuBtn.addEventListener('mouseenter', () => {
    menuBtn.style.background = isSupported ? '#27272a' : '#991b1b';
  });
  menuBtn.addEventListener('mouseleave', () => {
    menuBtn.style.background = isSupported ? '#000000' : '#b91c1c';
  });

  const dropdown = document.createElement('div');
  dropdown.id = 'wordle-solver-dropdown';
  dropdown.style.cssText = `
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    background: #ffffff;
    border: 1.5px solid #e4e4e7;
    border-radius: 10px;
    padding: 6px;
    display: none;
    flex-direction: column;
    gap: 2px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04);
    min-width: 200px;
  `;

  const modes: { id: 'auto' | 'assist'; label: string; icon: string; desc: string }[] = [
    { id: 'auto', label: 'Auto-Solve', icon: '⚡', desc: 'Types & solves automatically' },
    { id: 'assist', label: 'Assist Mode', icon: '💡', desc: 'Shows recommendations only' },
  ];

  function renderDropdownItems() {
    dropdown.innerHTML = '';
    modes.forEach((mode) => {
      const isActive = currentMode === mode.id;
      const item = document.createElement('div');
      item.style.cssText = `
        padding: 10px 12px;
        border-radius: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 10px;
        transition: background 0.15s ease;
        background: ${isActive ? '#f4f4f5' : 'transparent'};
      `;

      const iconSpan = document.createElement('span');
      iconSpan.textContent = mode.icon;
      iconSpan.style.cssText = 'font-size: 16px; flex-shrink: 0;';

      const textCol = document.createElement('div');
      textCol.style.cssText = 'display: flex; flex-direction: column; gap: 1px;';

      const label = document.createElement('span');
      label.textContent = mode.label;
      label.style.cssText = `font-size: 13px; font-weight: 700; color: #000000;`;

      const desc = document.createElement('span');
      desc.textContent = mode.desc;
      desc.style.cssText = 'font-size: 10px; color: #71717a; line-height: 1.3;';

      textCol.appendChild(label);
      textCol.appendChild(desc);

      if (isActive) {
        const check = document.createElement('span');
        check.textContent = '✓';
        check.style.cssText = 'font-size: 14px; font-weight: 800; color: #000000; margin-left: auto;';
        item.appendChild(iconSpan);
        item.appendChild(textCol);
        item.appendChild(check);
      } else {
        item.appendChild(iconSpan);
        item.appendChild(textCol);
      }

      item.addEventListener('mouseenter', () => {
        if (!isActive) item.style.background = '#fafafa';
      });
      item.addEventListener('mouseleave', () => {
        item.style.background = isActive ? '#f4f4f5' : 'transparent';
      });

      item.addEventListener('click', (e) => {
        e.stopPropagation();
        currentMode = mode.id;
        chrome.storage.local.set({ solverMode: currentMode });

        if (currentMode === 'auto') {
          stopAssistLoop();
        }

        updateBadgeModeIndicator();
        renderDropdownItems();
        toggleDropdown(false);
      });

      dropdown.appendChild(item);
    });
  }

  function toggleDropdown(show?: boolean) {
    dropdownOpen = show !== undefined ? show : !dropdownOpen;
    dropdown.style.display = dropdownOpen ? 'flex' : 'none';
    // Rotate arrow
    const svg = menuBtn.querySelector('svg');
    if (svg) {
      svg.style.transform = dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)';
      svg.style.transition = 'transform 0.2s ease';
    }
  }

  renderDropdownItems();

  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDropdown();
  });

  badge.addEventListener('click', () => {
    if (!activeAdapter) {
      updateBadge('⚠️ UNSUPPORTED');
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
      toggleDropdown(false);
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
