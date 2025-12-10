'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Gamepad2,
  Loader2,
  CheckCircle,
  Search,
  Zap,
  Edit3,
  EyeOff,
  Eye,
  Flame,
  Clock,
  Coffee,
  Tag,
  X,
  Plus,
  Calendar,
  Building2,
  Users,
  Layers,
  Star,
  Trophy,
  Timer,
  FileText,
  Image,
  Sparkles,
  RefreshCw,
  Package,
  Heart,
  Disc,
  ShieldAlert,
  Lock,
  Unlock,
} from 'lucide-react';
import { addGameToLibrary, editUserGame, updateGameCoverFromIGDB, fetchIGDBMetadata } from '@/app/actions/games';
import type { UserGame } from '@/app/actions/games';
import { BaseModal } from '@/components/modals';
import { useIGDBSearch } from '@/lib/hooks';
import { PLATFORMS, CONSOLE_OPTIONS, STATUSES } from '@/lib/constants';
import type { IGDBGame } from '@/lib/types';

const PRIORITY_CONFIG = {
  high: { label: 'High', Icon: Flame, color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/50', glow: 'shadow-red-500/20' },
  medium: { label: 'Medium', Icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/50', glow: 'shadow-amber-500/20' },
  low: { label: 'Low', Icon: Coffee, color: 'text-sky-400', bg: 'bg-sky-500/20', border: 'border-sky-500/50', glow: 'shadow-sky-500/20' },
} as const;

const STATUS_CONFIG = {
  unplayed: { label: 'Unplayed', icon: '◇', color: 'text-gray-400', bg: 'bg-gray-500/20' },
  playing: { label: 'Playing', icon: '▶', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  played: { label: 'Played', icon: '●', color: 'text-purple-400', bg: 'bg-purple-500/20' },
  completed: { label: 'Completed', icon: '✓', color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
  on_hold: { label: 'On Hold', icon: '॥', color: 'text-amber-400', bg: 'bg-amber-500/20' },
} as const;

interface GameFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: 'add' | 'edit';
  userGame?: UserGame | null;
}

export default function GameFormModal({
  isOpen,
  onClose,
  onSuccess,
  mode,
  userGame,
}: GameFormModalProps) {
  // Game metadata state
  const [title, setTitle] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [description, setDescription] = useState('');
  const [developer, setDeveloper] = useState('');
  const [publisher, setPublisher] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [genres, setGenres] = useState<string[]>([]);
  const [genreInput, setGenreInput] = useState('');

  // Platform state
  const [selectedPlatform, setSelectedPlatform] = useState('Steam');
  const [selectedConsole, setSelectedConsole] = useState<string>('');

  // User game state
  const [selectedStatus, setSelectedStatus] = useState<keyof typeof STATUS_CONFIG>('unplayed');
  const [selectedPriority, setSelectedPriority] = useState<keyof typeof PRIORITY_CONFIG>('medium');
  const [isHidden, setIsHidden] = useState(false);
  const [isAdult, setIsAdult] = useState(false);
  const [ownershipStatus, setOwnershipStatus] = useState<'owned' | 'wishlist' | 'unowned'>('owned');
  const [isPhysical, setIsPhysical] = useState(false);
  const [playtimeHours, setPlaytimeHours] = useState('');
  const [completionPercentage, setCompletionPercentage] = useState('');
  const [personalRating, setPersonalRating] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [updatingCover, setUpdatingCover] = useState(false);
  const [refreshingMetadata, setRefreshingMetadata] = useState(false);
  const [activeSection, setActiveSection] = useState<'search' | 'manual'>('search');

  // Locked fields - prevent overwriting on IGDB search/refresh
  const [lockedFields, setLockedFields] = useState<Record<string, boolean>>({});

  const toggleFieldLock = (field: string) => {
    setLockedFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const isFieldLocked = (field: string) => !!lockedFields[field];

  // IGDB search
  const {
    query: searchQuery,
    results: searchResults,
    loading: searching,
    showResults,
    containerRef: searchContainerRef,
    setQuery: setSearchQuery,
    setShowResults,
    clearResults,
  } = useIGDBSearch();

  // Platform info
  const currentPlatform = PLATFORMS.find((p) => p.id === selectedPlatform);
  const hasConsoles = currentPlatform?.hasConsoles ?? false;
  const consoleOptions = hasConsoles ? CONSOLE_OPTIONS[selectedPlatform] ?? [] : [];

  const isEditMode = mode === 'edit';

  // Initialize form with existing game data (edit mode)
  useEffect(() => {
    if (isOpen && isEditMode && userGame) {
      const platformMatch = userGame.platform.match(/^(.+?)\s*(?:\((.+)\))?$/);
      const basePlatform = platformMatch?.[1] ?? userGame.platform;
      const consoleName = platformMatch?.[2] ?? '';

      // Game metadata
      setTitle(userGame.game?.title ?? '');
      setCoverUrl(userGame.game?.cover_url ?? '');
      setDescription(userGame.game?.description ?? '');
      setDeveloper(userGame.game?.developer ?? '');
      setPublisher(userGame.game?.publisher ?? '');
      setReleaseDate(userGame.game?.release_date ?? '');
      setGenres(userGame.game?.genres ?? []);

      // Platform
      setSelectedPlatform(basePlatform);
      setSelectedConsole(consoleName);

      // User game data
      setSelectedStatus((userGame.status as keyof typeof STATUS_CONFIG) ?? 'unplayed');
      setSelectedPriority((userGame.priority as keyof typeof PRIORITY_CONFIG) ?? 'medium');
      setIsHidden(userGame.hidden ?? false);
      // Detect adult content by checking for 'adult' tag
      const hasAdultTag = userGame.tags?.includes('adult') ?? false;
      setIsAdult(hasAdultTag);
      // Map the ownership_status field or derive from owned boolean for backwards compatibility
      const ownership = userGame.ownership_status ?? (userGame.owned ? 'owned' : 'wishlist');
      setOwnershipStatus(ownership as 'owned' | 'wishlist' | 'unowned');
      setIsPhysical(userGame.is_physical ?? false);
      setPlaytimeHours(userGame.playtime_hours?.toString() ?? '');
      setCompletionPercentage(userGame.completion_percentage?.toString() ?? '');
      setPersonalRating(userGame.personal_rating?.toString() ?? '');
      setNotes(userGame.notes ?? '');
      setTags(userGame.tags ?? []);

      setActiveSection('manual');
      clearResults();
    }
  }, [isOpen, isEditMode, userGame, clearResults]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setSuccess(false);
        setError('');
        setTitle('');
        setCoverUrl('');
        setDescription('');
        setDeveloper('');
        setPublisher('');
        setReleaseDate('');
        setGenres([]);
        setGenreInput('');
        setSelectedPlatform('Steam');
        setSelectedConsole('');
        setSelectedStatus('unplayed');
        setSelectedPriority('medium');
        setIsHidden(false);
        setIsAdult(false);
        setOwnershipStatus('owned');
        setIsPhysical(false);
        setPlaytimeHours('');
        setCompletionPercentage('');
        setPersonalRating('');
        setNotes('');
        setTags([]);
        setTagInput('');
        setActiveSection('search');
        setRefreshingMetadata(false);
        setLockedFields({});
        clearResults();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, clearResults]);

  // Refresh metadata from IGDB
  const handleRefreshFromIGDB = async () => {
    if (!title.trim()) {
      setError('Enter a game title first');
      return;
    }

    setRefreshingMetadata(true);
    setError('');

    try {
      const platformValue = hasConsoles && selectedConsole
        ? `${selectedPlatform} (${selectedConsole})`
        : selectedPlatform;

      const result = await fetchIGDBMetadata(title, platformValue);

      if (result.error) {
        setError(result.error);
      } else if (result.success && result.data) {
        // Update fields with IGDB data, respecting locks
        if (result.data.coverUrl && !isFieldLocked('cover')) setCoverUrl(result.data.coverUrl);
        if (result.data.description && !isFieldLocked('description')) setDescription(result.data.description);
        if (result.data.developer && !isFieldLocked('developer')) setDeveloper(result.data.developer);
        if (result.data.releaseDate && !isFieldLocked('releaseDate')) setReleaseDate(result.data.releaseDate);
        if (result.data.genres && result.data.genres.length > 0 && !isFieldLocked('genres')) setGenres(result.data.genres);
      }
    } catch {
      setError('Failed to fetch from IGDB');
    }

    setRefreshingMetadata(false);
  };

  // Auto-select first console when platform changes
  useEffect(() => {
    if (hasConsoles && consoleOptions.length > 0 && !selectedConsole) {
      setSelectedConsole(consoleOptions[0]);
    }
  }, [selectedPlatform, hasConsoles, consoleOptions, selectedConsole]);

  // Tag management
  const addTag = useCallback((tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 10) {
      setTags(prev => [...prev, trimmedTag]);
      setTagInput('');
    }
  }, [tags]);

  const removeTag = useCallback((tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  }, []);

  // Genre management
  const addGenre = useCallback((genre: string) => {
    const trimmedGenre = genre.trim();
    if (trimmedGenre && !genres.includes(trimmedGenre) && genres.length < 10) {
      setGenres(prev => [...prev, trimmedGenre]);
      setGenreInput('');
    }
  }, [genres]);

  const removeGenre = useCallback((genreToRemove: string) => {
    setGenres(prev => prev.filter(g => g !== genreToRemove));
  }, []);

  const handleSelectGame = (game: IGDBGame) => {
    setShowResults(false);
    clearResults();
    setSearchQuery('');

    // Populate fields from IGDB, respecting locks
    if (!isFieldLocked('title')) setTitle(game.name);
    if (!isFieldLocked('cover')) setCoverUrl(game.cover ?? '');
    if (!isFieldLocked('description')) setDescription(game.summary ?? '');
    if (!isFieldLocked('developer')) setDeveloper(game.developer ?? '');
    if (!isFieldLocked('releaseDate')) setReleaseDate(game.releaseDate ?? '');
    if (!isFieldLocked('genres')) setGenres(game.genres ?? []);
    setActiveSection('manual');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Game title is required');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();

    // Game metadata
    formData.set('title', title);
    formData.set('coverUrl', coverUrl);
    formData.set('description', description);
    formData.set('developer', developer);
    formData.set('publisher', publisher);
    formData.set('releaseDate', releaseDate);
    formData.set('genres', JSON.stringify(genres));

    // Platform
    const platformValue = hasConsoles && selectedConsole
      ? `${selectedPlatform} (${selectedConsole})`
      : selectedPlatform;
    formData.set('platform', platformValue);

    // User game data
    formData.set('status', selectedStatus);
    formData.set('priority', selectedPriority);

    // Handle adult content: add 'adult' tag and set hidden
    let finalTags = [...tags];
    if (isAdult && !finalTags.includes('adult')) {
      finalTags.push('adult');
    } else if (!isAdult && finalTags.includes('adult')) {
      finalTags = finalTags.filter(t => t !== 'adult');
    }
    formData.set('tags', JSON.stringify(finalTags));

    // Adult content is always hidden
    const shouldBeHidden = isAdult || isHidden;
    formData.set('hidden', shouldBeHidden.toString());

    formData.set('ownership_status', ownershipStatus);
    formData.set('is_physical', isPhysical.toString());

    if (isEditMode && userGame) {
      formData.set('userGameId', userGame.id);
      formData.set('gameId', userGame.game_id);
      formData.set('playtimeHours', playtimeHours);
      formData.set('completionPercentage', completionPercentage);
      formData.set('personalRating', personalRating);
      formData.set('notes', notes);
    }

    const result = isEditMode && userGame
      ? await editUserGame(formData)
      : await addGameToLibrary(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
      onSuccess(); // Refresh data immediately

      // For edit mode, auto-close after delay. For add mode, let user choose.
      if (isEditMode) {
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    }
  };

  const handleUpdateCoverFromIGDB = async () => {
    if (!userGame?.game) return;

    setUpdatingCover(true);
    setError('');

    try {
      const result = await updateGameCoverFromIGDB(userGame.game_id, userGame.game.title, userGame.platform);
      if (result.error) {
        setError(result.error);
      } else if (result.success && result.coverUrl) {
        setCoverUrl(result.coverUrl);
        setTimeout(() => onSuccess(), 1000);
      }
    } catch {
      setError('Failed to update cover art');
    }

    setUpdatingCover(false);
  };

  if (isEditMode && !userGame) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'EDIT GAME' : 'ADD GAME'}
      icon={isEditMode ? <Edit3 className="w-5 h-5 text-void" /> : <Gamepad2 className="w-5 h-5 text-void" />}
      maxWidth="4xl"
    >
      <div className="relative">
        {/* Success Overlay */}
        {success && (
          <div className="absolute inset-0 z-50 bg-void/95 backdrop-blur-md flex items-center justify-center rounded-xl overflow-hidden">
            {/* Animated background grid */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: 'linear-gradient(rgba(0, 217, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 217, 255, 0.1) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
                animation: 'gridPulse 2s ease-in-out infinite'
              }} />
            </div>

            {/* Radial glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" />

            <div className="text-center relative z-10">
              {/* Success icon with rings */}
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 scale-150 rounded-full border border-emerald-500/20 animate-[ringExpand_1.5s_ease-out_infinite]" />
                <div className="absolute inset-0 scale-125 rounded-full border border-emerald-500/30 animate-[ringExpand_1.5s_ease-out_0.3s_infinite]" />
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center animate-[successPop_0.5s_cubic-bezier(0.34,1.56,0.64,1)] shadow-lg shadow-emerald-500/30">
                  <CheckCircle className="w-10 h-10 text-void" strokeWidth={2.5} />
                </div>
              </div>

              <h3 className="text-2xl font-bold text-white mb-2 tracking-wide">
                {isEditMode ? 'Game Updated!' : 'Game Added!'}
              </h3>
              <p className="text-gray-400 text-sm mb-8">
                {isEditMode ? 'Changes saved successfully' : 'Successfully added to your library'}
              </p>

              {/* Action buttons - only show Add Another for add mode */}
              {!isEditMode && (
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      // Reset form for another game
                      setSuccess(false);
                      setTitle('');
                      setCoverUrl('');
                      setDescription('');
                      setDeveloper('');
                      setPublisher('');
                      setReleaseDate('');
                      setGenres([]);
                      setGenreInput('');
                      setSelectedPlatform('Steam');
                      setSelectedConsole('');
                      setSelectedStatus('unplayed');
                      setSelectedPriority('medium');
                      setIsAdult(false);
                      setTags([]);
                      setTagInput('');
                      setActiveSection('search');
                      clearResults();
                    }}
                    className="group relative px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-bold text-void overflow-hidden transition-all hover:shadow-lg hover:shadow-cyan-500/25 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Add Another
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-3 bg-abyss/80 border border-steel/50 rounded-xl font-semibold text-gray-400 hover:text-white hover:border-steel transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="max-h-[80vh] overflow-y-auto custom-scrollbar">
          {/* IGDB Search Section */}
          <div className="p-5 border-b border-steel/50" ref={searchContainerRef}>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                {searching ? (
                  <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                ) : (
                  <Search className="w-5 h-5 text-cyan-400" />
                )}
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowResults(true)}
                placeholder={isEditMode ? "Search IGDB to replace game data..." : "Search by title or IGDB ID..."}
                className="w-full pl-12 pr-24 py-3.5 bg-abyss border border-steel/50 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all font-mono text-sm"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                  <Zap className="w-3 h-3 text-cyan-400" />
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">IGDB</span>
                </div>
              </div>

              {/* Search Results - Grouped by Platform */}
              {showResults && searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-abyss border border-cyan-500/30 rounded-xl overflow-hidden shadow-2xl shadow-cyan-500/10 z-50 max-h-96 overflow-y-auto">
                  {(() => {
                    // Group results by platform
                    const grouped = searchResults.reduce((acc, game) => {
                      const platform = game.platform || 'Unknown';
                      if (!acc[platform]) acc[platform] = [];
                      acc[platform].push(game);
                      return acc;
                    }, {} as Record<string, typeof searchResults>);

                    // Sort platforms: PC first, then alphabetically
                    const sortedPlatforms = Object.keys(grouped).sort((a, b) => {
                      if (a.includes('PC') || a.includes('Windows')) return -1;
                      if (b.includes('PC') || b.includes('Windows')) return 1;
                      if (a.includes('PlayStation')) return -1;
                      if (b.includes('PlayStation')) return 1;
                      if (a.includes('Xbox')) return -1;
                      if (b.includes('Xbox')) return 1;
                      return a.localeCompare(b);
                    });

                    return sortedPlatforms.map((platform) => (
                      <div key={platform}>
                        {/* Platform Header */}
                        <div className="sticky top-0 px-3 py-2 bg-deep/95 backdrop-blur-sm border-b border-steel/30 flex items-center gap-2">
                          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">{platform}</span>
                          <span className="text-[10px] text-gray-600">({grouped[platform].length})</span>
                        </div>
                        {/* Games for this platform */}
                        {grouped[platform].map((game) => (
                          <button
                            key={game.id}
                            type="button"
                            onClick={() => handleSelectGame(game)}
                            className="w-full flex items-start gap-3 p-3 hover:bg-cyan-500/10 transition-all border-b border-steel/20 last:border-0 group"
                          >
                            <div className="flex-shrink-0 w-10 h-14 bg-deep rounded-lg overflow-hidden border border-steel/50 group-hover:border-cyan-500/50 transition-all">
                              {game.cover ? (
                                <img src={game.cover} alt={game.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Gamepad2 className="w-4 h-4 text-gray-700" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <h4 className="font-semibold text-white group-hover:text-cyan-400 transition-colors text-sm truncate">
                                {game.name}
                              </h4>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                {game.releaseDate && (
                                  <span className="text-[10px] px-1.5 py-0.5 bg-steel/50 rounded text-gray-400 font-mono">
                                    {new Date(game.releaseDate).getFullYear()}
                                  </span>
                                )}
                                {game.developer && (
                                  <span className="text-[10px] text-gray-500 truncate max-w-[100px]">
                                    {game.developer}
                                  </span>
                                )}
                              </div>
                              {game.genres.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {game.genres.slice(0, 2).map((genre) => (
                                    <span key={genre} className="text-[10px] px-1.5 py-0.5 bg-purple-500/20 border border-purple-500/30 rounded text-purple-400">
                                      {genre}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mt-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-steel/50 to-transparent" />
              <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                {isEditMode ? 'or edit manually below' : 'or enter manually'}
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-steel/50 to-transparent" />
            </div>
          </div>

          {/* Two-Panel Layout */}
          <form onSubmit={handleSubmit} className="p-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* LEFT PANEL - Game Metadata */}
              <div className="space-y-4">
                {/* Section Header */}
                <div className="flex items-center justify-between pb-2 border-b border-steel/30">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Game Info</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRefreshFromIGDB}
                    disabled={refreshingMetadata || !title.trim()}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-[10px] font-semibold text-cyan-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Refresh all metadata from IGDB"
                  >
                    {refreshingMetadata ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3" />
                    )}
                    {refreshingMetadata ? 'Fetching...' : 'Refresh from IGDB'}
                  </button>
                </div>

                {/* Cover + Title Row */}
                <div className="flex gap-4">
                  {/* Cover Preview */}
                  <div className="flex-shrink-0">
                    <div className="w-24 h-32 bg-deep rounded-xl overflow-hidden border-2 border-steel/50 relative group">
                      {coverUrl ? (
                        <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-600">
                          <Image className="w-8 h-8 mb-1" />
                          <span className="text-[10px]">No Cover</span>
                        </div>
                      )}
                      {/* Scanline effect */}
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </div>
                    {isEditMode && (
                      <button
                        type="button"
                        onClick={handleUpdateCoverFromIGDB}
                        disabled={updatingCover}
                        className="w-full mt-2 flex items-center justify-center gap-1 px-2 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-[10px] font-semibold text-cyan-400 transition-all disabled:opacity-50"
                      >
                        {updatingCover ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        {updatingCover ? 'Updating...' : 'Get Cover'}
                      </button>
                    )}
                  </div>

                  {/* Title + Cover URL */}
                  <div className="flex-1 space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                        <span>Title <span className="text-red-400">*</span></span>
                        <button
                          type="button"
                          onClick={() => toggleFieldLock('title')}
                          className={`p-1 rounded transition-all ${isFieldLocked('title') ? 'text-amber-400 bg-amber-500/20' : 'text-gray-600 hover:text-gray-400'}`}
                          title={isFieldLocked('title') ? 'Unlock field' : 'Lock field from IGDB updates'}
                        >
                          {isFieldLocked('title') ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Game title..."
                          className={`w-full px-3 py-2.5 pr-8 bg-abyss border rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50 text-sm ${isFieldLocked('title') ? 'border-amber-500/50' : 'border-steel/50'}`}
                          required
                        />
                        {title && (
                          <button
                            type="button"
                            onClick={() => setTitle('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-white transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                        <span>Cover URL</span>
                        <button
                          type="button"
                          onClick={() => toggleFieldLock('cover')}
                          className={`p-1 rounded transition-all ${isFieldLocked('cover') ? 'text-amber-400 bg-amber-500/20' : 'text-gray-600 hover:text-gray-400'}`}
                          title={isFieldLocked('cover') ? 'Unlock field' : 'Lock field from IGDB updates'}
                        >
                          {isFieldLocked('cover') ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type="url"
                          value={coverUrl}
                          onChange={(e) => setCoverUrl(e.target.value)}
                          placeholder="https://..."
                          className={`w-full px-3 py-2.5 pr-8 bg-abyss border rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50 text-sm font-mono ${isFieldLocked('cover') ? 'border-amber-500/50' : 'border-steel/50'}`}
                        />
                        {coverUrl && (
                          <button
                            type="button"
                            onClick={() => setCoverUrl('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-white transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Developer + Publisher */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      <span className="flex items-center gap-1.5"><Building2 className="w-3 h-3" /> Developer</span>
                      <button
                        type="button"
                        onClick={() => toggleFieldLock('developer')}
                        className={`p-1 rounded transition-all ${isFieldLocked('developer') ? 'text-amber-400 bg-amber-500/20' : 'text-gray-600 hover:text-gray-400'}`}
                        title={isFieldLocked('developer') ? 'Unlock field' : 'Lock field from IGDB updates'}
                      >
                        {isFieldLocked('developer') ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={developer}
                        onChange={(e) => setDeveloper(e.target.value)}
                        placeholder="Studio name..."
                        className={`w-full px-3 py-2.5 pr-8 bg-abyss border rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50 text-sm ${isFieldLocked('developer') ? 'border-amber-500/50' : 'border-steel/50'}`}
                      />
                      {developer && (
                        <button
                          type="button"
                          onClick={() => setDeveloper('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-white transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      <Users className="w-3 h-3" /> Publisher
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={publisher}
                        onChange={(e) => setPublisher(e.target.value)}
                        placeholder="Publisher name..."
                        className="w-full px-3 py-2.5 pr-8 bg-abyss border border-steel/50 rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50 text-sm"
                      />
                      {publisher && (
                        <button
                          type="button"
                          onClick={() => setPublisher('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-white transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Release Date */}
                <div>
                  <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Release Date</span>
                    <button
                      type="button"
                      onClick={() => toggleFieldLock('releaseDate')}
                      className={`p-1 rounded transition-all ${isFieldLocked('releaseDate') ? 'text-amber-400 bg-amber-500/20' : 'text-gray-600 hover:text-gray-400'}`}
                      title={isFieldLocked('releaseDate') ? 'Unlock field' : 'Lock field from IGDB updates'}
                    >
                      {isFieldLocked('releaseDate') ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="date"
                      value={releaseDate}
                      onChange={(e) => setReleaseDate(e.target.value)}
                      className={`w-full px-3 py-2.5 pr-8 bg-abyss border rounded-lg text-white focus:outline-none focus:border-cyan-500/50 text-sm [color-scheme:dark] ${isFieldLocked('releaseDate') ? 'border-amber-500/50' : 'border-steel/50'}`}
                    />
                    {releaseDate && (
                      <button
                        type="button"
                        onClick={() => setReleaseDate('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-white transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Genres */}
                <div>
                  <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    <span className="flex items-center gap-1.5"><Layers className="w-3 h-3" /> Genres</span>
                    <div className="flex items-center gap-2">
                      {genres.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setGenres([])}
                          className="text-gray-600 hover:text-red-400 transition-colors"
                        >
                          Clear all
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => toggleFieldLock('genres')}
                        className={`p-1 rounded transition-all ${isFieldLocked('genres') ? 'text-amber-400 bg-amber-500/20' : 'text-gray-600 hover:text-gray-400'}`}
                        title={isFieldLocked('genres') ? 'Unlock field' : 'Lock field from IGDB updates'}
                      >
                        {isFieldLocked('genres') ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                  <div className={`flex flex-wrap gap-1.5 p-2.5 bg-abyss border rounded-lg min-h-[42px] ${isFieldLocked('genres') ? 'border-amber-500/50' : 'border-steel/50'}`}>
                    {genres.map((genre) => (
                      <span
                        key={genre}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/20 border border-purple-500/40 rounded text-xs text-purple-300"
                      >
                        {genre}
                        <button type="button" onClick={() => removeGenre(genre)} className="hover:text-white">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={genreInput}
                      onChange={(e) => setGenreInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); addGenre(genreInput); }
                      }}
                      placeholder={genres.length === 0 ? "Add genre..." : ""}
                      className="flex-1 min-w-[80px] bg-transparent text-sm text-white placeholder:text-gray-600 outline-none"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    <span className="flex items-center gap-1.5"><FileText className="w-3 h-3" /> Description</span>
                    <div className="flex items-center gap-2">
                      {description && (
                        <button
                          type="button"
                          onClick={() => setDescription('')}
                          className="text-gray-600 hover:text-red-400 transition-colors"
                        >
                          Clear
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => toggleFieldLock('description')}
                        className={`p-1 rounded transition-all ${isFieldLocked('description') ? 'text-amber-400 bg-amber-500/20' : 'text-gray-600 hover:text-gray-400'}`}
                        title={isFieldLocked('description') ? 'Unlock field' : 'Lock field from IGDB updates'}
                      >
                        {isFieldLocked('description') ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Game description..."
                    rows={3}
                    className={`w-full px-3 py-2.5 bg-abyss border rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50 text-sm resize-none ${isFieldLocked('description') ? 'border-amber-500/50' : 'border-steel/50'}`}
                  />
                </div>
              </div>

              {/* RIGHT PANEL - User Data */}
              <div className="space-y-4">
                {/* Section Header */}
                <div className="flex items-center gap-2 pb-2 border-b border-steel/30">
                  <Gamepad2 className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Your Library</span>
                </div>

                {/* Platform Selection */}
                <div>
                  <label className="flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                    <span>Platform</span>
                    {selectedPlatform && (
                      <button
                        type="button"
                        onClick={() => { setSelectedPlatform(''); setSelectedConsole(''); }}
                        className="text-gray-600 hover:text-red-400 transition-colors"
                      >
                        Clear
                      </button>
                    )}
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {PLATFORMS.filter(p => ['PC', 'Steam', 'PlayStation', 'Xbox', 'Epic Games', 'EA App', 'Nintendo', 'Battle.net'].includes(p.id)).sort((a, b) => a.label.localeCompare(b.label)).map((platform) => (
                      <button
                        key={platform.id}
                        type="button"
                        onClick={() => {
                          if (selectedPlatform === platform.id) {
                            setSelectedPlatform('');
                            setSelectedConsole('');
                          } else {
                            setSelectedPlatform(platform.id);
                            setSelectedConsole('');
                          }
                        }}
                        className={`px-2 py-2 rounded-lg text-[11px] font-semibold transition-all ${
                          selectedPlatform === platform.id
                            ? `bg-gradient-to-r ${platform.color} text-white shadow-lg`
                            : 'bg-abyss border border-steel/50 text-gray-400 hover:border-steel hover:text-white'
                        }`}
                      >
                        {platform.label}
                      </button>
                    ))}
                  </div>
                  {/* Console selector */}
                  {hasConsoles && consoleOptions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {[...consoleOptions].sort((a, b) => a.localeCompare(b)).map((consoleName) => (
                        <button
                          key={consoleName}
                          type="button"
                          onClick={() => {
                            if (selectedConsole === consoleName) {
                              setSelectedConsole('');
                            } else {
                              setSelectedConsole(consoleName);
                            }
                          }}
                          className={`px-2 py-1.5 rounded text-[10px] font-medium transition-all ${
                            selectedConsole === consoleName
                              ? 'bg-purple-500/30 border border-purple-500/50 text-purple-300'
                              : 'bg-abyss/50 border border-steel/30 text-gray-500 hover:text-white'
                          }`}
                        >
                          {consoleName}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Status + Priority */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Status */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Status</label>
                    <div className="flex flex-wrap gap-1.5">
                      {(Object.entries(STATUS_CONFIG) as [keyof typeof STATUS_CONFIG, typeof STATUS_CONFIG[keyof typeof STATUS_CONFIG]][]).map(([key, config]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setSelectedStatus(key)}
                          className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                            selectedStatus === key
                              ? `${config.bg} ${config.color} border border-current`
                              : 'bg-abyss border border-steel/50 text-gray-500 hover:text-white'
                          }`}
                        >
                          <span className="text-xs">{config.icon}</span>
                          {config.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Priority</label>
                    <div className="space-y-1.5">
                      {(Object.entries(PRIORITY_CONFIG) as [keyof typeof PRIORITY_CONFIG, typeof PRIORITY_CONFIG[keyof typeof PRIORITY_CONFIG]][]).map(([key, config]) => {
                        const Icon = config.Icon;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setSelectedPriority(key)}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-semibold transition-all ${
                              selectedPriority === key
                                ? `${config.bg} ${config.color} border ${config.border}`
                                : 'bg-abyss border border-steel/50 text-gray-500 hover:text-white'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            {config.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Ownership Status - Three-state Toggle (shown for both add and edit modes) */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    <Package className="w-3 h-3" /> Ownership
                  </label>
                  <div className="relative flex bg-abyss border border-steel/50 rounded-xl p-1 overflow-hidden">
                    {/* Sliding background indicator */}
                    <div
                      className={`absolute top-1 bottom-1 w-[calc(33.333%-3px)] rounded-lg transition-all duration-300 ease-out ${
                        ownershipStatus === 'owned'
                          ? 'left-1 bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/30'
                          : ownershipStatus === 'wishlist'
                          ? 'left-[calc(33.333%+1px)] bg-gradient-to-r from-rose-500 to-pink-500 shadow-lg shadow-rose-500/30'
                          : 'left-[calc(66.666%+1px)] bg-gradient-to-r from-gray-500 to-gray-600 shadow-lg shadow-gray-500/20'
                      }`}
                    />
                    {/* Owned option */}
                    <button
                      type="button"
                      onClick={() => setOwnershipStatus('owned')}
                      className={`relative flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg transition-all z-10 ${
                        ownershipStatus === 'owned' ? 'text-void font-bold' : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      <Package className={`w-3.5 h-3.5 transition-transform ${ownershipStatus === 'owned' ? 'scale-110' : ''}`} />
                      <span className="text-xs">Owned</span>
                    </button>
                    {/* Wishlist option */}
                    <button
                      type="button"
                      onClick={() => setOwnershipStatus('wishlist')}
                      className={`relative flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg transition-all z-10 ${
                        ownershipStatus === 'wishlist' ? 'text-void font-bold' : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 transition-transform ${ownershipStatus === 'wishlist' ? 'scale-110 fill-current' : ''}`} />
                      <span className="text-xs">Wishlist</span>
                    </button>
                    {/* Unowned option */}
                    <button
                      type="button"
                      onClick={() => setOwnershipStatus('unowned')}
                      className={`relative flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg transition-all z-10 ${
                        ownershipStatus === 'unowned' ? 'text-white font-bold' : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      <X className={`w-3.5 h-3.5 transition-transform ${ownershipStatus === 'unowned' ? 'scale-110' : ''}`} />
                      <span className="text-xs">Unowned</span>
                    </button>
                  </div>
                </div>

                {/* Physical Copy Toggle */}
                <button
                  type="button"
                  onClick={() => setIsPhysical(!isPhysical)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${
                    isPhysical
                      ? 'bg-amber-500/20 border border-amber-500/50'
                      : 'bg-abyss border border-steel/50 hover:border-steel'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Disc className={`w-4 h-4 ${isPhysical ? 'text-amber-400' : 'text-gray-500'}`} />
                    <span className={`text-sm font-medium ${isPhysical ? 'text-amber-300' : 'text-gray-400'}`}>
                      Physical Copy
                    </span>
                  </div>
                  <div className={`w-10 h-5 rounded-full transition-all ${isPhysical ? 'bg-amber-500' : 'bg-steel'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white shadow transform transition-all ${isPhysical ? 'translate-x-5' : 'translate-x-0.5'} mt-0.5`} />
                  </div>
                </button>

                {/* Adult Content Toggle */}
                <button
                  type="button"
                  onClick={() => setIsAdult(!isAdult)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${
                    isAdult
                      ? 'bg-rose-500/20 border border-rose-500/50'
                      : 'bg-abyss border border-steel/50 hover:border-steel'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ShieldAlert className={`w-4 h-4 ${isAdult ? 'text-rose-400' : 'text-gray-500'}`} />
                    <div className="flex flex-col items-start">
                      <span className={`text-sm font-medium ${isAdult ? 'text-rose-300' : 'text-gray-400'}`}>
                        Adult Content
                      </span>
                      <span className="text-[10px] text-gray-600">
                        Hides game and blurs cover
                      </span>
                    </div>
                  </div>
                  <div className={`w-10 h-5 rounded-full transition-all ${isAdult ? 'bg-rose-500' : 'bg-steel'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white shadow transform transition-all ${isAdult ? 'translate-x-5' : 'translate-x-0.5'} mt-0.5`} />
                  </div>
                </button>

                {/* Edit Mode: Additional Fields */}
                {isEditMode && (
                  <>
                    {/* Playtime + Completion + Rating */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                          <Timer className="w-3 h-3" /> Hours
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={playtimeHours}
                            onChange={(e) => setPlaytimeHours(e.target.value)}
                            min="0"
                            step="0.1"
                            placeholder="0"
                            className="w-full px-3 py-2.5 pr-7 bg-abyss border border-steel/50 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/50 font-mono"
                          />
                          {playtimeHours && (
                            <button
                              type="button"
                              onClick={() => setPlaytimeHours('')}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-500 hover:text-white transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                          <Trophy className="w-3 h-3" /> Complete
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={completionPercentage}
                            onChange={(e) => setCompletionPercentage(e.target.value)}
                            min="0"
                            max="100"
                            placeholder="0"
                            className="w-full px-3 py-2.5 pr-12 bg-abyss border border-steel/50 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/50 font-mono"
                          />
                          <span className="absolute right-7 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
                          {completionPercentage && (
                            <button
                              type="button"
                              onClick={() => setCompletionPercentage('')}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-500 hover:text-white transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                          <Star className="w-3 h-3" /> Rating
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={personalRating}
                            onChange={(e) => setPersonalRating(e.target.value)}
                            min="1"
                            max="10"
                            placeholder="—"
                            className="w-full px-3 py-2.5 pr-12 bg-abyss border border-steel/50 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/50 font-mono"
                          />
                          <span className="absolute right-7 top-1/2 -translate-y-1/2 text-gray-500 text-[10px]">/10</span>
                          {personalRating && (
                            <button
                              type="button"
                              onClick={() => setPersonalRating('')}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-500 hover:text-white transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Hidden Toggle */}
                    <button
                      type="button"
                      onClick={() => setIsHidden(!isHidden)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${
                        isHidden
                          ? 'bg-purple-500/20 border border-purple-500/50'
                          : 'bg-abyss border border-steel/50 hover:border-steel'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isHidden ? <EyeOff className="w-4 h-4 text-purple-400" /> : <Eye className="w-4 h-4 text-gray-500" />}
                        <span className={`text-sm font-medium ${isHidden ? 'text-purple-300' : 'text-gray-400'}`}>
                          {isHidden ? 'Hidden from library' : 'Visible in library'}
                        </span>
                      </div>
                      <div className={`w-10 h-5 rounded-full transition-all ${isHidden ? 'bg-purple-500' : 'bg-steel'}`}>
                        <div className={`w-4 h-4 rounded-full bg-white shadow transform transition-all ${isHidden ? 'translate-x-5' : 'translate-x-0.5'} mt-0.5`} />
                      </div>
                    </button>

                    {/* Notes */}
                    <div>
                      <label className="flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                        <span className="flex items-center gap-1.5"><FileText className="w-3 h-3" /> Notes</span>
                        {notes && (
                          <button
                            type="button"
                            onClick={() => setNotes('')}
                            className="text-gray-600 hover:text-red-400 transition-colors"
                          >
                            Clear
                          </button>
                        )}
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Your thoughts..."
                        rows={2}
                        className="w-full px-3 py-2.5 bg-abyss border border-steel/50 rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50 text-sm resize-none"
                      />
                    </div>

                    {/* Tags */}
                    <div>
                      <label className="flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                        <span className="flex items-center gap-1.5"><Tag className="w-3 h-3" /> Tags</span>
                        <span className="flex items-center gap-2">
                          {tags.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setTags([])}
                              className="text-gray-600 hover:text-red-400 transition-colors"
                            >
                              Clear all
                            </button>
                          )}
                          <span className="text-gray-600">{tags.length}/10</span>
                        </span>
                      </label>
                      <div className="flex flex-wrap gap-1.5 p-2.5 bg-abyss border border-steel/50 rounded-lg min-h-[42px]">
                        {tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-cyan-500/20 border border-cyan-500/40 rounded text-xs text-cyan-300"
                          >
                            <Tag className="w-2.5 h-2.5" />
                            {tag}
                            <button type="button" onClick={() => removeTag(tag)} className="hover:text-white">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                        <input
                          type="text"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput); }
                            else if (e.key === 'Backspace' && tagInput === '' && tags.length > 0) removeTag(tags[tags.length - 1]);
                          }}
                          placeholder={tags.length === 0 ? "Add tags..." : ""}
                          disabled={tags.length >= 10}
                          className="flex-1 min-w-[80px] bg-transparent text-sm text-white placeholder:text-gray-600 outline-none disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-steel/30">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-abyss border border-steel/50 rounded-xl font-semibold text-gray-400 hover:text-white hover:border-steel transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !title.trim()}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 rounded-xl font-bold text-void transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-cyan-500/25"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isEditMode ? 'Saving...' : 'Adding...'}
                  </span>
                ) : (
                  isEditMode ? 'Save Changes' : 'Add to Library'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: linear-gradient(180deg, #06b6d4 0%, #a855f7 100%); border-radius: 3px; }
        @keyframes successPop { 0% { transform: scale(0); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }
        @keyframes ringExpand {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2); opacity: 0; }
        }
        @keyframes gridPulse {
          0%, 100% { opacity: 0.05; }
          50% { opacity: 0.15; }
        }
      `}</style>
    </BaseModal>
  );
}
