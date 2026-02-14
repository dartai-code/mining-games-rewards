import React, { useState, useEffect } from 'react';
import HomeTab from './HomeTab';
import GamesTab from './GamesTab';
import ReferralsTab from './ReferralsTab';
import TasksTab from './TasksTab';
import WalletTab from './WalletTab';
import LeaderboardTab from './LeaderboardTab';
import ProfileTab from './ProfileTab';
import BottomNavigation from './BottomNavigation';
import UserSetupModal from './UserSetupModal';
import { leaderboardService } from '../services/leaderboardService';

const AppLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [showUserSetup, setShowUserSetup] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userProfile = leaderboardService.getUserProfile();
    
    if (!userProfile) {
      setShowUserSetup(true);
    }
    setIsLoading(false);
  }, []);

  const handleUserSetupComplete = () => {
    setShowUserSetup(false);
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'home': return <HomeTab />;
      case 'games': return <GamesTab />;
      case 'referrals': return <ReferralsTab />;
      case 'tasks': return <TasksTab />;
      case 'wallet': return <WalletTab />;
      case 'leaderboard': return <LeaderboardTab />;
      case 'profile': return <ProfileTab />;
      default: return <HomeTab />;
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gray-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="relative">
      {renderTab()}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      <UserSetupModal open={showUserSetup} onComplete={handleUserSetupComplete} />
    </div>
  );
};

export default AppLayout;
