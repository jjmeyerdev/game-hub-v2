import Link from 'next/link';
import Image from 'next/image';
import { Gamepad2, ArrowRight, EyeOff } from 'lucide-react';
import type { UserGame } from '@/lib/actions/games';

interface AlmostCompleteCardProps {
  userGame: UserGame;
  percentage: number;
  remaining: number;
  index: number;
}

export function AlmostCompleteCard({ userGame, percentage, remaining, index }: AlmostCompleteCardProps) {
  const game = userGame.game;
  const title = game?.title || 'Unknown Game';
  const coverUrl = game?.cover_url;
  const isAdult = userGame.tags?.includes('adult') ?? false;

  return (
    <Link href={`/game/${userGame.id}`}>
      <div
        className="group relative bg-theme-secondary border border-violet-500/20 rounded-xl p-4 hover:border-violet-500/40 transition-all duration-300 overflow-hidden cursor-pointer"
        style={{ animation: `fadeIn 0.4s ease-out ${index * 0.05}s both` }}
      >
        {/* HUD corners */}
        <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-violet-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-violet-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-violet-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-violet-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Subtle background glow */}
        <div className="absolute inset-0 bg-violet-500/3 opacity-0 group-hover:opacity-100 transition-opacity" />

        <div className="relative flex items-center gap-4">
          {/* Cover */}
          <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-theme group-hover:border-violet-400/30 transition-colors">
            {coverUrl ? (
              <Image
                src={coverUrl}
                alt={title}
                fill
                className={`object-cover ${isAdult ? 'blur-xl scale-110 brightness-[0.2]' : ''}`}
                sizes="56px"
              />
            ) : (
              <div className="w-full h-full bg-theme-hover flex items-center justify-center">
                <Gamepad2 className="w-6 h-6 text-theme-subtle" />
              </div>
            )}
            {isAdult && (
              <div className="absolute inset-0 flex items-center justify-center bg-theme-primary/60">
                <EyeOff className="w-5 h-5 text-theme-subtle" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-theme-primary truncate text-sm group-hover:text-violet-300 transition-colors">
              {title}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg font-bold font-mono text-violet-400">
                {percentage}%
              </span>
              <span className="text-xs text-theme-subtle">
                {remaining} left
              </span>
            </div>
          </div>

          {/* Arrow */}
          <ArrowRight className="w-4 h-4 text-violet-400/50 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </Link>
  );
}
