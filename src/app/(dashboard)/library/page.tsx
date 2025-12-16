'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Library, Grid3x3, List, Search, ArrowUpDown, Eye, EyeOff, Flame, Clock, Coffee, Gamepad2, X, ShieldOff, Shield, Plus, Copy, Link2, Monitor } from 'lucide-react';
import { useDashboardData } from '@/lib/hooks';
import { GameCard } from '@/components/dashboard/cards/GameCard';
import { GameListItem } from '@/components/dashboard/cards/GameListItem';
import { GameFormModal, DeleteConfirmModal, DuplicateFinderModal } from '@/components/modals';
import { SyncServiceDropdown } from '@/components/library/SyncServiceDropdown';
import { ConsoleFilter } from '@/components/library/ConsoleFilter';
import { Button } from '@/components/ui/button';
import { filterAndSortGames, getGameSyncSource } from '@/lib/utils';
import { LIBRARY_FILTER_PLATFORMS, SYNC_SOURCE_OPTIONS, CONSOLE_GENERATIONS, type SortOption, type SyncSourceId } from '@/lib/constants/platforms';
import type { UserGame } from '@/app/_actions/games';

type ViewMode = 'grid' | 'list';

const STORAGE_KEY = 'game-hub-library-sort';

const PRIORITY_OPTIONS = [
  { id: 'all', label: 'All Priorities', icon: null, color: '', activeClass: 'bg-cyan-500 text-void' },
  { id: 'high', label: 'High', icon: Flame, color: 'text-red-400', activeClass: 'bg-red-500/20 text-red-400 ring-1 ring-red-500/50' },
  { id: 'medium', label: 'Medium', icon: Clock, color: 'text-yellow-400', activeClass: 'bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-500/50' },
  { id: 'low', label: 'Low', icon: Coffee, color: 'text-blue-400', activeClass: 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/50' },
] as const;

function getInitialSort(): SortOption {
  if (typeof window === 'undefined') return 'title-asc';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && ['title-asc', 'title-desc', 'recent', 'release-newest', 'release-oldest', 'priority-high', 'priority-low', 'completion-desc', 'completion-asc', 'playtime-desc', 'playtime-asc'].includes(stored)) {
    return stored as SortOption;
  }
  return 'title-asc';
}

