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
          {/* Google Sign In */}
          <Button
            onClick={handleGoogleSignIn}
            disabled={signingIn || loading}
            className="w-full bg-white hover:bg-gray-100 text-gray-900 font-semibold py-6 text-lg"
            size="lg"
          >
            {signingIn && loading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-gray-900 px-2 text-gray-500">Or</span>
            </div>
          </div>

          {/* Anonymous Sign In */}
          <Button
            onClick={handleAnonymousSignIn}
            disabled={signingIn || loading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-6 text-lg"
            size="lg"
          >
            {signingIn && loading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <UserCircle className="w-5 h-5 mr-2" />
            )}
            Continue as Guest
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
