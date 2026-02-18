// src/components/JumpClimb.tsx
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Trophy, RotateCcw, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import { leaderboardService } from '../services/leaderboardService';
import { firebaseStorage } from '../services/firebaseStorageService';
import { RewardedAdModal } from './RewardedAdModal';
import { BannerAd } from './BannerAd';

interface JumpClimbProps {
  onGameComplete?: (score: number) => void;
}

interface Platform {
  x: number;
  y: number;
  width: number;
  color: string;
  floorNumber: number; // Floor number (0 = ground, 1+)
  hasGate?: boolean;
  gateOpenLeft?: boolean;
  bombExploded?: boolean;
  hasTrap?: boolean;
  trapRevealed?: boolean;
  trapActivated?: boolean;
  trapX?: number;
  trapWidth?: number;
  velocityX?: number; // Platform movement speed
  direction?: number; // 1 for right, -1 for left
}

interface Player {
  x: number;
  y: number;
  velocityY: number;
  isJumping: boolean;
}

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const PLAYER_SIZE = 30;
const PLATFORM_HEIGHT = 15;
const GRAVITY = 0.65;
const JUMP_FORCE = -11.5;  // Adjusted for single floor jump (90px gap)
const PLAYER_SPEED = 7;
const INITIAL_PLATFORM_WIDTH = 100;
const MIN_PLATFORM_WIDTH = 35;
const PLATFORM_GAP = 90;
const PLATFORM_SPEED = 1.5;
const MAX_LIVES = 10;
const LIFE_REFILL_MS = 5 * 60 * 1000; // 5 minutes
const GROUND_Y = 380; // Ground platform Y position
const PLAYER_START_Y = 350; // Player starts 30px above ground (PLAYER_SIZE)
const TRAP_REVEAL_DISTANCE = 80; // Distance at which traps become visible
const PLATFORM_CLEANUP_MULTIPLIER = 3; // How many screens worth of platforms to keep
const FALL_OFF_DISTANCE = 300; // Distance below platforms before game over

