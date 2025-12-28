'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Library, Grid3x3, List, Search, ArrowUpDown, Eye, EyeOff, Flame, Clock, Coffee, Gamepad2, ShieldOff, Shield, Copy, Link2, ChevronDown, Pencil, Disc, Monitor, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Layers } from 'lucide-react';
import { SteamLogo, PlayStationLogo, XboxLogo, EpicLogo, NintendoLogo, GOGLogo, EALogo, BattleNetLogo, UbisoftLogo, WindowsLogo } from '@/components/icons/PlatformLogos';
import { useDashboardData } from '@/lib/hooks';
import { GameCard } from '@/components/dashboard/cards/GameCard';
import { GameListItem } from '@/components/dashboard/cards/GameListItem';
import { GameFormModal, DeleteConfirmModal, DuplicateFinderModal } from '@/components/modals';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConsoleFilter } from '@/components/library/ConsoleFilter';
import { LibraryHeader } from '@/components/library/LibraryHeader';
import { StatBox } from '@/components/library/StatBox';
import { FilterTag } from '@/components/library/FilterTag';
import { filterAndSortGames, getGameSyncSource } from '@/lib/utils';
import { LIBRARY_FILTER_PLATFORMS, SYNC_SOURCE_OPTIONS, CONSOLE_GENERATIONS, type SortOption, type SyncSourceId } from '@/lib/constants/platforms';
import type { UserGame } from '@/lib/actions/games';

type ViewMode = 'grid' | 'list';

const STORAGE_KEY = 'game-hub-library-sort';
const STORAGE_KEY_PER_PAGE = 'game-hub-library-per-page';

const GAMES_PER_PAGE_OPTIONS = [
  { value: 20, label: '20 Games' },
  { value: 40, label: '40 Games' },
  { value: 80, label: '80 Games' },
] as const;

