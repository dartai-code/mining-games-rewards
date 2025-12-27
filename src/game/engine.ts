// Game Engine for Match-3 Game

import {
  Tile,
  TileType,
  GemColor,
  SpecialType,
  Position,
  Objective,
  ObjectiveType,
  GEM_COLORS,
  BOARD_SIZE,
  LevelConfig,
  GameState,
} from './types';

let tileIdCounter = 0;

export function generateTileId(): string {
  return `tile_${++tileIdCounter}_${Date.now()}`;
}

export function createTile(
  row: number,
  col: number,
  type: TileType = 'gem',
  color: GemColor | null = null,
  special: SpecialType = 'none',
  hp: number = 0,
  jellyLayers: number = 0
): Tile {
  return {
    id: generateTileId(),
    type,
    color: type === 'gem' ? (color || getRandomColor()) : null,
    special,
    hp,
    jellyLayers,
    row,
    col,
    isMatched: false,
    isExploding: false,
    isFalling: false,
    isSpawning: false,
    fallDistance: 0,
  };
}

export function getRandomColor(): GemColor {
  return GEM_COLORS[Math.floor(Math.random() * GEM_COLORS.length)];
}

export function createInitialBoard(config: LevelConfig): Tile[][] {
  const board: Tile[][] = [];

  // Initialize empty board
  for (let row = 0; row < BOARD_SIZE; row++) {
    board[row] = [];
    for (let col = 0; col < BOARD_SIZE; col++) {
      board[row][col] = createTile(row, col, 'gem');
    }
  }

  // Place stones
  if (config.stonePositions) {
    config.stonePositions.forEach(pos => {
      if (pos.row < BOARD_SIZE && pos.col < BOARD_SIZE) {
        board[pos.row][pos.col] = createTile(pos.row, pos.col, 'stone', null, 'none', 1);
      }
    });
  }

  // Place magma
  if (config.magmaPositions) {
    config.magmaPositions.forEach(pos => {
      if (pos.row < BOARD_SIZE && pos.col < BOARD_SIZE) {
        board[pos.row][pos.col] = createTile(pos.row, pos.col, 'magma', null, 'none', 2);
      }
    });
  }

  // Place jelly layers
  if (config.jellyPositions) {
    config.jellyPositions.forEach(({ pos, layers }) => {
      if (pos.row < BOARD_SIZE && pos.col < BOARD_SIZE) {
        const tile = board[pos.row][pos.col];
        if (tile.type === 'gem') {
          tile.jellyLayers = layers;
        }
      }
    });
  }

  // Ensure no initial matches
  return ensureNoInitialMatches(board);
}

function ensureNoInitialMatches(board: Tile[][]): Tile[][] {
  let hasMatches = true;
  let iterations = 0;
  const maxIterations = 100;

  while (hasMatches && iterations < maxIterations) {
    hasMatches = false;
    iterations++;

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const tile = board[row][col];
        if (tile.type !== 'gem') continue;

        // Check horizontal
        if (col >= 2 && tile.color === board[row][col - 1]?.color && tile.color === board[row][col - 2]?.color) {
          tile.color = getRandomColorExcluding([tile.color!]);
          hasMatches = true;
        }

        // Check vertical
        if (row >= 2 && tile.color === board[row - 1]?.[col]?.color && tile.color === board[row - 2]?.[col]?.color) {
          tile.color = getRandomColorExcluding([tile.color!]);
          hasMatches = true;
        }
      }
    }
  }

  return board;
}

function getRandomColorExcluding(exclude: GemColor[]): GemColor {
  const available = GEM_COLORS.filter(c => !exclude.includes(c));
  return available[Math.floor(Math.random() * available.length)] || GEM_COLORS[0];
}

