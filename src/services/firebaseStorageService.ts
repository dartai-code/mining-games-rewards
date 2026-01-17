// Firebase Firestore Storage Service
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  getDocs,
  updateDoc,
  increment,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { authService } from './firebaseAuthService';

// User Data Interface
export interface FirebaseUserData {
  uid: string;
  username: string;
  country: string;
  totalBalance: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Referrals
  referralCode?: string;
  inviterCode?: string;
  referralCount?: number;
  
  // Partner
  partnerStatus?: 'eligible' | 'pending' | 'approved' | 'rejected' | 'not_eligible';
  telegramHandle?: string;
  partnerAppliedAt?: Timestamp;
  partnerApprovedAt?: Timestamp;
  partnerPassword?: string;
  
  // Mining
  miningSession?: {
    startTime: number;
    endTime: number;
    isActive: boolean;
  };
  
  // Game Progress - Jump Climb
  jumpClimbProgress?: {
    highScore: number;
    lives: number;
    lastLifeUpdate: number;
  };
  
  // Game Progress - Stack Tower
  stackTowerProgress?: {
    highScore: number;
    lives: number;
    lastLifeUpdate: number;
  };
}

// Transaction Interface
export interface FirebaseTransaction {
  id: string;
  uid: string;
  type: 'Mining' | 'Game' | 'Referral' | 'Task';
  amount: number;
  timestamp: Timestamp;
  note: string;
  game?: string;
}

// Leaderboard Entry Interface
export interface FirebaseLeaderboardEntry {
  uid: string;
  username: string;
  country: string;
  score: number;
  game: string;
  timestamp: Timestamp;
  period: 'daily' | 'weekly' | 'monthly';
}

class FirebaseStorageService {
  // ========== USER DATA ==========
  
