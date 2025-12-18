'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Library, Grid3x3, List, Search, ArrowUpDown, Eye, EyeOff, Flame, Clock, Coffee, Gamepad2, X, ShieldOff, Shield, Plus, Copy, Link2, ChevronDown, Pencil, Disc, Monitor } from 'lucide-react';
import { SteamLogo, PlayStationLogo, XboxLogo, EpicLogo, NintendoLogo, GOGLogo, EALogo, BattleNetLogo, UbisoftLogo, WindowsLogo } from '@/components/icons/PlatformLogos';
import { useDashboardData } from '@/lib/hooks';
import { GameCard } from '@/components/dashboard/cards/GameCard';
import { GameListItem } from '@/components/dashboard/cards/GameListItem';
import { GameFormModal, DeleteConfirmModal, DuplicateFinderModal } from '@/components/modals';
import { SyncServiceDropdown } from '@/components/library/SyncServiceDropdown';
import { ConsoleFilter } from '@/components/library/ConsoleFilter';
import { filterAndSortGames, getGameSyncSource } from '@/lib/utils';
import { LIBRARY_FILTER_PLATFORMS, SYNC_SOURCE_OPTIONS, CONSOLE_GENERATIONS, type SortOption, type SyncSourceId } from '@/lib/constants/platforms';
import type { UserGame } from '@/lib/actions/games';

type ViewMode = 'grid' | 'list';

const STORAGE_KEY = 'game-hub-library-sort';

