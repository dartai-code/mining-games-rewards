// src/components/StackTower.tsx
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Trophy, RotateCcw, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import { leaderboardService } from '../services/leaderboardService';
import { firebaseStorage } from '../services/firebaseStorageService';
import { RewardedAdModal } from './RewardedAdModal';
import { BannerAd } from './BannerAd';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface StackTowerProps {
  onGameComplete?: (score: number) => void;
}

interface Block {
  x: number;
  width: number;
  color: string;
}

const INITIAL_WIDTH = 100;
const BLOCK_HEIGHT = 30;
const SPEED = 3.5;
const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#6366f1'];
const MAX_LIVES = 10;
const LIFE_REFILL_MS = 5 * 60 * 1000; // 5 minutes
const MIN_WIDTH = 35;

const StackTower: React.FC<StackTowerProps> = ({ onGameComplete }) => {
  const navigate = useNavigate();
  const { addTransaction } = useWallet();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [gameState, setGameState] = useState<'playing' | 'gameover'>('playing');
  const [score, setScore] = useState(0);
  const [blocks, setBlocks] = useState<Block[]>([
    { x: 140, width: INITIAL_WIDTH, color: COLORS[0] }
  ]);
  const [currentBlock, setCurrentBlock] = useState<Block>({
    x: 0,
    width: INITIAL_WIDTH,
    color: COLORS[1]
  });
  const [direction, setDirection] = useState(1);
  const [showAdModal, setShowAdModal] = useState(false);
  const [showRefillAdModal, setShowRefillAdModal] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [cameraOffset, setCameraOffset] = useState(0); // Camera vertical offset for scrolling
  const [currentLives, setCurrentLives] = useState<number>(() => {
    const stored = localStorage.getItem('stacktower_lives');
    const lives = stored ? parseInt(stored, 10) : MAX_LIVES;
    return Math.min(MAX_LIVES, Math.max(0, isNaN(lives) ? MAX_LIVES : lives));
  });
  const [nextLifeTime, setNextLifeTime] = useState<number>(() => {
    const stored = localStorage.getItem('stacktower_nextLife');
    return stored ? parseInt(stored, 10) : 0;
  });

  const animationRef = useRef<number>();
  const gameLoopRef = useRef<() => void>();

  // Refs for current state in game loop
  const blocksRef = useRef(blocks);
  const currentBlockRef = useRef(currentBlock);
  const scoreRef = useRef(score);
  const cameraOffsetRef = useRef(cameraOffset);
  
  useEffect(() => {
    blocksRef.current = blocks;
    currentBlockRef.current = currentBlock;
    scoreRef.current = score;
    cameraOffsetRef.current = cameraOffset;
  }, [blocks, currentBlock, score, cameraOffset]);

  // Game loop with integrated drawing
  useEffect(() => {
    if (gameState !== 'playing') return;

    gameLoopRef.current = () => {
      setCurrentBlock(prev => {
        let newX = prev.x + direction * SPEED;
        let newDirection = direction;

        // Bounce at edges
        if (newX <= 0 || newX + prev.width >= 400) {
          newDirection = -direction;
          newX = newX <= 0 ? 0 : 400 - prev.width;
          setDirection(newDirection);
        }

        return { ...prev, x: newX };
      });

      // Draw canvas in the same loop
      drawCanvas();

      animationRef.current = requestAnimationFrame(gameLoopRef.current!);
    };

    animationRef.current = requestAnimationFrame(gameLoopRef.current);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState, direction]);

  // Draw function (called from game loop)
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentBlocks = blocksRef.current;
    const currentMovingBlock = currentBlockRef.current;
    const currentScore = scoreRef.current;
    const currentCameraOffset = cameraOffsetRef.current;

    // Clear canvas
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 400, 600);

    // Calculate camera offset to keep top blocks visible
    // Start scrolling when blocks go beyond 70% of screen height
    const totalHeight = (currentBlocks.length + 1) * BLOCK_HEIGHT;
    const maxVisibleHeight = 600 * 0.7; // 70% of canvas height
    const newCameraOffset = Math.max(0, totalHeight - maxVisibleHeight);
    
    // Update camera offset for smooth scrolling
    if (newCameraOffset !== currentCameraOffset) {
      setCameraOffset(newCameraOffset);
    }

    // Draw stacked blocks with camera offset
    currentBlocks.forEach((block, index) => {
      const y = 600 - (index + 1) * BLOCK_HEIGHT + currentCameraOffset;
      
      // Only draw blocks that are visible on screen
      if (y + BLOCK_HEIGHT >= 0 && y <= 600) {
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(block.x + 3, y + 3, block.width, BLOCK_HEIGHT);
        
        // Block
        ctx.fillStyle = block.color;
        ctx.fillRect(block.x, y, block.width, BLOCK_HEIGHT);
        
        // Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(block.x, y, block.width, 10);
      }
    });

    // Draw current block with camera offset
    if (gameState === 'playing') {
      const y = 600 - (currentBlocks.length + 1) * BLOCK_HEIGHT + currentCameraOffset;
      
      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(currentMovingBlock.x + 3, y + 3, currentMovingBlock.width, BLOCK_HEIGHT);
      
      // Block
      ctx.fillStyle = currentMovingBlock.color;
      ctx.fillRect(currentMovingBlock.x, y, currentMovingBlock.width, BLOCK_HEIGHT);
      
      // Highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(currentMovingBlock.x, y, currentMovingBlock.width, 10);
    }

    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${currentScore}`, 200, 40);
  };

  // Lives refill timer
  useEffect(() => {
    const checkLivesRefill = () => {
      const now = Date.now();
      let lives = currentLives;
      let nextLife = nextLifeTime;

      if (lives < MAX_LIVES) {
        if (nextLife === 0) {
          nextLife = now + LIFE_REFILL_MS;
          localStorage.setItem('stacktower_nextLife', nextLife.toString());
          setNextLifeTime(nextLife);
        } else if (now >= nextLife) {
          lives = Math.min(lives + 1, MAX_LIVES);
          setCurrentLives(lives);
          localStorage.setItem('stacktower_lives', lives.toString());
          
          // Sync to Firebase
          firebaseStorage.updateStackTowerProgress({
            lives: lives,
            lastLifeUpdate: now
          }).catch(err => console.log('Firebase sync failed:', err));
          
          if (lives < MAX_LIVES) {
            nextLife = now + LIFE_REFILL_MS;
            localStorage.setItem('stacktower_nextLife', nextLife.toString());
            setNextLifeTime(nextLife);
          } else {
            nextLife = 0;
            localStorage.setItem('stacktower_nextLife', '0');
            setNextLifeTime(0);
          }
        }
      } else {
        if (nextLife !== 0) {
          nextLife = 0;
          localStorage.setItem('stacktower_nextLife', '0');
          setNextLifeTime(0);
        }
      }
    };

    checkLivesRefill();
    const interval = setInterval(checkLivesRefill, 1000);
    return () => clearInterval(interval);
  }, [currentLives, nextLifeTime]);

  const dropBlock = () => {
    if (gameState !== 'playing') return;

    const lastBlock = blocks[blocks.length - 1];
    const overlap = calculateOverlap(lastBlock, currentBlock);

    if (overlap <= 0) {
      // Game over - long vibration
      try {
        Haptics.impact({ style: ImpactStyle.Heavy });
        setTimeout(() => Haptics.impact({ style: ImpactStyle.Medium }), 100);
      } catch (e) {}

      endGame();
      return;
    }

    // Light vibration for successful placement
    try {
      Haptics.impact({ style: ImpactStyle.Light });
    } catch (e) {}

    // Check if it's a perfect match
    const isPerfect = Math.abs(overlap - lastBlock.width) < 2;
    
    // Medium vibration for perfect placement
    if (isPerfect) {
      try {
        Haptics.impact({ style: ImpactStyle.Medium });
      } catch (e) {}
    }

    // Calculate new block dimensions
    const newX = Math.max(lastBlock.x, currentBlock.x);
    const newWidth = Math.max(MIN_WIDTH, overlap); // Enforce minimum width
    const newScore = score + 1;

    const newBlock: Block = {
      x: newX,
      width: newWidth,
      color: COLORS[newScore % COLORS.length]
    };

    setBlocks([...blocks, newBlock]);
    setScore(newScore);

    // Set up next block
    setCurrentBlock({
      x: 0,
      width: newWidth,
      color: COLORS[(newScore + 1) % COLORS.length]
    });
    setDirection(1);
  };

  const calculateOverlap = (block1: Block, block2: Block): number => {
    const left = Math.max(block1.x, block2.x);
    const right = Math.min(block1.x + block1.width, block2.x + block2.width);
    return Math.max(0, right - left);
  };

  const endGame = () => {
    const currentScore = scoreRef.current;
    console.log('StackTower: Game Over! Score:', currentScore);
    setGameState('gameover');
    // Only award darts for complete sets of 5 blocks (1 dart per block)
    const completedSets = Math.floor(currentScore / 5);
    const dartPoints = completedSets * 5;
    console.log('StackTower: Dart points calculated:', dartPoints, '(completedSets:', completedSets, ')');
    setFinalScore(dartPoints);

    // Consume a life
    const newLives = Math.max(0, currentLives - 1);
    setCurrentLives(newLives);
    localStorage.setItem('stacktower_lives', newLives.toString());

    // Start refill timer if not already running
    if (newLives < MAX_LIVES && nextLifeTime === 0) {
      const nextLife = Date.now() + LIFE_REFILL_MS;
      setNextLifeTime(nextLife);
      localStorage.setItem('stacktower_nextLife', nextLife.toString());
    }

    // Sync lives to Firebase
    firebaseStorage.updateStackTowerProgress({
      lives: newLives,
      lastLifeUpdate: Date.now()
    }).catch(err => console.log('Firebase sync failed:', err));

    if (dartPoints > 0) {
      console.log('StackTower: Adding', dartPoints, 'darts to wallet');
      addTransaction('Game', dartPoints, `Stack Tower score: ${currentScore}`, 'stack-tower');
      
      const userProfile = leaderboardService.getUserProfile();
      console.log('StackTower: User profile:', userProfile);
      if (userProfile) {
        leaderboardService.addScore(userProfile.username, userProfile.country, dartPoints, 'stack-tower');
        
        // Sync to Firebase leaderboard
        firebaseStorage.addLeaderboardScore(dartPoints, 'stack-tower', 'daily')
          .catch(err => console.log('Leaderboard Firebase sync failed:', err));
        firebaseStorage.addLeaderboardScore(dartPoints, 'stack-tower', 'weekly')
          .catch(err => console.log('Leaderboard Firebase sync failed:', err));
        firebaseStorage.addLeaderboardScore(dartPoints, 'stack-tower', 'monthly')
          .catch(err => console.log('Leaderboard Firebase sync failed:', err));
      }
    }

    // Update high score
    const gameStateData = JSON.parse(localStorage.getItem('gameState') || '{}');
    if (currentScore > (gameStateData.highScores?.stackTower || 0)) {
      gameStateData.highScores = gameStateData.highScores || {};
      gameStateData.highScores.stackTower = currentScore;
      localStorage.setItem('gameState', JSON.stringify(gameStateData));
      
      // Sync high score to Firebase
      firebaseStorage.updateStackTowerProgress({
        highScore: currentScore
      }).catch(err => console.log('Firebase sync failed:', err));
    }

    setShowAdModal(true);

    if (onGameComplete) {
      onGameComplete(currentScore);
    }
  };

  const resetGame = () => {
    // Check if player has lives
    if (currentLives <= 0) {
      setShowRefillAdModal(true);
      return;
    }

    setGameState('playing');
    setScore(0);
    setBlocks([{ x: 140, width: INITIAL_WIDTH, color: COLORS[0] }]);
    setCurrentBlock({ x: 0, width: INITIAL_WIDTH, color: COLORS[1] });
    setDirection(1);
    setCameraOffset(0); // Reset camera position
    setShowAdModal(false);
  };

  const handleAdReward = () => {
    const currentScore = scoreRef.current;
    // Award 2x bonus darts
    const bonusDarts = finalScore; // Additional bonus points (same as base)
    console.log('StackTower: Reward ad watched! Adding bonus:', bonusDarts, 'darts');
    if (bonusDarts > 0) {
      addTransaction('Game', bonusDarts, `Stack Tower - ${currentScore} blocks (2x Bonus)`, 'stack-tower');
      
      const userProfile = leaderboardService.getUserProfile();
      if (userProfile) {
        leaderboardService.addScore(userProfile.username, userProfile.country, bonusDarts, 'stack-tower');
        
        // Sync to Firebase leaderboard
        firebaseStorage.addLeaderboardScore(bonusDarts, 'stack-tower', 'daily')
          .catch(err => console.log('Leaderboard Firebase sync failed:', err));
        firebaseStorage.addLeaderboardScore(bonusDarts, 'stack-tower', 'weekly')
          .catch(err => console.log('Leaderboard Firebase sync failed:', err));
        firebaseStorage.addLeaderboardScore(bonusDarts, 'stack-tower', 'monthly')
          .catch(err => console.log('Leaderboard Firebase sync failed:', err));
      }
    }
    
    setShowAdModal(false);
    
    if (onGameComplete) {
      onGameComplete(currentScore);
    }
  };

  const handleLifeRefillAd = () => {
    const newLives = MAX_LIVES;
    setCurrentLives(newLives);
    localStorage.setItem('stacktower_lives', newLives.toString());
    localStorage.setItem('stacktower_nextLife', '0');
    setNextLifeTime(0);
    setShowRefillAdModal(false);
    
    // Sync to Firebase
    firebaseStorage.updateStackTowerProgress({
      lives: newLives,
      lastLifeUpdate: 0
    }).catch(err => console.log('Firebase sync failed:', err));
    
    // Auto-start the game after refill
    resetGame();
  };

  const getTimeUntilNextLife = () => {
    if (currentLives >= MAX_LIVES || nextLifeTime === 0) return '';
    const remaining = Math.max(0, nextLifeTime - Date.now());
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pb-20">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-slate-700 rounded-lg"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <div className="flex flex-col items-center">
            <h1 className="text-xl font-bold text-white">Stack Tower</h1>
            <div className="flex items-center gap-1 mt-1">
              {Array.from({ length: MAX_LIVES }).map((_, i) => (
                <Heart
                  key={i}
                  className={`w-4 h-4 ${
                    i < currentLives ? 'text-red-500 fill-red-500' : 'text-gray-600'
                  }`}
                />
              ))}
              <span className="text-xs text-white ml-1">
                {currentLives}/{MAX_LIVES}
              </span>
              {currentLives < MAX_LIVES && nextLifeTime > 0 && (
                <span className="text-xs text-purple-400 ml-2">{getTimeUntilNextLife()}</span>
              )}
            </div>
          </div>
          <button
            onClick={resetGame}
            className="p-2 hover:bg-slate-700 rounded-lg"
          >
            <RotateCcw className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      {/* Game Canvas */}
      <div className="flex flex-col items-center justify-center p-4 mt-8">
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={400}
            height={600}
            onClick={dropBlock}
            className="border-4 border-slate-700 rounded-lg shadow-2xl cursor-pointer bg-slate-800"
          />
          
          {gameState === 'gameover' && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center rounded-lg">
              <div className="text-center p-8 bg-slate-800 rounded-xl border-2 border-purple-500 shadow-2xl">
                <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-white mb-2">Game Over!</h2>
                <p className="text-slate-300 mb-2">Score: {score}</p>
                <p className="text-green-400 font-semibold mb-4">+{finalScore} Darts</p>
                
                <div className="flex items-center justify-center gap-2 mb-4">
                  {Array.from({ length: MAX_LIVES }).map((_, i) => (
                    <Heart
                      key={i}
                      className={`w-5 h-5 ${
                        i < currentLives ? 'text-red-500 fill-red-500' : 'text-gray-600'
                      }`}
                    />
                  ))}
                  <span className="text-white ml-1">{currentLives}/{MAX_LIVES}</span>
                </div>

                {currentLives > 0 ? (
                  <button
                    onClick={resetGame}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold"
                  >
                    Play Again
                  </button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-red-400 text-sm mb-2">No lives left!</p>
                    <button
                      onClick={() => {
                        setShowRefillAdModal(true);
                        setShowAdModal(false);
                      }}
                      className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold flex items-center gap-2 mx-auto"
                    >
                      <Heart className="w-4 h-4" />
                      Watch Ad for Lives
                    </button>
                    {nextLifeTime > 0 && (
                      <p className="text-xs text-slate-400">Or wait {getTimeUntilNextLife()}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Banner Ad */}
        <div className="mt-6 max-w-md mx-auto">
          <BannerAd />
        </div>
      </div>

      {/* Rewarded Ad Modal */}
      <RewardedAdModal
        open={showAdModal}
        onClose={() => setShowAdModal(false)}
        onRewardGranted={handleAdReward}
        title="Double Your Darts!"
        description={finalScore > 0 ? `You earned ${finalScore} Darts! Watch an ad to earn ${finalScore} MORE (${finalScore * 2} total)!` : `No Darts earned. Reach 5 blocks to earn rewards!`}
      />

      {/* Life Refill Ad Modal */}
      <RewardedAdModal
        open={showRefillAdModal}
        onClose={() => setShowRefillAdModal(false)}
        onRewardGranted={handleLifeRefillAd}
        title="Refill All Lives"
        description={`Watch an ad to refill all ${MAX_LIVES} lives!`}
      />

    </div>
  );
};

export default StackTower;
