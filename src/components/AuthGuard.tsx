import { ReactNode, useState, useEffect } from 'react';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { AuthModal } from './AuthModal';
import { Loader2 } from 'lucide-react';
import { recoveryCodeService } from '@/services/recoveryCodeService';
import { firebaseStorage } from '@/services/firebaseStorageService';

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading, signInAnonymous } = useFirebaseAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [restoringAccount, setRestoringAccount] = useState(false);

  // Check for pending account restoration
  useEffect(() => {
    const checkRestoration = async () => {
      if (!user || loading) return;

      const restoreUID = await recoveryCodeService.checkPendingRestoration();
      
      if (restoreUID && restoreUID !== user.uid) {
        // Need to restore a different account
        setRestoringAccount(true);
        
        try {
          // Sign out current user and sign in as anonymous
          // The restoration will happen when the correct UID matches
          await recoveryCodeService.syncRestoredData(restoreUID);
          
          // Reload to complete restoration
          window.location.reload();
        } catch (error) {
          console.error('Restoration failed:', error);
          setRestoringAccount(false);
        }
      }
    };

    checkRestoration();
  }, [user, loading]);

  useEffect(() => {
    if (!loading && !user) {
      setShowAuthModal(true);
    } else {
      setShowAuthModal(false);
    }
  }, [user, loading]);

  if (loading || restoringAccount) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-white text-lg">
            {restoringAccount ? 'Restoring your account...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      <AuthModal open={showAuthModal} onClose={() => {}} />
    </>
  );
}
