import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Share2, Zap, Cpu, Activity } from 'lucide-react';
import { useMining } from '../hooks/useMining';
import { useReferral } from '../hooks/useReferral';
import { BannerAd } from './BannerAd';
import { AutomaticAdsModal } from './AutomaticAdsModal';

const HomeTab: React.FC = () => {
  const { isActive, timeRemaining, totalBalance, startMining, stopMining, formatTime } = useMining();
  const { getReferralLink } = useReferral();
  const [showAdModal, setShowAdModal] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<any[]>([]);

  const handleStartMining = () => {
    setShowAdModal(true);
  };

  const handleAdsDismissed = () => {
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

  // Futuristic particle system
  useEffect(() => {
    if (!isActive || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let isAnimating = true;

    // Set canvas size
    const setCanvasSize = () => {
      if (canvas) {
        canvas.width = canvas.offsetWidth || 300;
        canvas.height = canvas.offsetHeight || 300;
      }
    };
    setCanvasSize();

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      life: number;
      maxLife: number;
      color: string;

      constructor() {
        this.x = Math.random() * (canvas.width || 300);
        this.y = (canvas.height || 300) + 10;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = -Math.random() * 2 - 1;
        this.size = Math.random() * 2 + 1;
        this.life = 0;
        this.maxLife = Math.random() * 100 + 100;
        this.color = Math.random() > 0.5 ? '34, 197, 94' : '251, 146, 60';
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life++;
        return this.life < this.maxLife && this.y > -10;
      }

      draw() {
        if (!ctx) return;
        const alpha = 1 - (this.life / this.maxLife);
        ctx.fillStyle = `rgba(${this.color}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const animate = () => {
      if (!isAnimating || !ctx || !canvas) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Add new particles
      if (Math.random() < 0.3 && particlesRef.current.length < 100) {
        particlesRef.current.push(new Particle());
      }

      // Update and draw particles
      particlesRef.current = particlesRef.current.filter(particle => {
        const alive = particle.update();
        if (alive) particle.draw();
        return alive;
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      isAnimating = false;
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      particlesRef.current = [];
    };
  }, [isActive]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-950 text-white pb-20 relative overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(34, 197, 94, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 197, 94, 0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          animation: 'gridScroll 20s linear infinite'
        }} />
      </div>

      {/* Holographic scan lines */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="scanline" />
      </div>

      <div 
        className="relative h-64 bg-cover bg-center flex items-center justify-center overflow-hidden"
        style={{ 
          backgroundImage: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('https://d64gsuwffb70l.cloudfront.net/68d5295ba44799c71a50ece8_1758800326275_15b164af.webp')`
        }}
      >
        {/* Radial glow effect */}
        <div className="absolute inset-0 bg-gradient-radial from-green-500/20 via-transparent to-transparent animate-pulse-slow" />
        
        <div className="text-center relative z-10">
          <div className="relative inline-block">
            <img 
              src="https://d64gsuwffb70l.cloudfront.net/68d528d57440d1c92f1cc162_1758800206408_496a24f2.png" 
              alt="Dart AI Logo" 
              className="w-20 h-20 mx-auto mb-4 animate-float filter drop-shadow-glow"
            />
            <div className="absolute inset-0 bg-green-400 rounded-full blur-xl opacity-30 animate-pulse" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-orange-400 bg-clip-text text-transparent animate-gradient">
            DART AI
          </h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Cpu className="w-4 h-4 text-green-400 animate-spin-slow" />
            <p className="text-gray-300 tracking-widest">Mine • Play • Collect</p>
            <Zap className="w-4 h-4 text-orange-400 animate-pulse" />
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-6 relative z-10">
        {/* Balance card with holographic effect */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-orange-600 rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500" />
          <div className="relative bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-800 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-400/10 rounded-full blur-3xl animate-pulse-slow" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-400/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
            
            <div className="text-center relative z-10">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-green-400 animate-pulse" />
                <p className="text-gray-400 text-sm tracking-wider">TOTAL BALANCE</p>
              </div>
              <div className="relative inline-block">
                <p className="text-5xl font-bold bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent animate-gradient">
                  {totalBalance.toFixed(2)}
                </p>
                <div className="absolute -inset-2 bg-green-400/20 blur-2xl -z-10 animate-pulse" />
              </div>
              <p className="text-xl font-semibold text-gray-400 mt-2 tracking-widest">DART</p>
            </div>
          </div>
        </div>

        {/* Mining rig with advanced effects */}
        <div className="relative group">
          <div className={`absolute inset-0 rounded-2xl blur-xl transition-opacity duration-500 ${
            isActive ? 'bg-gradient-to-r from-green-500 to-emerald-500 opacity-40' : 'opacity-0'
          }`} />
          
          <div className="relative bg-gray-900/90 backdrop-blur-xl rounded-2xl p-6 border border-gray-800 overflow-hidden">
            {/* Particle canvas */}
            {isActive && (
              <canvas 
                ref={canvasRef} 
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ zIndex: 1 }}
              />
            )}

            {/* Energy waves */}
            {isActive && (
              <div className="absolute inset-0 opacity-30">
                <div className="energy-wave" />
                <div className="energy-wave" style={{ animationDelay: '1s' }} />
                <div className="energy-wave" style={{ animationDelay: '2s' }} />
              </div>
            )}
            
            <div className="text-center mb-6 relative z-10">
              <div className="relative w-40 h-40 mx-auto mb-6">
                {/* Rotating rings */}
                {isActive && (
                  <>
                    <div className="absolute inset-0 rounded-full border-2 border-green-400/30 animate-spin-slow" style={{ animationDuration: '8s' }} />
                    <div className="absolute inset-2 rounded-full border-2 border-emerald-400/30 animate-spin-reverse" style={{ animationDuration: '6s' }} />
                    <div className="absolute inset-4 rounded-full border border-orange-400/30 animate-spin-slow" style={{ animationDuration: '10s' }} />
                  </>
                )}
                
                {/* Mining rig image */}
                <div className={`absolute inset-0 rounded-full border-4 transition-all duration-500 ${
                  isActive 
                    ? 'border-green-400 shadow-glow-green animate-pulse-subtle' 
                    : 'border-gray-700'
                } overflow-hidden`}>
                  <img 
                    src="https://d64gsuwffb70l.cloudfront.net/68d5295ba44799c71a50ece8_1758800330516_1e5a926a.webp"
                    alt="Mining Rig"
                    className={`w-full h-full object-cover transition-transform duration-700 ${
                      isActive ? 'scale-110' : 'scale-100'
                    }`}
                  />
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-t from-green-500/30 to-transparent animate-pulse" />
                  )}
                </div>
                
                {/* Pulsing outer rings */}
                {isActive && (
                  <>
                    <div className="absolute inset-0 rounded-full border-2 border-green-400 animate-ping-slow" />
                    <div className="absolute -inset-2 rounded-full border border-emerald-400/50 animate-ping-slower" />
                    <div className="absolute -inset-4 rounded-full bg-green-400/10 animate-pulse" />
                  </>
                )}

                {/* Corner accents */}
                {isActive && (
                  <>
                    <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-green-400 animate-pulse" />
                    <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-green-400 animate-pulse" />
                    <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-green-400 animate-pulse" />
                    <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-green-400 animate-pulse" />
                  </>
                )}
              </div>
              
              <div className="relative">
                <h3 className={`text-2xl font-bold mb-2 transition-all duration-500 ${
                  isActive 
                    ? 'text-green-400 animate-pulse-subtle' 
                    : 'text-gray-400'
                }`}>
                  {isActive ? '⚡ MINING ACTIVE' : '💤 MINING INACTIVE'}
                </h3>
                {isActive && (
                  <div className="relative inline-block">
                    <div className="text-3xl font-mono font-bold bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
                      {formatTime(timeRemaining)}
                    </div>
                    <div className="absolute -inset-2 bg-green-400/20 blur-xl -z-10 animate-pulse" />
                  </div>
                )}
              </div>
            </div>

          {!isActive ? (
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
              <button 
                onClick={handleStartMining} 
                className="relative w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-glow-green overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <Play size={24} className="animate-pulse" />
                <span className="text-lg tracking-wider">START 24H MINING</span>
                <Zap size={20} className="animate-pulse" />
              </button>
            </div>
          ) : (
            <div className="relative group">
              <div className="absolute inset-0 bg-red-600 rounded-xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
              <button 
                onClick={stopMining} 
                className="relative w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transform hover:scale-105 transition-all duration-300 shadow-lg overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <Pause size={24} />
                <span className="text-lg tracking-wider">STOP MINING</span>
              </button>
            </div>
          )}
          </div>
        </div>

        {/* Referral section with futuristic styling */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-pink-600 rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500" />
          <div className="relative bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-800 overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-400/10 rounded-full blur-2xl" />
            
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2 relative z-10">
              <div className="relative">
                <Share2 size={20} className="text-orange-400 animate-pulse" />
                <div className="absolute inset-0 bg-orange-400 blur-md opacity-50" />
              </div>
              <span className="bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">INVITE FRIENDS</span>
            </h3>
            <p className="text-gray-400 text-sm mb-4 relative z-10">Share your referral link and gain 5% bonus from friends' activity!</p>
            
            <div className="relative group/btn">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-pink-500 rounded-xl blur-md opacity-50 group-hover/btn:opacity-75 transition-opacity" />
              <button 
                onClick={handleShare} 
                className="relative w-full bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                <span className="relative tracking-wider">SHARE REFERRAL LINK</span>
              </button>
            </div>
          </div>
        </div>

        <BannerAd className="mt-4" />
      </div>

      <AutomaticAdsModal open={showAdModal} onClose={() => setShowAdModal(false)} onAdsDismissed={handleAdsDismissed} />
    </div>
  );
};

export default HomeTab;
