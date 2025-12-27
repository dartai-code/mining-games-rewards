// src/components/Bullseye.tsx
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Target, Trophy, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import { leaderboardService } from '../services/leaderboardService';
import { RewardedAdModal } from './RewardedAdModal';

interface BullseyeProps {
  onGameComplete?: (score: number, stars: number) => void;
}

interface Dart {
  x: number;
  y: number;
  score: number;
  ring: string;
  isFlying?: boolean;
  flyProgress?: number;
  startX?: number;
  startY?: number;
}

interface ScorePopup {
  id: number;
  x: number;
  y: number;
  score: number;
  ring: string;
  progress: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

interface GameState {
  score: number;
  darts: Dart[];
  currentDart: number;
  level: number;
  boardRotation: number;
  isThrowing: boolean;
  gameStarted: boolean;
  gameEnded: boolean;
}

const DARTBOARD_SEGMENTS = [
  { angle: 0, score: 20, color: 'red' },
  { angle: 18, score: 1, color: 'white' },
  { angle: 36, score: 18, color: 'red' },
  { angle: 54, score: 4, color: 'white' },
  { angle: 72, score: 13, color: 'red' },
  { angle: 90, score: 6, color: 'white' },
  { angle: 108, score: 10, color: 'red' },
  { angle: 126, score: 15, color: 'white' },
  { angle: 144, score: 2, color: 'red' },
  { angle: 162, score: 17, color: 'white' },
  { angle: 180, score: 3, color: 'red' },
  { angle: 198, score: 19, color: 'white' },
  { angle: 216, score: 7, color: 'red' },
  { angle: 234, score: 16, color: 'white' },
  { angle: 252, score: 8, color: 'red' },
  { angle: 270, score: 11, color: 'white' },
  { angle: 288, score: 14, color: 'red' },
  { angle: 306, score: 9, color: 'white' },
  { angle: 324, score: 12, color: 'red' },
  { angle: 342, score: 5, color: 'white' },
];

const Bullseye: React.FC<BullseyeProps> = ({ onGameComplete }) => {
  const navigate = useNavigate();
  const { addTransaction } = useWallet();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  const [gameState, setGameState] = useState<GameState>(() => {
    const savedLevel = localStorage.getItem('bullseyeLevel');
    const currentLevel = savedLevel ? parseInt(savedLevel, 10) : 1;

    return {
      score: 0,
      darts: [],
      currentDart: 0,
      level: currentLevel,
      boardRotation: 0,
      isThrowing: false,
      gameStarted: false,
      gameEnded: false,
    };
  });

  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds per level
  const [showInstructions, setShowInstructions] = useState(true);
  const [scorePopups, setScorePopups] = useState<ScorePopup[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [nextPopupId, setNextPopupId] = useState(0);
  const [nextParticleId, setNextParticleId] = useState(0);
  const [showAdModal, setShowAdModal] = useState(false);

  const endGame = () => {
    setGameState(prev => {
      const targetScore = prev.level * 50;
      const levelCompleted = prev.score >= targetScore;
      let newLevel = prev.level;

      // Save level progress if completed
      if (levelCompleted) {
        if (prev.level < 100) {
          newLevel = prev.level + 1;
          localStorage.setItem('bullseyeLevel', newLevel.toString());
        }
        // If level >= 100, stay at 100 (already mastered)
      }

      return { ...prev, gameEnded: true, level: newLevel };
    });

    // Get the final game state for calculations
    const finalTargetScore = gameState.level * 50;
    const levelCompleted = gameState.score >= finalTargetScore;

    // Calculate stars based on performance
    let stars = 0;
    const percentage = (gameState.score / finalTargetScore) * 100;

    if (percentage >= 80) stars = 3;
    else if (percentage >= 60) stars = 2;
    else if (percentage >= 40) stars = 1;

    // Award DART points
    const dartPoints = Math.floor(gameState.score / 10);
    if (dartPoints > 0) {
      addTransaction('Bullseye', dartPoints, `Bullseye level ${gameState.level}: ${gameState.score} points`);

      // Add to leaderboard
      const userProfile = leaderboardService.getUserProfile();
      if (userProfile) {
        leaderboardService.addScore(userProfile.username, userProfile.country, dartPoints, 'bullseye');
      }
    }

    // Update high score
    const savedGameState = JSON.parse(localStorage.getItem('gameState') || '{}');
    if (gameState.score > (savedGameState.highScores?.bullseye || 0)) {
      savedGameState.highScores = savedGameState.highScores || { match3: 0, bullseye: 0 };
      savedGameState.highScores.bullseye = gameState.score;
      localStorage.setItem('gameState', JSON.stringify(savedGameState));
    }

    if (onGameComplete) {
      onGameComplete(gameState.score, stars);
    }
  };

  // Timer effect
  useEffect(() => {
    if (!gameState.gameStarted || gameState.gameEnded) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState.gameStarted, gameState.gameEnded, endGame]);

  // Call endGame when game ends (not by timer)
  useEffect(() => {
    if (gameState.gameEnded && gameState.gameStarted && timeLeft > 0) {
      endGame();
    }
  }, [gameState.gameEnded, gameState.gameStarted, timeLeft, endGame]);

  // Particle animation
  useEffect(() => {
    if (particles.length === 0) return;

    const animateParticles = () => {
      setParticles(prev => prev
        .map(particle => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          vy: particle.vy + 0.1, // gravity
          life: particle.life - 1
        }))
        .filter(particle => particle.life > 0)
      );
    };

    const interval = setInterval(animateParticles, 16); // ~60fps
    return () => clearInterval(interval);
  }, [particles.length]);

