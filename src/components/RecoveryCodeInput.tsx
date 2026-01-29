// Input recovery code to restore account
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Shield, Loader2 } from 'lucide-react';
import { recoveryCodeService } from '@/services/recoveryCodeService';
import { useToast } from '@/hooks/use-toast';

interface RecoveryCodeInputProps {
  open: boolean;
  onClose: () => void;
  onRecoverySuccess: () => void;
}

export function RecoveryCodeInput({ open, onClose, onRecoverySuccess }: RecoveryCodeInputProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleRestore = async () => {
    if (!code || code.length < 8) {
      toast({
        title: 'Invalid Code',
        description: 'Please enter a valid 8-character recovery code',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const success = await recoveryCodeService.restoreAccountWithCode(code);
      
      if (!success) {
        toast({
          title: 'Invalid Code',
          description: 'Recovery code not found. Please check and try again.',
          variant: 'destructive'
        });
        setLoading(false);
        return;
      }

      toast({
        title: 'Code Verified!',
        description: 'Restoring your account... Please wait.',
      });

      // Wait a moment then trigger recovery success
      setTimeout(() => {
        onClose();
        onRecoverySuccess();
      }, 1000);
      
    } catch (error: any) {
      console.error('Recovery failed:', error);
      toast({
        title: 'Recovery Failed',
        description: error.message || 'Failed to restore account. Please try again.',
        variant: 'destructive'
      });
      setLoading(false);
    }
  };

  const formatCode = (value: string) => {
    // Remove non-alphanumeric characters
    let cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    // Add dash after 4 characters
    if (cleaned.length > 4) {
      cleaned = cleaned.slice(0, 4) + '-' + cleaned.slice(4, 8);
    }
    
    return cleaned;
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCode(e.target.value);
    setCode(formatted);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-6 h-6 text-purple-400" />
            <DialogTitle className="text-white">Restore Account</DialogTitle>
          </div>
          <DialogDescription className="text-gray-400">
            Enter your 8-character recovery code to restore your account and all your progress.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm text-gray-300">Recovery Code</label>
            <Input
              type="text"
              placeholder="XXXX-XXXX"
              value={code}
              onChange={handleCodeChange}
              maxLength={9}
              className="bg-slate-800 border-slate-600 text-white font-mono text-lg text-center tracking-widest"
              disabled={loading}
            />
            <p className="text-xs text-gray-500">Format: XXXX-XXXX (8 characters)</p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleRestore}
              disabled={loading || code.length < 9}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Restoring...
                </>
              ) : (
                'Restore Account'
              )}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              disabled={loading}
              className="border-slate-600 text-white hover:bg-slate-800"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
