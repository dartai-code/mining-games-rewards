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
      console.error('Google Sign in error:', err);
      let errorMessage = 'Google sign-in failed. ';
      
      if (err.code === 'auth/popup-closed-by-user') {
        errorMessage += 'Sign-in cancelled.';
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage += 'Network error. Check your internet connection.';
      } else if (err.code === 'auth/invalid-credential') {
        errorMessage += 'Invalid credentials. Make sure SHA-1 is configured in Firebase.';
      } else if (err.message) {
        errorMessage += err.message;
      } else {
        errorMessage += 'Please try again or use Guest sign-in.';
      }
      
      setError(errorMessage);
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

  const linkWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);
      const linkedUser = await authService.linkWithGoogle();
      
      // Update user document in Firestore with new info
      await firebaseStorage.createOrUpdateUserData({
        username: linkedUser.displayName || `Player${linkedUser.uid.substring(0, 6)}`,
        email: linkedUser.email,
      });
      
      setUser(linkedUser);
      return linkedUser;
    } catch (err: any) {
      console.error('Link account error:', err);
      let errorMessage = 'Failed to link account. ';
      
      if (err.code === 'auth/credential-already-in-use') {
        errorMessage = 'This Google account is already linked to another user.';
      } else if (err.code === 'auth/provider-already-linked') {
        errorMessage = 'Your account is already linked to Google.';
      } else if (err.message) {
        errorMessage += err.message;
      } else {
        errorMessage += 'Please try again later.';
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    signInAnonymous,
    signInWithGoogle,
    linkWithGoogle,
    signOut,
    isAuthenticated: authService.isAuthenticated()
  };
};
