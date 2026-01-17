import React, { useState, useEffect } from "react";
import { Play, Heart, Trophy, Medal, Layers, Mountain } from "lucide-react";
import { useWallet } from "../hooks/useWallet";
import { leaderboardService } from "../services/leaderboardService";
import { useNavigate } from "react-router-dom";
import { RewardedAdModal } from "./RewardedAdModal";
import { BannerAd } from "./BannerAd";

const MAX_LIVES = 5;
const LIFE_REFILL_MS = 10 * 60 * 1000; // 10 minutes

interface HighScores {
  jumpClimb: number;
  stackTower: number;
}

interface GameState {
  highScores: HighScores;
}

const GamesTab: React.FC = () => {
  const navigate = useNavigate();
  const { addTransaction } = useWallet();
  const userProfile = leaderboardService.getUserProfile();

  const [showRankModal, setShowRankModal] = useState(false);
  const [rankPeriod, setRankPeriod] = useState<"daily" | "weekly" | "monthly">("weekly");

  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem("gameState");
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        highScores: parsed.highScores ?? { jumpClimb: 0, stackTower: 0 },
      };
    }
    return {
      highScores: { jumpClimb: 0, stackTower: 0 },
    };
  });

  useEffect(() => {
    localStorage.setItem("gameState", JSON.stringify(gameState));
  }, [gameState]);

  // Jump Climb lives
  const [jumpClimbLives, setJumpClimbLives] = useState<number>(() => {
    const stored = localStorage.getItem('jumpclimb_lives');
    const lives = stored ? parseInt(stored, 10) : 10;
    return Math.min(10, Math.max(0, isNaN(lives) ? 10 : lives));
  });

  useEffect(() => {
    const checkJumpClimbLives = () => {
      const stored = localStorage.getItem('jumpclimb_lives');
      const lives = stored ? parseInt(stored, 10) : 10;
      const validLives = Math.min(10, Math.max(0, isNaN(lives) ? 10 : lives));
      setJumpClimbLives(validLives);
    };
    
    checkJumpClimbLives();
    const interval = setInterval(checkJumpClimbLives, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Stack Tower lives
  const [stackTowerLives, setStackTowerLives] = useState<number>(() => {
    const stored = localStorage.getItem('stacktower_lives');
    const lives = stored ? parseInt(stored, 10) : 10;
    return Math.min(10, Math.max(0, isNaN(lives) ? 10 : lives));
  });

  useEffect(() => {
    const checkStackTowerLives = () => {
      const stored = localStorage.getItem('stacktower_lives');
      const lives = stored ? parseInt(stored, 10) : 10;
      const validLives = Math.min(10, Math.max(0, isNaN(lives) ? 10 : lives));
      setStackTowerLives(validLives);
    };
    
    checkStackTowerLives();
    const interval = setInterval(checkStackTowerLives, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const userRank = userProfile
    ? leaderboardService.getUserRank(userProfile.username, rankPeriod)
    : null;

  return (
    <div className="flex flex-col min-h-screen bg-gray-950 text-white pb-20">
      <div className="p-6 space-y-6">

        <h1 className="text-center text-2xl font-bold">Games</h1>
        <p className="text-center text-gray-400">Play & Earn Darts</p>

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

        {/* JUMP CLIMB GAME CARD */}
        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 flex items-center gap-4">
          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <Mountain className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Jump Climb</h3>
            <p className="text-gray-400 text-xs">Climb to the top! Don't fall!</p>
            <p className="text-green-400 text-xs">Earn Darts</p>

            {gameState.highScores.jumpClimb > 0 && (
              <p className="text-orange-400 text-xs mt-1">
                Best: Floor {gameState.highScores.jumpClimb}
              </p>
            )}
            
            <div className="flex items-center gap-1 mt-1">
              <Heart size={14} className="text-red-500" />
              <span className="text-white text-xs font-semibold">{jumpClimbLives}/10</span>
            </div>
          </div>

          <button
            onClick={() => {
              if (!userProfile) {
                alert("Please login to play.");
              } else if (jumpClimbLives <= 0) {
                alert('No lives left! Wait for refill or watch an ad in the game.');
              } else {
                navigate('/jump-climb');
              }
            }}
            className="bg-blue-600 px-4 py-2 rounded-xl flex items-center gap-2 font-semibold"
          >
            <Play size={16} /> Play
          </button>
        </div>

        {/* STACK TOWER GAME CARD */}
        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 flex items-center gap-4">
          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Layers className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Stack Tower</h3>
            <p className="text-gray-400 text-xs">Stack blocks perfectly!</p>
            <p className="text-green-400 text-xs">Earn Darts</p>

            {gameState.highScores.stackTower > 0 && (
              <p className="text-orange-400 text-xs mt-1">
                Best: {gameState.highScores.stackTower} blocks
              </p>
            )}
            
            <div className="flex items-center gap-1 mt-1">
              <Heart size={14} className="text-red-500" />
              <span className="text-white text-xs font-semibold">{stackTowerLives}/10</span>
            </div>
          </div>

          <button
            onClick={() => {
              if (stackTowerLives <= 0) {
                alert('No lives left! Wait for refill or watch an ad in the game.');
              } else {
                navigate('/stack-tower');
              }
            }}
            className="bg-purple-600 px-4 py-2 rounded-xl flex items-center gap-2 font-semibold"
          >
            <Layers size={16} /> Play
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
      
      {/* Banner Ad */}
      <div className="px-6 pb-4">
        <BannerAd className="mt-4" />
      </div>
    </div>
  );
};

export default GamesTab;