import { ReactNode, useState, useEffect } from 'react';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { AuthModal } from './AuthModal';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useFirebaseAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      setShowAuthModal(true);
    } else {
      setShowAuthModal(false);
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-white text-lg">Loading...</p>
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
