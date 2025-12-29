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

interface Booster {
  id: string;
  name: string;
  icon: string;
  description: string;
  count: number;
  active: boolean;
  duration?: number;
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
  const [adType, setAdType] = useState<'extraDarts' | 'levelBonus' | 'continue' | 'booster'>('extraDarts');
  const [showLevelCompleteAd, setShowLevelCompleteAd] = useState(false);
  const [selectedBooster, setSelectedBooster] = useState<string>('');
  const [boosters, setBoosters] = useState<Booster[]>([
    { id: 'slowRotation', name: 'Slow Motion', icon: '⏱️', description: 'Slows board rotation by 70%', count: 3, active: false, duration: 30 },
    { id: 'doublePoints', name: 'Double Points', icon: '💎', description: 'Next dart scores 2x points', count: 3, active: false },
    { id: 'freezeBoard', name: 'Freeze', icon: '❄️', description: 'Stops board rotation for 20s', count: 3, active: false, duration: 20 },
    { id: 'precisionAim', name: 'Precision', icon: '🎯', description: 'Larger bullseye zone', count: 3, active: false, duration: 30 },
  ]);
  const [activeBoosterTimers, setActiveBoosterTimers] = useState<Record<string, number>>({});
  const [sessionScore, setSessionScore] = useState(0); // Track cumulative score for session
  const [sessionStartLevel, setSessionStartLevel] = useState(1); // Track starting level
  const [extraDartsCount, setExtraDartsCount] = useState(0); // Track how many times player used extra darts ads
  const MAX_EXTRA_DARTS_ADS = 2; // Maximum 2 extra darts ads per level

