'use client';

import { useState, useEffect } from 'react';
import { Loader2, Link as LinkIcon, Unlink, RefreshCw, ExternalLink, CheckCircle, XCircle, Key, HelpCircle } from 'lucide-react';
import { getXboxProfile, linkXboxAccount, unlinkXboxAccount, syncXboxLibrary } from '@/app/actions/xbox';
import { SyncToast } from '@/components/ui/SyncToast';
import { SyncProgressModal } from '@/components/ui/SyncProgressModal';
import { triggerLibraryRefresh } from '@/lib/events/libraryEvents';
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
  const [showHelp, setShowHelp] = useState(false);

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
        setSuccess('Xbox account linked successfully!');
        setApiKeyInput('');
        await loadProfile();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link Xbox account');
    } finally {
      setLinking(false);
    }
  }

  async function handleUnlinkAccount() {
    if (!confirm('Are you sure you want to unlink your Xbox account? Your games will remain in your library.')) {
      return;
    }

    setUnlinking(true);
    setError('');
    setSuccess('');

    try {
      const result = await unlinkXboxAccount();

      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        setSuccess('Xbox account unlinked successfully');
        setProfile(null);
        setSyncResult(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlink Xbox account');
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
      const result = await syncXboxLibrary();
      setSyncResult(result);
      setShowSyncToast(true);
      await loadProfile();
      // Notify other pages to refresh their data
      triggerLibraryRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync Xbox library');
    } finally {
      setSyncing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-green-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 flex items-center justify-center">
          <svg className="w-6 h-6 text-green-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4.102 21.033C6.211 22.881 8.977 24 12 24c3.026 0 5.789-1.119 7.902-2.967 1.877-1.912-4.316-8.709-7.902-11.417-3.582 2.708-9.779 9.505-7.898 11.417zm11.16-14.406c2.5 2.961 7.484 10.313 6.076 12.912C23.056 17.036 24 14.62 24 12c0-5.238-3.354-9.691-8.024-11.33.039.071.076.142.108.219.492 1.161.825 2.426.978 3.738zm-6.532 0c.154-1.312.487-2.577.978-3.738.033-.077.07-.148.108-.219C5.354 2.309 2 6.762 2 12c0 2.62.944 5.036 2.662 6.539-1.408-2.599 3.576-9.951 6.068-12.912z"/>
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white">Xbox</h3>
          <p className="text-sm text-gray-400">
            Import your library, gamerscore, and achievements
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
            {profile.xbox_avatar_url ? (
              <img
                src={profile.xbox_avatar_url}
                alt={profile.xbox_gamertag}
                className="w-14 h-14 rounded-xl border-2 border-green-500/50"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl border-2 border-green-500/50 bg-green-500/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4.102 21.033C6.211 22.881 8.977 24 12 24c3.026 0 5.789-1.119 7.902-2.967 1.877-1.912-4.316-8.709-7.902-11.417-3.582 2.708-9.779 9.505-7.898 11.417zm11.16-14.406c2.5 2.961 7.484 10.313 6.076 12.912C23.056 17.036 24 14.62 24 12c0-5.238-3.354-9.691-8.024-11.33.039.071.076.142.108.219.492 1.161.825 2.426.978 3.738zm-6.532 0c.154-1.312.487-2.577.978-3.738.033-.077.07-.148.108-.219C5.354 2.309 2 6.762 2 12c0 2.62.944 5.036 2.662 6.539-1.408-2.599 3.576-9.951 6.068-12.912z"/>
                </svg>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-white truncate">{profile.xbox_gamertag}</h4>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span className="text-green-400 font-semibold">{profile.xbox_gamerscore?.toLocaleString() || 0}</span>
                <span>Gamerscore</span>
              </div>
            </div>
            {profile.xbox_last_sync && (
              <p className="text-xs text-gray-500 hidden md:block">
                Synced {new Date(profile.xbox_last_sync).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleSyncLibrary}
              disabled={syncing}
              className="flex-1 px-5 py-2.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                  <div className="text-lg font-bold text-green-400">{syncResult.totalGames}</div>
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
          {/* API Key Input */}
          <div className="p-5 bg-deep/50 border border-steel/30 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-white mb-1">Connect with API Key</h4>
                <p className="text-sm text-gray-500">Get your free API key from OpenXBL</p>
              </div>
              <button
                onClick={() => setShowHelp(!showHelp)}
                className="p-2 hover:bg-steel/20 rounded-lg transition-colors"
                title="How to get API key"
              >
                <HelpCircle className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {showHelp && (
              <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-lg space-y-2">
                <p className="text-sm text-gray-300 font-medium">How to get your Xbox API key:</p>
                <ol className="text-sm text-gray-400 space-y-1.5 list-decimal list-inside">
                  <li>Go to <a href="https://xbl.io" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300 transition-colors">xbl.io</a></li>
                  <li>Click "Login" and sign in with your Xbox account</li>
                  <li>Go to "API Console" or "Getting Started"</li>
                  <li>Copy your personal API key</li>
                </ol>
              </div>
            )}

            <div className="space-y-3">
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="Your OpenXBL API key"
                  className="w-full pl-10 pr-4 py-2.5 bg-deep/50 border border-steel/30 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 transition-all text-sm"
                />
              </div>
              <div className="flex items-center justify-between">
                <a
                  href="https://xbl.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1 transition-colors"
                >
                  Get API key at xbl.io
                  <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  onClick={handleLinkAccount}
                  disabled={linking || !apiKeyInput.trim()}
                  className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {linking ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <LinkIcon className="w-4 h-4" />
                      Connect
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
            <p className="text-xs text-amber-400/80">
              <strong>Note:</strong> OpenXBL is a free third-party service. Your API key is stored securely and only used to sync your Xbox data.
            </p>
          </div>
        </div>
      )}

      {/* Sync Progress Modal */}
      <SyncProgressModal
        isOpen={syncing}
        platform="xbox"
      />

      {/* Sync Toast */}
      <SyncToast
        isVisible={showSyncToast}
        onClose={() => setShowSyncToast(false)}
        type="xbox"
        result={syncResult}
      />
    </div>
  );
}
