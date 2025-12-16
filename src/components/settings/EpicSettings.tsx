'use client';

import { useState, useEffect } from 'react';
import { Loader2, Link as LinkIcon, Unlink, RefreshCw, ExternalLink, CheckCircle, XCircle, ChevronDown } from 'lucide-react';
import { getEpicProfile, linkEpicAccount, unlinkEpicAccount, syncEpicLibrary } from '@/app/_actions/epic';
import { SyncToast } from '@/components/ui/SyncToast';
import { SyncProgressModal } from '@/components/ui/SyncProgressModal';
import { triggerLibraryRefresh } from '@/lib/events/libraryEvents';
import { addSyncLog, notifySyncLogUpdate } from '@/components/settings/SyncLogs';
import type { EpicProfile, EpicSyncResult } from '@/lib/types/epic';

export default function EpicSettings() {
  const [profile, setProfile] = useState<EpicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [authCodeInput, setAuthCodeInput] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [syncResult, setSyncResult] = useState<EpicSyncResult | null>(null);
  const [showSyncToast, setShowSyncToast] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showAuthInput, setShowAuthInput] = useState(false);

  const EPIC_AUTH_URL = 'https://www.epicgames.com/id/api/redirect?clientId=34a02cf8f4414e29b15921876da36f9a&responseType=code';

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    try {
      const data = await getEpicProfile();
      setProfile(data);
    } catch (err) {
      console.error('Failed to load Epic profile:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleLinkAccount() {
    if (!authCodeInput.trim()) {
      setError('Please enter the authorization code');
      return;
    }

    setLinking(true);
    setError('');
    setSuccess('');

    try {
      const result = await linkEpicAccount(authCodeInput);

      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        setSuccess('Epic Games account linked!');
        setAuthCodeInput('');
        setShowAuthInput(false);
        await loadProfile();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link');
    } finally {
      setLinking(false);
    }
  }

  async function handleUnlinkAccount() {
    if (!confirm('Are you sure you want to unlink your Epic Games account?')) {
      return;
    }

    setUnlinking(true);
    setError('');

    try {
      const result = await unlinkEpicAccount();

      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        setSuccess('Epic Games account unlinked');
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
      const result = await syncEpicLibrary();
      setSyncResult(result);
      setShowSyncToast(true);
      await loadProfile();
      triggerLibraryRefresh();

      // Store sync log
      addSyncLog({
        service: 'epic',
        success: result.success,
        gamesAdded: result.gamesAdded,
        gamesUpdated: result.gamesUpdated,
        totalGames: result.totalGames,
        errors: result.errors,
        duration: Date.now() - startTime,
      });
      notifySyncLogUpdate();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync';
      setError(errorMessage);

      // Store failed sync log
      addSyncLog({
        service: 'epic',
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

  function handleOpenAuthUrl() {
    window.open(EPIC_AUTH_URL, '_blank', 'noopener,noreferrer');
    setShowAuthInput(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Messages */}
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
        /* Connected State */
        <div className="space-y-3">
          {/* User Row */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg border border-gray-500/30 bg-gray-700/50 flex items-center justify-center">
              <span className="text-lg font-bold text-gray-400">
                {profile.epic_display_name?.charAt(0).toUpperCase() || 'E'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{profile.epic_display_name}</p>
              <p className="text-[10px] text-gray-500">Epic Games Account</p>
            </div>
            {profile.epic_last_sync && (
              <p className="text-[10px] text-gray-500 hidden sm:block">
                {new Date(profile.epic_last_sync).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncLibrary}
              disabled={syncing}
              className="flex-1 px-3 py-1.5 bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/30 rounded-lg text-xs font-semibold text-gray-400 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
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
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-gray-500/5 border border-gray-500/10 rounded">
                <div className="text-sm font-bold text-gray-400">{syncResult.totalGames}</div>
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
            </div>
          )}
        </div>
      ) : (
        /* Disconnected State */
        <div className="space-y-3">
          {/* Sign in Button */}
          <button
            onClick={handleOpenAuthUrl}
            className="w-full px-3 py-2 bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/30 rounded-lg text-xs font-semibold text-gray-300 transition-all flex items-center justify-center gap-2"
          >
            <LinkIcon className="w-3 h-3" />
            Sign in with Epic Games
            <ExternalLink className="w-2.5 h-2.5" />
          </button>

          {/* Auth Code Input - Shows after clicking sign in */}
          {showAuthInput && (
            <div className="space-y-2 p-3 bg-deep/50 border border-steel/20 rounded-lg">
              <p className="text-[10px] text-gray-400">
                After signing in, paste the <code className="text-gray-300 bg-steel/30 px-1 rounded">authorizationCode</code> from the JSON response:
              </p>
              <input
                type="text"
                value={authCodeInput}
                onChange={(e) => setAuthCodeInput(e.target.value)}
                placeholder="Paste authorization code..."
                className="w-full px-3 py-1.5 bg-deep/50 border border-steel/30 rounded-lg text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-gray-500/50 font-mono"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleLinkAccount}
                  disabled={linking || !authCodeInput.trim()}
                  className="px-3 py-1 bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/30 rounded text-[10px] font-semibold text-gray-300 disabled:opacity-50 flex items-center gap-1"
                >
                  {linking && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                  Link Account
                </button>
              </div>
            </div>
          )}

          <p className="text-[10px] text-amber-400/60">
            Epic doesn&apos;t provide playtime or achievements
          </p>
        </div>
      )}

      <SyncProgressModal isOpen={syncing} platform="epic" />
      <SyncToast isVisible={showSyncToast} onClose={() => setShowSyncToast(false)} type="epic" result={syncResult} />
    </div>
  );
}
