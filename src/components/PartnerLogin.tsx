import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

interface PartnerLoginProps {
  open: boolean;
  onSuccess: () => void;
  onCancel: () => void;
  correctPassword: string;
}

const PartnerLogin: React.FC<PartnerLoginProps> = ({ open, onSuccess, onCancel, correctPassword }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === correctPassword) {
      setError('');
      setPassword('');
      setAttempts(0);
      onSuccess();
    } else {
      setAttempts(prev => prev + 1);
      setError(`Incorrect password. ${attempts >= 2 ? 'Contact admin if you forgot your password.' : `${3 - attempts - 1} attempts remaining.`}`);
      setPassword('');
      
      if (attempts >= 2) {
        setTimeout(() => {
          setAttempts(0);
          setError('');
          onCancel();
        }, 3000);
      }
    }
  };

  const handleCancel = () => {
    setPassword('');
    setError('');
    setAttempts(0);
    onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-800" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-white text-xl flex items-center gap-2">
            <Lock className="w-5 h-5 text-purple-400" />
            Partner Dashboard Access
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Enter your partner password to continue
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Password</label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="bg-gray-950 border-gray-800 text-white pr-10"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <Alert className="bg-red-400/10 border-red-400/30">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <AlertDescription className="text-red-400">
                {error}
              </AlertDescription>
            </Alert>
          )}


          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              onClick={handleCancel}
              variant="outline"
              className="flex-1 border-gray-800 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!password}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Lock className="w-4 h-4 mr-2" />
              Login
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Password is provided by admin when you're approved as a partner
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PartnerLogin;
