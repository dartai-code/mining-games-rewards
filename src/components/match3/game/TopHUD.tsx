// Top HUD Component for Match-3 Game

import React from 'react';
import { Objective } from '@/game/types';

interface TopHUDProps {
  level: number;
  lives: number;
  moves: number;
  score: number;
  objectives: Objective[];
  soundEnabled: boolean;
  onSoundToggle: () => void;
  onClose: () => void;
}

const TopHUD: React.FC<TopHUDProps> = ({
  level,
  lives,
  moves,
  score,
  objectives,
  soundEnabled,
  onSoundToggle,
  onClose,
}) => {
  const getObjectiveIcon = (type: string) => {
    switch (type) {
      case 'jelly':
        return (
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600/80 to-purple-800/80 border-2 border-purple-400/60 shadow-lg flex items-center justify-center">
            <div className="w-3 h-3 rounded bg-purple-300/90 shadow-inner"></div>
          </div>
        );
      case 'stone':
        return (
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-gray-400/80 to-gray-600/80 border-2 border-gray-300/60 shadow-lg flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-200">
              <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
              <path fill="none" stroke="currentColor" strokeWidth="2" d="M8 8l8 8M16 8l-8 8"/>
            </svg>
          </div>
        );
      case 'magma':
        return (
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-500/80 to-orange-600/80 border-2 border-orange-300/60 shadow-lg flex items-center justify-center animate-pulse">
            <div className="w-2 h-2 rounded-full bg-orange-200 shadow-inner"></div>
          </div>
        );
      default:
        return (
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-yellow-400/80 to-yellow-600/80 border-2 border-yellow-300/60 shadow-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-yellow-200" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="w-full bg-gradient-to-r from-purple-900/90 via-indigo-900/90 to-blue-900/90 rounded-2xl p-4 shadow-2xl backdrop-blur-md border border-purple-500/30">
      {/* Top row: Level, Score, Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl px-4 py-2 shadow-lg">
            <span className="text-white font-black text-xl drop-shadow-lg">Level {level}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl px-4 py-2 border border-yellow-400/30 shadow-lg">
          <svg className="w-6 h-6 text-yellow-400 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <span className="text-white font-black text-xl drop-shadow-lg">{score.toLocaleString()}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={onSoundToggle}
            className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all duration-200 hover:scale-105 shadow-lg"
          >
            {soundEnabled ? (
              <svg className="w-6 h-6 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            )}
          </button>
          
          <button
            onClick={onClose}
            className="w-12 h-12 rounded-xl bg-red-500/80 hover:bg-red-500 border border-red-400/50 flex items-center justify-center transition-all duration-200 hover:scale-105 shadow-lg"
          >
            <svg className="w-6 h-6 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Bottom row: Lives, Moves and Objectives */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Lives */}
          <div className="flex items-center gap-3 bg-gradient-to-r from-red-500/30 to-pink-500/30 rounded-xl px-5 py-3 border border-red-400/40 shadow-lg">
            <svg className="w-7 h-7 text-red-300 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <div className="text-center">
              <span className="text-white font-black text-2xl drop-shadow-lg block">{lives}</span>
              <span className="text-red-200 text-sm font-semibold drop-shadow">lives</span>
            </div>
          </div>
          {/* Moves */}
          <div className="flex items-center gap-3 bg-gradient-to-r from-blue-500/30 to-cyan-500/30 rounded-xl px-5 py-3 border border-blue-400/40 shadow-lg">
            <svg className="w-7 h-7 text-blue-300 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 3a9 9 0 100 18 9 9 0 000-18zm1 9H8v2h6v-2z" />
            </svg>
            <div className="text-center">
              <span className="text-white font-black text-2xl drop-shadow-lg block">{moves}</span>
              <span className="text-blue-200 text-sm font-semibold drop-shadow">moves</span>
            </div>
          </div>
        </div>
        {/* Objectives */}
        <div className="flex items-center gap-3">
          {objectives.map((obj, index) => (
            <div
              key={index}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border transition-all duration-300 ${
                obj.current >= obj.target 
                  ? 'bg-gradient-to-r from-green-500/40 to-emerald-500/40 border-green-400/50' 
                  : 'bg-gradient-to-r from-white/10 to-white/5 border-white/20'
              }`}
            >
              {getObjectiveIcon(obj.type)}
              <div className="text-center">
                <span className={`font-black text-lg drop-shadow-lg block ${
                  obj.current >= obj.target ? 'text-green-300' : 'text-white'
                }`}>
                  {obj.current}/{obj.target}
                </span>
              </div>
              {obj.current >= obj.target && (
                <svg className="w-5 h-5 text-green-400 drop-shadow-lg animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TopHUD;
