import React from 'react';
import { TrendingUp, Eye, Award, DollarSign, BarChart3 } from 'lucide-react';
import { analyticsService } from '../services/analyticsService';

export const AnalyticsDashboard: React.FC = () => {
  const metrics = analyticsService.getMetrics();
  const completionRate = analyticsService.getCompletionRate();
  const estimatedRevenue = analyticsService.getEstimatedRevenue();

  const getDailyData = () => {
    const days = Object.keys(metrics.dailyActivity).sort().slice(-7);
    return days.map(day => ({
      date: new Date(day).toLocaleDateString('en-US', { weekday: 'short' }),
      count: metrics.dailyActivity[day]
    }));
  };

  const dailyData = getDailyData();
  const maxDaily = Math.max(...dailyData.map(d => d.count), 1);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 size={24} className="text-[#4ADE80]" />
        <h2 className="text-xl font-bold">Ad Analytics</h2>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-[#4ADE80]/20 to-[#4ADE80]/5 rounded-xl p-4 border border-[#4ADE80]/30">
          <Eye size={20} className="text-[#4ADE80] mb-2" />
          <p className="text-2xl font-bold text-white">{metrics.totalAdsWatched}</p>
          <p className="text-xs text-gray-400">Total Ads Watched</p>
        </div>

        <div className="bg-gradient-to-br from-[#FB923C]/20 to-[#FB923C]/5 rounded-xl p-4 border border-[#FB923C]/30">
          <Award size={20} className="text-[#FB923C] mb-2" />
          <p className="text-2xl font-bold text-white">{metrics.rewardsFromAds.toFixed(1)}</p>
          <p className="text-xs text-gray-400">DART from Ads</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 rounded-xl p-4 border border-blue-500/30">
          <TrendingUp size={20} className="text-blue-400 mb-2" />
          <p className="text-2xl font-bold text-white">{completionRate.toFixed(1)}%</p>
          <p className="text-xs text-gray-400">Completion Rate</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500/20 to-purple-500/5 rounded-xl p-4 border border-purple-500/30">
          <DollarSign size={20} className="text-purple-400 mb-2" />
          <p className="text-2xl font-bold text-white">${estimatedRevenue.toFixed(2)}</p>
          <p className="text-xs text-gray-400">Est. Revenue</p>
        </div>
      </div>

      {/* Daily Activity Chart */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <h3 className="text-sm font-semibold mb-4 text-gray-300">Last 7 Days Activity</h3>
        <div className="flex items-end justify-between gap-2 h-32">
          {dailyData.map((day, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full bg-gray-800 rounded-t-lg relative" style={{ height: '100%' }}>
                <div 
                  className="absolute bottom-0 w-full bg-gradient-to-t from-[#4ADE80] to-[#FB923C] rounded-t-lg transition-all"
                  style={{ height: `${(day.count / maxDaily) * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-500">{day.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
