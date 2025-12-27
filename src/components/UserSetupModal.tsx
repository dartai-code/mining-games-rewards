import React, { useState, useEffect } from 'react';
import { User, Globe, Check, Loader2 } from 'lucide-react';
import { leaderboardService } from '../services/leaderboardService';

interface Props {
  open: boolean;
  onComplete: () => void;
}

const COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
];

const UserSetupModal: React.FC<Props> = ({ open, onComplete }) => {
  const [username, setUsername] = useState('');
  const [country, setCountry] = useState('');
  const [detecting, setDetecting] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setDetecting(true);
      fetch('https://ipapi.co/json/')
        .then(res => res.json())
        .then(data => {
          const found = COUNTRIES.find(c => c.code === data.country_code);
          if (found) setCountry(found.code);
          setDetecting(false);
        })
        .catch(() => setDetecting(false));
    }
  }, [open]);

  const handleSubmit = () => {
    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    if (!country) {
      setError('Please select your country');
      return;
    }
    leaderboardService.saveUserProfile(username.trim(), country);
    onComplete();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full border border-gray-700">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-[#4ADE80] to-[#FB923C] rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="text-white" size={32} />
          </div>
          <h2 className="text-xl font-bold text-white">Create Your Profile</h2>
          <p className="text-gray-400 text-sm mt-1">Set up to join the leaderboard</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(''); }}
              placeholder="Enter username"
              maxLength={15}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-[#4ADE80] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 flex items-center gap-2">
              <Globe size={14} /> Country {detecting && <Loader2 size={14} className="animate-spin" />}
            </label>
            <select
              value={country}
              onChange={(e) => { setCountry(e.target.value); setError(''); }}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-[#4ADE80] focus:outline-none"
            >
              <option value="">Select country</option>
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
              ))}
            </select>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            onClick={handleSubmit}
            className="w-full bg-gradient-to-r from-[#4ADE80] to-[#FB923C] text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
          >
            <Check size={20} /> Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserSetupModal;