const JumpClimb: React.FC<JumpClimbProps> = ({ onGameComplete }) => {
  const navigate = useNavigate();
  const { addTransaction } = useWallet();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [gameState, setGameState] = useState<'playing' | 'gameover'>('playing');
  const [score, setScore] = useState(0);
  const [highestPlatform, setHighestPlatform] = useState(0);
  const [checkpoint, setCheckpoint] = useState(0);
  
  // Initialize platforms with full set immediately to prevent falling
  const [platforms, setPlatforms] = useState<Platform[]>(() => {
    const initialPlatforms: Platform[] = [];
    
    // Ground platform (static, no movement) - positioned in stable camera view
    initialPlatforms.push({
      x: 0,
      y: GROUND_Y,
      width: CANVAS_WIDTH,
      color: '#10b981',
      floorNumber: 0,
      velocityX: 0,
      direction: 0
    });

    // Generate initial platforms
    for (let i = 1; i < 20; i++) {
      const width = Math.max(MIN_PLATFORM_WIDTH, INITIAL_PLATFORM_WIDTH - i * 3);
      const hasGate = i > 15 && Math.random() < 0.4;
      const floorMod = i % 10;
      const hasTrap = !hasGate && (floorMod === 0 || floorMod === 1 || floorMod === 2);
      const trapWidth = hasTrap ? Math.min(width * 0.4, 25) : 0;
      const trapX = hasTrap ? Math.random() * (width - trapWidth) : 0;
      
      initialPlatforms.push({
        x: Math.random() * (CANVAS_WIDTH - width),
        y: GROUND_Y - i * PLATFORM_GAP,
        width,
        color: `hsl(${200 + i * 10}, 70%, 60%)`,
        floorNumber: i,
        hasGate: hasGate,
        gateOpenLeft: hasGate ? Math.random() < 0.5 : undefined,
        hasTrap: hasTrap,
        trapRevealed: false,
        trapX: trapX,
        trapWidth: trapWidth,
        velocityX: PLATFORM_SPEED,
        direction: Math.random() < 0.5 ? 1 : -1
      });
    }
    
    return initialPlatforms;
  });
  
  const [player, setPlayer] = useState<Player>({
    x: CANVAS_WIDTH / 2 - PLAYER_SIZE / 2,
    y: PLAYER_START_Y,
    velocityY: 0,
    isJumping: false
  });
  const [cameraY, setCameraY] = useState(0);
  
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [showRefillModal, setShowRefillModal] = useState(false);
  const [showContinueModal, setShowContinueModal] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [canContinue, setCanContinue] = useState(false);
  const [trapActivatedIndex, setTrapActivatedIndex] = useState<number>(-1);
  
  const [currentLives, setCurrentLives] = useState<number>(() => {
    const stored = localStorage.getItem('jumpclimb_lives');
    const lives = stored ? parseInt(stored, 10) : MAX_LIVES;
    return Math.min(MAX_LIVES, Math.max(0, isNaN(lives) ? MAX_LIVES : lives));
  });
  
  const [nextLifeTime, setNextLifeTime] = useState<number>(() => {
    const stored = localStorage.getItem('jumpclimb_nextLife');
    return stored ? parseInt(stored, 10) : 0;
  });

  const animationRef = useRef<number>();
  const keysPressed = useRef<Set<string>>(new Set());
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchDirection = useRef<'left' | 'right' | 'none'>('none'); // Track swipe direction
  const framesSinceJump = useRef<number>(100); // Frames since last jump (start high to allow initial landing)
  const isSwiping = useRef<boolean>(false);
  const jumpStartY = useRef<number>(PLAYER_START_Y); // Track Y position where jump started
  const lastLandedFloorRef = useRef<number>(0); // Track last floor that updated score

  // Sound playing function
  const playSound = (soundName: string) => {
    const muted = localStorage.getItem('game_sounds_muted') === 'true';
    if (muted) return;
    
    try {
      const audio = new Audio(`/sounds/${soundName}.mp3`);
      audio.volume = 0.3;
      audio.play().catch(err => console.log('Sound play failed:', err));
    } catch (err) {
      console.log('Sound load failed:', err);
    }
  };

  const initializeGame = () => {
    const initialPlatforms: Platform[] = [];
    
    // Ground platform (static, no movement) - positioned in stable camera view
    initialPlatforms.push({
      x: 0,
      y: GROUND_Y,
      width: CANVAS_WIDTH,
      color: '#10b981',
      floorNumber: 0,
      velocityX: 0,
      direction: 0
    });

    // Generate initial platforms
    for (let i = 1; i < 20; i++) {
      const width = Math.max(MIN_PLATFORM_WIDTH, INITIAL_PLATFORM_WIDTH - i * 3);
      // Add gates to platforms after floor 15
      const hasGate = i > 15 && Math.random() < 0.4; // 40% chance for gates after floor 15
      // Add hidden traps every 10-12 floors (floors 10,11,12, 20,21,22, etc.)
      const floorMod = i % 10;
      const hasTrap = !hasGate && (floorMod === 0 || floorMod === 1 || floorMod === 2);
      const trapWidth = hasTrap ? Math.min(width * 0.4, 25) : 0;
      const trapX = hasTrap ? Math.random() * (width - trapWidth) : 0;
      
      initialPlatforms.push({
        x: Math.random() * (CANVAS_WIDTH - width),
        y: GROUND_Y - i * PLATFORM_GAP,
        width,
        color: `hsl(${200 + i * 10}, 70%, 60%)`,
        floorNumber: i,
        hasGate: hasGate,
        gateOpenLeft: hasGate ? Math.random() < 0.5 : undefined,
        hasTrap: hasTrap,
        trapRevealed: false,
        trapX: trapX,
        trapWidth: trapWidth,
        velocityX: PLATFORM_SPEED,
        direction: Math.random() < 0.5 ? 1 : -1 // Random initial direction
      });
    }

    setPlatforms(initialPlatforms);
    setScore(0);
    setHighestPlatform(0);
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
          localStorage.setItem('jumpclimb_nextLife', nextLife.toString());
          setNextLifeTime(nextLife);
        } else if (now >= nextLife) {
          lives = Math.min(lives + 1, MAX_LIVES);
          setCurrentLives(lives);
          localStorage.setItem('jumpclimb_lives', lives.toString());
          
          // Sync to Firebase
          firebaseStorage.updateJumpClimbProgress({
            lives: lives,
            lastLifeUpdate: now
          }).catch(err => console.log('Firebase sync failed:', err));
          
          if (lives < MAX_LIVES) {
            nextLife = now + LIFE_REFILL_MS;
            localStorage.setItem('jumpclimb_nextLife', nextLife.toString());
            setNextLifeTime(nextLife);
          } else {
            nextLife = 0;
            localStorage.setItem('jumpclimb_nextLife', '0');
            setNextLifeTime(0);
          }
        }
      } else {
        if (nextLife !== 0) {
          nextLife = 0;
          localStorage.setItem('jumpclimb_nextLife', '0');
          setNextLifeTime(0);
        }
      }
    };

    checkLivesRefill();
    const interval = setInterval(checkLivesRefill, 1000);
    return () => clearInterval(interval);
  }, [currentLives, nextLifeTime]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key);
      if (e.key === ' ') {
        jump();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  // Touch/Swipe controls for mobile
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartX.current = touch.clientX;
      touchStartY.current = touch.clientY;
      isSwiping.current = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (gameState !== 'playing') return;
      
      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartX.current;
      const deltaY = touch.clientY - touchStartY.current;
      
      // Detect horizontal swipe (movement > 10px)
      if (Math.abs(deltaX) > 10) {
        isSwiping.current = true;
        
        // Set direction for game loop to read
        if (deltaX > 0) {
          touchDirection.current = 'right';
        } else {
          touchDirection.current = 'left';
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartX.current;
      const deltaY = touch.clientY - touchStartY.current;
      
      // If it was a tap (not a swipe), trigger jump
      if (!isSwiping.current && Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
        jump();
      }
      
      isSwiping.current = false;
      touchDirection.current = 'none'; // Reset direction
    };

    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove, { passive: true });
    canvas.addEventListener('touchend', handleTouchEnd);

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [gameState]);

  // Refs for current state in game loop
  const platformsRef = useRef(platforms);
  const playerRef = useRef(player);
  const scoreRef = useRef(score);
  const cameraYRef = useRef(cameraY);
  const highestPlatformRef = useRef(highestPlatform);
  const gameStateRef = useRef(gameState);
  
  useEffect(() => {
    platformsRef.current = platforms;
    playerRef.current = player;
    scoreRef.current = score;
    cameraYRef.current = cameraY;
    // DON'T update highestPlatformRef here - it's managed directly in game loop
    // highestPlatformRef.current = highestPlatform;
  }, [platforms, player, score, cameraY]);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Game loop with integrated drawing
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    // Ensure refs are initialized before starting game loop
    if (!platformsRef.current || platformsRef.current.length === 0 || !playerRef.current) return;

    const gameLoop = () => {
      // Use refs for current state to avoid re-renders
      const currentPlatforms = platformsRef.current;
      const currentPlayer = playerRef.current;
      let endGameScheduled = false;
      
      // Update both platforms and player state together to avoid race conditions
      let updatedPlatforms = currentPlatforms.map(platform => {
        if (platform.velocityX === 0 || platform.direction === 0) return platform; // Skip static platforms
        
        let newX = platform.x + (platform.velocityX! * platform.direction!);
        let newDirection = platform.direction!;
        
        // Bounce at edges
        if (newX <= 0) {
          newX = 0;
          newDirection = 1;
        } else if (newX + platform.width >= CANVAS_WIDTH) {
          newX = CANVAS_WIDTH - platform.width;
          newDirection = -1;
        }
        
        return { ...platform, x: newX, direction: newDirection };
      });
      
      // Calculate new player position
      let newX = currentPlayer.x;
      let newY = currentPlayer.y + currentPlayer.velocityY;
      let newVelocityY = currentPlayer.velocityY + GRAVITY;
      let newIsJumping = currentPlayer.isJumping;
      let shouldEndGame = false;
      let landedPlatform: Platform | null = null;  // Reset every frame - prevents unwanted platform movement
      
      // Track frames since jump to prevent immediate re-landing
      framesSinceJump.current++;

      // Horizontal movement
      if (keysPressed.current.has('ArrowLeft') || keysPressed.current.has('a') || touchDirection.current === 'left') {
        newX = Math.max(0, newX - PLAYER_SPEED);
      }
      if (keysPressed.current.has('ArrowRight') || keysPressed.current.has('d') || touchDirection.current === 'right') {
        newX = Math.min(CANVAS_WIDTH - PLAYER_SIZE, newX + PLAYER_SPEED);
      }

      // Platform collision - SIMPLIFIED
      let nearestPlatform: { platform: Platform; idx: number } | null = null;
      let nearestDistance = Infinity;
      
      updatedPlatforms.forEach((platform, idx) => {
          // Reveal trap if player is close
          if (platform.hasTrap && !platform.trapRevealed && Math.abs(newY - platform.y) < TRAP_REVEAL_DISTANCE) {
            updatedPlatforms = updatedPlatforms.map((p, i) => 
              i === idx ? { ...p, trapRevealed: true } : p
            );
          }
          
          // Landing detection - Crossing detection (works even when falling fast)
          const oldPlayerBottom = currentPlayer.y + PLAYER_SIZE;
          const playerBottom = newY + PLAYER_SIZE;
          const platformTop = platform.y;
          const onPlatformHorizontally = newX + PLAYER_SIZE > platform.x && newX < platform.x + platform.width;
          
          // Detect if player CROSSED the platform top between frames
          // This works even when falling at high speed
          const wasClearlyAbove = oldPlayerBottom < platformTop - 10; // Was well above platform
          const isNowAtOrBelow = playerBottom >= platformTop - 5;     // Now at or below platform top
          const crossedPlatform = wasClearlyAbove && isNowAtOrBelow;
          
          // Allow landing if:
          // 1. Waited 10 frames since jump (prevents re-landing on same platform)
          // 2. Falling down
          // 3. Crossed the platform top OR is close to it
          // 4. Horizontally aligned with platform
          if (
            framesSinceJump.current > 10 &&
            newVelocityY >= 0 &&
            (crossedPlatform || (oldPlayerBottom <= platformTop + 20 && playerBottom >= platformTop - 5 && playerBottom <= platformTop + 30)) &&
            onPlatformHorizontally
          ) {
            // Find the NEAREST platform (closest one wins)
            const distance = Math.abs(platformTop - playerBottom);
            if (distance < nearestDistance) {
              nearestDistance = distance;
              nearestPlatform = { platform, idx };
            }
          }
        });
      
      // Process collision with nearest platform only
      if (nearestPlatform) {
        const platform = nearestPlatform.platform;
        const idx = nearestPlatform.idx;
            // Check if player landed on a trap
            if (platform.hasTrap && platform.trapX !== undefined && platform.trapWidth !== undefined) {
              const playerCenter = newX + PLAYER_SIZE / 2;
              const trapAbsoluteX = platform.x + platform.trapX;
              const trapAbsoluteEndX = trapAbsoluteX + platform.trapWidth;
              
              if (playerCenter >= trapAbsoluteX && playerCenter <= trapAbsoluteEndX) {
                // Player landed on trap - activate it visually!
                updatedPlatforms = updatedPlatforms.map((p, i) => 
                  i === idx ? { ...p, trapActivated: true, trapRevealed: true } : p
                );
                setTrapActivatedIndex(idx);
                shouldEndGame = true;
                endGameScheduled = true;
                
                // End game after visual feedback
                setTimeout(() => {
                  endGame();
                }, 300);
              }
            }
            
            // Check if platform has a gate and if player can land
            if (platform.hasGate) {
              const platformCenter = platform.x + platform.width / 2;
              const playerCenter = newX + PLAYER_SIZE / 2;
              
              // Gate blocks one side
              if (platform.gateOpenLeft) {
                // Bomb on right side, player must be on left
                if (playerCenter > platformCenter) {
                  // Player hit the bomb, trigger explosion!
                  updatedPlatforms = updatedPlatforms.map((p, i) => 
                    i === idx ? { ...p, bombExploded: true } : p
                  );
                  shouldEndGame = true;
                  endGameScheduled = true;
                  
                  // End game after explosion animation
                  setTimeout(() => {
                    endGame();
                  }, 400);
                }
              } else {
                // Bomb on left side, player must be on right
                if (playerCenter < platformCenter) {
                  // Player hit the bomb, trigger explosion!
                  updatedPlatforms = updatedPlatforms.map((p, i) => 
                    i === idx ? { ...p, bombExploded: true } : p
                  );
                  shouldEndGame = true;
                  endGameScheduled = true;
                  
                  // End game after explosion animation
                  setTimeout(() => {
                    endGame();
                  }, 400);
                }
              }
            }
            
            // Only land if not hitting trap/bomb
            if (!shouldEndGame) {
              newY = platform.y - PLAYER_SIZE;
              newVelocityY = 0;
              newIsJumping = false;
              landedPlatform = platform; // Track which platform we landed on
              jumpStartY.current = newY; // Update jump start for next jump
            }
      }

      // Move with platform ONLY if landed this frame (before bounds check)
      if (landedPlatform && landedPlatform.velocityX && landedPlatform.direction) {
        const platformMovement = landedPlatform.velocityX * landedPlatform.direction;
        newX = Math.max(0, Math.min(CANVAS_WIDTH - PLAYER_SIZE, newX + platformMovement));
      }

      // Safety: Never fall below ground platform (floor 0)
      // Use the actual ground platform Y (it moves when the camera scrolls)
      const groundPlatform = updatedPlatforms.find(p => p.floorNumber === 0);
      const effectiveGroundY = groundPlatform?.y ?? GROUND_Y;

      if (newY + PLAYER_SIZE > effectiveGroundY) {
        newY = effectiveGroundY - PLAYER_SIZE;
        newVelocityY = 0;
        newIsJumping = false;
        jumpStartY.current = newY; // Update for next jump
      }

      // Player continues falling until lands on a platform or hits ground
      // No artificial fall detection - let physics work naturally

        // Camera follow - both up and down
        let cameraUpdated = false;
        if (newY < CANVAS_HEIGHT / 3) {
          // Player going up - move camera up
          const diff = CANVAS_HEIGHT / 3 - newY;
          setCameraY(cameraYRef.current + diff);
          newY = CANVAS_HEIGHT / 3;
          updatedPlatforms = updatedPlatforms.map(p => ({ ...p, y: p.y + diff }));
          cameraUpdated = true;
        } else if (newY > CANVAS_HEIGHT * 2 / 3) {
          // Player falling down - move camera down to follow
          const diff = newY - CANVAS_HEIGHT * 2 / 3;
          setCameraY(cameraYRef.current - diff);
          newY = CANVAS_HEIGHT * 2 / 3;
          updatedPlatforms = updatedPlatforms.map(p => ({ ...p, y: p.y - diff }));
          cameraUpdated = true;
        }

  // Update score when landing on a HIGHER platform (using floor number)
  if (nearestPlatform && !shouldEndGame) {
        const rawFloorNumber = nearestPlatform.platform.floorNumber;
        const computedFloorFromY = Math.max(0, Math.round((GROUND_Y - nearestPlatform.platform.y) / PLATFORM_GAP));
        const landedFloor = rawFloorNumber !== undefined ? rawFloorNumber : computedFloorFromY;

        if (landedFloor > lastLandedFloorRef.current) {
          setHighestPlatform(landedFloor);
          setScore(landedFloor);
          highestPlatformRef.current = landedFloor;
          lastLandedFloorRef.current = landedFloor;
          
          // Set checkpoint every 5 platforms
          if (landedFloor % 5 === 0 && landedFloor > 0) {
            setCheckpoint(landedFloor);
          }
          
          // Generate new platform
          const topPlatform = updatedPlatforms[updatedPlatforms.length - 1];
          const width = Math.max(MIN_PLATFORM_WIDTH, INITIAL_PLATFORM_WIDTH - updatedPlatforms.length * 2.5);
          const hasGate = updatedPlatforms.length > 15 && Math.random() < 0.4;
          const floorMod = updatedPlatforms.length % 10;
          const hasTrap = !hasGate && (floorMod === 0 || floorMod === 1 || floorMod === 2);
          const trapWidth = hasTrap ? Math.min(width * 0.4, 25) : 0;
          const trapX = hasTrap ? Math.random() * (width - trapWidth) : 0;
          
          const newPlatform = {
            x: Math.random() * (CANVAS_WIDTH - width),
            y: topPlatform.y - PLATFORM_GAP,
            width,
            color: `hsl(${200 + updatedPlatforms.length * 10}, 70%, 60%)`,
            floorNumber: landedFloor + 1,
            hasGate: hasGate,
            gateOpenLeft: hasGate ? Math.random() < 0.5 : undefined,
            hasTrap: hasTrap,
            trapRevealed: false,
            trapX: trapX,
            trapWidth: trapWidth,
            velocityX: PLATFORM_SPEED,
            direction: Math.random() < 0.5 ? 1 : -1
          };
          
          // Add new platform and clean up old ones
          updatedPlatforms = [...updatedPlatforms.filter(p => p.y < cameraYRef.current + CANVAS_HEIGHT * PLATFORM_CLEANUP_MULTIPLIER), newPlatform];
        }
        }

        // Check if fallen off screen
        const lowestPlatform = updatedPlatforms.reduce((lowest, p) => Math.max(lowest, p.y), 0);
        if (newY > lowestPlatform + FALL_OFF_DISTANCE) {
          shouldEndGame = true;
          newIsJumping = false; // Reset jump state for next game
        }

        // Batch state updates at the end for better performance
        const newPlayerState = {
          x: newX,
          y: newY,
          velocityY: newVelocityY,
          isJumping: newIsJumping
        };
        
        // Update ref FIRST so jump() reads current state
        playerRef.current = newPlayerState;
        
        setPlatforms(updatedPlatforms);
        setPlayer(newPlayerState);
        
        // End game if needed (after state update)
        if (shouldEndGame && !endGameScheduled && gameStateRef.current === 'playing') {
          requestAnimationFrame(() => endGame());
        }

      // Draw canvas AFTER state updates are queued
      drawCanvas();

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState]);

  // Draw function (called from game loop)
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentPlatforms = platformsRef.current;
    const currentPlayer = playerRef.current;
    const currentScore = scoreRef.current;

    // Clear with gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#1e1b4b');
    gradient.addColorStop(1, '#0f172a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw platforms
    currentPlatforms.forEach((platform, index) => {
      if (platform.y < CANVAS_HEIGHT && platform.y > -PLATFORM_HEIGHT) {
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(platform.x + 3, platform.y + 3, platform.width, PLATFORM_HEIGHT);
        
        // Platform
        ctx.fillStyle = platform.color;
        ctx.fillRect(platform.x, platform.y, platform.width, PLATFORM_HEIGHT);
        
        // Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(platform.x, platform.y, platform.width, 5);
        
        // Draw bomb if present
        if (platform.hasGate) {
          const bombSize = 24;
          const fuseHeight = 10;
          const bombX = platform.gateOpenLeft ? platform.x + platform.width - bombSize - 5 : platform.x + 5;
          const bombY = platform.y - bombSize - 2;
          
          if (platform.bombExploded) {
            // Simple explosion indicator
            const explosionSize = 50;
            const explosionX = bombX + bombSize / 2 - explosionSize / 2;
            const explosionY = bombY + bombSize / 2 - explosionSize / 2;
            
            // Simple red circle
            ctx.fillStyle = '#dc2626';
            ctx.beginPath();
            ctx.arc(explosionX + explosionSize / 2, explosionY + explosionSize / 2, explosionSize / 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Boom text
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('BOOM!', explosionX + explosionSize / 2, explosionY + explosionSize / 2 + 5);
          } else {
            // Draw bomb shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(bombX + bombSize / 2 + 2, bombY + bombSize / 2 + 2, bombSize / 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw bomb body (black sphere)
            ctx.fillStyle = '#1f2937';
            ctx.beginPath();
            ctx.arc(bombX + bombSize / 2, bombY + bombSize / 2, bombSize / 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Bomb highlight (make it look 3D)
            ctx.fillStyle = '#4b5563';
            ctx.beginPath();
            ctx.arc(bombX + bombSize / 2 - 4, bombY + bombSize / 2 - 4, bombSize / 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw fuse
            ctx.strokeStyle = '#78350f';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(bombX + bombSize / 2, bombY);
            ctx.quadraticCurveTo(bombX + bombSize / 2 + 5, bombY - fuseHeight / 2, bombX + bombSize / 2, bombY - fuseHeight);
            ctx.stroke();
            
            // Draw fuse spark
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(bombX + bombSize / 2, bombY - fuseHeight, 3, 0, Math.PI * 2);
            ctx.fill();
          }
          
          // Arrow indicator showing safe side (only if not exploded)
          if (!platform.bombExploded) {
            const arrowX = platform.gateOpenLeft ? platform.x + platform.width / 4 : platform.x + 3 * platform.width / 4;
            ctx.fillStyle = '#22c55e';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(platform.gateOpenLeft ? '←' : '→', arrowX, bombY + bombSize / 2);
          }
        }
        
        // Draw trap (nails/spikes) if revealed or activated
        if (platform.hasTrap && (platform.trapRevealed || platform.trapActivated) && platform.trapX !== undefined && platform.trapWidth !== undefined) {
          const trapAbsoluteX = platform.x + platform.trapX;
          const trapHeight = 12;
          const numSpikes = 3;
          const spikeSpacing = platform.trapWidth / numSpikes;
          
          for (let s = 0; s < numSpikes; s++) {
            const spikeX = trapAbsoluteX + s * spikeSpacing + spikeSpacing / 2;
            
            // Spike/nail base (on platform)
            ctx.fillStyle = platform.trapActivated ? '#dc2626' : '#78716c';
            ctx.beginPath();
            ctx.moveTo(spikeX, platform.y);
            ctx.lineTo(spikeX - 3, platform.y + trapHeight);
            ctx.lineTo(spikeX + 3, platform.y + trapHeight);
            ctx.closePath();
            ctx.fill();
            
            // Spike point (upward)
            ctx.fillStyle = platform.trapActivated ? '#991b1b' : '#57534e';
            ctx.beginPath();
            ctx.moveTo(spikeX, platform.y - trapHeight);
            ctx.lineTo(spikeX - 4, platform.y);
            ctx.lineTo(spikeX + 4, platform.y);
            ctx.closePath();
            ctx.fill();
            
            // Highlight on spike (make it look sharp)
            ctx.fillStyle = platform.trapActivated ? '#fca5a5' : '#d6d3d1';
            ctx.beginPath();
            ctx.moveTo(spikeX, platform.y - trapHeight);
            ctx.lineTo(spikeX - 2, platform.y - trapHeight / 2);
            ctx.lineTo(spikeX, platform.y);
            ctx.closePath();
            ctx.fill();
          }
          
          // Warning indicator if revealed but not activated
          if (platform.trapRevealed && !platform.trapActivated) {
            ctx.fillStyle = '#fbbf24';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('⚠', trapAbsoluteX + platform.trapWidth / 2, platform.y - trapHeight - 8);
          }
          
          // Red danger zone if activated
          if (platform.trapActivated) {
            ctx.fillStyle = 'rgba(220, 38, 38, 0.3)';
            ctx.fillRect(trapAbsoluteX - 5, platform.y - trapHeight - 20, platform.trapWidth + 10, trapHeight + 25);
          }
        }
        
        // Platform number
        if (index > 0) {
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(index.toString(), platform.x + platform.width / 2, platform.y - (platform.hasGate ? 50 : 5));
        }
      }
    });

    // Draw player as pixel-art human
    const px = currentPlayer.x;
    const py = currentPlayer.y;
    
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(px + 3, py + 23, PLAYER_SIZE - 2, 4);
    
    // Head
    ctx.fillStyle = '#ffdbac';
    ctx.fillRect(px + 8, py + 2, 10, 10);
    
    // Eyes
    ctx.fillStyle = '#000';
    ctx.fillRect(px + 10, py + 5, 2, 2);
    ctx.fillRect(px + 14, py + 5, 2, 2);
    
    // Body
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(px + 6, py + 12, 14, 10);
    
    // Arms
    ctx.fillStyle = '#ffdbac';
    ctx.fillRect(px + 3, py + 14, 3, 6);
    ctx.fillRect(px + 20, py + 14, 3, 6);
    
    // Legs
    ctx.fillStyle = '#1e40af';
    ctx.fillRect(px + 8, py + 22, 4, 6);
    ctx.fillRect(px + 14, py + 22, 4, 6);
  };

  const jump = () => {
    if (gameState !== 'playing') return;
    
    // Use ref to get current state to avoid stale closure
    const currentPlayerState = playerRef.current;
    // Only allow jump when on ground (not in air)
    if (!currentPlayerState.isJumping) {
      playSound('jump');
      jumpStartY.current = currentPlayerState.y; // Remember where we jumped from
      framesSinceJump.current = 0; // Reset frame counter to prevent immediate re-landing
      setPlayer(prev => ({
        ...prev,
        velocityY: JUMP_FORCE,
        isJumping: true
      }));
    }
  };

  const endGame = () => {
    if (gameStateRef.current !== 'playing') return; // Prevent double-processing
    const currentScore = scoreRef.current;
    console.log('JumpClimb: Game Over! Score:', currentScore);
    setGameState('gameover');
    playSound('fail');
    
    // Only award darts for complete sets of 5 floors (1 dart per floor)
    const completedSets = Math.floor(currentScore / 5);
    const dartPoints = completedSets * 5;
    console.log('JumpClimb: Dart points calculated:', dartPoints, '(completedSets:', completedSets, ')');
    setFinalScore(dartPoints);
    
    // Check if can continue (fell from high enough)
    const fellFrom = currentScore > checkpoint + 3;
    setCanContinue(fellFrom && checkpoint > 0);

    // Consume a life
    const newLives = Math.max(0, currentLives - 1);
    setCurrentLives(newLives);
    localStorage.setItem('jumpclimb_lives', newLives.toString());

    // Start refill timer if not already running
    if (newLives < MAX_LIVES && nextLifeTime === 0) {
      const nextLife = Date.now() + LIFE_REFILL_MS;
      setNextLifeTime(nextLife);
      localStorage.setItem('jumpclimb_nextLife', nextLife.toString());
    }

    // Sync lives to Firebase
    firebaseStorage.updateJumpClimbProgress({
      lives: newLives,
      lastLifeUpdate: Date.now()
    }).catch(err => console.log('Firebase sync failed:', err));

    // Add score to leaderboard immediately
    if (dartPoints > 0) {
      console.log('JumpClimb: Adding', dartPoints, 'darts to wallet');
      addTransaction('Game', dartPoints, `Jump Climb - Floor ${currentScore}`, 'jump-climb');
      
      const userProfile = leaderboardService.getUserProfile();
      console.log('JumpClimb: User profile:', userProfile);
      if (userProfile) {
        leaderboardService.addScore(userProfile.username, userProfile.country, dartPoints, 'jump-climb');
        
        // Sync to Firebase leaderboard
        firebaseStorage.addLeaderboardScore(dartPoints, 'jump-climb', 'daily')
          .catch(err => console.log('Leaderboard Firebase sync failed:', err));
        firebaseStorage.addLeaderboardScore(dartPoints, 'jump-climb', 'weekly')
          .catch(err => console.log('Leaderboard Firebase sync failed:', err));
        firebaseStorage.addLeaderboardScore(dartPoints, 'jump-climb', 'monthly')
          .catch(err => console.log('Leaderboard Firebase sync failed:', err));
      }
    }

    // Update high score
    const gameStateData = JSON.parse(localStorage.getItem('gameState') || '{}');
    if (currentScore > (gameStateData.highScores?.jumpClimb || 0)) {
      gameStateData.highScores = gameStateData.highScores || {};
      gameStateData.highScores.jumpClimb = currentScore;
      localStorage.setItem('gameState', JSON.stringify(gameStateData));
      
      // Sync high score to Firebase
      firebaseStorage.updateJumpClimbProgress({
        highScore: currentScore
      }).catch(err => console.log('Firebase sync failed:', err));
    }

    // Show continue modal if eligible, otherwise show reward modal
    if (fellFrom && checkpoint > 0) {
      setShowContinueModal(true);
    } else {
      setShowRewardModal(true);
    }
  };

  const handleRewardAd = () => {
    const currentScore = scoreRef.current;
    const bonusDarts = finalScore; // Additional bonus points (same as base)
    console.log('JumpClimb: Reward ad watched! Adding bonus:', bonusDarts, 'darts');
    addTransaction('Game', bonusDarts, `Jump Climb - Floor ${currentScore} (2x Bonus)`, 'jump-climb');
    
    const userProfile = leaderboardService.getUserProfile();
    if (userProfile) {
      leaderboardService.addScore(userProfile.username, userProfile.country, bonusDarts, 'jump-climb');
      
      // Sync to Firebase leaderboard
      firebaseStorage.addLeaderboardScore(bonusDarts, 'jump-climb', 'daily')
        .catch(err => console.log('Leaderboard Firebase sync failed:', err));
      firebaseStorage.addLeaderboardScore(bonusDarts, 'jump-climb', 'weekly')
        .catch(err => console.log('Leaderboard Firebase sync failed:', err));
      firebaseStorage.addLeaderboardScore(bonusDarts, 'jump-climb', 'monthly')
        .catch(err => console.log('Leaderboard Firebase sync failed:', err));
    }
    
    setShowRewardModal(false);
    
    if (onGameComplete) {
      onGameComplete(currentScore);
    }
  };

  const handleSkipReward = () => {
    // No additional bonus, already added base score in endGame
    setShowRewardModal(false);
    
    if (onGameComplete) {
      onGameComplete(scoreRef.current);
    }
  };

  const findOrCreateCheckpointPlatform = (targetFloor: number, currentPlatforms: Platform[]) => {
    const existing = currentPlatforms.find(p => p.floorNumber === targetFloor);
    if (existing) {
      return { platform: existing, platforms: currentPlatforms };
    }

    const width = Math.max(MIN_PLATFORM_WIDTH, INITIAL_PLATFORM_WIDTH - targetFloor * 2.5);
    const y = GROUND_Y - targetFloor * PLATFORM_GAP;
    const newPlatform: Platform = {
      x: Math.random() * (CANVAS_WIDTH - width),
      y,
      width,
      color: `hsl(${200 + targetFloor * 10}, 70%, 60%)`,
      floorNumber: targetFloor,
      hasGate: false,
      gateOpenLeft: false,
      hasTrap: false,
      trapRevealed: false,
      trapX: 0,
      trapWidth: 0,
      velocityX: PLATFORM_SPEED,
      direction: Math.random() < 0.5 ? 1 : -1
    };

    return { platform: newPlatform, platforms: [...currentPlatforms, newPlatform] };
  };

  const handleContinueAd = () => {
    // Continue from checkpoint
    setGameState('playing');
    setScore(checkpoint);
    setHighestPlatform(checkpoint);
    highestPlatformRef.current = checkpoint;
    scoreRef.current = checkpoint;
    
    const { platform: targetPlatform, platforms: mergedPlatforms } = findOrCreateCheckpointPlatform(checkpoint, platformsRef.current);

    // Re-anchor camera and platforms so the checkpoint platform is back on screen
    const desiredScreenY = CANVAS_HEIGHT / 2;
    const offset = targetPlatform.y - desiredScreenY;
    const repositionedPlatforms = mergedPlatforms.map(p => ({ ...p, y: p.y - offset }));
    const targetScreenY = targetPlatform.y - offset;

    setPlatforms(repositionedPlatforms);
    setCameraY(cameraYRef.current - offset);
    setPlayer({
      x: targetPlatform.x + targetPlatform.width / 2 - PLAYER_SIZE / 2,
      y: targetScreenY - PLAYER_SIZE - 10,
      velocityY: 0,
      isJumping: false
    });

    lastLandedFloorRef.current = checkpoint;
    
    setShowContinueModal(false);
  };

  const handleSkipContinue = () => {
    setShowContinueModal(false);
    setShowRewardModal(true);
  };

  const handleLifeRefillAd = () => {
    const newLives = MAX_LIVES;
    setCurrentLives(newLives);
    localStorage.setItem('jumpclimb_lives', newLives.toString());
    localStorage.setItem('jumpclimb_nextLife', '0');
    setNextLifeTime(0);
    setShowRefillModal(false);
    
    // Sync to Firebase
    firebaseStorage.updateJumpClimbProgress({
      lives: newLives,
      lastLifeUpdate: 0
    }).catch(err => console.log('Firebase sync failed:', err));
    
    // Auto-start the game after refill
    resetGame();
  };

  const resetGame = () => {
    // Check if player has lives
    if (currentLives <= 0) {
      setShowRefillModal(true);
      return;
    }

    setGameState('playing');
    setScore(0);
    setHighestPlatform(0);
    setCheckpoint(0);
    setCameraY(0);
    setTrapActivatedIndex(-1);
    
    // Explicitly reset refs
    highestPlatformRef.current = 0;
    lastLandedFloorRef.current = 0;
    jumpStartY.current = PLAYER_START_Y;
    framesSinceJump.current = 100;
    
    setPlayer({
      x: CANVAS_WIDTH / 2 - PLAYER_SIZE / 2,
      y: PLAYER_START_Y,
      velocityY: 0,
      isJumping: false
    });
    initializeGame();
    setShowRewardModal(false);
    setShowContinueModal(false);
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
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <div className="flex flex-col items-center">
            <h1 className="text-xl font-bold text-white">Jump Climb</h1>
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
          {/* Real-time Score Display - Top Left Corner */}
          {gameState === 'playing' && (
            <div className="absolute top-2 left-2 bg-purple-600/90 rounded-lg px-3 py-1.5 shadow-lg z-10">
              <div className="text-2xl font-bold text-white">{score}</div>
            </div>
          )}
          
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onClick={jump}
            className="border-4 border-slate-700 rounded-lg shadow-2xl cursor-pointer bg-slate-800"
          />
          
          {gameState === 'gameover' && !showContinueModal && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center rounded-lg">
              <div className="text-center p-8 bg-slate-800 rounded-xl border-2 border-purple-500 shadow-2xl max-w-sm">
                <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-white mb-2">You Fell!</h2>
                <p className="text-slate-300 mb-2">Reached Floor {score}</p>
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
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold w-full"
                  >
                    Try Again
                  </button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-red-400 text-sm mb-2">No lives left!</p>
                    <button
                      onClick={() => {
                        setShowRefillModal(true);
                        setShowRewardModal(false);
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

      {/* Reward 2x Modal */}
      <RewardedAdModal
        open={showRewardModal}
        onClose={handleSkipReward}
        onRewardGranted={handleRewardAd}
        title="Double Your Darts!"
        description={finalScore > 0 ? `You earned ${finalScore} Darts! Watch an ad to earn ${finalScore} MORE (${finalScore * 2} total)!` : `No Darts earned. Reach floor 5 to earn rewards!`}
      />

      {/* Continue from Checkpoint Modal */}
      <RewardedAdModal
        open={showContinueModal}
        onClose={handleSkipContinue}
        onRewardGranted={handleContinueAd}
        title="Continue from Checkpoint?"
        description={`Watch an ad to continue from Floor ${checkpoint}!`}
      />

      {/* Life Refill Modal */}
      <RewardedAdModal
        open={showRefillModal}
        onClose={() => setShowRefillModal(false)}
        onRewardGranted={handleLifeRefillAd}
        title="Refill All Lives"
        description={`Watch an ad to refill all ${MAX_LIVES} lives!`}
      />

    </div>
  );
};

export default JumpClimb;