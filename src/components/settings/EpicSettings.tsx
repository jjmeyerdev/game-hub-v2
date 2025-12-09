'use client';

import { useState, useEffect } from 'react';
import { Loader2, Link as LinkIcon, Unlink, RefreshCw, ExternalLink, CheckCircle, XCircle, Copy, Info } from 'lucide-react';
import { getEpicProfile, linkEpicAccount, unlinkEpicAccount, syncEpicLibrary } from '@/app/actions/epic';
import { SyncToast } from '@/components/ui/SyncToast';
import { SyncProgressModal } from '@/components/ui/SyncProgressModal';
import { triggerLibraryRefresh } from '@/lib/events/libraryEvents';
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
  const [showInstructions, setShowInstructions] = useState(false);

  // Epic authorization URL
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
        setSuccess('Epic Games account linked successfully!');
        setAuthCodeInput('');
        setShowInstructions(false);
        await loadProfile();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link Epic Games account');
    } finally {
      setLinking(false);
    }
  }

  async function handleUnlinkAccount() {
    if (!confirm('Are you sure you want to unlink your Epic Games account? Your games will remain in your library.')) {
      return;
    }

    setUnlinking(true);
    setError('');
    setSuccess('');

    try {
      const result = await unlinkEpicAccount();

      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        setSuccess('Epic Games account unlinked successfully');
        setProfile(null);
        setSyncResult(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlink Epic Games account');
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
      const result = await syncEpicLibrary();
      setSyncResult(result);
      setShowSyncToast(true);
      await loadProfile();
      // Notify other pages to refresh their data
      triggerLibraryRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync Epic Games library');
    } finally {
      setSyncing(false);
    }
  }

  function handleOpenAuthUrl() {
    window.open(EPIC_AUTH_URL, '_blank', 'noopener,noreferrer');
    setShowInstructions(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-600/20 to-gray-700/20 border border-gray-500/30 flex items-center justify-center">
          <span className="text-xl font-black text-gray-400">E</span>
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white">Epic Games</h3>
          <p className="text-sm text-gray-400">
            Import your library from Epic Games Store
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
            <div className="w-14 h-14 rounded-xl border-2 border-gray-500/50 bg-gray-700/50 flex items-center justify-center">
              <span className="text-2xl font-bold text-gray-400">
                {profile.epic_display_name?.charAt(0).toUpperCase() || 'E'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-white truncate">{profile.epic_display_name}</h4>
              <p className="text-sm text-gray-500">Epic Games Account</p>
            </div>
            {profile.epic_last_sync && (
              <p className="text-xs text-gray-500 hidden md:block">
                Synced {new Date(profile.epic_last_sync).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleSyncLibrary}
              disabled={syncing}
              className="flex-1 px-5 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2 bg-abyss/50 rounded-lg">
                  <div className="text-lg font-bold text-gray-400">{syncResult.totalGames}</div>
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
          {/* Link Instructions */}
          <div className="p-5 bg-deep/50 border border-steel/30 rounded-xl">
            <div className="flex flex-col gap-4">
              <div className="text-center sm:text-left">
                <h4 className="font-semibold text-white mb-1">Connect Epic Games</h4>
                <p className="text-sm text-gray-500">
                  Link your Epic Games account to import your library
                </p>
              </div>

              <button
                onClick={handleOpenAuthUrl}
                className="px-5 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2"
              >
                <LinkIcon className="w-4 h-4" />
                Sign in with Epic Games
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Instructions Panel */}
          {showInstructions && (
            <div className="p-5 bg-blue-500/5 border border-blue-500/20 rounded-xl space-y-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-white mb-2">Complete the connection</h4>
                  <ol className="text-sm text-gray-400 space-y-2 list-decimal list-inside">
                    <li>Sign in to your Epic Games account in the new window</li>
                    <li>After signing in, you&apos;ll see a JSON response with <code className="text-blue-400 bg-blue-500/10 px-1 rounded">authorizationCode</code></li>
                    <li>Copy the code value and paste it below</li>
                  </ol>
                </div>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  value={authCodeInput}
                  onChange={(e) => setAuthCodeInput(e.target.value)}
                  placeholder="Paste authorization code here"
                  className="w-full px-4 py-2.5 bg-deep/50 border border-steel/30 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm font-mono"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleLinkAccount}
                    disabled={linking || !authCodeInput.trim()}
                    className="px-5 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 rounded-lg font-medium text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {linking ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <LinkIcon className="w-4 h-4" />
                    )}
                    Link Account
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Info Notice */}
          <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
            <p className="text-xs text-amber-400/80">
              <strong>Note:</strong> Epic Games doesn&apos;t provide playtime or achievement data through their API. Only your game library will be synced.
            </p>
          </div>
        </div>
      )}

      {/* Sync Progress Modal */}
      <SyncProgressModal
        isOpen={syncing}
        platform="epic"
      />

      {/* Sync Toast */}
      <SyncToast
        isVisible={showSyncToast}
        onClose={() => setShowSyncToast(false)}
        type="epic"
        result={syncResult}
      />
    </div>
  );
}