  // Score popup animation
  useEffect(() => {
    if (scorePopups.length === 0) return;

    const animatePopups = () => {
      setScorePopups(prev => prev
        .map(popup => ({
          ...popup,
          progress: popup.progress + 0.02
        }))
        .filter(popup => popup.progress < 1)
      );
    };

    const interval = setInterval(animatePopups, 16);
    return () => clearInterval(interval);
  }, [scorePopups.length]);

  // Board rotation animation
  useEffect(() => {
    if (!gameState.gameStarted || gameState.gameEnded) return;

    const animateRotation = () => {
      setGameState(prev => ({
        ...prev,
        boardRotation: (prev.boardRotation + (1 + prev.level * 0.5)) % 360 // Faster rotation with level
      }));
    };

    const interval = setInterval(animateRotation, 16); // ~60fps
    return () => clearInterval(interval);
  }, [gameState.gameStarted, gameState.gameEnded, gameState.level]);

  const calculateScore = (x: number, y: number): { score: number; ring: string } => {
    const centerX = 200;
    const centerY = 200;
    const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);

    // Bullseye
    if (distance <= 12.7) return { score: 50, ring: 'bullseye' };
    if (distance <= 31.8) return { score: 25, ring: 'outer-bull' };

    // Rings
    let ring = 'single';
    if (distance > 170 && distance <= 190) ring = 'triple';
    else if (distance > 107 && distance <= 127) ring = 'double';
    else if (distance > 190) return { score: 0, ring: 'miss' };

    // Calculate angle and segment
    const angle = (Math.atan2(y - centerY, x - centerX) * 180 / Math.PI + 360) % 360;
    const adjustedAngle = (angle - gameState.boardRotation + 360) % 360;

    const segmentIndex = Math.floor(adjustedAngle / 18);
    const baseScore = DARTBOARD_SEGMENTS[segmentIndex]?.score || 0;

    let multiplier = 1;
    if (ring === 'double') multiplier = 2;
    else if (ring === 'triple') multiplier = 3;

