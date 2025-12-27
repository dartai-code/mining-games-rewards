// Game Screen Component for Match-3 Game

import React, { useState, useCallback, useEffect } from "react";
import GameBoard from "./GameBoard";
import TopHUD from "./TopHUD";
import BoosterBar from "./BoosterBar";
import EndLevelModal from "./EndLevelModal";

import { Objective, BoosterType, PlayerData, LevelConfig } from "@/game/types";
import { getLevelConfig } from "@/game/levelGenerator";
import {
  loadPlayerData,
  savePlayerData,
  completeLevel,
  consumeBooster,
} from "@/game/storage";
import { soundManager } from "@/game/sounds";
import { calculateStars } from "@/game/engine";
import { RewardedAdModal } from "../../RewardedAdModal";

interface GameScreenProps {
  level: number;
  onBackToMap: () => void;
  onLevelComplete: (level: number, stars: number, score: number) => void;
}

const GameScreen: React.FC<GameScreenProps> = ({
  level,
  onBackToMap,
  onLevelComplete,
}) => {
  const [levelConfig, setLevelConfig] = useState<LevelConfig>(() =>
    getLevelConfig(level)
  );
  const [playerData, setPlayerData] = useState<PlayerData>(() =>
    loadPlayerData()
  );

  const [moves, setMoves] = useState(Infinity); // Unlimited moves with life system
  const [score, setScore] = useState(0);
  const [objectives, setObjectives] = useState<Objective[]>(
    levelConfig.objectives
  );

  const [activeBooster, setActiveBooster] =
    useState<BoosterType | null>(null);

  const [showEndModal, setShowEndModal] = useState(false);
  const [gameResult, setGameResult] = useState<{
    won: boolean;
    score: number;
    stars: number;
  } | null>(null);

  const [adsWatched, setAdsWatched] = useState(0);
  const [extraMoves, setExtraMoves] = useState(0);
  const [gameKey, setGameKey] = useState(0);
  const [showAdModal, setShowAdModal] = useState(false);
  const [adBoosterType, setAdBoosterType] = useState<BoosterType | null>(null);
  const [currentLives, setCurrentLives] = useState(() => {
    const saved = localStorage.getItem("gameState");
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.lives ?? 5;
    }
    return 5;
  });

  // Update lives when localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem("gameState");
      if (saved) {
        const parsed = JSON.parse(saved);
        setCurrentLives(parsed.lives ?? 5);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  /* ---------------- SOUND ---------------- */
  useEffect(() => {
    soundManager.setEnabled(playerData.soundEnabled);
  }, [playerData.soundEnabled]);

  /* -------- RESET WHEN LEVEL CHANGES ------ */
  useEffect(() => {
    const config = getLevelConfig(level);
    setLevelConfig(config);
    setMoves(Infinity); // Unlimited moves
    setScore(0);
    setObjectives(config.objectives.map((o) => ({ ...o })));
    setActiveBooster(null);
    setAdsWatched(0);
    setExtraMoves(0);
    setGameResult(null);
    setShowEndModal(false);
    setGameKey((k) => k + 1);
  }, [level]);

  /* -------- GAME END (NO NAVIGATION) ------- */
  const handleGameEnd = useCallback(
    (won: boolean, finalScore: number) => {
      if (won) {
        const stars = calculateStars(finalScore, level);
        completeLevel(level, stars, finalScore);
        setGameResult({ won, score: finalScore, stars });
        setShowEndModal(true);
      } else {
        // Lost: offer ad for +5 moves
        setShowAdModal(true);
      }
    },
    [level]
  );

  /* ---------- MODAL ACTIONS ---------- */
  const handleBoosterAdRequest = useCallback((type: BoosterType) => {
    setAdBoosterType(type);
    setShowAdModal(true);
  }, []);
  const handleAdRewardGranted = useCallback(() => {
    if (adBoosterType) {
      // Refill the booster
      const updated = { ...playerData };
      updated.boosters[adBoosterType] = (updated.boosters[adBoosterType] || 0) + 3; // Give 3 uses
      setPlayerData(updated);
      savePlayerData(updated);
      setAdBoosterType(null);
    } else {
      // For life system, ad allows continue (shuffle board)
      setGameResult(null);
      setShowEndModal(false);
      // Trigger board shuffle by resetting game key
      setGameKey((k) => k + 1);
    }
    setShowAdModal(false);
  }, [adBoosterType, playerData]);
  const handleRetry = useCallback(() => {
    const config = getLevelConfig(level);
    setLevelConfig(config);
    setMoves(Infinity); // Unlimited moves
    setScore(0);
    setObjectives(config.objectives.map((o) => ({ ...o })));
    setActiveBooster(null);
    setGameResult(null);
    setShowEndModal(false);
    setGameKey((k) => k + 1);
  }, [level]);

  const handleContinue = useCallback(() => {
    if (gameResult) {
      onLevelComplete(level, gameResult.stars, gameResult.score);
    }
    setShowEndModal(false);
  }, [gameResult, level, onLevelComplete]);

  const handleWatchAd = useCallback(() => {
    if (adsWatched < 2) {
      setAdsWatched((a) => a + 1);
      setShowAdModal(true);
      setShowEndModal(false);
      setGameResult(null);
    }
  }, [adsWatched]);

  /* -------- HUD / BOOSTERS -------- */
  const handleSoundToggle = useCallback(() => {
    const enabled = !playerData.soundEnabled;
    soundManager.setEnabled(enabled);
    const updated = { ...playerData, soundEnabled: enabled };
    setPlayerData(updated);
    savePlayerData(updated);
    soundManager.click();
  }, [playerData]);

  const handleBoosterSelect = useCallback((type: BoosterType | null) => {
    soundManager.click();
    setActiveBooster(type);
  }, []);

  const handleBoosterUsed = useCallback(() => {
    if (!activeBooster) return;
    const updated = consumeBooster(activeBooster);
    if (updated) setPlayerData(updated);
    setActiveBooster(null);
  }, [activeBooster]);

  const handleClose = useCallback(() => {
    soundManager.click();
    onBackToMap();
  }, [onBackToMap]);

  /* ---------------- UI ---------------- */
  return (
    <div className="fixed inset-0 flex flex-col bg-gradient-to-b from-indigo-900 via-purple-900 to-pink-900 z-50">
      <TopHUD
        level={level}
        lives={currentLives}
        score={score}
        objectives={objectives}
        soundEnabled={playerData.soundEnabled}
        onSoundToggle={handleSoundToggle}
        onClose={handleClose}
      />

      <div className="flex-1 flex items-center justify-center p-2">
        <GameBoard
          key={gameKey}
          levelConfig={levelConfig}
          onGameEnd={handleGameEnd}
          onScoreChange={setScore}
          onObjectivesChange={setObjectives}
          activeBooster={activeBooster}
          onBoosterUsed={handleBoosterUsed}
          extraMoves={extraMoves}
        />
      </div>

      <BoosterBar
        boosters={playerData.boosters}
        activeBooster={activeBooster}
        onBoosterSelect={handleBoosterSelect}
        onAdRequest={handleBoosterAdRequest}
      />

      <EndLevelModal
        isOpen={showEndModal}
        won={gameResult?.won ?? false}
        level={level}
        score={gameResult?.score ?? 0}
        stars={gameResult?.stars ?? 0}
        objectives={objectives}
        onContinue={handleContinue}
        onRetry={handleRetry}
        onWatchAd={handleWatchAd}
        canWatchAd={adsWatched < 2}
      />

      {/* REWARDED AD MODAL */}
      <RewardedAdModal
        open={showAdModal}
        onClose={() => { setShowAdModal(false); setAdBoosterType(null); }}
        onRewardGranted={handleAdRewardGranted}
        title={adBoosterType ? `Refill ${adBoosterType.replace('_', ' ')}` : "Shuffle Board"}
        description={adBoosterType ? `Watch a short video ad to get 3 uses of ${adBoosterType.replace('_', ' ')}!` : "Watch a short video ad to shuffle the board and continue playing!"}
      />
    </div>
  );
};

export default GameScreen;