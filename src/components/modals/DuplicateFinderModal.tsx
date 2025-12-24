'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Scan, AlertTriangle, CheckCircle, Loader2, Trash2, Gamepad2, Clock, Trophy, Layers, Sparkles, RotateCw, RefreshCcw, ChevronRight, Star, Shield, Merge, ArrowLeft, Check, Square, CheckSquare } from 'lucide-react';
import { findDuplicateGames, mergeDuplicateGames, deleteUserGame, dismissDuplicateGroup, clearAllDismissedDuplicates } from '@/lib/actions/games';
import type { DuplicateGroup, UserGame, Game } from '@/lib/actions/games';

interface DuplicateFinderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type ScanPhase = 'idle' | 'scanning' | 'complete';
type ViewMode = 'choose' | 'merge-select';

export default function DuplicateFinderModal({ isOpen, onClose, onSuccess }: DuplicateFinderModalProps) {
  const [phase, setPhase] = useState<ScanPhase>('idle');
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [resolvedCount, setResolvedCount] = useState(0);
  const [isClearing, setIsClearing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('choose');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [mergePrimaryId, setMergePrimaryId] = useState<string | null>(null);

  const resetState = useCallback(() => {
    setPhase('idle');
    setDuplicates([]);
    setCurrentIndex(0);
    setError(null);
    setScanProgress(0);
    setResolvedCount(0);
    setViewMode('choose');
    setSelectedIds(new Set());
    setMergePrimaryId(null);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen, resetState]);

  const startScan = async () => {
    setPhase('scanning');
    setError(null);
    setScanProgress(0);

    const progressInterval = setInterval(() => {
      setScanProgress(prev => Math.min(prev + Math.random() * 15, 90));
    }, 200);

    try {
      const result = await findDuplicateGames();
      clearInterval(progressInterval);
      setScanProgress(100);

      if (result.error) {
        setError(result.error);
        setPhase('idle');
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 300));

      const sortedDuplicates = (result.data || []).sort((a, b) => {
        const titleA = ((a.games[0]?.game as Game)?.title || '').toLowerCase();
        const titleB = ((b.games[0]?.game as Game)?.title || '').toLowerCase();
        return titleA.localeCompare(titleB);
      });

      setDuplicates(sortedDuplicates);
      setCurrentIndex(0);
      setPhase('complete');
    } catch (err) {
      clearInterval(progressInterval);
      setError(err instanceof Error ? err.message : 'Scan failed');
      setPhase('idle');
    }
  };

  const handleClearDismissed = async () => {
    setIsClearing(true);
    setError(null);
    try {
      const result = await clearAllDismissedDuplicates();
      if (result.error) {
        setError(result.error);
      } else if (result.count > 0) {
        setTimeout(() => startScan(), 500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear');
    } finally {
      setIsClearing(false);
    }
  };

  // Toggle selection of a game
  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Select all in current group
  const selectAll = () => {
    const group = duplicates[currentIndex];
    if (!group) return;
    setSelectedIds(new Set(group.games.map(g => g.id)));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedIds(new Set());
    setMergePrimaryId(null);
  };

  // Keep selected copy and delete the rest (quick action)
  const handleKeepOne = async (keepId: string) => {
    const group = duplicates[currentIndex];
    if (!group) return;

    setIsProcessing(true);
    const toDelete = group.games.filter(g => g.id !== keepId).map(g => g.id);

    try {
      const result = await mergeDuplicateGames(keepId, toDelete);
      if (result.error) {
        setError(result.error);
      } else {
        setResolvedCount(prev => prev + 1);
        goToNext();
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process');
    } finally {
      setIsProcessing(false);
    }
  };

  // Keep all copies (not duplicates)
  const handleKeepAll = async (remember: boolean) => {
    const group = duplicates[currentIndex];
    if (!group) return;

    if (remember) {
      const gameIds = group.games.map(g => g.id);
      await dismissDuplicateGroup(group.normalizedTitle, gameIds);
    }

    setResolvedCount(prev => prev + 1);
    goToNext();
  };

  // Delete all copies
  const handleDeleteAll = async () => {
    const group = duplicates[currentIndex];
    if (!group) return;

    setIsProcessing(true);
    try {
      for (const game of group.games) {
        await deleteUserGame(game.id);
      }
      setResolvedCount(prev => prev + 1);
      goToNext();
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete selected items
  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;

    setIsProcessing(true);
    try {
      for (const id of selectedIds) {
        await deleteUserGame(id);
      }

      // Check if we deleted all items in the group
      const group = duplicates[currentIndex];
      if (group && selectedIds.size >= group.games.length) {
        setResolvedCount(prev => prev + 1);
        goToNext();
      } else {
        // Update duplicates to remove deleted items
        setDuplicates(prev => prev.map((g, idx) =>
          idx === currentIndex
            ? { ...g, games: g.games.filter(game => !selectedIds.has(game.id)) }
            : g
        ));
        clearSelection();
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setIsProcessing(false);
    }
  };

  // Keep selected items (dismiss from duplicate group)
  const handleKeepSelected = async () => {
    if (selectedIds.size === 0) return;

    const group = duplicates[currentIndex];
    if (!group) return;

    // If all items are selected, just dismiss the whole group
    if (selectedIds.size >= group.games.length) {
      await dismissDuplicateGroup(group.normalizedTitle, Array.from(selectedIds));
      setResolvedCount(prev => prev + 1);
      goToNext();
      return;
    }

    // Otherwise, update the group to remove kept items
    setDuplicates(prev => prev.map((g, idx) =>
      idx === currentIndex
        ? { ...g, games: g.games.filter(game => !selectedIds.has(game.id)) }
        : g
    ));
    clearSelection();
  };

  // Merge selected copies into the primary
  const handleMergeSelected = async () => {
    if (selectedIds.size < 2 || !mergePrimaryId) return;

    setIsProcessing(true);
    const toMerge = Array.from(selectedIds).filter(id => id !== mergePrimaryId);

    try {
      const result = await mergeDuplicateGames(mergePrimaryId, toMerge);
      if (result.error) {
        setError(result.error);
      } else {
        // Check if we merged all items
        const group = duplicates[currentIndex];
        if (group && selectedIds.size >= group.games.length) {
          setResolvedCount(prev => prev + 1);
          goToNext();
        } else {
          // Update group to remove merged items (keep primary)
          setDuplicates(prev => prev.map((g, idx) =>
            idx === currentIndex
              ? { ...g, games: g.games.filter(game => !toMerge.includes(game.id)) }
              : g
          ));
          clearSelection();
          setViewMode('choose');
        }
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to merge');
    } finally {
      setIsProcessing(false);
    }
  };

  const goToNext = () => {
    setViewMode('choose');
    clearSelection();
    if (currentIndex < duplicates.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const goToPrev = () => {
    setViewMode('choose');
    clearSelection();
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  // Compute merged stats for preview
  const getMergedStats = (games: UserGame[]) => {
    let totalPlaytime = 0;
    let maxAchievementsEarned = 0;
    let maxAchievementsTotal = 0;
    let maxCompletion = 0;
    let latestPlayed: string | null = null;
    let bestRating: number | null = null;
    const allNotes: string[] = [];

    for (const game of games) {
      totalPlaytime += game.playtime_hours || 0;
      maxAchievementsEarned = Math.max(maxAchievementsEarned, game.achievements_earned || 0);
      maxAchievementsTotal = Math.max(maxAchievementsTotal, game.achievements_total || 0);
      maxCompletion = Math.max(maxCompletion, game.completion_percentage || 0);
      if (game.last_played_at && (!latestPlayed || new Date(game.last_played_at) > new Date(latestPlayed))) {
        latestPlayed = game.last_played_at;
      }
      if (game.personal_rating && (!bestRating || game.personal_rating > bestRating)) {
        bestRating = game.personal_rating;
      }
      if (game.notes) allNotes.push(game.notes);
    }

    return { totalPlaytime, maxAchievementsEarned, maxAchievementsTotal, maxCompletion, latestPlayed, bestRating, allNotes };
  };

  if (!isOpen) return null;

  const currentGroup = duplicates[currentIndex];
  const isComplete = currentIndex >= duplicates.length || duplicates.length === 0;
  const totalGroups = duplicates.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[var(--theme-bg-primary)]/90 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden rounded-2xl animate-modal-slide-in bg-[var(--theme-bg-secondary)] border border-[var(--theme-border)]"
        style={{
          boxShadow: '0 0 0 1px var(--theme-border), 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 80px rgba(168, 85, 247, 0.1)',
        }}
      >
        {/* Top accent */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400/50 to-transparent" />

        {/* Header */}
        <div className="relative px-6 py-4 border-b border-[var(--theme-border)] flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center bg-violet-500/10 border border-violet-500/30 ${phase === 'scanning' ? 'animate-pulse' : ''}`}
              >
                <Scan className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[var(--theme-text-primary)]" style={{ fontFamily: 'var(--font-family-display)' }}>
                  DUPLICATE FINDER
                </h2>
                {phase === 'complete' && totalGroups > 0 && !isComplete && (
                  <p className="text-xs text-[var(--theme-text-subtle)]">
                    Reviewing {currentIndex + 1} of {totalGroups}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[var(--theme-hover-bg)] border border-[var(--theme-border)] text-[var(--theme-text-subtle)] hover:text-[var(--theme-text-primary)] hover:border-[var(--theme-border-hover)] transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress bar */}
          {phase === 'complete' && totalGroups > 0 && (
            <div className="mt-4 h-1 bg-[var(--theme-border)] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-300"
                style={{ width: `${((currentIndex + (isComplete ? 0 : 0)) / totalGroups) * 100}%` }}
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Error */}
          {error && (
            <div className="mx-6 mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-400 flex-1">{error}</p>
              <button onClick={() => setError(null)} className="p-1 hover:bg-red-500/20 rounded">
                <X className="w-3 h-3 text-red-400" />
              </button>
            </div>
          )}

          {/* Idle State */}
          {phase === 'idle' && (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="relative mb-6">
                <div className="w-24 h-24 rounded-2xl flex items-center justify-center bg-violet-500/10 border border-[var(--theme-border)]">
                  <Layers className="w-10 h-10 text-violet-400/60" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--theme-bg-secondary)] border border-amber-500/30">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>
              </div>

              <h3 className="text-xl font-bold text-[var(--theme-text-primary)] mb-2" style={{ fontFamily: 'var(--font-family-display)' }}>
                SCAN FOR DUPLICATES
              </h3>
              <p className="text-sm text-[var(--theme-text-subtle)] text-center max-w-sm mb-8">
                Find games that appear multiple times in your library and choose which copies to keep.
              </p>

              <button
                onClick={startScan}
                disabled={isClearing}
                className="group relative px-8 py-4 rounded-xl overflow-hidden transition-all disabled:opacity-50 bg-violet-500/10 border border-violet-500/40"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-center gap-3">
                  <Scan className="w-5 h-5 text-violet-400" />
                  <span className="text-lg font-bold text-[var(--theme-text-primary)] uppercase tracking-wide" style={{ fontFamily: 'var(--font-family-display)' }}>
                    Start Scan
                  </span>
                </div>
              </button>

              <button
                onClick={handleClearDismissed}
                disabled={isClearing}
                className="mt-6 text-xs text-[var(--theme-text-subtle)] hover:text-amber-400 transition-colors flex items-center gap-2"
              >
                {isClearing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCcw className="w-3 h-3" />}
                Reset dismissed pairs
              </button>
            </div>
          )}

          {/* Scanning State */}
          {phase === 'scanning' && (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="relative mb-6">
                <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" className="stroke-[var(--theme-border)]" strokeWidth="4" />
                  <circle
                    cx="50" cy="50" r="42" fill="none" stroke="url(#scanGrad)" strokeWidth="4"
                    strokeLinecap="round" strokeDasharray={`${scanProgress * 2.64} 264`}
                    className="transition-all duration-300"
                  />
                  <defs>
                    <linearGradient id="scanGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#22d3ee" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-[var(--theme-text-primary)] tabular-nums" style={{ fontFamily: 'var(--font-family-display)' }}>
                    {Math.round(scanProgress)}%
                  </span>
                </div>
              </div>
              <p className="text-sm text-[var(--theme-text-muted)] uppercase tracking-wider" style={{ fontFamily: 'var(--font-family-display)' }}>
                Scanning Library...
              </p>
            </div>
          )}

          {/* Results - All Done */}
          {phase === 'complete' && isComplete && (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="relative w-20 h-20 mb-6">
                <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20" />
                <div className="absolute inset-2 rounded-full flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20">
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                </div>
              </div>

              <h3 className="text-xl font-bold text-[var(--theme-text-primary)] mb-2" style={{ fontFamily: 'var(--font-family-display)' }}>
                {totalGroups === 0 ? 'NO DUPLICATES FOUND' : 'ALL DONE!'}
              </h3>
              <p className="text-sm text-[var(--theme-text-subtle)] mb-8">
                {totalGroups === 0 ? 'Your library is clean!' : `${resolvedCount} duplicate ${resolvedCount === 1 ? 'group' : 'groups'} reviewed`}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => { resetState(); startScan(); }}
                  className="px-5 py-2.5 rounded-xl text-sm text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] bg-[var(--theme-hover-bg)] border border-[var(--theme-border)] hover:border-[var(--theme-border-hover)] transition-all flex items-center gap-2"
                >
                  <RotateCw className="w-4 h-4" />
                  Scan Again
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* Results - Current Group - Choose View */}
          {phase === 'complete' && !isComplete && currentGroup && viewMode === 'choose' && (
            <div className="p-6">
              {/* Game Title */}
              <div className="text-center mb-4">
                <p className="text-[10px] text-[var(--theme-text-subtle)] uppercase tracking-wider mb-1 font-mono">
                  {currentGroup.matchType === 'exact' ? '// EXACT MATCH' : '// SIMILAR TITLES'}
                </p>
                <h3 className="text-2xl font-bold text-[var(--theme-text-primary)]" style={{ fontFamily: 'var(--font-family-display)' }}>
                  {(currentGroup.games[0]?.game as Game)?.title || 'Unknown Game'}
                </h3>
                <p className="text-sm text-[var(--theme-text-subtle)] mt-1">
                  {currentGroup.games.length} copies found • {currentGroup.confidence}% match
                </p>
              </div>

              {/* Selection Toolbar */}
              <div className="flex items-center justify-between mb-4 py-2 px-3 rounded-lg bg-[var(--theme-hover-bg)] border border-[var(--theme-border)]">
                <div className="flex items-center gap-3">
                  <button
                    onClick={selectedIds.size === currentGroup.games.length ? clearSelection : selectAll}
                    className="flex items-center gap-2 text-xs text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] transition-colors"
                  >
                    {selectedIds.size === currentGroup.games.length ? (
                      <CheckSquare className="w-4 h-4 text-violet-400" />
                    ) : selectedIds.size > 0 ? (
                      <CheckSquare className="w-4 h-4 text-violet-400/50" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                    {selectedIds.size === 0 ? 'Select items' : `${selectedIds.size} selected`}
                  </button>
                </div>
                {selectedIds.size > 0 && (
                  <button
                    onClick={clearSelection}
                    className="text-xs text-[var(--theme-text-subtle)] hover:text-[var(--theme-text-primary)] transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Copies Grid with Checkboxes */}
              <div className="grid gap-3 mb-4">
                {currentGroup.games.map((userGame, idx) => {
                  const game = userGame.game as Game;
                  const platform = (() => {
                    const match = userGame.platform.match(/^(.+?)\s*\((.+)\)$/);
                    return match ? match[2] : userGame.platform;
                  })();
                  const isSelected = selectedIds.has(userGame.id);

                  return (
                    <div
                      key={userGame.id}
                      className={`group relative p-4 rounded-xl transition-all ${isSelected ? 'ring-2 ring-violet-400' : ''}`}
                      style={{
                        background: isSelected ? 'rgba(168, 85, 247, 0.12)' : 'var(--theme-bg-tertiary)',
                        border: `1px solid ${isSelected ? 'rgba(168, 85, 247, 0.3)' : 'var(--theme-border)'}`,
                      }}
                    >
                      <div className="flex items-center gap-4">
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleSelection(userGame.id)}
                          disabled={isProcessing}
                          className={`flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-violet-500 border-2 border-violet-400'
                              : 'bg-[var(--theme-bg-secondary)] border-2 border-[var(--theme-text-subtle)]/40 hover:border-violet-400/60'
                          }`}
                        >
                          {isSelected && <Check className="w-4 h-4 text-white" />}
                        </button>

                        {/* Cover */}
                        {game?.cover_url ? (
                          <img src={game.cover_url} alt={game.title} className="w-14 h-18 object-cover rounded-lg" />
                        ) : (
                          <div className="w-14 h-18 rounded-lg bg-[var(--theme-hover-bg)] border border-[var(--theme-border)] flex items-center justify-center">
                            <Gamepad2 className="w-5 h-5 text-[var(--theme-text-primary)]/20" />
                          </div>
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs px-2 py-1 rounded-md bg-[var(--theme-hover-bg)] text-[var(--theme-text-muted)] uppercase tracking-wider font-medium">
                              {platform}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-md uppercase tracking-wider ${
                              userGame.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                              userGame.status === 'playing' ? 'bg-cyan-500/10 text-cyan-400' :
                              'bg-[var(--theme-hover-bg)] text-[var(--theme-text-subtle)]'
                            }`}>
                              {userGame.status}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-[var(--theme-text-muted)]">
                            {userGame.playtime_hours > 0 && (
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4" />
                                {userGame.playtime_hours.toFixed(1)}h
                              </span>
                            )}
                            {userGame.achievements_earned > 0 && (
                              <span className="flex items-center gap-1.5 text-amber-400/70">
                                <Trophy className="w-4 h-4" />
                                {userGame.achievements_earned}
                              </span>
                            )}
                            {userGame.personal_rating && (
                              <span className="flex items-center gap-1.5 text-violet-400/70">
                                <Star className="w-4 h-4" />
                                {userGame.personal_rating}/10
                              </span>
                            )}
                          </div>

                          {userGame.notes && (
                            <p className="text-xs text-[var(--theme-text-subtle)] mt-2 truncate">"{userGame.notes}"</p>
                          )}
                        </div>

                        {/* Quick Keep Button */}
                        <button
                          onClick={() => handleKeepOne(userGame.id)}
                          disabled={isProcessing}
                          className="flex-shrink-0 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium opacity-0 group-hover:opacity-100 transition-all hover:bg-emerald-500/20"
                        >
                          Keep Only
                        </button>
                      </div>

                      {/* Best choice indicator */}
                      {idx === 0 && userGame.playtime_hours > 0 && (
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-[10px] font-bold text-amber-400 uppercase">
                          Most Played
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Selection Actions */}
              {selectedIds.size > 0 && (
                <div
                  className="mb-4 p-4 rounded-xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.08) 0%, rgba(34, 211, 238, 0.05) 100%)',
                    border: '1px solid rgba(168, 85, 247, 0.2)',
                  }}
                >
                  <p className="text-[10px] text-[var(--theme-text-subtle)] uppercase tracking-wider mb-3 font-mono">
                    // Actions for {selectedIds.size} selected
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {/* Merge Selected */}
                    {selectedIds.size >= 2 && (
                      <button
                        onClick={() => setViewMode('merge-select')}
                        disabled={isProcessing}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-violet-500/15 border border-violet-500/30 text-violet-400 text-sm font-medium hover:bg-violet-500/25 transition-all disabled:opacity-50"
                      >
                        <Merge className="w-4 h-4" />
                        Merge Selected
                      </button>
                    )}
                    {/* Keep Selected */}
                    <button
                      onClick={handleKeepSelected}
                      disabled={isProcessing}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium hover:bg-cyan-500/20 transition-all disabled:opacity-50"
                    >
                      <Shield className="w-4 h-4" />
                      Keep Selected
                    </button>
                    {/* Delete Selected */}
                    <button
                      onClick={handleDeleteSelected}
                      disabled={isProcessing}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-all disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Selected
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Actions (when nothing selected) */}
              {selectedIds.size === 0 && (
                <div className="border-t border-[var(--theme-border)] pt-4">
                  <p className="text-[10px] text-[var(--theme-text-subtle)] uppercase tracking-wider mb-3 text-center">Quick actions for all</p>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => { selectAll(); setViewMode('merge-select'); }}
                      disabled={isProcessing}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium hover:bg-violet-500/20 transition-all"
                    >
                      <Merge className="w-3.5 h-3.5" />
                      Merge All
                    </button>
                    <button
                      onClick={() => handleKeepAll(true)}
                      disabled={isProcessing}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium hover:bg-cyan-500/20 transition-all"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      Keep All
                    </button>
                    <button
                      onClick={handleDeleteAll}
                      disabled={isProcessing}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete All
                    </button>
                  </div>
                  <button
                    onClick={() => { setResolvedCount(prev => prev + 1); goToNext(); }}
                    disabled={isProcessing}
                    className="w-full mt-3 py-2 text-xs text-[var(--theme-text-subtle)] hover:text-[var(--theme-text-muted)] transition-colors flex items-center justify-center gap-1"
                  >
                    Skip for now
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Results - Current Group - Merge Select View */}
          {phase === 'complete' && !isComplete && currentGroup && viewMode === 'merge-select' && (() => {
            const selectedGames = currentGroup.games.filter(g => selectedIds.has(g.id));
            const mergedStats = getMergedStats(selectedGames);
            const game = currentGroup.games[0]?.game as Game;

            return (
              <div className="p-6">
                {/* Back button */}
                <button
                  onClick={() => { setViewMode('choose'); setMergePrimaryId(null); }}
                  className="flex items-center gap-2 text-sm text-[var(--theme-text-subtle)] hover:text-[var(--theme-text-primary)] mb-4 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to selection
                </button>

                {/* Header */}
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 mb-3">
                    <Merge className="w-4 h-4 text-violet-400" />
                    <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">
                      Merge {selectedIds.size} Items
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-[var(--theme-text-primary)]" style={{ fontFamily: 'var(--font-family-display)' }}>
                    {game?.title || 'Unknown Game'}
                  </h3>
                  <p className="text-sm text-[var(--theme-text-subtle)] mt-1">
                    Combine selected copies into one
                  </p>
                </div>

                {/* Merged Stats Preview */}
                <div
                  className="p-5 rounded-xl mb-6"
                  style={{
                    background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.05) 0%, rgba(34, 211, 238, 0.05) 100%)',
                    border: '1px solid rgba(168, 85, 247, 0.15)',
                  }}
                >
                  <p className="text-[10px] text-[var(--theme-text-subtle)] uppercase tracking-wider mb-3 font-mono">// Combined Stats from {selectedIds.size} items</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-cyan-400" />
                      <div>
                        <p className="text-lg font-bold text-[var(--theme-text-primary)]">{mergedStats.totalPlaytime.toFixed(1)}h</p>
                        <p className="text-[10px] text-[var(--theme-text-subtle)] uppercase">Total Playtime</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Trophy className="w-5 h-5 text-amber-400" />
                      <div>
                        <p className="text-lg font-bold text-[var(--theme-text-primary)]">
                          {mergedStats.maxAchievementsEarned}
                          {mergedStats.maxAchievementsTotal > 0 && (
                            <span className="text-[var(--theme-text-subtle)]">/{mergedStats.maxAchievementsTotal}</span>
                          )}
                        </p>
                        <p className="text-[10px] text-[var(--theme-text-subtle)] uppercase">Best Achievements</p>
                      </div>
                    </div>
                    {mergedStats.maxCompletion > 0 && (
                      <div className="flex items-center gap-3">
                        <Sparkles className="w-5 h-5 text-emerald-400" />
                        <div>
                          <p className="text-lg font-bold text-[var(--theme-text-primary)]">{mergedStats.maxCompletion}%</p>
                          <p className="text-[10px] text-[var(--theme-text-subtle)] uppercase">Best Completion</p>
                        </div>
                      </div>
                    )}
                    {mergedStats.bestRating && (
                      <div className="flex items-center gap-3">
                        <Star className="w-5 h-5 text-violet-400" />
                        <div>
                          <p className="text-lg font-bold text-[var(--theme-text-primary)]">{mergedStats.bestRating}/10</p>
                          <p className="text-[10px] text-[var(--theme-text-subtle)] uppercase">Your Rating</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {mergedStats.allNotes.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-[var(--theme-border)]">
                      <p className="text-[10px] text-[var(--theme-text-subtle)] uppercase tracking-wider mb-2">Notes will be preserved</p>
                      <p className="text-xs text-[var(--theme-text-muted)] truncate">"{mergedStats.allNotes[0]}"</p>
                      {mergedStats.allNotes.length > 1 && (
                        <p className="text-[10px] text-[var(--theme-text-subtle)] mt-1">+{mergedStats.allNotes.length - 1} more notes</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Select Platform to Keep as Primary */}
                <div className="mb-6">
                  <p className="text-sm text-[var(--theme-text-secondary)] mb-3">Which platform version should be the primary?</p>
                  <div className="grid gap-2">
                    {selectedGames.map((userGame) => {
                      const platform = (() => {
                        const match = userGame.platform.match(/^(.+?)\s*\((.+)\)$/);
                        return match ? match[2] : userGame.platform;
                      })();
                      const isSelected = mergePrimaryId === userGame.id;

                      return (
                        <button
                          key={userGame.id}
                          onClick={() => setMergePrimaryId(userGame.id)}
                          disabled={isProcessing}
                          className={`relative p-3 rounded-xl text-left transition-all ${
                            isSelected ? 'ring-2 ring-violet-400' : ''
                          }`}
                          style={{
                            background: isSelected ? 'rgba(168, 85, 247, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                            border: `1px solid ${isSelected ? 'rgba(168, 85, 247, 0.4)' : 'rgba(255, 255, 255, 0.06)'}`,
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                isSelected ? 'border-violet-400 bg-violet-400' : 'border-white/20'
                              }`}>
                                {isSelected && <div className="w-2 h-2 rounded-full bg-[var(--theme-bg-primary)]" />}
                              </div>
                              <span className="text-sm font-medium text-[var(--theme-text-primary)]">{platform}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-[var(--theme-text-subtle)]">
                              {userGame.playtime_hours > 0 && (
                                <span>{userGame.playtime_hours.toFixed(1)}h</span>
                              )}
                              <span className={`px-2 py-0.5 rounded ${
                                userGame.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                                userGame.status === 'playing' ? 'bg-cyan-500/10 text-cyan-400' :
                                'bg-[var(--theme-hover-bg)] text-[var(--theme-text-subtle)]'
                              }`}>
                                {userGame.status}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Merge Button */}
                <button
                  onClick={handleMergeSelected}
                  disabled={isProcessing || !mergePrimaryId}
                  className="w-full py-4 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{
                    background: mergePrimaryId
                      ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(34, 211, 238, 0.2) 100%)'
                      : 'rgba(255, 255, 255, 0.02)',
                    border: `1px solid ${mergePrimaryId ? 'rgba(168, 85, 247, 0.4)' : 'rgba(255, 255, 255, 0.06)'}`,
                  }}
                >
                  {isProcessing ? (
                    <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
                  ) : (
                    <>
                      <Merge className="w-5 h-5 text-violet-400" />
                      <span className={mergePrimaryId ? 'text-[var(--theme-text-primary)]' : 'text-[var(--theme-text-subtle)]'}>
                        {mergePrimaryId ? `Merge ${selectedIds.size} into One` : 'Select a primary platform'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            );
          })()}
        </div>

        {/* Navigation Footer */}
        {phase === 'complete' && !isComplete && totalGroups > 1 && (
          <div className="px-6 py-4 border-t border-[var(--theme-border)] flex items-center justify-between">
            <button
              onClick={goToPrev}
              disabled={currentIndex === 0 || isProcessing}
              className="px-4 py-2 text-sm text-[var(--theme-text-subtle)] hover:text-[var(--theme-text-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ← Previous
            </button>
            <div className="flex items-center gap-1.5">
              {duplicates.slice(0, 10).map((_, idx) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    idx === currentIndex ? 'bg-violet-400' :
                    idx < currentIndex ? 'bg-emerald-400/50' : 'bg-[var(--theme-border)]'
                  }`}
                />
              ))}
              {duplicates.length > 10 && (
                <span className="text-[10px] text-[var(--theme-text-subtle)] ml-1">+{duplicates.length - 10}</span>
              )}
            </div>
            <button
              onClick={goToNext}
              disabled={currentIndex >= duplicates.length - 1 || isProcessing}
              className="px-4 py-2 text-sm text-[var(--theme-text-subtle)] hover:text-[var(--theme-text-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
