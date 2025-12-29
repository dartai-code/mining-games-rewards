import React, { useState } from 'react';
import { Crown, Send, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';

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
  const [telegramHandle, setTelegramHandle] = useState('');
  const [pitch, setPitch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!telegramHandle.trim() || !pitch.trim()) {
      alert('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    await onSubmit(telegramHandle, pitch);
    setIsSubmitting(false);
  };

  // Not Eligible
  if (status === 'not_eligible') {
    return (
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Crown className="w-5 h-5 text-gray-500" />
            Become a Partner
          </h3>
          <p className="text-sm text-gray-400 mt-1">Unlock enhanced rewards and analytics</p>
        </div>
        
        <Alert className="bg-blue-400/10 border-blue-400/30 mb-4">
          <AlertDescription className="text-blue-300">
            <strong>Requirements:</strong> 50+ successful referrals needed to apply.
            <br />
            <span className="text-sm">You currently have <strong>{currentReferrals}</strong> referrals. Keep sharing!</span>
          </AlertDescription>
        </Alert>
        
        <div className="bg-gray-950 rounded-xl p-4 border border-gray-800">
          <h4 className="font-semibold text-white mb-3">Partner Benefits:</h4>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>✨ <strong className="text-green-400">100 DART</strong> per install (vs 50 DART)</li>
            <li>✨ <strong className="text-green-400">10% bonus</strong> from referral activity (vs 5%)</li>
            <li>📊 Advanced analytics and performance tracking</li>
            <li>📋 Detailed referral management tools</li>
            <li>💰 Monthly performance reports</li>
          </ul>
        </div>
      </div>
    );
  }

  // Pending Review
  if (status === 'pending') {
    return (
      <div className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-2xl p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 animate-pulse" />
            Application Under Review
          </h3>
          <p className="text-sm text-white/90 mt-1">Your Partner application is being reviewed</p>
        </div>
        
        <Alert className="bg-yellow-400/10 border-yellow-400/30">
          <AlertDescription className="text-yellow-300">
            <strong>Status: Pending</strong>
            <br />
            We'll review your application and contact you via Telegram within 2-3 business days.
            Please ensure your Telegram is accessible.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Rejected
  if (status === 'rejected') {
    return (
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500" />
            Application Not Approved
          </h3>
        </div>
        
        <Alert className="bg-red-400/10 border-red-400/30">
          <AlertDescription className="text-red-300">
            Your Partner application was not approved at this time. 
            Keep building your referral network and you can reapply in the future.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Eligible to Apply
  return (
    <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Crown className="w-5 h-5 text-yellow-300" />
          Apply to Become a Partner
        </h3>
        <p className="text-sm text-white/90 mt-1">
          🎉 Congratulations! You have {currentReferrals}+ referrals and qualify to apply
        </p>
      </div>
      
      <div className="space-y-4">
        <Alert className="bg-white/10 border-white/20">
          <CheckCircle className="w-4 h-4 text-yellow-300" />
          <AlertDescription className="text-white">
            <strong>Enhanced Rewards:</strong> Get 100 DART per install + 10% bonus after approval!
          </AlertDescription>
        </Alert>


        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Telegram Handle <span className="text-yellow-300">*</span>
            </label>
            <Input
              placeholder="@yourusername"
              value={telegramHandle}
              onChange={(e) => setTelegramHandle(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
            <p className="text-xs text-white/70 mt-1">
              We'll contact you here for the interview
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Why should we approve you? <span className="text-yellow-300">*</span>
            </label>
            <Textarea
              placeholder="Tell us about your marketing approach, audience reach, or why you'd be a great Partner..."
              value={pitch}
              onChange={(e) => setPitch(e.target.value)}
              rows={4}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
            <p className="text-xs text-white/70 mt-1">
              Minimum 50 characters
            </p>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || telegramHandle.length < 2 || pitch.length < 50}
            className="w-full bg-white text-purple-600 hover:bg-white/90 font-semibold"
          >
            {isSubmitting ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Application
              </>
            )}
          </Button>
        </div>

        <div className="bg-white/10 rounded-xl p-4 text-sm text-white/90 border border-white/20">
          <strong className="text-white">Next Steps:</strong>
          <ol className="list-decimal list-inside space-y-1 mt-2">
            <li>Submit your application</li>
            <li>We'll review and contact you on Telegram</li>
            <li>Short interview about your approach</li>
            <li>Get approved and unlock Partner features!</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default PartnerApplication;

