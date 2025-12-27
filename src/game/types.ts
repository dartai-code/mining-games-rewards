// Game Types for Match-3 Game

export type GemColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple';

export type TileType = 'gem' | 'stone' | 'magma' | 'empty';

export type SpecialType = 'none' | 'row_bomb' | 'col_bomb' | 'color_bomb';

export type BoosterType = 'fire_bomb' | 'line_bomb' | 'color_bomb';

export type ObjectiveType = 'jelly' | 'magma' | 'stone' | 'score';

export interface Tile {
  id: string;
  type: TileType;
  color: GemColor | null;
  special: SpecialType;
  hp: number; // For stone (1) and magma (2)
  jellyLayers: number; // 0, 1, or 2
  row: number;
  col: number;
  isMatched: boolean;
  isExploding: boolean;
  isFalling: boolean;
  isSpawning: boolean;
  fallDistance: number;
}

export interface Position {
  row: number;
  col: number;
}

export interface Objective {
  type: ObjectiveType;
  target: number;
  current: number;
}

export interface LevelConfig {
  level: number;
  moves: number;
  objectives: Objective[];
  initialBoard?: (Partial<Tile> | null)[][];
  stonePositions?: Position[];
  magmaPositions?: Position[];
  jellyPositions?: { pos: Position; layers: number }[];
}

export interface GameState {
  board: Tile[][];
  moves: number;
  score: number;
  objectives: Objective[];
  isAnimating: boolean;
  selectedTile: Position | null;
  gameStatus: 'playing' | 'won' | 'lost';
  combo: number;
}

export interface PlayerData {
  currentLevel: number;
  completedLevels: number[];
  stars: { [level: number]: number };
  boosters: { [key in BoosterType]: number };
  totalScore: number;
  dailyScore: number;
  weeklyScore: number;
  monthlyScore: number;
  lastDailyReset: string;
  lastWeeklyReset: string;
  lastMonthlyReset: string;
  soundEnabled: boolean;
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  rank: number;
}

export const GEM_COLORS: GemColor[] = ['red', 'blue', 'green', 'yellow', 'purple'];

export const GEM_IMAGES: Record<GemColor, string> = {
  red: 'https://d64gsuwffb70l.cloudfront.net/694317c686936abd3ecb8e36_1766004784683_11578b17.png',
  blue: 'https://d64gsuwffb70l.cloudfront.net/694317c686936abd3ecb8e36_1766004797630_ce36a7c5.jpg',
  green: 'https://d64gsuwffb70l.cloudfront.net/694317c686936abd3ecb8e36_1766004815968_08438b63.png',
  yellow: 'https://d64gsuwffb70l.cloudfront.net/694317c686936abd3ecb8e36_1766004833980_091e9edf.png',
  purple: 'https://d64gsuwffb70l.cloudfront.net/694317c686936abd3ecb8e36_1766004847915_7fb9d575.jpg',
};

export const MAP_BACKGROUND = 'https://d64gsuwffb70l.cloudfront.net/694317c686936abd3ecb8e36_1766004873015_f093de96.jpg';

export const BOARD_SIZE = 8;
