// Booster Bar Component for Match-3 Game

import React from 'react';
import { BoosterType } from '@/game/types';

interface BoosterBarProps {
  boosters: { [key in BoosterType]: number };
  activeBooster: BoosterType | null;
  onBoosterSelect: (type: BoosterType | null) => void;
  onAdRequest: (type: BoosterType) => void;
}

const BoosterBar: React.FC<BoosterBarProps> = ({
  boosters,
  activeBooster,
  onBoosterSelect,
  onAdRequest,
}) => {
  const boosterConfig: { type: BoosterType; name: string; icon: React.ReactNode; color: string }[] = [
    {
      type: 'fire_bomb',
      name: '3x3 Bomb',
      color: 'from-orange-500 to-red-600',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
        </svg>
      ),
    },
    {
      type: 'line_bomb',
      name: 'Line Bomb',
      color: 'from-blue-500 to-cyan-600',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 8h16v2H4V8zm0 4h16v2H4v-2z" />
          <path d="M8 4v16h2V4H8zm4 0v16h2V4h-2z" />
        </svg>
      ),
    },
    {
      type: 'color_bomb',
      name: 'Color Bomb',
      color: 'from-purple-500 to-pink-600',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="3" fill="#ef4444" />
          <circle cx="8" cy="8" r="2" fill="#3b82f6" />
          <circle cx="16" cy="8" r="2" fill="#22c55e" />
          <circle cx="8" cy="16" r="2" fill="#eab308" />
          <circle cx="16" cy="16" r="2" fill="#a855f7" />
        </svg>
      ),
    },
  ];

  return (
    <div className="w-full bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-3 shadow-lg">
      <div className="flex items-center justify-center gap-4">
        {boosterConfig.map(({ type, name, icon, color }) => {
          const count = boosters[type];
          const isActive = activeBooster === type;
          const isDisabled = count <= 0;

          return (
            <button
              key={type}
              onClick={() => {
                if (isDisabled) {
                  onAdRequest(type);
                } else {
                  onBoosterSelect(isActive ? null : type);
                }
              }}
              disabled={isDisabled}
              className={`
                relative flex flex-col items-center gap-1 p-2 rounded-xl transition-all
                ${isActive ? 'ring-2 ring-yellow-400 scale-110' : ''}
                ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105 cursor-pointer'}
              `}
            >
              <div
                className={`
                  w-12 h-12 rounded-xl flex items-center justify-center
                  bg-gradient-to-br ${color} shadow-lg
                  ${isActive ? 'animate-pulse' : ''}
                `}
              >
                <div className="text-white">{icon}</div>
              </div>
              
              {/* Count badge */}
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center">
                <span className="text-xs font-bold text-gray-900">{count}</span>
              </div>
              
              <span className="text-xs text-gray-400">{name}</span>
            </button>
          );
        })}
      </div>
      
      {activeBooster && (
        <div className="mt-2 text-center">
          <span className="text-yellow-400 text-sm animate-pulse">
            Tap a tile to use booster
          </span>
        </div>
      )}
    </div>
  );
};

export default BoosterBar;
