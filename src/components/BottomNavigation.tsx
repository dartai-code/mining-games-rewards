import React from 'react';
import { Home, Gamepad2, CheckSquare, Wallet, Trophy, Users } from 'lucide-react';

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'games', icon: Gamepad2, label: 'Games' },
    { id: 'referrals', icon: Users, label: 'Referrals' },
    { id: 'tasks', icon: CheckSquare, label: 'Tasks' },
    { id: 'wallet', icon: Wallet, label: 'Wallet' },
    { id: 'leaderboard', icon: Trophy, label: 'Leaders' },
  ];


  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 z-50">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive 
                  ? 'text-green-400' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-green-400' : ''} />
              <span className="text-xs mt-1 font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;