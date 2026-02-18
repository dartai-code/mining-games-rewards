import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { X, Loader2 } from 'lucide-react';
import { adService } from '../services/adService';

interface AutomaticAdsModalProps {
  open: boolean;
  onClose: () => void;
  onAdsDismissed: () => void;
  displayDuration?: number; // Time in seconds before auto-close
}

export function AutomaticAdsModal({
  open,
  onClose,
  onAdsDismissed,
  displayDuration = 15
}: AutomaticAdsModalProps) {
  const [countdown, setCountdown] = useState(displayDuration);
  const [adsShown, setAdsShown] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      setCountdown(displayDuration);
      setAdsShown(0);
      setLoading(true);
      // Show first interstitial ad
      showInterstitialAd(false);
    }
  }, [open, displayDuration]);

  useEffect(() => {
    if (!open || adsShown === 0) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          handleDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [open, adsShown]);

  const showInterstitialAd = async (wasChained: boolean) => {
    try {
      await adService.showInterstitial();
      setAdsShown(prev => {
        const newCount = prev + 1;
        if (newCount === 2) {
          // Both ads shown, start countdown
          setLoading(false);
        } else {
          // Chain second ad only after the first finishes
          setTimeout(() => showInterstitialAd(true), 500);
        }
        return newCount;
      });
    } catch (e) {
      // If ads fail, continue anyway
      setAdsShown(prev => {
        const newCount = prev + 1;
        if (newCount === 2) {
          setLoading(false);
        } else {
          setTimeout(() => showInterstitialAd(true), 500);
        }
        return newCount;
      });
    }
  };

  const handleDismiss = () => {
    onAdsDismissed();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center justify-between">
            <span>Loading Ads...</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
              <p className="text-sm text-gray-400">Displaying ads ({adsShown}/2)...</p>
              <div className="flex gap-2">
                {[1, 2].map(i => (
                  <div
                    key={i}
                    className={`h-2 w-8 rounded ${
                      i <= adsShown ? 'bg-green-500' : 'bg-gray-700'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Complete state */}
          {!loading && (
            <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 p-4 rounded-lg border border-green-500/30 text-center">
              <p className="text-sm text-white mb-2">✓ Ads Displayed Successfully!</p>
              <p className="text-xs text-gray-400">Your mining session is starting in {countdown}s...</p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        {!loading && (
          <div className="flex gap-3">
            <Button
              onClick={handleDismiss}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Start Mining Now ({countdown}s)
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
