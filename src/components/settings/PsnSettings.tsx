'use client';

import { useState, useEffect } from 'react';
import {
  Loader2,
  Link as LinkIcon,
  Unlink,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  XCircle,
  Trophy,
  Copy,
  Check,
  ChevronDown
} from 'lucide-react';
import { getPsnProfile, linkPsnAccount, unlinkPsnAccount, syncPsnLibrary } from '@/app/actions/psn';
import { SyncToast } from '@/components/ui/SyncToast';
import { SyncProgressModal } from '@/components/ui/SyncProgressModal';
import { triggerLibraryRefresh } from '@/lib/events/libraryEvents';
import type { PsnProfile, PsnSyncResult } from '@/lib/types/psn';

export default function PsnSettings() {
  const [profile, setProfile] = useState<PsnProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [npssoInput, setNpssoInput] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [syncResult, setSyncResult] = useState<PsnSyncResult | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [showSyncToast, setShowSyncToast] = useState(false);

  const NPSSO_URL = 'https://ca.account.sony.com/api/v1/ssocookie';

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    try {
      const data = await getPsnProfile();
      setProfile(data);
    } catch (err) {
      console.error('Failed to load PSN profile:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleLinkAccount() {
    if (!npssoInput.trim()) {
      setError('Please enter your NPSSO token');
      return;
    }

    setLinking(true);
    setError('');
    setSuccess('');

    try {
      const result = await linkPsnAccount(npssoInput);

      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        setSuccess('PlayStation Network account linked successfully!');
        setNpssoInput('');
        await loadProfile();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link PSN account');
    } finally {
      setLinking(false);
    }
  }

  async function handleUnlinkAccount() {
    if (!confirm('Are you sure you want to unlink your PlayStation Network account? Your games will remain in your library.')) {
      return;
    }

    setUnlinking(true);
    setError('');
    setSuccess('');

    try {
      const result = await unlinkPsnAccount();

      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        setSuccess('PlayStation Network account unlinked successfully');
        setProfile(null);
        setSyncResult(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlink PSN account');
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
      const result = await syncPsnLibrary();
      setSyncResult(result);
      setShowSyncToast(true);
      await loadProfile();
      // Notify other pages to refresh their data
      triggerLibraryRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync PSN library');
    } finally {
      setSyncing(false);
    }
  }

  function copyNpssoUrl() {
    navigator.clipboard.writeText(NPSSO_URL);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600/20 to-blue-700/20 border border-blue-600/30 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-blue-500" fill="currentColor">
            <path d="M8.985 2.596v17.548l3.915 1.261V6.688c0-.69.304-1.151.794-.991.636.181.76.814.76 1.505v5.876c2.441 1.193 4.362-.002 4.362-3.153 0-3.237-1.126-4.675-4.438-5.827-1.307-.448-3.728-1.186-5.391-1.502h-.002zm4.656 16.242l6.296-2.275c.715-.258.826-.625.246-.818-.586-.192-1.637-.139-2.357.123l-4.205 1.5v-2.385l.24-.085s1.201-.42 2.913-.615c1.696-.18 3.792.03 5.437.661 1.848.596 2.063 1.473 1.597 2.085-.466.611-1.635 1.04-1.635 1.04l-8.532 3.047v-2.278zM1.004 18.241c-1.513-.453-1.775-1.396-1.08-1.985.654-.556 1.77-.96 1.77-.96l5.572-1.99v2.316l-4.049 1.446c-.715.257-.826.625-.247.817.587.193 1.637.14 2.358-.12l1.938-.707v2.068c-.127.026-.262.047-.39.07-1.765.286-3.655.078-5.872-.955z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white">PlayStation Network</h3>
          <p className="text-sm text-gray-400">
            Import your library and trophy collection
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
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
          <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start gap-3">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-400">{success}</p>
        </div>
      )}

      {profile ? (
        /* Connected State */
        <div className="space-y-5">
          {/* Profile Card */}
          <div className="flex items-center gap-4 p-4 bg-deep/50 border border-steel/30 rounded-xl">
            {profile.psn_avatar_url ? (
              <img
                src={profile.psn_avatar_url}
                alt={profile.psn_online_id || 'PSN User'}
                className="w-14 h-14 rounded-xl border-2 border-blue-600/50"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl border-2 border-blue-600/50 bg-gradient-to-br from-blue-600/30 to-blue-700/30 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-blue-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-white truncate">
                {profile.psn_online_id || 'PSN User'}
              </h4>
              {profile.psn_trophy_level && (
                <div className="flex items-center gap-1.5 text-sm text-gray-400">
                  <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                  <span>Level {profile.psn_trophy_level}</span>
                </div>
              )}
            </div>
            {profile.psn_last_sync && (
              <p className="text-xs text-gray-500 hidden md:block">
                Synced {new Date(profile.psn_last_sync).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleSyncLibrary}
              disabled={syncing}
              className="flex-1 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                  <div className="text-lg font-bold text-yellow-400">{syncResult.trophiesUpdated}</div>
                  <div className="text-[10px] text-gray-500 uppercase">Trophies</div>
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
          {/* NPSSO Token Instructions Toggle */}
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="w-full p-4 bg-blue-600/10 border border-blue-600/20 rounded-xl flex items-center gap-3 hover:bg-blue-600/15 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-blue-400">?</span>
            </div>
            <span className="text-sm text-blue-400 font-medium flex-1 text-left">
              How to get your NPSSO token
            </span>
            <ChevronDown
              className={`w-4 h-4 text-blue-400 transition-transform ${showInstructions ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Instructions Panel */}
          {showInstructions && (
            <div className="p-5 bg-deep/50 border border-steel/30 rounded-xl space-y-4">
              <h4 className="font-semibold text-white">Getting Your NPSSO Token</h4>

              <ol className="space-y-3 text-sm">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center text-xs font-bold">1</span>
                  <div className="text-gray-400">
                    Go to <strong className="text-white">playstation.com</strong> and sign in
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center text-xs font-bold">2</span>
                  <div className="text-gray-400 flex-1">
                    <span>Visit this URL:</span>
                    <div className="mt-2 flex items-center gap-2">
                      <code className="flex-1 px-3 py-1.5 bg-abyss/80 rounded-lg text-xs text-cyan-400 font-mono truncate">
                        {NPSSO_URL}
                      </code>
                      <button
                        onClick={copyNpssoUrl}
                        className="p-1.5 bg-abyss hover:bg-slate rounded-lg transition-colors flex-shrink-0"
                        title="Copy URL"
                      >
                        {copiedUrl ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center text-xs font-bold">3</span>
                  <span className="text-gray-400">Copy the 64-character token from the response</span>
                </li>
              </ol>

              <a
                href="https://www.playstation.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Open PlayStation.com
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* NPSSO Token Input */}
          <div className="space-y-3">
            <input
              type="password"
              value={npssoInput}
              onChange={(e) => setNpssoInput(e.target.value)}
              placeholder="Paste your NPSSO token here..."
              className="w-full px-4 py-2.5 bg-deep/50 border border-steel/30 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-600/50 focus:ring-2 focus:ring-blue-600/20 transition-all text-sm font-mono"
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Your token is stored securely
              </p>
              <button
                onClick={handleLinkAccount}
                disabled={linking || !npssoInput.trim()}
                className="px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-lg font-semibold text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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

          {/* Token Expiry Notice */}
          <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
            <p className="text-xs text-amber-400/80">
              <strong>Note:</strong> NPSSO tokens expire after ~2 months. Re-authenticate when expired.
            </p>
          </div>
        </div>
      )}

      {/* Sync Progress Modal */}
      <SyncProgressModal
        isOpen={syncing}
        platform="psn"
      />

      {/* Sync Toast */}
      <SyncToast
        isVisible={showSyncToast}
        onClose={() => setShowSyncToast(false)}
        type="psn"
        result={syncResult}
      />
    </div>
  );
}
