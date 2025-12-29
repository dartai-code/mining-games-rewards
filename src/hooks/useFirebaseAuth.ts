// Hook for Firebase Authentication
import { useState, useEffect } from 'react';
import { authService, AuthUser } from '@/services/firebaseAuthService';
import { firebaseStorage } from '@/services/firebaseStorageService';
import { dataMigration } from '@/services/dataMigrationService';

export const useFirebaseAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange(async (authUser) => {
      setUser(authUser);
      setLoading(false);

      // Trigger data migration if user just signed in
      if (authUser && !dataMigration.hasMigrated()) {
        try {
          console.log('Migrating localStorage data to Firebase...');
          await dataMigration.migrateToFirebase();
        } catch (error) {
          console.error('Migration failed:', error);
        }
      }
    });

    return unsubscribe;
  }, []);

  const signInAnonymous = async () => {
    try {
      setError(null);
      setLoading(true);
      const authUser = await authService.signInAnonymous();
      
      // Create user document in Firestore
      await firebaseStorage.createOrUpdateUserData({
        username: `Player${authUser.uid.substring(0, 6)}`,
        country: 'Unknown',
        totalBalance: 0,
        createdAt: new Date() as any,
      });
      
      setUser(authUser);

      // Migrate data
      await dataMigration.migrateToFirebase();
    } catch (err: any) {
      setError(err.message);
      console.error('Sign in error:', err);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);
      const authUser = await authService.signInWithGoogle();
      
      // Create/update user document in Firestore
      await firebaseStorage.createOrUpdateUserData({
        username: authUser.displayName || `Player${authUser.uid.substring(0, 6)}`,
        country: 'Unknown',
        totalBalance: 0,
        createdAt: new Date() as any,
      });
      
      setUser(authUser);

      // Migrate data
      await dataMigration.migrateToFirebase();
    } catch (err: any) {
      setError(err.message);
      console.error('Sign in error:', err);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      await authService.signOut();
      setUser(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Sign out error:', err);
    }
  };

  return {
    user,
    loading,
    error,
    signInAnonymous,
    signInWithGoogle,
    signOut,
    isAuthenticated: authService.isAuthenticated()
  };
};
