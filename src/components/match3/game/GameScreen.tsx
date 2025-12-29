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

  const randomMoves = () => 18 + Math.floor(Math.random() * 8); // 18-25 inclusive
  const [moves, setMoves] = useState<number>(randomMoves());
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
  const MAX_EXTRA_MOVES_ADS = 2; // Maximum 2 extra moves ads per level
  // Lives system: max 5, regen 1 every 15 minutes
  const MAX_LIVES = 5;
  const LIFE_REGEN_MS = 15 * 60 * 1000; // 15 minutes
  const LIVES_KEY = 'match3_lives';
  const LIFE_TS_KEY = 'match3_life_ts';

  const [currentLives, setCurrentLives] = useState<number>(() => {
    const stored = localStorage.getItem(LIVES_KEY);
    const lives = stored ? parseInt(stored, 10) : MAX_LIVES;
    if (!localStorage.getItem(LIFE_TS_KEY)) {
      localStorage.setItem(LIFE_TS_KEY, Date.now().toString());
    }
    return Math.min(MAX_LIVES, Math.max(0, isNaN(lives) ? MAX_LIVES : lives));
  });

  // Life regen ticker
  useEffect(() => {
    const tick = () => {
      const tsRaw = localStorage.getItem(LIFE_TS_KEY);
      const lastTs = tsRaw ? parseInt(tsRaw, 10) : Date.now();
      if (currentLives >= MAX_LIVES) {
        localStorage.setItem(LIFE_TS_KEY, Date.now().toString());
        return;
      }
      const now = Date.now();
      const elapsed = now - lastTs;
      const livesToAdd = Math.floor(elapsed / LIFE_REGEN_MS);
      if (livesToAdd > 0) {
        const newLives = Math.min(MAX_LIVES, currentLives + livesToAdd);
        setCurrentLives(newLives);
        localStorage.setItem(LIVES_KEY, newLives.toString());
        const remainder = elapsed % LIFE_REGEN_MS;
        localStorage.setItem(LIFE_TS_KEY, (now - remainder).toString());
      }
    };
    const id = setInterval(tick, 60000); // every minute
    tick();
    return () => clearInterval(id);
  }, [currentLives]);

  /* ---------------- SOUND ---------------- */
  useEffect(() => {
    soundManager.setEnabled(playerData.soundEnabled);
  }, [playerData.soundEnabled]);

  /* -------- RESET WHEN LEVEL CHANGES ------ */
  useEffect(() => {
    const config = getLevelConfig(level);
    setLevelConfig(config);
    setMoves(randomMoves()); // Limited moves per level
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
        // Lost: deduct 1 life
        setCurrentLives((l) => {
          const nl = Math.max(0, l - 1);
          localStorage.setItem(LIVES_KEY, nl.toString());
          // when losing a life, set timestamp if we were full, to start regen
          if (l === MAX_LIVES) {
            localStorage.setItem(LIFE_TS_KEY, Date.now().toString());
          }
          return nl;
        });
        setGameResult({ won: false, score: finalScore, stars: 0 });
        setShowEndModal(true);
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
      if (currentLives <= 0) {
        // Grant +1 life
        setCurrentLives((l) => {
          const nl = Math.min(MAX_LIVES, l + 1);
          localStorage.setItem(LIVES_KEY, nl.toString());
          return nl;
        });
        // Keep end modal open so user can retry
      } else {
        // Extra moves reward: add +5 moves and continue playing
        setMoves((m) => m + 5);
        setGameResult(null);
        setShowEndModal(false);
      }
    }
    setShowAdModal(false);
  }, [adBoosterType, playerData, currentLives]);
  const handleRetry = useCallback(() => {
    if (currentLives <= 0) {
      // No lives: prompt ad for +1 life
      setAdBoosterType(null);
      setShowAdModal(true);
      return;
    }
    const config = getLevelConfig(level);
    setLevelConfig(config);
    setMoves(randomMoves()); // Limited moves per level
    setScore(0);
    setObjectives(config.objectives.map((o) => ({ ...o })));
    setActiveBooster(null);
    setGameResult(null);
    setShowEndModal(false);
    setGameKey((k) => k + 1);
  }, [level, currentLives]);

  const handleContinue = useCallback(() => {
    if (gameResult) {
      onLevelComplete(level, gameResult.stars, gameResult.score);
    }
    setShowEndModal(false);
  }, [gameResult, level, onLevelComplete]);

  const handleWatchAd = useCallback(() => {
    // Only allow watching rewarded ads for extra moves when moves are limited.
    if (adsWatched < MAX_EXTRA_MOVES_ADS && Number.isFinite(moves)) {
      setAdsWatched((a) => a + 1);
      setShowAdModal(true);
      setShowEndModal(false);
      setGameResult(null);
    }
  }, [adsWatched, moves]);

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
        moves={moves}
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
          movesRemaining={moves}
          onMoveMade={() => setMoves((m) => Math.max(0, m - 1))}
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
        canWatchAd={(adsWatched < MAX_EXTRA_MOVES_ADS && Number.isFinite(moves)) || currentLives <= 0}
        adLabel={currentLives <= 0 ? "Watch Ad +1 Life" : `Watch Ad +5 Moves (${MAX_EXTRA_MOVES_ADS - adsWatched} left)`}
      />

      {/* REWARDED AD MODAL */}
      <RewardedAdModal
        open={showAdModal}
        onClose={() => { setShowAdModal(false); setAdBoosterType(null); }}
        onRewardGranted={handleAdRewardGranted}
        title={adBoosterType ? `Refill ${adBoosterType.replace('_', ' ')}` : (currentLives <= 0 ? "Watch Ad +1 Life" : "Watch Ad +5 Moves")}
        description={adBoosterType ? `Refill ${adBoosterType.replace('_', ' ')} (Ad)` : (currentLives <= 0 ? "Watch Ad +1 Life" : "Watch Ad +5 Moves")}
      />
    </div>
  );
};

export default GameScreen;