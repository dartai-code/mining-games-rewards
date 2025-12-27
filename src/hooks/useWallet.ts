import { useState, useEffect } from 'react';

export interface Transaction {
  id: number;
  type: 'Mining' | 'Game' | 'Referral' | 'Task';
  amount: number;
  timestamp: number;
  note: string;
}

export interface WalletBalance {
  mining: number;
  game: number;
  referral: number;
  task: number;
  total: number;
}

export const useWallet = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState<WalletBalance>({
    mining: 0,
    game: 0,
    referral: 0,
    task: 0,
    total: 0
  });

  useEffect(() => {
    // Load transactions from localStorage
    const savedTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    setTransactions(savedTransactions);

    // Calculate balance breakdown
    const newBalance = savedTransactions.reduce((acc: WalletBalance, tx: Transaction) => {
      switch (tx.type) {
        case 'Mining':
          acc.mining += tx.amount;
          break;
        case 'Game':
          acc.game += tx.amount;
          break;
        case 'Referral':
          acc.referral += tx.amount;
          break;
        case 'Task':
          acc.task += tx.amount;
          break;
      }
      acc.total += tx.amount;
      return acc;
    }, { mining: 0, game: 0, referral: 0, task: 0, total: 0 });

    setBalance(newBalance);
  }, []);

  const addTransaction = (type: Transaction['type'], amount: number, note: string) => {
    const newTransaction: Transaction = {
      id: Date.now(),
      type,
      amount,
      timestamp: Date.now(),
      note
    };

    const updatedTransactions = [newTransaction, ...transactions];
    setTransactions(updatedTransactions);
    localStorage.setItem('transactions', JSON.stringify(updatedTransactions));

    // Update balance
    const newBalance = { ...balance };
    switch (type) {
      case 'Mining':
        newBalance.mining += amount;
        break;
      case 'Game':
        newBalance.game += amount;
        break;
      case 'Referral':
        newBalance.referral += amount;
        break;
      case 'Task':
        newBalance.task += amount;
        break;
    }
    newBalance.total += amount;
    setBalance(newBalance);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return {
    transactions,
    balance,
    addTransaction,
    formatDate
  };
};