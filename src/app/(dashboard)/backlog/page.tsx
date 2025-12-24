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
import { updateUserGame } from '@/lib/actions/games';
import type { UserGame } from '@/lib/actions/games';

type PriorityLevel = 'high' | 'medium' | 'low';

interface PriorityConfig {
  id: PriorityLevel;
  label: string;
  sublabel: string;
  Icon: typeof Flame;
  borderColor: string;
  bgColor: string;
  textColor: string;
  iconBg: string;
  headerBg: string;
}

const PRIORITY_CONFIG: Record<PriorityLevel, PriorityConfig> = {
  high: {
    id: 'high',
    label: 'High Priority',
    sublabel: 'Play Next',
    Icon: Flame,
    borderColor: 'border-red-500/20',
    bgColor: 'bg-red-500/5',
    textColor: 'text-red-400',
    iconBg: 'bg-red-500/10',
    headerBg: 'bg-red-500/5',
  },
  medium: {
    id: 'medium',
    label: 'Medium Priority',
    sublabel: 'When Ready',
    Icon: Clock,
    borderColor: 'border-amber-500/20',
    bgColor: 'bg-amber-500/5',
    textColor: 'text-amber-400',
    iconBg: 'bg-amber-500/10',
    headerBg: 'bg-amber-500/5',
  },
  low: {
    id: 'low',
    label: 'Low Priority',
    sublabel: 'Someday',
    Icon: Coffee,
    borderColor: 'border-blue-500/20',
    bgColor: 'bg-blue-500/5',
    textColor: 'text-blue-400',
    iconBg: 'bg-blue-500/10',
    headerBg: 'bg-blue-500/5',
  },
};

