'use client';

import { useState, useEffect } from 'react';
import { Loader2, Unlink, RefreshCw, ExternalLink, CheckCircle, XCircle, ChevronDown } from 'lucide-react';
import { getXboxProfile, linkXboxAccount, unlinkXboxAccount, syncXboxLibrary } from '@/app/(dashboard)/_actions/xbox';
import { SyncToast } from '@/components/ui/SyncToast';
import { SyncProgressModal } from '@/components/ui/SyncProgressModal';
import { triggerLibraryRefresh } from '@/lib/events/libraryEvents';
import { addSyncLog, notifySyncLogUpdate } from '@/components/settings/SyncLogs';
import type { XboxDbProfile, XboxSyncResult } from '@/lib/types/xbox';

export default function XboxSettings() {
  const [profile, setProfile] = useState<XboxDbProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [syncResult, setSyncResult] = useState<XboxSyncResult | null>(null);
  const [showSyncToast, setShowSyncToast] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    try {
      const data = await getXboxProfile();
      setProfile(data);
    } catch (err) {
      console.error('Failed to load Xbox profile:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleLinkAccount() {
    if (!apiKeyInput.trim()) {
      setError('Please enter your OpenXBL API key');
      return;
    }

    setLinking(true);
    setError('');
    setSuccess('');

    try {
      const result = await linkXboxAccount(apiKeyInput);

      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        setSuccess('Xbox account linked!');
        setApiKeyInput('');
        await loadProfile();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link');
    } finally {
      setLinking(false);
    }
  }

  async function handleUnlinkAccount() {
    if (!confirm('Are you sure you want to unlink your Xbox account?')) {
      return;
    }

    setUnlinking(true);
    setError('');

    try {
      const result = await unlinkXboxAccount();

      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        setSuccess('Xbox account unlinked');
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
      const result = await syncXboxLibrary();
      setSyncResult(result);
      setShowSyncToast(true);
      await loadProfile();
      triggerLibraryRefresh();

      // Store sync log
      addSyncLog({
        service: 'xbox',
        success: result.success,
        gamesAdded: result.gamesAdded,
        gamesUpdated: result.gamesUpdated,
        totalGames: result.totalGames,
        errors: result.errors,
        duration: Date.now() - startTime,
        metadata: {
          achievementsUpdated: result.achievementsUpdated,
        },
      });
      notifySyncLogUpdate();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync';
      setError(errorMessage);

      // Store failed sync log
      addSyncLog({
        service: 'xbox',
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-5 h-5 text-green-400 animate-spin" />
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
            {profile.xbox_avatar_url ? (
              <img
                src={profile.xbox_avatar_url}
                alt={profile.xbox_gamertag}
                className="w-10 h-10 rounded-lg border border-green-500/30"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg border border-green-500/30 bg-green-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4.102 21.033C6.211 22.881 8.977 24 12 24c3.026 0 5.789-1.119 7.902-2.967 1.877-1.912-4.316-8.709-7.902-11.417-3.582 2.708-9.779 9.505-7.898 11.417zm11.16-14.406c2.5 2.961 7.484 10.313 6.076 12.912C23.056 17.036 24 14.62 24 12c0-5.238-3.354-9.691-8.024-11.33.039.071.076.142.108.219.492 1.161.825 2.426.978 3.738zm-6.532 0c.154-1.312.487-2.577.978-3.738.033-.077.07-.148.108-.219C5.354 2.309 2 6.762 2 12c0 2.62.944 5.036 2.662 6.539-1.408-2.599 3.576-9.951 6.068-12.912z"/>
                </svg>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{profile.xbox_gamertag}</p>
              <div className="flex items-center gap-1 text-[10px] text-gray-400">
                <span className="text-green-400 font-semibold">{profile.xbox_gamerscore?.toLocaleString() || 0}</span>
                <span>Gamerscore</span>
              </div>
            </div>
            {profile.xbox_last_sync && (
              <p className="text-[10px] text-gray-500 hidden sm:block">
                {new Date(profile.xbox_last_sync).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncLibrary}
              disabled={syncing}
              className="flex-1 px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg text-xs font-semibold text-green-400 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
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
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2 bg-green-500/5 border border-green-500/10 rounded">
                <div className="text-sm font-bold text-green-400">{syncResult.totalGames}</div>
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
        /* Disconnected State */
        <div className="space-y-3">
          {/* API Key Input */}
          <div className="space-y-2">
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="Your OpenXBL API key..."
              className="w-full px-3 py-1.5 bg-deep/50 border border-steel/30 rounded-lg text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-green-500/50 font-mono"
            />
            <div className="flex items-center justify-between">
              <a
                href="https://xbl.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-green-400 hover:text-green-300 flex items-center gap-1"
              >
                Get API key at xbl.io
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
              <button
                onClick={handleLinkAccount}
                disabled={linking || !apiKeyInput.trim()}
                className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded text-[10px] font-semibold text-green-400 disabled:opacity-50 flex items-center gap-1"
              >
                {linking && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                Connect
              </button>
            </div>
          </div>

          {/* Instructions */}
          <details className="group">
            <summary className="text-[10px] text-gray-500 cursor-pointer hover:text-gray-400 list-none flex items-center gap-1">
              <ChevronDown className="w-3 h-3 group-open:rotate-180 transition-transform" />
              How to get your API key
            </summary>
            <ol className="mt-2 text-[10px] text-gray-500 space-y-1 pl-4 list-decimal">
              <li>Go to xbl.io and click "Login"</li>
              <li>Sign in with your Xbox account</li>
              <li>Go to "API Console" or "Getting Started"</li>
              <li>Copy your personal API key</li>
            </ol>
          </details>

          <p className="text-[10px] text-amber-400/60">
            OpenXBL is a free third-party service
          </p>
        </div>
      )}

      <SyncProgressModal isOpen={syncing} platform="xbox" />
      <SyncToast isVisible={showSyncToast} onClose={() => setShowSyncToast(false)} type="xbox" result={syncResult} />
    </div>
  );
}
