// Leaderboard service for tracking game scores

export interface LeaderboardEntry {
  id: string;
  username: string;
  country: string;
  score: number; // here: DART points
  game: 'runner' | 'snake' | 'match3';
  timestamp: number;
}

export interface UserProfile {
  username: string;
  country: string;
  createdAt: number;
}

export interface LeaderboardData {
  daily: LeaderboardEntry[];
  weekly: LeaderboardEntry[];
  monthly: LeaderboardEntry[];
  lastUpdated: number;
}

const STORAGE_KEY = 'gameLeaderboard';
const USER_PROFILE_KEY = 'userProfile';

type Period = 'daily' | 'weekly' | 'monthly';

export const leaderboardService = {
  // ---------- PROFILE ----------

  getUserProfile(): UserProfile | null {
    const stored = localStorage.getItem(USER_PROFILE_KEY);
    return stored ? JSON.parse(stored) : null;
  },

  saveUserProfile(username: string, country: string): UserProfile {
    const profile: UserProfile = { username, country, createdAt: Date.now() };
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
    return profile;
  },

  // ---------- CORE DATA ----------

  getData(): LeaderboardData {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);

      // migrate old structure (weekly/monthly only) to new one with daily
      if (!parsed.daily) {
        parsed.daily = [];
      }
      if (!parsed.weekly) {
        parsed.weekly = [];
      }
      if (!parsed.monthly) {
        parsed.monthly = [];
      }
      if (typeof parsed.lastUpdated !== 'number') {
        parsed.lastUpdated = Date.now();
      }

      return parsed as LeaderboardData;
    }

    // fresh data with mock entries
    return {
      daily: this.generateMockData('day'),
      weekly: this.generateMockData('week'),
      monthly: this.generateMockData('month'),
      lastUpdated: Date.now(),
    };
  },

  // score = final DART given to player (after 2x etc.)
  addScore(
    username: string,
    country: string,
    score: number,
    game: 'runner' | 'snake' | 'match3'
  ) {
    const data = this.getData();
    const now = Date.now();

    const entry: LeaderboardEntry = {
      id: 'user-' + now.toString(),
      username,
      country,
      score,
      game,
      timestamp: now,
    };

    // push into all three time-buckets
    data.daily.push(entry);
    data.weekly.push(entry);
    data.monthly.push(entry);

    const oneDayMs = 24 * 60 * 60 * 1000;
    const sevenDaysMs = 7 * oneDayMs;
    const thirtyDaysMs = 30 * oneDayMs;

    // keep only recent entries for each period
    data.daily = data.daily.filter((e: LeaderboardEntry) => now - e.timestamp <= oneDayMs);
    data.weekly = data.weekly.filter((e: LeaderboardEntry) => now - e.timestamp <= sevenDaysMs);
    data.monthly = data.monthly.filter(
      (e: LeaderboardEntry) => now - e.timestamp <= thirtyDaysMs
    );

    // sort by score desc and keep top 50 entries (still fine)
    data.daily.sort((a: LeaderboardEntry, b: LeaderboardEntry) => b.score - a.score).splice(50);
    data.weekly.sort((a: LeaderboardEntry, b: LeaderboardEntry) => b.score - a.score).splice(50);
    data.monthly
      .sort((a: LeaderboardEntry, b: LeaderboardEntry) => b.score - a.score)
      .splice(50);

    data.lastUpdated = now;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    
    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new CustomEvent('leaderboardUpdated'));
    
    return data;
  },

  // ---------- FAIR RANKING (SUM OF DART) ----------

  getTopPlayers(period: Period, limit: number = 10): Array<{ username: string; score: number }> {
    const data = this.getData();

    let entries: LeaderboardEntry[];
    if (period === 'daily') {
      entries = data.daily;
    } else if (period === 'weekly') {
      entries = data.weekly;
    } else {
      entries = data.monthly;
    }

    if (!entries.length) return [];

    // aggregate total DART per user
    const totals: Record<string, { score: number }> = {};
    for (const e of entries) {
      if (!totals[e.username]) {
        totals[e.username] = { score: 0 };
      }
      totals[e.username].score += e.score;
    }

    // sort by total score and return top players
    return Object.entries(totals)
      .sort((a, b) => b[1].score - a[1].score)
      .slice(0, limit)
      .map(([username, data]) => ({ username, score: data.score }));
  },

  getUserRank(
    username: string,
    period: Period
  ): { rank: number; score: number } | null {
    const data = this.getData();

    let entries: LeaderboardEntry[];
    if (period === 'daily') {
      entries = data.daily;
    } else if (period === 'weekly') {
      entries = data.weekly;
    } else {
      entries = data.monthly;
    }

    if (!entries.length) return null;

    // aggregate total DART per user
    const totals: Record<
      string,
      {
        score: number;
      }
    > = {};

    for (const e of entries) {
      if (!totals[e.username]) {
        totals[e.username] = { score: 0 };
      }
      totals[e.username].score += e.score;
    }

    if (!totals[username]) {
      return null;
    }

    const sorted = Object.entries(totals).sort(
      (a, b) => b[1].score - a[1].score
    );

    const index = sorted.findIndex(([name]) => name === username);
    if (index === -1) return null;

    const totalScore = sorted[index][1].score;
    const rank = index + 1;

    return { rank, score: totalScore };
  },

  // ---------- MOCK DATA ----------

  generateMockData(period: 'day' | 'week' | 'month'): LeaderboardEntry[] {
    const games: Array<'runner' | 'snake' | 'match3'> = ['runner', 'snake', 'match3'];
    const countries = ['US', 'GB', 'CA', 'AU', 'IN', 'DE', 'FR', 'JP', 'BR', 'MX'];
    const names = [
      'Alex',
      'Sam',
      'Jordan',
      'Taylor',
      'Morgan',
      'Casey',
      'Riley',
      'Avery',
      'Quinn',
      'Skyler',
    ];

    let daysRange = 7;
    if (period === 'day') {
      daysRange = 1;
    } else if (period === 'month') {
      daysRange = 30;
    }

    const now = Date.now();
    const maxOffset = daysRange * 24 * 60 * 60 * 1000;

    return Array.from({ length: 30 }, (_, i) => {
      return {
        id: 'mock-' + period + '-' + i.toString(),
        username:
          names[i % names.length] + Math.floor(Math.random() * 999).toString(),
        country: countries[i % countries.length],
        // treat as small DART-style scores
        score: Math.floor(Math.random() * 50) + 10,
        game: games[i % games.length],
        timestamp: now - Math.random() * maxOffset,
      } as LeaderboardEntry;
    }).sort((a: LeaderboardEntry, b: LeaderboardEntry) => b.score - a.score);
  },
};
