// Storage Manager for Match-3 Game

import { PlayerData, BoosterType, LeaderboardEntry } from './types';

const STORAGE_KEY = 'match3_player_data';
const LEADERBOARD_KEY = 'match3_leaderboard';

function getDefaultPlayerData(): PlayerData {
  const now = new Date().toISOString().split('T')[0];
  return {
    currentLevel: 1,
    completedLevels: [],
    stars: {},
    boosters: {
      fire_bomb: 3,
      line_bomb: 3,
      color_bomb: 2,
    },
    totalScore: 0,
    dailyScore: 0,
    weeklyScore: 0,
    monthlyScore: 0,
    lastDailyReset: now,
    lastWeeklyReset: now,
    lastMonthlyReset: now,
    soundEnabled: true,
  };
}

export function loadPlayerData(): PlayerData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored) as PlayerData;
      return checkAndResetScores(data);
    }
  } catch (e) {
    console.error('Failed to load player data:', e);
  }
  return getDefaultPlayerData();
}

export function savePlayerData(data: PlayerData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save player data:', e);
  }
}

function checkAndResetScores(data: PlayerData): PlayerData {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  // Check daily reset
  if (data.lastDailyReset !== today) {
    data.dailyScore = 0;
    data.lastDailyReset = today;
  }
  
  // Check weekly reset (Monday)
  const lastWeekly = new Date(data.lastWeeklyReset);
  const daysSinceWeekly = Math.floor((now.getTime() - lastWeekly.getTime()) / (1000 * 60 * 60 * 24));
  if (daysSinceWeekly >= 7 || (now.getDay() === 1 && data.lastWeeklyReset !== today)) {
    data.weeklyScore = 0;
    data.lastWeeklyReset = today;
  }
  
  // Check monthly reset
  const lastMonthly = new Date(data.lastMonthlyReset);
  if (now.getMonth() !== lastMonthly.getMonth() || now.getFullYear() !== lastMonthly.getFullYear()) {
    data.monthlyScore = 0;
    data.lastMonthlyReset = today;
  }
  
  return data;
}

export function completeLevel(level: number, stars: number, score: number): PlayerData {
  const data = loadPlayerData();
  
  if (!data.completedLevels.includes(level)) {
    data.completedLevels.push(level);
  }
  
  // Update stars if better
  if (!data.stars[level] || stars > data.stars[level]) {
    data.stars[level] = stars;
  }
  
  // Update current level
  if (level >= data.currentLevel) {
    data.currentLevel = level + 1;
  }
  
  // Update scores
  data.totalScore += score;
  data.dailyScore += score;
  data.weeklyScore += score;
  data.monthlyScore += score;
  
  // Random chance for booster reward
  if (Math.random() < 0.3) {
    const boosterTypes: BoosterType[] = ['fire_bomb', 'line_bomb', 'color_bomb'];
    const randomBooster = boosterTypes[Math.floor(Math.random() * boosterTypes.length)];
    data.boosters[randomBooster]++;
  }
  
  savePlayerData(data);
  updateLeaderboard(data);
  
  return data;
}

export function consumeBooster(boosterType: BoosterType): PlayerData | null {
  const data = loadPlayerData();
  
  if (data.boosters[boosterType] > 0) {
    data.boosters[boosterType]--;
    savePlayerData(data);
    return data;
  }
  
  return null;
}

export function addBooster(boosterType: BoosterType): PlayerData {
  const data = loadPlayerData();
  data.boosters[boosterType]++;
  savePlayerData(data);
  return data;
}

export function addMoves(): PlayerData {
  const data = loadPlayerData();
  // This is tracked in game state, not player data
  return data;
}

export function toggleSound(): PlayerData {
  const data = loadPlayerData();
  data.soundEnabled = !data.soundEnabled;
  savePlayerData(data);
  return data;
}

// Leaderboard functions
interface LeaderboardData {
  daily: LeaderboardEntry[];
  weekly: LeaderboardEntry[];
  monthly: LeaderboardEntry[];
  lastUpdate: string;
}

function getDefaultLeaderboard(): LeaderboardData {
  const generateEntries = (baseScore: number): LeaderboardEntry[] => {
    const names = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Quinn', 'Avery', 'Peyton', 'Drew'];
    return names.map((name, i) => ({
      name,
      score: Math.floor(baseScore * (1 - i * 0.08) + Math.random() * 1000),
      rank: i + 1,
    }));
  };
  
  return {
    daily: generateEntries(5000),
    weekly: generateEntries(25000),
    monthly: generateEntries(100000),
    lastUpdate: new Date().toISOString(),
  };
}

export function loadLeaderboard(): LeaderboardData {
  try {
    const stored = localStorage.getItem(LEADERBOARD_KEY);
    if (stored) {
      return JSON.parse(stored) as LeaderboardData;
    }
  } catch (e) {
    console.error('Failed to load leaderboard:', e);
  }
  return getDefaultLeaderboard();
}

export function saveLeaderboard(data: LeaderboardData): void {
  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save leaderboard:', e);
  }
}

export function updateLeaderboard(playerData: PlayerData): void {
  const leaderboard = loadLeaderboard();
  const playerName = 'You';
  
  // Update daily
  updateLeaderboardCategory(leaderboard.daily, playerName, playerData.dailyScore);
  
  // Update weekly
  updateLeaderboardCategory(leaderboard.weekly, playerName, playerData.weeklyScore);
  
  // Update monthly
  updateLeaderboardCategory(leaderboard.monthly, playerName, playerData.monthlyScore);
  
  leaderboard.lastUpdate = new Date().toISOString();
  saveLeaderboard(leaderboard);
}

function updateLeaderboardCategory(entries: LeaderboardEntry[], name: string, score: number): void {
  // Remove existing player entry
  const existingIndex = entries.findIndex(e => e.name === name);
  if (existingIndex !== -1) {
    entries.splice(existingIndex, 1);
  }
  
  // Add new entry
  entries.push({ name, score, rank: 0 });
  
  // Sort by score
  entries.sort((a, b) => b.score - a.score);
  
  // Update ranks and keep top 10
  entries.forEach((entry, i) => {
    entry.rank = i + 1;
  });
  
  // Keep only top 10
  entries.length = Math.min(entries.length, 10);
}


