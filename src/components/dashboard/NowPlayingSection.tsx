'use client';

import Link from 'next/link';
import { Crosshair, ChevronRight, Gamepad2, Target } from 'lucide-react';
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
            <Crosshair className="w-4 h-4 text-purple-400" />
            <h2 className="text-xs font-bold tracking-[0.25em] uppercase text-purple-400/70">
              Active Missions
            </h2>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-purple-500/30 to-transparent w-24" />
          <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider text-purple-400/60 bg-purple-500/10 border border-purple-500/20 rounded">
            {nowPlaying.length} ACTIVE
          </span>
        </div>
        <Link
          href="/library"
          className="group flex items-center gap-1.5 text-xs font-bold tracking-wider text-gray-500 hover:text-cyan-400 transition-colors"
        >
          <span>VIEW ALL</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {loading ? (
        <div className="relative overflow-hidden rounded-lg border border-steel bg-deep/50 p-12">
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-12 h-12 mb-4">
              <div className="absolute inset-0 border-2 border-cyan-500/30 rounded-full animate-spin" style={{ borderTopColor: 'transparent' }} />
              <div className="absolute inset-2 border-2 border-purple-500/30 rounded-full animate-spin" style={{ borderBottomColor: 'transparent', animationDirection: 'reverse' }} />
            </div>
            <span className="text-xs font-bold tracking-[0.2em] text-gray-500 uppercase">
              Loading missions...
            </span>
          </div>
        </div>
      ) : nowPlaying.length === 0 ? (
        <div className="relative overflow-hidden rounded-lg border border-dashed border-steel/60 bg-gradient-to-br from-deep/80 to-void p-12">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-[0.02]" style={{
            backgroundImage: `
              linear-gradient(rgba(139, 92, 246, 0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(139, 92, 246, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: '30px 30px'
          }} />

          <div className="relative flex flex-col items-center justify-center text-center">
            <div className="relative mb-4">
              <div className="w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <Gamepad2 className="w-8 h-8 text-purple-500/40" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-void border border-purple-500/30 flex items-center justify-center">
                <Target className="w-3 h-3 text-purple-400" />
              </div>
            </div>

            <h3 className="text-sm font-bold tracking-wider text-gray-400 uppercase mb-1">
              No Active Missions
            </h3>
            <p className="text-xs text-gray-600 mb-6 max-w-xs">
              Your gaming queue is empty. Deploy a new mission from your arsenal.
            </p>

            <Link
              href="/library"
              className="group relative overflow-hidden px-5 py-2.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 hover:border-purple-500/60 rounded transition-all duration-300"
            >
              <span className="relative text-xs font-bold tracking-[0.15em] text-purple-300 uppercase">
                Open Arsenal
              </span>
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
