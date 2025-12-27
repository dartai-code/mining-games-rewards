// src/components/LeaderboardTab.tsx
import React, { useEffect, useState } from 'react';
import { Medal } from 'lucide-react';
import { leaderboardService } from '../services/leaderboardService';

/**
 * LeaderboardTab (robust)
 * - Tries several common method names on leaderboardService in a safe way.
 * - Uses any at call sites so TypeScript won't error if your service shape differs.
 * - Keeps a friendly UI and default export (so AppLayout import remains import LeaderboardTab from './LeaderboardTab').
 */

type Period = 'daily' | 'weekly' | 'monthly';

const LeaderboardTab: React.FC = () => {
  const [period, setPeriod] = useState<Period>('weekly');
  const [leaders, setLeaders] = useState<Array<{ username: string; score: number }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    const fetchLeaders = async () => {
      try {
        // Use the proper getTopPlayers method from leaderboardService
        const data = leaderboardService.getTopPlayers(period, 10);

        if (mounted) {
          setLeaders(data);
        }
      } catch (err) {
        console.error('LeaderboardTab: failed to load leaders', err);
        if (mounted) setLeaders([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchLeaders();

    // Listen for storage changes to refresh leaderboard when scores are added
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'gameLeaderboard') {
        fetchLeaders();
      }
    };

    // Listen for same-tab leaderboard updates
    const handleLeaderboardUpdate = () => {
      fetchLeaders();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('leaderboardUpdated', handleLeaderboardUpdate);

    return () => {
      mounted = false;
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('leaderboardUpdated', handleLeaderboardUpdate);
    };
  }, [period]);

  return (
    <div className="p-6 text-white space-y-4 min-h-screen bg-gray-950 pb-20">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Medal /> Leaderboard
      </h1>

      {/* Period Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setPeriod('daily')}
          className={
            'px-3 py-1 rounded-xl text-sm ' +
            (period === 'daily' ? 'bg-green-600' : 'bg-gray-800 text-gray-300')
          }
        >
          Daily
        </button>

        <button
          onClick={() => setPeriod('weekly')}
          className={
            'px-3 py-1 rounded-xl text-sm ' +
            (period === 'weekly' ? 'bg-green-600' : 'bg-gray-800 text-gray-300')
          }
        >
          Weekly
        </button>

        <button
          onClick={() => setPeriod('monthly')}
          className={
            'px-3 py-1 rounded-xl text-sm ' +
            (period === 'monthly' ? 'bg-green-600' : 'bg-gray-800 text-gray-300')
          }
        >
          Monthly
        </button>
      </div>

      {/* Leaderboard List */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 space-y-2">
        {loading ? (
          <p className="text-gray-400 text-center">Loading...</p>
        ) : leaders.length === 0 ? (
          <p className="text-gray-400 text-center">No players yet.</p>
        ) : (
          leaders.map((p, i) => (
            <div
              key={i}
              className="flex justify-between items-center p-2 bg-gray-800 rounded-lg"
            >
              <span>
                #{i + 1} — {p.username}
              </span>
              <span className="text-green-400 font-semibold">{p.score} DART</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LeaderboardTab;
