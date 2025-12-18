'use client';

import Link from 'next/link';
import { Play, ChevronRight, Gamepad2 } from 'lucide-react';
import type { UserGame } from '@/app/(dashboard)/_actions/games';
import { NowPlayingCarousel } from './NowPlayingCarousel';

interface NowPlayingSectionProps {
  nowPlaying: UserGame[];
  loading: boolean;
  onEditGame: (game: UserGame) => void;
  onDeleteGame: (game: UserGame) => void;
}

export function NowPlayingSection({
  nowPlaying,
  loading,
  onEditGame,
  onDeleteGame,
}: NowPlayingSectionProps) {
  return (
    <section className="relative">
      {/* Section header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <Play className="w-3.5 h-3.5 text-violet-400" fill="currentColor" />
            </div>
            <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider">
              // NOW_PLAYING
            </span>
          </div>
          <span className="px-2 py-0.5 text-[10px] font-mono font-medium tracking-wider text-violet-400/80 bg-violet-500/10 border border-violet-500/20 rounded-full uppercase">
            {nowPlaying.length} active
          </span>
        </div>
        <Link
          href="/library"
          className="group flex items-center gap-1.5 text-[10px] font-mono font-medium text-white/40 hover:text-white/80 transition-colors uppercase tracking-wider"
        >
          <span>View all</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {loading ? (
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-abyss p-16">
          <div className="flex flex-col items-center justify-center">
            <div className="relative">
              <Play className="w-10 h-10 text-violet-400/60 animate-pulse" fill="currentColor" />
              <div className="absolute inset-0 w-10 h-10 border-2 border-violet-400/20 rounded-full animate-ping" />
            </div>
            <span className="mt-4 text-[11px] font-mono text-white/30 uppercase tracking-wider">
              // Loading games...
            </span>
          </div>
        </div>
      ) : nowPlaying.length === 0 ? (
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-abyss p-16">
          {/* HUD corners */}
          <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-violet-400/30" />
          <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-violet-400/30" />
          <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-violet-400/30" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-violet-400/30" />

          <div className="relative flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider mb-4">// NO_ACTIVE_SESSIONS</span>
            <div className="relative w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
              <Gamepad2 className="w-7 h-7 text-violet-400" />
              {/* Mini HUD corners */}
              <div className="absolute -top-1 -left-1 w-2 h-2 border-l border-t border-violet-400/50" />
              <div className="absolute -top-1 -right-1 w-2 h-2 border-r border-t border-violet-400/50" />
              <div className="absolute -bottom-1 -left-1 w-2 h-2 border-l border-b border-violet-400/50" />
              <div className="absolute -bottom-1 -right-1 w-2 h-2 border-r border-b border-violet-400/50" />
            </div>

            <h3 className="text-sm font-bold text-white/60 mb-2 font-[family-name:var(--font-family-display)] uppercase">
              No games in progress
            </h3>
            <p className="text-xs text-white/30 mb-6 max-w-xs">
              Start playing a game from your library to see it here.
            </p>

            <Link
              href="/library"
              className="group relative inline-flex items-center gap-2 px-5 py-2.5 overflow-hidden rounded-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-cyan-600 opacity-90 group-hover:opacity-100 transition-opacity" />
              <span className="relative text-sm font-semibold text-white uppercase tracking-wide font-[family-name:var(--font-family-display)]">Browse Library</span>
            </Link>
          </div>
        </div>
      ) : (
        <NowPlayingCarousel
          games={nowPlaying}
          onEditGame={onEditGame}
          onDeleteGame={onDeleteGame}
        />
      )}
    </section>
  );
}
