// Game Board Component for Match-3 Game

import React, { useState, useEffect, useCallback, useRef } from 'react';
import TileComponent from "./TileComponent";
import {
  Tile,
  Position,
  Objective,
  GameState,
  BoosterType,
  BOARD_SIZE,
  LevelConfig,
} from '@/game/types';
import {
  createInitialBoard,
  findMatches,
  processMatches,
  applyGravity,
  swapTiles,
  canSwap,
  isAdjacent,
  activateSpecialTile,
  applyBooster,
  checkWinCondition,
  checkLoseCondition,
  hasPossibleMoves,
  shuffleBoard,
} from '@/game/engine';
import { soundManager } from '@/game/sounds';

interface GameBoardProps {
  levelConfig: LevelConfig;
  onGameEnd: (won: boolean, score: number, objectives: Objective[]) => void;
  onScoreChange: (score: number) => void;
  onObjectivesChange: (objectives: Objective[]) => void;
  activeBooster: BoosterType | null;
  onBoosterUsed: () => void;
  extraMoves: number;
  movesRemaining: number;
  onMoveMade: () => void;
}

const GameBoard: React.FC<GameBoardProps> = ({
  levelConfig,
  onGameEnd,
  onScoreChange,
  onObjectivesChange,
  activeBooster,
  onBoosterUsed,
  extraMoves,
  movesRemaining,
  onMoveMade,
}) => {
  const [board, setBoard] = useState<Tile[][]>(() => createInitialBoard(levelConfig));
  const [score, setScore] = useState(0);
  const [objectives, setObjectives] = useState<Objective[]>(() => 
    levelConfig.objectives.map(o => ({ ...o }))
  );
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedTile, setSelectedTile] = useState<Position | null>(null);
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [combo, setCombo] = useState(0);

  const isProcessing = useRef(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const gameEndedRef = useRef(false);
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);

  // Touch/swipe handling
  const touchStartRef = useRef<{ x: number; y: number; row: number; col: number } | null>(null);
  const touchMoveThreshold = 15; // pixels to detect swipe
  const lastClickTimeRef = useRef(0);
  const clickDebounceMs = 50; // Prevent rapid clicks

  // Calculate tile size based on container
  const [tileSize, setTileSize] = useState(40);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      timeoutRefs.current = [];
    };
  }, []);

  useEffect(() => {
    const updateSize = () => {
      if (boardRef.current) {
        const containerWidth = boardRef.current.offsetWidth;
        if (containerWidth > 0) {
          const newSize = Math.floor((containerWidth - 16) / BOARD_SIZE);
          setTileSize(Math.max(20, Math.min(newSize, 50))); // Minimum 20px, maximum 50px
        }
      }
    };

    // Delay to ensure DOM is ready
    setTimeout(updateSize, 100);
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Sync state with parent
  useEffect(() => {
    onScoreChange(score);
  }, [score, onScoreChange]);

  useEffect(() => {
    onObjectivesChange(objectives);
  }, [objectives, onObjectivesChange]);

  // Check for game end when moves reach 0
  useEffect(() => {
    if (movesRemaining <= 0 && gameStatus === 'playing' && !gameEndedRef.current && !isProcessing.current) {
      const won = checkWinCondition(objectives);
      if (!won) {
        gameEndedRef.current = true;
        setGameStatus('lost');
        soundManager.lose();
        onGameEnd(false, score, objectives);
      }
    }
  }, [movesRemaining, gameStatus, objectives, score, onGameEnd]);

  // Process cascades
  const processCascade = useCallback(async (
    initialBoard: Tile[][],
    initialScore: number,
    initialObjectives: Objective[]
  ) => {
    if (isProcessing.current) return;
    isProcessing.current = true;

    let currentBoard = initialBoard;
    let currentScore = initialScore;
    let currentObjectives = initialObjectives;
    let currentCombo = 0;
    let hasChanges = true;

    while (hasChanges) {
      hasChanges = false;

      // Find matches
      const matches = findMatches(currentBoard);

      if (matches.length > 0) {
        hasChanges = true;
        currentCombo++;
        soundManager.match();

        // Process matches
        const result = processMatches(currentBoard, matches, currentObjectives);
        currentBoard = result.newBoard;
        currentScore += result.score * currentCombo;
        currentObjectives = result.updatedObjectives;

        // Only update state once per match, not every iteration
        setCombo(currentCombo);
        setIsAnimating(true);

        await new Promise(resolve => setTimeout(resolve, 60));

        // Apply gravity
        const gravityResult = applyGravity(currentBoard);
        if (gravityResult.hasFalls) {
          currentBoard = gravityResult.newBoard;
          soundManager.cascade();

          await new Promise(resolve => setTimeout(resolve, 40));

          // Reset animation flags
          currentBoard = currentBoard.map(row => 
            row.map(tile => ({
              ...tile,
              isFalling: false,
              isSpawning: false,
              fallDistance: 0,
            }))
          );
        }
      }
    }

    // Check for possible moves
    let hasMoves = hasPossibleMoves(currentBoard);
    if (!hasMoves) {
      currentBoard = shuffleBoard(currentBoard);
      hasMoves = hasPossibleMoves(currentBoard);
    }

    // Check win/lose conditions
    const won = checkWinCondition(currentObjectives);
    const lost = checkLoseCondition(hasMoves, currentObjectives) || (movesRemaining <= 0 && !won);

    // Update all state at once at the end
    setBoard(currentBoard);
    setScore(currentScore);
    setObjectives(currentObjectives);
    setIsAnimating(false);
    setCombo(0);

    if (won && !gameEndedRef.current) {
      gameEndedRef.current = true;
      setGameStatus('won');
      soundManager.win();
      onGameEnd(true, currentScore, currentObjectives);
    } else if (lost && !gameEndedRef.current) {
      gameEndedRef.current = true;
      setGameStatus('lost');
      soundManager.lose();
      onGameEnd(false, currentScore, currentObjectives);
    }

    isProcessing.current = false;
  }, [movesRemaining, onGameEnd]);

  // Handle tile click
  const handleTileClick = useCallback((row: number, col: number) => {
    // Debounce clicks
    const now = Date.now();
    if (now - lastClickTimeRef.current < clickDebounceMs) return;
    lastClickTimeRef.current = now;

    // Block all interactions during animations or processing
    if (isAnimating || gameStatus !== 'playing' || movesRemaining <= 0 || isProcessing.current) return;

    const clickedPos: Position = { row, col };
    const tile = board[row][col];

    soundManager.click();

    // Handle booster
    if (activeBooster) {
      if (tile.type === 'gem' || tile.type === 'stone' || tile.type === 'magma') {
        const result = applyBooster(board, clickedPos, activeBooster, objectives);
        soundManager.bomb();

        setBoard(result.newBoard);
        setScore(prev => prev + result.score);
        setObjectives(result.updatedObjectives);
        setIsAnimating(true);

        onBoosterUsed();
        const timeout = setTimeout(() => {
          processCascade(result.newBoard, score + result.score, result.updatedObjectives);
        }, 80);
        timeoutRefs.current.push(timeout);
      }
      return;
    }

    // Handle tile selection and swapping
    if (!selectedTile) {
      if (tile.type === 'gem') {
        setSelectedTile(clickedPos);
      }
    } else {
      if (selectedTile.row === row && selectedTile.col === col) {
        // Deselect
        setSelectedTile(null);
      } else if (isAdjacent(selectedTile, clickedPos)) {
        performSwap(selectedTile, clickedPos);
      } else {
        // Select new tile
        if (tile.type === 'gem') {
          setSelectedTile(clickedPos);
        } else {
          setSelectedTile(null);
        }
      }
    }
  }, [board, score, objectives, isAnimating, gameStatus, selectedTile, activeBooster, onBoosterUsed, processCascade, onMoveMade]);

  // Extract swap logic to reuse for both click and swipe
  const performSwap = useCallback((from: Position, to: Position) => {
    // Clear selection immediately to prevent double-clicks
    setSelectedTile(null);
    
    if (!canSwap(board, from, to)) {
      return;
    }

    soundManager.swap();
    onMoveMade();

    const newBoard = swapTiles(board, from, to);
    const selectedTileData = board[from.row][from.col];
    const targetTile = board[to.row][to.col];

    let finalBoard = newBoard;
    let extraScore = 0;
    let finalObjectives = objectives;

    if (selectedTileData.special !== 'none') {
      const result = activateSpecialTile(newBoard, to, objectives);
      finalBoard = result.newBoard;
      extraScore += result.score;
      finalObjectives = result.updatedObjectives;
      soundManager.bomb();
    }

    if (targetTile.special !== 'none') {
      const result = activateSpecialTile(finalBoard, from, finalObjectives);
      finalBoard = result.newBoard;
      extraScore += result.score;
      finalObjectives = result.updatedObjectives;
      soundManager.bomb();
    }

    setBoard(finalBoard);
    setScore(prev => prev + extraScore);
    setObjectives(finalObjectives);
    setIsAnimating(true);

    const timeout = setTimeout(() => {
      processCascade(finalBoard, score + extraScore, finalObjectives);
    }, 80);
    timeoutRefs.current.push(timeout);
  }, [board, score, objectives, processCascade, onMoveMade]);

  // Touch handlers for swipe gestures
  const handleTouchStart = useCallback((e: React.TouchEvent, row: number, col: number) => {
    if (isAnimating || gameStatus !== 'playing' || activeBooster || movesRemaining <= 0) return;
    
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      row,
      col
    };
  }, [isAnimating, gameStatus, activeBooster, movesRemaining]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || isAnimating || gameStatus !== 'playing' || movesRemaining <= 0) return;
    
    e.preventDefault(); // Prevent scrolling
  }, [isAnimating, gameStatus, movesRemaining]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || isAnimating || gameStatus !== 'playing') return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    
    // Check if swipe is significant enough
    if (absDeltaX > touchMoveThreshold || absDeltaY > touchMoveThreshold) {
      const { row, col } = touchStartRef.current;
      let targetRow = row;
      let targetCol = col;
      
      // Determine swipe direction
      if (absDeltaX > absDeltaY) {
        // Horizontal swipe
        targetCol = deltaX > 0 ? col + 1 : col - 1;
      } else {
        // Vertical swipe
        targetRow = deltaY > 0 ? row + 1 : row - 1;
      }
      
      // Validate target position
      if (targetRow >= 0 && targetRow < BOARD_SIZE && targetCol >= 0 && targetCol < BOARD_SIZE) {
        const tile = board[row][col];
        if (tile.type === 'gem') {
          performSwap({ row, col }, { row: targetRow, col: targetCol });
        }
      }
    }
    
    touchStartRef.current = null;
  }, [board, isAnimating, gameStatus, performSwap]);

  return (
    <div
      ref={boardRef}
      className="relative bg-gradient-to-br from-slate-900 via-purple-900/80 to-indigo-900/80 rounded-2xl p-3 shadow-xl border border-purple-500/20"
      style={{
        width: '100%',
        maxWidth: 420,
        boxShadow: '0 0 20px rgba(139, 69, 207, 0.15)',
        willChange: isAnimating ? 'contents' : 'auto',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'none',
      }}
    >
      <div
        className="grid gap-0"
        style={{
          gridTemplateColumns: `repeat(${BOARD_SIZE}, ${tileSize}px)`,
          gridTemplateRows: `repeat(${BOARD_SIZE}, ${tileSize}px)`,
          touchAction: 'none',
        }}
      >
        {board.map((row, rowIndex) =>
          row.map((tile, colIndex) => (
            <TileComponent
              key={tile.id}
              tile={tile}
              size={tileSize}
              isSelected={
                selectedTile?.row === rowIndex &&
                selectedTile?.col === colIndex
              }
              onClick={() => handleTileClick(rowIndex, colIndex)}
              onTouchStart={(e) => handleTouchStart(e, rowIndex, colIndex)}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            />
          ))
        )}
      </div>

      {/* Combo indicator - simplified for mobile performance */}
      {combo > 1 && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20">
          <div className="text-4xl font-black text-transparent bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text drop-shadow-lg">
            {combo}x COMBO!
          </div>
        </div>
      )}

      {/* Booster active indicator */}
      {activeBooster && (
        <div className="absolute inset-0 border-3 border-yellow-400 rounded-2xl pointer-events-none animate-pulse" 
             style={{ boxShadow: '0 0 15px rgba(251, 191, 36, 0.4)' }} />
      )}
    </div>
  );
};

export default GameBoard;
