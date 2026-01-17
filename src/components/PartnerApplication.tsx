import React, { useState } from 'react';
import { Crown, Mail, Lock, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Switch } from './ui/switch';
import { Card, CardContent } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { leaderboardService } from '../services/leaderboardService';

interface PartnerApplicationProps {
  status: 'eligible' | 'pending' | 'approved' | 'rejected' | 'not_eligible';
  currentReferrals: number;
  onSubmit: (telegramHandle: string, pitch: string) => void;
}

const PartnerApplication: React.FC<PartnerApplicationProps> = ({ 
  status, 
  currentReferrals, 
  onSubmit 
}) => {
  const [isApplying, setIsApplying] = useState(false);

  const handleToggle = async (checked: boolean) => {
    if (!checked || status === 'pending' || status === 'rejected') return;
    
    if (currentReferrals < 50) {
      alert('You need 50+ referrals to apply for partner status');
      return;
    }

    setIsApplying(true);
    
    // Get username from leaderboard service
    const userProfile = leaderboardService.getUserProfile();
    const username = userProfile?.username || 'Unknown User';
    
    // Auto-submit with username and referral count
    // Using empty string for telegram handle and username+count as pitch
    await onSubmit('', `Username: ${username}, Referrals: ${currentReferrals}`);
    
    setIsApplying(false);
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'pending': return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'rejected': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'not_eligible': return <Lock className="w-5 h-5 text-gray-500" />;
      default: return <Crown className="w-5 h-5 text-green-500" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'pending': return '⏳ Pending Review';
      case 'rejected': return '❌ Application Rejected';
      case 'not_eligible': return `🔒 Need ${50 - currentReferrals} more referrals`;
      default: return '✅ Apply for Partner Status';
    }
  };

  const isToggleEnabled = status === 'eligible' && !isApplying;
  const isToggleChecked = status === 'pending';

  return (
    <Card className="bg-gradient-to-br from-purple-900/30 to-indigo-900/30 border-purple-700">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon()}
              <div>
                <h3 className="text-lg font-bold text-white">Partner Program</h3>
                <p className="text-sm text-gray-400">Enhanced rewards & analytics</p>
              </div>
            </div>
            
            {/* Toggle Switch */}
            <Switch
              checked={isToggleChecked}
              onCheckedChange={handleToggle}
              disabled={!isToggleEnabled}
              className="data-[state=checked]:bg-green-600"
            />
          </div>

          {/* Status Text */}
          <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-800">
            <p className="text-sm text-gray-300 text-center font-medium">
              {getStatusText()}
            </p>
          </div>

          {/* Contact Info */}
          <Alert className="bg-blue-400/10 border-blue-400/30">
            <Mail className="w-4 h-4 text-blue-400" />
            <AlertDescription className="text-blue-300">
              <strong>We'll contact you at:</strong>
              <br />
              <a href="mailto:dartaiofficial2@gmail.com" className="underline hover:text-blue-200">
                dartaiofficial2@gmail.com
              </a>
            </AlertDescription>
          </Alert>

          {/* Benefits Info */}
          <div className="bg-green-400/10 border border-green-400/30 rounded-lg p-4">
            <p className="text-sm text-green-300">
              <strong>Partner Benefits:</strong>
            </p>
            <ul className="text-xs text-green-200 mt-2 space-y-1 ml-4 list-disc">
              <li>100 DART per install (vs 50 DART)</li>
              <li>10% activity bonus (vs 5%)</li>
              <li>Detailed analytics dashboard</li>
              <li>Priority support</li>
            </ul>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Referrals</span>
              <span>{currentReferrals} / 50</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((currentReferrals / 50) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PartnerApplication;
