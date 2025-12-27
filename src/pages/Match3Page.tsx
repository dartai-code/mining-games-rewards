import React, { useState } from 'react';
import GameScreen from '@/components/match3/game/GameScreen';
import { useWallet } from '@/hooks/useWallet';
import { leaderboardService } from '@/services/leaderboardService';

const Match3Page: React.FC = () => {
  const { addTransaction } = useWallet();

  const [currentLevel, setCurrentLevel] = useState(() => {
    const saved = localStorage.getItem('currentLevel');
    const level = saved ? parseInt(saved, 10) : 1;
    return isNaN(level) ? 1 : Math.max(1, level);
  });

  // Save current level whenever component mounts (player enters the game)
  React.useEffect(() => {
    localStorage.setItem('currentLevel', currentLevel.toString());
  }, [currentLevel]);

  const handleLevelComplete = (level: number, stars: number, score: number) => {
    const dartPoints = Math.floor(score / 100);
    if (dartPoints > 0) {
      addTransaction('Game', dartPoints, `Match-3 game score: ${score}`);
      
      // Add to leaderboard
      const userProfile = leaderboardService.getUserProfile();
      if (userProfile) {
        leaderboardService.addScore(userProfile.username, userProfile.country, dartPoints, 'match3');
      }
    }

    // Update high score
    const gameState = JSON.parse(localStorage.getItem('gameState') || '{}');
    if (score > (gameState.highScores?.match3 || 0)) {
      gameState.highScores = gameState.highScores || { match3: 0 };
      gameState.highScores.match3 = score;
      localStorage.setItem('gameState', JSON.stringify(gameState));
    }

    // Always save the current level (player reached this level)
    localStorage.setItem('currentLevel', level.toString());

    // If won with stars, go to next level
    if (stars > 0) {
      const nextLevel = Math.min(currentLevel + 1, 100);
      setCurrentLevel(nextLevel);
      localStorage.setItem('currentLevel', nextLevel.toString());
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <GameScreen
        level={currentLevel}
        onBackToMap={() => window.history.back()}
        onLevelComplete={handleLevelComplete}
      />
    </div>
  );
};

export default Match3Page;