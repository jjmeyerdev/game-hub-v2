'use client';

import { useState, useEffect } from 'react';
import { Loader2, Link as LinkIcon, Unlink, RefreshCw, ExternalLink, CheckCircle, XCircle } from 'lucide-react';
import { getSteamProfile, linkSteamAccount, unlinkSteamAccount, syncSteamLibrary } from '@/app/actions/steam';
import { SyncToast } from '@/components/ui/SyncToast';
import type { SteamProfile, SteamSyncResult } from '@/lib/types/steam';

export default function SteamSettings() {
  const [profile, setProfile] = useState<SteamProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [steamIdInput, setSteamIdInput] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [syncResult, setSyncResult] = useState<SteamSyncResult | null>(null);
  const [showSyncToast, setShowSyncToast] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    try {
      const data = await getSteamProfile();
      setProfile(data);
    } catch (err) {
      console.error('Failed to load Steam profile:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleLinkAccount() {
    if (!steamIdInput.trim()) {
      setError('Please enter a Steam ID or profile URL');
      return;
    }

    setLinking(true);
    setError('');
    setSuccess('');

    try {
      const result = await linkSteamAccount(steamIdInput);

      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        setSuccess('Steam account linked successfully!');
        setSteamIdInput('');
        await loadProfile();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link Steam account');
    } finally {
      setLinking(false);
    }
  }

  async function handleUnlinkAccount() {
    if (!confirm('Are you sure you want to unlink your Steam account? Your games will remain in your library.')) {
      return;
    }

    setUnlinking(true);
    setError('');
    setSuccess('');

    try {
      const result = await unlinkSteamAccount();

      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        setSuccess('Steam account unlinked successfully');
        setProfile(null);
        setSyncResult(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlink Steam account');
    } finally {
      setUnlinking(false);
    }
  }

  async function handleSyncLibrary() {
    setSyncing(true);
    setError('');
    setSuccess('');
    setSyncResult(null);

    try {
      const result = await syncSteamLibrary();
      setSyncResult(result);
      setShowSyncToast(true);
      await loadProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync Steam library');
    } finally {
      setSyncing(false);
    }
  }

  function handleSteamLogin() {
    window.location.href = '/api/auth/steam';
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 flex items-center justify-center">
          <svg className="w-6 h-6 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12c0 4.99 3.67 9.12 8.44 9.88v-1.92a4.01 4.01 0 01-1.12-7.85l1.3 1.3a2.5 2.5 0 103.76 0l1.3-1.3a4.01 4.01 0 01-1.12 7.85v1.92C18.33 21.12 22 16.99 22 12c0-5.52-4.48-10-10-10zm0 3.5a6.5 6.5 0 016.5 6.5c0 1.12-.29 2.17-.78 3.09l-2.83-2.83a2.5 2.5 0 00-5.78 0L6.28 15.1A6.47 6.47 0 015.5 12 6.5 6.5 0 0112 5.5z"/>
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white">Steam</h3>
          <p className="text-sm text-gray-400">
            Import your library, playtime, and achievements
          </p>
        </div>
        {profile && (
          <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">Connected</span>
          </div>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/50 rounded-xl flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-400">{success}</p>
        </div>
      )}

      {profile ? (
        /* Connected State */
        <div className="space-y-5">
          {/* Profile Card */}
          <div className="flex items-center gap-4 p-4 bg-deep/50 border border-steel/30 rounded-xl">
            <img
              src={profile.steam_avatar_url}
              alt={profile.steam_persona_name}
              className="w-14 h-14 rounded-xl border-2 border-blue-500/50"
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-white truncate">{profile.steam_persona_name}</h4>
              <a
                href={profile.steam_profile_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
              >
                View Profile
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            {profile.steam_last_sync && (
              <p className="text-xs text-gray-500 hidden md:block">
                Synced {new Date(profile.steam_last_sync).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleSyncLibrary}
              disabled={syncing}
              className="flex-1 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {syncing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Sync Library
                </>
              )}
            </button>

            <button
              onClick={handleUnlinkAccount}
              disabled={unlinking}
              className="px-5 py-2.5 bg-deep/50 border border-steel/50 hover:border-red-500/50 hover:bg-red-500/10 rounded-xl font-medium text-gray-400 hover:text-red-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {unlinking ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Unlink className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Disconnect</span>
            </button>
          </div>

          {/* Sync Results */}
          {syncResult && (
            <div className="p-4 bg-deep/30 border border-steel/20 rounded-xl space-y-3">
              <h4 className="text-sm font-semibold text-gray-300">Sync Results</h4>
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center p-2 bg-abyss/50 rounded-lg">
                  <div className="text-lg font-bold text-blue-400">{syncResult.totalGames}</div>
                  <div className="text-[10px] text-gray-500 uppercase">Total</div>
                </div>
                <div className="text-center p-2 bg-abyss/50 rounded-lg">
                  <div className="text-lg font-bold text-emerald-400">{syncResult.gamesAdded}</div>
                  <div className="text-[10px] text-gray-500 uppercase">Added</div>
                </div>
                <div className="text-center p-2 bg-abyss/50 rounded-lg">
                  <div className="text-lg font-bold text-purple-400">{syncResult.gamesUpdated}</div>
                  <div className="text-[10px] text-gray-500 uppercase">Updated</div>
                </div>
                <div className="text-center p-2 bg-abyss/50 rounded-lg">
                  <div className="text-lg font-bold text-yellow-400">{syncResult.achievementsUpdated}</div>
                  <div className="text-[10px] text-gray-500 uppercase">Achievements</div>
                </div>
              </div>

              {syncResult.errors.length > 0 && (
                <div className="pt-2 border-t border-steel/10">
                  <p className="text-xs font-medium text-red-400 mb-1">Errors:</p>
                  <ul className="text-[11px] text-gray-500 space-y-0.5">
                    {syncResult.errors.slice(0, 3).map((err, i) => (
                      <li key={i} className="truncate">• {err}</li>
                    ))}
                    {syncResult.errors.length > 3 && (
                      <li>• +{syncResult.errors.length - 3} more</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Disconnected State */
        <div className="space-y-5">
          {/* Steam Login Button */}
          <div className="p-5 bg-deep/50 border border-steel/30 rounded-xl">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex-1 text-center sm:text-left">
                <h4 className="font-semibold text-white mb-1">Quick Connect</h4>
                <p className="text-sm text-gray-500">Sign in with Steam to link automatically</p>
              </div>
              <button
                onClick={handleSteamLogin}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 rounded-xl font-semibold text-white transition-all flex items-center gap-2"
              >
                <LinkIcon className="w-4 h-4" />
                Sign in with Steam
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-steel/50 to-transparent" />
            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Or manually</span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-steel/50 to-transparent" />
          </div>

          {/* Manual Input */}
          <div className="space-y-3">
            <input
              type="text"
              value={steamIdInput}
              onChange={(e) => setSteamIdInput(e.target.value)}
              placeholder="Steam ID64 or profile URL"
              className="w-full px-4 py-2.5 bg-deep/50 border border-steel/30 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm"
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Find at{' '}
                <a
                  href="https://steamid.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  steamid.io
                </a>
              </p>
              <button
                onClick={handleLinkAccount}
                disabled={linking || !steamIdInput.trim()}
                className="px-4 py-2 bg-deep border border-steel/50 hover:border-blue-500/50 hover:bg-blue-500/10 rounded-lg font-medium text-sm text-gray-300 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {linking ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LinkIcon className="w-4 h-4" />
                )}
                Link
              </button>
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
            <p className="text-xs text-amber-400/80">
              <strong>Note:</strong> Your Steam profile must be public for sync to work.
            </p>
          </div>
        </div>
      )}

      {/* Sync Toast */}
      <SyncToast
        isVisible={showSyncToast}
        onClose={() => setShowSyncToast(false)}
        type="steam"
        result={syncResult}
      />
    </div>
  );
}