const PRIORITY_OPTIONS = [
  { id: 'all', label: 'All Priorities', icon: null, color: '', activeClass: 'bg-theme-active text-theme-primary' },
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
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [gamesPerPage, setGamesPerPage] = useState(20);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close sort menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setShowSortMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: 'title-asc', label: 'Name: A-Z' },
    { value: 'title-desc', label: 'Name: Z-A' },
    { value: 'recent', label: 'Recently Added' },
    { value: 'release-newest', label: 'Newest Release' },
    { value: 'release-oldest', label: 'Oldest Release' },
    { value: 'priority-high', label: 'High Priority' },
    { value: 'priority-low', label: 'Low Priority' },
    { value: 'completion-desc', label: 'Most Complete' },
    { value: 'playtime-desc', label: 'Most Played' },
  ];

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

  // Load gamesPerPage from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY_PER_PAGE);
    if (stored) {
      const parsed = parseInt(stored, 10);
      if ([20, 40, 80].includes(parsed)) {
        setGamesPerPage(parsed);
      }
    }
  }, []);

  // Save gamesPerPage to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PER_PAGE, gamesPerPage.toString());
  }, [gamesPerPage]);

  // Reset to page 1 when filters, search, or sorting changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedPlatforms, selectedPriorities, selectedSources, selectedConsoles, searchQuery, sortBy, showHiddenGames, gamesPerPage]);

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

  // Pagination calculations
  const totalPages = Math.ceil(sortedGames.length / gamesPerPage);
  const startIndex = (currentPage - 1) * gamesPerPage;
  const endIndex = startIndex + gamesPerPage;
  const paginatedGames = useMemo(
    () => sortedGames.slice(startIndex, endIndex),
    [sortedGames, startIndex, endIndex]
  );

  const goToPage = (page: number) => {
    const newPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

  // Exclude unowned games from stats (unless previously_owned) but keep them in the list for display
  const ownedGames = userGames.filter(g => g.ownership_status !== 'unowned' || g.previously_owned);
  const totalGames = ownedGames.length;
  const nowPlayingCount = ownedGames.filter(g => g.status === 'playing').length;
  const completedCount = ownedGames.filter(g => g.status === 'completed' || g.status === 'finished').length;
  // Use snapshot values when set, otherwise use synced values
  const totalPlaytime = Math.round(ownedGames.reduce((acc, g) => acc + (g.my_playtime_hours ?? g.playtime_hours), 0));
  const hiddenGamesCount = userGames.filter(g => g.hidden).length;

  return (
    <div className="relative min-h-screen bg-theme-primary">
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
        <LibraryHeader totalGames={totalGames} onAddGame={() => setShowAddModal(true)} />

        {/* Main Content */}
        <div className="px-8 py-6">
          {/* Stats Bar */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <Gamepad2 className="w-4 h-4 text-theme-subtle" />
              <span className="text-[10px] font-mono text-theme-subtle uppercase tracking-wider">// LIBRARY_STATS</span>
              <div className="flex-1 h-px bg-border" />
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
              <Search className="w-4 h-4 text-theme-subtle" />
              <span className="text-[10px] font-mono text-theme-subtle uppercase tracking-wider">// SEARCH_FILTER</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="relative bg-theme-secondary border border-theme rounded-2xl p-4">
              {/* HUD corners */}
              <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-cyan-400/20" />
              <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-cyan-400/20" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-cyan-400/20" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-cyan-400/20" />

              {/* Top row: Search + Controls */}
              <div className="relative flex flex-col lg:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-subtle" />
                  <input
                    type="text"
                    placeholder="Search games..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-theme-hover border border-theme rounded-xl pl-11 pr-4 py-3 text-sm text-theme-primary placeholder:text-theme-subtle focus:outline-hidden focus:border-cyan-400/30 focus:bg-theme-active transition-all font-mono"
                  />
                </div>

              {/* Controls */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Sort */}
                <div className="relative" ref={sortMenuRef}>
                  <button
                    onClick={() => setShowSortMenu(!showSortMenu)}
                    className={`group relative flex items-center gap-2 px-4 py-3 rounded-xl text-sm transition-all overflow-hidden ${
                      showSortMenu
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                        : 'bg-theme-hover border border-theme text-theme-muted hover:text-theme-primary hover:border-theme-hover'
                    }`}
                  >
                    {/* HUD corners */}
                    <div className={`absolute top-0 left-0 w-2 h-2 border-l border-t border-cyan-400/50 transition-opacity ${showSortMenu ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                    <div className={`absolute top-0 right-0 w-2 h-2 border-r border-t border-cyan-400/50 transition-opacity ${showSortMenu ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                    <div className={`absolute bottom-0 left-0 w-2 h-2 border-l border-b border-cyan-400/50 transition-opacity ${showSortMenu ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                    <div className={`absolute bottom-0 right-0 w-2 h-2 border-r border-b border-cyan-400/50 transition-opacity ${showSortMenu ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />

                    <ArrowUpDown className="w-3.5 h-3.5" />
                    <span className="font-medium">{SORT_OPTIONS.find(o => o.value === sortBy)?.label}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showSortMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Sort Dropdown */}
                  {showSortMenu && (
                    <div className="absolute top-full mt-2 right-0 z-100 min-w-[160px] bg-theme-secondary border border-theme rounded-xl shadow-xl overflow-hidden">
                      {/* HUD corners */}
                      <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-cyan-400/30" />
                      <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-cyan-400/30" />
                      <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-cyan-400/30" />
                      <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-cyan-400/30" />

                      <div className="py-1">
                        {SORT_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setSortBy(option.value);
                              setShowSortMenu(false);
                            }}
                            className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                              sortBy === option.value
                                ? 'bg-cyan-500/10 text-cyan-400'
                                : 'text-theme-secondary hover:bg-theme-hover hover:text-theme-primary'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Filters toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm transition-all ${
                    showFilters || hasActiveFilters
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                      : 'bg-theme-hover border border-theme text-theme-muted hover:text-theme-primary hover:border-theme-hover'
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
              </div>
            </div>

            {/* Expandable Filters */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-theme space-y-5">
                {/* Platform Filter */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Gamepad2 className="w-3.5 h-3.5 text-theme-subtle" />
                    <span className="text-[10px] font-medium text-theme-subtle uppercase tracking-wider">Platform</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {LIBRARY_FILTER_PLATFORMS.filter(p => p !== 'All').map((platform) => {
                      const isSelected = selectedPlatforms.includes(platform);

                      const getPlatformStyle = () => {
                        switch (platform) {
                          case 'Steam': return isSelected
                            ? 'bg-[#1b2838]/40 text-theme-primary border-[#66c0f4]/40'
                            : 'bg-theme-hover text-theme-secondary border-[#66c0f4]/20 hover:border-[#66c0f4]/40';
                          case 'PlayStation': return isSelected
                            ? 'bg-[#003791]/30 text-theme-primary border-[#0070cc]/40'
                            : 'bg-theme-hover text-theme-secondary border-[#0070cc]/20 hover:border-[#0070cc]/40';
                          case 'Xbox': return isSelected
                            ? 'bg-[#107c10]/30 text-theme-primary border-[#52b043]/40'
                            : 'bg-theme-hover text-theme-secondary border-[#52b043]/20 hover:border-[#52b043]/40';
                          case 'Nintendo': return isSelected
                            ? 'bg-[#e60012]/20 text-theme-primary border-[#e60012]/40'
                            : 'bg-theme-hover text-theme-secondary border-[#e60012]/20 hover:border-[#e60012]/40';
                          case 'Epic Games': return isSelected
                            ? 'bg-theme-active text-theme-primary border-theme-hover'
                            : 'bg-theme-hover text-theme-secondary border-theme hover:border-theme-hover';
                          case 'GOG': return isSelected
                            ? 'bg-[#86328a]/30 text-theme-primary border-[#a358ff]/40'
                            : 'bg-theme-hover text-theme-secondary border-[#a358ff]/20 hover:border-[#a358ff]/40';
                          case 'EA App': return isSelected
                            ? 'bg-[#ff4747]/20 text-theme-primary border-[#ff4747]/40'
                            : 'bg-theme-hover text-theme-secondary border-[#ff4747]/20 hover:border-[#ff4747]/40';
                          case 'Battle.net': return isSelected
                            ? 'bg-[#00aeff]/20 text-theme-primary border-[#00aeff]/40'
                            : 'bg-theme-hover text-theme-secondary border-[#00aeff]/20 hover:border-[#00aeff]/40';
                          case 'Ubisoft Connect': return isSelected
                            ? 'bg-[#0070ff]/20 text-theme-primary border-[#0070ff]/40'
                            : 'bg-theme-hover text-theme-secondary border-[#0070ff]/20 hover:border-[#0070ff]/40';
                          case 'Windows': return isSelected
                            ? 'bg-[#0078d4]/20 text-theme-primary border-[#0078d4]/40'
                            : 'bg-theme-hover text-theme-secondary border-[#0078d4]/20 hover:border-[#0078d4]/40';
                          case 'Physical': return isSelected
                            ? 'bg-amber-500/20 text-theme-primary border-amber-500/40'
                            : 'bg-theme-hover text-theme-secondary border-amber-500/20 hover:border-amber-500/40';
                          default: return isSelected
                            ? 'bg-cyan-500/20 text-theme-primary border-cyan-500/40'
                            : 'bg-theme-hover text-theme-secondary border-theme hover:border-theme-hover';
                        }
                      };

                      const getPlatformLogo = () => {
                        switch (platform) {
                          case 'Steam': return <SteamLogo size="sm" className={isSelected ? 'text-[#66c0f4]' : 'text-[#66c0f4]/60'} />;
                          case 'PlayStation': return <PlayStationLogo size="sm" className={isSelected ? 'text-[#0070cc]' : 'text-[#0070cc]/60'} />;
                          case 'Xbox': return <XboxLogo size="sm" className={isSelected ? 'text-[#52b043]' : 'text-[#52b043]/60'} />;
                          case 'Nintendo': return <NintendoLogo size="sm" className={isSelected ? 'text-[#e60012]' : 'text-[#e60012]/60'} />;
                          case 'Epic Games': return <EpicLogo size="sm" className={isSelected ? 'text-theme-primary' : 'text-theme-muted'} />;
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
                    <Flame className="w-3.5 h-3.5 text-theme-subtle" />
                    <span className="text-[10px] font-medium text-theme-subtle uppercase tracking-wider">Priority</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {PRIORITY_OPTIONS.filter(p => p.id !== 'all').map((priority) => {
                      const Icon = priority.icon;
                      const isSelected = selectedPriorities.includes(priority.id);

                      const getPriorityStyle = () => {
                        switch (priority.id) {
                          case 'high': return isSelected
                            ? 'bg-red-500/20 text-theme-primary border-red-500/40'
                            : 'bg-theme-hover text-theme-secondary border-red-500/20 hover:border-red-500/40';
                          case 'medium': return isSelected
                            ? 'bg-amber-500/20 text-theme-primary border-amber-500/40'
                            : 'bg-theme-hover text-theme-secondary border-amber-500/20 hover:border-amber-500/40';
                          case 'low': return isSelected
                            ? 'bg-blue-500/20 text-theme-primary border-blue-500/40'
                            : 'bg-theme-hover text-theme-secondary border-blue-500/20 hover:border-blue-500/40';
                          default: return 'bg-theme-hover text-theme-secondary border-theme hover:border-theme-hover';
                        }
                      };

                      const getPriorityIconColor = () => {
                        switch (priority.id) {
                          case 'high': return isSelected ? 'text-red-400' : 'text-red-400/60';
                          case 'medium': return isSelected ? 'text-amber-400' : 'text-amber-400/60';
                          case 'low': return isSelected ? 'text-blue-400' : 'text-blue-400/60';
                          default: return 'text-theme-subtle';
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
                    <Link2 className="w-3.5 h-3.5 text-theme-subtle" />
                    <span className="text-[10px] font-medium text-theme-subtle uppercase tracking-wider">Synced From</span>
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
                            ? 'bg-[#1b2838]/40 text-theme-primary border-[#66c0f4]/40'
                            : 'bg-theme-hover text-theme-secondary border-[#66c0f4]/20 hover:border-[#66c0f4]/40';
                          case 'psn': return isSelected
                            ? 'bg-[#003791]/30 text-theme-primary border-[#0070cc]/40'
                            : 'bg-theme-hover text-theme-secondary border-[#0070cc]/20 hover:border-[#0070cc]/40';
                          case 'xbox': return isSelected
                            ? 'bg-[#107c10]/30 text-theme-primary border-[#52b043]/40'
                            : 'bg-theme-hover text-theme-secondary border-[#52b043]/20 hover:border-[#52b043]/40';
                          case 'epic': return isSelected
                            ? 'bg-theme-active text-theme-primary border-theme-hover'
                            : 'bg-theme-hover text-theme-secondary border-theme hover:border-theme-hover';
                          case 'manual': return isSelected
                            ? 'bg-[#701a75]/30 text-theme-primary border-[#e879f9]/60'
                            : 'bg-theme-hover text-theme-secondary border-[#e879f9]/35 hover:border-[#e879f9]/60';
                          default: return isSelected
                            ? 'bg-cyan-500/20 text-theme-primary border-cyan-500/40'
                            : 'bg-theme-hover text-theme-secondary border-theme hover:border-theme-hover';
                        }
                      };

                      const getSourceLogo = () => {
                        switch (sourceId) {
                          case 'steam': return <SteamLogo size="sm" className={isSelected ? 'text-[#66c0f4]' : 'text-[#66c0f4]/60'} />;
                          case 'psn': return <PlayStationLogo size="sm" className={isSelected ? 'text-[#0070cc]' : 'text-[#0070cc]/60'} />;
                          case 'xbox': return <XboxLogo size="sm" className={isSelected ? 'text-[#52b043]' : 'text-[#52b043]/60'} />;
                          case 'epic': return <EpicLogo size="sm" className={isSelected ? 'text-theme-primary' : 'text-theme-muted'} />;
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
                            <span className={`px-1.5 py-0.5 rounded text-[10px] ${isSelected ? 'bg-theme-active' : 'bg-theme-hover'}`}>
                              {count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Console Filter */}
                {(selectedPlatforms.some(p => p.toLowerCase().includes('playstation') || p.toLowerCase().includes('xbox') || p.toLowerCase().includes('nintendo')) ||
                  selectedSources.includes('psn') || selectedSources.includes('xbox') || selectedSources.includes('manual')) && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Monitor className="w-3.5 h-3.5 text-theme-subtle" />
                      <span className="text-[10px] font-medium text-theme-subtle uppercase tracking-wider">Console</span>
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

                {/* Visibility Filter */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <EyeOff className="w-3.5 h-3.5 text-theme-subtle" />
                    <span className="text-[10px] font-medium text-theme-subtle uppercase tracking-wider">Visibility</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setShowHiddenGames(!showHiddenGames)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                        showHiddenGames
                          ? 'bg-violet-500/20 text-theme-primary border-violet-500/40'
                          : 'bg-theme-hover text-theme-secondary border-violet-500/20 hover:border-violet-500/40'
                      }`}
                    >
                      {showHiddenGames ? (
                        <Eye className="w-3.5 h-3.5 text-violet-400" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5 text-violet-400/60" />
                      )}
                      Show Private
                    </button>

                    {showHiddenGames && (
                      <button
                        onClick={() => setCensorHidden(!censorHidden)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                          censorHidden
                            ? 'bg-violet-500/20 text-theme-primary border-violet-500/40'
                            : 'bg-theme-hover text-theme-secondary border-violet-500/20 hover:border-violet-500/40'
                        }`}
                      >
                        {censorHidden ? (
                          <Shield className="w-3.5 h-3.5 text-violet-400" />
                        ) : (
                          <ShieldOff className="w-3.5 h-3.5 text-violet-400/60" />
                        )}
                        Blur Covers
                      </button>
                    )}
                  </div>
                </div>

                {/* Active Filters */}
                {hasActiveFilters && (
                  <div className="flex items-center gap-2 pt-4 border-t border-theme">
                    <span className="text-[10px] text-theme-subtle uppercase tracking-wider">Active:</span>
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
                      className="ml-auto text-[10px] font-mono text-theme-subtle hover:text-theme-muted transition-colors uppercase tracking-wider"
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
            <p className="text-sm font-mono text-theme-subtle">
              <span className="text-[10px] text-theme-subtle uppercase tracking-wider">// RESULTS:</span>{' '}
              <span className="text-theme-primary font-medium">{sortedGames.length}</span> of {totalGames} games
              {hasActiveFilters && <span className="text-cyan-400/60"> (filtered)</span>}
              {hiddenGamesCount > 0 && !showHiddenGames && (
                <span className="text-violet-400/60 ml-2">• {hiddenGamesCount} hidden</span>
              )}
            </p>

            <div className="flex items-center gap-3">
              {/* Find Duplicates */}
              <button
                onClick={() => setShowDuplicateFinderModal(true)}
                className="group relative flex items-center gap-2 px-3 py-2 overflow-hidden rounded-lg transition-all duration-300 bg-theme-hover border border-violet-500/20 hover:border-violet-500/40"
                title="Find duplicate games"
              >
                <Copy className="w-4 h-4 text-violet-400/70 group-hover:text-violet-400 transition-colors" />
                <span className="hidden sm:inline text-xs font-medium text-theme-muted group-hover:text-theme-secondary transition-colors">
                  Duplicates
                </span>
              </button>

              {/* Games Per Page Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="group relative flex items-center gap-2 px-3 py-2 overflow-hidden rounded-lg transition-all duration-300 bg-theme-hover border border-theme hover:border-cyan-500/30">
                    {/* HUD corners */}
                    <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-cyan-400/0 group-hover:border-cyan-400/50 transition-all" />
                    <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-cyan-400/0 group-hover:border-cyan-400/50 transition-all" />
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-cyan-400/0 group-hover:border-cyan-400/50 transition-all" />
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-cyan-400/0 group-hover:border-cyan-400/50 transition-all" />

                    <Layers className="w-4 h-4 text-cyan-400/70 group-hover:text-cyan-400 transition-colors" />
                    <span className="text-xs font-mono font-medium text-theme-muted group-hover:text-theme-primary transition-colors">
                      {gamesPerPage}
                    </span>
                    <ChevronDown className="w-3 h-3 text-theme-subtle group-hover:text-theme-muted transition-colors" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="min-w-[120px] bg-theme-secondary border border-theme rounded-xl overflow-hidden shadow-xl shadow-black/20"
                >
                  {/* HUD corners for dropdown */}
                  <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-cyan-400/30 pointer-events-none" />
                  <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-cyan-400/30 pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-cyan-400/30 pointer-events-none" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-cyan-400/30 pointer-events-none" />

                  {GAMES_PER_PAGE_OPTIONS.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => setGamesPerPage(option.value)}
                      className={`cursor-pointer px-3 py-2 text-xs font-mono transition-colors ${
                        gamesPerPage === option.value
                          ? 'bg-cyan-500/10 text-cyan-400'
                          : 'text-theme-secondary hover:bg-theme-hover hover:text-theme-primary'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {gamesPerPage === option.value && (
                          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        )}
                        {option.label}
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* View Toggle */}
              <div className="flex items-center gap-1 p-1 bg-theme-hover border border-theme rounded-xl">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-theme-subtle hover:text-theme-secondary border border-transparent'}`}
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-theme-subtle hover:text-theme-secondary border border-transparent'}`}
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
              <p className="mt-4 text-[11px] font-mono text-theme-subtle uppercase tracking-wider">// Loading library data...</p>
            </div>
          ) : sortedGames.length === 0 ? (
            <div className="relative flex flex-col items-center justify-center py-20 bg-theme-secondary border border-theme rounded-2xl overflow-hidden">
              {/* HUD corners */}
              <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-cyan-400/30" />
              <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-cyan-400/30" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-cyan-400/30" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-cyan-400/30" />

              <span className="text-[10px] font-mono text-theme-subtle uppercase tracking-wider mb-4">// {userGames.length === 0 ? 'EMPTY_LIBRARY' : 'NO_RESULTS'}</span>
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4">
                <Library className="w-7 h-7 text-cyan-400" />
              </div>
              <p className="text-sm text-theme-muted mb-2 font-family-display">
                {userGames.length === 0 ? 'YOUR LIBRARY IS EMPTY' : 'NO GAMES FOUND'}
              </p>
              {userGames.length === 0 ? (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="group relative mt-4 inline-flex items-center gap-2 px-6 py-3 overflow-hidden rounded-xl"
                >
                  <div className="absolute inset-0 bg-linear-to-r from-cyan-500 to-violet-600 opacity-90 group-hover:opacity-100 transition-opacity" />
                  <span className="relative font-semibold text-white uppercase tracking-wide font-family-display">Add Your First Game</span>
                </button>
              ) : (
                <p className="text-xs font-mono text-theme-subtle">Try adjusting your filters</p>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {paginatedGames.map((userGame, index) => (
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
              {paginatedGames.map((userGame, index) => (
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

          {/* Pagination Controls */}
          {totalPages > 1 && sortedGames.length > 0 && (
            <div className="mt-10 mb-4">
              {/* Section header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
                <span className="text-[10px] font-mono text-theme-subtle uppercase tracking-wider">// NAVIGATION</span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
              </div>

              {/* Pagination container */}
              <div className="relative flex items-center justify-center">
                {/* Background panel */}
                <div className="relative flex items-center gap-2 px-6 py-4 bg-theme-secondary border border-theme rounded-2xl">
                  {/* HUD corners */}
                  <div className="absolute top-0 left-0 w-5 h-5 border-l-2 border-t-2 border-cyan-400/30" />
                  <div className="absolute top-0 right-0 w-5 h-5 border-r-2 border-t-2 border-cyan-400/30" />
                  <div className="absolute bottom-0 left-0 w-5 h-5 border-l-2 border-b-2 border-cyan-400/30" />
                  <div className="absolute bottom-0 right-0 w-5 h-5 border-r-2 border-b-2 border-cyan-400/30" />

                  {/* First page button */}
                  <button
                    onClick={() => goToPage(1)}
                    disabled={currentPage === 1}
                    className={`group relative p-2.5 rounded-xl transition-all duration-300 ${
                      currentPage === 1
                        ? 'text-theme-subtle cursor-not-allowed opacity-40'
                        : 'text-theme-muted hover:text-cyan-400 hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/30'
                    }`}
                    title="First page"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>

                  {/* Previous page button */}
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`group relative p-2.5 rounded-xl transition-all duration-300 ${
                      currentPage === 1
                        ? 'text-theme-subtle cursor-not-allowed opacity-40'
                        : 'text-theme-muted hover:text-cyan-400 hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/30'
                    }`}
                    title="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {/* Page numbers */}
                  <div className="flex items-center gap-1 mx-2">
                    {(() => {
                      const pages: (number | 'ellipsis-start' | 'ellipsis-end')[] = [];
                      const showEllipsisStart = currentPage > 3;
                      const showEllipsisEnd = currentPage < totalPages - 2;

                      // Always show first page
                      pages.push(1);

                      if (showEllipsisStart) {
                        pages.push('ellipsis-start');
                      }

                      // Show pages around current
                      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                        if (!pages.includes(i)) {
                          pages.push(i);
                        }
                      }

                      if (showEllipsisEnd) {
                        pages.push('ellipsis-end');
                      }

                      // Always show last page if more than 1 page
                      if (totalPages > 1 && !pages.includes(totalPages)) {
                        pages.push(totalPages);
                      }

                      return pages.map((page, idx) => {
                        if (page === 'ellipsis-start' || page === 'ellipsis-end') {
                          return (
                            <span
                              key={page}
                              className="w-10 h-10 flex items-center justify-center text-theme-subtle"
                            >
                              <span className="flex gap-0.5">
                                <span className="w-1 h-1 rounded-full bg-theme-subtle" />
                                <span className="w-1 h-1 rounded-full bg-theme-subtle" />
                                <span className="w-1 h-1 rounded-full bg-theme-subtle" />
                              </span>
                            </span>
                          );
                        }

                        const isActive = page === currentPage;
                        return (
                          <button
                            key={page}
                            onClick={() => goToPage(page)}
                            className={`relative w-10 h-10 rounded-xl font-mono text-sm font-medium transition-all duration-300 ${
                              isActive
                                ? 'bg-gradient-to-br from-cyan-500/20 to-violet-500/20 text-cyan-400 border border-cyan-500/40 shadow-[0_0_20px_rgba(34,211,238,0.15)]'
                                : 'text-theme-muted hover:text-theme-primary hover:bg-theme-hover border border-transparent hover:border-theme-hover'
                            }`}
                          >
                            {isActive && (
                              <>
                                {/* Active page glow */}
                                <div className="absolute inset-0 rounded-xl bg-cyan-500/10 animate-pulse" />
                                {/* Corner accents for active page */}
                                <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-cyan-400" />
                                <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-cyan-400" />
                                <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-cyan-400" />
                                <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-cyan-400" />
                              </>
                            )}
                            <span className="relative">{page}</span>
                          </button>
                        );
                      });
                    })()}
                  </div>

                  {/* Next page button */}
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`group relative p-2.5 rounded-xl transition-all duration-300 ${
                      currentPage === totalPages
                        ? 'text-theme-subtle cursor-not-allowed opacity-40'
                        : 'text-theme-muted hover:text-cyan-400 hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/30'
                    }`}
                    title="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  {/* Last page button */}
                  <button
                    onClick={() => goToPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className={`group relative p-2.5 rounded-xl transition-all duration-300 ${
                      currentPage === totalPages
                        ? 'text-theme-subtle cursor-not-allowed opacity-40'
                        : 'text-theme-muted hover:text-cyan-400 hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/30'
                    }`}
                    title="Last page"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Page info */}
              <div className="flex justify-center mt-4">
                <div className="flex items-center gap-3 px-4 py-2 bg-theme-hover/50 rounded-lg border border-theme/50">
                  <span className="text-[10px] font-mono text-theme-subtle uppercase tracking-wider">
                    PAGE <span className="text-cyan-400 font-bold">{currentPage}</span> OF <span className="text-theme-muted">{totalPages}</span>
                  </span>
                  <div className="w-px h-3 bg-theme" />
                  <span className="text-[10px] font-mono text-theme-subtle uppercase tracking-wider">
                    SHOWING <span className="text-cyan-400 font-bold">{startIndex + 1}-{Math.min(endIndex, sortedGames.length)}</span> OF <span className="text-theme-muted">{sortedGames.length}</span>
                  </span>
                </div>
              </div>
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
