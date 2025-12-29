import React, { useState } from 'react';
import { TrendingUp, Users, Award, Download, Search, Calendar, Target, Zap, Crown } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';

interface PartnerStats {
  totalReferrals: number;
  thisMonthInstalls: number;
  conversionRate: number;
  activeReferrals: number;
  inactiveReferrals: number;
  monthlyEarnings: number;
  allTimeEarnings: number;
}

interface ReferralDetail {
  id: string;
  username: string;
  joinDate: string;
  lastActive: string;
  status: 'active' | 'inactive';
  totalEarned: number;
  daysActive: number;
}

interface PartnerDashboardProps {
  stats: PartnerStats;
  referrals: ReferralDetail[];
  onExportData: () => void;
}

const PartnerDashboard: React.FC<PartnerDashboardProps> = ({ stats, referrals, onExportData }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  const filteredReferrals = referrals.filter(ref => {
    const matchesSearch = ref.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || ref.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const StatCard = ({ title, value, subtitle, icon: Icon, trend, highlight }: any) => (
    <div className={`${highlight ? 'bg-green-400/10 border-green-400/30' : 'bg-gray-900'} rounded-xl p-4 border border-gray-800`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${highlight ? 'text-green-400' : 'text-gray-400'}`} />
        <p className="text-gray-400 text-xs">{title}</p>
      </div>
      <div className={`text-2xl font-bold ${highlight ? 'text-green-400' : 'text-white'}`}>{value}</div>
      <div className="flex items-center gap-2 mt-1">
        <p className="text-xs text-gray-500">{subtitle}</p>
        {trend && (
          <Badge variant={trend > 0 ? 'default' : 'secondary'} className="text-xs">
            {trend > 0 ? '+' : ''}{trend}%
          </Badge>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Partner Badge */}
      <div className="bg-gradient-to-r from-green-600 to-orange-600 rounded-2xl p-6">
        <div className="flex items-center gap-3">
          <Crown className="w-8 h-8 text-white" />
          <div>
            <h3 className="text-xl font-bold text-white">Partner Status</h3>
            <p className="text-sm text-white/90">Enhanced Rewards: <strong className="text-yellow-300">100 DART per install + 10% bonus</strong></p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Referrals"
          value={stats.totalReferrals}
          subtitle="All-time"
          icon={Users}
          highlight
        />
        <StatCard
          title="This Month"
          value={stats.thisMonthInstalls}
          subtitle="Resets on 1st"
          icon={Calendar}
        />
        <StatCard
          title="Conversion Rate"
          value={`${stats.conversionRate}%`}
          subtitle="Install success"
          icon={Target}
        />
        <StatCard
          title="Active Users"
          value={stats.activeReferrals}
          subtitle="Last 30 days"
          icon={Zap}
        />
        <StatCard
          title="Inactive"
          value={stats.inactiveReferrals}
          subtitle="30+ days ago"
          icon={Users}
        />
        <StatCard
          title="Monthly Earnings"
          value={stats.monthlyEarnings.toLocaleString()}
          subtitle="DART this month"
          icon={Award}
          highlight
        />
      </div>

      {/* Monthly Trend Chart Placeholder */}
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Monthly Performance
          </h3>
          <p className="text-sm text-gray-400">
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} • Resets automatically on the 1st
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-green-400/10 rounded-xl p-4 border border-green-400/30">
            <div className="text-2xl font-bold text-green-400">{stats.thisMonthInstalls}</div>
            <div className="text-xs text-gray-400 mt-1">Installs</div>
          </div>
          <div className="bg-blue-400/10 rounded-xl p-4 border border-blue-400/30">
            <div className="text-2xl font-bold text-blue-400">{stats.activeReferrals}</div>
            <div className="text-xs text-gray-400 mt-1">Active</div>
          </div>
          <div className="bg-orange-400/10 rounded-xl p-4 border border-orange-400/30">
            <div className="text-2xl font-bold text-orange-400">{stats.conversionRate}%</div>
            <div className="text-xs text-gray-400 mt-1">Rate</div>
          </div>
          <div className="bg-purple-400/10 rounded-xl p-4 border border-purple-400/30">
            <div className="text-2xl font-bold text-purple-400">{stats.monthlyEarnings}</div>
            <div className="text-xs text-gray-400 mt-1">DART</div>
          </div>
        </div>
      </div>

      {/* Referral Management */}
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white">Referral Management</h3>
            <p className="text-sm text-gray-400">All {referrals.length} referrals • Search, filter, and export</p>
          </div>
          <Button onClick={onExportData} variant="outline" size="sm" className="gap-2 border-gray-700 hover:bg-gray-800">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>

        <div className="space-y-4">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Search by username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-950 border-gray-800 text-white"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('all')}
                className={filterStatus === 'all' ? 'bg-green-600 hover:bg-green-700' : 'border-gray-700 hover:bg-gray-800'}
              >
                All
              </Button>
              <Button
                variant={filterStatus === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('active')}
                className={filterStatus === 'active' ? 'bg-green-600 hover:bg-green-700' : 'border-gray-700 hover:bg-gray-800'}
              >
                Active
              </Button>
              <Button
                variant={filterStatus === 'inactive' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('inactive')}
                className={filterStatus === 'inactive' ? 'bg-green-600 hover:bg-green-700' : 'border-gray-700 hover:bg-gray-800'}
              >
                Inactive
              </Button>
            </div>
          </div>

          {/* Referrals Table */}
          <div className="rounded-xl border border-gray-800 overflow-hidden bg-gray-950">
            <Table>
              <TableHeader className="bg-gray-900">
                <TableRow className="border-gray-800 hover:bg-gray-900">
                  <TableHead className="text-gray-400">Username</TableHead>
                  <TableHead className="text-gray-400">Joined</TableHead>
                  <TableHead className="text-gray-400">Last Active</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-gray-400 text-right">Earned</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReferrals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No referrals found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReferrals.map((referral) => (
                    <TableRow key={referral.id} className="border-gray-800 hover:bg-gray-900/50">
                      <TableCell className="font-medium text-white">{referral.username}</TableCell>
                      <TableCell className="text-gray-400">{referral.joinDate}</TableCell>
                      <TableCell className="text-gray-400">{referral.lastActive}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={referral.status === 'active' ? 'default' : 'secondary'}
                          className={referral.status === 'active' ? 'bg-green-400/10 text-green-400 border-green-400/30' : 'bg-gray-700 text-gray-400'}
                        >
                          {referral.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-green-400 font-semibold">
                        {referral.totalEarned.toLocaleString()} DART
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {filteredReferrals.length > 0 && (
            <div className="text-sm text-gray-500 text-center mt-4">
              Showing {filteredReferrals.length} of {referrals.length} referrals
            </div>
          )}
        </div>
      </div>

      {/* All-Time Summary */}
      <div className="bg-gradient-to-r from-green-600 to-orange-600 rounded-2xl p-6">
        <div className="text-center">
          <div className="text-4xl font-bold text-white mb-2">
            {stats.allTimeEarnings.toLocaleString()} DART
          </div>
          <p className="text-white/90">Total Lifetime Earnings</p>
          <p className="text-sm text-white/70 mt-1">
            {stats.totalReferrals} installs × 100 DART + {(stats.allTimeEarnings - stats.totalReferrals * 100).toLocaleString()} bonus
          </p>
        </div>
      </div>
    </div>
  );
};

export default PartnerDashboard;

