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
}

const GameBoard: React.FC<GameBoardProps> = ({
  levelConfig,
  onGameEnd,
  onScoreChange,
  onObjectivesChange,
  activeBooster,
  onBoosterUsed,
  extraMoves,
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

  // Calculate tile size based on container
  const [tileSize, setTileSize] = useState(40);

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

        // Update state for animation
        setBoard(currentBoard);
        setScore(currentScore);
        setObjectives(currentObjectives);
        setCombo(currentCombo);
        setIsAnimating(true);

        await new Promise(resolve => setTimeout(resolve, 200));

        // Apply gravity
        const gravityResult = applyGravity(currentBoard);
        if (gravityResult.hasFalls) {
          currentBoard = gravityResult.newBoard;
          soundManager.cascade();

          setBoard(currentBoard);
          await new Promise(resolve => setTimeout(resolve, 150));

          // Reset animation flags
          currentBoard = currentBoard.map(row => 
            row.map(tile => ({
              ...tile,
              isFalling: false,
              isSpawning: false,
              fallDistance: 0,
            }))
          );
          setBoard(currentBoard);
        }
      }
    }

    // Check for possible moves
    let hasMoves = hasPossibleMoves(currentBoard);
    if (!hasMoves) {
      currentBoard = shuffleBoard(currentBoard);
      setBoard(currentBoard);
      hasMoves = hasPossibleMoves(currentBoard);
    }

    // Check win/lose conditions
    const won = checkWinCondition(currentObjectives);
    const lost = checkLoseCondition(hasMoves, currentObjectives);

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
  }, [onGameEnd]);

  // Handle tile click
  const handleTileClick = useCallback((row: number, col: number) => {
    if (isAnimating || gameStatus !== 'playing') return;

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
        setTimeout(() => {
          processCascade(result.newBoard, score + result.score, result.updatedObjectives);
        }, 200);
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
        // Try to swap
        if (canSwap(board, selectedTile, clickedPos)) {
          soundManager.swap();

          const newBoard = swapTiles(board, selectedTile, clickedPos);

          // Check for special tile activation
          const selectedTileData = board[selectedTile.row][selectedTile.col];
          const targetTile = board[clickedPos.row][clickedPos.col];

          let finalBoard = newBoard;
          let extraScore = 0;
          let finalObjectives = objectives;

          if (selectedTileData.special !== 'none') {
            const result = activateSpecialTile(newBoard, clickedPos, objectives);
            finalBoard = result.newBoard;
            extraScore += result.score;
            finalObjectives = result.updatedObjectives;
            soundManager.bomb();
          }

          if (targetTile.special !== 'none') {
            const result = activateSpecialTile(finalBoard, selectedTile, finalObjectives);
            finalBoard = result.newBoard;
            extraScore += result.score;
            finalObjectives = result.updatedObjectives;
            soundManager.bomb();
          }

          setBoard(finalBoard);
          setScore(prev => prev + extraScore);
          setObjectives(finalObjectives);
          setSelectedTile(null);
          setIsAnimating(true);

          setTimeout(() => {
            processCascade(finalBoard, score + extraScore, finalObjectives);
          }, 200);
        } else {
          // Invalid swap
          setSelectedTile(null);
        }
      } else {
        // Select new tile
        if (tile.type === 'gem') {
          setSelectedTile(clickedPos);
        } else {
          setSelectedTile(null);
        }
      }
    }
  }, [board, moves, score, objectives, isAnimating, gameStatus, selectedTile, activeBooster, onBoosterUsed, processCascade]);

  return (
    <div
      ref={boardRef}
      className="relative bg-gradient-to-br from-slate-900 via-purple-900/80 to-indigo-900/80 rounded-2xl p-3 backdrop-blur-sm shadow-2xl border border-purple-500/20"
      style={{
        width: '100%',
        maxWidth: 420,
        boxShadow: '0 0 40px rgba(139, 69, 207, 0.2), inset 0 0 40px rgba(0, 0, 0, 0.3)',
      }}
    >
      <div
        className="grid gap-0"
        style={{
          gridTemplateColumns: `repeat(${BOARD_SIZE}, ${tileSize}px)`,
          gridTemplateRows: `repeat(${BOARD_SIZE}, ${tileSize}px)`,
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
            />
          ))
        )}
      </div>

      {/* Combo indicator */}
      {combo > 1 && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20">
          <div className="relative">
            <div className="text-5xl font-black text-transparent bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text animate-bounce drop-shadow-2xl">
              {combo}x COMBO!
            </div>
            {/* Particle effects */}
            <div className="absolute inset-0">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-ping"
                  style={{
                    top: `${20 + Math.random() * 60}%`,
                    left: `${20 + Math.random() * 60}%`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: '1s',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Booster active indicator */}
      {activeBooster && (
        <div className="absolute inset-0 border-4 border-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl pointer-events-none animate-pulse shadow-2xl" 
             style={{ boxShadow: '0 0 30px rgba(251, 191, 36, 0.5)' }} />
      )}
    </div>
  );
};

export default GameBoard;