export function findMatches(board: Tile[][]): Position[][] {
  const matches: Position[][] = [];
  const visited = new Set<string>();

  // Find horizontal matches
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE - 2; col++) {
      const tile = board[row][col];
      if (tile.type !== 'gem' || !tile.color) continue;

      const matchPositions: Position[] = [{ row, col }];
      let nextCol = col + 1;

      while (nextCol < BOARD_SIZE && board[row][nextCol]?.type === 'gem' && board[row][nextCol]?.color === tile.color) {
        matchPositions.push({ row, col: nextCol });
        nextCol++;
      }

      if (matchPositions.length >= 3) {
        const key = matchPositions.map(p => `${p.row},${p.col}`).sort().join('|');
        if (!visited.has(key)) {
          visited.add(key);
          matches.push(matchPositions);
        }
      }
    }
  }

  // Find vertical matches
  for (let col = 0; col < BOARD_SIZE; col++) {
    for (let row = 0; row < BOARD_SIZE - 2; row++) {
      const tile = board[row][col];
      if (tile.type !== 'gem' || !tile.color) continue;

      const matchPositions: Position[] = [{ row, col }];
      let nextRow = row + 1;

      while (nextRow < BOARD_SIZE && board[nextRow]?.[col]?.type === 'gem' && board[nextRow]?.[col]?.color === tile.color) {
        matchPositions.push({ row: nextRow, col });
        nextRow++;
      }

      if (matchPositions.length >= 3) {
        const key = matchPositions.map(p => `${p.row},${p.col}`).sort().join('|');
        if (!visited.has(key)) {
          visited.add(key);
          matches.push(matchPositions);
        }
      }
    }
  }

  // Merge overlapping matches
  return mergeMatches(matches);
}

function mergeMatches(matches: Position[][]): Position[][] {
  if (matches.length === 0) return [];

  const merged: Position[][] = [];
  const used = new Set<number>();

  for (let i = 0; i < matches.length; i++) {
    if (used.has(i)) continue;

    const currentMatch = [...matches[i]];
    used.add(i);

    let foundOverlap = true;
    while (foundOverlap) {
      foundOverlap = false;
      for (let j = 0; j < matches.length; j++) {
        if (used.has(j)) continue;

        const hasOverlap = matches[j].some(p1 =>
          currentMatch.some(p2 => p1.row === p2.row && p1.col === p2.col)
        );

        if (hasOverlap) {
          matches[j].forEach(p => {
            if (!currentMatch.some(cp => cp.row === p.row && cp.col === p.col)) {
              currentMatch.push(p);
            }
          });
          used.add(j);
          foundOverlap = true;
        }
      }
    }

    merged.push(currentMatch);
  }

  return merged;
}

export function determineSpecialTile(matchLength: number, isHorizontal: boolean): SpecialType {
  if (matchLength >= 5) return 'color_bomb';
  if (matchLength === 4) return isHorizontal ? 'row_bomb' : 'col_bomb';
  return 'none';
}

export function applyGravity(board: Tile[][]): { newBoard: Tile[][]; hasFalls: boolean } {
  const newBoard = board.map(row => row.map(tile => ({ ...tile })));
  let hasFalls = false;

  for (let col = 0; col < BOARD_SIZE; col++) {
    let emptyRow = BOARD_SIZE - 1;

    // Find tiles that need to fall
    for (let row = BOARD_SIZE - 1; row >= 0; row--) {
      const tile = newBoard[row][col];

      if (tile.type === 'stone' || tile.type === 'magma') {
        emptyRow = row - 1;
        continue;
      }

      if (tile.type === 'gem') {
        if (row !== emptyRow) {
          // Move tile down
          const fallDistance = emptyRow - row;
          newBoard[emptyRow][col] = {
            ...tile,
            row: emptyRow,
            isFalling: true,
            fallDistance,
          };
          newBoard[row][col] = createTile(row, col, 'empty');
          hasFalls = true;
        }
        emptyRow--;
      }
    }

    // Fill empty spaces at top with new gems
    for (let row = emptyRow; row >= 0; row--) {
      if (newBoard[row][col].type === 'empty') {
        const fallDistance = row + 1;
        newBoard[row][col] = {
          ...createTile(row, col, 'gem'),
          isSpawning: true,
          fallDistance,
        };
        hasFalls = true;
      }
    }
  }

  return { newBoard, hasFalls };
}

