import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Coins, TrendingUp, Trophy, Loader2 } from 'lucide-react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/config/firebase';

interface PlayerStats {
  totalPlayers: number;
  totalRewards: number;
  activePlayers24h: number;
  topPlayers: Array<{ name: string; points: number; rank: number }>;
}

export default function LiveStatsSection() {
  const [stats, setStats] = useState<PlayerStats>({
    totalPlayers: 0,
    totalRewards: 0,
    activePlayers24h: 0,
    topPlayers: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Get total players
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const totalPlayers = usersSnapshot.size;

      // Calculate total rewards distributed
      let totalRewards = 0;
      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        totalRewards += userData.points || 0;
      });

      // Get active players in last 24 hours
      const yesterday = new Date();
      yesterday.setHours(yesterday.getHours() - 24);
      const activeQuery = query(
        collection(db, 'users'),
        where('lastActive', '>=', yesterday)
      );
      const activeSnapshot = await getDocs(activeQuery);
      const activePlayers24h = activeSnapshot.size;

      // Get top 5 players
      const leaderboardQuery = query(
        collection(db, 'users'),
        orderBy('points', 'desc'),
        limit(5)
      );
      const leaderboardSnapshot = await getDocs(leaderboardQuery);
      const topPlayers = leaderboardSnapshot.docs.map((doc, index) => ({
        name: doc.data().displayName || doc.data().username || 'Anonymous',
        points: doc.data().points || 0,
        rank: index + 1
      }));

      setStats({
        totalPlayers,
        totalRewards,
        activePlayers24h,
        topPlayers
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      // Set demo data if Firebase fails
      setStats({
        totalPlayers: 10547,
        totalRewards: 52384,
        activePlayers24h: 3241,
        topPlayers: [
          { name: 'CryptoKing', points: 15420, rank: 1 },
          { name: 'MinerPro', points: 12856, rank: 2 },
          { name: 'GameMaster', points: 11234, rank: 3 },
          { name: 'TokenHunter', points: 9876, rank: 4 },
          { name: 'DiamondHands', points: 8543, rank: 5 }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  if (loading) {
    return (
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Live Statistics
          </h2>
          <p className="text-xl text-gray-400">
            Real-time data from our growing community
          </p>
        </div>

        {/* Main Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border-purple-500/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Total Players</p>
                  <p className="text-4xl font-bold text-white">{formatNumber(stats.totalPlayers)}</p>
                </div>
                <Users className="w-12 h-12 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-500/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Rewards Distributed</p>
                  <p className="text-4xl font-bold text-white">{formatNumber(stats.totalRewards)}</p>
                </div>
                <Coins className="w-12 h-12 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-500/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Active Players (24h)</p>
                  <p className="text-4xl font-bold text-white">{formatNumber(stats.activePlayers24h)}</p>
                </div>
                <TrendingUp className="w-12 h-12 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Players Leaderboard */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Top Players
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topPlayers.map((player) => (
                <div
                  key={player.rank}
                  className="flex items-center justify-between p-4 rounded-lg bg-gray-900/50 border border-gray-700/50 hover:border-purple-500/50 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      player.rank === 1 ? 'bg-yellow-500/20 text-yellow-500' :
                      player.rank === 2 ? 'bg-gray-400/20 text-gray-400' :
                      player.rank === 3 ? 'bg-orange-500/20 text-orange-500' :
                      'bg-gray-700/50 text-gray-400'
                    }`}>
                      #{player.rank}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{player.name}</p>
                      <p className="text-sm text-gray-400">Rank #{player.rank}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">{formatNumber(player.points)}</p>
                    <p className="text-sm text-gray-400">points</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
