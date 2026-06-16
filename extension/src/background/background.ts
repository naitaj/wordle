/**
 * Chrome Extension Service Worker (Background Script).
 * 
 * Central message router and solver orchestrator.
 * - Routes messages between popup and content script
 * - Runs the solver orchestrator
 * - Handles Groq API calls (content scripts can't make cross-origin requests)
 * - Persists config in chrome.storage.local
 */

import { SolverOrchestrator, type BrowserBridge, type BoardReading, type TileResult } from '../solver/solverOrchestrator';
import type { SolverConfig, SolverState, PopupMessage, SolverUpdate } from '../solver/types';

// ─── State ───

let orchestrator: SolverOrchestrator | null = null;
let currentTabId: number | null = null;
let latestState: Partial<SolverState> & { isRunning: boolean; mode: 'auto' | 'assist' } = {
  isRunning: false,
  mode: 'auto',
  phase: 'idle',
  statusMessage: 'Ready',
};

// ─── Config Persistence ───

const DEFAULT_CONFIG: SolverConfig = {
  hardMode: false,
  llmFallbackEnabled: false,
  typingDelay: 120,
  groqApiKey: '',
};

async function loadConfig(): Promise<SolverConfig> {
  return new Promise(resolve => {
    chrome.storage.local.get(['solverConfig'], (result) => {
      resolve({ ...DEFAULT_CONFIG, ...(result.solverConfig || {}) });
    });
  });
}

async function saveConfig(config: SolverConfig): Promise<void> {
  return new Promise(resolve => {
    chrome.storage.local.set({ solverConfig: config }, resolve);
  });
}

// ─── Content Script Communication Bridge ───

function createBrowserBridge(tabId: number): BrowserBridge {
  function sendToContent<T>(message: object): Promise<T> {
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (response?.success) {
          resolve(response.data);
        } else {
          reject(new Error(response?.error || 'Unknown content script error'));
        }
      });
    });
  }

  return {
    async readBoard(): Promise<BoardReading> {
      return sendToContent<BoardReading>({ type: 'READ_BOARD' });
    },
    async typeWord(word: string, delay: number): Promise<void> {
      await sendToContent({ type: 'TYPE_WORD', word, delay });
    },
    async submitGuess(): Promise<void> {
      await sendToContent({ type: 'SUBMIT_GUESS' });
    },
    async waitForReveal(rowIndex: number): Promise<TileResult[]> {
      return sendToContent<TileResult[]>({ type: 'WAIT_REVEAL', row: rowIndex });
    },
    async updateBadge(text: string): Promise<void> {
      try {
        await sendToContent({ type: 'UPDATE_BADGE', text });
      } catch {
        // Badge update is non-critical
      }
    },
  };
}

// ─── State Update Handler ───

function onSolverUpdate(update: Partial<SolverState> & { isRunning: boolean; mode: 'auto' | 'assist' }): void {
  latestState = { ...latestState, ...update };
  
  // Broadcast to any open popup
  const message: SolverUpdate = {
    type: 'SOLVER_UPDATE',
    state: update,
    mode: update.mode,
    isRunning: update.isRunning,
  };
  
  chrome.runtime.sendMessage(message).catch(() => {
    // Popup may not be open — that's fine
  });
}

// ─── Find Active Wordle Tab ───

async function findWordleTab(): Promise<number | null> {
  // Try finding NYT Wordle tab first
  let tabs = await chrome.tabs.query({ url: 'https://www.nytimes.com/games/wordle/*' });
  if (tabs.length > 0 && tabs[0].id) {
    return tabs[0].id;
  }
  // Try finding wordle.name tab
  tabs = await chrome.tabs.query({ url: 'https://www.wordle.name/*' });
  if (tabs.length > 0 && tabs[0].id) {
    return tabs[0].id;
  }
  return null;
}

// ─── Verify Content Script is Loaded ───

async function pingContentScript(tabId: number): Promise<boolean> {
  return new Promise(resolve => {
    chrome.tabs.sendMessage(tabId, { type: 'PING' }, (response) => {
      if (chrome.runtime.lastError || !response?.success) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

// ─── Message Handler ───

chrome.runtime.onMessage.addListener((message: PopupMessage, sender, sendResponse) => {
  const handler = async () => {
    switch (message.type) {
      case 'START_SOLVER': {
        const tabId = await findWordleTab();
        if (!tabId) {
          sendResponse({ success: false, error: 'No NYT Wordle tab found. Open https://www.nytimes.com/games/wordle first.' });
          return;
        }

        // Verify content script is loaded
        const alive = await pingContentScript(tabId);
        if (!alive) {
          sendResponse({ success: false, error: 'Content script not responding. Refresh the Wordle page and try again.' });
          return;
        }

        currentTabId = tabId;
        const config = await loadConfig();
        
        orchestrator = new SolverOrchestrator(onSolverUpdate);
        orchestrator.updateConfig(config);

        const bridge = createBrowserBridge(tabId);

        if (message.mode === 'auto') {
          // Fire and forget — the orchestrator will emit updates
          orchestrator.startAutoSolve(bridge);
          sendResponse({ success: true });
        } else {
          // Assist mode — compute recommendations
          await orchestrator.computeAssist(bridge);
          sendResponse({ success: true });
        }
        break;
      }

      case 'STOP_SOLVER': {
        if (orchestrator) {
          orchestrator.stop();
        }
        sendResponse({ success: true });
        break;
      }

      case 'GET_STATE': {
        sendResponse({ success: true, data: latestState });
        break;
      }

      case 'UPDATE_CONFIG': {
        const current = await loadConfig();
        const updated = { ...current, ...message.config };
        await saveConfig(updated);
        
        // Also save API key separately for llmFallback.ts to read
        if (message.config.groqApiKey !== undefined) {
          await new Promise<void>(resolve => {
            chrome.storage.local.set({ groqApiKey: message.config.groqApiKey }, resolve);
          });
        }
        
        if (orchestrator) {
          orchestrator.updateConfig(updated);
        }
        sendResponse({ success: true });
        break;
      }

      case 'GET_CONFIG': {
        const config = await loadConfig();
        sendResponse({ success: true, data: config });
        break;
      }

      default:
        sendResponse({ success: false, error: `Unknown message type` });
    }
  };

  handler();
  return true; // Keep channel open for async
});

// ─── Extension Install Handler ───

chrome.runtime.onInstalled.addListener(async () => {
  console.log('[Wordle Solver] Extension installed.');
  const config = await loadConfig();
  await saveConfig(config); // Ensure defaults are persisted
});

console.log('[Wordle Solver] Service worker loaded.');
