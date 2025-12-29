// End Level Modal Component for Match-3 Game

import React, { useEffect, useState } from "react";
import { Objective } from "@/game/types";

interface EndLevelModalProps {
  isOpen: boolean;
  won: boolean;
  level: number;
  score: number;
  stars: number;
  objectives: Objective[];
  onContinue: () => void;
  onRetry: () => void;
  onWatchAd: () => void;
  canWatchAd: boolean;
  adLabel?: string;
}

const EndLevelModal: React.FC<EndLevelModalProps> = ({
  isOpen,
  won,
  level,
  score,
  stars,
  objectives,
  onContinue,
  onRetry,
  onWatchAd,
  canWatchAd,
  adLabel = "Watch Ad",
}) => {
  const [showAdOption, setShowAdOption] = useState(false);

  /* ✅ FIX: keep ad option in sync every time modal opens */
  useEffect(() => {
    setShowAdOption(!won && canWatchAd);
  }, [won, canWatchAd, isOpen]);

  if (!isOpen) return null;

  const getObjectiveIcon = (type: string) => {
    switch (type) {
      case "jelly":
        return (
          <div className="w-8 h-8 rounded bg-purple-400/60 border-2 border-purple-500" />
        );
      case "stone":
        return (
          <div className="w-8 h-8 rounded bg-gradient-to-br from-gray-400 to-gray-600" />
        );
      case "magma":
        return (
          <div className="w-8 h-8 rounded bg-gradient-to-br from-red-500 to-orange-600" />
        );
      default:
        return <div className="w-8 h-8 rounded bg-yellow-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm mx-4 bg-gradient-to-br from-purple-900 to-indigo-900 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div
          className={`py-6 px-4 text-center ${
            won
              ? "bg-gradient-to-r from-yellow-500 to-orange-500"
              : "bg-gradient-to-r from-red-600 to-red-800"
          }`}
        >
          <h2 className="text-3xl font-bold text-white mb-2">
            {won ? "Level Complete!" : "Out of Moves!"}
          </h2>
          <p className="text-white/80">Level {level}</p>
        </div>

        {/* Stars */}
        {won && (
          <div className="flex justify-center gap-2 -mt-4">
            {[1, 2, 3].map((star) => (
              <div
                key={star}
                className={`w-12 h-12 ${
                  star <= stars ? "text-yellow-400" : "text-gray-600"
                }`}
                style={{
                  animation:
                    star <= stars
                      ? `bounce 0.5s ease ${star * 0.2}s infinite`
                      : "none",
                }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
            ))}
          </div>
        )}

        {/* Score */}
        <div className="text-center py-4">
          <p className="text-gray-400 text-sm">Score</p>
          <p className="text-3xl font-bold text-white">
            {score.toLocaleString()}
          </p>
        </div>

        {/* Objectives */}
        <div className="px-4 pb-4">
          <p className="text-gray-400 text-sm mb-2 text-center">
            Objectives
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            {objectives.map((obj, index) => (
              <div
                key={index}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                  obj.current >= obj.target
                    ? "bg-green-500/30"
                    : "bg-red-500/30"
                }`}
              >
                {getObjectiveIcon(obj.type)}
                <p
                  className={`font-bold ${
                    obj.current >= obj.target
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {obj.current}/{obj.target}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Watch Ad */}
        {showAdOption && (
          <div className="px-4 pb-4">
            <button
              onClick={() => {
                onWatchAd();
                setShowAdOption(false);
              }}
              className="w-full py-3 px-4 bg-gradient-to-r from_green-500 to-emerald-600 rounded-xl font-bold text-white flex items-center justify-center gap-2 hover:scale-105 transition-transform"
            >
              ▶ {adLabel}
            </button>
          </div>
        )}

        {/* Buttons */}
        <div className="px-4 pb-6 flex gap-3">
          <button
            onClick={onRetry}
            className="flex-1 py-3 px-4 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-white"
          >
            {won ? "Replay" : "Retry"}
          </button>
          <button
            onClick={onContinue}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-white hover:scale-105 transition-transform ${
              won
                ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                : "bg-gradient-to-r from-blue-500 to-indigo-600"
            }`}
          >
            {won ? "Next Level" : "Back to Map"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EndLevelModal;