const PRIORITY_OPTIONS = [
  { id: 'all', label: 'All Priorities', icon: null, color: '', activeClass: 'bg-white/10 text-white' },
  { id: 'high', label: 'High', icon: Flame, color: 'text-red-400', activeClass: 'bg-red-500/20 text-red-400 border-red-500/30' },
  { id: 'medium', label: 'Medium', icon: Clock, color: 'text-amber-400', activeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { id: 'low', label: 'Low', icon: Coffee, color: 'text-blue-400', activeClass: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
] as const;

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
  const [showFilters, setShowFilters] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]
    );
  };

  const togglePriority = (priority: string) => {
    setSelectedPriorities(prev =>
      prev.includes(priority) ? prev.filter(p => p !== priority) : [...prev, priority]
    );
  };

  const toggleSource = (source: SyncSourceId) => {
    setSelectedSources(prev =>
      prev.includes(source) ? prev.filter(s => s !== source) : [...prev, source]
    );
  };

  const toggleConsole = (console: string) => {
    setSelectedConsoles(prev =>
      prev.includes(console) ? prev.filter(c => c !== console) : [...prev, console]
    );
  };

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && ['title-asc', 'title-desc', 'recent', 'release-newest', 'release-oldest', 'priority-high', 'priority-low', 'completion-desc', 'completion-asc', 'playtime-desc', 'playtime-asc'].includes(stored)) {
      setSortBy(stored as SortOption);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, sortBy);
  }, [sortBy]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDuplicateFinderModal, setShowDuplicateFinderModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState<UserGame | null>(null);

  const savedScrollPosition = useRef<number>(0);
  const { userGames, loading, refreshData } = useDashboardData(true);

  const handleEditGame = (game: UserGame) => {
    savedScrollPosition.current = window.scrollY;
    setSelectedGame(game);
    setShowEditModal(true);
  };

  const handleDeleteGame = (game: UserGame) => {
    savedScrollPosition.current = window.scrollY;
    setSelectedGame(game);
    setShowDeleteModal(true);
  };

  const handleSuccess = async () => {
    await refreshData();
    requestAnimationFrame(() => {
      window.scrollTo(0, savedScrollPosition.current);
    });
  };

  const sortedGames = useMemo(
    () =>
      filterAndSortGames(
        userGames,
        { showHiddenGames, selectedPlatforms, selectedPriorities, searchQuery, selectedSources, selectedConsoles },
        sortBy
      ),
    [userGames, showHiddenGames, selectedPlatforms, selectedPriorities, searchQuery, selectedSources, selectedConsoles, sortBy]
  );

  const hasActiveFilters = selectedPlatforms.length > 0 || selectedPriorities.length > 0 || selectedSources.length > 0 || selectedConsoles.length > 0;

  const sourceCounts = useMemo(() => {
    const counts: Record<SyncSourceId, number> = { all: 0, steam: 0, psn: 0, xbox: 0, epic: 0, manual: 0 };
    userGames.filter(g => !g.hidden || showHiddenGames).forEach(game => {
      const source = getGameSyncSource(game);
      counts[source]++;
      counts.all++;
    });
    return counts;
  }, [userGames, showHiddenGames]);

  const totalGames = userGames.length;
  const nowPlayingCount = userGames.filter(g => g.status === 'playing').length;
  const completedCount = userGames.filter(g => g.status === 'completed' || g.status === 'finished').length;
  const totalPlaytime = Math.round(userGames.reduce((acc, g) => acc + g.playtime_hours, 0));
  const hiddenGamesCount = userGames.filter(g => g.hidden).length;

  return (
    <div className="relative min-h-screen bg-void">
      {/* Ambient glow orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div
          className="absolute -top-40 right-1/4 w-[600px] h-[600px] rounded-full blur-[120px] animate-breathe"
          style={{ background: 'radial-gradient(circle, rgba(34, 211, 238, 0.03) 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-1/4 -left-40 w-[500px] h-[500px] rounded-full blur-[120px] animate-breathe"
          style={{
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.03) 0%, transparent 70%)',
            animationDelay: '2s'
          }}
        />
      </div>

      <div className={`relative transition-all duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-white/[0.04] bg-abyss/80 backdrop-blur-xl">
          <div className="px-8 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                    <Library className="w-6 h-6 text-cyan-400" />
                  </div>
                  {/* HUD corners */}
                  <div className="absolute -top-1 -left-1 w-2 h-2 border-l-2 border-t-2 border-cyan-400/50" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 border-r-2 border-t-2 border-cyan-400/50" />
                  <div className="absolute -bottom-1 -left-1 w-2 h-2 border-l-2 border-b-2 border-cyan-400/50" />
                  <div className="absolute -bottom-1 -right-1 w-2 h-2 border-r-2 border-b-2 border-cyan-400/50" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider block mb-1">
                    // GAME_LIBRARY
                  </span>
                  <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-family-display)]">LIBRARY</h1>
                </div>
                <span className="px-3 py-1.5 text-xs font-mono text-cyan-400/80 bg-cyan-400/10 border border-cyan-400/20 rounded-lg">
                  {totalGames} games
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Add Game */}
                <button
                  onClick={() => setShowAddModal(true)}
                  className="group relative flex items-center gap-2 px-5 py-2.5 overflow-hidden rounded-xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-violet-600 opacity-90 group-hover:opacity-100 transition-opacity" />
                  <Plus className="relative w-4 h-4 text-white" />
                  <span className="relative text-sm font-semibold text-white uppercase tracking-wide font-[family-name:var(--font-family-display)]">Add Game</span>
                </button>

                {/* Sync Dropdown */}
                <SyncServiceDropdown />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="px-8 py-6">
          {/* Stats Bar */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <Gamepad2 className="w-4 h-4 text-white/20" />
              <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider">// LIBRARY_STATS</span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>
            <div className="grid grid-cols-4 gap-4">
              <StatBox label="Total Games" value={totalGames.toString()} color="cyan" />
              <StatBox label="Now Playing" value={nowPlayingCount.toString()} color="violet" />
              <StatBox label="Completed" value={completedCount.toString()} color="emerald" />
              <StatBox label="Hours Played" value={`${totalPlaytime}h`} color="amber" />
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <Search className="w-4 h-4 text-white/20" />
              <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider">// SEARCH_FILTER</span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>
            <div className="relative bg-abyss border border-white/[0.06] rounded-2xl p-4 overflow-hidden">
              {/* HUD corners */}
              <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-cyan-400/20" />
              <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-cyan-400/20" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-cyan-400/20" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-cyan-400/20" />

              {/* Top row: Search + Controls */}
              <div className="relative flex flex-col lg:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="text"
                    placeholder="Search games..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400/30 focus:bg-white/[0.05] transition-all font-mono"
                  />
                </div>

              {/* Controls */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Sort */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="appearance-none bg-white/[0.03] border border-white/[0.06] rounded-xl pl-4 pr-9 py-3 text-sm text-white/70 focus:outline-none focus:border-white/[0.12] transition-all cursor-pointer hover:text-white"
                  >
                    <option value="title-asc">A → Z</option>
                    <option value="title-desc">Z → A</option>
                    <option value="recent">Recent</option>
                    <option value="release-newest">Release ↓</option>
                    <option value="release-oldest">Release ↑</option>
                    <option value="priority-high">Priority ↑</option>
                    <option value="priority-low">Priority ↓</option>
                    <option value="completion-desc">Complete ↑</option>
                    <option value="playtime-desc">Playtime ↑</option>
                  </select>
                  <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
                </div>

                {/* Filters toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm transition-all ${
                    showFilters || hasActiveFilters
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                      : 'bg-white/[0.03] border border-white/[0.06] text-white/60 hover:text-white hover:border-white/[0.12]'
                  }`}
                >
                  <Gamepad2 className="w-4 h-4" />
                  Filters
                  {hasActiveFilters && (
                    <span className="px-1.5 py-0.5 text-[10px] font-medium bg-cyan-500/20 rounded">
                      {selectedPlatforms.length + selectedPriorities.length + selectedSources.length + selectedConsoles.length}
                    </span>
                  )}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </button>

                {/* Hidden toggle */}
                <button
                  onClick={() => setShowHiddenGames(!showHiddenGames)}
                  className={`p-3 rounded-xl transition-all ${
                    showHiddenGames
                      ? 'bg-violet-500/10 text-violet-400 border border-violet-500/30'
                      : 'bg-white/[0.03] border border-white/[0.06] text-white/40 hover:text-white hover:border-white/[0.12]'
                  }`}
                  title={showHiddenGames ? 'Hide private games' : 'Show private games'}
                >
                  {showHiddenGames ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>

                {/* Censor toggle */}
                {showHiddenGames && (
                  <button
                    onClick={() => setCensorHidden(!censorHidden)}
                    className={`p-3 rounded-xl transition-all ${
                      censorHidden
                        ? 'bg-violet-500/10 text-violet-400 border border-violet-500/30'
                        : 'bg-white/[0.03] border border-white/[0.06] text-white/40 hover:text-white hover:border-white/[0.12]'
                    }`}
                    title={censorHidden ? 'Show hidden covers' : 'Blur hidden covers'}
                  >
                    {censorHidden ? <Shield className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>

            {/* Expandable Filters */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-white/[0.04] space-y-5">
                {/* Platform Filter */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Gamepad2 className="w-3.5 h-3.5 text-white/30" />
                    <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Platform</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {LIBRARY_FILTER_PLATFORMS.filter(p => p !== 'All').map((platform) => {
                      const isSelected = selectedPlatforms.includes(platform);

                      const getPlatformStyle = () => {
                        switch (platform) {
                          case 'Steam': return isSelected
                            ? 'bg-[#1b2838]/40 text-white border-[#66c0f4]/40'
                            : 'bg-white/[0.03] text-white border-[#66c0f4]/20 hover:border-[#66c0f4]/40';
                          case 'PlayStation': return isSelected
                            ? 'bg-[#003791]/30 text-white border-[#0070cc]/40'
                            : 'bg-white/[0.03] text-white border-[#0070cc]/20 hover:border-[#0070cc]/40';
                          case 'Xbox': return isSelected
                            ? 'bg-[#107c10]/30 text-white border-[#52b043]/40'
                            : 'bg-white/[0.03] text-white border-[#52b043]/20 hover:border-[#52b043]/40';
                          case 'Nintendo': return isSelected
                            ? 'bg-[#e60012]/20 text-white border-[#e60012]/40'
                            : 'bg-white/[0.03] text-white border-[#e60012]/20 hover:border-[#e60012]/40';
                          case 'Epic Games': return isSelected
                            ? 'bg-white/10 text-white border-white/30'
                            : 'bg-white/[0.03] text-white border-white/10 hover:border-white/20';
                          case 'GOG': return isSelected
                            ? 'bg-[#86328a]/30 text-white border-[#a358ff]/40'
                            : 'bg-white/[0.03] text-white border-[#a358ff]/20 hover:border-[#a358ff]/40';
                          case 'EA App': return isSelected
                            ? 'bg-[#ff4747]/20 text-white border-[#ff4747]/40'
                            : 'bg-white/[0.03] text-white border-[#ff4747]/20 hover:border-[#ff4747]/40';
                          case 'Battle.net': return isSelected
                            ? 'bg-[#00aeff]/20 text-white border-[#00aeff]/40'
                            : 'bg-white/[0.03] text-white border-[#00aeff]/20 hover:border-[#00aeff]/40';
                          case 'Ubisoft Connect': return isSelected
                            ? 'bg-[#0070ff]/20 text-white border-[#0070ff]/40'
                            : 'bg-white/[0.03] text-white border-[#0070ff]/20 hover:border-[#0070ff]/40';
                          case 'Windows': return isSelected
                            ? 'bg-[#0078d4]/20 text-white border-[#0078d4]/40'
                            : 'bg-white/[0.03] text-white border-[#0078d4]/20 hover:border-[#0078d4]/40';
                          case 'Physical': return isSelected
                            ? 'bg-amber-500/20 text-white border-amber-500/40'
                            : 'bg-white/[0.03] text-white border-amber-500/20 hover:border-amber-500/40';
                          default: return isSelected
                            ? 'bg-cyan-500/20 text-white border-cyan-500/40'
                            : 'bg-white/[0.03] text-white border-white/[0.08] hover:border-white/[0.15]';
                        }
                      };

                      const getPlatformLogo = () => {
                        switch (platform) {
                          case 'Steam': return <SteamLogo size="sm" className={isSelected ? 'text-[#66c0f4]' : 'text-[#66c0f4]/60'} />;
                          case 'PlayStation': return <PlayStationLogo size="sm" className={isSelected ? 'text-[#0070cc]' : 'text-[#0070cc]/60'} />;
                          case 'Xbox': return <XboxLogo size="sm" className={isSelected ? 'text-[#52b043]' : 'text-[#52b043]/60'} />;
                          case 'Nintendo': return <NintendoLogo size="sm" className={isSelected ? 'text-[#e60012]' : 'text-[#e60012]/60'} />;
                          case 'Epic Games': return <EpicLogo size="sm" className={isSelected ? 'text-white' : 'text-white/50'} />;
                          case 'GOG': return <GOGLogo size="sm" className={isSelected ? 'text-[#a358ff]' : 'text-[#a358ff]/60'} />;
                          case 'EA App': return <EALogo size="sm" className={isSelected ? 'text-[#ff4747]' : 'text-[#ff4747]/60'} />;
                          case 'Battle.net': return <BattleNetLogo size="sm" className={isSelected ? 'text-[#00aeff]' : 'text-[#00aeff]/60'} />;
                          case 'Ubisoft Connect': return <UbisoftLogo size="sm" className={isSelected ? 'text-[#0070ff]' : 'text-[#0070ff]/60'} />;
                          case 'Windows': return <WindowsLogo size="sm" className={isSelected ? 'text-[#0078d4]' : 'text-[#0078d4]/60'} />;
                          case 'Physical': return <Disc className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-400' : 'text-amber-400/60'}`} />;
                          default: return null;
                        }
                      };

                      return (
                        <button
                          key={platform}
                          onClick={() => togglePlatform(platform)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${getPlatformStyle()}`}
                        >
                          {getPlatformLogo()}
                          {platform}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Priority Filter */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Flame className="w-3.5 h-3.5 text-white/30" />
                    <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Priority</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {PRIORITY_OPTIONS.filter(p => p.id !== 'all').map((priority) => {
                      const Icon = priority.icon;
                      const isSelected = selectedPriorities.includes(priority.id);

                      const getPriorityStyle = () => {
                        switch (priority.id) {
                          case 'high': return isSelected
                            ? 'bg-red-500/20 text-white border-red-500/40'
                            : 'bg-white/[0.03] text-white border-red-500/20 hover:border-red-500/40';
                          case 'medium': return isSelected
                            ? 'bg-amber-500/20 text-white border-amber-500/40'
                            : 'bg-white/[0.03] text-white border-amber-500/20 hover:border-amber-500/40';
                          case 'low': return isSelected
                            ? 'bg-blue-500/20 text-white border-blue-500/40'
                            : 'bg-white/[0.03] text-white border-blue-500/20 hover:border-blue-500/40';
                          default: return 'bg-white/[0.03] text-white border-white/[0.08] hover:border-white/[0.15]';
                        }
                      };

                      const getPriorityIconColor = () => {
                        switch (priority.id) {
                          case 'high': return isSelected ? 'text-red-400' : 'text-red-400/60';
                          case 'medium': return isSelected ? 'text-amber-400' : 'text-amber-400/60';
                          case 'low': return isSelected ? 'text-blue-400' : 'text-blue-400/60';
                          default: return 'text-white/40';
                        }
                      };

                      return (
                        <button
                          key={priority.id}
                          onClick={() => togglePriority(priority.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${getPriorityStyle()}`}
                        >
                          {Icon && <Icon className={`w-3.5 h-3.5 ${getPriorityIconColor()}`} />}
                          {priority.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Source Filter */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Link2 className="w-3.5 h-3.5 text-white/30" />
                    <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Synced From</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {SYNC_SOURCE_OPTIONS.filter(s => s.id !== 'all').map((source) => {
                      const sourceId = source.id as Exclude<SyncSourceId, 'all'>;
                      const isSelected = selectedSources.includes(sourceId);
                      const count = sourceCounts[sourceId];
                      const hasGames = count > 0;

                      const getSourceStyle = () => {
                        switch (sourceId) {
                          case 'steam': return isSelected
                            ? 'bg-[#1b2838]/40 text-white border-[#66c0f4]/40'
                            : 'bg-white/[0.03] text-white border-[#66c0f4]/20 hover:border-[#66c0f4]/40';
                          case 'psn': return isSelected
                            ? 'bg-[#003791]/30 text-white border-[#0070cc]/40'
                            : 'bg-white/[0.03] text-white border-[#0070cc]/20 hover:border-[#0070cc]/40';
                          case 'xbox': return isSelected
                            ? 'bg-[#107c10]/30 text-white border-[#52b043]/40'
                            : 'bg-white/[0.03] text-white border-[#52b043]/20 hover:border-[#52b043]/40';
                          case 'epic': return isSelected
                            ? 'bg-white/10 text-white border-white/30'
                            : 'bg-white/[0.03] text-white border-white/10 hover:border-white/20';
                          case 'manual': return isSelected
                            ? 'bg-[#701a75]/30 text-white border-[#e879f9]/60'
                            : 'bg-white/[0.03] text-white border-[#e879f9]/35 hover:border-[#e879f9]/60';
                          default: return isSelected
                            ? 'bg-cyan-500/20 text-white border-cyan-500/40'
                            : 'bg-white/[0.03] text-white border-white/[0.08] hover:border-white/[0.15]';
                        }
                      };

                      const getSourceLogo = () => {
                        switch (sourceId) {
                          case 'steam': return <SteamLogo size="sm" className={isSelected ? 'text-[#66c0f4]' : 'text-[#66c0f4]/60'} />;
                          case 'psn': return <PlayStationLogo size="sm" className={isSelected ? 'text-[#0070cc]' : 'text-[#0070cc]/60'} />;
                          case 'xbox': return <XboxLogo size="sm" className={isSelected ? 'text-[#52b043]' : 'text-[#52b043]/60'} />;
                          case 'epic': return <EpicLogo size="sm" className={isSelected ? 'text-white' : 'text-white/50'} />;
                          case 'manual': return <Pencil className="w-3.5 h-3.5" style={{ color: isSelected ? '#e879f9' : 'rgba(232, 121, 249, 0.6)' }} />;
                          default: return null;
                        }
                      };

                      return (
                        <button
                          key={sourceId}
                          onClick={() => toggleSource(sourceId)}
                          disabled={!hasGames}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${getSourceStyle()} ${!hasGames ? 'opacity-30 cursor-not-allowed' : ''}`}
                        >
                          {getSourceLogo()}
                          {source.label}
                          {count > 0 && (
                            <span className={`px-1.5 py-0.5 rounded text-[10px] ${isSelected ? 'bg-white/20' : 'bg-white/[0.06]'}`}>
                              {count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Console Filter */}
                {(selectedPlatforms.some(p => p.toLowerCase().includes('playstation') || p.toLowerCase().includes('xbox')) ||
                  selectedSources.includes('psn') || selectedSources.includes('xbox')) && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Monitor className="w-3.5 h-3.5 text-white/30" />
                      <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Console</span>
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

                {/* Active Filters */}
                {hasActiveFilters && (
                  <div className="flex items-center gap-2 pt-4 border-t border-white/[0.04]">
                    <span className="text-[10px] text-white/30 uppercase tracking-wider">Active:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedPlatforms.map(platform => (
                        <FilterTag key={platform} label={platform} onRemove={() => togglePlatform(platform)} />
                      ))}
                      {selectedConsoles.map(c => {
                        const gen = CONSOLE_GENERATIONS.find(g => g.consoles.some(con => con.id === c));
                        return <FilterTag key={c} label={`${gen?.icon || ''} ${c}`} onRemove={() => toggleConsole(c)} />;
                      })}
                      {selectedPriorities.map(p => {
                        const info = PRIORITY_OPTIONS.find(opt => opt.id === p);
                        return <FilterTag key={p} label={info?.label || p} onRemove={() => togglePriority(p)} />;
                      })}
                      {selectedSources.map(s => {
                        const info = SYNC_SOURCE_OPTIONS.find(opt => opt.id === s);
                        return <FilterTag key={s} label={info?.label || s} onRemove={() => toggleSource(s)} />;
                      })}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedPlatforms([]);
                        setSelectedPriorities([]);
                        setSelectedSources([]);
                        setSelectedConsoles([]);
                      }}
                      className="ml-auto text-[10px] font-mono text-white/30 hover:text-white/60 transition-colors uppercase tracking-wider"
                    >
                      Clear all
                    </button>
                  </div>
                )}
              </div>
            )}
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm font-mono text-white/40">
              <span className="text-[10px] text-white/30 uppercase tracking-wider">// RESULTS:</span>{' '}
              <span className="text-white font-medium">{sortedGames.length}</span> of {totalGames} games
              {hasActiveFilters && <span className="text-cyan-400/60"> (filtered)</span>}
              {hiddenGamesCount > 0 && !showHiddenGames && (
                <span className="text-violet-400/60 ml-2">• {hiddenGamesCount} hidden</span>
              )}
            </p>

            <div className="flex items-center gap-3">
              {/* Find Duplicates */}
              <button
                onClick={() => setShowDuplicateFinderModal(true)}
                className="group relative flex items-center gap-2 px-3 py-2 overflow-hidden rounded-lg transition-all duration-300 bg-white/[0.03] border border-violet-500/20 hover:border-violet-500/40"
                title="Find duplicate games"
              >
                <Copy className="w-4 h-4 text-violet-400/70 group-hover:text-violet-400 transition-colors" />
                <span className="hidden sm:inline text-xs font-medium text-white/50 group-hover:text-white/70 transition-colors">
                  Duplicates
                </span>
              </button>

              {/* View Toggle */}
              <div className="flex items-center gap-1 p-1 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-white/40 hover:text-white/70 border border-transparent'}`}
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-white/40 hover:text-white/70 border border-transparent'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Game Grid/List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative">
                <Library className="w-12 h-12 text-cyan-400/60 animate-pulse" />
                <div className="absolute inset-0 w-12 h-12 border-2 border-cyan-400/20 rounded-full animate-ping" />
              </div>
              <p className="mt-4 text-[11px] font-mono text-white/30 uppercase tracking-wider">// Loading library data...</p>
            </div>
          ) : sortedGames.length === 0 ? (
            <div className="relative flex flex-col items-center justify-center py-20 bg-abyss border border-white/[0.06] rounded-2xl overflow-hidden">
              {/* HUD corners */}
              <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-cyan-400/30" />
              <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-cyan-400/30" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-cyan-400/30" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-cyan-400/30" />

              <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider mb-4">// {userGames.length === 0 ? 'EMPTY_LIBRARY' : 'NO_RESULTS'}</span>
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4">
                <Library className="w-7 h-7 text-cyan-400" />
              </div>
              <p className="text-sm text-white/50 mb-2 font-[family-name:var(--font-family-display)]">
                {userGames.length === 0 ? 'YOUR LIBRARY IS EMPTY' : 'NO GAMES FOUND'}
              </p>
              {userGames.length === 0 ? (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="group relative mt-4 inline-flex items-center gap-2 px-6 py-3 overflow-hidden rounded-xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-violet-600 opacity-90 group-hover:opacity-100 transition-opacity" />
                  <span className="relative font-semibold text-white uppercase tracking-wide font-[family-name:var(--font-family-display)]">Add Your First Game</span>
                </button>
              ) : (
                <p className="text-xs font-mono text-white/30">Try adjusting your filters</p>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
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
            <div className="flex flex-col gap-3">
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
      </div>

      {/* Modals */}
      <GameFormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleSuccess}
        mode="add"
      />
      <GameFormModal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setSelectedGame(null); }}
        onSuccess={handleSuccess}
        mode="edit"
        userGame={selectedGame}
      />
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setSelectedGame(null); }}
        onSuccess={handleSuccess}
        userGame={selectedGame}
      />
      <DuplicateFinderModal
        isOpen={showDuplicateFinderModal}
        onClose={() => setShowDuplicateFinderModal(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: 'cyan' | 'violet' | 'emerald' | 'amber' }) {
  const colorMap = {
    cyan: { text: 'text-cyan-400', border: 'border-cyan-400/50' },
    violet: { text: 'text-violet-400', border: 'border-violet-400/50' },
    emerald: { text: 'text-emerald-400', border: 'border-emerald-400/50' },
    amber: { text: 'text-amber-400', border: 'border-amber-400/50' },
  };

  return (
    <div className="group relative bg-abyss border border-white/[0.06] rounded-xl p-4 hover:border-white/[0.1] transition-colors overflow-hidden">
      {/* Hover HUD corners */}
      <div className={`absolute top-0 left-0 w-2 h-2 border-l border-t ${colorMap[color].border} opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className={`absolute top-0 right-0 w-2 h-2 border-r border-t ${colorMap[color].border} opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className={`absolute bottom-0 left-0 w-2 h-2 border-l border-b ${colorMap[color].border} opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className={`absolute bottom-0 right-0 w-2 h-2 border-r border-b ${colorMap[color].border} opacity-0 group-hover:opacity-100 transition-opacity`} />

      <div className="relative">
        <div className={`text-2xl font-bold font-mono ${colorMap[color].text} tabular-nums`}>{value}</div>
        <div className="text-[10px] font-mono text-white/40 mt-1 uppercase tracking-wider">{label}</div>
      </div>
    </div>
  );
}

function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-mono font-medium rounded-md uppercase tracking-wider">
      {label}
      <button onClick={onRemove} className="hover:text-cyan-300 transition-colors">
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}