    return { score: baseScore * multiplier, ring };
  };

  const throwDart = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!gameState.gameStarted || gameState.gameEnded || gameState.isThrowing || gameState.currentDart >= 3) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const targetX = event.clientX - rect.left;
    const targetY = event.clientY - rect.top;

    // Start position (from bottom center)
    const startX = 200;
    const startY = 380;

    // Create flying dart
    const flyingDart: Dart = {
      x: targetX,
      y: targetY,
      score: 0,
      ring: '',
      isFlying: true,
      flyProgress: 0,
      startX,
      startY
    };

    setGameState(prev => ({
      ...prev,
      darts: [...prev.darts, flyingDart],
      isThrowing: true
    }));

    // Animate dart flight
    let progress = 0;
    const animateFlight = () => {
      progress += 0.05; // Speed of flight

      if (progress >= 1) {
        // Dart has landed
        const { score, ring } = calculateScore(targetX, targetY);

        // Create score popup
        const popup: ScorePopup = {
          id: nextPopupId,
          x: targetX,
          y: targetY,
          score,
          ring,
          progress: 0
        };
        setScorePopups(prev => [...prev, popup]);
        setNextPopupId(id => id + 1);

        // Create particles for bullseye
        if (score === 50 || score === 25) {
          createParticles(targetX, targetY, score === 50 ? '#FFD700' : '#FF6B6B');
        }

        setGameState(prev => {
          const newDarts = prev.darts.map(dart =>
            dart.isFlying ? { ...dart, isFlying: false, score, ring } : dart
          );
          const newScore = prev.score + score;
          const newCurrentDart = prev.currentDart + 1;

          // Check win condition based on level
          const targetScore = prev.level * 50; // Level 1: 50, Level 2: 100, etc.
          let gameEnded = false;

          if (newScore >= targetScore) {
            gameEnded = true; // Level completed - end game immediately
          } else if (newCurrentDart >= 3) {
            gameEnded = true; // All darts thrown
          }

          return {
            ...prev,
            darts: newDarts,
            score: newScore,
            currentDart: newCurrentDart,
            isThrowing: false,
            gameEnded,
          };
        });
      } else {
        // Update flying dart position
        setGameState(prev => ({
          ...prev,
          darts: prev.darts.map(dart =>
            dart.isFlying
              ? {
                  ...dart,
                  flyProgress: progress,
                  x: startX + (targetX - startX) * progress,
                  y: startY + (targetY - startY) * progress
                }
              : dart
          )
        }));
        requestAnimationFrame(animateFlight);
      }
    };

    requestAnimationFrame(animateFlight);
  };

  const createParticles = (x: number, y: number, color: string) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 15; i++) {
      newParticles.push({
        id: nextParticleId + i,
        x,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 60,
        maxLife: 60,
        color
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
    setNextParticleId(id => id + 15);
  };

  const startGame = () => {
    const savedLevel = localStorage.getItem('bullseyeLevel');
    const currentLevel = savedLevel ? parseInt(savedLevel, 10) : 1;

    setGameState(prev => ({
      ...prev,
      score: 0,
      darts: [],
      currentDart: 0,
      level: currentLevel,
      boardRotation: 0,
      isThrowing: false,
      gameStarted: true,
      gameEnded: false,
    }));
    setTimeLeft(60);
    setShowInstructions(false);
    setScorePopups([]);
    setParticles([]);
  };

  const resetGame = () => {
    const savedLevel = localStorage.getItem('bullseyeLevel');
    const currentLevel = savedLevel ? parseInt(savedLevel, 10) : 1;

    setGameState({
      score: 0,
      darts: [],
      currentDart: 0,
      level: currentLevel,
      boardRotation: 0,
      isThrowing: false,
      gameStarted: false,
      gameEnded: false,
    });
    setTimeLeft(60);
    setShowInstructions(true);
  };

  const handleAdRewardGranted = () => {
    // Give 3 extra darts by resetting the dart counter
    setGameState(prev => ({
      ...prev,
      currentDart: 0, // Reset to 0 so player can throw 3 more darts
    }));
  };

  const drawDartboard = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    ctx.translate(200, 200);
    ctx.rotate((gameState.boardRotation * Math.PI) / 180);
    ctx.translate(-200, -200);

    // Add glow effect
    ctx.shadowColor = '#4ADE80';
    ctx.shadowBlur = 10;

    // Draw segments with better colors
    DARTBOARD_SEGMENTS.forEach((segment, index) => {
      const startAngle = (segment.angle * Math.PI) / 180;
      const endAngle = ((segment.angle + 18) * Math.PI) / 180;

      ctx.beginPath();
      ctx.moveTo(200, 200);
      ctx.arc(200, 200, 190, startAngle, endAngle);
      ctx.closePath();

      // Enhanced colors
      const colors = {
        red: '#DC2626',
        white: '#F8FAFC'
      };
      ctx.fillStyle = colors[segment.color as keyof typeof colors] || segment.color;
      ctx.fill();
      ctx.strokeStyle = '#1F2937';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    ctx.shadowBlur = 0; // Reset shadow

    // Draw rings with better styling
    const rings = [
      { radius: 190, color: '#000', width: 2 },
      { radius: 170, color: '#EF4444', width: 6 }, // Triple - red
      { radius: 162, color: '#000', width: 2 },
      { radius: 127, color: '#3B82F6', width: 6 }, // Double - blue
      { radius: 119, color: '#000', width: 2 },
      { radius: 31.8, color: '#10B981', width: 4 }, // Outer bull - green
      { radius: 12.7, color: '#F59E0B', width: 4 }, // Bullseye - gold
    ];

    rings.forEach(ring => {
      ctx.beginPath();
      ctx.arc(200, 200, ring.radius, 0, 2 * Math.PI);
      ctx.strokeStyle = ring.color;
      ctx.lineWidth = ring.width;
      ctx.stroke();
    });

    // Draw numbers
    ctx.fillStyle = '#000';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    DARTBOARD_SEGMENTS.forEach((segment, index) => {
      const angle = (segment.angle + 9) * Math.PI / 180; // Center of segment
      const radius = 145;
      const x = 200 + Math.cos(angle) * radius;
      const y = 200 + Math.sin(angle) * radius;

      ctx.fillText(segment.score.toString(), x, y);
    });

    ctx.restore();
  };

  const drawDarts = (ctx: CanvasRenderingContext2D) => {
    gameState.darts.forEach((dart, index) => {
      if (dart.isFlying) {
        // Draw flying dart with trail
        ctx.save();
        ctx.globalAlpha = 0.7;

        // Draw trail
        const trailLength = 10;
        for (let i = 0; i < trailLength; i++) {
          const trailProgress = (dart.flyProgress || 0) - (i / trailLength) * 0.3;
          if (trailProgress > 0) {
            const trailX = (dart.startX || 200) + ((dart.x - (dart.startX || 200)) * trailProgress);
            const trailY = (dart.startY || 380) + ((dart.y - (dart.startY || 380)) * trailProgress);
            ctx.globalAlpha = 0.7 * (1 - i / trailLength);
            ctx.beginPath();
            ctx.arc(trailX, trailY, 2, 0, 2 * Math.PI);
            ctx.fillStyle = '#ff0000';
            ctx.fill();
          }
        }

        ctx.globalAlpha = 1;
        ctx.restore();
      }

      // Draw dart
      ctx.beginPath();
      ctx.arc(dart.x, dart.y, 3, 0, 2 * Math.PI);
      ctx.fillStyle = '#ff0000';
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw score text for landed darts
      if (!dart.isFlying && dart.score > 0) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeText(dart.score.toString(), dart.x + 5, dart.y - 5);
        ctx.fillText(dart.score.toString(), dart.x + 5, dart.y - 5);
      }
    });
  };

  const drawScorePopups = (ctx: CanvasRenderingContext2D) => {
    scorePopups.forEach(popup => {
      const alpha = 1 - popup.progress;
      const scale = 0.5 + popup.progress * 0.5;
      const yOffset = popup.progress * -30;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(popup.x, popup.y + yOffset);
      ctx.scale(scale, scale);

      // Background circle
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, 2 * Math.PI);
      ctx.fillStyle = popup.ring === 'bullseye' ? '#FFD700' :
                     popup.ring === 'outer-bull' ? '#FF6B6B' :
                     popup.ring === 'triple' ? '#4ECDC4' :
                     popup.ring === 'double' ? '#45B7D1' : '#666';
      ctx.fill();

      // Score text
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(popup.score.toString(), 0, 5);

      ctx.restore();
    });
  };

  const drawParticles = (ctx: CanvasRenderingContext2D) => {
    particles.forEach(particle => {
      const alpha = particle.life / particle.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 2, 0, 2 * Math.PI);
      ctx.fillStyle = particle.color;
      ctx.fill();
      ctx.restore();
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, 400, 400);

    // Draw dartboard
    drawDartboard(ctx);

    // Draw particles (behind darts)
    drawParticles(ctx);

    // Draw darts
    drawDarts(ctx);

    // Draw score popups (on top)
    drawScorePopups(ctx);
  });

  if (showInstructions) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-6">
        <div className="max-w-md mx-auto">
          <button
            onClick={() => navigate('/games')}
            className="flex items-center gap-2 mb-6 text-gray-400 hover:text-white"
          >
            <ArrowLeft size={20} /> Back to Games
          </button>

          <div className="text-center mb-8">
            <Target className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Bullseye</h1>
            <p className="text-gray-400">Test your precision!</p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="font-semibold mb-2">🎯 Level Progression:</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li><strong>Level 1-100:</strong> Reach target score to advance</li>
                <li><strong>Target Score:</strong> Level × 50 points</li>
                <li><strong>Difficulty:</strong> Board spins faster each level</li>
              </ul>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="font-semibold mb-2">🎪 Scoring:</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li><strong>Bullseye:</strong> 50 points</li>
                <li><strong>Outer Bull:</strong> 25 points</li>
                <li><strong>Triple:</strong> 3x segment value</li>
                <li><strong>Double:</strong> 2x segment value</li>
                <li><strong>Single:</strong> 1x segment value</li>
              </ul>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="font-semibold mb-2">🎮 How to Play:</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Click anywhere on the dartboard to throw</li>
                <li>• You have 3 darts per round</li>
                <li>• 60 seconds time limit per level</li>
                <li>• Board rotates for extra challenge!</li>
              </ul>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => startGame()}
              className="w-full bg-green-600 hover:bg-green-700 py-3 rounded-lg font-semibold"
            >
              🎯 Start Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/games')}
            className="flex items-center gap-2 text-gray-400 hover:text-white"
          >
            <ArrowLeft size={20} /> Back
          </button>
          <div className="text-center">
            <div className="text-2xl font-bold">{gameState.score}</div>
            <div className="text-sm text-gray-400">Target: {gameState.level * 50}</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold">{timeLeft}s</div>
            <div className="text-sm text-gray-400">Level {gameState.level}</div>
          </div>
        </div>

        {/* Dartboard */}
        <div className="flex justify-center mb-4">
          <canvas
            ref={canvasRef}
            width={400}
            height={400}
            onClick={throwDart}
            className="border-2 border-gray-700 rounded-lg cursor-crosshair"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </div>

        {/* Dart Counter */}
        <div className="flex justify-center gap-2 mb-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full ${
                i < gameState.currentDart ? 'bg-red-500' : 'bg-gray-600'
              }`}
            />
          ))}
        </div>

        {/* Game Status */}
        {gameState.gameEnded && (
          <div className="text-center mb-4 animate-in fade-in duration-500">
            <div className="text-2xl font-bold text-green-400 mb-2 animate-bounce">
              {(() => {
                const targetScore = gameState.level * 50;
                const levelCompleted = gameState.score >= targetScore;
                if (levelCompleted && gameState.level >= 100) {
                  return "🎉 Game Mastered!";
                } else if (levelCompleted) {
                  return "Level Complete!";
                } else {
                  return "Time's Up!";
                }
              })()}
            </div>
            <div className="text-lg">
              Final Score: <span className="text-yellow-400 animate-pulse">{gameState.score}</span>
            </div>
            <div className="text-sm text-gray-400">
              {(() => {
                const targetScore = gameState.level * 50;
                const levelCompleted = gameState.score >= targetScore;
                if (levelCompleted && gameState.level >= 100) {
                  return `Mastered all 100 levels! Earned ${Math.floor(gameState.score / 10)} DART`;
                } else if (levelCompleted) {
                  return `Advanced to Level ${gameState.level + 1}! Earned ${Math.floor(gameState.score / 10)} DART`;
                } else {
                  return `Target: ${targetScore} | Earned ${Math.floor(gameState.score / 10)} DART`;
                }
              })()}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={resetGame}
            className="flex-1 bg-gray-700 hover:bg-gray-600 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
          >
            <RotateCcw size={20} /> Reset
          </button>
          {gameState.gameStarted && !gameState.gameEnded && gameState.currentDart >= 3 && (
            <button
              onClick={() => setShowAdModal(true)}
              className="flex-1 bg-purple-600 hover:bg-purple-700 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
            >
              🎥 +3 Darts
            </button>
          )}
          {gameState.gameEnded && (
            <button
              onClick={() => navigate('/games')}
              className="flex-1 bg-green-600 hover:bg-green-700 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
            >
              <Trophy size={20} /> Back to Games
            </button>
          )}
        </div>
      </div>

      <RewardedAdModal
        open={showAdModal}
        onClose={() => setShowAdModal(false)}
        onRewardGranted={handleAdRewardGranted}
        title="Extra Darts"
        description="Watch a short video ad to get 3 extra darts and continue playing!"
      />
    </div>
  );
};

export default Bullseye;