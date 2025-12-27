import React from 'react';
import { Coins, TrendingUp, Clock, Pickaxe, Gamepad2, Users, CheckCircle } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';

const WalletTab: React.FC = () => {
  const { transactions, balance, formatDate } = useWallet();

  const balanceCards = [
    { label: 'Mining Coins', amount: balance.mining, color: 'text-green-400', bg: 'bg-green-400/10', icon: Pickaxe },
    { label: 'Game Coins', amount: balance.game, color: 'text-blue-400', bg: 'bg-blue-400/10', icon: Gamepad2 },
    { label: 'Referral Coins', amount: balance.referral, color: 'text-orange-400', bg: 'bg-orange-400/10', icon: Users },
    { label: 'Task Coins', amount: balance.task, color: 'text-purple-400', bg: 'bg-purple-400/10', icon: CheckCircle },
  ];

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'Mining': return <Pickaxe size={20} className="text-green-400" />;
      case 'Game': return <Gamepad2 size={20} className="text-blue-400" />;
      case 'Referral': return <Users size={20} className="text-orange-400" />;
      case 'Task': return <CheckCircle size={20} className="text-purple-400" />;
      default: return <Coins size={20} className="text-yellow-400" />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-950 text-white pb-20">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Wallet</h1>
          <p className="text-gray-400">Track your balance and transactions</p>
        </div>

        {/* Total Balance */}
        <div className="bg-gradient-to-r from-green-600 to-orange-600 rounded-2xl p-6">
          <div className="text-center">
            <p className="text-white/80 text-sm mb-2">Total Balance</p>
            <p className="text-4xl font-bold text-white">
              {balance.total.toFixed(2)} <span className="text-xl">DART</span>
            </p>
            <div className="flex items-center justify-center gap-1 mt-2">
              <TrendingUp size={16} className="text-green-300" />
              <span className="text-sm text-white/80">Active balance</span>
            </div>
          </div>
        </div>

        {/* Balance Breakdown */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Coins size={20} className="text-yellow-400" />
            Balance Breakdown
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {balanceCards.map((card, index) => (
              <div key={index} className={`${card.bg} rounded-xl p-4 border border-gray-800`}>
                <div className="flex items-center gap-2 mb-2">
                  <card.icon size={16} className={card.color} />
                  <p className="text-gray-400 text-xs">{card.label}</p>
                </div>
                <p className={`text-xl font-bold ${card.color}`}>
                  {card.amount.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Transaction History */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock size={20} className="text-blue-400" />
            Transaction History
          </h2>
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <div className="bg-gray-900 rounded-xl p-6 text-center border border-gray-800">
                <p className="text-gray-400">No transactions yet</p>
                <p className="text-sm text-gray-500 mt-1">Start mining or playing games to collect points!</p>
              </div>
            ) : (
              transactions.slice(0, 20).map((transaction) => (
                <div key={transaction.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center">
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div>
                        <p className="font-medium">{transaction.type}</p>
                        <p className="text-sm text-gray-400">{transaction.note}</p>
                        <p className="text-xs text-gray-500">{formatDate(transaction.timestamp)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-400">+{transaction.amount.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">DART</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletTab;
