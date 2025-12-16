'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Layers,
  Flame,
  Clock,
  Coffee,
  Search,
  ArrowRight,
  Gamepad2,
  Target,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
} from 'lucide-react';
import { useDashboardData } from '@/lib/hooks';
import { GameFormModal, DeleteConfirmModal } from '@/components/modals';
import { updateUserGame } from '@/app/(dashboard)/_actions/games';
import type { UserGame } from '@/app/(dashboard)/_actions/games';

type PriorityLevel = 'high' | 'medium' | 'low';

interface PriorityConfig {
  id: PriorityLevel;
  label: string;
  sublabel: string;
  Icon: typeof Flame;
  gradient: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
  glowColor: string;
  iconBg: string;
}

const PRIORITY_CONFIG: Record<PriorityLevel, PriorityConfig> = {
  high: {
    id: 'high',
    label: 'HIGH PRIORITY',
    sublabel: 'Play Next',
    Icon: Flame,
    gradient: 'from-red-500/20 via-orange-500/10 to-transparent',
    borderColor: 'border-red-500/40',
    bgColor: 'bg-red-500/5',
    textColor: 'text-red-400',
    glowColor: 'shadow-red-500/20',
    iconBg: 'bg-red-500/20',
  },
  medium: {
    id: 'medium',
    label: 'MEDIUM PRIORITY',
    sublabel: 'When Ready',
    Icon: Clock,
    gradient: 'from-yellow-500/20 via-amber-500/10 to-transparent',
    borderColor: 'border-yellow-500/40',
    bgColor: 'bg-yellow-500/5',
    textColor: 'text-yellow-400',
    glowColor: 'shadow-yellow-500/20',
    iconBg: 'bg-yellow-500/20',
  },
  low: {
    id: 'low',
    label: 'LOW PRIORITY',
    sublabel: 'Someday',
    Icon: Coffee,
    gradient: 'from-blue-500/20 via-sky-500/10 to-transparent',
    borderColor: 'border-blue-500/40',
    bgColor: 'bg-blue-500/5',
    textColor: 'text-blue-400',
    glowColor: 'shadow-blue-500/20',
    iconBg: 'bg-blue-500/20',
  },
};