export default function LibraryPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<SyncSourceId[]>([]);
  const [selectedConsoles, setSelectedConsoles] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('title-asc');
  const [showHiddenGames, setShowHiddenGames] = useState(false);
  const [censorHidden, setCensorHidden] = useState(true);

  // Toggle helpers for multi-select
  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const togglePriority = (priority: string) => {
    setSelectedPriorities(prev =>
      prev.includes(priority)
        ? prev.filter(p => p !== priority)
        : [...prev, priority]
    );
  };

  const toggleSource = (source: SyncSourceId) => {
    setSelectedSources(prev =>
      prev.includes(source)
        ? prev.filter(s => s !== source)
        : [...prev, source]
    );
  };

  const toggleConsole = (console: string) => {
    setSelectedConsoles(prev =>
      prev.includes(console)
        ? prev.filter(c => c !== console)
        : [...prev, console]
    );
  };

  // Load sort preference from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && ['title-asc', 'title-desc', 'recent', 'release-newest', 'release-oldest', 'priority-high', 'priority-low', 'completion-desc', 'completion-asc', 'playtime-desc', 'playtime-asc'].includes(stored)) {
      setSortBy(stored as SortOption);
    }
  }, []);

  // Save sort preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, sortBy);
  }, [sortBy]);

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDuplicateFinderModal, setShowDuplicateFinderModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState<UserGame | null>(null);

  // Scroll position preservation
  const savedScrollPosition = useRef<number>(0);

  // Load all games including hidden for client-side filtering
  const { userGames, loading, refreshData } = useDashboardData(true);

  const handleEditGame = (game: UserGame) => {
    // Save scroll position before opening modal
    savedScrollPosition.current = window.scrollY;
    setSelectedGame(game);
    setShowEditModal(true);
  };

  const handleDeleteGame = (game: UserGame) => {
    // Save scroll position before opening modal
    savedScrollPosition.current = window.scrollY;
    setSelectedGame(game);
    setShowDeleteModal(true);
  };

  const handleSuccess = async () => {
    await refreshData();
    // Restore scroll position after data refreshes
    requestAnimationFrame(() => {
      window.scrollTo(0, savedScrollPosition.current);
    });
  };

  // Filter and sort games using utility functions with memoization
  const sortedGames = useMemo(
    () =>
      filterAndSortGames(
        userGames,
        {
          showHiddenGames,
          selectedPlatforms,
          selectedPriorities,
          searchQuery,
          selectedSources,
          selectedConsoles,
        },
        sortBy
      ),
    [userGames, showHiddenGames, selectedPlatforms, selectedPriorities, searchQuery, selectedSources, selectedConsoles, sortBy]
  );

  // Check if any filters are active
  const hasActiveFilters = selectedPlatforms.length > 0 || selectedPriorities.length > 0 || selectedSources.length > 0 || selectedConsoles.length > 0;

  // Count games by source for the filter badges
  const sourceCounts = useMemo(() => {
    const counts: Record<SyncSourceId, number> = { all: 0, steam: 0, psn: 0, xbox: 0, epic: 0, manual: 0 };
    userGames.filter(g => !g.hidden || showHiddenGames).forEach(game => {
      const source = getGameSyncSource(game);
      counts[source]++;
      counts.all++;
    });
    return counts;
  }, [userGames, showHiddenGames]);

  // Stats - always include ALL games (including hidden) for accurate totals
  const totalGames = userGames.length;
  const nowPlayingCount = userGames.filter(g => g.status === 'playing').length;
  const completedCount = userGames.filter(g => g.status === 'completed' || g.status === '100_completed').length;
  const totalPlaytime = Math.round(userGames.reduce((acc, g) => acc + g.playtime_hours, 0));

  // Visible games count (for the filtered display)
  const visibleGames = userGames.filter(g => !g.hidden || showHiddenGames).length;
  const hiddenGamesCount = userGames.filter(g => g.hidden).length;

  return (
    <>
      {/* Animated background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                GAME LIBRARY
              </h1>
              <p className="text-gray-400 text-lg">
                Your complete collection across all platforms
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Add Game Button */}
              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-void font-semibold"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Game
              </Button>

              {/* Sync Service Dropdown */}
              <SyncServiceDropdown />

              {/* Find Duplicates Button */}
              <Button
                onClick={() => setShowDuplicateFinderModal(true)}
                variant="outline"
                className="border-steel text-gray-400 hover:text-white hover:border-purple-500"
              >
                <Copy className="w-4 h-4 mr-2" />
                Find Duplicates
              </Button>

              {/* View Toggle */}
              <div className="flex items-center gap-1 bg-deep border border-steel rounded-xl p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={viewMode === 'grid' ? 'bg-cyan-500 text-void hover:bg-cyan-400' : 'text-gray-400 hover:text-white'}
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={viewMode === 'list' ? 'bg-cyan-500 text-void hover:bg-cyan-400' : 'text-gray-400 hover:text-white'}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-deep border border-steel rounded-xl p-4">
            <div className="text-3xl font-bold text-cyan-400">{totalGames}</div>
            <div className="text-sm text-gray-500">Total Games</div>
          </div>
          <div className="bg-deep border border-steel rounded-xl p-4">
            <div className="text-3xl font-bold text-purple-400">{nowPlayingCount}</div>
            <div className="text-sm text-gray-500">Now Playing</div>
          </div>
          <div className="bg-deep border border-steel rounded-xl p-4">
            <div className="text-3xl font-bold text-emerald-400">{completedCount}</div>
            <div className="text-sm text-gray-500">Completed</div>
          </div>
          <div className="bg-deep border border-steel rounded-xl p-4">
            <div className="text-3xl font-bold text-cyan-400">{totalPlaytime}h</div>
            <div className="text-sm text-gray-500">Total Playtime</div>
          </div>
        </div>

        {/* Unified Filter Bar */}
        <div className="bg-deep/50 backdrop-blur-sm border border-steel rounded-2xl p-4 mb-6">
          {/* Top Row: Search + Sort + Hidden/Censor Toggles */}
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
                  <option value="release-newest">Release ↓</option>
                  <option value="release-oldest">Release ↑</option>
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
              <button
                onClick={() => setShowHiddenGames(!showHiddenGames)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  showHiddenGames
                    ? 'bg-purple-500/20 text-purple-400 ring-1 ring-purple-500/50'
                    : 'bg-abyss/80 border border-steel/50 text-gray-400 hover:text-white hover:border-steel'
                }`}
                title={showHiddenGames ? 'Hide private games' : 'Show private games'}
              >
                {showHiddenGames ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>

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
                {selectedPlatforms.length > 0 && (
                  <span className="text-[10px] text-cyan-400 font-medium">({selectedPlatforms.length})</span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {LIBRARY_FILTER_PLATFORMS.filter(p => p !== 'All').map((platform) => {
                  const isSelected = selectedPlatforms.includes(platform);
                  return (
                    <button
                      key={platform}
                      onClick={() => togglePlatform(platform)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-cyan-500 text-void shadow-lg shadow-cyan-500/20'
                          : 'bg-abyss/60 text-gray-400 hover:text-white hover:bg-slate/60'
                      }`}
                    >
                      {platform}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Priority Selector */}
            <div className="sm:w-auto sm:min-w-[200px]">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</span>
                {selectedPriorities.length > 0 && (
                  <span className="text-[10px] text-cyan-400 font-medium">({selectedPriorities.length})</span>
                )}
              </div>
              <div className="flex gap-1.5">
                {PRIORITY_OPTIONS.filter(p => p.id !== 'all').map((priority) => {
                  const Icon = priority.icon;
                  const isSelected = selectedPriorities.includes(priority.id);
                  return (
                    <button
                      key={priority.id}
                      onClick={() => togglePriority(priority.id)}
                      className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        isSelected
                          ? priority.activeClass
                          : 'bg-abyss/60 text-gray-400 hover:text-white hover:bg-slate/60'
                      }`}
                      title={priority.label}
                    >
                      {Icon && <Icon className={`w-3.5 h-3.5 ${isSelected ? '' : 'opacity-60'}`} />}
                      <span className="hidden sm:inline">{priority.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sync Source Filter */}
          <div className="mt-4 pt-4 border-t border-steel/30">
            <div className="flex items-center gap-2 mb-3">
              <Link2 className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Synced From</span>
              {selectedSources.length > 0 && (
                <span className="text-[10px] text-cyan-400 font-medium">({selectedSources.length})</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {SYNC_SOURCE_OPTIONS.filter(s => s.id !== 'all').map((source) => {
                const sourceId = source.id as Exclude<SyncSourceId, 'all'>;
                const isSelected = selectedSources.includes(sourceId);
                const count = sourceCounts[sourceId];
                const hasGames = count > 0;

                // Platform-specific styling
                const getSourceStyle = () => {
                  if (!isSelected) return 'bg-abyss/60 text-gray-400 hover:text-white hover:bg-slate/60 border-transparent';
                  switch (sourceId) {
                    case 'steam': return 'bg-gradient-to-r from-sky-500/20 to-sky-600/20 text-sky-400 border-sky-500/50 shadow-lg shadow-sky-500/10';
                    case 'psn': return 'bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-400 border-blue-500/50 shadow-lg shadow-blue-500/10';
                    case 'xbox': return 'bg-gradient-to-r from-green-500/20 to-green-600/20 text-green-400 border-green-500/50 shadow-lg shadow-green-500/10';
                    case 'epic': return 'bg-gradient-to-r from-gray-500/20 to-gray-600/20 text-gray-300 border-gray-500/50 shadow-lg shadow-gray-500/10';
                    case 'manual': return 'bg-gradient-to-r from-purple-500/20 to-purple-600/20 text-purple-400 border-purple-500/50 shadow-lg shadow-purple-500/10';
                    default: return 'bg-cyan-500 text-void border-cyan-500 shadow-lg shadow-cyan-500/20';
                  }
                };

                // Platform icons as SVG
                const SourceIcon = () => {
                  const iconClass = `w-4 h-4 ${isSelected ? '' : 'opacity-60'}`;
                  switch (source.icon) {
                    case 'steam':
                      return (
                        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                      );
                    case 'psn':
                      return (
                        <svg viewBox="0 0 24 24" className={iconClass} fill="currentColor">
                          <path d="M8.985 2.596v17.548l3.915 1.261V6.688c0-.69.304-1.151.794-.991.636.181.76.814.76 1.505v5.876c2.441 1.193 4.362-.002 4.362-3.153 0-3.237-1.126-4.675-4.438-5.827-1.307-.448-3.728-1.186-5.391-1.502h-.002zm4.656 16.242l6.296-2.275c.715-.258.826-.625.246-.818-.586-.192-1.637-.139-2.357.123l-4.205 1.5v-2.385l.24-.085s1.201-.42 2.913-.615c1.696-.18 3.792.03 5.437.661 1.848.596 2.063 1.473 1.597 2.085-.466.611-1.635 1.04-1.635 1.04l-8.532 3.047v-2.278zM1.004 18.241c-1.513-.453-1.775-1.396-1.08-1.985.654-.556 1.77-.96 1.77-.96l5.572-1.99v2.316l-4.049 1.446c-.715.257-.826.625-.247.817.587.193 1.637.14 2.358-.12l1.938-.707v2.068c-.127.026-.262.047-.39.07-1.765.286-3.655.078-5.872-.955z" />
                        </svg>
                      );
                    case 'xbox':
                      return (
                        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
                          <path d="M4.102 21.033C6.211 22.881 8.977 24 12 24c3.026 0 5.789-1.119 7.902-2.967 1.877-1.912-4.316-8.709-7.902-11.417-3.582 2.708-9.779 9.505-7.898 11.417zm11.16-14.406c2.5 2.961 7.484 10.313 6.076 12.912C23.056 17.036 24 14.62 24 12c0-5.238-3.354-9.691-8.024-11.33.039.071.076.142.108.219.492 1.161.825 2.426.978 3.738zm-6.532 0c.154-1.312.487-2.577.978-3.738.033-.077.07-.148.108-.219C5.354 2.309 2 6.762 2 12c0 2.62.944 5.036 2.662 6.539-1.408-2.599 3.576-9.951 6.068-12.912z"/>
                        </svg>
                      );
                    case 'epic':
                      return <span className={`text-sm font-black ${isSelected ? '' : 'opacity-60'}`}>E</span>;
                    case 'manual':
                      return (
                        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                        </svg>
                      );
                    default:
                      return null;
                  }
                };

                return (
                  <button
                    key={sourceId}
                    onClick={() => toggleSource(sourceId)}
                    disabled={!hasGames}
                    className={`
                      group relative flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold
                      transition-all duration-200 border
                      ${getSourceStyle()}
                      ${!hasGames ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                    title={`${source.label} (${count} games)`}
                  >
                    {source.icon && <SourceIcon />}
                    <span>{source.label}</span>
                    {count > 0 && (
                      <span className={`
                        ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold
                        ${isSelected ? 'bg-white/20' : 'bg-steel/50'}
                      `}>
                        {count}
                      </span>
                    )}
                    {/* Active indicator dot */}
                    {isSelected && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-current animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Console Filter - only show when PlayStation or Xbox is selected */}
          {(selectedPlatforms.some(p => p.toLowerCase().includes('playstation') || p.toLowerCase().includes('xbox')) ||
            selectedSources.includes('psn') || selectedSources.includes('xbox')) && (
            <div className="mt-4 pt-4 border-t border-steel/30">
              <div className="flex items-center gap-2 mb-3">
                <Monitor className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Console</span>
                {selectedConsoles.length > 0 && (
                  <span className="text-[10px] text-cyan-400 font-medium">({selectedConsoles.length})</span>
                )}
              </div>
              <ConsoleFilter
                userGames={userGames.filter(g => !g.hidden || showHiddenGames)}
                selectedConsoles={selectedConsoles}
                onToggleConsole={toggleConsole}
                selectedPlatforms={selectedPlatforms}
                selectedSources={selectedSources}
              />
            </div>
          )}

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-steel/30">
              <span className="text-xs text-gray-500">Active:</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedPlatforms.map(platform => (
                  <span key={platform} className="inline-flex items-center gap-1 px-2 py-1 bg-cyan-500/10 text-cyan-400 text-xs rounded-md">
                    {platform}
                    <button
                      onClick={() => togglePlatform(platform)}
                      className="hover:text-cyan-300 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {selectedConsoles.map(console => {
                  const generation = CONSOLE_GENERATIONS.find(g => g.consoles.some(c => c.id === console));
                  return (
                    <span key={console} className="inline-flex items-center gap-1 px-2 py-1 bg-cyan-500/10 text-cyan-400 text-xs rounded-md font-mono">
                      <Monitor className="w-3 h-3" />
                      {generation?.icon} {console}
                      <button
                        onClick={() => toggleConsole(console)}
                        className="hover:text-cyan-300 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
                {selectedPriorities.map(priority => {
                  const priorityInfo = PRIORITY_OPTIONS.find(p => p.id === priority);
                  const PriorityIcon = priorityInfo?.icon;
                  return (
                    <span key={priority} className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md ${
                      priority === 'high' ? 'bg-red-500/10 text-red-400' :
                      priority === 'medium' ? 'bg-yellow-500/10 text-yellow-400' :
                      'bg-blue-500/10 text-blue-400'
                    }`}>
                      {PriorityIcon && <PriorityIcon className="w-3 h-3" />}
                      {priorityInfo?.label}
                      <button
                        onClick={() => togglePriority(priority)}
                        className="hover:opacity-70 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
                {selectedSources.map(source => {
                  const sourceInfo = SYNC_SOURCE_OPTIONS.find(s => s.id === source);
                  return (
                    <span key={source} className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md ${
                      source === 'steam' ? 'bg-sky-500/10 text-sky-400' :
                      source === 'psn' ? 'bg-blue-500/10 text-blue-400' :
                      source === 'xbox' ? 'bg-green-500/10 text-green-400' :
                      source === 'epic' ? 'bg-gray-500/10 text-gray-400' :
                      'bg-purple-500/10 text-purple-400'
                    }`}>
                      <Link2 className="w-3 h-3" />
                      {sourceInfo?.label}
                      <button
                        onClick={() => toggleSource(source)}
                        className="hover:opacity-70 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
              <button
                onClick={() => {
                  setSelectedPlatforms([]);
                  setSelectedPriorities([]);
                  setSelectedSources([]);
                  setSelectedConsoles([]);
                }}
                className="ml-auto text-xs text-gray-500 hover:text-white transition-colors"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-400">
            Showing <span className="text-cyan-400 font-bold">{sortedGames.length}</span> of{' '}
            <span className="text-white font-bold">{totalGames}</span> games
            {hasActiveFilters && ' (filtered)'}
            {hiddenGamesCount > 0 && !showHiddenGames && (
              <span className="text-purple-400 ml-2">
                • {hiddenGamesCount} hidden
              </span>
            )}
          </p>
        </div>

        {/* Game Grid/List */}
        {loading ? (
          <div className="text-center py-20">
            <Library className="w-16 h-16 text-cyan-400 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-500">Loading your library...</p>
          </div>
        ) : sortedGames.length === 0 ? (
          <div className="text-center py-20 bg-deep border border-steel rounded-xl">
            <Library className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">
              {userGames.length === 0 ? 'Your library is empty' : 'No games found'}
            </p>
            {userGames.length === 0 ? (
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-void font-semibold rounded-lg transition-colors"
              >
                Add Your First Game
              </button>
            ) : (
              <p className="text-sm text-gray-600">Try adjusting your filters</p>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {sortedGames.map((userGame, index) => (
              <GameCard
                key={userGame.id}
                game={userGame}
                index={index}
                onEdit={() => handleEditGame(userGame)}
                onDelete={() => handleDeleteGame(userGame)}
                censorHidden={censorHidden}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {sortedGames.map((userGame, index) => (
              <GameListItem
                key={userGame.id}
                game={userGame}
                index={index}
                onEdit={() => handleEditGame(userGame)}
                onDelete={() => handleDeleteGame(userGame)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Game Modal */}
      <GameFormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleSuccess}
        mode="add"
      />

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

      {/* Duplicate Finder Modal */}
      <DuplicateFinderModal
        isOpen={showDuplicateFinderModal}
        onClose={() => setShowDuplicateFinderModal(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
}
