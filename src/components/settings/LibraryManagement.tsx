'use client';

import { useState, useEffect } from 'react';
import { Trash2, AlertTriangle, Loader2, RefreshCw, Sparkles, ChevronDown, CheckCircle, XCircle } from 'lucide-react';
import { removeSyncedGames, getSyncedGameCounts, enrichAllGamesFromIGDB } from '@/lib/actions/games';

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
  const [showPlatforms, setShowPlatforms] = useState(false);

  const loadCounts = async () => {
    setLoading(true);
    const result = await getSyncedGameCounts();
    setCounts(result);
    setLoading(false);
  };

  useEffect(() => {
    loadCounts();
  }, []);

  useEffect(() => {
    if (confirmDelete) {
      const timer = setTimeout(() => setConfirmDelete(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [confirmDelete]);

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

  const platforms = [
    {
      id: 'steam' as const,
      name: 'Steam',
      count: counts.steam,
      color: 'text-blue-400',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658a3.387 3.387 0 0 1 1.912-.59c.064 0 .128.003.191.006l2.866-4.158v-.058c0-2.495 2.03-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.091 2.921c0 .054.003.108.003.164 0 1.872-1.521 3.393-3.393 3.393-1.703 0-3.113-1.268-3.346-2.913l-4.603-1.905A11.996 11.996 0 0 0 11.979 24c6.627 0 12-5.373 12-12s-5.372-12-12-12z"/>
        </svg>
      ),
    },
    {
      id: 'psn' as const,
      name: 'PlayStation',
      count: counts.psn,
      color: 'text-blue-400',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8.985 2.596v17.548l3.915 1.261V6.688c0-.69.304-1.151.794-.991.636.181.76.814.76 1.505v5.876c2.441 1.193 4.362-.002 4.362-3.153 0-3.237-1.126-4.675-4.438-5.827-1.307-.448-3.728-1.186-5.393-1.502zm4.656 16.242l6.296-2.275c.715-.258.826-.625.246-.818-.586-.192-1.637-.139-2.357.123l-4.205 1.5v-2.385l.24-.085s1.201-.42 2.913-.615c1.696-.18 3.792.03 5.437.661 1.848.596 2.063 1.473 1.597 2.085-.466.611-1.635 1.04-1.635 1.04l-8.532 3.047v-2.278zM1.004 18.241c-1.513-.453-1.775-1.396-1.08-1.985.654-.556 1.77-.96 1.77-.96l5.572-1.99v2.316l-4.049 1.446c-.715.257-.826.625-.247.817.587.193 1.637.14 2.358-.12l1.938-.707v2.068c-.127.026-.262.047-.39.07-1.765.286-3.655.078-5.872-.955z"/>
        </svg>
      ),
    },
    {
      id: 'xbox' as const,
      name: 'Xbox',
      count: counts.xbox,
      color: 'text-green-400',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm0 1.5a6.5 6.5 0 0 1 3.25.87c-.87.87-1.75 1.87-2.5 2.87L8 6l-.75-.76c-.75-1-1.63-2-2.5-2.87A6.5 6.5 0 0 1 8 1.5zM3.37 3.87c.75.75 1.63 1.75 2.38 2.88C4.25 8.5 3 10.75 2.5 12A6.47 6.47 0 0 1 1.5 8c0-1.5.5-3 1.87-4.13zM8 7.5l.75.75c1.12 1.25 2.12 2.75 2.87 4.12a6.45 6.45 0 0 1-7.24 0c.75-1.37 1.75-2.87 2.87-4.12L8 7.5zm4.63-3.63A6.47 6.47 0 0 1 14.5 8c0 1.5-.5 2.87-1.37 4-.5-1.25-1.75-3.5-3.25-5.25.75-1.13 1.63-2.13 2.75-2.88z"/>
        </svg>
      ),
    },
    {
      id: 'epic' as const,
      name: 'Epic',
      count: counts.epic,
      color: 'text-gray-400',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
          <path d="M2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2zm3 4h6v1.5H6.5v2.25H10V9.25H6.5V12H11v1.5H5V4z"/>
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Status Message */}
      {message && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
          message.type === 'success'
            ? 'bg-emerald-500/10 border border-emerald-500/30'
            : 'bg-red-500/10 border border-red-500/30'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          )}
          <p className={`text-xs ${message.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
            {message.text}
          </p>
        </div>
      )}

      {/* IGDB Enrichment - Compact */}
      <div className="flex items-center justify-between gap-3 p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-lg">
        <div className="flex items-center gap-3 min-w-0">
          <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">IGDB Enrichment</p>
            <p className="text-[10px] text-gray-500">Fetch cover art & metadata</p>
          </div>
        </div>
        <button
          onClick={handleEnrichFromIGDB}
          disabled={enriching}
          className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-lg text-xs font-semibold text-cyan-400 transition-all disabled:opacity-50 flex items-center gap-1.5 flex-shrink-0"
        >
          {enriching ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          {enriching ? 'Processing...' : 'Enrich'}
        </button>
      </div>

      {/* Synced Games Summary - Collapsible */}
      <div className="space-y-2">
        <button
          onClick={() => setShowPlatforms(!showPlatforms)}
          className="w-full flex items-center justify-between px-3 py-2 bg-abyss/50 border border-steel/20 rounded-lg text-xs hover:border-steel/40 transition-colors"
        >
          <div className="flex items-center gap-2">
            <RefreshCw className={`w-3 h-3 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-gray-400">
              Synced Games:{' '}
              <span className="text-white font-semibold">{loading ? '...' : counts.total}</span>
            </span>
          </div>
          <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${showPlatforms ? 'rotate-180' : ''}`} />
        </button>

        {/* Platform Breakdown */}
        {showPlatforms && (
          <div className="grid grid-cols-2 gap-2">
            {platforms.map((platform) => (
              <div
                key={platform.id}
                className="flex items-center justify-between px-3 py-2 bg-deep/50 border border-steel/20 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <span className={platform.color}>{platform.icon}</span>
                  <span className={`text-xs font-medium ${platform.color}`}>{platform.name}</span>
                  <span className="text-[10px] text-gray-500">
                    {loading ? '...' : platform.count}
                  </span>
                </div>
                <button
                  onClick={() => handleRemove(platform.id)}
                  disabled={deleting !== null || platform.count === 0}
                  className={`px-2 py-1 rounded text-[10px] font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 ${
                    confirmDelete === platform.id
                      ? 'bg-red-500 text-white'
                      : 'text-red-400 hover:bg-red-500/10'
                  }`}
                >
                  {deleting === platform.id ? (
                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-2.5 h-2.5" />
                  )}
                  {confirmDelete === platform.id ? 'Sure?' : 'Clear'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Danger Zone - Remove All */}
      <div className="pt-3 border-t border-red-500/10">
        <div className="flex items-center justify-between gap-3 p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
          <div className="flex items-center gap-3 min-w-0">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-red-400">Purge All Data</p>
              <p className="text-[10px] text-gray-500">
                {loading ? 'Loading...' : `Remove ${counts.total} synced games`}
              </p>
            </div>
          </div>
          <button
            onClick={() => handleRemove('all')}
            disabled={deleting !== null || counts.total === 0}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 flex-shrink-0 ${
              confirmDelete === 'all'
                ? 'bg-red-500 text-white'
                : 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30'
            }`}
          >
            {deleting === 'all' ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Trash2 className="w-3 h-3" />
            )}
            {confirmDelete === 'all' ? 'Confirm' : 'Purge'}
          </button>
        </div>
      </div>

      {/* Confirm Hint */}
      {confirmDelete && (
        <p className="text-center text-[10px] text-amber-400/70">
          Click again to confirm or wait 5s to cancel
        </p>
      )}
    </div>
  );
}
