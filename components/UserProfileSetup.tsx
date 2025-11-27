'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

interface UserProfile {
  username: string | null;
  avatar: string | null;
  isAnonymous: boolean;
  stats: {
    totalBets: number;
    totalWins: number;
    totalLosses: number;
    winRate: number;
  };
}

const AVATAR_OPTIONS = ['🎮', '🎯', '🎲', '🎰', '💎', '🚀', '⚡', '🔥', '🌟', '👑'];

export default function UserProfileSetup() {
  const { publicKey, connected } = useWallet();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🎯');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (connected && publicKey) {
      fetchProfile();
    }
  }, [connected, publicKey]);

  const fetchProfile = async () => {
    if (!publicKey) return;

    try {
      const response = await fetch(`/api/user/profile?wallet=${publicKey.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setUsername(data.username || '');
        setSelectedAvatar(data.avatar || '🎯');
        setIsAnonymous(data.isAnonymous || false);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const saveProfile = async () => {
    if (!publicKey) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          username: username.trim() || null,
          avatar: selectedAvatar,
          isAnonymous,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!connected) return null;

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-4">
      {!isEditing ? (
        // Display Mode
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{profile?.avatar || '🎯'}</div>
            <div>
              <p className="font-semibold">
                {profile?.isAnonymous ? (
                  <span className="text-gray-400">🕶️ Anonymous</span>
                ) : (
                  profile?.username || publicKey?.toString().slice(0, 8) + '...'
                )}
              </p>
              {profile && profile.stats.totalBets > 0 && (
                <p className="text-xs text-gray-400">
                  {profile.stats.totalWins}W / {profile.stats.totalLosses}L 
                  {' '}({profile.stats.winRate.toFixed(0)}% win rate)
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            Edit Profile
          </button>
        </div>
      ) : (
        // Edit Mode
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Username (optional)</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter a cool username"
              maxLength={20}
              className="w-full px-3 py-2 bg-gray-700 rounded text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-2">Choose Avatar</label>
            <div className="flex gap-2 flex-wrap">
              {AVATAR_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setSelectedAvatar(emoji)}
                  className={`text-2xl p-2 rounded transition ${
                    selectedAvatar === emoji
                      ? 'bg-blue-600 scale-110'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="anonymous"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="anonymous" className="text-sm text-gray-300">
              🕶️ Bet anonymously (hide my identity in live feed)
            </label>
          </div>

          <div className="flex gap-2">
            <button
              onClick={saveProfile}
              disabled={isSaving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 py-2 rounded text-sm font-medium disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 bg-gray-700 hover:bg-gray-600 py-2 rounded text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

