import React, { useState, useEffect } from "react";
import { Play, Heart, Trophy, Medal, Target } from "lucide-react";
import { useWallet } from "../hooks/useWallet";
import { leaderboardService } from "../services/leaderboardService";
import { useNavigate } from "react-router-dom";
import { RewardedAdModal } from "./RewardedAdModal";

const MAX_LIVES = 5;
const LIFE_REFILL_MS = 10 * 60 * 1000; // 10 minutes

interface HighScores {
  match3: number;
  bullseye: number;
}

interface GameState {
  lives: number;
  highScores: HighScores;
  lastLifeRefill: number;
}

const GamesTab: React.FC = () => {
  const navigate = useNavigate();
  const { addTransaction } = useWallet();
  const userProfile = leaderboardService.getUserProfile();

  const [showRankModal, setShowRankModal] = useState(false);
  const [rankPeriod, setRankPeriod] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [showAdModal, setShowAdModal] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(() => {
    const saved = localStorage.getItem('currentLevel');
    return saved ? parseInt(saved, 10) : 1;
  });

  // Sync current level with localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('currentLevel');
      const level = saved ? parseInt(saved, 10) : 1;
      setCurrentLevel(level);
    };

    // Listen for storage changes
    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically in case of same-tab updates
    const interval = setInterval(() => {
      const saved = localStorage.getItem('currentLevel');
      const level = saved ? parseInt(saved, 10) : 1;
      setCurrentLevel(prev => prev !== level ? level : prev);
    }, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem("gameState");
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        lives: parsed.lives ?? MAX_LIVES,
        highScores: parsed.highScores ?? { match3: 0, bullseye: 0 },
        lastLifeRefill: parsed.lastLifeRefill ?? Date.now(),
      };
    }
    return {
      lives: MAX_LIVES,
      highScores: { match3: 0, bullseye: 0 },
      lastLifeRefill: Date.now(),
    };
  });

  useEffect(() => {
    localStorage.setItem("gameState", JSON.stringify(gameState));
  }, [gameState]);

  useEffect(() => {
    const id = setInterval(() => {
      setGameState((prev) => {
        if (prev.lives >= MAX_LIVES) return prev;

        const now = Date.now();
        const elapsed = now - prev.lastLifeRefill;

        if (elapsed < LIFE_REFILL_MS) return prev;

        const refillCount = Math.floor(elapsed / LIFE_REFILL_MS);
        const newLives = Math.min(MAX_LIVES, prev.lives + refillCount);

        return {
          ...prev,
          lives: newLives,
          lastLifeRefill: now,
        };
      });
    }, 1000);

    return () => clearInterval(id);
  }, []);

  const playMatch3 = () => {
    if (!userProfile) {
      alert("Please login to play.");
      return;
    }

    if (gameState.lives <= 0) {
      setShowAdModal(true);
      return;
    }

    // Consume one life
    setGameState(prev => ({ ...prev, lives: prev.lives - 1 }));

    navigate("/match3");
  };

  const handleAdRewardGranted = () => {
    setGameState(prev => ({ ...prev, lives: MAX_LIVES, lastLifeRefill: Date.now() }));
  };

  const userRank = userProfile
    ? leaderboardService.getUserRank(userProfile.username, rankPeriod)
    : null;

  return (
    <div className="flex flex-col min-h-screen bg-gray-950 text-white pb-20">
      <div className="p-6 space-y-6">

        <h1 className="text-center text-2xl font-bold">Games</h1>
        <p className="text-center text-gray-400">Play & earn Dart AI Gold.</p>

        {/* USER CARD */}
        {userProfile && (
          <div className="bg-gradient-to-r from-green-400/20 to-orange-400/20 rounded-2xl p-4 border border-green-400/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-400 to-orange-400 flex items-center justify-center">
                  <span className="font-bold">{userProfile.username[0].toUpperCase()}</span>
                </div>
                <div>
                  <p className="font-semibold">{userProfile.username}</p>
                  <p className="text-xs text-gray-400">{userProfile.country}</p>
                </div>
              </div>
              <button
                onClick={() => setShowRankModal(true)}
                className="bg-green-500 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
              >
                <Trophy size={16} /> Rank
              </button>
            </div>
          </div>
        )}

        {/* Lives */}
        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 flex justify-between">
          <div className="flex items-center gap-2">
            <Heart className="text-red-400" size={20} />
            <span className="font-semibold">Lives</span>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: MAX_LIVES }).map((_, i) => (
              <Heart
                key={i}
                size={16}
                className={i < gameState.lives ? "text-red-400 fill-current" : "text-gray-600"}
              />
            ))}
          </div>
        </div>

        {/* ONLY ONE GAME CARD */}
        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 flex items-center gap-4">
          <img
            src="https://d64gsuwffb70l.cloudfront.net/68d5295ba44799c71a50ece8_1758800341453_450a9ef5.webp"
            className="w-16 h-16 rounded-lg"
          />
          <div className="flex-1">
            <h3 className="font-semibold">Match-3 Gems - Level {currentLevel}</h3>
            <p className="text-gray-400 text-xs">Match tiles & score big!</p>
            <p className="text-green-400 text-xs">Dart AI Gold Rewards</p>

            {gameState.highScores.match3 > 0 && (
              <p className="text-orange-400 text-xs mt-1">
                Best: {gameState.highScores.match3}
              </p>
            )}
          </div>

          <button
            onClick={playMatch3}
            className="bg-green-600 px-4 py-2 rounded-xl flex items-center gap-2 font-semibold"
          >
            <Play size={16} /> Play
          </button>
        </div>

        {/* DART GAME CARD */}
        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 flex items-center gap-4">
          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-red-500 to-yellow-500 flex items-center justify-center">
            <Target className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Bullseye</h3>
            <p className="text-gray-400 text-xs">Hit the bullseye!</p>
            <p className="text-green-400 text-xs">Dart AI Gold Rewards</p>

            {(() => {
              const bullseyeLevel = localStorage.getItem('bullseyeLevel');
              const currentLevel = bullseyeLevel ? parseInt(bullseyeLevel, 10) : 1;
              return (
                <p className="text-orange-400 text-xs mt-1">
                  Level: {currentLevel}
                  {gameState.highScores.bullseye > 0 && ` | Best: ${gameState.highScores.bullseye}`}
                </p>
              );
            })()}
          </div>

          <button
            onClick={() => navigate('/dart')}
            className="bg-red-600 px-4 py-2 rounded-xl flex items-center gap-2 font-semibold"
          >
            <Target size={16} /> Play
          </button>
        </div>
      </div>

      {/* RANK MODAL */}
      {showRankModal && userProfile && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-6">
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700 max-w-sm w-full text-center">
            <Medal className="w-14 h-14 text-orange-400 mx-auto mb-4" />

            <h3 className="font-bold text-lg">{userProfile.username}</h3>

            {userRank ? (
              <>
                <p className="text-green-400 text-3xl font-bold mt-2">#{userRank.rank}</p>
                <p className="text-gray-400 capitalize">{rankPeriod} Rank</p>
                <p className="mt-2 font-semibold">{userRank.score} DART</p>
              </>
            ) : (
              <p className="text-gray-400">Play to rank!</p>
            )}

            <button
              onClick={() => setShowRankModal(false)}
              className="w-full bg-gray-700 py-3 rounded-xl font-semibold mt-4"
            >
              Close
            </button>
          </div>
        </div>
      )}
      <RewardedAdModal open={showAdModal} onClose={() => setShowAdModal(false)} onRewardGranted={handleAdRewardGranted} title="Refill Lives" description="Watch a short video ad to refill your lives and continue playing!" />
    </div>
  );
};

export default GamesTab;