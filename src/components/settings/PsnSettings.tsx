'use client';

import { useState, useEffect } from 'react';
import { Loader2, Link as LinkIcon, Unlink, RefreshCw, CheckCircle, XCircle, Trophy, Copy, Check, ChevronDown } from 'lucide-react';
import { getPsnProfile, linkPsnAccount, unlinkPsnAccount, syncPsnLibrary } from '@/lib/actions/psn';
import { SyncToast } from '@/components/ui/SyncToast';
import { SyncProgressModal } from '@/components/ui/SyncProgressModal';
import { triggerLibraryRefresh } from '@/lib/events/libraryEvents';
import { addSyncLog, notifySyncLogUpdate } from '@/components/settings/SyncLogs';
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
  const [showSyncToast, setShowSyncToast] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [expanded, setExpanded] = useState(false);

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
        setSuccess('PSN account linked!');
        setNpssoInput('');
        await loadProfile();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link');
    } finally {
      setLinking(false);
    }
  }

  async function handleUnlinkAccount() {
    if (!confirm('Are you sure you want to unlink your PSN account?')) {
      return;
    }

    setUnlinking(true);
    setError('');

    try {
      const result = await unlinkPsnAccount();

      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        setSuccess('PSN account unlinked');
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
      const result = await syncPsnLibrary();
      setSyncResult(result);
      setShowSyncToast(true);
      await loadProfile();
      triggerLibraryRefresh();

      // Store sync log
      addSyncLog({
        service: 'psn',
        success: result.success,
        gamesAdded: result.gamesAdded,
        gamesUpdated: result.gamesUpdated,
        totalGames: result.totalGames,
        errors: result.errors,
        duration: Date.now() - startTime,
        metadata: {
          trophiesUpdated: result.trophiesUpdated,
        },
      });
      notifySyncLogUpdate();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync';
      setError(errorMessage);

      // Store failed sync log
      addSyncLog({
        service: 'psn',
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

  function copyNpssoUrl() {
    navigator.clipboard.writeText(NPSSO_URL);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
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
            {profile.psn_avatar_url ? (
              <img src={profile.psn_avatar_url} alt={profile.psn_online_id || 'PSN'} className="w-10 h-10 rounded-lg border border-blue-600/30" />
            ) : (
              <div className="w-10 h-10 rounded-lg border border-blue-600/30 bg-blue-600/10 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-blue-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{profile.psn_online_id || 'PSN User'}</p>
              {profile.psn_trophy_level && (
                <div className="flex items-center gap-1 text-[10px] text-gray-400">
                  <Trophy className="w-2.5 h-2.5 text-yellow-500" />
                  Level {profile.psn_trophy_level}
                </div>
              )}
            </div>
            {profile.psn_last_sync && (
              <p className="text-[10px] text-gray-500 hidden sm:block">
                {new Date(profile.psn_last_sync).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncLibrary}
              disabled={syncing}
              className="flex-1 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/30 rounded-lg text-xs font-semibold text-blue-400 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
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

          {/* Sync Results */}
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
                <div className="text-sm font-bold text-amber-400">{syncResult.trophiesUpdated}</div>
                <div className="text-[9px] text-gray-600 uppercase">Trophies</div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Disconnected State */
        <div className="space-y-3">
          {/* Token Input */}
          <div className="space-y-2">
            <input
              type="password"
              value={npssoInput}
              onChange={(e) => setNpssoInput(e.target.value)}
              placeholder="Paste NPSSO token..."
              className="w-full px-3 py-1.5 bg-deep/50 border border-steel/30 rounded-lg text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-600/50 font-mono"
            />
            <div className="flex items-center justify-between">
              <button
                onClick={copyNpssoUrl}
                className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                {copiedUrl ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                {copiedUrl ? 'Copied!' : 'Copy token URL'}
              </button>
              <button
                onClick={handleLinkAccount}
                disabled={linking || !npssoInput.trim()}
                className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/30 rounded text-[10px] font-semibold text-blue-400 disabled:opacity-50 flex items-center gap-1"
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
              How to get your NPSSO token
            </summary>
            <ol className="mt-2 text-[10px] text-gray-500 space-y-1 pl-4 list-decimal">
              <li>Sign in at playstation.com</li>
              <li>Visit the token URL (click Copy above)</li>
              <li>Copy the 64-char token from the response</li>
            </ol>
          </details>

          <p className="text-[10px] text-amber-400/60">
            Tokens expire after ~2 months
          </p>
        </div>
      )}

      <SyncProgressModal isOpen={syncing} platform="psn" />
      <SyncToast isVisible={showSyncToast} onClose={() => setShowSyncToast(false)} type="psn" result={syncResult} />
    </div>
  );
}
