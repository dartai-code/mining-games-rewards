import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Loader2, Gift, AlertCircle } from 'lucide-react';
import { adService, RewardedAdCallbacks } from '../services/adService';
import { Alert, AlertDescription } from './ui/alert';

interface RewardedAdModalProps {
  open: boolean;
  onClose: () => void;
  onRewardGranted: () => void;
  title?: string;
  description?: string;
}

export function RewardedAdModal({
  open,
  onClose,
  onRewardGranted,
  title = 'Watch Ad for Reward',
  description = 'Watch a short video to receive your reward'
}: RewardedAdModalProps) {
  const [loading, setLoading] = useState(false);
  const [adReady, setAdReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadRewardedAd();
    }
  }, [open]);

  const loadRewardedAd = async () => {
    setLoading(true);
    setError(null);
    setAdReady(false);

    const callbacks: RewardedAdCallbacks = {
      onReady: () => {
        setAdReady(true);
        setLoading(false);
      },
      onError: (err) => {
        setError(err);
        setLoading(false);
      }
    };

    try {
      await adService.loadRewardedAd(callbacks);
    } catch (err) {
      setError('Failed to load ad. Please try again.');
      setLoading(false);
    }
  };

  const handleWatchAd = async () => {
    const callbacks: RewardedAdCallbacks = {
      onGranted: () => {
        onRewardGranted();
        onClose();
      },
      onClosed: () => {
        onClose();
      },
      onError: (err) => {
        setError(err);
      }
    };
    await adService.showRewardedAd(callbacks);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Gift className="w-5 h-5 text-purple-500" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-gray-400">{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {loading && (
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
              <p className="text-sm text-gray-400">Loading ad...</p>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {adReady && !error && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 p-4 rounded-lg border border-purple-500/30">
                <p className="text-sm text-center text-white">Ad is ready! Click below to watch and receive your reward.</p>
              </div>
              <Button onClick={handleWatchAd} className="w-full bg-purple-600 hover:bg-purple-700" size="lg">
                <Gift className="w-4 h-4 mr-2" />Watch Ad
              </Button>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="ghost" onClick={onClose} className="text-gray-400">Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
