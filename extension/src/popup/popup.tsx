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
    winProbability: 0.99,
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

  // Helper for status text and colors
  const getStatusDisplay = () => {
    const phase = solverState.phase || 'idle';
    switch (phase) {
      case 'won':
        return { text: 'WON', color: 'text-emerald-600', icon: true };
      case 'lost':
        return { text: 'FAIL', color: 'text-rose-600', icon: false };
      case 'thinking':
        return { text: 'THINKING', color: 'text-black', icon: false };
      case 'typing':
        return { text: 'TYPING', color: 'text-black', icon: false };
      case 'evaluating':
        return { text: 'REVEALING', color: 'text-black', icon: false };
      case 'idle':
      default:
        return { text: 'IDLE', color: 'text-zinc-500', icon: false };
    }
  };

  const status = getStatusDisplay();
  const candidates: ScoredWord[] = solverState.topCandidates || [];
  const remainingCount = solverState.remainingWords?.length || 0;

  // Reconstruct completed/active rows count
  const attemptsCount = solverState.phase === 'won'
    ? (solverState.currentRow || 0)
    : (solverState.currentRow || 0);

  const filledRowsCount = solverState.phase === 'won'
    ? (solverState.currentRow || 0)
    : (isRunning ? (solverState.currentRow || 0) : 0);

  // Helper to color candidate letter boxes
  const getLetterColorClass = (letter: string) => {
    if (!letter || !solverState.keyboardState) return 'bg-[#E4E4E7] border-zinc-300';
    const state = solverState.keyboardState[letter.toUpperCase()];
    switch (state) {
      case 'correct':
        return 'bg-emerald-600 border-emerald-700';
      case 'present':
        return 'bg-amber-500 border-amber-600';
      case 'absent':
        return 'bg-zinc-400 border-zinc-500';
      case 'empty':
      default:
        return 'bg-[#E4E4E7] border-zinc-300';
    }
  };

  // Render settings page if settings tab active
  if (activeTab === 'settings') {
    return (
      <div className="flex flex-col h-[600px] w-[320px] bg-[#F3F3F3] text-black font-sans p-0 select-none box-border border-2 border-black overflow-hidden">
        
        {/* Settings Header */}
        <header className="bg-black text-white px-5 py-4 flex items-center justify-between border-b-2 border-black">
          <div className="flex items-baseline">
            <h1 className="text-xl font-black uppercase tracking-wider font-bebas text-white">SETTINGS</h1>
            <div className="text-zinc-400 font-black text-lg tracking-[0.05em] select-none font-bebas ml-1">///</div>
          </div>
          <button 
            onClick={() => setActiveTab('play')}
            className="text-white hover:text-zinc-300 font-bold cursor-pointer outline-none bg-transparent border-none p-0 flex items-center justify-center"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </header>

        {/* Settings Content */}
        <div className="flex-1 p-5 flex flex-col overflow-y-auto">
          <div className="flex flex-col gap-6">
            
            {/* Hard Mode Setting */}
            <div className="flex flex-col gap-2.5 items-start">
              <h2 className="text-lg font-black uppercase tracking-wide font-bebas text-black leading-none">HARD MODE</h2>
              <p className="text-[11px] text-zinc-800 leading-normal max-w-[280px]">
                Revealed hints must be used in subsequent guesses.
              </p>
              
              {/* Tactile Switch */}
              <div 
                onClick={() => updateSetting('hardMode', !config.hardMode)}
                className="w-24 h-8 border-2 border-black flex cursor-pointer select-none font-bebas text-[11px] mt-1"
              >
                {config.hardMode ? (
                  <>
                    <div className="w-1/2 bg-white text-black flex items-center justify-center font-bold border-r border-black">ON</div>
                    <div className="w-1/2 bg-black"></div>
                  </>
                ) : (
                  <>
                    <div className="w-1/2 bg-white text-black flex items-center justify-center font-bold border-r border-black">OFF</div>
                    <div className="w-1/2 bg-white"></div>
                  </>
                )}
              </div>
            </div>

            <hr className="border-black border-t-2 my-1" />

            {/* Groq LLM Fallback Setting */}
            <div className="flex flex-col gap-2.5 items-start">
              <h2 className="text-lg font-black uppercase tracking-wide font-bebas text-black leading-none">GROQ LLM FALLBACK</h2>
              <p className="text-[11px] text-zinc-800 leading-normal max-w-[280px]">
                Enable Llama fallback if entropy engine runs out of words.
              </p>
              
              {/* Tactile Switch */}
              <div 
                onClick={() => updateSetting('llmFallbackEnabled', !config.llmFallbackEnabled)}
                className="w-24 h-8 border-2 border-black flex cursor-pointer select-none font-bebas text-[11px] mt-1"
              >
                {config.llmFallbackEnabled ? (
                  <>
                    <div className="w-1/2 bg-white text-black flex items-center justify-center font-bold border-r border-black">ON</div>
                    <div className="w-1/2 bg-black"></div>
                  </>
                ) : (
                  <>
                    <div className="w-1/2 bg-white text-black flex items-center justify-center font-bold border-r border-black">OFF</div>
                    <div className="w-1/2 bg-white"></div>
                  </>
                )}
              </div>
            </div>

            {/* Groq API Key Input */}
            {config.llmFallbackEnabled && (
              <div className="flex flex-col gap-2 p-3 bg-zinc-50 border-2 border-black box-border mt-1">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-black uppercase tracking-wide">Groq API Key</span>
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="text-[9px] text-zinc-500 hover:text-black font-bold uppercase cursor-pointer"
                  >
                    {showApiKey ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  type={showApiKey ? 'text' : 'password'}
                  placeholder="gsk_..."
                  value={config.groqApiKey}
                  onChange={(e) => updateSetting('groqApiKey', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border-2 border-black rounded-md text-black font-mono focus:outline-none bg-white box-border"
                />
                <span className="text-[8px] text-zinc-500 leading-normal">
                  Key is stored locally in chrome.storage.
                </span>
              </div>
            )}

            <hr className="border-black border-t-2 my-1" />

            {/* Keystroke Speed Header-Only Display */}
            <div className="flex flex-col gap-1 py-1">
              <h2 className="text-lg font-black uppercase tracking-wide font-bebas text-black leading-none">
                KEYSTROKE SPEED 500 m/s
              </h2>
            </div>
          </div>

          {/* Footer Close button */}
          <div className="mt-auto pt-6 flex justify-end">
            <button
              onClick={() => setActiveTab('play')}
              className="bg-black text-white hover:bg-zinc-800 font-bebas text-lg px-8 py-2 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer outline-none"
            >
              CLOSE
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] w-[320px] bg-[#F3F3F3] text-black font-sans p-4 select-none box-border border-2 border-black justify-between overflow-hidden">
      
      {/* ─── Header ─── */}
      <header className="flex items-center justify-between pb-3 border-b-2 border-black bg-transparent">
        <div className="flex items-center gap-3">
          {/* Taller / More Elongated Logo */}
          <div className="h-[88px] w-[52px] bg-black flex items-center justify-center select-none shrink-0">
            <span className="text-white text-[56px] pt-2 inline-block" style={{ fontFamily: '"Anton", sans-serif', fontWeight: 400, letterSpacing: '0' }}>W</span>
          </div>
          <div className="flex flex-col justify-center select-none ml-2 h-[88px]">
            <div className="flex flex-col justify-center">
              <h1 className="text-[36px] text-black uppercase leading-[0.9] tracking-[0.05em]" style={{ fontFamily: '"Anton", sans-serif', fontWeight: 400 }}>
                WORDLE
              </h1>
              <h1 className="text-[36px] text-black uppercase leading-[0.9] tracking-[0.05em] mt-1" style={{ fontFamily: '"Anton", sans-serif', fontWeight: 400 }}>
                ENTROPY
              </h1>
            </div>
            <p 
              className="text-[16px] text-[#222222] font-medium uppercase mt-2 leading-none"
              style={{
                fontFamily: "'DIN Condensed', 'Bahnschrift Condensed', 'Roboto Condensed', sans-serif",
                letterSpacing: '0.35em'
              }}
            >
              AUTONOMOUS SOLVER
            </p>
          </div>
        </div>

        {/* Settings button */}
        <button
          onClick={() => setActiveTab('settings')}
          className="w-9 h-9 border-2 border-black rounded-lg bg-white flex items-center justify-center hover:bg-zinc-100 active:bg-zinc-200 transition-all cursor-pointer outline-none"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-black">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
      </header>

      {/* ─── Main Content Area ─── */}
      <main className="flex-1 py-3 flex flex-col gap-3 overflow-y-auto justify-between">
        <div className="flex flex-col gap-3">
          {error && (
            <div className="p-3 bg-rose-50 border-2 border-rose-600 text-rose-800 text-xs font-bold flex flex-col gap-0.5 animate-shake">
              <span className="uppercase tracking-wider text-[9px] text-rose-600">Error Encountered</span>
              <span>{error}</span>
            </div>
          )}

          {/* Mode Tabs */}
          <div className="flex border-2 border-black rounded-lg overflow-hidden bg-white w-full">
            <button
              onClick={() => !isRunning && setMode('auto')}
              disabled={isRunning}
              className={`flex-1 py-1.5 text-center font-bebas text-sm border-r border-black cursor-pointer transition-all uppercase tracking-wide flex items-center justify-center gap-1.5 ${
                mode === 'auto'
                  ? 'bg-black text-white'
                  : 'bg-white text-black hover:bg-zinc-50'
              } disabled:opacity-50`}
            >
              ✦ Auto Solve
            </button>
            <button
              onClick={() => !isRunning && setMode('assist')}
              disabled={isRunning}
              className={`flex-1 py-1.5 text-center font-bebas text-sm cursor-pointer transition-all uppercase tracking-wide ${
                mode === 'assist'
                  ? 'bg-black text-white'
                  : 'bg-white text-black hover:bg-zinc-50'
              } disabled:opacity-50`}
            >
              Assist Mode
            </button>
          </div>

          {/* Start / Stop Button */}
          {isRunning ? (
            <button
              onClick={handleStop}
              className="w-full h-14 bg-black text-white font-bebas text-[28px] tracking-wide flex items-center justify-between px-5 border border-black cursor-pointer rounded-none hover:bg-zinc-900 transition-colors outline-none"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white shrink-0">
                <rect x="4" y="4" width="16" height="16" rx="1"></rect>
              </svg>
              <span className="font-bold pt-0.5">STOP SOLVING</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white shrink-0">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          ) : (
            <button
              onClick={handleStart}
              className="w-full h-14 bg-black text-white font-bebas text-[28px] tracking-wide flex items-center justify-between px-5 border border-black cursor-pointer rounded-none hover:bg-zinc-900 transition-colors outline-none"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white shrink-0">
                <polygon points="6 3 20 12 6 21 6 3"></polygon>
              </svg>
              <span className="font-bold pt-0.5">START SOLVING</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white shrink-0">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          )}

          {/* Solved attempts & status - Divider centered and status aligned extreme right */}
          <div className="border-2 border-black p-3 bg-white flex items-center justify-between box-border h-16">
            {/* Left Column: Solved In */}
            <div className="w-[calc(50%-1px)] flex flex-col items-start justify-center">
              <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">Solved In</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-3xl font-black font-bebas leading-none text-black">
                  {attemptsCount || '—'}
                </span>
                <span className="text-[8px] font-bold text-black uppercase tracking-wider">Attempts</span>
              </div>
            </div>
            
            {/* Central Divider */}
            <div className="w-[2px] bg-black self-stretch"></div>
            
            {/* Right Column: Status (aligned extreme right) */}
            <div className="w-[calc(50%-1px)] flex flex-col items-end justify-center font-bebas">
              <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider font-sans">Status</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-3xl font-black leading-none uppercase ${status.color}`}>
                  {status.text}
                </span>
                {status.icon && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                    <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"/>
                    <path d="M5 20h14"/>
                  </svg>
                )}
              </div>
            </div>
          </div>

          {/* Grid Metrics - Candidates renamed to Words */}
          <div className="grid grid-cols-4 border-2 border-black bg-white divide-x-2 divide-black box-border">
            {/* Box 1: Row / Attempt */}
            <div className="p-2 flex flex-col items-center justify-between min-h-[64px]">
              <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider text-center leading-tight">Row / Attempt</span>
              <span className="text-lg font-black font-bebas text-black leading-none my-1">
                {isRunning ? `${(solverState.currentRow || 0) + 1} / 6` : '—'}
              </span>
              <div className="flex gap-[2px]">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 border border-black ${
                      i < filledRowsCount ? 'bg-black' : 'bg-white'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Box 2: Words Left */}
            <div className="p-2 flex flex-col items-center justify-between min-h-[64px]">
              <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider text-center leading-tight">Words Left</span>
              <span className="text-lg font-black font-bebas text-black my-1">
                {remainingCount.toLocaleString()}
              </span>
              <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider leading-none">Words</span>
            </div>

            {/* Box 3: Exp. Remaining */}
            <div className="p-2 flex flex-col items-center justify-between min-h-[64px]">
              <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider text-center leading-tight">Exp. Remaining</span>
              <span className="text-lg font-black font-bebas text-black my-1 font-mono-retro">
                {solverState.expectedRemaining ? Number(solverState.expectedRemaining).toFixed(2) : '0.00'}
              </span>
              <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider leading-none">Bits</span>
            </div>

            {/* Box 4: Win Probability */}
            <div className="p-2 flex flex-col items-center justify-between min-h-[64px]">
              <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider text-center leading-tight">Win Probability</span>
              <span className="text-lg font-black font-bebas text-emerald-600 my-1">
                {solverState.winProbability ? `${Math.round(solverState.winProbability * 100)}%` : '0%'}
              </span>
              <div className="w-full h-1.5 bg-white border border-black overflow-hidden box-border">
                <div
                  className="h-full bg-emerald-600 transition-all duration-300"
                  style={{ width: `${solverState.winProbability ? Math.round(solverState.winProbability * 100) : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Candidates Panel - Renamed Top Candidates to Top Words */}
        <div className="border-2 border-black bg-white flex flex-col flex-1 min-h-[170px] box-border overflow-hidden">
          <div className="border-b-2 border-black px-3 py-2 flex justify-between items-center bg-zinc-50 select-none">
            <span className="text-[10px] font-bold uppercase tracking-wider text-black">Top Words</span>
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">{remainingCount} Matches &gt;</span>
          </div>

          {solverState.phase === 'won' ? (
            /* Showcase guess history after winning */
            <div className="flex flex-col divide-y divide-zinc-200 overflow-y-auto flex-1 max-h-[160px]">
              {(solverState.guessHistory || []).map((guessRecord, idx) => (
                <div key={idx} className="flex items-center justify-between pr-3 h-[40px] hover:bg-zinc-50 transition-all box-border">
                  <div className="flex items-center self-stretch">
                    <div className="w-8 bg-black text-white flex items-center justify-center font-bold text-xs self-stretch font-bebas">
                      {String(idx + 1).padStart(2, '0')}
                    </div>
                    <span className="text-lg font-black tracking-widest text-black pl-3 font-bebas">
                      {guessRecord.word}
                    </span>
                  </div>
                  
                  {/* Letters status squares adjacent to words (between words and chevron) */}
                  <div className="flex gap-[3px] ml-auto mr-4 items-center">
                    {guessRecord.word.split('').map((_, i) => {
                      const res = guessRecord.result[i];
                      let colorClass = 'bg-[#E4E4E7] border-zinc-300';
                      if (res === 'correct') colorClass = 'bg-emerald-600 border-emerald-700 text-white';
                      else if (res === 'present') colorClass = 'bg-amber-500 border-amber-600 text-white';
                      else if (res === 'absent') colorClass = 'bg-zinc-400 border-zinc-500 text-white';
                      
                      return (
                        <div
                          key={i}
                          className={`w-3.5 h-3.5 border border-black/40 rounded-[2px] ${colorClass}`}
                        />
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-zinc-400 font-bold text-xs select-none">&gt;</span>
                  </div>
                </div>
              ))}
            </div>
          ) : candidates.length > 0 ? (
            /* Active candidates list */
            <div className="flex flex-col divide-y divide-zinc-200 overflow-y-auto flex-1 max-h-[160px]">
              {candidates.slice(0, 5).map((cand, idx) => (
                <div key={cand.word} className="flex items-center justify-between pr-3 h-[40px] hover:bg-zinc-50 transition-all box-border">
                  <div className="flex items-center self-stretch">
                    <div className="w-8 bg-black text-white flex items-center justify-center font-bold text-xs self-stretch font-bebas">
                      {String(idx + 1).padStart(2, '0')}
                    </div>
                    <span className="text-lg font-black tracking-widest text-black pl-3 font-bebas">
                      {cand.word}
                    </span>
                  </div>
                  
                  {/* Character pattern indicator: 5 square boxes colored by keyboard state */}
                  <div className="flex gap-[3px] ml-auto mr-4 items-center">
                    {cand.word.split('').map((letter, i) => (
                      <div
                        key={i}
                        className={`w-3.5 h-3.5 border border-black/40 rounded-[2px] transition-colors ${getLetterColorClass(letter)}`}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs font-black font-bebas text-black leading-none">
                        {cand.entropy.toFixed(3)}
                      </div>
                      <div className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider leading-none">
                        Bits
                      </div>
                    </div>
                    <span className="text-zinc-400 font-bold text-xs select-none">&gt;</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-1.5 text-center p-4">
              <span className="text-2xl text-black">📊</span>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider max-w-[220px] leading-relaxed">
                {isRunning ? 'Analyzing game state...' : 'No word data. Press start solver.'}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
