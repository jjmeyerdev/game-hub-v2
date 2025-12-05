'use client';

import { useState } from 'react';
import { Library, Search, Filter, ArrowUpDown, Eye, EyeOff, Flame, Clock, Coffee, ChevronDown, Gamepad2, X, ShieldOff, Shield } from 'lucide-react';
import type { UserGame } from '@/app/actions/games';
import { GameCard } from './cards/GameCard';

const PLATFORMS = ['All', 'Steam', 'PlayStation', 'Xbox', 'Windows', 'Epic', 'EA App', 'Battle.net', 'Physical'];
const PRIORITY_OPTIONS = [
  { id: 'all', label: 'All Priorities', icon: null, color: '', activeClass: 'bg-cyan-500 text-void' },
  { id: 'high', label: 'High', icon: Flame, color: 'text-red-400', activeClass: 'bg-red-500/20 text-red-400 ring-1 ring-red-500/50' },
  { id: 'medium', label: 'Medium', icon: Clock, color: 'text-yellow-400', activeClass: 'bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-500/50' },
  { id: 'low', label: 'Low', icon: Coffee, color: 'text-blue-400', activeClass: 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/50' },
] as const;

type SortOption = 'title-asc' | 'title-desc' | 'recent' | 'completion-asc' | 'completion-desc' | 'playtime-asc' | 'playtime-desc' | 'priority-high' | 'priority-low';

interface GameLibraryProps {
  userGames: UserGame[];
  loading: boolean;
  onAddGame: () => void;
  onEditGame: (game: UserGame) => void;
  onDeleteGame: (game: UserGame) => void;
  showHiddenGames?: boolean;
  onToggleHiddenGames?: () => void;
}

export function GameLibrary({
  userGames,
  loading,
  onAddGame,
  onEditGame,
  onDeleteGame,
  showHiddenGames = false,
  onToggleHiddenGames,
}: GameLibraryProps) {
  const [selectedPlatform, setSelectedPlatform] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('title-asc');
  const [censorHidden, setCensorHidden] = useState(true);

  // Filter games
  const filteredGames = userGames.filter((userGame) => {
    // Hidden filter - when showHiddenGames is true, show ONLY hidden games
    // When false, show only non-hidden games
    if (showHiddenGames) {
      if (!userGame.hidden) return false;
    } else {
      if (userGame.hidden) return false;
    }

    // Platform filter - smart matching
    if (selectedPlatform !== 'All') {
      const gamePlatform = userGame.platform.toLowerCase();
      const filterPlatform = selectedPlatform.toLowerCase();

      // Special case: PC should match exactly
      if (filterPlatform === 'pc') {
        if (gamePlatform !== 'pc') {
          return false;
        }
      } else {
        // For other platforms, check if game platform contains the filter
        if (!gamePlatform.includes(filterPlatform)) {
          return false;
        }
      }
    }
    // Priority filter
    if (selectedPriority !== 'all' && userGame.priority !== selectedPriority) {
      return false;
    }
    // Search filter
    if (searchQuery && !userGame.game?.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Priority order mapping for sorting
  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };

  // Sort games
  const sortedGames = [...filteredGames].sort((a, b) => {
    switch (sortBy) {
      case 'title-asc':
        return (a.game?.title || '').localeCompare(b.game?.title || '');
      case 'title-desc':
        return (b.game?.title || '').localeCompare(a.game?.title || '');
      case 'recent':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'completion-desc':
        return b.completion_percentage - a.completion_percentage;
      case 'completion-asc':
        return a.completion_percentage - b.completion_percentage;
      case 'playtime-desc':
        return b.playtime_hours - a.playtime_hours;
      case 'playtime-asc':
        return a.playtime_hours - b.playtime_hours;
      case 'priority-high':
        return (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1);
      case 'priority-low':
        return (priorityOrder[b.priority] ?? 1) - (priorityOrder[a.priority] ?? 1);
      default:
        return 0;
    }
  });

  // Check if any filters are active
  const hasActiveFilters = selectedPlatform !== 'All' || selectedPriority !== 'all';

  // Get active priority info for display
  const activePriorityInfo = PRIORITY_OPTIONS.find(p => p.id === selectedPriority);

  return (
    <section>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold flex items-center space-x-2">
            <Library className="w-5 h-5 text-cyan-400" />
            <span>Game Library</span>
          </h2>
          <p className="text-sm text-gray-500">
            {sortedGames.length} {sortedGames.length === 1 ? 'game' : 'games'}
            {hasActiveFilters && ' (filtered)'}
          </p>
        </div>
      </div>

      {/* Unified Filter Bar */}
      <div className="bg-deep/50 backdrop-blur-sm border border-steel rounded-2xl p-4 mb-6">
        {/* Top Row: Search + Sort + Hidden Toggle */}
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search your library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-abyss/80 border border-steel/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50 focus:bg-abyss transition-all"
            />
          </div>

          {/* Controls Group */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="appearance-none bg-abyss/80 border border-steel/50 rounded-xl pl-3 pr-8 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-cyan-500/50 transition-all cursor-pointer hover:border-steel hover:text-white"
              >
                <option value="title-asc">A → Z</option>
                <option value="title-desc">Z → A</option>
                <option value="recent">Recent</option>
                <option value="priority-high">Priority ↑</option>
                <option value="priority-low">Priority ↓</option>
                <option value="completion-desc">Complete ↑</option>
                <option value="completion-asc">Complete ↓</option>
                <option value="playtime-desc">Playtime ↑</option>
                <option value="playtime-asc">Playtime ↓</option>
              </select>
              <ArrowUpDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
            </div>

            {/* Hidden Toggle */}
            {onToggleHiddenGames && (
              <button
                onClick={onToggleHiddenGames}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  showHiddenGames
                    ? 'bg-purple-500/20 text-purple-400 ring-1 ring-purple-500/50'
                    : 'bg-abyss/80 border border-steel/50 text-gray-400 hover:text-white hover:border-steel'
                }`}
                title={showHiddenGames ? 'Hide private games' : 'Show private games'}
              >
                {showHiddenGames ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            )}

            {/* Censor Toggle - only show when hidden games are visible */}
            {showHiddenGames && (
              <button
                onClick={() => setCensorHidden(!censorHidden)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  censorHidden
                    ? 'bg-purple-500/20 text-purple-400 ring-1 ring-purple-500/50'
                    : 'bg-abyss/80 border border-steel/50 text-gray-400 hover:text-white hover:border-steel'
                }`}
                title={censorHidden ? 'Show hidden game covers' : 'Blur hidden game covers'}
              >
                {censorHidden ? <Shield className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-steel/50 to-transparent my-4" />

        {/* Bottom Row: Platform + Priority Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Platform Pills */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Gamepad2 className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Platform</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PLATFORMS.map((platform) => (
                <button
                  key={platform}
                  onClick={() => setSelectedPlatform(platform)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedPlatform === platform
                      ? 'bg-cyan-500 text-void shadow-lg shadow-cyan-500/20'
                      : 'bg-abyss/60 text-gray-400 hover:text-white hover:bg-slate/60'
                  }`}
                >
                  {platform}
                </button>
              ))}
            </div>
          </div>

          {/* Priority Selector */}
          <div className="sm:w-auto sm:min-w-[200px]">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</span>
            </div>
            <div className="flex gap-1.5">
              {PRIORITY_OPTIONS.map((priority) => {
                const Icon = priority.icon;
                const isActive = selectedPriority === priority.id;
                return (
                  <button
                    key={priority.id}
                    onClick={() => setSelectedPriority(priority.id)}
                    className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? priority.activeClass
                        : 'bg-abyss/60 text-gray-400 hover:text-white hover:bg-slate/60'
                    }`}
                    title={priority.label}
                  >
                    {Icon && <Icon className={`w-3.5 h-3.5 ${isActive ? '' : 'opacity-60'}`} />}
                    <span className="hidden sm:inline">{priority.id === 'all' ? 'All' : priority.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-steel/30">
            <span className="text-xs text-gray-500">Active:</span>
            <div className="flex flex-wrap gap-1.5">
              {selectedPlatform !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-cyan-500/10 text-cyan-400 text-xs rounded-md">
                  {selectedPlatform}
                  <button
                    onClick={() => setSelectedPlatform('All')}
                    className="hover:text-cyan-300 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedPriority !== 'all' && activePriorityInfo && (
                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md ${
                  selectedPriority === 'high' ? 'bg-red-500/10 text-red-400' :
                  selectedPriority === 'medium' ? 'bg-yellow-500/10 text-yellow-400' :
                  'bg-blue-500/10 text-blue-400'
                }`}>
                  {activePriorityInfo.icon && <activePriorityInfo.icon className="w-3 h-3" />}
                  {activePriorityInfo.label}
                  <button
                    onClick={() => setSelectedPriority('all')}
                    className="hover:opacity-70 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
            <button
              onClick={() => {
                setSelectedPlatform('All');
                setSelectedPriority('all');
              }}
              className="ml-auto text-xs text-gray-500 hover:text-white transition-colors"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Game Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading games...</div>
      ) : sortedGames.length === 0 ? (
        <div className="text-center py-12 bg-deep border border-steel rounded-xl">
          <Library className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500">
            {userGames.length === 0 ? 'Your library is empty' : 'No games found'}
          </p>
          {userGames.length === 0 && (
            <button
              onClick={onAddGame}
              className="mt-4 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-void font-semibold rounded-lg transition-colors"
            >
              Add Your First Game
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {sortedGames.map((userGame, index) => (
            <GameCard
              key={userGame.id}
              game={userGame}
              index={index}
              onEdit={() => onEditGame(userGame)}
              onDelete={() => onDeleteGame(userGame)}
              censorHidden={censorHidden}
            />
          ))}
        </div>
      )}
    </section>
  );
}
