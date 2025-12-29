// Tile Component for Match-3 Game

import React, { memo } from 'react';
import { Tile, GEM_IMAGES } from '@/game/types';

interface TileComponentProps {
  tile: Tile;
  size: number;
  isSelected: boolean;
  onClick: () => void;
  onTouchStart?: (e: React.TouchEvent) => void;
  onTouchMove?: (e: React.TouchEvent) => void;
  onTouchEnd?: (e: React.TouchEvent) => void;
}

const TileComponent: React.FC<TileComponentProps> = memo(({ tile, size, isSelected, onClick, onTouchStart, onTouchMove, onTouchEnd }) => {
  const getBackgroundStyle = (): React.CSSProperties => {
    if (tile.type === 'empty') {
      return { backgroundColor: 'transparent' };
    }
    
    if (tile.type === 'stone') {
      return {
        background: 'linear-gradient(135deg, #4b5563 0%, #374151 30%, #1f2937 60%, #111827 100%)',
        boxShadow: 'inset 0 3px 6px rgba(255,255,255,0.25), inset 0 -3px 6px rgba(0,0,0,0.5), 0 0 12px rgba(75,85,99,0.4), 0 4px 8px rgba(0,0,0,0.3)',
        border: '2px solid rgba(156,163,175,0.4)',
        position: 'relative' as const,
      };
    }
    
    if (tile.type === 'magma') {
      const intensity = tile.hp === 2 ? 1 : 0.7;
      return {
        background: `radial-gradient(circle at 30% 30%, rgba(220,38,38,${intensity}) 0%, rgba(185,28,28,${intensity}) 40%, rgba(153,27,27,${intensity}) 70%, rgba(127,29,29,${intensity}) 100%)`,
        boxShadow: `inset 0 0 20px rgba(251,146,60,${intensity * 0.8}), inset 0 0 30px rgba(234,88,12,${intensity * 0.4}), 0 0 20px rgba(185,28,28,${intensity * 0.9}), 0 0 30px rgba(239,68,68,${intensity * 0.5}), 0 4px 12px rgba(0,0,0,0.4)`,
        border: `2px solid rgba(251,146,60,${intensity * 0.8})`,
      };
    }
    
    if (tile.type === 'gem') {
      const colorMap: Record<string, string> = {
        red: '#ef4444',
        blue: '#3b82f6',
        green: '#10b981',
        yellow: '#f59e0b',
        purple: '#8b5cf6',
      };
      const baseColor = colorMap[tile.color || 'red'];
      return {
        background: `radial-gradient(circle at 30% 30%, ${baseColor}f0, ${baseColor}dd 50%, ${baseColor}aa)`,
        boxShadow: `inset 0 0 10px rgba(255,255,255,0.4), inset 0 -4px 8px rgba(0,0,0,0.2), 0 0 8px ${baseColor}80, 0 2px 6px rgba(0,0,0,0.3)`,
        border: `2px solid ${baseColor}dd`,
      };
    }
    
    return {};
  };

  const getJellyStyle = (): React.CSSProperties | null => {
    if (tile.jellyLayers === 0) return null;
    
    const opacity = tile.jellyLayers === 2 ? 0.95 : 0.65;
    const thickness = tile.jellyLayers === 2 ? '3px' : '2px';
    return {
      position: 'absolute',
      inset: 0,
      background: `radial-gradient(circle at 40% 40%, rgba(168, 85, 247, ${opacity}) 0%, rgba(139, 69, 207, ${opacity * 0.95}) 40%, rgba(88, 28, 135, ${opacity * 0.85}) 100%)`,
      borderRadius: '8px',
      border: `${thickness} solid rgba(168, 85, 247, ${opacity * 0.8})`,
      boxShadow: `inset 0 0 15px rgba(168, 85, 247, ${opacity * 0.7}), inset 0 0 25px rgba(88, 28, 135, ${opacity * 0.5}), 0 0 12px rgba(88, 28, 135, ${opacity * 0.5})`,
      pointerEvents: 'none',
      animation: tile.jellyLayers > 0 && tile.isExploding ? 'jelly-pop 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards' : undefined,
    };
  };

  const getSpecialIndicator = () => {
    if (tile.special === 'none') return null;
    
    if (tile.special === 'row_bomb') {
      return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-full h-3 bg-gradient-to-r from-transparent via-yellow-300 to-transparent rounded-full shadow-lg" 
               style={{ 
                 boxShadow: '0 0 15px rgba(251, 191, 36, 0.8), 0 0 25px rgba(251, 191, 36, 0.4)',
                 animation: 'glow-pulse 1.5s ease-in-out infinite'
               }} />
          <div className="absolute w-4 h-4 bg-yellow-400 rounded-full shadow-yellow-400/50" 
               style={{ 
                 boxShadow: '0 0 12px rgba(251, 191, 36, 0.8)',
                 animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite'
               }} />
        </div>
      );
    }
    
    if (tile.special === 'col_bomb') {
      return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="h-full w-3 bg-gradient-to-b from-transparent via-yellow-300 to-transparent rounded-full shadow-lg" 
               style={{ 
                 boxShadow: '0 0 15px rgba(251, 191, 36, 0.8), 0 0 25px rgba(251, 191, 36, 0.4)',
                 animation: 'glow-pulse 1.5s ease-in-out infinite'
               }} />
          <div className="absolute w-4 h-4 bg-yellow-400 rounded-full shadow-yellow-400/50" 
               style={{ 
                 boxShadow: '0 0 12px rgba(251, 191, 36, 0.8)',
                 animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite'
               }} />
        </div>
      );
    }
    
    if (tile.special === 'color_bomb') {
      return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-5 h-5 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 via-blue-500 to-purple-500" 
               style={{ 
                 animation: 'spin 2s linear infinite',
                 boxShadow: '0 0 15px rgba(251, 191, 36, 0.8), 0 0 25px rgba(139, 92, 246, 0.5)'
               }} />
          <div className="absolute w-3 h-3 bg-white rounded-full" 
               style={{ 
                 animation: 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                 boxShadow: '0 0 10px rgba(255, 255, 255, 0.8)'
               }} />
        </div>
      );
    }
    
    return null;
  };

  const animationClass = tile.isExploding 
    ? (tile.special === 'row_bomb' ? 'animate-row-blast' : 
       tile.special === 'col_bomb' ? 'animate-col-blast' :
       tile.special === 'color_bomb' ? 'animate-shatter' :
       'animate-tile-explode')
    : tile.isFalling 
    ? 'animate-tile-fall' 
    : tile.isSpawning
    ? 'animate-tile-spawn'
    : '';

  return (
    <div
      className={`relative rounded-lg cursor-pointer select-none ${animationClass}`}
      style={{
        width: size,
        height: size,
        willChange: tile.isFalling || tile.isSpawning || tile.isExploding ? 'transform, opacity' : 'auto',
        ...getBackgroundStyle(),
        transform: isSelected ? 'scale(1.1)' : 'scale(1)',
        transformOrigin: 'center',
        transition: 'transform 0.05s ease-out',
        zIndex: isSelected ? 10 : 1,
        boxShadow: isSelected 
          ? '0 0 0 3px #fbbf24, 0 4px 12px rgba(0,0,0,0.3)' 
          : '0 2px 4px rgba(0,0,0,0.2)',
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
      }}
      onClick={onClick}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Jelly layer */}
      {tile.jellyLayers > 0 && <div style={getJellyStyle()!} />}
      
      {/* Gem image with minimal sparkle effect */}
      {tile.type === 'gem' && tile.color && (
        <>
          <img
            src={GEM_IMAGES[tile.color]}
            alt={tile.color}
            className="w-full h-full object-cover rounded-lg"
            draggable={false}
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          />
          {/* Minimal sparkle for performance */}
          {tile.special === 'none' && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1 right-2 w-1 h-1 bg-white rounded-full animate-ping opacity-60" style={{ animationDuration: '2.5s' }} />
            </div>
          )}
        </>
      )}
      
      {/* Stone crack indicator */}
      {tile.type === 'stone' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-8 h-8 text-gray-500 drop-shadow-lg">
            <path
              fill="currentColor"
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
            />
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              d="M8 8l8 8M16 8l-8 8"
            />
          </svg>
        </div>
      )}
      
      {/* Magma HP indicator with pulsing effect */}
      {tile.type === 'magma' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-gradient-to-br from-black/70 to-black/50 rounded-full px-3 py-1.5 backdrop-blur-sm border-2 border-orange-400/60 shadow-lg">
            <span className="text-white font-black text-lg drop-shadow-[0_0_8px_rgba(251,146,60,0.8)]\" style={{ 
              textShadow: '0 0 10px rgba(251,146,60,0.8), 0 0 20px rgba(234,88,12,0.6)' 
            }}>{tile.hp}</span>
          </div>\n        </div>
      )}
      
      {/* Special tile indicator */}
      {getSpecialIndicator()}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return (
    prevProps.tile.id === nextProps.tile.id &&
    prevProps.tile.type === nextProps.tile.type &&
    prevProps.tile.color === nextProps.tile.color &&
    prevProps.tile.special === nextProps.tile.special &&
    prevProps.tile.hp === nextProps.tile.hp &&
    prevProps.tile.jellyLayers === nextProps.tile.jellyLayers &&
    prevProps.tile.isFalling === nextProps.tile.isFalling &&
    prevProps.tile.isSpawning === nextProps.tile.isSpawning &&
    prevProps.tile.isExploding === nextProps.tile.isExploding &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.size === nextProps.size
  );
});

TileComponent.displayName = 'TileComponent';

export default TileComponent;
