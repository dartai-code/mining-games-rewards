// Recovery Code Service - Allow users to backup and restore their anonymous accounts
import { auth, db } from '@/config/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { signInWithCustomToken } from 'firebase/auth';

class RecoveryCodeService {
  // Generate a random 8-character recovery code
  generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous characters
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
      if (i === 3) code += '-'; // Format: XXXX-XXXX
    }
    return code;
  }

  // Create recovery code for current user
  async createRecoveryCode(): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');

    // Check if user already has a recovery code (STRICT: one code per account, permanent)
    const existingCode = await this.getUserRecoveryCode(user.uid);
    if (existingCode) {
      // User already has a code, return it (cannot create a new one)
      localStorage.setItem('recovery_code', existingCode);
      return existingCode;
    }

    // Generate new code and ensure it's unique
    let code = this.generateCode();
    let attempts = 0;
    const maxAttempts = 10;
    
    // Keep generating until we find a unique code
    while (attempts < maxAttempts) {
      const existingUID = await this.getUIDFromCode(code);
      if (!existingUID) {
        // Code is unique, use it
        break;
      }
      code = this.generateCode();
      attempts++;
    }
    
    if (attempts >= maxAttempts) {
      throw new Error('Failed to generate unique recovery code');
    }
    
    // Store in Firestore: code -> uid mapping (PERMANENT, cannot be changed)
    await setDoc(doc(db, 'recoveryCodes', code), {
      uid: user.uid,
      createdAt: serverTimestamp(),
      email: user.email || null,
      displayName: user.displayName || null,
      permanent: true // Flag to indicate this mapping is permanent
    });

    // Also store uid -> code mapping for easy lookup (PERMANENT)
    await setDoc(doc(db, 'users', user.uid, 'private', 'recovery'), {
      code: code,
      createdAt: serverTimestamp(),
      permanent: true // This code cannot be changed
    });

    // Store locally
    localStorage.setItem('recovery_code', code);
    
    return code;
  }

  // Get recovery code for specific user
  async getUserRecoveryCode(uid: string): Promise<string | null> {
    try {
      const recoveryDoc = await getDoc(doc(db, 'users', uid, 'private', 'recovery'));
      if (recoveryDoc.exists()) {
        return recoveryDoc.data().code;
      }
      return null;
    } catch (error) {
      console.error('Error fetching recovery code:', error);
      return null;
    }
  }

  // Get current user's recovery code (from local storage or Firestore)
  async getCurrentUserRecoveryCode(): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');

    // Try local storage first
    const localCode = localStorage.getItem('recovery_code');
    if (localCode) return localCode;

    // Try Firestore
    const firestoreCode = await this.getUserRecoveryCode(user.uid);
    if (firestoreCode) {
      localStorage.setItem('recovery_code', firestoreCode);
      return firestoreCode;
    }

    // Generate new code if none exists
    return await this.createRecoveryCode();
  }

  // Verify and get UID from recovery code
  async getUIDFromCode(code: string): Promise<string | null> {
    try {
      const codeDoc = await getDoc(doc(db, 'recoveryCodes', code.toUpperCase()));
      if (codeDoc.exists()) {
        return codeDoc.data().uid;
      }
      return null;
    } catch (error) {
      console.error('Error verifying recovery code:', error);
      return null;
    }
  }

  // Restore account using recovery code
  async restoreAccountWithCode(code: string): Promise<boolean> {
    try {
      const uid = await this.getUIDFromCode(code);
      
      if (!uid) {
        throw new Error('Invalid recovery code');
      }

      // Store the UID and code for restoration after page reload
      localStorage.setItem('restore_uid', uid);
      localStorage.setItem('recovery_code', code.toUpperCase());
      
      return true;
    } catch (error) {
      console.error('Error restoring account:', error);
      throw error;
    }
  }

  // Check if there's a pending restoration and sync data
  async checkPendingRestoration(): Promise<string | null> {
    const restoreUID = localStorage.getItem('restore_uid');
    
    if (restoreUID && auth.currentUser) {
      const currentUID = auth.currentUser.uid;
      
      // If current user doesn't match the restore UID, we need to sign out and re-sign in
      if (currentUID !== restoreUID) {
        console.log('UID mismatch detected, restoration needed');
        return restoreUID;
      } else {
        // Already restored, clear flags
        localStorage.removeItem('restore_uid');
      }
    }
    
    return null;
  }

  // Sync all data for restored account
  async syncRestoredData(uid: string): Promise<void> {
    try {
      // Data will automatically sync from Firebase when the correct user is authenticated
      // The firebaseStorageService.getUserData() will fetch the user's data
      console.log('Account restored successfully for UID:', uid);
      
      // Clear restoration flag
      localStorage.removeItem('restore_uid');
    } catch (error) {
      console.error('Error syncing restored data:', error);
      throw error;
    }
  }

  // Store recovery code for potential account restoration
  storeRecoveryIntent(code: string) {
    sessionStorage.setItem('recovery_intent', code.toUpperCase());
  }

  // Get and clear recovery intent
  getRecoveryIntent(): string | null {
    const code = sessionStorage.getItem('recovery_intent');
    if (code) {
      sessionStorage.removeItem('recovery_intent');
      return code;
    }
    return null;
  }
}

export const recoveryCodeService = new RecoveryCodeService();
