'use client';

import { useState, useEffect } from 'react';
import { Trash2, AlertTriangle, Loader2, Library, RefreshCw, Sparkles } from 'lucide-react';
import { removeSyncedGames, getSyncedGameCounts, enrichAllGamesFromIGDB } from '@/app/actions/games';

interface SyncedCounts {
  steam: number;
  psn: number;
  xbox: number;
  epic: number;
  total: number;
}

export default function LibraryManagement() {
  const [counts, setCounts] = useState<SyncedCounts>({ steam: 0, psn: 0, xbox: 0, epic: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [enriching, setEnriching] = useState(false);

  const loadCounts = async () => {
    setLoading(true);
    const result = await getSyncedGameCounts();
    setCounts(result);
    setLoading(false);
  };

  useEffect(() => {
    loadCounts();
  }, []);

  const handleRemove = async (platform: 'steam' | 'psn' | 'xbox' | 'epic' | 'all') => {
    if (confirmDelete !== platform) {
      setConfirmDelete(platform);
      return;
    }

    setDeleting(platform);
    setMessage(null);

    const result = await removeSyncedGames(platform);

    if (result.error) {
      setMessage({ type: 'error', text: result.error });
    } else {
      const platformLabel = platform === 'all' ? 'all platforms' : platform === 'psn' ? 'PlayStation' : platform === 'epic' ? 'Epic Games' : platform.charAt(0).toUpperCase() + platform.slice(1);
      setMessage({ type: 'success', text: `Removed ${result.deletedCount} games from ${platformLabel}` });
      await loadCounts();
    }

    setDeleting(null);
    setConfirmDelete(null);
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'steam': return 'from-blue-500 to-blue-600';
      case 'psn': return 'from-blue-600 to-blue-700';
      case 'xbox': return 'from-green-500 to-green-600';
      case 'epic': return 'from-gray-500 to-gray-600';
      default: return 'from-red-500 to-red-600';
    }
  };

  const getPlatformBorder = (platform: string) => {
    switch (platform) {
      case 'steam': return 'border-blue-500/30 hover:border-blue-500/50';
      case 'psn': return 'border-blue-600/30 hover:border-blue-600/50';
      case 'xbox': return 'border-green-500/30 hover:border-green-500/50';
      case 'epic': return 'border-gray-500/30 hover:border-gray-500/50';
      default: return 'border-red-500/30 hover:border-red-500/50';
    }
  };

  const handleEnrichFromIGDB = async () => {
    setEnriching(true);
    setMessage(null);

    const result = await enrichAllGamesFromIGDB();

    if (result.error) {
      setMessage({ type: 'error', text: result.error });
    } else {
      setMessage({
        type: 'success',
        text: result.message ?? `Enriched ${result.updated} games from IGDB`
      });
    }

    setEnriching(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Library className="w-5 h-5 text-red-400" />
          <div>
            <h3 className="text-lg font-bold text-white">Library Management</h3>
            <p className="text-sm text-gray-500">Remove synced games from your library</p>
          </div>
        </div>
        <button
          onClick={loadCounts}
          disabled={loading}
          className="p-2 text-gray-400 hover:text-white transition-colors"
          title="Refresh counts"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Enrich from IGDB */}
      <div className="flex items-center justify-between p-4 bg-cyan-500/5 border border-cyan-500/30 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <p className="font-semibold text-white">Enrich Metadata from IGDB</p>
            <p className="text-sm text-gray-500">
              Fetch missing cover art, descriptions, release dates, and more
            </p>
          </div>
        </div>
        <button
          onClick={handleEnrichFromIGDB}
          disabled={enriching}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30"
        >
          {enriching ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Enriching...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Enrich All
            </>
          )}
        </button>
      </div>

      {/* Warning */}
      <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-amber-200 font-medium">Caution</p>
          <p className="text-sm text-amber-200/70">
            Removing synced games will delete them from your library. You can re-sync them anytime from the platform settings above.
          </p>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-xl ${message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
          <p className={`text-sm ${message.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
            {message.text}
          </p>
        </div>
      )}

      {/* Platform Cards */}
      <div className="grid gap-4">
        {/* Steam */}
        <div className={`flex items-center justify-between p-4 bg-abyss/50 border rounded-xl transition-all ${getPlatformBorder('steam')}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#1b2838] flex items-center justify-center">
              <svg className="w-5 h-5 text-[#66c0f4]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0z"/>
              </svg>
            </div>
            <div>
              <p className="font-semibold text-white">Steam</p>
              <p className="text-sm text-gray-500">
                {loading ? 'Loading...' : `${counts.steam} synced games`}
              </p>
            </div>
          </div>
          <button
            onClick={() => handleRemove('steam')}
            disabled={deleting !== null || counts.steam === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              confirmDelete === 'steam'
                ? 'bg-red-500 text-white'
                : 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30'
            }`}
          >
            {deleting === 'steam' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            {confirmDelete === 'steam' ? 'Confirm Remove' : 'Remove All'}
          </button>
        </div>

        {/* PlayStation */}
        <div className={`flex items-center justify-between p-4 bg-abyss/50 border rounded-xl transition-all ${getPlatformBorder('psn')}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#003791] flex items-center justify-center">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8.985 2.596v17.548l3.915 1.261V6.688c0-.69.304-1.151.794-.991.636.181.76.814.76 1.505v5.876c2.441 1.193 4.362-.002 4.362-3.153 0-3.237-1.126-4.675-4.438-5.827-1.307-.448-3.728-1.186-5.391-1.502h-.002zm4.656 16.242l6.296-2.275c.715-.258.826-.625.246-.818-.586-.192-1.637-.139-2.357.123l-4.205 1.5v-2.385l.24-.085s1.201-.42 2.913-.615c1.696-.18 3.792.03 5.437.661 1.848.596 2.063 1.473 1.597 2.085-.466.611-1.635 1.04-1.635 1.04l-8.532 3.047v-2.278zM1.004 18.241c-1.513-.453-1.775-1.396-1.08-1.985.654-.556 1.77-.96 1.77-.96l5.572-1.99v2.316l-4.049 1.446c-.715.257-.826.625-.247.817.587.193 1.637.14 2.358-.12l1.938-.707v2.068c-.127.026-.262.047-.39.07-1.765.286-3.655.078-5.872-.955z"/>
              </svg>
            </div>
            <div>
              <p className="font-semibold text-white">PlayStation</p>
              <p className="text-sm text-gray-500">
                {loading ? 'Loading...' : `${counts.psn} synced games`}
              </p>
            </div>
          </div>
          <button
            onClick={() => handleRemove('psn')}
            disabled={deleting !== null || counts.psn === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              confirmDelete === 'psn'
                ? 'bg-red-500 text-white'
                : 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30'
            }`}
          >
            {deleting === 'psn' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            {confirmDelete === 'psn' ? 'Confirm Remove' : 'Remove All'}
          </button>
        </div>

        {/* Xbox */}
        <div className={`flex items-center justify-between p-4 bg-abyss/50 border rounded-xl transition-all ${getPlatformBorder('xbox')}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#107c10] flex items-center justify-center">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4.102 21.033C6.211 22.881 8.977 24 12 24c3.026 0 5.789-1.119 7.902-2.967 1.877-1.912-4.316-8.709-7.902-11.417-3.582 2.708-9.779 9.505-7.898 11.417zm11.16-14.406c2.5 2.961 7.484 10.313 6.076 12.912C23.056 17.036 24 14.62 24 12c0-5.238-3.354-9.691-8.024-11.33.039.071.076.142.108.219.492 1.161.825 2.426.978 3.738zm-6.532 0c.154-1.312.487-2.577.978-3.738.033-.077.07-.148.108-.219C5.354 2.309 2 6.762 2 12c0 2.62.944 5.036 2.662 6.539-1.408-2.599 3.576-9.951 6.068-12.912z"/>
              </svg>
            </div>
            <div>
              <p className="font-semibold text-white">Xbox</p>
              <p className="text-sm text-gray-500">
                {loading ? 'Loading...' : `${counts.xbox} synced games`}
              </p>
            </div>
          </div>
          <button
            onClick={() => handleRemove('xbox')}
            disabled={deleting !== null || counts.xbox === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              confirmDelete === 'xbox'
                ? 'bg-red-500 text-white'
                : 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30'
            }`}
          >
            {deleting === 'xbox' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            {confirmDelete === 'xbox' ? 'Confirm Remove' : 'Remove All'}
          </button>
        </div>

        {/* Epic Games */}
        <div className={`flex items-center justify-between p-4 bg-abyss/50 border rounded-xl transition-all ${getPlatformBorder('epic')}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center">
              <span className="text-lg font-black text-gray-300">E</span>
            </div>
            <div>
              <p className="font-semibold text-white">Epic Games</p>
              <p className="text-sm text-gray-500">
                {loading ? 'Loading...' : `${counts.epic} synced games`}
              </p>
            </div>
          </div>
          <button
            onClick={() => handleRemove('epic')}
            disabled={deleting !== null || counts.epic === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              confirmDelete === 'epic'
                ? 'bg-red-500 text-white'
                : 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30'
            }`}
          >
            {deleting === 'epic' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            {confirmDelete === 'epic' ? 'Confirm Remove' : 'Remove All'}
          </button>
        </div>

        {/* Remove All */}
        <div className="pt-4 border-t border-steel/30">
          <div className={`flex items-center justify-between p-4 bg-red-500/5 border rounded-xl transition-all ${getPlatformBorder('all')}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="font-semibold text-white">Remove All Synced Games</p>
                <p className="text-sm text-gray-500">
                  {loading ? 'Loading...' : `${counts.total} total synced games across all platforms`}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleRemove('all')}
              disabled={deleting !== null || counts.total === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                confirmDelete === 'all'
                  ? 'bg-red-600 text-white'
                  : 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30'
              }`}
            >
              {deleting === 'all' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              {confirmDelete === 'all' ? 'Confirm Remove All' : 'Remove All'}
            </button>
          </div>
        </div>
      </div>

      {/* Cancel hint */}
      {confirmDelete && (
        <p className="text-xs text-gray-500 text-center">
          Click elsewhere or wait to cancel
        </p>
      )}
    </div>
  );
}
