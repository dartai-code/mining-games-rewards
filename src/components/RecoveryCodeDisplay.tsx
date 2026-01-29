// Display user's recovery code
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Shield, Copy, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { recoveryCodeService } from '@/services/recoveryCodeService';
import { useToast } from '@/hooks/use-toast';

export function RecoveryCodeDisplay() {
  const [code, setCode] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadRecoveryCode();
  }, []);

  const loadRecoveryCode = async () => {
    try {
      const recoveryCode = await recoveryCodeService.getCurrentUserRecoveryCode();
      setCode(recoveryCode);
    } catch (error) {
      console.error('Failed to load recovery code:', error);
      toast({
        title: 'Error',
        description: 'Failed to load recovery code',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Recovery code copied to clipboard'
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Please copy the code manually',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-slate-700 rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-slate-700 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-purple-500/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-400" />
          <CardTitle className="text-white">Account Recovery Code</CardTitle>
        </div>
        <CardDescription className="text-gray-300">
          Save this code to recover your account if you reinstall the app
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-slate-900/50 rounded-lg p-4 border border-purple-500/30">
          <div className="flex items-center justify-between gap-2">
            <div className="font-mono text-2xl font-bold text-purple-300 tracking-wider">
              {revealed ? code : '••••-••••'}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setRevealed(!revealed)}
                className="text-purple-400 hover:text-purple-300"
              >
                {revealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={copyToClipboard}
                disabled={copied}
                className="text-purple-400 hover:text-purple-300"
              >
                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3">
          <p className="text-xs text-yellow-200">
            <strong>Important:</strong> Write down or screenshot this code. You'll need it to restore your account if you uninstall the app.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
