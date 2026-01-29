// src/components/JumpClimb.tsx
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Trophy, RotateCcw, Heart } from 'lucide-react';
import SoundToggle from './SoundToggle';
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
const JUMP_FORCE = -11.5;
const PLAYER_SPEED = 5;
const INITIAL_PLATFORM_WIDTH = 100;
const MIN_PLATFORM_WIDTH = 35;
const PLATFORM_GAP = 90; // Bigger gap between platforms
const PLATFORM_SPEED = 1.5; // Platform horizontal movement speed
const MAX_LIVES = 10;
const LIFE_REFILL_MS = 5 * 60 * 1000; // 5 minutes

const JumpClimb: React.FC<JumpClimbProps> = ({ onGameComplete }) => {
  const navigate = useNavigate();
  const { addTransaction } = useWallet();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Sound effects - use relative paths for Capacitor
  const failSound = useRef(new Audio('./sounds/fail.mp3'));
  const jumpSound = useRef(new Audio('./sounds/jump.mp3'));
  
  const [gameState, setGameState] = useState<'playing' | 'gameover'>('playing');
  const [score, setScore] = useState(0);
  const [highestPlatform, setHighestPlatform] = useState(0);
  const [checkpoint, setCheckpoint] = useState(0);
  
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [player, setPlayer] = useState<Player>({
    x: CANVAS_WIDTH / 2 - PLAYER_SIZE / 2,
    y: CANVAS_HEIGHT - 150,
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
  const isSwiping = useRef<boolean>(false);
  const audioInitialized = useRef<boolean>(false);

  // Initialize audio
  useEffect(() => {
    const initAudio = () => {
      if (audioInitialized.current) return;
      
      // Set volume and preload
      failSound.current.volume = 0.5;
      failSound.current.load();

      // Jump sound
      jumpSound.current.volume = 0.6;
      jumpSound.current.load();
      
      audioInitialized.current = true;
    };

    // Initialize on first touch/click
    const handleFirstInteraction = () => {
      initAudio();
      document.removeEventListener('touchstart', handleFirstInteraction);
      document.removeEventListener('click', handleFirstInteraction);
    };

    document.addEventListener('touchstart', handleFirstInteraction);
    document.addEventListener('click', handleFirstInteraction);
    
    return () => {
      document.removeEventListener('touchstart', handleFirstInteraction);
      document.removeEventListener('click', handleFirstInteraction);
    };
  }, []);

  // Initialize platforms
  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
    const initialPlatforms: Platform[] = [];
    
    // Ground platform (static, no movement)
    initialPlatforms.push({
      x: 0,
      y: CANVAS_HEIGHT - 50,
      width: CANVAS_WIDTH,
      color: '#10b981',
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
        y: CANVAS_HEIGHT - 50 - i * PLATFORM_GAP,
        width,
        color: `hsl(${200 + i * 10}, 70%, 60%)`,
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
      if (e.key === ' ' && gameState === 'playing' && !player.isJumping) {
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
  }, [gameState, player.isJumping]);

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
        
        // Move player based on swipe direction
        setPlayer(prev => {
          let newX = prev.x;
          if (deltaX > 0) {
            // Swipe right
            newX = Math.min(CANVAS_WIDTH - PLAYER_SIZE, prev.x + PLAYER_SPEED);
          } else {
            // Swipe left
            newX = Math.max(0, prev.x - PLAYER_SPEED);
          }
          return { ...prev, x: newX };
        });
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
    };

    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove, { passive: true });
    canvas.addEventListener('touchend', handleTouchEnd);

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [gameState, player.isJumping]);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = () => {
      // Move platforms horizontally
      setPlatforms(prev => prev.map(platform => {
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
      }));
      
      setPlayer(prev => {
        let newX = prev.x;
        let newY = prev.y + prev.velocityY;
        let newVelocityY = prev.velocityY + GRAVITY;
        let newIsJumping = prev.isJumping;
        let standingPlatform: Platform | null = null;

        // Check if player is standing on a platform (before applying horizontal movement)
        platforms.forEach(platform => {
          if (
            prev.velocityY >= 0 &&
            Math.abs((prev.y + PLAYER_SIZE) - platform.y) < 3 &&
            prev.x + PLAYER_SIZE > platform.x &&
            prev.x < platform.x + platform.width
          ) {
            standingPlatform = platform;
          }
        });

        // If standing on a moving platform, move with it
        if (standingPlatform && standingPlatform.velocityX && standingPlatform.direction) {
          const platformMovement = standingPlatform.velocityX * standingPlatform.direction;
          newX = prev.x + platformMovement;
          // Keep player within canvas bounds
          newX = Math.max(0, Math.min(CANVAS_WIDTH - PLAYER_SIZE, newX));
        }

        // Horizontal movement
        if (keysPressed.current.has('ArrowLeft') || keysPressed.current.has('a')) {
          newX = Math.max(0, newX - PLAYER_SPEED);
        }
        if (keysPressed.current.has('ArrowRight') || keysPressed.current.has('d')) {
          newX = Math.min(CANVAS_WIDTH - PLAYER_SIZE, newX + PLAYER_SPEED);
        }

        // Platform collision
        platforms.forEach((platform, idx) => {
          // Reveal trap if player is close (within 80 pixels vertically)
          if (platform.hasTrap && !platform.trapRevealed && Math.abs(newY - platform.y) < 80) {
            setPlatforms(prev => prev.map((p, i) => 
              i === idx ? { ...p, trapRevealed: true } : p
            ));
          }
          
          if (
            newVelocityY > 0 &&
            prev.y + PLAYER_SIZE <= platform.y &&
            newY + PLAYER_SIZE >= platform.y &&
            newX + PLAYER_SIZE > platform.x &&
            newX < platform.x + platform.width
          ) {
            // Check if player landed on a trap
            if (platform.hasTrap && platform.trapX !== undefined && platform.trapWidth !== undefined) {
              const playerCenter = newX + PLAYER_SIZE / 2;
              const trapAbsoluteX = platform.x + platform.trapX;
              const trapAbsoluteEndX = trapAbsoluteX + platform.trapWidth;
              
              if (playerCenter >= trapAbsoluteX && playerCenter <= trapAbsoluteEndX) {
                // Player landed on trap - activate it visually!
                setPlatforms(prev => prev.map((p, i) => 
                  i === idx ? { ...p, trapActivated: true, trapRevealed: true } : p
                ));
                setTrapActivatedIndex(idx);
                
                // Small delay to show trap activation before game over
                setTimeout(() => {
                  endGame();
                }, 300);
                return;
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
                  setPlatforms(prev => prev.map((p, i) => 
                    i === idx ? { ...p, bombExploded: true } : p
                  ));
                  
                  // Small delay to show explosion before game over
                  setTimeout(() => {
                    endGame();
                  }, 400);
                  return;
                }
              } else {
                // Bomb on left side, player must be on right
                if (playerCenter < platformCenter) {
                  // Player hit the bomb, trigger explosion!
                  setPlatforms(prev => prev.map((p, i) => 
                    i === idx ? { ...p, bombExploded: true } : p
                  ));
                  
                  // Small delay to show explosion before game over
                  setTimeout(() => {
                    endGame();
                  }, 400);
                  return;
                }
              }
            }
            
            newY = platform.y - PLAYER_SIZE;
            newVelocityY = 0;
            newIsJumping = false;
          }
        });

        // Camera follow - both up and down
        if (newY < CANVAS_HEIGHT / 3) {
          // Player going up - move camera up
          const diff = CANVAS_HEIGHT / 3 - newY;
          setCameraY(prev => prev + diff);
          newY = CANVAS_HEIGHT / 3;
          
          // Shift platforms down
          setPlatforms(prev => prev.map(p => ({ ...p, y: p.y + diff })));
        } else if (newY > CANVAS_HEIGHT * 2 / 3) {
          // Player falling down - move camera down to follow
          const diff = newY - CANVAS_HEIGHT * 2 / 3;
          setCameraY(prev => prev - diff);
          newY = CANVAS_HEIGHT * 2 / 3;
          
          // Shift platforms up
          setPlatforms(prev => prev.map(p => ({ ...p, y: p.y - diff })));
        }

        // Update score and generate new platforms
        const currentPlatformIndex = platforms.findIndex(p => 
          newY + PLAYER_SIZE >= p.y && 
          newY + PLAYER_SIZE <= p.y + PLATFORM_HEIGHT &&
          newX + PLAYER_SIZE > p.x && 
          newX < p.x + p.width
        );
        
        if (currentPlatformIndex > highestPlatform) {
          setHighestPlatform(currentPlatformIndex);
          setScore(currentPlatformIndex);
          
          // Set checkpoint every 5 platforms
          if (currentPlatformIndex % 5 === 0 && currentPlatformIndex > 0) {
            setCheckpoint(currentPlatformIndex);
          }
          
          // Generate new platform
          const topPlatform = platforms[platforms.length - 1];
          const width = Math.max(MIN_PLATFORM_WIDTH, INITIAL_PLATFORM_WIDTH - platforms.length * 2.5);
          const hasGate = platforms.length > 15 && Math.random() < 0.4; // 40% chance after floor 15
          // Add hidden traps every 10-12 floors (floors 10,11,12, 20,21,22, etc.)
          const floorMod = platforms.length % 10;
          const hasTrap = !hasGate && (floorMod === 0 || floorMod === 1 || floorMod === 2);
          const trapWidth = hasTrap ? Math.min(width * 0.4, 25) : 0;
          const trapX = hasTrap ? Math.random() * (width - trapWidth) : 0;
          
          setPlatforms(prev => [...prev, {
            x: Math.random() * (CANVAS_WIDTH - width),
            y: topPlatform.y - PLATFORM_GAP,
            width,
            color: `hsl(${200 + platforms.length * 10}, 70%, 60%)`,
            hasGate: hasGate,
            gateOpenLeft: hasGate ? Math.random() < 0.5 : undefined,
            hasTrap: hasTrap,
            trapRevealed: false,
            trapX: trapX,
            trapWidth: trapWidth,
            velocityX: PLATFORM_SPEED,
            direction: Math.random() < 0.5 ? 1 : -1 // Random initial direction
          }]);
        }

        // Check if fallen off screen
        if (newY > CANVAS_HEIGHT + 100) {
          endGame();
        }

        return {
          x: newX,
          y: newY,
          velocityY: newVelocityY,
          isJumping: newIsJumping
        };
      });

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState, platforms, highestPlatform]);

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear with gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#1e1b4b');
    gradient.addColorStop(1, '#0f172a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw platforms
    platforms.forEach((platform, index) => {
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
    const px = player.x;
    const py = player.y;
    
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

    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Floor ${score}`, CANVAS_WIDTH / 2, 40);

  }, [platforms, player, score]);

  const jump = () => {
    if (!player.isJumping && gameState === 'playing') {
      setPlayer(prev => ({
        ...prev,
        velocityY: JUMP_FORCE,
        isJumping: true
      }));
      // Play jump sound if not muted
      try {
        const muted = localStorage.getItem('game_sounds_muted') === 'true';
        if (!muted) {
          jumpSound.current.currentTime = 0;
          jumpSound.current.volume = 0.6;
          jumpSound.current.play().catch(e => console.log('Jump sound failed:', e));
        }
      } catch (e) {
        console.log('Jump sound error:', e);
      }
    }
  };

  const endGame = () => {
    setGameState('gameover');
    
    // Play fail sound if not muted
    try {
      const muted = localStorage.getItem('game_sounds_muted') === 'true';
      if (!muted) {
        failSound.current.currentTime = 0;
        failSound.current.volume = 0.4;
        failSound.current.play().catch(e => console.log('Sound play failed:', e));
      }
    } catch (e) {
      console.log('Fail sound error:', e);
    }
    
    // Only award darts for complete sets of 5 floors (1 dart per floor)
    const completedSets = Math.floor(score / 5);
    const dartPoints = completedSets * 5;
    setFinalScore(dartPoints);
    
    // Check if can continue (fell from high enough)
    const fellFrom = score > checkpoint + 3;
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
      addTransaction('Game', dartPoints, `Jump Climb - Floor ${score}`, 'jump-climb');
      
      const userProfile = leaderboardService.getUserProfile();
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
    if (score > (gameStateData.highScores?.jumpClimb || 0)) {
      gameStateData.highScores = gameStateData.highScores || {};
      gameStateData.highScores.jumpClimb = score;
      localStorage.setItem('gameState', JSON.stringify(gameStateData));
      
      // Sync high score to Firebase
      firebaseStorage.updateJumpClimbProgress({
        highScore: score
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
    const bonusDarts = finalScore; // Additional bonus points (same as base)
    addTransaction('Game', bonusDarts, `Jump Climb - Floor ${score} (2x Bonus)`, 'jump-climb');
    
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
      onGameComplete(score);
    }
  };

  const handleSkipReward = () => {
    // No additional bonus, already added base score in endGame
    setShowRewardModal(false);
    
    if (onGameComplete) {
      onGameComplete(score);
    }
  };

  const handleContinueAd = () => {
    // Continue from checkpoint
    setGameState('playing');
    setScore(checkpoint);
    setHighestPlatform(checkpoint);
    
    // Reset player to checkpoint platform
    const checkpointPlatform = platforms[checkpoint];
    if (checkpointPlatform) {
      setPlayer({
        x: checkpointPlatform.x + checkpointPlatform.width / 2 - PLAYER_SIZE / 2,
        y: checkpointPlatform.y - PLAYER_SIZE - 10,
        velocityY: 0,
        isJumping: false
      });
    }
    
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
    
    // Consume a life
    const newLives = currentLives - 1;
    setCurrentLives(newLives);
    localStorage.setItem('jumpclimb_lives', newLives.toString());
    
    // Start life refill timer if needed
    if (newLives < MAX_LIVES && nextLifeTime === 0) {
      const nextLife = Date.now() + LIFE_REFILL_MS;
      setNextLifeTime(nextLife);
      localStorage.setItem('jumpclimb_nextLife', nextLife.toString());
    }
    
    // Sync to Firebase
    firebaseStorage.updateJumpClimbProgress({
      lives: newLives,
      lastLifeUpdate: Date.now()
    }).catch(err => console.log('Firebase sync failed:', err));
    
    setGameState('playing');
    setScore(0);
    setHighestPlatform(0);
    setCheckpoint(0);
    setCameraY(0);
    setTrapActivatedIndex(-1);
    setPlayer({
      x: CANVAS_WIDTH / 2 - PLAYER_SIZE / 2,
      y: CANVAS_HEIGHT - 150,
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
          <SoundToggle />
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
        description={finalScore > 0 ? `Watch an ad to get ${finalScore * 2} Darts instead of ${finalScore}!` : `No Darts earned. Reach floor 5 to earn rewards!`}
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
        description="Watch an ad to refill all 3 lives!"
      />

      {/* Banner Ad */}
      <div className="fixed bottom-20 left-0 right-0 px-4">
        <BannerAd />
      </div>
    </div>
  );
};

export default JumpClimb;
