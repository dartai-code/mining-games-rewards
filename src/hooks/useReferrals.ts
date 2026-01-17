import { useState, useEffect } from 'react';
import { Share } from '@capacitor/share';
import { firebaseStorage } from '@/services/firebaseStorageService';
import { authService } from '@/services/firebaseAuthService';

interface MyReferralStats {
  referralCode: string;
  totalReferrals: number;
  activeUsers: number;
  totalEarned: number;
}

interface LeaderboardEntry {
  rank: number;
  username: string;
  referrals: number;
  userId: string;
}

interface MonthlyHistoryEntry {
  monthKey: string;
  displayName: string;
  leaderboard: LeaderboardEntry[];
}

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

export const useReferrals = () => {
  const [myStats, setMyStats] = useState<MyReferralStats>({
    referralCode: '',
    totalReferrals: 0,
    activeUsers: 0,
    totalEarned: 0
  });

  const [currentMonthLeaderboard, setCurrentMonthLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [lastMonthLeaderboard, setLastMonthLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [allTimeLeaderboard, setAllTimeLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [monthlyHistory, setMonthlyHistory] = useState<MonthlyHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [partnerStatus, setPartnerStatus] = useState<'eligible' | 'pending' | 'approved' | 'rejected' | 'not_eligible'>('not_eligible');
  const [partnerStats, setPartnerStats] = useState<PartnerStats | null>(null);
  const [referralDetails, setReferralDetails] = useState<ReferralDetail[]>([]);

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    try {
      setLoading(true);
      const userId = authService.getUserId();
      
      if (!userId) {
        // If not authenticated, try to get from localStorage for now
        loadLocalStorageData();
        return;
      }

      // Load user's referral stats
      const userData = await firebaseStorage.getUserData();
      if (userData) {
        const referrals = await firebaseStorage.getReferralStats(userId);
        
        setMyStats({
          referralCode: userData.referralCode || generateReferralCode(),
          totalReferrals: referrals.totalReferrals,
          activeUsers: referrals.activeUsers,
          totalEarned: (referrals.totalReferrals * 50) + referrals.activityBonus
        });
      }

      // Load leaderboards
      const [current, last, allTime, history] = await Promise.all([
        firebaseStorage.getReferralLeaderboard('current'),
        firebaseStorage.getReferralLeaderboard('last'),
        firebaseStorage.getReferralLeaderboard('alltime'),
        firebaseStorage.getReferralHistory()
      ]);

      setCurrentMonthLeaderboard(current);
      setLastMonthLeaderboard(last);
      setAllTimeLeaderboard(allTime);
      setMonthlyHistory(history);
    } catch (error) {
      console.error('Error loading referral data:', error);
      loadLocalStorageData();
    } finally {
      setLoading(false);
    }
  };

  const loadLocalStorageData = () => {
    // Fallback to localStorage for non-authenticated users
    const referralCode = localStorage.getItem('referralCode') || generateReferralCode();
    const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    const referralTransactions = transactions.filter((t: any) => t.type === 'Referral');
    
    setMyStats({
      referralCode,
      totalReferrals: 0, // Can't track this locally
      activeUsers: 0,
      totalEarned: referralTransactions.reduce((sum: number, t: any) => sum + t.amount, 0)
    });

    // Generate mock leaderboard for demo
    setCurrentMonthLeaderboard(generateMockLeaderboard(10));
    setLastMonthLeaderboard(generateMockLeaderboard(10));
    setAllTimeLeaderboard(generateMockLeaderboard(10));
  };

  const generateReferralCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    localStorage.setItem('referralCode', code);
    return code;
  };

  const generateMockLeaderboard = (count: number): LeaderboardEntry[] => {
    const names = ['CryptoKing', 'GameMaster', 'ProPlayer', 'LuckyOne', 'Champion', 'NinjaWarrior', 'SpeedRunner', 'EliteGamer', 'TopShot', 'MegaWin'];
    return names.slice(0, count).map((name, index) => ({
      rank: index + 1,
      username: name,
      referrals: Math.floor(Math.random() * 50) + (50 - index * 5),
      userId: `user-${index}`
    })).sort((a, b) => b.referrals - a.referrals);
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(myStats.referralCode);
    // Show toast notification
    if (typeof window !== 'undefined') {
      alert('Referral code copied to clipboard!');
    }
  };

  const shareReferralLink = async () => {
    const link = `${window.location.origin}?ref=${myStats.referralCode}`;
    
    try {
      // Use Capacitor Share API for native sharing
      await Share.share({
        title: 'Join Dart AI - Earn Rewards!',
        text: `Use my referral code ${myStats.referralCode} to get started and earn rewards!`,
        url: link,
        dialogTitle: 'Share Dart AI with friends',
      });
    } catch (error) {
      // Fallback to clipboard if share is cancelled or not available
      console.log('Share cancelled or not available:', error);
      try {
        await navigator.clipboard.writeText(link);
        alert('Referral link copied to clipboard!');
      } catch (clipboardError) {
        console.error('Clipboard access failed:', clipboardError);
      }
    }
  };

  const submitPartnerApplication = async (telegramHandle: string, pitch: string) => {
    const userId = authService.getUserId();
    if (!userId) {
      alert('Please sign in to apply');
      return;
    }

    try {
      await firebaseStorage.submitPartnerApplication(userId, telegramHandle, pitch);
      setPartnerStatus('pending');
      alert('Application submitted successfully! We\'ll contact you on Telegram.');
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Failed to submit application. Please try again.');
    }
  };

  const exportReferralData = () => {
    if (referralDetails.length === 0) {
      alert('No referral data to export');
      return;
    }

    const csv = [
      ['Username', 'Join Date', 'Last Active', 'Status', 'Days Active', 'Total Earned (DART)'],
      ...referralDetails.map(ref => [
        ref.username,
        ref.joinDate,
        ref.lastActive,
        ref.status,
        ref.daysActive.toString(),
        ref.totalEarned.toString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `referrals_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadPartnerData = async () => {
    const userId = authService.getUserId();
    if (!userId) return;

    try {
      const userData = await firebaseStorage.getUserData();
      if (!userData) return;

      // Check Partner status
      if (userData.partnerStatus) {
        setPartnerStatus(userData.partnerStatus);
      } else if (myStats.totalReferrals >= 50) {
        setPartnerStatus('eligible');
      } else {
        setPartnerStatus('not_eligible');
      }

      // Load Partner-specific data if approved
      if (userData.partnerStatus === 'approved') {
        const [stats, details] = await Promise.all([
          firebaseStorage.getPartnerStats(userId),
          firebaseStorage.getPartnerReferralDetails(userId)
        ]);
        setPartnerStats(stats);
        setReferralDetails(details);
      }
    } catch (error) {
      console.error('Error loading Partner data:', error);
    }
  };

  useEffect(() => {
    if (myStats.totalReferrals > 0) {
      loadPartnerData();
    }
  }, [myStats.totalReferrals]);

  return {
    myStats,
    currentMonthLeaderboard,
    lastMonthLeaderboard,
    allTimeLeaderboard,
    monthlyHistory,
    loading,
    copyReferralCode,
    shareReferralLink,
    refreshData: loadReferralData,
    partnerStatus,
    partnerStats,
    referralDetails,
    submitPartnerApplication,
    exportReferralData,
    partnerPassword: partnerStats ? (partnerStats as any).password || '' : ''
  };
};



