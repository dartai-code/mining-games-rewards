import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'game_sounds_muted';

const SoundToggle: React.FC = () => {
  const [muted, setMuted] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, muted ? 'true' : 'false');
    } catch {}
  }, [muted]);

  const handleToggle = () => {
    setMuted(m => !m);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <button
      onClick={handleToggle}
      className="relative p-2 hover:bg-slate-700 rounded-lg transition-all duration-300 hover:scale-110 active:scale-95 group"
      title={muted ? 'Unmute sounds' : 'Mute sounds'}
    >
      <span 
        className={`
          text-2xl transition-all duration-300
          ${isAnimating ? 'scale-125 rotate-12' : 'scale-100 rotate-0'}
          ${!muted ? 'animate-pulse' : ''}
          block
        `}
      >
        {muted ? '🔇' : '🔊'}
      </span>
      {/* Sound waves animation when unmuted */}
      {!muted && (
        <div className="absolute -right-1 top-1/2 -translate-y-1/2 flex gap-0.5">
          <div className="w-1 h-2 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
          <div className="w-1 h-3 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
          <div className="w-1 h-2 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
        </div>
      )}
      {/* Red indicator when muted */}
      {muted && (
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
      )}
    </button>
  );
};

export default SoundToggle;