  async getUserData(uid?: string): Promise<FirebaseUserData | null> {
    const userId = uid || authService.getUserId();
    if (!userId) return null;

    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as FirebaseUserData;
      }
      return null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  async createOrUpdateUserData(data: Partial<FirebaseUserData>): Promise<void> {
    const userId = authService.getUserId();
    if (!userId) throw new Error('User not authenticated');

    try {
      const docRef = doc(db, 'users', userId);
      await setDoc(docRef, {
        ...data,
        uid: userId,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Error updating user data:', error);
      throw error;
    }
  }

  // ========== TRANSACTIONS ==========
  
  async addTransaction(type: FirebaseTransaction['type'], amount: number, note: string, game?: string): Promise<void> {
    const userId = authService.getUserId();
    if (!userId) throw new Error('User not authenticated');

    try {
      const transactionRef = doc(collection(db, 'transactions'));
      await setDoc(transactionRef, {
        id: transactionRef.id,
        uid: userId,
        type,
        amount,
        note,
        game,
        timestamp: serverTimestamp()
      });

      // Update user balance
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        totalBalance: increment(amount),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  }

  async getUserTransactions(limitCount: number = 50): Promise<FirebaseTransaction[]> {
    const userId = authService.getUserId();
    if (!userId) return [];

    try {
      const q = query(
        collection(db, 'transactions'),
        where('uid', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as FirebaseTransaction);
    } catch (error) {
      console.error('Error getting transactions:', error);
      return [];
    }
  }

  // ========== LEADERBOARD ==========
  
  async addLeaderboardScore(score: number, game: string, period: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<void> {
    const userId = authService.getUserId();
    if (!userId) throw new Error('User not authenticated');

    const userData = await this.getUserData();
    if (!userData) throw new Error('User data not found');

    try {
      const leaderboardRef = doc(collection(db, 'leaderboard'));
      await setDoc(leaderboardRef, {
        uid: userId,
        username: userData.username,
        country: userData.country,
        score,
        game,
        period,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error adding leaderboard score:', error);
      throw error;
    }
  }

  async getLeaderboard(game: string, period: 'daily' | 'weekly' | 'monthly', limitCount: number = 100): Promise<FirebaseLeaderboardEntry[]> {
    try {
      const q = query(
        collection(db, 'leaderboard'),
        where('game', '==', game),
        where('period', '==', period),
        orderBy('score', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as FirebaseLeaderboardEntry);
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return [];
    }
  }

  // ========== GAME PROGRESS ==========
  
  async updateJumpClimbProgress(progress: Partial<FirebaseUserData['jumpClimbProgress']>): Promise<void> {
    const userId = authService.getUserId();
    if (!userId) return; // Silent fail for guest users

    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        jumpClimbProgress: progress,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating Jump Climb progress:', error);
    }
  }

  async updateStackTowerProgress(progress: Partial<FirebaseUserData['stackTowerProgress']>): Promise<void> {
    const userId = authService.getUserId();
    if (!userId) return; // Silent fail for guest users

    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        stackTowerProgress: progress,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating Stack Tower progress:', error);
    }
  }

  // ========== MINING ==========
  
  async updateMiningSession(session: FirebaseUserData['miningSession']): Promise<void> {
    const userId = authService.getUserId();
    if (!userId) throw new Error('User not authenticated');

    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        miningSession: session,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating mining session:', error);
      throw error;
    }
  }

  // ========== REFERRALS ==========
  
  async updateReferralData(referralCode: string, inviterCode?: string): Promise<void> {
    const userId = authService.getUserId();
    if (!userId) throw new Error('User not authenticated');

    try {
      const userRef = doc(db, 'users', userId);
      const updateData: any = {
        referralCode,
        updatedAt: serverTimestamp()
      };

      if (inviterCode) {
        updateData.inviterCode = inviterCode;
        
        // Increment referral count for inviter
        const inviterQuery = query(
          collection(db, 'users'),
          where('referralCode', '==', inviterCode),
          limit(1)
        );
        const inviterSnapshot = await getDocs(inviterQuery);
        
        if (!inviterSnapshot.empty) {
          const inviterDoc = inviterSnapshot.docs[0];
          await updateDoc(doc(db, 'users', inviterDoc.id), {
            referralCount: increment(1)
          });
        }
      }

      await updateDoc(userRef, updateData);
    } catch (error) {
      console.error('Error updating referral data:', error);
      throw error;
    }
  }

  async getReferralStats(uid?: string): Promise<{
    totalReferrals: number;
    activeUsers: number;
    activityBonus: number;
  }> {
    const userId = uid || authService.getUserId();
    if (!userId) return { totalReferrals: 0, activeUsers: 0, activityBonus: 0 };

    try {
      const userData = await this.getUserData(userId);
      if (!userData) return { totalReferrals: 0, activeUsers: 0, activityBonus: 0 };

      // Get all users referred by this user
      const referralsQuery = query(
        collection(db, 'users'),
        where('inviterCode', '==', userData.referralCode)
      );
      const referralsSnapshot = await getDocs(referralsQuery);

      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      let activeCount = 0;
      let totalActivityBonus = 0;

      referralsSnapshot.forEach((docSnap) => {
        const refData = docSnap.data();
        // Check if user played in last 30 days
        if (refData.updatedAt?.toMillis() > thirtyDaysAgo) {
          activeCount++;
        }
        // Calculate 5% bonus from their total balance
        totalActivityBonus += (refData.totalBalance || 0) * 0.05;
      });

      return {
        totalReferrals: referralsSnapshot.size,
        activeUsers: activeCount,
        activityBonus: Math.floor(totalActivityBonus)
      };
    } catch (error) {
      console.error('Error getting referral stats:', error);
      return { totalReferrals: 0, activeUsers: 0, activityBonus: 0 };
    }
  }

  async getReferralLeaderboard(period: 'current' | 'last' | 'alltime'): Promise<any[]> {
    try {
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const lastMonth = new Date(now.setMonth(now.getMonth() - 1));
      const lastMonthKey = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;

      let periodKey = currentMonth;
      if (period === 'last') periodKey = lastMonthKey;
      if (period === 'alltime') periodKey = 'alltime';

      const leaderboardQuery = query(
        collection(db, 'referralLeaderboard'),
        where('period', '==', periodKey),
        orderBy('referrals', 'desc'),
        limit(10)
      );

      const snapshot = await getDocs(leaderboardQuery);
      return snapshot.docs.map((doc, index) => ({
        rank: index + 1,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting referral leaderboard:', error);
      return [];
    }
  }

  async getReferralHistory(): Promise<any[]> {
    try {
      const historyQuery = query(
        collection(db, 'referralLeaderboard'),
        orderBy('period', 'desc')
      );

      const snapshot = await getDocs(historyQuery);
      const monthsMap = new Map();

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.period !== 'alltime' && data.period !== `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`) {
          if (!monthsMap.has(data.period)) {
            const [year, month] = data.period.split('-');
            monthsMap.set(data.period, {
              monthKey: data.period,
              displayName: new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
              leaderboard: []
            });
          }
          monthsMap.get(data.period).leaderboard.push({
            rank: monthsMap.get(data.period).leaderboard.length + 1,
            ...data
          });
        }
      });

      return Array.from(monthsMap.values());
    } catch (error) {
      console.error('Error getting referral history:', error);
      return [];
    }
  }

  // Track successful referral install (called when new user spends 3+ minutes)
  async recordReferralInstall(inviterCode: string, newUserId: string): Promise<void> {
    try {
      const inviterQuery = query(
        collection(db, 'users'),
        where('referralCode', '==', inviterCode),
        limit(1)
      );
      const inviterSnapshot = await getDocs(inviterQuery);

      if (!inviterSnapshot.empty) {
        const inviterDoc = inviterSnapshot.docs[0];
        const inviterId = inviterDoc.id;

        // Award 50 DART to inviter
        await this.addTransaction('Referral', 50, `New referral install from user ${newUserId}`);

        // Update monthly leaderboard
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        
        const leaderboardRef = doc(collection(db, 'referralLeaderboard'));
        await setDoc(leaderboardRef, {
          userId: inviterId,
          username: inviterDoc.data().username,
          period: currentMonth,
          referrals: increment(1),
          timestamp: serverTimestamp()
        }, { merge: true });

        // Update all-time leaderboard
        const allTimeRef = doc(collection(db, 'referralLeaderboard'));
        await setDoc(allTimeRef, {
          userId: inviterId,
          username: inviterDoc.data().username,
          period: 'alltime',
          referrals: increment(1),
          timestamp: serverTimestamp()
        }, { merge: true });
      }
    } catch (error) {
      console.error('Error recording referral install:', error);
    }
  }

  // ========== Partner ==========

  async submitPartnerApplication(userId: string, telegramHandle: string, pitch: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        partnerStatus: 'pending',
        telegramHandle,
        PartnerPitch: pitch,
        PartnerAppliedAt: serverTimestamp()
      });

      // Create application record for admin review
      const applicationRef = doc(collection(db, 'PartnerApplications'));
      await setDoc(applicationRef, {
        userId,
        telegramHandle,
        pitch,
        status: 'pending',
        submittedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error submitting Partner application:', error);
      throw error;
    }
  }

  async getPartnerStats(userId: string): Promise<any> {
    try {
      const userData = await this.getUserData(userId);
      if (!userData) return null;

      const referralStats = await this.getReferralStats(userId);
      
      // Get this month's installs
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const transactionsQuery = query(
        collection(db, 'users', userId, 'transactions'),
        where('type', '==', 'Referral'),
        where('timestamp', '>=', Timestamp.fromDate(thisMonthStart))
      );
      const monthlySnapshot = await getDocs(transactionsQuery);

      const thisMonthInstalls = monthlySnapshot.size;
      const monthlyEarnings = monthlySnapshot.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);

      // Calculate conversion rate (simplified - can be enhanced)
      const conversionRate = referralStats.totalReferrals > 0 
        ? Math.round((referralStats.activeUsers / referralStats.totalReferrals) * 100)
        : 0;

      return {
        totalReferrals: referralStats.totalReferrals,
        thisMonthInstalls,
        conversionRate,
        activeReferrals: referralStats.activeUsers,
        inactiveReferrals: referralStats.totalReferrals - referralStats.activeUsers,
        monthlyEarnings,
        allTimeEarnings: (referralStats.totalReferrals * 100) + referralStats.activityBonus,
        password: userData.partnerPassword || ''
      };
    } catch (error) {
      console.error('Error getting Partner stats:', error);
      return null;
    }
  }

  async getPartnerReferralDetails(userId: string): Promise<any[]> {
    try {
      const userData = await this.getUserData(userId);
      if (!userData || !userData.referralCode) return [];

      // Get all users referred by this Partner
      const referralsQuery = query(
        collection(db, 'users'),
        where('inviterCode', '==', userData.referralCode)
      );
      const snapshot = await getDocs(referralsQuery);

      const details = snapshot.docs.map(doc => {
        const data = doc.data();
        const joinDate = data.createdAt?.toDate() || new Date();
        const lastActive = data.updatedAt?.toDate() || new Date();
        const daysSinceActive = Math.floor((Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
        const isActive = daysSinceActive <= 30;

        return {
          id: doc.id,
          username: data.username || 'Unknown',
          joinDate: joinDate.toLocaleDateString(),
          lastActive: lastActive.toLocaleDateString(),
          status: isActive ? 'active' : 'inactive',
          totalEarned: Math.floor((data.totalBalance || 0) * 0.10), // 10% bonus
          daysActive: Math.floor((Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24))
        };
      });

      return details.sort((a, b) => b.totalEarned - a.totalEarned);
    } catch (error) {
      console.error('Error getting Partner referral details:', error);
      return [];
    }
  }
}

export const firebaseStorage = new FirebaseStorageService();