function BacklogGameCard({
  game,
  config,
  onEdit,
  onStartPlaying,
  index,
}: {
  game: UserGame;
  config: PriorityConfig;
  onEdit: () => void;
  onStartPlaying: () => void;
  index: number;
}) {
  const coverUrl = game.game?.cover_url;
  const title = game.game?.title ?? 'Unknown Game';
  const isOnHold = game.status === 'on_hold';

  return (
    <div
      className="group relative flex items-center gap-3 p-3 rounded-xl bg-[var(--theme-hover-bg)] border border-white/[0.04] hover:border-[var(--theme-border)] hover:bg-[var(--theme-hover-bg)] transition-all duration-200 cursor-pointer overflow-hidden"
      style={{ animation: `fadeIn 0.3s ease-out ${index * 0.05}s both` }}
      onClick={onEdit}
    >
      {/* Hover HUD corners */}
      <div className={`absolute top-0 left-0 w-2 h-2 border-l border-t ${config.borderColor.replace('/20', '/50')} opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className={`absolute top-0 right-0 w-2 h-2 border-r border-t ${config.borderColor.replace('/20', '/50')} opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className={`absolute bottom-0 left-0 w-2 h-2 border-l border-b ${config.borderColor.replace('/20', '/50')} opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className={`absolute bottom-0 right-0 w-2 h-2 border-r border-b ${config.borderColor.replace('/20', '/50')} opacity-0 group-hover:opacity-100 transition-opacity`} />

      {/* Priority indicator */}
      <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r-full ${config.textColor.replace('text-', 'bg-')}`} />

      {/* Cover Art */}
      <div className="relative flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border border-[var(--theme-border)] group-hover:border-white/[0.12] transition-colors">
        {coverUrl ? (
          <img src={coverUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-[var(--theme-hover-bg)] flex items-center justify-center">
            <Gamepad2 className="w-5 h-5 text-[var(--theme-text-subtle)]" />
          </div>
        )}
        {isOnHold && (
          <div className="absolute inset-0 bg-violet-500/40 backdrop-blur-sm flex items-center justify-center">
            <Pause className="w-4 h-4 text-white" />
          </div>
        )}
      </div>

      {/* Game Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm text-white truncate group-hover:text-white transition-colors">
          {title}
        </h4>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-[var(--theme-text-subtle)] truncate">{game.platform}</span>
          {isOnHold && (
            <span className="text-[10px] px-1.5 py-0.5 bg-violet-500/10 border border-violet-500/20 rounded text-violet-400">
              On Hold
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
          className="p-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 transition-all"
          title="Start Playing"
        >
          <Play className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function PriorityColumn({
  priority,
  games,
  onEditGame,
  onStartPlaying,
  isCollapsed,
  onToggleCollapse,
}: {
  priority: PriorityLevel;
  games: UserGame[];
  onEditGame: (game: UserGame) => void;
  onStartPlaying: (game: UserGame) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const config = PRIORITY_CONFIG[priority];
  const Icon = config.Icon;

  return (
    <div className={`relative flex flex-col rounded-xl bg-[var(--theme-bg-secondary)] border ${config.borderColor} overflow-hidden transition-all duration-200`}>
      {/* HUD corners */}
      <div className={`absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 ${config.borderColor.replace('/20', '/40')} z-10`} />
      <div className={`absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 ${config.borderColor.replace('/20', '/40')} z-10`} />
      <div className={`absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 ${config.borderColor.replace('/20', '/40')} z-10`} />
      <div className={`absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 ${config.borderColor.replace('/20', '/40')} z-10`} />

      {/* Column Header */}
      <button
        onClick={onToggleCollapse}
        className={`flex items-center justify-between p-4 ${config.headerBg} border-b border-white/[0.04] hover:bg-opacity-80 transition-all`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${config.iconBg} border ${config.borderColor}`}>
            <Icon className={`w-4 h-4 ${config.textColor}`} />
          </div>
          <div className="text-left">
            <h3 className={`font-semibold text-sm ${config.textColor} font-[family-name:var(--font-family-display)]`}>
              {config.label}
            </h3>
            <p className="text-[10px] font-mono text-[var(--theme-text-subtle)] uppercase tracking-wider">{config.sublabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-lg font-bold font-mono ${config.textColor}`}>{games.length}</span>
          {isCollapsed ? (
            <ChevronDown className="w-4 h-4 text-[var(--theme-text-subtle)]" />
          ) : (
            <ChevronUp className="w-4 h-4 text-[var(--theme-text-subtle)]" />
          )}
        </div>
      </button>

      {/* Games List */}
      {!isCollapsed && (
        <div className="flex-1 p-3 space-y-2 max-h-[60vh] overflow-y-auto scrollbar-hide">
          {games.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className={`p-3 rounded-xl ${config.iconBg} mb-3`}>
                <Target className={`w-6 h-6 ${config.textColor} opacity-50`} />
              </div>
              <p className="text-[var(--theme-text-subtle)] text-sm">No games at this priority</p>
              <p className="text-[var(--theme-text-subtle)] text-xs mt-1">
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
    <div className="relative min-h-screen bg-[var(--theme-bg-primary)] overflow-x-hidden">
      {/* Ambient glow blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] bg-red-500/[0.02] rounded-full blur-[120px] animate-breathe" />
        <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] bg-amber-500/[0.02] rounded-full blur-[120px] animate-breathe" style={{ animationDelay: '2s' }} />
        <div className="absolute -bottom-40 left-1/3 w-[400px] h-[400px] bg-blue-500/[0.02] rounded-full blur-[120px] animate-breathe" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500/10 via-amber-500/10 to-blue-500/10 border border-[var(--theme-border)] flex items-center justify-center">
                  <Layers className="w-6 h-6 text-amber-400" />
                </div>
                {/* HUD corners */}
                <div className="absolute -top-1 -left-1 w-2 h-2 border-l-2 border-t-2 border-amber-400/50" />
                <div className="absolute -top-1 -right-1 w-2 h-2 border-r-2 border-t-2 border-amber-400/50" />
                <div className="absolute -bottom-1 -left-1 w-2 h-2 border-l-2 border-b-2 border-amber-400/50" />
                <div className="absolute -bottom-1 -right-1 w-2 h-2 border-r-2 border-b-2 border-amber-400/50" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-[var(--theme-text-subtle)] uppercase tracking-wider block mb-1">
                  // QUEUE_MANAGEMENT
                </span>
                <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-family-display)]">BACKLOG</h1>
              </div>
            </div>

            <Link
              href="/library"
              className="flex items-center gap-2 px-4 py-2 bg-[var(--theme-hover-bg)] border border-[var(--theme-border)] rounded-xl text-sm text-[var(--theme-text-muted)] hover:text-white hover:border-white/[0.1] transition-all group"
            >
              <span>Full Library</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Target className="w-4 h-4 text-[var(--theme-text-subtle)]" />
            <span className="text-[10px] font-mono text-[var(--theme-text-subtle)] uppercase tracking-wider">// QUEUE_STATS</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="group relative bg-[var(--theme-bg-secondary)] border border-[var(--theme-border)] rounded-xl p-4 hover:border-white/[0.1] transition-colors overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-cyan-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-cyan-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-cyan-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-cyan-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                  <Layers className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <div className="text-xl font-bold font-mono text-white">{totalBacklog}</div>
                  <div className="text-[10px] font-mono text-[var(--theme-text-subtle)] uppercase tracking-wider">Total</div>
                </div>
              </div>
            </div>
            <div className="group relative bg-[var(--theme-bg-secondary)] border border-[var(--theme-border)] rounded-xl p-4 hover:border-white/[0.1] transition-colors overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-red-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-red-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-red-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-red-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                  <Flame className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <div className="text-xl font-bold font-mono text-white">{highPriorityCount}</div>
                  <div className="text-[10px] font-mono text-[var(--theme-text-subtle)] uppercase tracking-wider">High Priority</div>
                </div>
              </div>
            </div>
            <div className="group relative bg-[var(--theme-bg-secondary)] border border-[var(--theme-border)] rounded-xl p-4 hover:border-white/[0.1] transition-colors overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-violet-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-violet-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-violet-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-violet-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
                  <Pause className="w-4 h-4 text-violet-400" />
                </div>
                <div>
                  <div className="text-xl font-bold font-mono text-white">{onHoldCount}</div>
                  <div className="text-[10px] font-mono text-[var(--theme-text-subtle)] uppercase tracking-wider">On Hold</div>
                </div>
              </div>
            </div>
            <div className="group relative bg-[var(--theme-bg-secondary)] border border-[var(--theme-border)] rounded-xl p-4 hover:border-white/[0.1] transition-colors overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-emerald-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-emerald-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-emerald-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-emerald-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <div className="text-lg font-bold text-white truncate max-w-[120px] font-[family-name:var(--font-family-display)]">
                    {highPriorityCount > 0 ? gamesByPriority.high[0]?.game?.title?.slice(0, 12) + '...' : '—'}
                  </div>
                  <div className="text-[10px] font-mono text-[var(--theme-text-subtle)] uppercase tracking-wider">Play Next</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-3">
            <Search className="w-4 h-4 text-[var(--theme-text-subtle)]" />
            <span className="text-[10px] font-mono text-[var(--theme-text-subtle)] uppercase tracking-wider">// SEARCH_FILTER</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--theme-text-subtle)]" />
            <input
              type="text"
              placeholder="Search your backlog..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--theme-bg-secondary)] border border-[var(--theme-border)] rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-[var(--theme-text-subtle)] focus:outline-none focus:border-cyan-400/30 focus:bg-[var(--theme-hover-bg)] transition-all font-mono"
            />
          </div>
        </div>

        {/* Priority Columns */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <Layers className="w-12 h-12 text-amber-400/60 animate-pulse" />
              <div className="absolute inset-0 w-12 h-12 border-2 border-amber-400/20 rounded-full animate-ping" />
            </div>
            <p className="mt-4 text-[11px] font-mono text-[var(--theme-text-subtle)] uppercase tracking-wider">// Loading queue data...</p>
          </div>
        ) : totalBacklog === 0 ? (
          <div className="relative text-center py-20 bg-[var(--theme-bg-secondary)] border border-[var(--theme-border)] rounded-2xl overflow-hidden">
            {/* HUD corners */}
            <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-emerald-400/30" />
            <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-emerald-400/30" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-emerald-400/30" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-emerald-400/30" />

            <span className="text-[10px] font-mono text-[var(--theme-text-subtle)] uppercase tracking-wider mb-4 block">// QUEUE_EMPTY</span>
            <div className="relative p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 font-[family-name:var(--font-family-display)]">BACKLOG CLEAR!</h3>
            <p className="text-[var(--theme-text-muted)] mb-6">
              You don't have any unplayed games waiting.
            </p>
            <Link
              href="/library"
              className="group relative inline-flex items-center gap-2 px-6 py-3 overflow-hidden rounded-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-cyan-600 opacity-90 group-hover:opacity-100 transition-opacity" />
              <span className="relative font-semibold text-white uppercase tracking-wide font-[family-name:var(--font-family-display)]">Browse Library</span>
              <ArrowRight className="relative w-4 h-4 text-white group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {(['high', 'medium', 'low'] as PriorityLevel[]).map((priority) => (
              <PriorityColumn
                key={priority}
                priority={priority}
                games={gamesByPriority[priority]}
                onEditGame={handleEditGame}
                onStartPlaying={handleStartPlaying}
                isCollapsed={collapsedColumns[priority]}
                onToggleCollapse={() => toggleColumn(priority)}
              />
            ))}
          </div>
        )}

        {/* Tip */}
        {totalBacklog > 0 && (
          <div className="relative mt-8 p-4 bg-[var(--theme-bg-secondary)] border border-[var(--theme-border)] rounded-xl overflow-hidden">
            {/* HUD corners */}
            <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-cyan-400/30" />
            <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-cyan-400/30" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-cyan-400/30" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-cyan-400/30" />

            <div className="relative flex items-start gap-3">
              <Target className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[var(--theme-text-muted)]">
                <span className="text-cyan-400 font-mono text-[10px] uppercase tracking-wider">// TIP:</span>{' '}
                Focus on your high priority games first.
                Click the <Play className="w-3 h-3 inline mx-1 text-cyan-400" /> button to instantly start playing a game.
              </p>
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

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
