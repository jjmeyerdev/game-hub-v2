'use client';

import { Plus, Zap, RefreshCw } from 'lucide-react';

interface DashboardHeaderProps {
  userName: string;
  greeting: string;
  onAddGame: () => void;
  steamConnected?: boolean;
  steamLastSync?: string | null;
  onSteamSync?: () => void;
  steamSyncing?: boolean;
  onUpdateSteamCovers?: () => void;
  updatingSteamCovers?: boolean;
  psnConnected?: boolean;
  psnLastSync?: string | null;
  onPsnSync?: () => void;
  psnSyncing?: boolean;
}

export function DashboardHeader({
  userName,
  greeting,
  onAddGame,
  steamConnected,
  steamLastSync,
  onSteamSync,
  steamSyncing,
  onUpdateSteamCovers,
  updatingSteamCovers,
  psnConnected,
  psnLastSync,
  onPsnSync,
  psnSyncing,
}: DashboardHeaderProps) {
  return (
    <header className="bg-abyss/80 backdrop-blur-xl border-b border-steel px-8 py-6 sticky top-0 z-40 overflow-hidden">
      {/* Animated scan line effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute h-px w-full bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"
          style={{
            animation: 'scanline 3s linear infinite',
            top: '0',
          }}
        />
      </div>

      <div className="flex items-center justify-between w-full relative">
        {/* Left: Greeting Section */}
        <div className="flex-1">
          {/* Dashboard label with cyber styling */}
          <div className="flex items-center gap-3 mb-2">
            <h1
              className="text-sm font-bold tracking-[0.2em] uppercase text-cyan-400/60"
              style={{ fontFamily: 'var(--font-rajdhani)' }}
            >
              ▸ Dashboard
            </h1>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-400/80 tracking-wide">
                ONLINE
              </span>
            </div>
          </div>

          {/* Dynamic greeting with holographic effect */}
          <div className="flex items-baseline gap-2">
            <span
              className="text-lg text-gray-400 font-medium"
              style={{ fontFamily: 'var(--font-rajdhani)' }}
            >
              {greeting},
            </span>
            <div className="relative group">
              <h2
                className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent animate-shimmer"
                style={{
                  fontFamily: 'var(--font-rajdhani)',
                  backgroundSize: '200% auto',
                }}
              >
                {userName}
              </h2>
              {/* Holographic glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-purple-400/20 blur-xl opacity-50 group-hover:opacity-70 transition-opacity -z-10" />
            </div>
          </div>
        </div>

        {/* Right: Action buttons */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onAddGame}
            className="px-4 py-2 bg-deep hover:bg-slate border border-steel rounded-lg text-sm font-semibold transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Game</span>
          </button>

          {steamConnected && onUpdateSteamCovers && (
            <button
              onClick={onUpdateSteamCovers}
              disabled={updatingSteamCovers}
              title="Update all Steam games with missing info from IGDB (covers, descriptions, developers, etc.)"
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-bold rounded-lg text-sm transition-all flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updatingSteamCovers ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              <span>{updatingSteamCovers ? 'Updating...' : 'Update Game Info'}</span>
            </button>
          )}
          
          {steamConnected && onSteamSync && (
            <button
              onClick={onSteamSync}
              disabled={steamSyncing}
              title={steamLastSync ? `Last synced: ${new Date(steamLastSync).toLocaleString()}` : 'Sync Steam library'}
              className="px-4 py-2 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white font-bold rounded-lg text-sm transition-all flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {steamSyncing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              )}
              <span>{steamSyncing ? 'Syncing...' : 'Sync Steam'}</span>
            </button>
          )}

          {psnConnected && onPsnSync && (
            <button
              onClick={onPsnSync}
              disabled={psnSyncing}
              title={psnLastSync ? `Last synced: ${new Date(psnLastSync).toLocaleString()}` : 'Sync PSN library'}
              className="px-4 py-2 bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white font-bold rounded-lg text-sm transition-all flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {psnSyncing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                  <path d="M8.985 2.596v17.548l3.915 1.261V6.688c0-.69.304-1.151.794-.991.636.181.76.814.76 1.505v5.876c2.441 1.193 4.362-.002 4.362-3.153 0-3.237-1.126-4.675-4.438-5.827-1.307-.448-3.728-1.186-5.391-1.502h-.002zm4.656 16.242l6.296-2.275c.715-.258.826-.625.246-.818-.586-.192-1.637-.139-2.357.123l-4.205 1.5v-2.385l.24-.085s1.201-.42 2.913-.615c1.696-.18 3.792.03 5.437.661 1.848.596 2.063 1.473 1.597 2.085-.466.611-1.635 1.04-1.635 1.04l-8.532 3.047v-2.278zM1.004 18.241c-1.513-.453-1.775-1.396-1.08-1.985.654-.556 1.77-.96 1.77-.96l5.572-1.99v2.316l-4.049 1.446c-.715.257-.826.625-.247.817.587.193 1.637.14 2.358-.12l1.938-.707v2.068c-.127.026-.262.047-.39.07-1.765.286-3.655.078-5.872-.955z" />
                </svg>
              )}
              <span>{psnSyncing ? 'Syncing...' : 'Sync PSN'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
