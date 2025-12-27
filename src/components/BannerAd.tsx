import { useEffect, useState } from 'react';
import { adService } from '../services/adService';
import { Loader2 } from 'lucide-react';

interface BannerAdProps {
  className?: string;
}

export function BannerAd({ className = '' }: BannerAdProps) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAd = async () => {
      try {
        await adService.showBanner();
        setLoading(false);
      } catch (err) {
        setLoading(false);
      }
    };
    loadAd();

    return () => {
      adService.hideBanner();
    };
  }, []);

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-[50px] bg-gray-800/50 rounded ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
      </div>
    );
  }

  // Native AdMob banner is rendered by the plugin, this is just a placeholder
  return <div className={`h-[50px] ${className}`} />;
}