export function swapTiles(board: Tile[][], pos1: Position, pos2: Position): Tile[][] {
  const newBoard = board.map(row => row.map(tile => ({ ...tile })));

  const tile1 = { ...newBoard[pos1.row][pos1.col] };
  const tile2 = { ...newBoard[pos2.row][pos2.col] };

  tile1.row = pos2.row;
  tile1.col = pos2.col;
  tile2.row = pos1.row;
  tile2.col = pos1.col;

  newBoard[pos1.row][pos1.col] = tile2;
  newBoard[pos2.row][pos2.col] = tile1;

  return newBoard;
}

export function isAdjacent(pos1: Position, pos2: Position): boolean {
  const rowDiff = Math.abs(pos1.row - pos2.row);
  const colDiff = Math.abs(pos1.col - pos2.col);
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

export function canSwap(board: Tile[][], pos1: Position, pos2: Position): boolean {
  const tile1 = board[pos1.row][pos1.col];
  const tile2 = board[pos2.row][pos2.col];

  // Can only swap gems
  if (tile1.type !== 'gem' || tile2.type !== 'gem') return false;

  // Must be adjacent
  if (!isAdjacent(pos1, pos2)) return false;

  // Check if swap creates a match
  const testBoard = swapTiles(board, pos1, pos2);
  const matches = findMatches(testBoard);

  // Also check if either tile is a special tile (always allow)
  if (tile1.special !== 'none' || tile2.special !== 'none') return true;

  return matches.length > 0;
}

export function processMatches(
  board: Tile[][],
  matches: Position[][],
  objectives: Objective[]
): { newBoard: Tile[][]; score: number; updatedObjectives: Objective[]; specialTiles: { pos: Position; type: SpecialType }[] } {
  const newBoard = board.map(row => row.map(tile => ({ ...tile })));
  let score = 0;
  const updatedObjectives = objectives.map(o => ({ ...o }));
  const specialTiles: { pos: Position; type: SpecialType }[] = [];

  matches.forEach(match => {
    // Determine if this creates a special tile
    const isHorizontal = match.length >= 2 && match[0].row === match[1].row;
    const specialType = determineSpecialTile(match.length, isHorizontal);

    if (specialType !== 'none') {
      // Place special tile at the center of the match
      const centerIndex = Math.floor(match.length / 2);
      specialTiles.push({ pos: match[centerIndex], type: specialType });
    }

    match.forEach(pos => {
      const tile = newBoard[pos.row][pos.col];

      // Handle jelly layers
      if (tile.jellyLayers > 0) {
        tile.jellyLayers--;
        if (tile.jellyLayers === 0) {
          const jellyObj = updatedObjectives.find(o => o.type === 'jelly');
          if (jellyObj) jellyObj.current++;
        }
      }

      // Mark as matched
      tile.isMatched = true;
      tile.isExploding = true;
      score += 10;
    });

    // Damage adjacent blockers
    match.forEach(pos => {
      const adjacentPositions = [
        { row: pos.row - 1, col: pos.col },
        { row: pos.row + 1, col: pos.col },
        { row: pos.row, col: pos.col - 1 },
        { row: pos.row, col: pos.col + 1 },
      ];

      adjacentPositions.forEach(adjPos => {
        if (adjPos.row >= 0 && adjPos.row < BOARD_SIZE && adjPos.col >= 0 && adjPos.col < BOARD_SIZE) {
          const adjTile = newBoard[adjPos.row][adjPos.col];

          if (adjTile.type === 'stone' && adjTile.hp > 0) {
            adjTile.hp--;
            if (adjTile.hp <= 0) {
              adjTile.type = 'empty';
              const stoneObj = updatedObjectives.find(o => o.type === 'stone');
              if (stoneObj) stoneObj.current++;
              score += 50;
            }
          }

          if (adjTile.type === 'magma' && adjTile.hp > 0) {
            adjTile.hp--;
            if (adjTile.hp <= 0) {
              adjTile.type = 'empty';
              const magmaObj = updatedObjectives.find(o => o.type === 'magma');
              if (magmaObj) magmaObj.current++;
              score += 100;
            }
          }
        }
      });
    });
  });

  // Clear matched tiles
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const tile = newBoard[row][col];
      if (tile.isMatched) {
        if (tile.jellyLayers === 0) {
          // No jelly remaining, clear the tile
          newBoard[row][col] = createTile(row, col, 'empty');
        } else {
          // Tile still has jelly, generate a new gem but keep jelly
          newBoard[row][col] = {
            ...createTile(row, col, 'gem'),
            jellyLayers: tile.jellyLayers,
          };
        }
      }
    }
  }

  // Place special tiles
  specialTiles.forEach(({ pos, type }) => {
    if (newBoard[pos.row][pos.col].type === 'empty') {
      newBoard[pos.row][pos.col] = createTile(pos.row, pos.col, 'gem', getRandomColor(), type);
    }
  });

  return { newBoard, score, updatedObjectives, specialTiles };
}