function BacklogGameCard({
  game,
  config,
  onEdit,
  onDelete,
  onStartPlaying,
  index,
}: {
  game: UserGame;
  config: PriorityConfig;
  onEdit: () => void;
  onDelete: () => void;
  onStartPlaying: () => void;
  index: number;
}) {
  const coverUrl = game.game?.cover_url;
  const title = game.game?.title ?? 'Unknown Game';
  const isOnHold = game.status === 'on_hold';

  return (
    <div
      className={`group relative flex items-center gap-4 p-3 rounded-xl border ${config.borderColor} ${config.bgColor} hover:bg-opacity-80 transition-all duration-300 hover:scale-[1.02] cursor-pointer`}
      style={{ animation: `fadeInUp 0.4s ease-out ${index * 0.05}s both` }}
      onClick={onEdit}
    >
      {/* Cover Art */}
      <div className="relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border border-steel/50 group-hover:border-cyan-500/50 transition-colors">
        {coverUrl ? (
          <img src={coverUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-deep flex items-center justify-center">
            <Gamepad2 className="w-6 h-6 text-gray-700" />
          </div>
        )}
        {/* Status badge for on_hold */}
        {isOnHold && (
          <div className="absolute inset-0 bg-purple-500/40 backdrop-blur-sm flex items-center justify-center">
            <Pause className="w-5 h-5 text-white" />
          </div>
        )}
      </div>

      {/* Game Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-white truncate group-hover:text-cyan-400 transition-colors">
          {title}
        </h4>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-gray-500 truncate">{game.platform}</span>
          {isOnHold && (
            <span className="text-xs px-1.5 py-0.5 bg-purple-500/20 border border-purple-500/40 rounded text-purple-400">
              On Hold
            </span>
          )}
          {game.tags && game.tags.length > 0 && (
            <span className="text-xs px-1.5 py-0.5 bg-steel/50 border border-steel rounded text-gray-400">
              {game.tags[0]}
              {game.tags.length > 1 && ` +${game.tags.length - 1}`}
            </span>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onStartPlaying();
          }}
          className="p-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-400 hover:text-white transition-all"
          title="Start Playing"
        >
          <Play className="w-4 h-4" />
        </button>
      </div>

      {/* Priority indicator line */}
      <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full ${config.textColor.replace('text-', 'bg-')}`} />
    </div>
  );
}

function PriorityColumn({
  priority,
  games,
  onEditGame,
  onDeleteGame,
  onStartPlaying,
  isCollapsed,
  onToggleCollapse,
}: {
  priority: PriorityLevel;
  games: UserGame[];
  onEditGame: (game: UserGame) => void;
  onDeleteGame: (game: UserGame) => void;
  onStartPlaying: (game: UserGame) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const config = PRIORITY_CONFIG[priority];
  const Icon = config.Icon;

  return (
    <div className={`flex flex-col rounded-2xl border ${config.borderColor} overflow-hidden transition-all duration-300`}>
      {/* Column Header */}
      <button
        onClick={onToggleCollapse}
        className={`flex items-center justify-between p-4 bg-gradient-to-r ${config.gradient} hover:brightness-110 transition-all`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${config.iconBg}`}>
            <Icon className={`w-5 h-5 ${config.textColor}`} />
          </div>
          <div className="text-left">
            <h3 className={`font-bold uppercase tracking-wider text-sm ${config.textColor}`}>
              {config.label}
            </h3>
            <p className="text-xs text-gray-500">{config.sublabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-2xl font-black ${config.textColor}`}>{games.length}</span>
          {isCollapsed ? (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          )}
        </div>
      </button>

      {/* Games List */}
      {!isCollapsed && (
        <div className="flex-1 p-3 space-y-2 bg-abyss/50 max-h-[60vh] overflow-y-auto scrollbar-hide">
          {games.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className={`p-4 rounded-full ${config.iconBg} mb-3`}>
                <Target className={`w-8 h-8 ${config.textColor} opacity-50`} />
              </div>
              <p className="text-gray-600 text-sm">No games at this priority</p>
              <p className="text-gray-700 text-xs mt-1">
                Edit a game to set its priority
              </p>
            </div>
          ) : (
            games.map((game, index) => (
              <BacklogGameCard
                key={game.id}
                game={game}
                config={config}
                onEdit={() => onEditGame(game)}
                onDelete={() => onDeleteGame(game)}
                onStartPlaying={() => onStartPlaying(game)}
                index={index}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function BacklogPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedColumns, setCollapsedColumns] = useState<Record<PriorityLevel, boolean>>({
    high: false,
    medium: false,
    low: false,
  });

  // Modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState<UserGame | null>(null);

  const { userGames, loading, refreshData } = useDashboardData(false);

  // Filter to only backlog games (unplayed + on_hold)
  const backlogGames = useMemo(() => {
    return userGames.filter(
      (game) =>
        (game.status === 'unplayed' || game.status === 'on_hold') &&
        !game.hidden
    );
  }, [userGames]);

  // Apply search filter
  const filteredGames = useMemo(() => {
    if (!searchQuery.trim()) return backlogGames;
    const query = searchQuery.toLowerCase();
    return backlogGames.filter(
      (game) =>
        game.game?.title?.toLowerCase().includes(query) ||
        game.platform.toLowerCase().includes(query) ||
        game.tags?.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [backlogGames, searchQuery]);

  // Group by priority
  const gamesByPriority = useMemo(() => {
    const grouped: Record<PriorityLevel, UserGame[]> = {
      high: [],
      medium: [],
      low: [],
    };
    filteredGames.forEach((game) => {
      const priority = (game.priority as PriorityLevel) ?? 'medium';
      grouped[priority].push(game);
    });
    // Sort each group by title
    Object.keys(grouped).forEach((key) => {
      grouped[key as PriorityLevel].sort((a, b) =>
        (a.game?.title ?? '').localeCompare(b.game?.title ?? '')
      );
    });
    return grouped;
  }, [filteredGames]);

  const handleEditGame = (game: UserGame) => {
    setSelectedGame(game);
    setShowEditModal(true);
  };

  const handleDeleteGame = (game: UserGame) => {
    setSelectedGame(game);
    setShowDeleteModal(true);
  };

  const handleStartPlaying = async (game: UserGame) => {
    await updateUserGame(game.id, { status: 'playing' });
    await refreshData();
  };

  const handleSuccess = async () => {
    await refreshData();
  };

  const toggleColumn = (priority: PriorityLevel) => {
    setCollapsedColumns((prev) => ({
      ...prev,
      [priority]: !prev[priority],
    }));
  };

  // Stats
  const totalBacklog = backlogGames.length;
  const highPriorityCount = gamesByPriority.high.length;
  const onHoldCount = backlogGames.filter((g) => g.status === 'on_hold').length;

  return (
    <>
      {/* Animated background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-40 left-1/3 w-[500px] h-[500px] bg-red-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-1/3 w-[400px] h-[400px] bg-yellow-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/4 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-red-500/20 via-yellow-500/20 to-blue-500/20 border border-steel">
                  <Layers className="w-8 h-8 text-cyan-400" />
                </div>
                <div>
                  <h1 className="text-5xl font-bold bg-gradient-to-r from-red-400 via-yellow-400 to-blue-400 bg-clip-text text-transparent">
                    BACKLOG
                  </h1>
                  <p className="text-gray-500 text-sm uppercase tracking-wider">
                    Priority Queue
                  </p>
                </div>
              </div>
              <p className="text-gray-400 text-lg max-w-xl">
                Your games waiting to be played, organized by priority. Focus on what matters most.
              </p>
            </div>

            <Link
              href="/library"
              className="flex items-center gap-2 px-4 py-2 bg-deep border border-steel rounded-xl text-gray-400 hover:text-white hover:border-cyan-500/50 transition-all group"
            >
              <span>Full Library</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-deep border border-steel rounded-xl p-4 hover:border-cyan-500/30 transition-colors">
            <div className="flex items-center gap-3">
              <Layers className="w-5 h-5 text-cyan-400" />
              <div>
                <div className="text-2xl font-bold text-cyan-400">{totalBacklog}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">Total Backlog</div>
              </div>
            </div>
          </div>
          <div className="bg-deep border border-steel rounded-xl p-4 hover:border-red-500/30 transition-colors">
            <div className="flex items-center gap-3">
              <Flame className="w-5 h-5 text-red-400" />
              <div>
                <div className="text-2xl font-bold text-red-400">{highPriorityCount}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">High Priority</div>
              </div>
            </div>
          </div>
          <div className="bg-deep border border-steel rounded-xl p-4 hover:border-purple-500/30 transition-colors">
            <div className="flex items-center gap-3">
              <Pause className="w-5 h-5 text-purple-400" />
              <div>
                <div className="text-2xl font-bold text-purple-400">{onHoldCount}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">On Hold</div>
              </div>
            </div>
          </div>
          <div className="bg-deep border border-steel rounded-xl p-4 hover:border-emerald-500/30 transition-colors">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="text-2xl font-bold text-emerald-400">
                  {highPriorityCount > 0 ? gamesByPriority.high[0]?.game?.title?.slice(0, 12) + '...' : '—'}
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">Play Next</div>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search your backlog..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-deep border border-steel rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10 transition-all"
            />
          </div>
        </div>

        {/* Priority Columns */}
        {loading ? (
          <div className="text-center py-20">
            <Layers className="w-16 h-16 text-cyan-400 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-500">Loading your backlog...</p>
          </div>
        ) : totalBacklog === 0 ? (
          <div className="text-center py-20 bg-deep border border-steel rounded-2xl">
            <div className="p-6 rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <Sparkles className="w-12 h-12 text-emerald-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Backlog Clear!</h3>
            <p className="text-gray-500 mb-6">
              Amazing! You don't have any unplayed games waiting.
            </p>
            <Link
              href="/library"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-bold text-void hover:from-cyan-400 hover:to-purple-400 transition-all"
            >
              Browse Library
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {(['high', 'medium', 'low'] as PriorityLevel[]).map((priority) => (
              <PriorityColumn
                key={priority}
                priority={priority}
                games={gamesByPriority[priority]}
                onEditGame={handleEditGame}
                onDeleteGame={handleDeleteGame}
                onStartPlaying={handleStartPlaying}
                isCollapsed={collapsedColumns[priority]}
                onToggleCollapse={() => toggleColumn(priority)}
              />
            ))}
          </div>
        )}

        {/* Tip */}
        {totalBacklog > 0 && (
          <div className="mt-8 p-4 bg-deep/50 border border-steel rounded-xl">
            <div className="flex items-start gap-3">
              <Target className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-gray-400">
                  <span className="text-cyan-400 font-semibold">Pro tip:</span> Focus on your high priority games first.
                  Click the <Play className="w-3 h-3 inline mx-1" /> button to instantly start playing a game.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Game Modal */}
      <GameFormModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedGame(null);
        }}
        onSuccess={handleSuccess}
        mode="edit"
        userGame={selectedGame}
      />

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedGame(null);
        }}
        onSuccess={handleSuccess}
        userGame={selectedGame}
      />
    </>
  );
}
