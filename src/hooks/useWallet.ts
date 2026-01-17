import { useState, useEffect } from 'react';
import { authService } from '@/services/firebaseAuthService';
import { firebaseStorage, FirebaseTransaction } from '@/services/firebaseStorageService';

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
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load data from Firebase if logged in, otherwise use localStorage
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const userId = authService.getUserId();
      
      if (userId) {
        // User is logged in - load from Firebase
        try {
          const [firebaseTransactions, userData] = await Promise.all([
            firebaseStorage.getUserTransactions(100),
            firebaseStorage.getUserData()
          ]);

          // Convert Firebase transactions to local format
          const localTransactions: Transaction[] = firebaseTransactions.map(tx => ({
            id: parseInt(tx.id.substring(0, 13)) || Date.now(),
            type: tx.type,
            amount: tx.amount,
            timestamp: tx.timestamp?.toMillis() || Date.now(),
            note: tx.note
          }));

          setTransactions(localTransactions);

          // Calculate balance breakdown from transactions
          const newBalance = localTransactions.reduce((acc: WalletBalance, tx: Transaction) => {
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
          
          // Ensure total matches Firebase totalBalance if available
          if (userData?.totalBalance !== undefined) {
            newBalance.total = userData.totalBalance;
          }

          setBalance(newBalance);
        } catch (error) {
          console.error('Error loading Firebase data:', error);
          // Fallback to localStorage on error
          loadFromLocalStorage();
        }
      } else {
        // User not logged in - use localStorage
        loadFromLocalStorage();
      }
      
      setIsLoading(false);
    };

    loadData();
    
    // Set up interval to refresh data periodically (every 30 seconds)
    const interval = setInterval(() => {
      if (authService.getUserId()) {
        setRefreshTrigger(prev => prev + 1);
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [refreshTrigger]);

  const loadFromLocalStorage = () => {
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
  };

  const addTransaction = async (type: Transaction['type'], amount: number, note: string, game?: string) => {
    const userId = authService.getUserId();

    // Save to Firebase if logged in
    if (userId) {
      try {
        await firebaseStorage.addTransaction(type, amount, note, game);
        
        // Reload data from Firebase to stay in sync
        const [firebaseTransactions, userData] = await Promise.all([
          firebaseStorage.getUserTransactions(100),
          firebaseStorage.getUserData()
        ]);

        const localTransactions: Transaction[] = firebaseTransactions.map(tx => ({
          id: parseInt(tx.id.substring(0, 13)) || Date.now(),
          type: tx.type,
          amount: tx.amount,
          timestamp: tx.timestamp?.toMillis() || Date.now(),
          note: tx.note
        }));

        setTransactions(localTransactions);

        // Update balance from Firebase
        const newBalance = localTransactions.reduce((acc: WalletBalance, tx: Transaction) => {
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
        
        // Ensure total matches Firebase totalBalance if available
        if (userData?.totalBalance !== undefined) {
          newBalance.total = userData.totalBalance;
        }

        setBalance(newBalance);
        return;
      } catch (error) {
        console.error('Error saving to Firebase:', error);
        // Fallback to localStorage on error
      }
    }

    // Save to localStorage (fallback or when not logged in)
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
  
  const refreshWallet = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return {
    transactions,
    balance,
    addTransaction,
    formatDate,
    isLoading,
    refreshWallet
  };
};