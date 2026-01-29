import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Loader2, LogIn, UserCircle, Shield } from 'lucide-react';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { RecoveryCodeInput } from './RecoveryCodeInput';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export function AuthModal({ open, onClose }: AuthModalProps) {
  const { signInAnonymous, signInWithGoogle, loading, error } = useFirebaseAuth();
  const [signingIn, setSigningIn] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);

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

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-gray-900 px-2 text-gray-500">Or</span>
            </div>
          </div>

          {/* Recovery Code Button */}
          <Button
            onClick={() => {
              setShowRecoveryModal(true);
            }}
            disabled={signingIn || loading}
            variant="outline"
            className="w-full border-purple-500/50 bg-purple-900/20 hover:bg-purple-900/40 text-purple-300 font-semibold py-6 text-base"
            size="lg"
          >
            <Shield className="w-5 h-5 mr-2" />
            I Have a Recovery Code
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

      {/* Recovery Code Modal */}
      <RecoveryCodeInput 
        open={showRecoveryModal} 
        onClose={() => setShowRecoveryModal(false)}
        onRecoverySuccess={() => {
          setShowRecoveryModal(false);
          onClose();
          window.location.reload();
        }}
      />
    </Dialog>
  );
}