export function activateSpecialTile(
  board: Tile[][],
  pos: Position,
  objectives: Objective[]
): { newBoard: Tile[][]; score: number; updatedObjectives: Objective[] } {

  const newBoard = board.map(row => row.map(tile => ({ ...tile })));
  const tile = newBoard[pos.row][pos.col];
  let score = 0;
  const updatedObjectives = objectives.map(o => ({ ...o }));

  if (tile.special === 'row_bomb') {
    // Clear entire row
    for (let col = 0; col < BOARD_SIZE; col++) {
      const result = clearTile(newBoard, { row: pos.row, col }, updatedObjectives);
      score += result.score;
    }
  } else if (tile.special === 'col_bomb') {
    // Clear entire column
    for (let row = 0; row < BOARD_SIZE; row++) {
      const result = clearTile(newBoard, { row, col: pos.col }, updatedObjectives);
      score += result.score;
    }
  } else if (tile.special === 'color_bomb') {
    // Clear all tiles of a random color (or the swapped tile's color)
    const targetColor = tile.color;
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (newBoard[row][col].color === targetColor) {
          const result = clearTile(newBoard, { row, col }, updatedObjectives);
          score += result.score;
        }
      }
    }
  }

  return { newBoard, score, updatedObjectives };
}

function clearTile(
  board: Tile[][],
  pos: Position,
  objectives: Objective[]
): { score: number } {
  const tile = board[pos.row][pos.col];
  let score = 0;

  if (tile.type === 'gem') {
    if (tile.jellyLayers > 0) {
      tile.jellyLayers--;
      if (tile.jellyLayers === 0) {
        const jellyObj = objectives.find(o => o.type === 'jelly');
        if (jellyObj) jellyObj.current++;
      }
    }
    if (tile.jellyLayers === 0) {
      board[pos.row][pos.col] = createTile(pos.row, pos.col, 'empty');
      score = 10;
    }
  } else if (tile.type === 'stone') {
    tile.hp--;
    if (tile.hp <= 0) {
      board[pos.row][pos.col] = createTile(pos.row, pos.col, 'empty');
      const stoneObj = objectives.find(o => o.type === 'stone');
      if (stoneObj) stoneObj.current++;
      score = 50;
    }
  } else if (tile.type === 'magma') {
    tile.hp--;
    if (tile.hp <= 0) {
      board[pos.row][pos.col] = createTile(pos.row, pos.col, 'empty');
      const magmaObj = objectives.find(o => o.type === 'magma');
      if (magmaObj) magmaObj.current++;
      score = 100;
    }
  }

  return { score };
}

