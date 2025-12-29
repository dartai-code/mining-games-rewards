// Firebase Authentication Service
import { 
  signInAnonymously, 
  signInWithPopup, 
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { auth } from '@/config/firebase';

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
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      return this.mapUser(result.user);
    } catch (error) {
      console.error('Google sign in failed:', error);
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
