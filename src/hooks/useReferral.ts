import { useState, useEffect } from 'react';

export const useReferral = () => {
  const [referralCode, setReferralCode] = useState<string>('');
  const [inviterCode, setInviterCode] = useState<string>('');

  useEffect(() => {
    // Generate or load referral code
    let code = localStorage.getItem('referralCode');
    if (!code) {
      code = generateReferralCode();
      localStorage.setItem('referralCode', code);
    }
    setReferralCode(code);

    // Load inviter code if exists
    const inviter = localStorage.getItem('inviterCode');
    if (inviter) {
      setInviterCode(inviter);
    }
  }, []);

  const generateReferralCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const processReferralBonus = (amount: number, type: string) => {
    if (!inviterCode) return;

    const bonus = amount * 0.05; // 5% bonus
    const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    
    transactions.unshift({
      id: Date.now(),
      type: 'Referral',
      amount: bonus,
      timestamp: Date.now(),
      note: `5% bonus from referral ${type} points`
    });
    
    localStorage.setItem('transactions', JSON.stringify(transactions));
  };

  const getReferralLink = (): string => {
    return `https://dartai.app/ref/${referralCode}`;
  };

  const setInviter = (code: string) => {
    if (!inviterCode && code !== referralCode) {
      setInviterCode(code);
      localStorage.setItem('inviterCode', code);
    }
  };

  return {
    referralCode,
    inviterCode,
    processReferralBonus,
    getReferralLink,
    setInviter
  };
};