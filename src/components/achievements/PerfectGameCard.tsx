import Link from 'next/link';
import Image from 'next/image';
import { Crown, Trophy, Gamepad2, Sparkles } from 'lucide-react';
import type { UserGame } from '@/lib/actions/games';

interface PerfectGameCardProps {
  userGame: UserGame;
  totalAchievements: number;
  index: number;
  variant?: 'featured' | 'standard';
}

export function PerfectGameCard({
  userGame,
  totalAchievements,
  index,
  variant = 'standard'
}: PerfectGameCardProps) {
  const game = userGame.game;
  const title = game?.title || 'Unknown Game';
  const coverUrl = game?.cover_url;

  // Featured variant - larger, more prominent display for the top game
  if (variant === 'featured') {
    return (
      <Link href={`/game/${userGame.id}`} className="block">
        <div
          className="group relative overflow-hidden rounded-2xl cursor-pointer"
          style={{ animation: `fadeIn 0.5s ease-out ${index * 0.08}s both` }}
        >
          {/* Golden gradient border */}
          <div className="absolute inset-0 bg-linear-to-br from-amber-400 via-yellow-500 to-amber-600 p-[2px] rounded-2xl">
            <div className="absolute inset-[2px] bg-theme-secondary rounded-2xl" />
          </div>

          {/* Content container */}
          <div className="relative flex items-stretch gap-0 bg-theme-secondary rounded-2xl overflow-hidden">
            {/* Cover image section */}
            <div className="relative w-32 sm:w-40 shrink-0 aspect-3/4">
              {coverUrl ? (
                <Image
                  src={coverUrl}
                  alt={title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  sizes="160px"
                />
              ) : (
                <div className="w-full h-full bg-amber-500/10 flex items-center justify-center">
                  <Gamepad2 className="w-12 h-12 text-amber-400/40" />
                </div>
              )}

              {/* Golden overlay shimmer */}
              <div className="absolute inset-0 bg-linear-to-br from-amber-400/20 via-transparent to-yellow-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Crown badge */}
              <div className="absolute top-2 left-2 w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Crown className="w-4 h-4 text-void" />
              </div>
            </div>

            {/* Info section */}
            <div className="flex-1 p-5 flex flex-col justify-center relative">
              {/* Subtle golden glow */}
              <div className="absolute inset-0 bg-linear-to-r from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-[10px] font-mono text-amber-400 uppercase tracking-wider mb-2">
                  <Sparkles className="w-3 h-3" />
                  Perfected
                </span>

                <h3 className="text-lg font-bold text-theme-primary font-family-display mb-1 group-hover:text-amber-200 transition-colors line-clamp-2">
                  {title}
                </h3>

                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-mono font-bold text-amber-400">
                      {totalAchievements}
                    </span>
                    <span className="text-xs text-theme-muted">
                      achievements
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* HUD corners */}
          <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-amber-400/60 rounded-tl-2xl" />
          <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-amber-400/60 rounded-tr-2xl" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-amber-400/60 rounded-bl-2xl" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-amber-400/60 rounded-br-2xl" />
        </div>
      </Link>
    );
  }

  // Standard variant - compact grid display
  return (
    <Link href={`/game/${userGame.id}`}>
      <div
        className="group relative bg-theme-secondary rounded-xl overflow-hidden cursor-pointer border border-amber-500/20 hover:border-amber-500/40 transition-all duration-300"
        style={{ animation: `fadeIn 0.4s ease-out ${index * 0.05}s both` }}
      >
        {/* Cover with golden overlay */}
        <div className="relative aspect-3/4 overflow-hidden">
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
            />
          ) : (
            <div className="w-full h-full bg-amber-500/10 flex items-center justify-center">
              <Gamepad2 className="w-10 h-10 text-amber-400/40" />
            </div>
          )}

          {/* Golden gradient overlay */}
          <div className="absolute inset-0 bg-linear-to-t from-void via-void/60 to-transparent" />

          {/* Shimmer effect on hover */}
          <div className="absolute inset-0 bg-linear-to-br from-amber-400/10 via-transparent to-yellow-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Crown badge */}
          <div className="absolute top-2 right-2 w-7 h-7 bg-amber-500 rounded-lg flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform">
            <Crown className="w-3.5 h-3.5 text-void" />
          </div>

          {/* Bottom info */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 bg-amber-500/20 backdrop-blur-sm border border-amber-500/30 rounded text-[9px] font-mono text-amber-300 uppercase tracking-wider">
                100%
              </span>
              <div className="flex items-center gap-1">
                <Trophy className="w-3 h-3 text-amber-400" />
                <span className="text-xs font-mono font-bold text-amber-300">
                  {totalAchievements}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="p-3 pt-2 border-t border-amber-500/10">
          <h4 className="text-xs font-medium text-theme-primary truncate group-hover:text-amber-200 transition-colors">
            {title}
          </h4>
        </div>

        {/* HUD corners on hover */}
        <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-amber-400/60 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-amber-400/60 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-amber-400/60 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-amber-400/60 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </Link>
  );
}
