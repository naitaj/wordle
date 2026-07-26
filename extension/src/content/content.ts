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
let badgeElement: HTMLElement | null = null;
let wrapperElement: HTMLElement | null = null;

function updateBadgeModeIndicator(): void {
  const modeText = currentMode === 'auto' ? '⚡ AUTO' : '💡 ASSIST';
  updateBadge(modeText);
}

function ensureBadgeCreated(): void {
  if (wrapperElement && document.body.contains(wrapperElement)) return;
  createStatusBadge();
}

function createStatusBadge(): HTMLElement {
  const existing = document.getElementById('wordle-solver-badge-wrapper');
  if (existing) existing.remove();

  const FONT = '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
  const isSupported = activeAdapter !== null;

  const wrapper = document.createElement('div');
  wrapper.id = 'wordle-solver-badge-wrapper';
  wrapper.style.cssText = `
    position: fixed;
    top: 16px;
    right: 16px;
    z-index: 999999;
    display: flex;
    align-items: stretch;
    gap: 0px;
    font-family: ${FONT};
  `;
  wrapperElement = wrapper;

  // ── Badge (left part) ──
  const badge = document.createElement('div');
  badge.id = 'wordle-solver-badge';
  badge.textContent = isSupported ? (currentMode === 'auto' ? '⚡ AUTO' : '💡 ASSIST') : '⚠️ UNSUPPORTED';
  badge.style.cssText = `
    background: ${isSupported ? '#ffffff' : '#fef2f2'};
    color: ${isSupported ? '#000000' : '#b91c1c'};
    padding: 9px 16px;
    border-radius: 8px 0 0 8px;
    font-size: 13px;
    font-weight: 700;
    font-family: ${FONT};
    letter-spacing: 0.04em;
    box-shadow: 0 2px 12px rgba(0,0,0,0.10);
    cursor: pointer;
    user-select: none;
    transition: background 0.15s ease;
    border: 1.5px solid ${isSupported ? '#d4d4d8' : '#fca5a5'};
    border-right: none;
    line-height: 1;
    white-space: nowrap;
  `;
  badgeElement = badge;

  badge.addEventListener('mouseenter', () => { badge.style.background = isSupported ? '#f4f4f5' : '#fee2e2'; });
  badge.addEventListener('mouseleave', () => { badge.style.background = isSupported ? '#ffffff' : '#fef2f2'; });

  badge.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!activeAdapter) return;
    chrome.runtime.sendMessage({ type: 'GET_STATE' }, (response) => {
      if (chrome.runtime.lastError) return;
      if (response?.success && response.data) {
        if (response.data.isRunning) {
          chrome.runtime.sendMessage({ type: 'STOP_SOLVER' });
        } else {
          chrome.runtime.sendMessage({ type: 'START_SOLVER', mode: currentMode });
        }
      }
    });
  });

  // ── Menu button (right arrow) ──
  const menuBtn = document.createElement('button');
  menuBtn.id = 'wordle-solver-menu-btn';
  menuBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="transition:transform 0.2s ease"><polyline points="6 9 12 15 18 9"></polyline></svg>';
  menuBtn.style.cssText = `
    background: ${isSupported ? '#18181b' : '#b91c1c'};
    color: #ffffff;
    border: 1.5px solid ${isSupported ? '#18181b' : '#b91c1c'};
    padding: 9px 10px;
    border-radius: 0 8px 8px 0;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 12px rgba(0,0,0,0.10);
    transition: background 0.15s ease;
    line-height: 1;
  `;

  menuBtn.addEventListener('mouseenter', () => { menuBtn.style.background = isSupported ? '#27272a' : '#991b1b'; });
  menuBtn.addEventListener('mouseleave', () => { menuBtn.style.background = isSupported ? '#18181b' : '#b91c1c'; });

  // ── Dropdown ──
  const dropdown = document.createElement('div');
  dropdown.id = 'wordle-solver-dropdown';
  dropdown.style.cssText = `
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    background: #ffffff;
    border: 1.5px solid #d4d4d8;
    border-radius: 10px;
    padding: 6px;
    display: none;
    flex-direction: column;
    gap: 2px;
    box-shadow: 0 12px 32px rgba(0,0,0,0.14);
    min-width: 210px;
    font-family: ${FONT};
  `;

  function renderItems() {
    dropdown.innerHTML = '';
    [
      { id: 'auto' as const, label: 'Auto-Solve', icon: '⚡', desc: 'Types & solves automatically' },
      { id: 'assist' as const, label: 'Assist Mode', icon: '💡', desc: 'Shows recommendations only' },
    ].forEach((mode) => {
      const active = currentMode === mode.id;
      const item = document.createElement('div');
      item.style.cssText = `padding:10px 12px;border-radius:8px;cursor:pointer;display:flex;align-items:center;gap:10px;transition:background 0.12s ease;background:${active ? '#f4f4f5' : 'transparent'};font-family:${FONT};`;
      item.innerHTML = `
        <span style="font-size:16px;flex-shrink:0">${mode.icon}</span>
        <div style="display:flex;flex-direction:column;gap:1px;flex:1">
          <span style="font-size:13px;font-weight:700;color:#000;font-family:${FONT}">${mode.label}</span>
          <span style="font-size:10px;color:#71717a;line-height:1.3;font-family:${FONT}">${mode.desc}</span>
        </div>
        ${active ? '<span style="font-size:14px;font-weight:800;color:#18181b">✓</span>' : ''}
      `;
      item.addEventListener('mouseenter', () => { item.style.background = active ? '#f4f4f5' : '#fafafa'; });
      item.addEventListener('mouseleave', () => { item.style.background = active ? '#f4f4f5' : 'transparent'; });
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        currentMode = mode.id;
        chrome.storage.local.set({ solverMode: currentMode });
        if (currentMode === 'auto') stopAssistLoop();
        updateBadgeModeIndicator();
        renderItems();
        openDropdown(false);
      });
      dropdown.appendChild(item);
    });
  }

  function openDropdown(open: boolean) {
    dropdownOpen = open;
    dropdown.style.display = dropdownOpen ? 'flex' : 'none';
    const svg = menuBtn.querySelector('svg');
    if (svg) svg.style.transform = dropdownOpen ? 'rotate(180deg)' : 'rotate(0)';
  }

  renderItems();

  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    openDropdown(!dropdownOpen);
  });

  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target as Node)) openDropdown(false);
  });

  wrapper.appendChild(badge);
  wrapper.appendChild(menuBtn);
  wrapper.appendChild(dropdown);
  document.body.appendChild(wrapper);
  return badge;
}

function updateBadge(text: string): void {
  ensureBadgeCreated();
  if (badgeElement) badgeElement.textContent = text;
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
