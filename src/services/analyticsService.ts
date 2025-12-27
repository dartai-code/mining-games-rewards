// Analytics service for tracking ad engagement metrics

export interface AdMetrics {
  totalAdsWatched: number;
  rewardsFromAds: number;
  adsCompleted: number;
  adsFailed: number;
  dailyActivity: { [date: string]: number };
  weeklyActivity: { [week: string]: number };
  lastUpdated: number;
}

const STORAGE_KEY = 'adAnalytics';

export const analyticsService = {
  getMetrics(): AdMetrics {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return {
      totalAdsWatched: 0,
      rewardsFromAds: 0,
      adsCompleted: 0,
      adsFailed: 0,
      dailyActivity: {},
      weeklyActivity: {},
      lastUpdated: Date.now()
    };
  },

  trackAdWatch(completed: boolean, reward: number = 0) {
    const metrics = this.getMetrics();
    const today = new Date().toISOString().split('T')[0];
    const week = this.getWeekKey(new Date());

    metrics.totalAdsWatched++;
    if (completed) {
      metrics.adsCompleted++;
      metrics.rewardsFromAds += reward;
    } else {
      metrics.adsFailed++;
    }

    metrics.dailyActivity[today] = (metrics.dailyActivity[today] || 0) + 1;
    metrics.weeklyActivity[week] = (metrics.weeklyActivity[week] || 0) + 1;
    metrics.lastUpdated = Date.now();

    localStorage.setItem(STORAGE_KEY, JSON.stringify(metrics));
    return metrics;
  },

  getWeekKey(date: Date): string {
    const year = date.getFullYear();
    const week = Math.ceil(((date.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + 1) / 7);
    return `${year}-W${week}`;
  },

  getCompletionRate(): number {
    const metrics = this.getMetrics();
    if (metrics.totalAdsWatched === 0) return 0;
    return (metrics.adsCompleted / metrics.totalAdsWatched) * 100;
  },

  getEstimatedRevenue(): number {
    const metrics = this.getMetrics();
    // Estimate: $0.01 per completed ad (industry average)
    return metrics.adsCompleted * 0.01;
  }
};
