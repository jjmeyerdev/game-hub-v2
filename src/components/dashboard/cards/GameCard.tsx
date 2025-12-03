import { Library, Edit3, Trash2, Trophy } from 'lucide-react';
import type { UserGame } from '@/app/actions/games';

interface GameCardProps {
  game: UserGame;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}

export function GameCard({ game, index, onEdit, onDelete }: GameCardProps) {
  const isCompleted = game.status === 'completed' || game.status === '100_completed';

  return (
    <div
      className="group relative"
      style={{
        animation: `fadeInUp 0.6s ease-out ${index * 0.05}s both`,
      }}
    >
      <div className="relative aspect-[2/3] bg-deep rounded-lg overflow-hidden border border-steel transition-all duration-300 group-hover:border-cyan-500 group-hover:shadow-xl group-hover:shadow-cyan-500/20 group-hover:-translate-y-2">
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
            <div className="absolute inset-0 bg-gradient-to-br from-slate via-steel to-deep hidden items-center justify-center">
              <Library className="w-12 h-12 text-gray-700 opacity-30" />
            </div>
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate via-steel to-deep flex items-center justify-center">
            <Library className="w-12 h-12 text-gray-700 opacity-30" />
          </div>
        )}

        {/* Top badges */}
        <div className="absolute top-2 left-2 right-2 flex justify-between items-start z-10">
          <span className="px-2 py-1 bg-deep/80 backdrop-blur-sm text-white text-xs font-bold rounded">
            {game.platform}
          </span>
          {isCompleted && (
            <span className="px-2 py-1 bg-emerald-500 text-void text-xs font-bold uppercase rounded flex items-center space-x-1">
              <Trophy className="w-3 h-3" />
            </span>
          )}
        </div>

        {/* Action buttons - shown on hover */}
        <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-1.5 bg-cyan-500 hover:bg-cyan-400 rounded-md text-void transition-all transform hover:scale-110 shadow-lg"
            title="Edit game"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 bg-red-500 hover:bg-red-400 rounded-md text-white transition-all transform hover:scale-110 shadow-lg"
            title="Delete game"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-void via-void/80 to-transparent">
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Progress</span>
              <span className="text-cyan-400 font-bold">{game.completion_percentage}%</span>
            </div>
            <div className="w-full h-1 bg-slate rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full"
                style={{ width: `${game.completion_percentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="mt-2 px-1">
        <h3 className="font-bold text-sm text-white group-hover:text-cyan-400 transition-colors line-clamp-2 leading-tight">
          {game.game?.title || 'Untitled'}
        </h3>
      </div>
    </div>
  );
}
