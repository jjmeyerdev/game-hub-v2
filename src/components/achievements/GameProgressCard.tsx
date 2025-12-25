import Link from 'next/link';
import Image from 'next/image';
import { Gamepad2 } from 'lucide-react';
import type { UserGame } from '@/lib/actions/games';

interface GameProgressCardProps {
  userGame: UserGame;
  percentage: number;
  index: number;
}

export function GameProgressCard({ userGame, percentage, index }: GameProgressCardProps) {
  const game = userGame.game;
  const title = game?.title || 'Unknown Game';
  const coverUrl = game?.cover_url;
  const earned = userGame.achievements_earned || 0;
  const total = userGame.achievements_total || 0;

  return (
    <Link href={`/game/${userGame.id}`}>
      <div
        className="group relative bg-theme-secondary border border-theme rounded-xl overflow-hidden hover:border-cyan-400/30 transition-all duration-300 cursor-pointer"
        style={{ animation: `fadeIn 0.4s ease-out ${index * 0.03}s both` }}
      >
        {/* Cover */}
        <div className="relative aspect-3/4 overflow-hidden">
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
            />
          ) : (
            <div className="w-full h-full bg-theme-hover flex items-center justify-center">
              <Gamepad2 className="w-10 h-10 text-theme-subtle" />
            </div>
          )}

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-linear-to-t from-void via-transparent to-transparent" />

          {/* Progress overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-bold font-mono text-white">
                {percentage}%
              </span>
              <span className="text-[10px] font-mono text-theme-muted">
                {earned}/{total}
              </span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-400 rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="p-3 pt-2">
          <h4 className="text-xs font-medium text-theme-primary truncate group-hover:text-white transition-colors">
            {title}
          </h4>
        </div>

        {/* HUD corners on hover */}
        <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-cyan-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-cyan-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-cyan-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-cyan-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </Link>
  );
}
