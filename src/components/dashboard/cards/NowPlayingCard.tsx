import { Library, Edit3, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { UserGame } from '@/app/actions/games';

interface NowPlayingCardProps {
  game: UserGame;
  onEdit: () => void;
  onDelete: () => void;
}

export function NowPlayingCard({ game, onEdit, onDelete }: NowPlayingCardProps) {
  const router = useRouter();
  
  const formatLastPlayed = (date: string | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const played = new Date(date);
    const diffMs = now.getTime() - played.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return played.toLocaleDateString();
  };

  const handleClick = () => {
    router.push(`/game/${game.id}`);
  };

  return (
    <div 
      className="flex-shrink-0 w-72 bg-deep border border-steel rounded-xl overflow-hidden hover:border-cyan-500 transition-all group cursor-pointer"
      onClick={handleClick}
    >
      <div className="aspect-video bg-gradient-to-br from-slate via-steel to-deep relative">
        {game.game?.cover_url ? (
          <img
            src={game.game.cover_url}
            alt={game.game.title}
            className="w-full h-full object-cover"
            crossOrigin="anonymous"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
              if (placeholder) placeholder.style.display = 'flex';
            }}
          />
        ) : null}
        <div className={`absolute inset-0 ${game.game?.cover_url ? 'hidden' : 'flex'} items-center justify-center`}>
          <Library className="w-16 h-16 text-gray-700 opacity-30" />
        </div>
        <div className="absolute top-2 left-2 px-2 py-1 bg-cyan-500 text-void text-xs font-bold uppercase rounded z-10">
          {game.platform}
        </div>

        {/* Action buttons */}
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
      </div>
      <div className="p-4">
        <h3 className="font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">{game.game?.title || 'Untitled'}</h3>
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span>{Math.round(game.playtime_hours)}h played</span>
          <span>{formatLastPlayed(game.last_played_at)}</span>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Progress</span>
            <span className="text-cyan-400 font-bold">{game.completion_percentage}%</span>
          </div>
          <div className="w-full h-2 bg-slate rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${game.completion_percentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
