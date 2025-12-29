import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Award, Copy, Share2, Calendar, Crown } from 'lucide-react';
import { Button } from './ui/button';
import { useReferrals } from '@/hooks/useReferrals';
import { BannerAd } from './BannerAd';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import PartnerApplication from './PartnerApplication';
import PartnerDashboard from './PartnerDashboard';
import PartnerLogin from './PartnerLogin';
import { Separator } from './ui/separator';

interface LeaderboardEntry {
  rank: number;
  username: string;
  referrals: number;
  userId: string;
}

const ReferralsTab: React.FC = () => {
  const {
    myStats,
    currentMonthLeaderboard,
    lastMonthLeaderboard,
    allTimeLeaderboard,
    monthlyHistory,
    loading,
    copyReferralCode,
    shareReferralLink,
    partnerStatus,
    partnerStats,
    referralDetails,
    submitPartnerApplication,
    exportReferralData,
    partnerPassword
  } = useReferrals();

  const [selectedHistoryMonth, setSelectedHistoryMonth] = useState<string>('');
  const [isPartnerLoggedIn, setIsPartnerLoggedIn] = useState(false);
  const [showPartnerLogin, setShowPartnerLogin] = useState(false);

  const StatCard = ({ title, value, subtitle, icon: Icon }: { title: string; value: string | number; subtitle: string; icon: any }) => (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
          <Icon className="w-4 h-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-white">{value}</div>
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );

  const LeaderboardTable = ({ entries, showRank = true }: { entries: LeaderboardEntry[]; showRank?: boolean }) => (
    <div className="space-y-2">
      {entries.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No referrals yet</p>
        </div>
      ) : (
        entries.map((entry) => (
          <div
            key={entry.userId}
            className={`flex items-center justify-between p-4 rounded-lg ${
              entry.rank <= 3
                ? 'bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-800/30'
                : 'bg-gray-800/50 border border-gray-700/30'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-10 h-10">
                {entry.rank === 1 && <span className="text-3xl">🏆</span>}
                {entry.rank === 2 && <span className="text-3xl">🥈</span>}
                {entry.rank === 3 && <span className="text-3xl">🥉</span>}
                {entry.rank > 3 && showRank && (
                  <span className="text-lg font-bold text-gray-400">#{entry.rank}</span>
                )}
              </div>
              <div>
                <p className="font-semibold text-white">{entry.username}</p>
                <p className="text-sm text-gray-500">{entry.referrals} referrals</p>
              </div>
            </div>
            {entry.rank <= 10 && entry.rank <= 3 && (
              <Award className="w-5 h-5 text-yellow-500" />
            )}
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 p-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-7 h-7" />
          Referrals
        </h1>
        <p className="text-gray-300 text-sm mt-1">Track your referrals and earnings</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Partner Section */}
        {partnerStatus === 'approved' ? (
          isPartnerLoggedIn && partnerStats ? (
            <PartnerDashboard 
              stats={partnerStats}
              referrals={referralDetails}
              onExportData={exportReferralData}
            />
          ) : (
            <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-700">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center gap-2">
                    <Crown className="w-8 h-8 text-yellow-500" />
                    <h3 className="text-xl font-bold text-white">Partner Dashboard</h3>
                  </div>
                  <p className="text-gray-300">You are an approved partner</p>
                  <Button
                    onClick={() => setShowPartnerLogin(true)}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Award className="w-4 h-4 mr-2" />
                    Login to Partner Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        ) : (
          <PartnerApplication
            status={partnerStatus}
            currentReferrals={myStats.totalReferrals}
            onSubmit={submitPartnerApplication}
          />
        )}

        {partnerStatus !== 'approved' && <Separator className="bg-gray-800" />}
        
        {/* Partner Login Modal */}
        {partnerStatus === 'approved' && partnerPassword && (
          <PartnerLogin
            open={showPartnerLogin}
            correctPassword={partnerPassword}
            onSuccess={() => {
              setIsPartnerLoggedIn(true);
              setShowPartnerLogin(false);
            }}
            onCancel={() => setShowPartnerLogin(false)}
          />
        )}

        {/* Referral Code Section */}
        <Card className="bg-gradient-to-br from-green-900/30 to-blue-900/30 border-green-800/30">
          <CardHeader>
            <CardTitle className="text-white">My Referral Code</CardTitle>
            <CardDescription>Share your code and earn 50 DART per install + 5% activity bonus</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
              <p className="text-center text-2xl font-mono font-bold text-green-400 tracking-wider">
                {myStats.referralCode || 'Loading...'}
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={copyReferralCode}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Code
              </Button>
              <Button
                onClick={shareReferralLink}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share Link
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* My Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Total Referrals"
            value={myStats.totalReferrals}
            subtitle="All-time successful installs"
            icon={Users}
          />
          <StatCard
            title="Active Users"
            value={myStats.activeUsers}
            subtitle="Played in last 30 days"
            icon={TrendingUp}
          />
          <StatCard
            title="DART Earned"
            value={myStats.totalEarned.toLocaleString()}
            subtitle={`${myStats.totalReferrals}×50 + 5% bonus`}
            icon={Award}
          />
        </div>

        {/* Leaderboard Section */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Award className="w-6 h-6 text-yellow-500" />
              Top 10 Referrers
            </CardTitle>
            <CardDescription>Monthly and all-time rankings</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="current" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-gray-800">
                <TabsTrigger value="current">Current Month</TabsTrigger>
                <TabsTrigger value="last">Last Month</TabsTrigger>
                <TabsTrigger value="alltime">All-Time</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <TabsContent value="current" className="mt-4">
                <div className="mb-3 flex items-center gap-2 text-sm text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                  <span className="ml-auto text-xs bg-blue-900/30 px-2 py-1 rounded">Resets on 1st</span>
                </div>
                <LeaderboardTable entries={currentMonthLeaderboard} />
              </TabsContent>

              <TabsContent value="last" className="mt-4">
                <div className="mb-3 flex items-center gap-2 text-sm text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date(new Date().setMonth(new Date().getMonth() - 1)).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <LeaderboardTable entries={lastMonthLeaderboard} />
              </TabsContent>

              <TabsContent value="alltime" className="mt-4">
                <div className="mb-3 flex items-center gap-2 text-sm text-gray-400">
                  <TrendingUp className="w-4 h-4" />
                  <span>Lifetime Rankings</span>
                </div>
                <LeaderboardTable entries={allTimeLeaderboard} />
              </TabsContent>

              <TabsContent value="history" className="mt-4">
                <div className="mb-4">
                  <Select value={selectedHistoryMonth} onValueChange={setSelectedHistoryMonth}>
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue placeholder="Select a month to view" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {monthlyHistory.map((month) => (
                        <SelectItem key={month.monthKey} value={month.monthKey}>
                          {month.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedHistoryMonth ? (
                  <LeaderboardTable 
                    entries={monthlyHistory.find(m => m.monthKey === selectedHistoryMonth)?.leaderboard || []} 
                  />
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Select a month to view historical rankings</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Info Note */}
        <Card className="bg-blue-900/20 border-blue-800/30">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-300">
              <strong>How it works:</strong> Share your referral code. When someone installs the app using your code and spends at least 3 minutes, you earn 50 DART instantly. Plus, you get a 5% bonus from all their future activity!
            </p>
          </CardContent>
        </Card>
        
        {/* Banner Ad */}
        <BannerAd className="mt-4" />
      </div>
    </div>
  );
};

export default ReferralsTab;
