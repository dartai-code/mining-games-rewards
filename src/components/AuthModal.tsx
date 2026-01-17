import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Loader2, LogIn, UserCircle } from 'lucide-react';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export function AuthModal({ open, onClose }: AuthModalProps) {
  const { signInAnonymous, signInWithGoogle, loading, error } = useFirebaseAuth();
  const [signingIn, setSigningIn] = useState(false);

  const handleAnonymousSignIn = async () => {
    setSigningIn(true);
    try {
      await signInAnonymous();
      onClose();
    } catch (err) {
      console.error('Sign in failed:', err);
    } finally {
      setSigningIn(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    try {
      await signInWithGoogle();
      onClose();
    } catch (err) {
      console.error('Google sign in failed:', err);
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && !loading && onClose()}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-800" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-white text-2xl text-center">Welcome to DART AI</DialogTitle>
          <DialogDescription className="text-gray-400 text-center">
            Sign in to save your progress and compete on leaderboards
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-6">
          {/* Anonymous/Login Button */}
          <Button
            onClick={handleAnonymousSignIn}
            disabled={signingIn || loading}
            className="w-full bg-gradient-to-r from-green-600 to-orange-600 hover:from-green-700 hover:to-orange-700 text-white font-semibold py-6 text-lg"
            size="lg"
          >
            {signingIn && loading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <LogIn className="w-5 h-5 mr-2" />
            )}
            Login
          </Button>

          {error && (
            <div className="bg-red-500/10 border border-red-500 rounded-lg p-3 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <p className="text-xs text-gray-500 text-center mt-4">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