export function applyBooster(
  board: Tile[][],
  pos: Position,
  boosterType: string,
  objectives: Objective[]
): { newBoard: Tile[][]; score: number; updatedObjectives: Objective[] } {
  const newBoard = board.map(row => row.map(tile => ({ ...tile })));
  let score = 0;
  const updatedObjectives = objectives.map(o => ({ ...o }));

  if (boosterType === 'fire_bomb') {
    // 3x3 explosion
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const r = pos.row + dr;
        const c = pos.col + dc;
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
          const result = clearTile(newBoard, { row: r, col: c }, updatedObjectives);
          score += result.score;
        }
      }
    }
  } else if (boosterType === 'line_bomb') {
    // Clear row and column
    for (let col = 0; col < BOARD_SIZE; col++) {
      const result = clearTile(newBoard, { row: pos.row, col }, updatedObjectives);
      score += result.score;
    }
    for (let row = 0; row < BOARD_SIZE; row++) {
      if (row !== pos.row) {
        const result = clearTile(newBoard, { row, col: pos.col }, updatedObjectives);
        score += result.score;
      }
    }
  } else if (boosterType === 'color_bomb') {
    // Clear all of one color
    const targetColor = newBoard[pos.row][pos.col].color || getRandomColor();
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (newBoard[row][col].color === targetColor) {
          const result = clearTile(newBoard, { row, col }, updatedObjectives);
          score += result.score;
        }
      }
    }
  }

  return { newBoard, score, updatedObjectives };
}

export function checkWinCondition(objectives: Objective[]): boolean {
  return objectives.every(obj => obj.current >= obj.target);
}

export function checkLoseCondition(hasPossibleMoves: boolean, objectives: Objective[]): boolean {
  return !hasPossibleMoves && !checkWinCondition(objectives);
}

export function calculateStars(score: number, level: number): number {
  const baseThreshold = 500 + level * 50;
  if (score >= baseThreshold * 3) return 3;
  if (score >= baseThreshold * 2) return 2;
  if (score >= baseThreshold) return 1;
  return 1; // Minimum 1 star for winning
}

export function hasPossibleMoves(board: Tile[][]): boolean {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const tile = board[row][col];
      if (tile.type !== 'gem') continue;

      // Check swap with right neighbor
      if (col < BOARD_SIZE - 1 && board[row][col + 1].type === 'gem') {
        if (canSwap(board, { row, col }, { row, col: col + 1 })) {
          return true;
        }
      }

      // Check swap with bottom neighbor
      if (row < BOARD_SIZE - 1 && board[row + 1][col].type === 'gem') {
        if (canSwap(board, { row, col }, { row: row + 1, col })) {
          return true;
        }
      }
    }
  }
  return false;
}

export function shuffleBoard(board: Tile[][]): Tile[][] {
  const gems: { color: GemColor; special: SpecialType; jellyLayers: number }[] = [];
  const positions: Position[] = [];

  // Collect all gems
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const tile = board[row][col];
      if (tile.type === 'gem') {
        gems.push({ color: tile.color!, special: tile.special, jellyLayers: tile.jellyLayers });
        positions.push({ row, col });
      }
    }
  }

  // Shuffle gems
  for (let i = gems.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [gems[i], gems[j]] = [gems[j], gems[i]];
  }

  // Create new board
  const newBoard = board.map(row => row.map(tile => ({ ...tile })));
  positions.forEach((pos, i) => {
    newBoard[pos.row][pos.col] = {
      ...newBoard[pos.row][pos.col],
      color: gems[i].color,
      special: gems[i].special,
      jellyLayers: gems[i].jellyLayers,
    };
  });

  return ensureNoInitialMatches(newBoard);
}
