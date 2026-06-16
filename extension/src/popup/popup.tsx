import React, { useEffect, useState } from 'react';
import type { SolverState, SolverConfig, ScoredWord } from '../solver/types';

export function Popup() {
  const [config, setConfig] = useState<SolverConfig>({
    hardMode: false,
    llmFallbackEnabled: false,
    typingDelay: 120,
    groqApiKey: '',
  });

  const [activeTab, setActiveTab] = useState<'play' | 'settings'>('play');
  const [mode, setMode] = useState<'auto' | 'assist'>('auto');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [solverState, setSolverState] = useState<Partial<SolverState>>({
    phase: 'idle',
    statusMessage: 'Ready to Solve',
    topCandidates: [],
    remainingWords: [],
    currentGuess: '',
    expectedRemaining: 0,
    winProbability: 0,
    currentRow: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState<boolean>(false);

  // Load configuration and active state on mount
  useEffect(() => {
    // 1. Get initial configuration
    chrome.runtime.sendMessage({ type: 'GET_CONFIG' }, (response) => {
      if (response?.success) {
        setConfig(response.data);
      }
    });

    // 2. Get initial state
    chrome.runtime.sendMessage({ type: 'GET_STATE' }, (response) => {
      if (response?.success && response.data) {
        const data = response.data;
        setIsRunning(data.isRunning || false);
        setMode(data.mode || 'auto');
        setSolverState(data);
      }
    });

    // 3. Listen for dynamic state updates from service worker
    const listener = (message: any) => {
      if (message.type === 'SOLVER_UPDATE') {
        setIsRunning(message.isRunning);
        if (message.mode) setMode(message.mode);
        setSolverState((prev) => ({ ...prev, ...message.state }));
        setError(null); // Clear errors on update
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => {
      chrome.runtime.onMessage.removeListener(listener);
    };
  }, []);

  const handleStart = () => {
    setError(null);
    chrome.runtime.sendMessage(
      { type: 'START_SOLVER', mode: mode },
      (response) => {
        if (chrome.runtime.lastError) {
          setError(chrome.runtime.lastError.message);
          return;
        }
        if (!response?.success) {
          setError(response?.error || 'Failed to start solver');
        } else {
          setIsRunning(true);
        }
      }
    );
  };

  const handleStop = () => {
    chrome.runtime.sendMessage({ type: 'STOP_SOLVER' }, (response) => {
      if (response?.success) {
        setIsRunning(false);
        setSolverState((prev) => ({
          ...prev,
          phase: 'idle',
          statusMessage: 'Solver Stopped',
        }));
      }
    });
  };

  const updateSetting = (key: keyof SolverConfig, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    chrome.runtime.sendMessage({ type: 'UPDATE_CONFIG', config: { [key]: value } });
    
    // If we're updating typing delay, tell the content script too
    if (key === 'typingDelay') {
      chrome.tabs.query({ url: 'https://www.nytimes.com/games/wordle/*' }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { type: 'SET_TYPING_DELAY', delay: value });
        }
      });
      chrome.tabs.query({ url: 'https://www.wordle.name/*' }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { type: 'SET_TYPING_DELAY', delay: value });
        }
      });
    }
  };

  const getPhaseStyles = (phase: string) => {
    switch (phase) {
      case 'idle':
        return { bg: 'bg-slate-700/50', border: 'border-slate-600/30', text: 'text-slate-400', label: 'Idle' };
      case 'thinking':
        return { bg: 'bg-indigo-950/50 border-indigo-500/30', border: 'border-indigo-500/40 animate-pulse', text: 'text-indigo-400', label: 'Thinking' };
      case 'typing':
        return { bg: 'bg-amber-950/50 border-amber-500/30', border: 'border-amber-500/40 animate-bounce', text: 'text-amber-400', label: 'Typing' };
      case 'evaluating':
        return { bg: 'bg-cyan-950/50 border-cyan-500/30', border: 'border-cyan-500/40 animate-pulse', text: 'text-cyan-400', label: 'Revealing' };
      case 'won':
        return { bg: 'bg-emerald-950/50 border-emerald-500/30', border: 'border-emerald-500/50 animate-pulse-glow', text: 'text-emerald-400', label: 'Won 🎉' };
      case 'lost':
        return { bg: 'bg-rose-950/50 border-rose-500/30', border: 'border-rose-500/50', text: 'text-rose-400', label: 'Lost 😢' };
      default:
        return { bg: 'bg-slate-700/50', border: 'border-slate-600/30', text: 'text-slate-400', label: phase };
    }
  };

  const currentPhase = solverState.phase || 'idle';
  const phaseStyles = getPhaseStyles(currentPhase);
  const candidates: ScoredWord[] = solverState.topCandidates || [];
  const remainingCount = solverState.remainingWords?.length || 0;

  return (
    <div className="flex flex-col min-h-[580px] w-[400px] bg-[#0b0f19] border border-slate-800/40 font-sans shadow-2xl relative select-none">
      
      {/* ─── Glowing Background Accents ─── */}
      <div className="absolute top-0 left-1/4 w-40 h-40 bg-indigo-500/10 rounded-full blur-[60px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-32 h-32 bg-emerald-500/5 rounded-full blur-[50px] pointer-events-none" />

      {/* ─── Header ─── */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60 bg-[#0c1220]/75 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="text-white font-black text-sm tracking-wider font-outfit">W</span>
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wide uppercase font-outfit bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              Wordle Entropy
            </h1>
            <p className="text-[10px] text-slate-500 font-medium tracking-wider">AUTONOMOUS SOLVER</p>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex bg-slate-800/40 p-0.5 rounded-lg border border-slate-700/20">
          <button
            onClick={() => setActiveTab('play')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all duration-250 cursor-pointer ${
              activeTab === 'play'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Play
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all duration-250 cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Settings
          </button>
        </div>
      </header>

      {/* ─── Main Content Area ─── */}
      <main className="flex-1 p-5 flex flex-col gap-4 overflow-y-auto">
        {error && (
          <div className="p-3.5 bg-rose-950/40 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex flex-col gap-1 shadow-lg shadow-rose-950/10 animate-shake">
            <span className="font-bold uppercase tracking-wider text-[9px] text-rose-400">Error Encountered</span>
            <span>{error}</span>
          </div>
        )}

        {activeTab === 'play' ? (
          <>
            {/* Mode & Action Controls */}
            <div className="glass-card p-4 rounded-2xl flex flex-col gap-4">
              <div className="flex gap-2">
                <button
                  onClick={() => !isRunning && setMode('auto')}
                  disabled={isRunning}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer border ${
                    mode === 'auto'
                      ? 'bg-indigo-600/15 border-indigo-500/40 text-indigo-200'
                      : 'bg-transparent border-slate-800 text-slate-400 hover:text-slate-300 hover:border-slate-700/50'
                  } disabled:opacity-50`}
                >
                  Auto Solve
                </button>
                <button
                  onClick={() => !isRunning && setMode('assist')}
                  disabled={isRunning}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer border ${
                    mode === 'assist'
                      ? 'bg-indigo-600/15 border-indigo-500/40 text-indigo-200'
                      : 'bg-transparent border-slate-800 text-slate-400 hover:text-slate-300 hover:border-slate-700/50'
                  } disabled:opacity-50`}
                >
                  Assist Mode
                </button>
              </div>

              {/* Start / Stop Button */}
              {isRunning ? (
                <button
                  onClick={handleStop}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-orange-500 hover:from-rose-500 hover:to-orange-400 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-rose-950/20 transition-all duration-200 cursor-pointer transform active:scale-[0.98]"
                >
                  Stop Solver
                </button>
              ) : (
                <button
                  onClick={handleStart}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-500 hover:from-indigo-500 hover:to-emerald-400 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-950/30 transition-all duration-200 cursor-pointer transform active:scale-[0.98]"
                >
                  Start Solving
                </button>
              )}
            </div>

            {/* Status & Stats Dashboard */}
            <div className="grid grid-cols-2 gap-3">
              {/* Current Status */}
              <div className={`col-span-2 glass-card p-3 rounded-xl flex items-center justify-between border ${phaseStyles.border} transition-all duration-300`}>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">Current State</span>
                  <span className="text-xs font-semibold text-slate-200">{solverState.statusMessage}</span>
                </div>
                <div className={`px-2.5 py-1 text-[10px] font-bold rounded-lg ${phaseStyles.bg} ${phaseStyles.text} uppercase border border-current/10`}>
                  {phaseStyles.label}
                </div>
              </div>

              {/* Active Guess / Row */}
              <div className="glass-card p-3 rounded-xl flex flex-col gap-0.5">
                <span className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">Row / Attempt</span>
                <span className="text-sm font-bold text-slate-200 font-outfit">
                  {isRunning ? `${(solverState.currentRow || 0) + 1} / 6` : '—'}
                </span>
              </div>

              {/* Remaining Words */}
              <div className="glass-card p-3 rounded-xl flex flex-col gap-0.5">
                <span className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">Candidates Left</span>
                <span className="text-sm font-bold text-slate-200 font-outfit">
                  {remainingCount.toLocaleString()}
                </span>
              </div>

              {/* Expected Remaining */}
              <div className="glass-card p-3 rounded-xl flex flex-col gap-0.5">
                <span className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">Exp. Remaining</span>
                <span className="text-sm font-bold text-slate-200 font-outfit">
                  {solverState.expectedRemaining ? Number(solverState.expectedRemaining).toFixed(2) : '0.00'}
                </span>
              </div>

              {/* Win Probability */}
              <div className="glass-card p-3 rounded-xl flex flex-col gap-0.5">
                <span className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">Win Probability</span>
                <span className="text-sm font-bold text-emerald-400 font-outfit text-glow-green">
                  {solverState.winProbability ? `${Math.round(solverState.winProbability * 100)}%` : '0%'}
                </span>
              </div>
            </div>

            {/* Candidates Panel */}
            <div className="glass-card p-4 rounded-2xl flex-1 flex flex-col gap-3 min-h-[170px]">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Top Candidates</span>
                <span className="text-[9px] text-slate-500 font-medium">{remainingCount} matches</span>
              </div>

              {candidates.length > 0 ? (
                <div className="flex flex-col gap-2 overflow-y-auto flex-1 max-h-[150px] pr-1">
                  {candidates.slice(0, 5).map((cand, idx) => {
                    const maxEntropy = candidates[0]?.entropy || 1;
                    const widthPercent = maxEntropy > 0 ? (cand.entropy / maxEntropy) * 100 : 0;
                    
                    return (
                      <div key={cand.word} className="flex flex-col gap-1 p-2 rounded-lg bg-slate-900/40 border border-slate-800/30">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold text-slate-500">#{idx + 1}</span>
                            <span className={`text-xs font-bold tracking-widest ${idx === 0 ? 'text-emerald-400 font-outfit text-glow-green' : 'text-slate-300'}`}>
                              {cand.word}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">{cand.entropy.toFixed(3)} bits</span>
                        </div>
                        {/* Progress Bar */}
                        <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full progress-bar-shine ${
                              idx === 0
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                                : 'bg-gradient-to-r from-slate-700 to-slate-500'
                            }`}
                            style={{ width: `${widthPercent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-1.5 text-center text-slate-600">
                  <span className="text-xl">📊</span>
                  <p className="text-[11px] font-medium max-w-[200px]">
                    {isRunning ? 'Analyzing game state...' : 'No candidate data. Press start to run solver.'}
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          /* ─── Settings Tab ─── */
          <div className="glass-card p-4 rounded-2xl flex flex-col gap-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800/80 pb-2">
              Solver Settings
            </h2>

            {/* Hard Mode Toggle */}
            <div className="flex items-center justify-between py-1 border-b border-slate-800/30">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-slate-200">Hard Mode</span>
                <span className="text-[9px] text-slate-500">Any revealed hints must be used in subsequent guesses</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.hardMode}
                  onChange={(e) => updateSetting('hardMode', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-focus:ring-1 peer-focus:ring-indigo-500/50 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white peer-checked:after:border-transparent"></div>
              </label>
            </div>

            {/* LLM Fallback Toggle */}
            <div className="flex items-center justify-between py-1 border-b border-slate-800/30">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-slate-200">Groq LLM Fallback</span>
                <span className="text-[9px] text-slate-500">Enable Llama fallback if entropy engine runs out of words</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.llmFallbackEnabled}
                  onChange={(e) => updateSetting('llmFallbackEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-focus:ring-1 peer-focus:ring-indigo-500/50 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white peer-checked:after:border-transparent"></div>
              </label>
            </div>

            {/* API Key Input (only visible if fallback is enabled) */}
            {config.llmFallbackEnabled && (
              <div className="flex flex-col gap-2 p-3 bg-slate-950/40 rounded-xl border border-indigo-500/10">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Groq API Key</span>
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="text-[9px] text-indigo-400 font-semibold cursor-pointer hover:underline"
                  >
                    {showApiKey ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  type={showApiKey ? 'text' : 'password'}
                  placeholder="gsk_..."
                  value={config.groqApiKey}
                  onChange={(e) => updateSetting('groqApiKey', e.target.value)}
                  className="glass-input w-full px-3 py-2 text-xs rounded-lg text-slate-200 font-mono"
                />
                <span className="text-[8px] text-slate-600">
                  Required to call Llama model fallback. Key is stored locally in chrome.storage.
                </span>
              </div>
            )}

            {/* Typing Delay Slider */}
            <div className="flex flex-col gap-2 py-1">
              <div className="flex justify-between items-center">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-slate-200">Keystroke Speed</span>
                  <span className="text-[9px] text-slate-500">Delay between typed letters (human-like feeling)</span>
                </div>
                <span className="text-xs font-bold text-indigo-400 font-mono">{config.typingDelay}ms</span>
              </div>
              <input
                type="range"
                min="50"
                max="500"
                step="10"
                value={config.typingDelay}
                onChange={(e) => updateSetting('typingDelay', parseInt(e.target.value))}
                className="w-full accent-indigo-500 bg-slate-800 rounded-lg cursor-pointer h-1"
              />
            </div>
          </div>
        )}
      </main>
      
      {/* Footer / Copyright */}
      <footer className="px-5 py-3 border-t border-slate-900 bg-slate-950/40 text-center">
        <p className="text-[9px] text-slate-600 font-medium">
          Licensed under MIT. Open source on <a href="https://github.com/naitaj/wordle" target="_blank" rel="noreferrer" className="text-slate-500 hover:text-slate-400 underline">GitHub</a>.
        </p>
      </footer>
    </div>
  );
}
