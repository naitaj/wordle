import React, { useState } from 'react';
import type { SolverState, TileStatus } from '../solver/types';
import { wordList } from '../data/wordList';

interface WordleBoardProps {
  state: SolverState;
  onStart: (customWord?: string) => void;
  onReset: () => void;
  onUpdateConfig?: (config: Partial<SolverState>) => void;
}

const TILE_CLASSES: Record<TileStatus, string> = {
  empty: "bg-transparent border-2 border-zinc-600 text-zinc-100",
  absent: "bg-zinc-700 border-2 border-zinc-700 text-zinc-100",
  present: "bg-amber-500 border-2 border-amber-500 text-white",
  correct: "bg-emerald-600 border-2 border-emerald-600 text-white",
};

const KEY_ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['Z','X','C','V','B','N','M']
];

export const WordleBoard: React.FC<WordleBoardProps> = ({ state, onStart, onReset, onUpdateConfig }) => {
  const [customWord, setCustomWord] = useState('');

  const isPlaying = state.phase !== 'idle' && state.phase !== 'won' && state.phase !== 'lost';

  const handleStart = () => {
    if (customWord.length === 5) {
      const upper = customWord.toUpperCase();
      if (!wordList.includes(upper)) {
        alert(`The word "${upper}" is not in the Wordle dictionary!`);
        return;
      }
      onStart(upper);
    } else {
      onStart();
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 flex flex-col md:flex-row items-center justify-center p-4 gap-8 font-sans">
      
      {/* Left Column: Board & Keyboard */}
      <div className="flex flex-col items-center gap-6 max-w-md w-full">
        <div className="flex items-center justify-between w-full mb-2">
          <h1 className="text-3xl font-bold tracking-widest uppercase bg-gradient-to-r from-emerald-400 to-amber-400 bg-clip-text text-transparent">Wordle</h1>
          <div className="text-sm px-3 py-1 bg-zinc-800 rounded-full font-semibold uppercase tracking-wider text-zinc-400 shadow-inner">
            {state.phase}
          </div>
        </div>

        {/* Board Grid */}
        <div className="grid grid-rows-6 gap-2 w-full max-w-[350px]">
          {state.board.map((row, rIdx) => (
            <div key={rIdx} className="grid grid-cols-5 gap-2">
              {row.tiles.map((tile, cIdx) => {
                const revealDelay = `${cIdx * 80}ms`;
                const style = tile.status !== 'empty' && row.status === 'evaluated' ? { transitionDelay: revealDelay } : {};
                return (
                  <div
                    key={cIdx}
                    style={style}
                    className={`flex items-center justify-center text-3xl font-bold uppercase w-full aspect-square transition-all duration-500 shadow-md ${TILE_CLASSES[tile.status]}`}
                  >
                    {tile.letter}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <p className="text-sm text-zinc-400 h-5 font-medium animate-pulse">{state.statusMessage}</p>

        {/* Keyboard Display */}
        <div className="w-full max-w-[400px] flex flex-col gap-2 mt-4">
          {KEY_ROWS.map((row, i) => (
            <div key={i} className="flex justify-center gap-1.5">
              {row.map(key => {
                const status = state.keyboardState[key] || 'empty';
                const bg = status === 'correct' ? 'bg-emerald-600 text-white shadow-emerald-900/50' :
                           status === 'present' ? 'bg-amber-500 text-white shadow-amber-900/50' :
                           status === 'absent'  ? 'bg-zinc-800 text-zinc-500' :
                                                  'bg-zinc-700 text-zinc-100 shadow-md';
                return (
                  <div key={key} className={`flex items-center justify-center rounded font-semibold w-8 h-12 sm:w-10 sm:h-14 transition-colors duration-300 shadow-sm ${bg}`}>
                    {key}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="w-full flex flex-col gap-3 mt-4">
          <div className="flex gap-2">
            <input
              type="text"
              maxLength={5}
              value={customWord}
              onChange={(e) => setCustomWord(e.target.value)}
              placeholder="Custom 5-letter target"
              disabled={isPlaying}
              className="flex-1 bg-zinc-800/80 backdrop-blur-sm border border-zinc-700 rounded-lg px-4 py-2 text-zinc-100 uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-inner"
            />
            <button onClick={handleStart} disabled={isPlaying} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-lg shadow-emerald-900/50 active:scale-95 disabled:opacity-50">
              Start
            </button>
          </div>
          <button onClick={onReset} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-2 px-6 rounded-lg transition-colors w-full border border-zinc-700/50 shadow-md active:scale-95">
            Reset
          </button>
        </div>
      </div>

      {/* Right Column: Candidates & Info */}
      <div className="flex flex-col gap-6 w-full max-w-sm">

        {!isPlaying && state.phase === 'idle' && onUpdateConfig && (
          <div className="bg-zinc-800/40 rounded-2xl p-6 border border-zinc-700/50 backdrop-blur-md shadow-xl animate-fade-in">
            <h2 className="text-lg font-bold mb-4 border-b border-zinc-700/50 pb-2 text-zinc-200">Configuration</h2>
            <div className="space-y-4">
              <label className="flex items-center text-sm text-zinc-300 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={state.hardMode} 
                  onChange={(e) => onUpdateConfig({ hardMode: e.target.checked })}
                  className="mr-3 w-4 h-4 accent-emerald-500 bg-zinc-700 border-zinc-600 rounded focus:ring-emerald-500 focus:ring-2"
                />
                Strict Hard Mode
              </label>
              <label className="flex items-center text-sm text-zinc-300 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={state.llmFallbackEnabled} 
                  onChange={(e) => onUpdateConfig({ llmFallbackEnabled: e.target.checked })}
                  className="mr-3 w-4 h-4 accent-emerald-500 bg-zinc-700 border-zinc-600 rounded focus:ring-emerald-500 focus:ring-2"
                />
                LLM Fallback (Groq)
              </label>
            </div>
          </div>
        )}

        {state.phase !== 'idle' && (
          <div className="bg-zinc-800/40 rounded-2xl p-6 border border-zinc-700/50 backdrop-blur-md shadow-xl animate-fade-in">
            <h2 className="text-lg font-bold mb-4 border-b border-zinc-700/50 pb-2 text-zinc-200">Analytics</h2>
            <div className="space-y-2 text-sm text-zinc-300">
              <div className="flex justify-between items-center">
                <span className="font-medium text-zinc-400">Expected Remaining:</span>
                <span className="font-mono text-amber-400 font-bold">{state.expectedRemaining.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-zinc-400">Win Probability:</span>
                <span className="font-mono text-emerald-400 font-bold">{(state.winProbability * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-zinc-400">Confidence:</span>
                <span className="font-mono text-zinc-200">{state.remainingWords.length > 0 ? (100 / state.remainingWords.length).toFixed(1) : 0}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Candidates Panel */}
        <div className="bg-zinc-800/40 rounded-2xl p-6 border border-zinc-700/50 backdrop-blur-md shadow-xl">
          <h2 className="text-lg font-bold mb-5 flex justify-between items-center border-b border-zinc-700/50 pb-3">
            <span className="text-zinc-200">Candidates</span>
            <span className="bg-zinc-700 px-3 py-1 rounded-full text-sm">{state.remainingWords.length}</span>
          </h2>
          <div className="flex flex-col gap-4">
            {state.topCandidates.slice(0, 5).map((candidate, i) => {
              const isLlm = candidate.entropy < 0;
              return (
                <div key={i} className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-sm font-mono items-center">
                    <span className={`uppercase font-bold tracking-wider ${isLlm ? 'text-violet-400' : 'text-emerald-400'}`}>{candidate.word}</span>
                    {isLlm ? (
                      <span className="text-violet-300 bg-violet-900/50 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">🤖 Groq AI</span>
                    ) : (
                      <span className="text-zinc-400 bg-zinc-900/50 px-2 py-0.5 rounded">{candidate.entropy.toFixed(2)} bits</span>
                    )}
                  </div>
                  {/* Entropy bar normalised against 5.5 bits */}
                  {isLlm ? (
                    <div className="flex-1 bg-violet-900/30 rounded-full h-2 overflow-hidden shadow-inner">
                      <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 animate-pulse" style={{ width: '100%' }} />
                    </div>
                  ) : (
                    <div className="flex-1 bg-zinc-900/80 rounded-full h-2 overflow-hidden shadow-inner">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500 ease-out"
                        style={{ width: `${Math.min(100, (candidate.entropy / 5.5) * 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
            {state.topCandidates.length === 0 && (
              <div className="text-zinc-500 text-sm text-center py-6 font-medium">Awaiting first guess...</div>
            )}
          </div>
        </div>

        {/* Status / Reveal */}
        {(state.phase === 'won' || state.phase === 'lost') && (
          <div className="bg-zinc-800/40 rounded-2xl p-6 border border-zinc-700/50 backdrop-blur-md text-center shadow-xl transform transition-all animate-fade-in">
            <h3 className="text-zinc-400 text-sm mb-2 uppercase tracking-widest font-semibold">Target Word</h3>
            <div className="text-4xl font-bold tracking-widest uppercase bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              {state.targetWord}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
