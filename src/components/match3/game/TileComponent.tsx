// Tile Component for Match-3 Game

import React from 'react';
import { Tile, GEM_IMAGES } from '@/game/types';

interface TileComponentProps {
  tile: Tile;
  size: number;
  isSelected: boolean;
  onClick: () => void;
}

const TileComponent: React.FC<TileComponentProps> = ({ tile, size, isSelected, onClick }) => {
  const getBackgroundStyle = (): React.CSSProperties => {
    if (tile.type === 'empty') {
      return { backgroundColor: 'transparent' };
    }
    
    if (tile.type === 'stone') {
      return {
        background: 'linear-gradient(135deg, #374151 0%, #1f2937 50%, #111827 100%)',
        boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.2), inset 0 -2px 4px rgba(0,0,0,0.4), 0 0 8px rgba(75,85,99,0.3)',
        border: '1px solid rgba(156,163,175,0.3)',
      };
    }
    
    if (tile.type === 'magma') {
      const intensity = tile.hp === 2 ? 1 : 0.7;
      return {
        background: `linear-gradient(135deg, rgba(185,28,28,${intensity}) 0%, rgba(153,27,27,${intensity}) 50%, rgba(127,29,29,${intensity}) 100%)`,
        boxShadow: `inset 0 0 12px rgba(251,146,60,${intensity}), 0 0 15px rgba(185,28,28,${intensity * 0.8}), 0 0 25px rgba(239,68,68,${intensity * 0.4})`,
        border: `2px solid rgba(251,146,60,${intensity * 0.6})`,
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
        background: `radial-gradient(circle at 30% 30%, ${baseColor}, ${baseColor}dd)`,
        boxShadow: `inset 0 0 8px rgba(255,255,255,0.3), 0 0 6px ${baseColor}80`,
        border: `2px solid ${baseColor}cc`,
      };
    }
    
    return {};
  };

  const getJellyStyle = (): React.CSSProperties | null => {
    if (tile.jellyLayers === 0) return null;
    
    const opacity = tile.jellyLayers === 2 ? 0.9 : 0.6;
    return {
      position: 'absolute',
      inset: 0,
      background: `linear-gradient(135deg, rgba(88, 28, 135, ${opacity}) 0%, rgba(139, 69, 207, ${opacity * 0.9}) 50%, rgba(168, 85, 247, ${opacity * 0.7}) 100%)`,
      borderRadius: '8px',
      border: `2px solid rgba(88, 28, 135, ${opacity + 0.5})`,
      boxShadow: `inset 0 0 12px rgba(88, 28, 135, ${opacity * 0.6}), 0 0 10px rgba(88, 28, 135, ${opacity * 0.4})`,
      pointerEvents: 'none',
    };
  };

  const getSpecialIndicator = () => {
    if (tile.special === 'none') return null;
    
    if (tile.special === 'row_bomb') {
      return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-full h-2 bg-gradient-to-r from-transparent via-yellow-300 to-transparent rounded-full shadow-lg animate-pulse" />
          <div className="absolute w-3 h-3 bg-yellow-400 rounded-full animate-ping shadow-yellow-400/50" />
          <div className="absolute w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>
      );
    }
    
    if (tile.special === 'col_bomb') {
      return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="h-full w-2 bg-gradient-to-b from-transparent via-yellow-300 to-transparent rounded-full shadow-lg animate-pulse" />
          <div className="absolute w-3 h-3 bg-yellow-400 rounded-full animate-ping shadow-yellow-400/50" />
          <div className="absolute w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>
      );
    }
    
    if (tile.special === 'color_bomb') {
      return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-4 h-4 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 via-blue-500 to-purple-500 animate-spin shadow-lg" 
               style={{ animationDuration: '1.5s' }} />
          <div className="absolute w-2 h-2 bg-white rounded-full animate-pulse" />
        </div>
      );
    }
    
    return null;
  };

  const animationClass = tile.isExploding 
    ? 'animate-tile-explode' 
    : tile.isFalling 
    ? 'animate-tile-fall' 
    : tile.isSpawning
    ? 'animate-tile-spawn'
    : tile.special !== 'none'
    ? 'animate-float'
    : '';

  return (
    <div
      className={`relative rounded-lg cursor-pointer transition-all duration-200 ${animationClass} group`}
      style={{
        width: size,
        height: size,
        ...getBackgroundStyle(),
        transform: isSelected ? 'scale(1.15) rotate(5deg)' : 'scale(1)',
        zIndex: isSelected ? 10 : 1,
        boxShadow: isSelected 
          ? '0 0 0 4px #fbbf24, 0 8px 20px rgba(0,0,0,0.4), 0 0 30px rgba(251,191,36,0.3)' 
          : '0 3px 6px rgba(0,0,0,0.3), 0 0 15px rgba(0,0,0,0.1)',
      }}
      onClick={onClick}
    >
      {/* Jelly layer */}
      {tile.jellyLayers > 0 && <div style={getJellyStyle()!} />}
      
      {/* Gem image with sparkle effect */}
      {tile.type === 'gem' && tile.color && (
        <>
          <img
            src={GEM_IMAGES[tile.color]}
            alt={tile.color}
            className="w-full h-full object-cover rounded-lg transition-all duration-200 group-hover:scale-105"
            draggable={false}
          />
          {/* Sparkle effects */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1 right-2 w-1 h-1 bg-white rounded-full animate-ping opacity-70" style={{ animationDelay: '0s', animationDuration: '2s' }} />
            <div className="absolute top-3 left-1 w-0.5 h-0.5 bg-yellow-300 rounded-full animate-ping opacity-60" style={{ animationDelay: '0.5s', animationDuration: '2.5s' }} />
            <div className="absolute bottom-2 right-1 w-0.5 h-0.5 bg-white rounded-full animate-ping opacity-50" style={{ animationDelay: '1s', animationDuration: '3s' }} />
            <div className="absolute bottom-1 left-3 w-1 h-1 bg-yellow-200 rounded-full animate-ping opacity-80" style={{ animationDelay: '1.5s', animationDuration: '2.2s' }} />
          </div>
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
      
      {/* Magma HP indicator */}
      {tile.type === 'magma' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black/50 rounded-full px-2 py-1 backdrop-blur-sm">
            <span className="text-white font-bold text-lg drop-shadow-lg">{tile.hp}</span>
          </div>
        </div>
      )}
      
      {/* Special tile indicator */}
      {getSpecialIndicator()}
    </div>
  );
};

export default TileComponent;
