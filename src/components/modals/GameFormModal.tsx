'use client';

import { useState, useEffect, useCallback } from 'react';
import { Gamepad2, Loader2, Edit3 } from 'lucide-react';
import { addGameToLibrary, editUserGame, fetchIGDBMetadata } from '@/lib/actions/games';
import type { UserGame } from '@/lib/actions/games';
import { BaseModal } from '@/components/modals';
import { useIGDBSearch } from '@/lib/hooks';
import { PLATFORMS, CONSOLE_OPTIONS } from '@/lib/constants';
import type { IGDBGame } from '@/lib/types';
import {
  PRIORITY_CONFIG,
  STATUS_CONFIG,
  type PriorityKey,
  type StatusKey,
  SuccessOverlay,
  IGDBSearchSection,
  GameMetadataSection,
  UserLibrarySection,
} from './game-form';

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
  const [releaseDate, setReleaseDate] = useState('');
  const [genres, setGenres] = useState<string[]>([]);
  const [genreInput, setGenreInput] = useState('');

  // Platform state
  const [selectedPlatform, setSelectedPlatform] = useState('Steam');
  const [selectedConsole, setSelectedConsole] = useState<string>('');

  // User game state
  const [selectedStatus, setSelectedStatus] = useState<StatusKey>('unplayed');
  const [selectedPriority, setSelectedPriority] = useState<PriorityKey>('medium');
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

  // Locked fields - prevent overwriting on IGDB search/refresh
  const [lockedFields, setLockedFields] = useState<Record<string, boolean>>({});

  const toggleFieldLock = (field: string) => {
    setLockedFields(prev => ({ ...prev, [field]: !prev[field] }));
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

  // Reset form helper
  const resetForm = useCallback(() => {
    setSuccess(false);
    setError('');
    setTitle('');
    setCoverUrl('');
    setDescription('');
    setDeveloper('');
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
    setRefreshingMetadata(false);
    setLockedFields({});
    clearResults();
  }, [clearResults]);

  // Initialize form with existing game data (edit mode)
  useEffect(() => {
    if (isOpen && isEditMode && userGame) {
      const platformMatch = userGame.platform.match(/^(.+?)\s*(?:\((.+)\))?$/);
      const basePlatform = platformMatch?.[1] ?? userGame.platform;
      const consoleName = platformMatch?.[2] ?? '';

      setTitle(userGame.game?.title ?? '');
      setCoverUrl(userGame.game?.cover_url ?? '');
      setDescription(userGame.game?.description ?? '');
      setDeveloper(userGame.game?.developer ?? '');
      setReleaseDate(userGame.game?.release_date ?? '');
      setGenres(userGame.game?.genres ?? []);
      setSelectedPlatform(basePlatform);
      setSelectedConsole(consoleName);
      setSelectedStatus((userGame.status as StatusKey) ?? 'unplayed');
      setSelectedPriority((userGame.priority as PriorityKey) ?? 'medium');
      setIsHidden(userGame.hidden ?? false);
      setIsAdult(userGame.tags?.includes('adult') ?? false);
      setOwnershipStatus((userGame.ownership_status ?? (userGame.owned ? 'owned' : 'wishlist')) as 'owned' | 'wishlist' | 'unowned');
      setIsPhysical(userGame.is_physical ?? false);
      setPlaytimeHours(userGame.playtime_hours?.toString() ?? '');
      setCompletionPercentage(userGame.completion_percentage?.toString() ?? '');
      setPersonalRating(userGame.personal_rating?.toString() ?? '');
      setNotes(userGame.notes ?? '');
      setTags(userGame.tags ?? []);
      setLockedFields(userGame.locked_fields ?? {});
      clearResults();
    }
  }, [isOpen, isEditMode, userGame, clearResults]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(resetForm, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, resetForm]);

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

  const handleSelectGame = (game: IGDBGame) => {
    setShowResults(false);
    clearResults();
    setSearchQuery('');

    if (!isFieldLocked('title')) setTitle(game.name);
    if (!isFieldLocked('cover')) setCoverUrl(game.cover ?? '');
    if (!isFieldLocked('description')) setDescription(game.summary ?? '');
    if (!isFieldLocked('developer')) setDeveloper(game.developer ?? '');
    if (!isFieldLocked('releaseDate')) setReleaseDate(game.releaseDate ?? '');
    if (!isFieldLocked('genres')) setGenres(game.genres ?? []);
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
    formData.set('title', title);
    formData.set('coverUrl', coverUrl);
    formData.set('description', description);
    formData.set('developer', developer);
    formData.set('releaseDate', releaseDate);
    formData.set('genres', JSON.stringify(genres));

    const platformValue = hasConsoles && selectedConsole
      ? `${selectedPlatform} (${selectedConsole})`
      : selectedPlatform;
    formData.set('platform', platformValue);
    formData.set('status', selectedStatus);
    formData.set('priority', selectedPriority);

    let finalTags = [...tags];
    if (isAdult && !finalTags.includes('adult')) {
      finalTags.push('adult');
    } else if (!isAdult && finalTags.includes('adult')) {
      finalTags = finalTags.filter(t => t !== 'adult');
    }
    formData.set('tags', JSON.stringify(finalTags));
    formData.set('hidden', (isAdult || isHidden).toString());
    formData.set('ownership_status', ownershipStatus);
    formData.set('is_physical', isPhysical.toString());

    if (isEditMode && userGame) {
      formData.set('userGameId', userGame.id);
      formData.set('gameId', userGame.game_id);
      formData.set('playtimeHours', playtimeHours);
      formData.set('completionPercentage', completionPercentage);
      formData.set('personalRating', personalRating);
      formData.set('notes', notes);
      formData.set('lockedFields', JSON.stringify(lockedFields));
    }

    try {
      const result = isEditMode && userGame
        ? await editUserGame(formData)
        : await addGameToLibrary(formData);

      if (result.error) {
        setError(result.error);
        setLoading(false);
      } else {
        setSuccess(true);
        setLoading(false);
        onSuccess();

        if (isEditMode) {
          setTimeout(onClose, 1200);
        }
      }
    } catch (err) {
      console.error('Save failed:', err);
      setError(
        err instanceof Error && err.message.includes('NetworkError')
          ? 'Network error - please check your connection and try again'
          : 'Failed to save game. Please try again.'
      );
      setLoading(false);
    }
  };

  const handleUpdateCoverFromIGDB = async () => {
    if (!title.trim()) return;

    setUpdatingCover(true);
    setError('');

    try {
      const platformValue = hasConsoles && selectedConsole
        ? `${selectedPlatform} (${selectedConsole})`
        : selectedPlatform;

      const result = await fetchIGDBMetadata(title, platformValue);
      if (result.error) {
        setError(result.error);
      } else if (result.success && result.data?.coverUrl) {
        setCoverUrl(result.data.coverUrl);
      } else {
        setError('No cover found for this game');
      }
    } catch {
      setError('Failed to fetch cover art');
    }

    setUpdatingCover(false);
  };

  const handleAddAnother = () => {
    setSuccess(false);
    setTitle('');
    setCoverUrl('');
    setDescription('');
    setDeveloper('');
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
    clearResults();
  };

  if (isEditMode && !userGame) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Game' : 'Add Game'}
      subtitle={isEditMode ? 'Update game details' : 'Add a new game to your library'}
      icon={isEditMode ? <Edit3 className="w-5 h-5 text-[var(--theme-text-muted)]" /> : <Gamepad2 className="w-5 h-5 text-[var(--theme-text-muted)]" />}
      maxWidth="4xl"
    >
      <div className="relative">
        {success && (
          <SuccessOverlay
            isEditMode={isEditMode}
            onAddAnother={handleAddAnother}
            onClose={onClose}
          />
        )}

        <div className="max-h-[75vh] overflow-y-auto">
          <IGDBSearchSection
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchResults={searchResults}
            searching={searching}
            showResults={showResults}
            setShowResults={setShowResults}
            containerRef={searchContainerRef}
            onSelectGame={handleSelectGame}
            isEditMode={isEditMode}
          />

          <form onSubmit={handleSubmit} className="p-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GameMetadataSection
                title={title}
                setTitle={setTitle}
                coverUrl={coverUrl}
                setCoverUrl={setCoverUrl}
                description={description}
                setDescription={setDescription}
                developer={developer}
                setDeveloper={setDeveloper}
                releaseDate={releaseDate}
                setReleaseDate={setReleaseDate}
                genres={genres}
                setGenres={setGenres}
                genreInput={genreInput}
                setGenreInput={setGenreInput}
                addGenre={addGenre}
                removeGenre={removeGenre}
                isFieldLocked={isFieldLocked}
                toggleFieldLock={toggleFieldLock}
                onRefreshFromIGDB={handleRefreshFromIGDB}
                refreshingMetadata={refreshingMetadata}
                isEditMode={isEditMode}
                onUpdateCoverFromIGDB={handleUpdateCoverFromIGDB}
                updatingCover={updatingCover}
              />

              <UserLibrarySection
                selectedPlatform={selectedPlatform}
                setSelectedPlatform={setSelectedPlatform}
                selectedConsole={selectedConsole}
                setSelectedConsole={setSelectedConsole}
                selectedStatus={selectedStatus}
                setSelectedStatus={setSelectedStatus}
                selectedPriority={selectedPriority}
                setSelectedPriority={setSelectedPriority}
                ownershipStatus={ownershipStatus}
                setOwnershipStatus={setOwnershipStatus}
                isPhysical={isPhysical}
                setIsPhysical={setIsPhysical}
                isAdult={isAdult}
                setIsAdult={setIsAdult}
                isHidden={isHidden}
                setIsHidden={setIsHidden}
                isEditMode={isEditMode}
                playtimeHours={playtimeHours}
                setPlaytimeHours={setPlaytimeHours}
                completionPercentage={completionPercentage}
                setCompletionPercentage={setCompletionPercentage}
                personalRating={personalRating}
                setPersonalRating={setPersonalRating}
                notes={notes}
                setNotes={setNotes}
                tags={tags}
                setTags={setTags}
                tagInput={tagInput}
                setTagInput={setTagInput}
                addTag={addTag}
                removeTag={removeTag}
              />
            </div>

            {error && (
              <div className="mt-5 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <div className="flex items-center gap-3 mt-6 pt-5 border-t border-[var(--theme-border)]">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-[var(--theme-hover-bg)] border border-[var(--theme-border)] rounded-xl font-medium text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] hover:border-[var(--theme-border-hover)] transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !title.trim()}
                className="flex-1 px-4 py-3 bg-[var(--theme-accent-cyan)] hover:brightness-110 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
        .max-h-\\[75vh\\]::-webkit-scrollbar { width: 6px; }
        .max-h-\\[75vh\\]::-webkit-scrollbar-track { background: transparent; }
        .max-h-\\[75vh\\]::-webkit-scrollbar-thumb { background: var(--theme-scrollbar-thumb); border-radius: 3px; }
        .max-h-\\[75vh\\]::-webkit-scrollbar-thumb:hover { background: var(--theme-scrollbar-thumb-hover); }
      `}</style>
    </BaseModal>
  );
}
