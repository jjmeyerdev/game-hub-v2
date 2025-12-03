import { Play, ChevronRight } from 'lucide-react';
import type { UserGame } from '@/app/actions/games';
import { NowPlayingCard } from './cards/NowPlayingCard';

interface NowPlayingSectionProps {
  nowPlaying: UserGame[];
  loading: boolean;
  onAddGame: () => void;
  onEditGame: (game: UserGame) => void;
  onDeleteGame: (game: UserGame) => void;
}

export function NowPlayingSection({
  nowPlaying,
  loading,
  onAddGame,
  onEditGame,
  onDeleteGame,
}: NowPlayingSectionProps) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold flex items-center space-x-2">
            <Play className="w-5 h-5 text-cyan-400" />
            <span>Now Playing</span>
          </h2>
          <p className="text-sm text-gray-500">Your active games</p>
        </div>
        <button className="text-sm text-cyan-400 hover:text-cyan-300 font-semibold flex items-center space-x-1">
          <span>View All</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading games...</div>
      ) : nowPlaying.length === 0 ? (
        <div className="text-center py-12 bg-deep border border-steel rounded-xl">
          <Play className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500">No games currently playing</p>
          <button
            onClick={onAddGame}
            className="mt-4 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-void font-semibold rounded-lg transition-colors"
          >
            Add Your First Game
          </button>
        </div>
      ) : (
        <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
          {nowPlaying.map((userGame) => (
            <NowPlayingCard
              key={userGame.id}
              game={userGame}
              onEdit={() => onEditGame(userGame)}
              onDelete={() => onDeleteGame(userGame)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
