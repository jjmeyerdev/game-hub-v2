'use client';

import { useState, useEffect } from 'react';
import { Loader2, Link as LinkIcon, Unlink, RefreshCw, ExternalLink, CheckCircle, XCircle, ChevronDown } from 'lucide-react';
import { getSteamProfile, linkSteamAccount, unlinkSteamAccount, syncSteamLibrary } from '@/app/_actions/steam';
import { SyncToast } from '@/components/ui/SyncToast';
import { SyncProgressModal } from '@/components/ui/SyncProgressModal';
import { triggerLibraryRefresh } from '@/lib/events/libraryEvents';
import { addSyncLog, notifySyncLogUpdate } from '@/components/settings/SyncLogs';
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
  const [expanded, setExpanded] = useState(false);

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
    if (!confirm('Are you sure you want to unlink your Steam account?')) {
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
        setSuccess('Steam account unlinked');
        setProfile(null);
        setSyncResult(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlink');
    } finally {
      setUnlinking(false);
    }
  }

  async function handleSyncLibrary() {
    setSyncing(true);
    setError('');
    setSyncResult(null);

    const startTime = Date.now();

    try {
      const result = await syncSteamLibrary();
      setSyncResult(result);
      setShowSyncToast(true);
      await loadProfile();
      triggerLibraryRefresh();

      // Store sync log
      addSyncLog({
        service: 'steam',
        success: result.success,
        gamesAdded: result.gamesAdded,
        gamesUpdated: result.gamesUpdated,
        totalGames: result.totalGames,
        errors: result.errors,
        duration: Date.now() - startTime,
        metadata: {
          achievementsUpdated: result.achievementsUpdated,
          gamesSkipped: result.gamesSkipped,
        },
      });
      notifySyncLogUpdate();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync';
      setError(errorMessage);

      // Store failed sync log
      addSyncLog({
        service: 'steam',
        success: false,
        gamesAdded: 0,
        gamesUpdated: 0,
        totalGames: 0,
        errors: [errorMessage],
        duration: Date.now() - startTime,
      });
      notifySyncLogUpdate();
    } finally {
      setSyncing(false);
    }
  }

  function handleSteamLogin() {
    window.location.href = '/api/auth/steam';
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Messages - Compact */}
      {error && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
          <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <p className="text-xs text-emerald-400">{success}</p>
        </div>
      )}

      {profile ? (
        /* Connected State - Compact */
        <div className="space-y-3">
          {/* User Row */}
          <div className="flex items-center gap-3">
            <img
              src={profile.steam_avatar_url}
              alt={profile.steam_persona_name}
              className="w-10 h-10 rounded-lg border border-blue-500/30"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{profile.steam_persona_name}</p>
              <a
                href={profile.steam_profile_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                View Profile <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            {profile.steam_last_sync && (
              <p className="text-[10px] text-gray-500 hidden sm:block">
                {new Date(profile.steam_last_sync).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Action Buttons - Compact Row */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncLibrary}
              disabled={syncing}
              className="flex-1 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-xs font-semibold text-blue-400 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {syncing ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
              {syncing ? 'Syncing...' : 'Sync'}
            </button>
            <button
              onClick={handleUnlinkAccount}
              disabled={unlinking}
              className="px-3 py-1.5 bg-steel/20 hover:bg-red-500/10 border border-steel/30 hover:border-red-500/30 rounded-lg text-xs font-medium text-gray-400 hover:text-red-400 transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              {unlinking ? <Loader2 className="w-3 h-3 animate-spin" /> : <Unlink className="w-3 h-3" />}
              <span className="hidden sm:inline">Unlink</span>
            </button>
          </div>

          {/* Sync Results - Collapsible */}
          {syncResult && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center justify-between px-3 py-2 bg-abyss/50 border border-steel/20 rounded-lg text-xs"
            >
              <span className="text-gray-400">
                <span className="text-emerald-400 font-semibold">+{syncResult.gamesAdded}</span> added,{' '}
                <span className="text-purple-400 font-semibold">{syncResult.gamesUpdated}</span> updated
              </span>
              <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
          )}

          {syncResult && expanded && (
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2 bg-blue-500/5 border border-blue-500/10 rounded">
                <div className="text-sm font-bold text-blue-400">{syncResult.totalGames}</div>
                <div className="text-[9px] text-gray-600 uppercase">Total</div>
              </div>
              <div className="p-2 bg-emerald-500/5 border border-emerald-500/10 rounded">
                <div className="text-sm font-bold text-emerald-400">{syncResult.gamesAdded}</div>
                <div className="text-[9px] text-gray-600 uppercase">Added</div>
              </div>
              <div className="p-2 bg-purple-500/5 border border-purple-500/10 rounded">
                <div className="text-sm font-bold text-purple-400">{syncResult.gamesUpdated}</div>
                <div className="text-[9px] text-gray-600 uppercase">Updated</div>
              </div>
              <div className="p-2 bg-amber-500/5 border border-amber-500/10 rounded">
                <div className="text-sm font-bold text-amber-400">{syncResult.achievementsUpdated}</div>
                <div className="text-[9px] text-gray-600 uppercase">Achieves</div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Disconnected State - Compact */
        <div className="space-y-3">
          {/* Quick Connect Button */}
          <button
            onClick={handleSteamLogin}
            className="w-full px-3 py-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 border border-blue-500/30 rounded-lg text-xs font-semibold text-blue-400 transition-all flex items-center justify-center gap-2"
          >
            <LinkIcon className="w-3 h-3" />
            Sign in with Steam
          </button>

          {/* Manual Link - Expandable */}
          <details className="group">
            <summary className="text-[10px] text-gray-500 cursor-pointer hover:text-gray-400 list-none flex items-center gap-1">
              <ChevronDown className="w-3 h-3 group-open:rotate-180 transition-transform" />
              Or link manually with Steam ID
            </summary>
            <div className="mt-2 space-y-2">
              <input
                type="text"
                value={steamIdInput}
                onChange={(e) => setSteamIdInput(e.target.value)}
                placeholder="Steam ID64 or profile URL"
                className="w-full px-3 py-1.5 bg-deep/50 border border-steel/30 rounded-lg text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50"
              />
              <div className="flex items-center justify-between">
                <a
                  href="https://steamid.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-blue-400 hover:text-blue-300"
                >
                  Find your ID →
                </a>
                <button
                  onClick={handleLinkAccount}
                  disabled={linking || !steamIdInput.trim()}
                  className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded text-[10px] font-semibold text-blue-400 disabled:opacity-50 flex items-center gap-1"
                >
                  {linking && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                  Link
                </button>
              </div>
            </div>
          </details>

          <p className="text-[10px] text-amber-400/60">
            Note: Steam profile must be public
          </p>
        </div>
      )}

      <SyncProgressModal isOpen={syncing} platform="steam" />
      <SyncToast
        isVisible={showSyncToast}
        onClose={() => setShowSyncToast(false)}
        type="steam"
        result={syncResult}
      />
    </div>
  );
}
