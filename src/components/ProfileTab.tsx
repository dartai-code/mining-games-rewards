import React, { useState, useEffect } from 'react';
import { User, Globe, Edit2, Save, X } from 'lucide-react';
import { leaderboardService } from '../services/leaderboardService';
import { BannerAd } from './BannerAd';

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

const ProfileTab: React.FC = () => {
  const [profile, setProfile] = useState(leaderboardService.getUserProfile());
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(profile?.username || '');
  const [country, setCountry] = useState(profile?.country || '');
  const [error, setError] = useState('');

  useEffect(() => {
    const currentProfile = leaderboardService.getUserProfile();
    setProfile(currentProfile);
    setUsername(currentProfile?.username || '');
    setCountry(currentProfile?.country || '');
  }, []);

  const getCountryInfo = (code: string) => {
    return COUNTRIES.find(c => c.code === code);
  };

  const handleSave = () => {
    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    if (!country) {
      setError('Please select your country');
      return;
    }

    const updatedProfile = leaderboardService.saveUserProfile(username.trim(), country);
    setProfile(updatedProfile);
    setIsEditing(false);
    setError('');
  };

  const handleCancel = () => {
    setUsername(profile?.username || '');
    setCountry(profile?.country || '');
    setError('');
    setIsEditing(false);
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    setError('');
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCountry(e.target.value);
    setError('');
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!profile) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-950 text-white pb-20">
        <div className="p-6 space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Profile</h1>
            <p className="text-gray-400">No profile found</p>
          </div>
        </div>
      </div>
    );
  }

  const countryInfo = getCountryInfo(profile.country);

  return (
    <div className="flex flex-col min-h-screen bg-gray-950 text-white pb-20">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Profile</h1>
          <p className="text-gray-400">Manage your account information</p>
        </div>

        {/* Profile Card */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 bg-gradient-to-r from-[#4ADE80] to-[#FB923C] rounded-full flex items-center justify-center mb-4">
              <User className="text-white" size={48} />
            </div>
            {!isEditing ? (
              <>
                <h2 className="text-2xl font-bold text-white">{profile.username}</h2>
                <p className="text-gray-400 text-sm mt-1">
                  {countryInfo?.flag} {countryInfo?.name}
                </p>
              </>
            ) : null}
          </div>

          {/* Edit Mode */}
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={handleUsernameChange}
                  placeholder="Enter username"
                  maxLength={15}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-[#4ADE80] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 flex items-center gap-2">
                  <Globe size={14} /> Country
                </label>
                <select
                  value={country}
                  onChange={handleCountryChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-[#4ADE80] focus:outline-none"
                >
                  <option value="">Select country</option>
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                  ))}
                </select>
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  className="flex-1 bg-gradient-to-r from-[#4ADE80] to-[#FB923C] text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
                >
                  <Save size={20} /> Save Changes
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 bg-gray-800 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 border border-gray-700"
                >
                  <X size={20} /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Profile Info */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Member Since</span>
                  <span className="text-white font-medium">{formatDate(profile.createdAt)}</span>
                </div>
              </div>

              {/* Edit Button */}
              <button
                onClick={() => setIsEditing(true)}
                className="w-full bg-gradient-to-r from-[#4ADE80] to-[#FB923C] text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
              >
                <Edit2 size={20} /> Edit Profile
              </button>
            </>
          )}
        </div>

        {/* Banner Ad */}
        <BannerAd className="mt-4" />
      </div>
    </div>
  );
};

export default ProfileTab;
