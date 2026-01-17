// Firebase Authentication Service
import { 
  signInAnonymously, 
  signInWithPopup, 
  signInWithCredential,
  linkWithCredential,
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { auth } from '@/config/firebase';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';

// Google Auth will be initialized when needed
let isGoogleAuthInitialized = false;

async function initializeGoogleAuth() {
  if (isGoogleAuthInitialized || !Capacitor.isNativePlatform()) {
    return;
  }
  
  try {
    await GoogleAuth.initialize({
      clientId: '839535063372-o1pjt9ejq8nsh6ro9g1o423ctt2d5t1t.apps.googleusercontent.com',
      scopes: ['profile', 'email'],
      grantOfflineAccess: true,
    });
    isGoogleAuthInitialized = true;
    console.log('GoogleAuth initialized successfully');
  } catch (error) {
    console.error('GoogleAuth initialization failed:', error);
    throw error;
  }
}

export interface AuthUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
}

class FirebaseAuthService {
  private currentUser: User | null = null;
  private authStateListeners: ((user: AuthUser | null) => void)[] = [];

  constructor() {
    // Listen to auth state changes
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
      const authUser = user ? this.mapUser(user) : null;
      this.authStateListeners.forEach(listener => listener(authUser));
    });
  }

  private mapUser(user: User): AuthUser {
    return {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      isAnonymous: user.isAnonymous
    };
  }

  // Sign in anonymously (for users who don't want to create account)
  async signInAnonymous(): Promise<AuthUser> {
    try {
      const result = await signInAnonymously(auth);
      return this.mapUser(result.user);
    } catch (error) {
      console.error('Anonymous sign in failed:', error);
      throw error;
    }
  }

  // Sign in with Google
  async signInWithGoogle(): Promise<AuthUser> {
    try {
      console.log('Starting Google Sign-In...');
      console.log('Platform:', Capacitor.getPlatform());
      console.log('Is Native:', Capacitor.isNativePlatform());
      
      // Check if running on native platform
      if (Capacitor.isNativePlatform()) {
        console.log('Using native Google Sign-In...');
        
        // Initialize GoogleAuth if not already done
        await initializeGoogleAuth();
        
        // Native platform (Android/iOS)
        const googleUser = await GoogleAuth.signIn();
        console.log('Google user obtained:', googleUser.email);
        
        if (!googleUser.authentication.idToken) {
          throw new Error('No ID token received from Google');
        }
        
        // Create credential from the Google user
        const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
        console.log('Firebase credential created');
        
        // Sign in to Firebase with the credential
        const result = await signInWithCredential(auth, credential);
        console.log('Firebase sign-in successful:', result.user.uid);
        return this.mapUser(result.user);
      } else {
        console.log('Using web Google Sign-In...');
        // Web platform
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        return this.mapUser(result.user);
      }
    } catch (error: any) {
      console.error('=== Google Sign-In Error Details ===');
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Full error:', JSON.stringify(error, null, 2));
      
      // Provide more specific error message
      if (error.code === '12501') {
        throw new Error('Sign-in cancelled by user');
      } else if (error.code === '10') {
        throw new Error('Developer error - Check SHA-1 fingerprint and package name in Firebase Console');
      } else if (error.message?.includes('DEVELOPER_ERROR')) {
        throw new Error('Configuration error - Verify google-services.json and SHA-1 are correct');
      }
      
      throw error;
    }
  }

  // Sign out
  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    }
  }

  // Link anonymous account with Google
  async linkWithGoogle(): Promise<AuthUser> {
    try {
      if (!this.currentUser) {
        throw new Error('No user is signed in');
      }

      if (!this.currentUser.isAnonymous) {
        throw new Error('User is already linked to an account');
      }

      console.log('Linking anonymous account with Google...');
      console.log('Platform:', Capacitor.getPlatform());
      
      // Check if running on native platform
      if (Capacitor.isNativePlatform()) {
        console.log('Using native Google Sign-In for linking...');
        
        // Initialize GoogleAuth if not already done
        await initializeGoogleAuth();
        
        // Native platform (Android/iOS)
        const googleUser = await GoogleAuth.signIn();
        console.log('Google user obtained:', googleUser.email);
        
        if (!googleUser.authentication.idToken) {
          throw new Error('No ID token received from Google');
        }
        
        // Create credential from the Google user
        const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
        console.log('Firebase credential created');
        
        // Link the anonymous account with Google credential
        const result = await linkWithCredential(this.currentUser, credential);
        console.log('Account linking successful:', result.user.uid);
        return this.mapUser(result.user);
      } else {
        console.log('Using web Google Sign-In for linking...');
        // Web platform
        const provider = new GoogleAuthProvider();
        const googleUser = await signInWithPopup(auth, provider);
        const credential = GoogleAuthProvider.credentialFromResult(googleUser);
        
        if (!credential) {
          throw new Error('Failed to get credential from Google');
        }
        
        const result = await linkWithCredential(this.currentUser, credential);
        return this.mapUser(result.user);
      }
    } catch (error: any) {
      console.error('=== Account Linking Error Details ===');
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Full error:', JSON.stringify(error, null, 2));
      
      // Provide more specific error message
      if (error.code === '12501') {
        throw new Error('Sign-in cancelled by user');
      } else if (error.code === '10') {
        throw new Error('Developer error - Check SHA-1 fingerprint and package name in Firebase Console');
      } else if (error.code === 'auth/credential-already-in-use') {
        throw new Error('This Google account is already linked to another user');
      } else if (error.code === 'auth/provider-already-linked') {
        throw new Error('Account is already linked to Google');
      } else if (error.message?.includes('DEVELOPER_ERROR')) {
        throw new Error('Configuration error - Verify google-services.json and SHA-1 are correct');
      }
      
      throw error;
    }
  }

  // Get current user
  getCurrentUser(): AuthUser | null {
    return this.currentUser ? this.mapUser(this.currentUser) : null;
  }

  // Subscribe to auth state changes
  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
    this.authStateListeners.push(callback);
    // Call immediately with current state
    callback(this.getCurrentUser());
    
    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  // Get user ID (for Firestore queries)
  getUserId(): string | null {
    return this.currentUser?.uid || null;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.currentUser;
  }
}

export const authService = new FirebaseAuthService();
