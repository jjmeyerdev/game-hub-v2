'use client';

import { useState, useRef, useEffect } from 'react';
import { Gamepad2, Loader2, CheckCircle, Search, Zap, Edit3, EyeOff, Flame, Clock, Coffee } from 'lucide-react';
import { editUserGame, updateGameCoverFromIGDB } from '@/app/actions/games';
import type { UserGame } from '@/app/actions/games';
import { BaseModal } from '@/components/modals';
import { useIGDBSearch } from '@/lib/hooks';
import { PLATFORMS, CONSOLE_OPTIONS, STATUSES, PRIORITIES } from '@/lib/constants';
import type { IGDBGame } from '@/lib/types';

interface EditGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userGame: UserGame | null;
}

export default function EditGameModal({
  isOpen,
  onClose,
  onSuccess,
  userGame,
}: EditGameModalProps) {
  const [selectedPlatform, setSelectedPlatform] = useState('Steam');
  const [selectedConsole, setSelectedConsole] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState('playing');
  const [selectedPriority, setSelectedPriority] = useState('medium');
  const [isHidden, setIsHidden] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [updatingCover, setUpdatingCover] = useState(false);
  const [coverUpdateMessage, setCoverUpdateMessage] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  // Use IGDB search hook
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

  // Get current platform info
  const currentPlatform = PLATFORMS.find((p) => p.id === selectedPlatform);
  const hasConsoles = currentPlatform?.hasConsoles || false;
  const consoleOptions = hasConsoles ? CONSOLE_OPTIONS[selectedPlatform] || [] : [];

  // Initialize form with existing game data
  useEffect(() => {
    if (isOpen && userGame) {
      // Parse platform (e.g., "PlayStation (PS3)" -> platform: "PlayStation", console: "PS3")
      const platformMatch = userGame.platform.match(/^(.+?)\s*(?:\((.+)\))?$/);
      const basePlatform = platformMatch?.[1] || userGame.platform;
      const console = platformMatch?.[2] || '';

      setSelectedPlatform(basePlatform);
      setSelectedConsole(console);
      setSelectedStatus(userGame.status);
      setSelectedPriority(userGame.priority || 'medium');
      setIsHidden(userGame.hidden ?? false);
      clearResults();
    }
  }, [isOpen, userGame, clearResults]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setSuccess(false);
        setError('');
        setCoverUpdateMessage('');
        clearResults();
        formRef.current?.reset();
      }, 300);
    }
  }, [isOpen, clearResults]);

  // Auto-select first console when platform changes (only if not already set)
  useEffect(() => {
    if (hasConsoles && consoleOptions.length > 0 && !selectedConsole) {
      setSelectedConsole(consoleOptions[0]);
    }
  }, [selectedPlatform, hasConsoles, consoleOptions, selectedConsole]);

  const handleSelectGame = (game: IGDBGame) => {
    setShowResults(false);
    clearResults();

    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
      if (formRef.current) {
        const titleInput = formRef.current.querySelector(
          'input[name="title"]'
        ) as HTMLInputElement;
        const coverInput = formRef.current.querySelector(
          'input[name="coverUrl"]'
        ) as HTMLInputElement;
        const developerInput = formRef.current.querySelector(
          'input[name="developer"]'
        ) as HTMLInputElement;
        const descriptionInput = formRef.current.querySelector(
          'textarea[name="description"]'
        ) as HTMLTextAreaElement;

        // Update all fields
        if (titleInput) {
          titleInput.value = game.name;
          titleInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (coverInput) {
          coverInput.value = game.cover || '';
          coverInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (developerInput) {
          developerInput.value = game.developer || '';
          developerInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (descriptionInput) {
          descriptionInput.value = game.summary || '';
          descriptionInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(formRef.current!);

    // Add IDs
    formData.set('userGameId', userGame!.id);
    formData.set('gameId', userGame!.game_id);

    // Combine platform and console if applicable
    const platformValue =
      hasConsoles && selectedConsole
        ? `${selectedPlatform} (${selectedConsole})`
        : selectedPlatform;

    formData.set('platform', platformValue);
    formData.set('status', selectedStatus);
    formData.set('priority', selectedPriority);
    formData.set('hidden', isHidden.toString());

    const result = await editUserGame(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    }
  };

  const handleUpdateCoverFromIGDB = async () => {
    if (!userGame?.game) {
      return;
    }

    setUpdatingCover(true);
    setCoverUpdateMessage('');
    setError('');

    try {
      const result = await updateGameCoverFromIGDB(userGame.game_id, userGame.game.title, userGame.platform);

      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        setCoverUpdateMessage(result.message || 'Cover updated!');
        // Update the cover URL input field
        if (formRef.current && result.coverUrl) {
          const coverInput = formRef.current.querySelector('input[name="coverUrl"]') as HTMLInputElement;
          if (coverInput) {
            coverInput.value = result.coverUrl;
          }
        }
        // Refresh after a delay
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch {
      setError('Failed to update cover art');
    }

    setUpdatingCover(false);
  };

  if (!userGame) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Game"
      icon={<Edit3 className="w-6 h-6 text-void" strokeWidth={2.5} />}
      maxWidth="2xl"
    >
      <div className="max-h-[85vh] overflow-y-auto modal-scrollbar">
      {/* Success State */}
      {success && (
        <div className="absolute inset-0 z-20 bg-abyss/95 backdrop-blur-sm flex items-center justify-center animate-fade-in">
          <div className="text-center">
            <div className="relative inline-block mb-6">
              <CheckCircle
                className="w-20 h-20 text-emerald-400"
                style={{ animation: 'successPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
              />
              <div className="absolute inset-0 bg-emerald-400/30 rounded-full blur-xl animate-pulse" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Game Updated!</h3>
            <p className="text-gray-400">Changes saved successfully</p>
          </div>
        </div>
      )}

      {/* IGDB Search Bar */}
      <div className="relative p-6 pb-0" ref={searchContainerRef}>
        <div className="space-y-2">
          <label className="block text-sm font-bold text-cyan-400 uppercase tracking-wider">
            Search IGDB for games...
          </label>
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
              onFocus={() => {
                if (searchResults.length > 0) {
                  setShowResults(true);
                }
              }}
              placeholder="Search IGDB for games..."
              className="w-full pl-12 pr-12 py-4 bg-deep border-2 border-steel rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 transition-all"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                <Zap className="w-3 h-3 text-cyan-400" />
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  IGDB
                </span>
              </div>
            </div>
          </div>

          {/* Search Results Dropdown */}
          {showResults && searchResults.length > 0 && (
            <div className="absolute left-6 right-6 top-full mt-2 bg-abyss border-2 border-cyan-500/30 rounded-xl overflow-hidden shadow-2xl z-50 max-h-96 overflow-y-auto animate-dropdown-slide-in">
              {searchResults.map((game, index) => (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => handleSelectGame(game)}
                  className="w-full flex items-start gap-4 p-4 hover:bg-cyan-500/10 transition-all border-b border-steel/30 last:border-0 group"
                  style={{ animation: `fadeInUp 0.3s ease-out ${index * 0.05}s both` }}
                >
                  {/* Game Cover */}
                  <div className="flex-shrink-0 w-16 h-20 bg-deep rounded-lg overflow-hidden border border-steel group-hover:border-cyan-500 transition-all">
                    {game.cover ? (
                      <img
                        src={game.cover}
                        alt={game.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Gamepad2 className="w-6 h-6 text-gray-700" />
                      </div>
                    )}
                  </div>

                  {/* Game Info */}
                  <div className="flex-1 text-left min-w-0">
                    <h3 className="font-bold text-white group-hover:text-cyan-400 transition-colors mb-1 truncate">
                      {game.name}
                    </h3>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className="text-xs px-2 py-0.5 bg-cyan-500/20 border border-cyan-500/40 rounded text-cyan-300 font-semibold">
                        {game.platform}
                      </span>
                      {game.releaseDate && (
                        <span className="text-xs px-2 py-0.5 bg-deep border border-steel rounded text-gray-400">
                          {new Date(game.releaseDate).getFullYear()}
                        </span>
                      )}
                      {game.developer && (
                        <span className="text-xs px-2 py-0.5 bg-deep border border-steel rounded text-gray-400 truncate max-w-[150px]">
                          {game.developer}
                        </span>
                      )}
                    </div>
                    {game.genres.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {game.genres.slice(0, 3).map((genre) => (
                          <span
                            key={genre}
                            className="text-xs px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/30 rounded text-cyan-400"
                          >
                            {genre}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* No Results */}
          {showResults && searchResults.length === 0 && !searching && (
            <div className="absolute left-6 right-6 top-full mt-2 bg-abyss border-2 border-steel/30 rounded-xl p-6 text-center">
              <Search className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No games found</p>
              <p className="text-sm text-gray-600 mt-1">Try a different search term</p>
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="px-6">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-steel to-transparent" />
          <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
            Or Enter Manually
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-steel to-transparent" />
        </div>
      </div>

      {/* Form */}
      <form ref={formRef} onSubmit={handleSubmit} className="relative px-6 pb-6 space-y-6">
        {/* Game Title */}
        <div className="space-y-2">
          <label className="block text-sm font-bold text-cyan-400 uppercase tracking-wider">
            Game Title *
          </label>
          <input
            type="text"
            name="title"
            required
            defaultValue={userGame.game?.title}
            placeholder="Enter game name..."
            className="w-full px-4 py-3 bg-deep border-2 border-steel rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 transition-all"
          />
        </div>

        {/* Hide from Library Toggle */}
        <button
          type="button"
          onClick={() => setIsHidden(!isHidden)}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
            isHidden
              ? 'bg-purple-500/20 border-2 border-purple-500/50'
              : 'bg-deep border-2 border-steel hover:border-purple-500/30'
          }`}
        >
          <div className="flex items-center gap-3">
            <EyeOff className={`w-5 h-5 ${isHidden ? 'text-purple-400' : 'text-gray-500'}`} />
            <div className="text-left">
              <span className={`text-sm font-semibold ${isHidden ? 'text-purple-300' : 'text-gray-400'}`}>
                Hide from Library
              </span>
              <p className="text-xs text-gray-500">
                {isHidden ? 'Game is hidden from main view' : 'Game is visible in library'}
              </p>
            </div>
          </div>
          <div className={`w-12 h-6 rounded-full transition-all ${isHidden ? 'bg-purple-500' : 'bg-steel'}`}>
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-all ${
                isHidden ? 'translate-x-6' : 'translate-x-0.5'
              } mt-0.5`}
            />
          </div>
        </button>

        {/* Platform Selector */}
        <div className="space-y-3">
          <label className="block text-sm font-bold text-cyan-400 uppercase tracking-wider">
            Platform *
          </label>
          <div className="grid grid-cols-3 gap-3">
            {PLATFORMS.map((platform) => (
              <button
                key={platform.id}
                type="button"
                onClick={() => setSelectedPlatform(platform.id)}
                className={`relative px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                  selectedPlatform === platform.id
                    ? 'bg-gradient-to-r ' +
                      platform.color +
                      ' text-white shadow-lg scale-105'
                    : 'bg-deep border border-steel text-gray-400 hover:border-cyan-500/50 hover:text-white'
                }`}
              >
                {selectedPlatform === platform.id && (
                  <div
                    className={`absolute inset-0 bg-gradient-to-r ${platform.color} rounded-xl blur-lg opacity-50`}
                  />
                )}
                <span className="relative">{platform.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Console Selector - Conditional */}
        {hasConsoles && consoleOptions.length > 0 && (
          <div
            className="space-y-3 overflow-hidden"
            style={{
              animation: 'slideDown 0.3s ease-out',
            }}
          >
            <div className="flex items-center gap-2">
              <label className="block text-sm font-bold text-purple-400 uppercase tracking-wider">
                Console Version *
              </label>
              <div className="h-px flex-1 bg-gradient-to-r from-purple-500/50 to-transparent" />
            </div>
            <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-purple-500/50 scrollbar-track-deep">
              {consoleOptions.map((console) => (
                <button
                  key={console}
                  type="button"
                  onClick={() => setSelectedConsole(console)}
                  className={`relative px-3 py-2.5 rounded-xl font-semibold text-xs transition-all ${
                    selectedConsole === console
                      ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg scale-105'
                      : 'bg-deep border border-steel text-gray-400 hover:border-purple-500/50 hover:text-white'
                  }`}
                >
                  {selectedConsole === console && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl blur-lg opacity-50" />
                      {/* Animated selection ring */}
                      <div className="absolute inset-0 rounded-xl border-2 border-purple-400 animate-pulse" />
                    </>
                  )}
                  <span className="relative">{console}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Status Selector */}
        <div className="space-y-3">
          <label className="block text-sm font-bold text-cyan-400 uppercase tracking-wider">
            Status
          </label>
          <div className="grid grid-cols-4 gap-3">
            {STATUSES.map((status) => (
              <button
                key={status.id}
                type="button"
                onClick={() => setSelectedStatus(status.id)}
                className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                  selectedStatus === status.id
                    ? 'bg-cyan-500 text-void shadow-lg scale-105'
                    : 'bg-deep border border-steel text-gray-400 hover:border-cyan-500/50 hover:text-white'
                }`}
              >
                <div className="text-lg mb-1">{status.icon}</div>
                {status.label}
              </button>
            ))}
          </div>
        </div>

        {/* Priority Selector */}
        <div className="space-y-3">
          <label className="block text-sm font-bold text-cyan-400 uppercase tracking-wider">
            Backlog Priority
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setSelectedPriority('high')}
              className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                selectedPriority === 'high'
                  ? 'bg-red-500 text-white shadow-lg scale-105'
                  : 'bg-deep border border-steel text-gray-400 hover:border-red-500/50 hover:text-white'
              }`}
            >
              <div className="text-lg mb-1"><Flame className="w-5 h-5 mx-auto" /></div>
              High
            </button>
            <button
              type="button"
              onClick={() => setSelectedPriority('medium')}
              className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                selectedPriority === 'medium'
                  ? 'bg-yellow-500 text-void shadow-lg scale-105'
                  : 'bg-deep border border-steel text-gray-400 hover:border-yellow-500/50 hover:text-white'
              }`}
            >
              <div className="text-lg mb-1"><Clock className="w-5 h-5 mx-auto" /></div>
              Medium
            </button>
            <button
              type="button"
              onClick={() => setSelectedPriority('low')}
              className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                selectedPriority === 'low'
                  ? 'bg-blue-500 text-white shadow-lg scale-105'
                  : 'bg-deep border border-steel text-gray-400 hover:border-blue-500/50 hover:text-white'
              }`}
            >
              <div className="text-lg mb-1"><Coffee className="w-5 h-5 mx-auto" /></div>
              Low
            </button>
          </div>
        </div>

        {/* Optional Fields - Collapsed by default */}
        <details className="group">
          <summary className="cursor-pointer text-sm font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2 hover:text-purple-300 transition-colors">
            <span>Additional Details</span>
            <span className="text-xs">(Optional)</span>
          </summary>
          <div className="mt-4 space-y-4 pl-4 border-l-2 border-purple-500/30">
            {/* Cover URL */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-gray-400">Cover Image URL</label>
                <button
                  type="button"
                  onClick={handleUpdateCoverFromIGDB}
                  disabled={updatingCover}
                  className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 hover:border-cyan-500/50 rounded-lg text-xs font-semibold text-cyan-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updatingCover ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Zap className="w-3 h-3" />
                      Get IGDB Cover
                    </>
                  )}
                </button>
              </div>
              <input
                type="url"
                name="coverUrl"
                defaultValue={userGame.game?.cover_url || ''}
                placeholder="https://..."
                className="w-full px-4 py-2 bg-deep border border-steel rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all text-sm"
              />
              {coverUpdateMessage && (
                <p className="text-xs text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  {coverUpdateMessage}
                </p>
              )}
            </div>

            {/* Developer */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-400">Developer</label>
              <input
                type="text"
                name="developer"
                defaultValue={userGame.game?.developer || ''}
                placeholder="Studio name..."
                className="w-full px-4 py-2 bg-deep border border-steel rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all text-sm"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-400">Description</label>
              <textarea
                name="description"
                rows={3}
                defaultValue={userGame.game?.description || ''}
                placeholder="Game description..."
                className="w-full px-4 py-2 bg-deep border border-steel rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all text-sm resize-none"
              />
            </div>

            {/* Playtime */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-400">
                Playtime (hours)
              </label>
              <input
                type="number"
                name="playtimeHours"
                min="0"
                step="any"
                defaultValue={userGame.playtime_hours}
                className="w-full px-4 py-2 bg-deep border border-steel rounded-lg text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all text-sm"
              />
            </div>

            {/* Completion % */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-400">Completion %</label>
              <input
                type="number"
                name="completionPercentage"
                min="0"
                max="100"
                defaultValue={userGame.completion_percentage}
                className="w-full px-4 py-2 bg-deep border border-steel rounded-lg text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all text-sm"
              />
            </div>

            {/* Personal Rating */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-400">
                Personal Rating (1-10)
              </label>
              <input
                type="number"
                name="personalRating"
                min="1"
                max="10"
                defaultValue={userGame.personal_rating || ''}
                placeholder="Rate this game..."
                className="w-full px-4 py-2 bg-deep border border-steel rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all text-sm"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-400">Notes</label>
              <textarea
                name="notes"
                rows={3}
                defaultValue={userGame.notes || ''}
                placeholder="Your thoughts about this game..."
                className="w-full px-4 py-2 bg-deep border border-steel rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all text-sm resize-none"
              />
            </div>
          </div>
        </details>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-deep border border-steel rounded-xl font-semibold text-gray-300 hover:text-white hover:border-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 rounded-xl font-bold text-void transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:shadow-cyan-500/30 transform hover:scale-105"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </span>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
      </div>

      <style jsx global>{`
        .modal-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .modal-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
          border-radius: 4px;
        }

        .modal-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #06b6d4 0%, #a855f7 100%);
          border-radius: 4px;
          transition: background 0.2s;
        }

        .modal-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #0891b2 0%, #9333ea 100%);
        }

        @keyframes successPop {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            max-height: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            max-height: 200px;
            transform: translateY(0);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </BaseModal>
  );
}
