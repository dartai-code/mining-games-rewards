// Level Generator for Match-3 Game

import { LevelConfig, Objective, Position, BOARD_SIZE } from './types';

export function generateLevel(level: number): LevelConfig {
  // Calculate difficulty parameters
  const moves = Math.max(8, 25 - Math.floor(level / 20));
  
  // Determine objectives based on level
  const objectives = generateObjectives(level);
  
  // Generate blocker positions based on objectives (1-2 extra than required)
  const stonePositions = generateStonePositions(level, objectives);
  const magmaPositions = generateMagmaPositions(level, objectives);
  const jellyPositions = generateJellyPositions(level, objectives);

  return {
    level,
    moves,
    objectives,
    stonePositions,
    magmaPositions,
    jellyPositions,
  };
}

function generateObjectives(level: number): Objective[] {
  const objectives: Objective[] = [];
  
  // Level patterns for variety
  const pattern = level % 10;
  
  if (level <= 10) {
    // Early levels: simple objectives
    if (pattern <= 3) {
      objectives.push({ type: 'jelly', target: 5 + Math.floor(level / 2), current: 0 });
    } else if (pattern <= 6) {
      objectives.push({ type: 'stone', target: 3 + Math.floor(level / 3), current: 0 });
    } else {
      objectives.push({ type: 'jelly', target: 4, current: 0 });
      objectives.push({ type: 'stone', target: 2, current: 0 });
    }
  } else if (level <= 50) {
    // Mid-early levels: introduce magma
    if (pattern <= 2) {
      objectives.push({ type: 'jelly', target: 8 + Math.floor(level / 10), current: 0 });
    } else if (pattern <= 4) {
      objectives.push({ type: 'stone', target: 5 + Math.floor(level / 15), current: 0 });
    } else if (pattern <= 6) {
      objectives.push({ type: 'magma', target: 2 + Math.floor(level / 25), current: 0 });
    } else {
      objectives.push({ type: 'jelly', target: 6, current: 0 });
      objectives.push({ type: 'magma', target: 2, current: 0 });
    }
  } else if (level <= 200) {
    // Mid levels: mixed objectives
    if (pattern <= 2) {
      objectives.push({ type: 'jelly', target: 12 + Math.floor(level / 20), current: 0 });
    } else if (pattern <= 4) {
      objectives.push({ type: 'stone', target: 8 + Math.floor(level / 30), current: 0 });
      objectives.push({ type: 'magma', target: 3 + Math.floor(level / 50), current: 0 });
    } else if (pattern <= 6) {
      objectives.push({ type: 'magma', target: 5 + Math.floor(level / 40), current: 0 });
    } else {
      objectives.push({ type: 'jelly', target: 10, current: 0 });
      objectives.push({ type: 'stone', target: 5, current: 0 });
      objectives.push({ type: 'magma', target: 3, current: 0 });
    }
  } else {
    // Hard levels: challenging combinations
    const difficulty = Math.floor((level - 200) / 50);
    
    if (pattern <= 3) {
      objectives.push({ type: 'jelly', target: 15 + difficulty * 2, current: 0 });
      objectives.push({ type: 'magma', target: 5 + difficulty, current: 0 });
    } else if (pattern <= 6) {
      objectives.push({ type: 'stone', target: 10 + difficulty * 2, current: 0 });
      objectives.push({ type: 'magma', target: 6 + difficulty, current: 0 });
    } else {
      objectives.push({ type: 'jelly', target: 12 + difficulty, current: 0 });
      objectives.push({ type: 'stone', target: 8 + difficulty, current: 0 });
      objectives.push({ type: 'magma', target: 4 + difficulty, current: 0 });
    }
  }

  return objectives;
}

function generateStonePositions(level: number, objectives: Objective[]): Position[] {
  // Find stone objective
  const stoneObjective = objectives.find(obj => obj.type === 'stone');
  const requiredCount = stoneObjective ? stoneObjective.target : 0;
  
  // Generate 1-2 extra stones than required
  const extra = Math.random() > 0.5 ? 2 : 1;
  const count = Math.max(requiredCount + extra, Math.min(12, Math.floor(level / 10) + 2));
  
  const positions: Position[] = [];
  const used = new Set<string>();
  
  for (let i = 0; i < count; i++) {
    let attempts = 0;
    while (attempts < 50) {
      const row = level < 20 
        ? Math.floor(Math.random() * 4) + 2 
        : Math.floor(Math.random() * BOARD_SIZE);
      const col = level < 20 
        ? Math.floor(Math.random() * 4) + 2 
        : Math.floor(Math.random() * BOARD_SIZE);
      
      const key = `${row},${col}`;
      if (!used.has(key)) {
        used.add(key);
        positions.push({ row, col });
        break;
      }
      attempts++;
    }
  }

  return positions;
}

function generateMagmaPositions(level: number, objectives: Objective[]): Position[] {
  if (level < 15) return [];
  
  // Find magma objective
  const magmaObjective = objectives.find(obj => obj.type === 'magma');
  const requiredCount = magmaObjective ? magmaObjective.target : 0;
  
  // Generate 1-2 extra magma than required
  const extra = Math.random() > 0.5 ? 2 : 1;
  const count = Math.max(requiredCount + extra, Math.min(8, Math.floor((level - 15) / 20) + 1));
  
  const positions: Position[] = [];
  const used = new Set<string>();
  
  for (let i = 0; i < count; i++) {
    let attempts = 0;
    while (attempts < 50) {
      const row = Math.floor(Math.random() * BOARD_SIZE);
      const col = Math.floor(Math.random() * BOARD_SIZE);
      
      const key = `${row},${col}`;
      if (!used.has(key)) {
        used.add(key);
        positions.push({ row, col });
        break;
      }
      attempts++;
    }
  }

  return positions;
}

function generateJellyPositions(level: number, objectives: Objective[]): { pos: Position; layers: number }[] {
  // Find jelly objective
  const jellyObjective = objectives.find(obj => obj.type === 'jelly');
  const requiredCount = jellyObjective ? jellyObjective.target : 0;
  
  // Generate 1-2 extra jelly than required
  const extra = Math.random() > 0.5 ? 2 : 1;
  const count = Math.max(requiredCount + extra, Math.min(25, 8 + Math.floor(level / 3)));
  
  const positions: { pos: Position; layers: number }[] = [];
  const used = new Set<string>();
  
  for (let i = 0; i < count; i++) {
    let attempts = 0;
    while (attempts < 50) {
      const row = Math.floor(Math.random() * BOARD_SIZE);
      const col = Math.floor(Math.random() * BOARD_SIZE);
      
      const key = `${row},${col}`;
      if (!used.has(key)) {
        used.add(key);
        // Higher levels have more double-layer jelly
        const layers = level > 20 && Math.random() > 0.5 ? 2 : 1;
        positions.push({ pos: { row, col }, layers });
        break;
      }
      attempts++;
    }
  }

  return positions;
}

// Generate all 500 level configs (cached)
const levelCache: Map<number, LevelConfig> = new Map();

export function getLevelConfig(level: number): LevelConfig {
  if (!levelCache.has(level)) {
    levelCache.set(level, generateLevel(level));
  }
  return levelCache.get(level)!;
}

export function getTotalLevels(): number {
  return 500;
}
