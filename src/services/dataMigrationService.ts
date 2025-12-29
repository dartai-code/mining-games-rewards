// Data Migration Service - Migrates localStorage data to Firebase
import { firebaseStorage } from './firebaseStorageService';
import { authService } from './firebaseAuthService';

interface LocalStorageData {
  totalBalance?: number;
  transactions?: any[];
  miningSession?: any;
  match3_player_data?: any;
  match3_lives?: number;
  match3_life_ts?: number;
  currentLevel?: number;
  gameState?: any;
  bullseyeLevel?: number;
  userProfile?: any;
  referralCode?: string;
  inviterCode?: string;
  completedTasks?: string[];
}

class DataMigrationService {
  private migrationKey = 'firebase_migration_completed';

  // Check if migration has already been completed
  hasMigrated(): boolean {
    return localStorage.getItem(this.migrationKey) === 'true';
  }

  // Mark migration as completed
  private markMigrationCompleted(): void {
    localStorage.setItem(this.migrationKey, 'true');
  }

  // Collect all localStorage data
  private collectLocalData(): LocalStorageData {
    const data: LocalStorageData = {};

    try {
      // Wallet & Transactions
      const totalBalance = localStorage.getItem('totalBalance');
      if (totalBalance) data.totalBalance = parseFloat(totalBalance);

      const transactions = localStorage.getItem('transactions');
      if (transactions) data.transactions = JSON.parse(transactions);

      // Mining
      const miningSession = localStorage.getItem('miningSession');
      if (miningSession) data.miningSession = JSON.parse(miningSession);

      // Match3 Game
      const match3Data = localStorage.getItem('match3_player_data');
      if (match3Data) data.match3_player_data = JSON.parse(match3Data);

      const match3Lives = localStorage.getItem('match3_lives');
      if (match3Lives) data.match3_lives = parseInt(match3Lives);

      const match3LifeTs = localStorage.getItem('match3_life_ts');
      if (match3LifeTs) data.match3_life_ts = parseInt(match3LifeTs);

      const currentLevel = localStorage.getItem('currentLevel');
      if (currentLevel) data.currentLevel = parseInt(currentLevel);

      // Game State
      const gameState = localStorage.getItem('gameState');
      if (gameState) data.gameState = JSON.parse(gameState);

      // Bullseye
      const bullseyeLevel = localStorage.getItem('bullseyeLevel');
      if (bullseyeLevel) data.bullseyeLevel = parseInt(bullseyeLevel);

      // User Profile
      const userProfile = localStorage.getItem('userProfile');
      if (userProfile) data.userProfile = JSON.parse(userProfile);

      // Referrals
      const referralCode = localStorage.getItem('referralCode');
      if (referralCode) data.referralCode = referralCode;

      const inviterCode = localStorage.getItem('inviterCode');
      if (inviterCode) data.inviterCode = inviterCode;

      // Tasks
      const completedTasks = localStorage.getItem('completedTasks');
      if (completedTasks) data.completedTasks = JSON.parse(completedTasks);

    } catch (error) {
      console.error('Error collecting local data:', error);
    }

    return data;
  }

  // Migrate data to Firebase
  async migrateToFirebase(): Promise<void> {
    // Check if user is authenticated
    if (!authService.isAuthenticated()) {
      console.log('User not authenticated, skipping migration');
      return;
    }

    // Check if already migrated
    if (this.hasMigrated()) {
      console.log('Migration already completed');
      return;
    }

    try {
      console.log('Starting data migration to Firebase...');
      const localData = this.collectLocalData();

      // Migrate user profile and balance
      const userDataUpdate: any = {};

      if (localData.userProfile) {
        userDataUpdate.username = localData.userProfile.username;
        userDataUpdate.country = localData.userProfile.country;
      }

      if (localData.totalBalance !== undefined) {
        userDataUpdate.totalBalance = localData.totalBalance;
      }

      if (localData.miningSession) {
        userDataUpdate.miningSession = {
          startTime: localData.miningSession.startTime,
          endTime: localData.miningSession.endTime,
          isActive: localData.miningSession.isActive
        };
      }

      // Match3 Progress
      if (localData.match3_player_data || localData.match3_lives) {
        userDataUpdate.match3Progress = {
          currentLevel: localData.match3_player_data?.currentLevel || localData.currentLevel || 1,
          completedLevels: localData.match3_player_data?.completedLevels || [],
          stars: localData.match3_player_data?.stars || {},
          lives: localData.match3_lives || 5,
          lastLifeUpdate: localData.match3_life_ts || Date.now()
        };
      }

      // Bullseye Progress
      if (localData.bullseyeLevel || localData.gameState?.highScores?.bullseye) {
        userDataUpdate.bullseyeProgress = {
          currentLevel: localData.bullseyeLevel || 1,
          highScore: localData.gameState?.highScores?.bullseye || 0
        };
      }

      // Referrals
      if (localData.referralCode) {
        userDataUpdate.referralCode = localData.referralCode;
      }
      if (localData.inviterCode) {
        userDataUpdate.inviterCode = localData.inviterCode;
      }

      // Update user data in Firebase
      if (Object.keys(userDataUpdate).length > 0) {
        await firebaseStorage.createOrUpdateUserData(userDataUpdate);
        console.log('User data migrated successfully');
      }

      // Migrate transactions
      if (localData.transactions && localData.transactions.length > 0) {
        for (const tx of localData.transactions) {
          try {
            await firebaseStorage.addTransaction(
              tx.type,
              tx.amount,
              tx.note || 'Migrated transaction',
              tx.game
            );
          } catch (error) {
            console.error('Error migrating transaction:', error);
          }
        }
        console.log(`Migrated ${localData.transactions.length} transactions`);
      }

      // Mark migration as completed
      this.markMigrationCompleted();
      console.log('✅ Data migration completed successfully!');

      // Optionally clear old localStorage data
      // this.clearOldData();

    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  // Optional: Clear old localStorage data after successful migration
  private clearOldData(): void {
    const keysToKeep = [this.migrationKey, 'theme'];
    const allKeys = Object.keys(localStorage);
    
    allKeys.forEach(key => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });
    
    console.log('Old localStorage data cleared');
  }

  // Force re-migration (for testing)
  resetMigration(): void {
    localStorage.removeItem(this.migrationKey);
    console.log('Migration reset - will run on next app load');
  }
}

export const dataMigration = new DataMigrationService();
