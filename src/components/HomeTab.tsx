import React, { useState } from 'react';
import { Play, Pause, Share2 } from 'lucide-react';
import { useMining } from '../hooks/useMining';
import { useReferral } from '../hooks/useReferral';
import { BannerAd } from './BannerAd';
import { RewardedAdModal } from './RewardedAdModal';

const HomeTab: React.FC = () => {
  const { isActive, timeRemaining, totalBalance, startMining, stopMining, formatTime } = useMining();
  const { getReferralLink } = useReferral();
  const [showAdModal, setShowAdModal] = useState(false);

  const handleStartMining = () => {
    setShowAdModal(true);
  };

  const handleAdRewardGranted = () => {
    startMining();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Dart AI',
        text: 'Join me in collecting Dart points and playing games!',
        url: getReferralLink()
      });
    } else {
      navigator.clipboard.writeText(getReferralLink());
      alert('Referral link copied to clipboard!');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-950 text-white pb-20">
      <div 
        className="relative h-64 bg-cover bg-center flex items-center justify-center"
        style={{ 
          backgroundImage: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('https://d64gsuwffb70l.cloudfront.net/68d5295ba44799c71a50ece8_1758800326275_15b164af.webp')`
        }}
      >
        <div className="text-center">
          <img 
            src="https://d64gsuwffb70l.cloudfront.net/68d528d57440d1c92f1cc162_1758800206408_496a24f2.png" 
            alt="Dart AI Logo" 
            className="w-20 h-20 mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-orange-400 bg-clip-text text-transparent">
            DART AI
          </h1>
          <p className="text-gray-300 mt-2">Mine • Play • Collect</p>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-6">
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-2">Total Balance</p>
            <p className="text-4xl font-bold text-green-400">
              {totalBalance.toFixed(2)} <span className="text-xl">DART</span>
            </p>
          </div>
        </div>

        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <div className="text-center mb-6">
            <div className="relative w-32 h-32 mx-auto mb-4">
              <div className={`absolute inset-0 rounded-full border-4 ${isActive ? 'border-green-400 animate-pulse' : 'border-gray-700'}`}>
                <img 
                  src="https://d64gsuwffb70l.cloudfront.net/68d5295ba44799c71a50ece8_1758800330516_1e5a926a.webp"
                  alt="Mining Rig"
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              {isActive && <div className="absolute inset-0 rounded-full border-2 border-green-400 animate-ping"></div>}
            </div>
            
            <h3 className="text-xl font-semibold mb-2">{isActive ? 'Mining Active' : 'Mining Inactive'}</h3>
            {isActive && <div className="text-2xl font-mono text-green-400 mb-4">{formatTime(timeRemaining)}</div>}
          </div>

          {!isActive ? (
            <button onClick={handleStartMining} className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-2">
              <Play size={20} />Start 24h Mining
            </button>
          ) : (
            <button onClick={stopMining} className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-2">
              <Pause size={20} />Stop Mining
            </button>
          )}
        </div>

        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Share2 size={20} className="text-orange-400" />Invite Friends
          </h3>
          <p className="text-gray-400 text-sm mb-4">Share your referral link and gain 5% bonus from friends' activity!</p>
          <button onClick={handleShare} className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 px-6 rounded-xl">
            Share Referral Link
          </button>
        </div>

        <BannerAd className="mt-4" />
      </div>

      <RewardedAdModal open={showAdModal} onClose={() => setShowAdModal(false)} onRewardGranted={handleAdRewardGranted} title="Watch Ad to Start Mining" description="Watch a short video ad to unlock your 24-hour mining session" />
    </div>
  );
};

export default HomeTab;
