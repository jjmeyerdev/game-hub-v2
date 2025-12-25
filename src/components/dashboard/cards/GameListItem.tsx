import { Library, Edit3, Trash2, Trophy, Clock, BarChart3, Gamepad2, Calendar } from 'lucide-react';
import type { UserGame } from '@/lib/actions/games';

interface GameListItemProps {
  game: UserGame;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  unplayed: 'UNPLAYED',
  backlog: 'BACKLOG',
  playing: 'NOW PLAYING',
  played: 'PLAYED',
  completed: 'COMPLETED',
  finished: 'FINISHED',
  on_hold: 'ON HOLD',
  paused: 'PAUSED',
  dropped: 'DROPPED',
  plan_to_play: 'PLANNED',
};

const STATUS_COLORS: Record<string, string> = {
  unplayed: 'text-gray-400',
  backlog: 'text-gray-400',
  playing: 'text-emerald-400',
  played: 'text-purple-400',
  completed: 'text-cyan-400',
  finished: 'text-amber-400',
  on_hold: 'text-rose-400',
  paused: 'text-yellow-400',
  dropped: 'text-red-400',
  plan_to_play: 'text-blue-400',
};

export function GameListItem({ game, index, onEdit, onDelete }: GameListItemProps) {
  const isCompleted = game.status === 'completed' || game.status === 'finished';

  return (
    <div
      className="group relative"
      style={{
        animation: `fadeInUp 0.4s ease-out ${index * 0.03}s both`,
      }}
    >
      {/* Main container with cyber border effect */}
      <div className="relative bg-linear-to-r from-theme-secondary via-theme-secondary to-theme-secondary border-2 border-theme rounded-xl overflow-hidden transition-all duration-300 hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(0,217,255,0.15)]">
        {/* Animated scan line effect on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className="absolute inset-0 bg-linear-to-b from-transparent via-cyan-500/5 to-transparent animate-scan" />
        </div>

        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-cyan-500/20 group-hover:border-cyan-500/60 transition-colors duration-300" />
        <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-purple-500/20 group-hover:border-purple-500/60 transition-colors duration-300" />

        <div className="relative flex items-center gap-6 p-5">
          {/* Cover art */}
          <div className="relative shrink-0">
            <div className="w-24 h-32 rounded-lg overflow-hidden border-2 border-theme group-hover:border-cyan-500/50 transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(0,217,255,0.2)]">
              {game.game?.cover_url ? (
                <>
                  <img
                    src={game.game.cover_url}
                    alt={game.game.title || 'Game cover'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                      if (placeholder) placeholder.style.display = 'flex';
                    }}
                  />
                  <div className="absolute inset-0 bg-linear-to-br from-theme-secondary via-theme-secondary to-theme-secondary hidden items-center justify-center">
                    <Library className="w-8 h-8 text-theme-subtle" />
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 bg-linear-to-br from-theme-secondary via-theme-secondary to-theme-secondary flex items-center justify-center">
                  <Library className="w-8 h-8 text-theme-subtle" />
                </div>
              )}
            </div>

            {/* Completion trophy badge */}
            {isCompleted && (
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-linear-to-br from-emerald-400 to-cyan-400 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/50 animate-pulse">
                <Trophy className="w-4 h-4 text-bg-primary" />
              </div>
            )}
          </div>

          {/* Main info section */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Title and platform row */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-2xl font-bold text-theme-primary group-hover:text-cyan-400 transition-colors duration-300 line-clamp-1 mb-1">
                  {game.game?.title || 'Untitled'}
                </h3>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-theme-secondary border border-theme rounded-md text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    <Gamepad2 className="w-3 h-3" />
                    {game.platform}
                  </span>
                  <span className={`text-sm font-bold uppercase tracking-wider ${STATUS_COLORS[game.status] || 'text-gray-400'}`}>
                    {STATUS_LABELS[game.status] || game.status}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  className="p-2 bg-linear-to-br from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 rounded-lg text-bg-primary transition-all hover:scale-110 shadow-lg hover:shadow-cyan-500/50"
                  title="Edit game"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="p-2 bg-linear-to-br from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 rounded-lg text-theme-primary transition-all hover:scale-110 shadow-lg hover:shadow-red-500/50"
                  title="Delete game"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-4">
              {/* Completion percentage */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-theme-muted uppercase tracking-wider">
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Progress</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-cyan-400">
                      {game.completion_percentage}
                    </span>
                    <span className="text-sm text-theme-muted">%</span>
                  </div>
                  <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-cyan-500 via-purple-500 to-cyan-400 rounded-full transition-all duration-500"
                      style={{ width: `${game.completion_percentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Playtime */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-theme-muted uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Playtime</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-purple-400">
                    {Math.round(game.playtime_hours)}
                  </span>
                  <span className="text-sm text-theme-muted">hours</span>
                </div>
              </div>

              {/* Date added */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-theme-muted uppercase tracking-wider">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Added</span>
                </div>
                <div className="text-sm text-theme-muted">
                  {new Date(game.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
              </div>
            </div>

            {/* Notes preview (if exists) */}
            {game.notes && (
              <div className="pt-2 border-t border-theme">
                <p className="text-sm text-theme-muted line-clamp-1 italic">
                  &ldquo;{game.notes}&rdquo;
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom border accent */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-cyan-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
    </div>
  );
}
