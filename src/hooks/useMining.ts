import { useState, useEffect, useCallback } from 'react';

interface MiningSession {
  isActive: boolean;
  startTime: number;
  endTime: number;
  totalCollected: number;
}

interface MiningHook {
  isActive: boolean;
  timeRemaining: number;
  totalBalance: number;
  startMining: () => void;
  stopMining: () => void;
  formatTime: (seconds: number) => string;
}

const MINING_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const HOURLY_RATE = 0.5; // Darts per hour

export const useMining = (): MiningHook => {
  const [session, setSession] = useState<MiningSession>(() => {
    const saved = localStorage.getItem('miningSession');
    return saved ? JSON.parse(saved) : {
      isActive: false,
      startTime: 0,
      endTime: 0,
      totalCollected: 0
    };
  });

  const [timeRemaining, setTimeRemaining] = useState(0);
  const [totalBalance, setTotalBalance] = useState(() => {
    return parseFloat(localStorage.getItem('totalBalance') || '0');
  });

  const updateTimeRemaining = useCallback(() => {
    if (!session.isActive) {
      setTimeRemaining(0);
      return;
    }

    const now = Date.now();
    const remaining = Math.max(0, session.endTime - now);
    setTimeRemaining(Math.floor(remaining / 1000));

    if (remaining <= 0 && session.isActive) {
      // Mining session completed
      const collected = (MINING_DURATION / (60 * 60 * 1000)) * HOURLY_RATE;
      const newBalance = totalBalance + collected;
      
      setTotalBalance(newBalance);
      localStorage.setItem('totalBalance', newBalance.toString());
      
      const completedSession = { ...session, isActive: false, totalCollected: collected };
      setSession(completedSession);
      localStorage.setItem('miningSession', JSON.stringify(completedSession));
      
      // Add transaction record
      const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
      transactions.unshift({
        id: Date.now(),
        type: 'Mining',
        amount: collected,
        timestamp: now,
        note: '24-hour mining session completed'
      });
      localStorage.setItem('transactions', JSON.stringify(transactions));
    }
  }, [session, totalBalance]);

  useEffect(() => {
    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, [updateTimeRemaining]);

  const startMining = useCallback(() => {
    const now = Date.now();
    const newSession: MiningSession = {
      isActive: true,
      startTime: now,
      endTime: now + MINING_DURATION,
      totalCollected: 0
    };
    
    setSession(newSession);
    localStorage.setItem('miningSession', JSON.stringify(newSession));
  }, []);

  const stopMining = useCallback(() => {
    const stoppedSession = { ...session, isActive: false };
    setSession(stoppedSession);
    localStorage.setItem('miningSession', JSON.stringify(stoppedSession));
  }, [session]);

  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    isActive: session.isActive,
    timeRemaining,
    totalBalance,
    startMining,
    stopMining,
    formatTime
  };
};