  const endGame = () => {
    // Calculate final session rewards
    const totalSessionScore = sessionScore + gameState.score;
    const dartPoints = Math.floor(totalSessionScore / 10);
    const levelsCompleted = gameState.level - sessionStartLevel;

    setGameState(prev => {
      const targetScore = prev.level * 50;
      const levelCompleted = prev.score >= targetScore;
      let newLevel = prev.level;

      // Save level progress if completed at max level
      if (levelCompleted && prev.level >= 500) {
        localStorage.setItem('bullseyeLevel', '500');
      }

      return { ...prev, gameEnded: true, level: newLevel };
    });

    // Award DART points for entire session
    if (dartPoints > 0) {
      const description = levelsCompleted > 0 
        ? `Bullseye: Levels ${sessionStartLevel}-${gameState.level} (${totalSessionScore} points)`
        : `Bullseye level ${gameState.level}: ${totalSessionScore} points`;
      
      addTransaction('Bullseye', dartPoints, description);

      // Add to leaderboard with cumulative score
      const userProfile = leaderboardService.getUserProfile();
      if (userProfile) {
        leaderboardService.addScore(userProfile.username, userProfile.country, dartPoints, 'bullseye');
      }
    }

    // Get the final game state for calculations
    const finalTargetScore = gameState.level * 50;
    const levelCompleted = gameState.score >= finalTargetScore;

    // Calculate stars based on performance
    let stars = 0;
    const percentage = (gameState.score / finalTargetScore) * 100;

    if (percentage >= 80) stars = 3;
    else if (percentage >= 60) stars = 2;
    else if (percentage >= 40) stars = 1;

    // Update high score with total session score
    const savedGameState = JSON.parse(localStorage.getItem('gameState') || '{}');
    if (totalSessionScore > (savedGameState.highScores?.bullseye || 0)) {
      savedGameState.highScores = savedGameState.highScores || { match3: 0, bullseye: 0 };
      savedGameState.highScores.bullseye = totalSessionScore;
      localStorage.setItem('gameState', JSON.stringify(savedGameState));
    }

    if (onGameComplete) {
      onGameComplete(totalSessionScore, stars);
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

  // Board rotation animation with smooth acceleration
  useEffect(() => {
    if (!gameState.gameStarted || gameState.gameEnded) return;

    let animationFrameId: number;
    let lastTime = Date.now();
    let currentSpeed = 0;
    
    const animateRotation = () => {
      const currentTime = Date.now();
      const deltaTime = (currentTime - lastTime) / 16; // Normalize to 60fps
      lastTime = currentTime;
      
      // Check for freeze booster
      const freezeBooster = boosters.find(b => b.id === 'freezeBoard' && b.active);
      if (freezeBooster) {
        animationFrameId = requestAnimationFrame(animateRotation);
        return;
      }

      // Check for slow rotation booster
      const slowBooster = boosters.find(b => b.id === 'slowRotation' && b.active);
      const baseSpeed = 0.8 + gameState.level * 0.3;
      const targetSpeed = slowBooster ? baseSpeed * 0.3 : baseSpeed;
      
      // Smooth acceleration/deceleration
      const acceleration = 0.1;
      if (Math.abs(targetSpeed - currentSpeed) > 0.01) {
        currentSpeed += (targetSpeed - currentSpeed) * acceleration;
      } else {
        currentSpeed = targetSpeed;
      }
      
      // Add subtle oscillation for more dynamic movement
      const oscillation = Math.sin(Date.now() * 0.002) * 0.2;
      const finalSpeed = (currentSpeed + oscillation) * deltaTime;

      setGameState(prev => ({
        ...prev,
        boardRotation: (prev.boardRotation + finalSpeed) % 360
      }));
      
      animationFrameId = requestAnimationFrame(animateRotation);
    };

    animationFrameId = requestAnimationFrame(animateRotation);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState.gameStarted, gameState.gameEnded, gameState.level, boosters]);

  const calculateScore = (x: number, y: number): { score: number; ring: string } => {
    const centerX = 200;
    const centerY = 200;
    const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);

    // Check for precision booster (increases bullseye zone)
    const precisionBooster = boosters.find(b => b.id === 'precisionAim' && b.active);
    const bullseyeMultiplier = precisionBooster ? 1.5 : 1;

    // Bullseye
    if (distance <= 12.7 * bullseyeMultiplier) return { score: 50, ring: 'bullseye' };
    if (distance <= 31.8 * bullseyeMultiplier) return { score: 25, ring: 'outer-bull' };

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

    // Animate dart flight with easing
    let progress = 0;
    const animateFlight = () => {
      progress += 0.04; // Slightly slower for smoother animation
      
      // Easing function for smooth deceleration (ease-out)
      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
      const easedProgress = easeOutCubic(progress);

      if (progress >= 1) {
        // Dart has landed
        let { score, ring } = calculateScore(targetX, targetY);

        // Apply double points booster
        const doublePointsBooster = boosters.find(b => b.id === 'doublePoints' && b.active);
        if (doublePointsBooster && score > 0) {
          score *= 2;
          // Deactivate double points after use (one-time use)
          setBoosters(current =>
            current.map(b => b.id === 'doublePoints' ? { ...b, active: false } : b)
          );
        }

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
            // Level completed - advance to next level if not at max
            if (prev.level < 500) {
              const nextLevel = prev.level + 1;
              localStorage.setItem('bullseyeLevel', nextLevel.toString());
              
              // Track session score (don't award immediately)
              setSessionScore(current => current + newScore);
              
              // Show ad every 10 levels for bonus rewards
              if (nextLevel % 10 === 1 && nextLevel > 1) {
                setAdType('levelBonus');
                setShowLevelCompleteAd(true);
              }
              
              // Advance to next level - reset for new level
              setTimeout(() => {
                setGameState(current => ({
                  ...current,
                  score: 0,
                  darts: [],
                  currentDart: 0,
                  level: nextLevel,
                  isThrowing: false,
                  gameEnded: false,
                }));
                setTimeLeft(60);
              }, showLevelCompleteAd ? 0 : 1500); // No delay if showing ad
              
              return {
                ...prev,
                darts: newDarts,
                score: newScore,
                currentDart: newCurrentDart,
                isThrowing: false,
                gameEnded: false, // Don't end, will advance
              };
            } else {
              // Max level reached - end game
              gameEnded = true;
            }
          } else if (newCurrentDart >= 3) {
            gameEnded = true; // All darts thrown without reaching target
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
        // Update flying dart position with arc trajectory
        const dx = targetX - startX;
        const dy = targetY - startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Add arc to the flight (parabolic curve)
        const arcHeight = distance * 0.15; // Arc height proportional to distance
        const arcOffset = Math.sin(easedProgress * Math.PI) * arcHeight;
        
        setGameState(prev => ({
          ...prev,
          darts: prev.darts.map(dart =>
            dart.isFlying
              ? {
                  ...dart,
                  flyProgress: easedProgress,
                  x: startX + dx * easedProgress,
                  y: startY + dy * easedProgress - arcOffset
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

    setSessionScore(0);
    setSessionStartLevel(currentLevel);
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

    setSessionScore(0);
    setSessionStartLevel(currentLevel);
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
    setExtraDartsCount(0); // Reset extra darts counter
  };

  const handleAdRewardGranted = () => {
    if (adType === 'extraDarts') {
      // Give 3 extra darts by resetting the dart counter
      setGameState(prev => ({
        ...prev,
        currentDart: 0, // Reset to 0 so player can throw 3 more darts
      }));
      setExtraDartsCount(prev => prev + 1); // Increment extra darts counter
    } else if (adType === 'levelBonus') {
      // Award bonus DART points for watching ad
      const bonusPoints = gameState.level * 2; // 2 DART per level
      addTransaction('Bullseye Ad Bonus', bonusPoints, `Level ${gameState.level} completion bonus`);
      setShowLevelCompleteAd(false);
    } else if (adType === 'continue') {
      // Continue playing with 3 darts and time reset
      setGameState(prev => ({
        ...prev,
        currentDart: 0,
        gameEnded: false,
      }));
      setTimeLeft(60);
    } else if (adType === 'booster') {
      // Grant booster after watching ad
      setBoosters(current =>
        current.map(b => b.id === selectedBooster ? { ...b, count: b.count + 1 } : b)
      );
    }
  };

  const activateBooster = (boosterId: string) => {
    const booster = boosters.find(b => b.id === boosterId);
    if (!booster || booster.count <= 0 || booster.active) return;

    // Activate booster
    setBoosters(current =>
      current.map(b => b.id === boosterId ? { ...b, count: b.count - 1, active: true } : b)
    );

    // Set timer for timed boosters
    if (booster.duration) {
      setActiveBoosterTimers(prev => ({ ...prev, [boosterId]: booster.duration || 0 }));
    }
  };

  const requestBooster = (boosterId: string) => {
    setSelectedBooster(boosterId);
    setAdType('booster');
    setShowAdModal(true);
  };

  const drawDartboard = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    ctx.translate(200, 200);
    ctx.rotate((gameState.boardRotation * Math.PI) / 180);
    ctx.translate(-200, -200);

    // Add enhanced glow effect for active boosters
    const freezeActive = boosters.find(b => b.id === 'freezeBoard' && b.active);
    const precisionActive = boosters.find(b => b.id === 'precisionAim' && b.active);
    
    if (freezeActive) {
      ctx.shadowColor = '#60A5FA';
      ctx.shadowBlur = 20;
    } else if (precisionActive) {
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 15;
    } else {
      ctx.shadowColor = '#4ADE80';
      ctx.shadowBlur = 10;
    }

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

    // Draw rings with enhanced styling and glow effects
    const rings = [
      { radius: 190, color: '#000', width: 2, glow: false },
      { radius: 170, color: '#EF4444', width: 6, glow: true, glowColor: '#FCA5A5' }, // Triple - red
      { radius: 162, color: '#000', width: 2, glow: false },
      { radius: 127, color: '#3B82F6', width: 6, glow: true, glowColor: '#93C5FD' }, // Double - blue
      { radius: 119, color: '#000', width: 2, glow: false },
      { radius: 31.8, color: '#10B981', width: 4, glow: true, glowColor: '#6EE7B7' }, // Outer bull - green
      { radius: 12.7, color: '#F59E0B', width: 4, glow: true, glowColor: '#FCD34D' }, // Bullseye - gold
    ];

    rings.forEach(ring => {
      if (ring.glow) {
        ctx.save();
        ctx.shadowColor = ring.glowColor || ring.color;
        ctx.shadowBlur = 8;
      }
      ctx.beginPath();
      ctx.arc(200, 200, ring.radius, 0, 2 * Math.PI);
      ctx.strokeStyle = ring.color;
      ctx.lineWidth = ring.width;
      ctx.stroke();
      if (ring.glow) {
        ctx.restore();
      }
    });

    // Draw numbers
    const doubleActive = boosters.find(b => b.id === 'doublePoints' && b.active);
    ctx.fillStyle = doubleActive ? '#FFD700' : '#000';
    ctx.font = doubleActive ? 'bold 18px Arial' : 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    DARTBOARD_SEGMENTS.forEach((segment, index) => {
      const angle = (segment.angle + 9) * Math.PI / 180; // Center of segment
      const radius = 145;
      const x = 200 + Math.cos(angle) * radius;
      const y = 200 + Math.sin(angle) * radius;

      if (doubleActive) {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeText(segment.score.toString(), x, y);
      }
      ctx.fillText(segment.score.toString(), x, y);
    });

    ctx.restore();
  };

  const drawDarts = (ctx: CanvasRenderingContext2D) => {
    gameState.darts.forEach((dart, index) => {
      if (dart.isFlying) {
        // Calculate dart angle for rotation
        const dx = dart.x - (dart.startX || 200);
        const dy = dart.y - (dart.startY || 380);
        const angle = Math.atan2(dy, dx);
        
        // Draw enhanced trail with gradient
        ctx.save();
        const trailLength = 12;
        for (let i = 0; i < trailLength; i++) {
          const trailProgress = (dart.flyProgress || 0) - (i / trailLength) * 0.25;
          if (trailProgress > 0) {
            const distance = Math.sqrt(dx * dx + dy * dy);
            const arcHeight = distance * 0.15;
            const arcOffset = Math.sin(trailProgress * Math.PI) * arcHeight;
            
            const trailX = (dart.startX || 200) + dx * trailProgress;
            const trailY = (dart.startY || 380) + dy * trailProgress - arcOffset;
            const alpha = 0.8 * (1 - i / trailLength);
            const size = 3 * (1 - i / trailLength);
            
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(trailX, trailY, size, 0, 2 * Math.PI);
            const gradient = ctx.createRadialGradient(trailX, trailY, 0, trailX, trailY, size);
            gradient.addColorStop(0, '#ff6b6b');
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.fill();
          }
        }
        ctx.restore();
        
        // Draw flying dart with rotation and shadow
        ctx.save();
        ctx.translate(dart.x, dart.y);
        ctx.rotate(angle + Math.PI / 4);
        
        // Shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        // Dart body (elongated)
        ctx.beginPath();
        ctx.moveTo(-8, 0);
        ctx.lineTo(4, -2);
        ctx.lineTo(4, 2);
        ctx.closePath();
        ctx.fillStyle = '#c92a2a';
        ctx.fill();
        
        // Dart tip
        ctx.beginPath();
        ctx.moveTo(4, 0);
        ctx.lineTo(8, 0);
        ctx.strokeStyle = '#862e9c';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.restore();
      } else {
        // Draw landed dart
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
      }

      if (!dart.isFlying) {
        // Draw dart marker
        ctx.beginPath();
        ctx.arc(dart.x, dart.y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = '#ff0000';
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }

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
                <li><strong>Level 1-500:</strong> Reach target score to advance</li>
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
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg p-4 mb-4 shadow-lg">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/games')}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} /> Back
            </button>
            <div className="text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                {gameState.score}
              </div>
              <div className="text-xs text-gray-400">Target: {gameState.level * 50}</div>
            </div>
            <div className="text-right">
              <div className={`text-xl font-semibold ${
                timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-green-400'
              }`}>
                {timeLeft}s
              </div>
              <div className="text-xs text-gray-400">Level {gameState.level}</div>
            </div>
          </div>
        </div>

        {/* Boosters Panel */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {boosters.map(booster => (
            <div key={booster.id} className="relative">
              <button
                onClick={() => booster.count > 0 ? activateBooster(booster.id) : requestBooster(booster.id)}
                disabled={booster.active}
                className={`w-full aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-semibold transition-all ${
                  booster.active
                    ? 'bg-green-600 ring-2 ring-green-400 animate-pulse'
                    : booster.count > 0
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                <span className="text-2xl mb-1">{booster.icon}</span>
                <span className="text-[10px] leading-tight">{booster.name}</span>
                {booster.count > 0 && (
                  <span className="absolute -top-1 -right-1 bg-yellow-500 text-black rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                    {booster.count}
                  </span>
                )}
                {!booster.count && !booster.active && (
                  <span className="absolute -bottom-1 -right-1 text-xs">🎥</span>
                )}
              </button>
              {booster.active && activeBoosterTimers[booster.id] && (
                <div className="absolute -bottom-5 left-0 right-0 text-center text-xs text-green-400 font-semibold">
                  {activeBoosterTimers[booster.id]}s
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Active Boosters Banner */}
        {boosters.some(b => b.active) && (
          <div className="mb-3 p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg">
            <div className="flex flex-wrap justify-center gap-2">
              {boosters.filter(b => b.active).map(booster => (
                <div key={booster.id} className="flex items-center gap-1 bg-black/30 px-2 py-1 rounded text-xs font-semibold">
                  <span>{booster.icon}</span>
                  <span>{booster.name}</span>
                  {activeBoosterTimers[booster.id] && (
                    <span className="text-yellow-300">{activeBoosterTimers[booster.id]}s</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

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
        <div className="flex justify-center gap-3 mb-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-300 ${
                i < gameState.currentDart
                  ? 'bg-red-500 shadow-lg shadow-red-500/50'
                  : 'bg-gray-600 hover:bg-gray-500'
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
                if (levelCompleted && gameState.level >= 500) {
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
            <div className="text-sm text-gray-400 mt-1">
              Session Total: <span className="text-green-400">{sessionScore + gameState.score} points</span>
            </div>
            <div className="text-sm text-gray-400">
              {(() => {
                const targetScore = gameState.level * 50;
                const levelCompleted = gameState.score >= targetScore;
                const totalSessionScore = sessionScore + gameState.score;
                const totalDart = Math.floor(totalSessionScore / 10);
                if (levelCompleted && gameState.level >= 500) {
                  return `Mastered all 500 levels! Earned ${totalDart} DART`;
                } else if (levelCompleted) {
                  return `Advanced to Level ${gameState.level + 1}! Earned ${totalDart} DART`;
                } else {
                  return `Target: ${targetScore} | Earned ${totalDart} DART`;
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
          {gameState.gameStarted && !gameState.gameEnded && gameState.currentDart >= 3 && extraDartsCount < MAX_EXTRA_DARTS_ADS && (
            <button
              onClick={() => {
                setAdType('extraDarts');
                setShowAdModal(true);
              }}
              className="flex-1 bg-purple-600 hover:bg-purple-700 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
            >
              🎥 +3 Darts ({MAX_EXTRA_DARTS_ADS - extraDartsCount} left)
            </button>
          )}
          {gameState.gameEnded && gameState.score < gameState.level * 50 && (
            <button
              onClick={() => {
                setAdType('continue');
                setShowAdModal(true);
              }}
              className="flex-1 bg-yellow-600 hover:bg-yellow-700 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
            >
              🎥 Continue
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
        title={
          adType === 'extraDarts' ? 'Extra Darts' :
          adType === 'continue' ? 'Continue Playing' :
          adType === 'booster' ? `Get ${boosters.find(b => b.id === selectedBooster)?.name}` :
          'Extra Darts'
        }
        description={
          adType === 'extraDarts'
            ? 'Watch a short video ad to get 3 extra darts and continue playing!'
            : adType === 'continue'
            ? 'Watch a short video ad to continue playing with 3 darts and full time!'
            : adType === 'booster'
            ? `Watch an ad to get 1 ${boosters.find(b => b.id === selectedBooster)?.name} booster!`
            : 'Watch a short video ad to get 3 extra darts and continue playing!'
        }
      />

      <RewardedAdModal
        open={showLevelCompleteAd}
        onClose={() => {
          setShowLevelCompleteAd(false);
          // Advance to next level after closing ad
          setTimeout(() => {
            setGameState(current => ({
              ...current,
              score: 0,
              darts: [],
              currentDart: 0,
              level: current.level + 1,
              isThrowing: false,
              gameEnded: false,
            }));
            setTimeLeft(60);
          }, 500);
        }}
        onRewardGranted={handleAdRewardGranted}
        title="Level Milestone!"
        description={`🎉 You've reached level ${gameState.level}! Watch an ad to earn ${gameState.level * 2} bonus DART points!`}
      />
    </div>
  );
};

export default Bullseye;