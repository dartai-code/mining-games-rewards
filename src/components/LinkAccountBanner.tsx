import { useState } from 'react';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Link2, Loader2, CheckCircle } from 'lucide-react';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';

export function LinkAccountBanner() {
  const { user, linkWithGoogle, loading } = useFirebaseAuth();
  const [linking, setLinking] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only show if user is anonymous
  if (!user?.isAnonymous || success) {
    return null;
  }

  const handleLinkAccount = async () => {
    setLinking(true);
    setError(null);
    try {
      await linkWithGoogle();
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to link account');
      console.error('Link account error:', err);
    } finally {
      setLinking(false);
    }
  };

  return (
    <Alert className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-purple-500/50">
      <Link2 className="h-4 w-4 text-purple-400" />
      <AlertDescription className="flex flex-col gap-3">
        <div>
          <p className="font-semibold text-white mb-1">Secure Your Progress!</p>
          <p className="text-sm text-gray-300">
            You're playing as a guest. Link your Google account to save your progress permanently and sync across devices.
          </p>
        </div>
        {error && (
          <div className="bg-red-500/10 border border-red-500 rounded-lg p-2 text-red-400 text-sm">
            {error}
          </div>
        )}
        <Button
          onClick={handleLinkAccount}
          disabled={linking || loading}
          className="w-full bg-white hover:bg-gray-100 text-gray-900 font-semibold"
          size="sm"
        >
          {linking || loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Linking...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Link Google Account
            </>
          )}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
