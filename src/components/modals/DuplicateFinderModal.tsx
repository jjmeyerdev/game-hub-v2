'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import {
  X,
  Scan,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Trash2,
  Gamepad2,
  Clock,
  Trophy,
  Layers,
  Sparkles,
  RotateCw,
  RefreshCcw,
  ChevronRight,
  ChevronLeft,
  Star,
  Shield,
  Merge,
  ArrowLeft,
  Check,
  Square,
  CheckSquare,
  FileStack,
  Pencil,
  Play,
  Zap,
  AlertCircle,
} from 'lucide-react';
import {
  findDuplicateGames,
  mergeDuplicateGames,
  deleteUserGame,
  dismissDuplicateGroup,
  clearAllDismissedDuplicates,
} from '@/lib/actions/games';
import type { DuplicateGroup, UserGame, Game } from '@/lib/actions/games';
import { getDisplayPlatform } from '@/lib/constants/platforms';

interface DuplicateFinderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type ScanPhase = 'idle' | 'scanning' | 'reviewing' | 'summary' | 'executing' | 'complete';
type ViewMode = 'choose' | 'merge-select';

// Action types for the summary
type ActionType = 'keep_one' | 'keep_all' | 'merge' | 'delete_all' | 'skip';

interface PendingAction {
  groupIndex: number;
  normalizedTitle: string;
  gameTitle: string;
  coverUrl: string | null;
  actionType: ActionType;
  keepId?: string;
  keepPlatform?: string;
  mergeIntoId?: string;
  mergePlatform?: string;
  mergeFromIds?: string[];
  gameIds: string[];
  gamesCount: number;
}

export function DuplicateFinderModal({
  isOpen,
  onClose,
  onSuccess,
}: DuplicateFinderModalProps) {
  const [phase, setPhase] = useState<ScanPhase>('idle');
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [isClearing, setIsClearing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('choose');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [mergePrimaryId, setMergePrimaryId] = useState<string | null>(null);

  // Pending actions for the review phase
  const [pendingActions, setPendingActions] = useState<Map<number, PendingAction>>(
    new Map()
  );
  const [executionProgress, setExecutionProgress] = useState(0);
  const [executionResults, setExecutionResults] = useState<{
    success: number;
    failed: number;
  }>({ success: 0, failed: 0 });

  // Edit mode for summary
  const [editingActionIndex, setEditingActionIndex] = useState<number | null>(null);

  const resetState = useCallback(() => {
    setPhase('idle');
    setDuplicates([]);
    setCurrentIndex(0);
    setError(null);
    setScanProgress(0);
    setViewMode('choose');
    setSelectedIds(new Set());
    setMergePrimaryId(null);
    setPendingActions(new Map());
    setExecutionProgress(0);
    setExecutionResults({ success: 0, failed: 0 });
    setEditingActionIndex(null);
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
      setScanProgress((prev) => Math.min(prev + Math.random() * 15, 90));
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

      await new Promise((resolve) => setTimeout(resolve, 300));

      const sortedDuplicates = (result.data || []).sort((a, b) => {
        const titleA = ((a.games[0]?.game as Game)?.title || '').toLowerCase();
        const titleB = ((b.games[0]?.game as Game)?.title || '').toLowerCase();
        return titleA.localeCompare(titleB);
      });

      setDuplicates(sortedDuplicates);
      setCurrentIndex(0);
      setPendingActions(new Map());
      setPhase(sortedDuplicates.length > 0 ? 'reviewing' : 'complete');
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

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    const group = duplicates[currentIndex];
    if (!group) return;
    setSelectedIds(new Set(group.games.map((g) => g.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setMergePrimaryId(null);
  };

  // Add a pending action instead of executing immediately
  const addPendingAction = (action: Omit<PendingAction, 'groupIndex'>) => {
    setPendingActions((prev) => {
      const newMap = new Map(prev);
      newMap.set(currentIndex, { ...action, groupIndex: currentIndex });
      return newMap;
    });
    goToNext();
  };

  // Keep one copy (add to pending)
  const handleKeepOne = (keepId: string) => {
    const group = duplicates[currentIndex];
    if (!group) return;

    const keepGame = group.games.find((g) => g.id === keepId);
    const game = group.games[0]?.game as Game;

    addPendingAction({
      normalizedTitle: group.normalizedTitle,
      gameTitle: game?.title || 'Unknown Game',
      coverUrl: game?.cover_url || null,
      actionType: 'keep_one',
      keepId,
      keepPlatform: keepGame ? getDisplayPlatform(keepGame.platform) : undefined,
      gameIds: group.games.map((g) => g.id),
      gamesCount: group.games.length,
    });
  };

  // Keep all copies
  const handleKeepAll = () => {
    const group = duplicates[currentIndex];
    if (!group) return;

    const game = group.games[0]?.game as Game;

    addPendingAction({
      normalizedTitle: group.normalizedTitle,
      gameTitle: game?.title || 'Unknown Game',
      coverUrl: game?.cover_url || null,
      actionType: 'keep_all',
      gameIds: group.games.map((g) => g.id),
      gamesCount: group.games.length,
    });
  };

  // Delete all copies
  const handleDeleteAll = () => {
    const group = duplicates[currentIndex];
    if (!group) return;

    const game = group.games[0]?.game as Game;

    addPendingAction({
      normalizedTitle: group.normalizedTitle,
      gameTitle: game?.title || 'Unknown Game',
      coverUrl: game?.cover_url || null,
      actionType: 'delete_all',
      gameIds: group.games.map((g) => g.id),
      gamesCount: group.games.length,
    });
  };

  // Skip (mark for later)
  const handleSkip = () => {
    const group = duplicates[currentIndex];
    if (!group) return;

    const game = group.games[0]?.game as Game;

    addPendingAction({
      normalizedTitle: group.normalizedTitle,
      gameTitle: game?.title || 'Unknown Game',
      coverUrl: game?.cover_url || null,
      actionType: 'skip',
      gameIds: group.games.map((g) => g.id),
      gamesCount: group.games.length,
    });
  };

  // Merge selected
  const handleMergeSelected = () => {
    if (selectedIds.size < 2 || !mergePrimaryId) return;

    const group = duplicates[currentIndex];
    if (!group) return;

    const primaryGame = group.games.find((g) => g.id === mergePrimaryId);
    const game = group.games[0]?.game as Game;
    const mergeFromIds = Array.from(selectedIds).filter((id) => id !== mergePrimaryId);

    addPendingAction({
      normalizedTitle: group.normalizedTitle,
      gameTitle: game?.title || 'Unknown Game',
      coverUrl: game?.cover_url || null,
      actionType: 'merge',
      mergeIntoId: mergePrimaryId,
      mergePlatform: primaryGame ? getDisplayPlatform(primaryGame.platform) : undefined,
      mergeFromIds,
      gameIds: group.games.map((g) => g.id),
      gamesCount: group.games.length,
    });

    setViewMode('choose');
    clearSelection();
  };

  const goToNext = () => {
    setViewMode('choose');
    clearSelection();
    if (currentIndex < duplicates.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // All reviewed, go to summary
      setPhase('summary');
    }
  };

  const goToPrev = () => {
    setViewMode('choose');
    clearSelection();
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Go back to reviewing from summary
  const goBackToReview = (index: number) => {
    setCurrentIndex(index);
    setPhase('reviewing');
    setEditingActionIndex(null);
  };

  // Remove a pending action
  const removeAction = (index: number) => {
    setPendingActions((prev) => {
      const newMap = new Map(prev);
      newMap.delete(index);
      return newMap;
    });
  };

  // Change action type in summary
  const changeActionType = (index: number, newType: ActionType) => {
    setPendingActions((prev) => {
      const newMap = new Map(prev);
      const action = newMap.get(index);
      if (action) {
        newMap.set(index, { ...action, actionType: newType });
      }
      return newMap;
    });
    setEditingActionIndex(null);
  };

  // Execute all pending actions
  const executeAllActions = async () => {
    setPhase('executing');
    setExecutionProgress(0);
    setExecutionResults({ success: 0, failed: 0 });
    setError(null);

    const actionsToExecute = Array.from(pendingActions.values()).filter(
      (a) => a.actionType !== 'skip'
    );
    const total = actionsToExecute.length;
    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < actionsToExecute.length; i++) {
      const action = actionsToExecute[i];
      setExecutionProgress(Math.round(((i + 1) / total) * 100));

      try {
        switch (action.actionType) {
          case 'keep_one':
            if (action.keepId) {
              const toDelete = action.gameIds.filter((id) => id !== action.keepId);
              await mergeDuplicateGames(action.keepId, toDelete);
            }
            break;

          case 'keep_all':
            await dismissDuplicateGroup(action.normalizedTitle, action.gameIds);
            break;

          case 'merge':
            if (action.mergeIntoId && action.mergeFromIds) {
              await mergeDuplicateGames(action.mergeIntoId, action.mergeFromIds);
            }
            break;

          case 'delete_all':
            for (const id of action.gameIds) {
              await deleteUserGame(id);
            }
            break;
        }
        successCount++;
      } catch (err) {
        console.error('Action failed:', err);
        failedCount++;
      }
    }

    setExecutionResults({ success: successCount, failed: failedCount });
    setPhase('complete');
    if (successCount > 0) {
      onSuccess();
    }
  };

  // Computed values
  const currentGroup = duplicates[currentIndex];
  const isReviewComplete =
    currentIndex >= duplicates.length - 1 && pendingActions.has(currentIndex);
  const totalGroups = duplicates.length;
  const actionsCount = pendingActions.size;
  const nonSkipActions = Array.from(pendingActions.values()).filter(
    (a) => a.actionType !== 'skip'
  ).length;

  // Stats for summary
  const actionStats = useMemo(() => {
    const stats = { keep_one: 0, keep_all: 0, merge: 0, delete_all: 0, skip: 0 };
    pendingActions.forEach((action) => {
      stats[action.actionType]++;
    });
    return stats;
  }, [pendingActions]);

  // Merged stats helper
  const getMergedStats = (games: UserGame[]) => {
    let totalPlaytime = 0;
    let maxAchievementsEarned = 0;
    let maxAchievementsTotal = 0;

    for (const game of games) {
      totalPlaytime += game.playtime_hours || 0;
      maxAchievementsEarned = Math.max(
        maxAchievementsEarned,
        game.achievements_earned || 0
      );
      maxAchievementsTotal = Math.max(
        maxAchievementsTotal,
        game.achievements_total || 0
      );
    }

    return { totalPlaytime, maxAchievementsEarned, maxAchievementsTotal };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-theme-primary/90 backdrop-blur-sm"
        onClick={phase === 'executing' ? undefined : onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden rounded-2xl animate-modal-slide-in bg-theme-secondary border border-theme"
        style={{
          boxShadow:
            '0 0 0 1px var(--theme-border), 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 80px rgba(168, 85, 247, 0.1)',
        }}
      >
        {/* Top accent */}
        <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-violet-400/50 to-transparent" />

        {/* Header */}
        <div className="relative px-6 py-4 border-b border-theme shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  phase === 'scanning' || phase === 'executing'
                    ? 'animate-pulse bg-violet-500/20 border-violet-500/40'
                    : phase === 'summary'
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-violet-500/10 border-violet-500/30'
                } border`}
              >
                {phase === 'summary' ? (
                  <FileStack className="w-5 h-5 text-amber-400" />
                ) : (
                  <Scan className="w-5 h-5 text-violet-400" />
                )}
              </div>
              <div>
                <h2
                  className="text-lg font-bold text-theme-primary"
                  style={{ fontFamily: 'var(--font-family-display)' }}
                >
                  {phase === 'summary' ? 'REVIEW ACTIONS' : 'DUPLICATE FINDER'}
                </h2>
                {phase === 'reviewing' && totalGroups > 0 && (
                  <p className="text-xs text-theme-subtle">
                    Reviewing {currentIndex + 1} of {totalGroups} • {actionsCount}{' '}
                    action{actionsCount !== 1 ? 's' : ''} queued
                  </p>
                )}
                {phase === 'summary' && (
                  <p className="text-xs text-theme-subtle">
                    {nonSkipActions} action{nonSkipActions !== 1 ? 's' : ''} ready to
                    execute
                  </p>
                )}
              </div>
            </div>
            {phase !== 'executing' && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-theme-hover border border-theme text-theme-subtle hover:text-theme-primary hover:border-theme-hover transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Progress bar */}
          {(phase === 'reviewing' || phase === 'summary') && totalGroups > 0 && (
            <div className="mt-4 h-1 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-violet-500 to-cyan-400 transition-all duration-300"
                style={{
                  width:
                    phase === 'summary'
                      ? '100%'
                      : `${((currentIndex + (pendingActions.has(currentIndex) ? 1 : 0)) / totalGroups) * 100}%`,
                }}
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Error */}
          {error && (
            <div className="mx-6 mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-sm text-red-400 flex-1">{error}</p>
              <button
                onClick={() => setError(null)}
                className="p-1 hover:bg-red-500/20 rounded"
              >
                <X className="w-3 h-3 text-red-400" />
              </button>
            </div>
          )}

          {/* Idle State */}
          {phase === 'idle' && (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="relative mb-6">
                <div className="w-24 h-24 rounded-2xl flex items-center justify-center bg-violet-500/10 border border-theme">
                  <Layers className="w-10 h-10 text-violet-400/60" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg flex items-center justify-center bg-theme-secondary border border-amber-500/30">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>
              </div>

              <h3
                className="text-xl font-bold text-theme-primary mb-2"
                style={{ fontFamily: 'var(--font-family-display)' }}
              >
                SCAN FOR DUPLICATES
              </h3>
              <p className="text-sm text-theme-subtle text-center max-w-sm mb-8">
                Find games that appear multiple times in your library. Review each
                group and decide which copies to keep.
              </p>

              <button
                onClick={startScan}
                disabled={isClearing}
                className="group relative px-8 py-4 rounded-xl overflow-hidden transition-all disabled:opacity-50 bg-violet-500/10 border border-violet-500/40"
              >
                <div className="absolute inset-0 bg-linear-to-r from-violet-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-center gap-3">
                  <Scan className="w-5 h-5 text-violet-400" />
                  <span
                    className="text-lg font-bold text-theme-primary uppercase tracking-wide"
                    style={{ fontFamily: 'var(--font-family-display)' }}
                  >
                    Start Scan
                  </span>
                </div>
              </button>

              <button
                onClick={handleClearDismissed}
                disabled={isClearing}
                className="mt-6 text-xs text-theme-subtle hover:text-amber-400 transition-colors flex items-center gap-2"
              >
                {isClearing ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <RefreshCcw className="w-3 h-3" />
                )}
                Reset dismissed pairs
              </button>
            </div>
          )}

          {/* Scanning State */}
          {phase === 'scanning' && (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="relative mb-6">
                <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    className="stroke-border"
                    strokeWidth="4"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="url(#scanGrad)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={`${scanProgress * 2.64} 264`}
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
                  <span
                    className="text-2xl font-bold text-theme-primary tabular-nums"
                    style={{ fontFamily: 'var(--font-family-display)' }}
                  >
                    {Math.round(scanProgress)}%
                  </span>
                </div>
              </div>
              <p
                className="text-sm text-theme-muted uppercase tracking-wider"
                style={{ fontFamily: 'var(--font-family-display)' }}
              >
                Scanning Library...
              </p>
            </div>
          )}

          {/* Reviewing Phase */}
          {phase === 'reviewing' && currentGroup && viewMode === 'choose' && (
            <div className="p-6">
              {/* Game Title */}
              <div className="text-center mb-4">
                <p className="text-[10px] text-theme-subtle uppercase tracking-wider mb-1 font-mono">
                  {currentGroup.matchType === 'exact'
                    ? '// EXACT MATCH'
                    : '// SIMILAR TITLES'}
                </p>
                <h3
                  className="text-2xl font-bold text-theme-primary"
                  style={{ fontFamily: 'var(--font-family-display)' }}
                >
                  {(currentGroup.games[0]?.game as Game)?.title || 'Unknown Game'}
                </h3>
                <p className="text-sm text-theme-subtle mt-1">
                  {currentGroup.games.length} copies found • {currentGroup.confidence}%
                  match
                </p>
              </div>

              {/* Copies Grid with Selection */}
              <div className="grid gap-3 mb-4">
                {currentGroup.games.map((userGame, idx) => {
                  const game = userGame.game as Game;
                  const platform = getDisplayPlatform(userGame.platform);
                  const isSelected = selectedIds.has(userGame.id);

                  return (
                    <div
                      key={userGame.id}
                      className={`group relative p-4 rounded-xl transition-all ${
                        isSelected ? 'ring-2 ring-violet-400' : ''
                      }`}
                      style={{
                        background: isSelected
                          ? 'rgba(168, 85, 247, 0.12)'
                          : 'var(--theme-bg-tertiary)',
                        border: `1px solid ${
                          isSelected
                            ? 'rgba(168, 85, 247, 0.3)'
                            : 'var(--theme-border)'
                        }`,
                      }}
                    >
                      <div className="flex items-center gap-4">
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleSelection(userGame.id)}
                          className={`shrink-0 w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-violet-500 border-2 border-violet-400'
                              : 'bg-theme-secondary border-2 border-text-subtle/40 hover:border-violet-400/60'
                          }`}
                        >
                          {isSelected && <Check className="w-4 h-4 text-white" />}
                        </button>

                        {/* Cover */}
                        {game?.cover_url ? (
                          <div className="relative w-14 h-[72px] rounded-lg overflow-hidden shrink-0">
                            <Image
                              src={game.cover_url}
                              alt={game.title}
                              fill
                              className="object-cover"
                              sizes="56px"
                            />
                          </div>
                        ) : (
                          <div className="w-14 h-[72px] rounded-lg bg-theme-hover border border-theme flex items-center justify-center shrink-0">
                            <Gamepad2 className="w-5 h-5 text-theme-primary/20" />
                          </div>
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-xs px-2 py-1 rounded-md bg-theme-hover text-theme-muted uppercase tracking-wider font-medium">
                              {platform}
                            </span>
                            <span
                              className={`text-xs px-2 py-1 rounded-md uppercase tracking-wider ${
                                userGame.status === 'completed'
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : userGame.status === 'playing'
                                  ? 'bg-cyan-500/10 text-cyan-400'
                                  : 'bg-theme-hover text-theme-subtle'
                              }`}
                            >
                              {userGame.status}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-theme-muted">
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
                        </div>

                        {/* Quick Keep Button */}
                        <button
                          onClick={() => handleKeepOne(userGame.id)}
                          className="shrink-0 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium opacity-0 group-hover:opacity-100 transition-all hover:bg-emerald-500/20"
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
                    background:
                      'linear-gradient(135deg, rgba(168, 85, 247, 0.08) 0%, rgba(34, 211, 238, 0.05) 100%)',
                    border: '1px solid rgba(168, 85, 247, 0.2)',
                  }}
                >
                  <p className="text-[10px] text-theme-subtle uppercase tracking-wider mb-3 font-mono">
                    // Actions for {selectedIds.size} selected
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {selectedIds.size >= 2 && (
                      <button
                        onClick={() => setViewMode('merge-select')}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-violet-500/15 border border-violet-500/30 text-violet-400 text-sm font-medium hover:bg-violet-500/25 transition-all"
                      >
                        <Merge className="w-4 h-4" />
                        Merge Selected
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              {selectedIds.size === 0 && (
                <div className="border-t border-theme pt-4">
                  <p className="text-[10px] text-theme-subtle uppercase tracking-wider mb-3 text-center">
                    Quick actions for all
                  </p>
                  <div className="flex gap-2 justify-center flex-wrap">
                    <button
                      onClick={() => {
                        selectAll();
                        setViewMode('merge-select');
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium hover:bg-violet-500/20 transition-all"
                    >
                      <Merge className="w-3.5 h-3.5" />
                      Merge All
                    </button>
                    <button
                      onClick={handleKeepAll}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium hover:bg-cyan-500/20 transition-all"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      Keep All
                    </button>
                    <button
                      onClick={handleDeleteAll}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete All
                    </button>
                  </div>
                  <button
                    onClick={handleSkip}
                    className="w-full mt-3 py-2 text-xs text-theme-subtle hover:text-theme-muted transition-colors flex items-center justify-center gap-1"
                  >
                    Skip for now
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Merge Select View */}
          {phase === 'reviewing' && currentGroup && viewMode === 'merge-select' &&
            (() => {
              const selectedGames = currentGroup.games.filter((g) =>
                selectedIds.has(g.id)
              );
              const mergedStats = getMergedStats(selectedGames);
              const game = currentGroup.games[0]?.game as Game;

              return (
                <div className="p-6">
                  <button
                    onClick={() => {
                      setViewMode('choose');
                      setMergePrimaryId(null);
                    }}
                    className="flex items-center gap-2 text-sm text-theme-subtle hover:text-theme-primary mb-4 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to selection
                  </button>

                  <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 mb-3">
                      <Merge className="w-4 h-4 text-violet-400" />
                      <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">
                        Merge {selectedIds.size} Items
                      </span>
                    </div>
                    <h3
                      className="text-2xl font-bold text-theme-primary"
                      style={{ fontFamily: 'var(--font-family-display)' }}
                    >
                      {game?.title || 'Unknown Game'}
                    </h3>
                  </div>

                  {/* Merged Stats Preview */}
                  <div
                    className="p-5 rounded-xl mb-6"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(168, 85, 247, 0.05) 0%, rgba(34, 211, 238, 0.05) 100%)',
                      border: '1px solid rgba(168, 85, 247, 0.15)',
                    }}
                  >
                    <p className="text-[10px] text-theme-subtle uppercase tracking-wider mb-3 font-mono">
                      // Combined Stats
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-cyan-400" />
                        <div>
                          <p className="text-lg font-bold text-theme-primary">
                            {mergedStats.totalPlaytime.toFixed(1)}h
                          </p>
                          <p className="text-[10px] text-theme-subtle uppercase">
                            Total Playtime
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Trophy className="w-5 h-5 text-amber-400" />
                        <div>
                          <p className="text-lg font-bold text-theme-primary">
                            {mergedStats.maxAchievementsEarned}
                            {mergedStats.maxAchievementsTotal > 0 && (
                              <span className="text-theme-subtle">
                                /{mergedStats.maxAchievementsTotal}
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-theme-subtle uppercase">
                            Best Achievements
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Select Primary */}
                  <div className="mb-6">
                    <p className="text-sm text-theme-secondary mb-3">
                      Select the primary platform:
                    </p>
                    <div className="grid gap-2">
                      {selectedGames.map((userGame) => {
                        const platform = getDisplayPlatform(userGame.platform);
                        const isSelected = mergePrimaryId === userGame.id;

                        return (
                          <button
                            key={userGame.id}
                            onClick={() => setMergePrimaryId(userGame.id)}
                            className={`relative p-3 rounded-xl text-left transition-all ${
                              isSelected ? 'ring-2 ring-violet-400' : ''
                            }`}
                            style={{
                              background: isSelected
                                ? 'rgba(168, 85, 247, 0.1)'
                                : 'rgba(255, 255, 255, 0.02)',
                              border: `1px solid ${
                                isSelected
                                  ? 'rgba(168, 85, 247, 0.4)'
                                  : 'rgba(255, 255, 255, 0.06)'
                              }`,
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                    isSelected
                                      ? 'border-violet-400 bg-violet-400'
                                      : 'border-white/20'
                                  }`}
                                >
                                  {isSelected && (
                                    <div className="w-2 h-2 rounded-full bg-theme-primary" />
                                  )}
                                </div>
                                <span className="text-sm font-medium text-theme-primary">
                                  {platform}
                                </span>
                              </div>
                              <span className="text-xs text-theme-subtle">
                                {userGame.playtime_hours > 0 &&
                                  `${userGame.playtime_hours.toFixed(1)}h`}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    onClick={handleMergeSelected}
                    disabled={!mergePrimaryId}
                    className="w-full py-4 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    style={{
                      background: mergePrimaryId
                        ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(34, 211, 238, 0.2) 100%)'
                        : 'rgba(255, 255, 255, 0.02)',
                      border: `1px solid ${
                        mergePrimaryId
                          ? 'rgba(168, 85, 247, 0.4)'
                          : 'rgba(255, 255, 255, 0.06)'
                      }`,
                    }}
                  >
                    <Merge className="w-5 h-5 text-violet-400" />
                    <span
                      className={
                        mergePrimaryId ? 'text-theme-primary' : 'text-theme-subtle'
                      }
                    >
                      {mergePrimaryId
                        ? `Merge ${selectedIds.size} into One`
                        : 'Select a primary platform'}
                    </span>
                  </button>
                </div>
              );
            })()}

          {/* Summary Phase */}
          {phase === 'summary' && (
            <div className="p-6">
              {/* Stats Overview */}
              <div className="grid grid-cols-4 gap-3 mb-6">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <p className="text-2xl font-bold text-emerald-400">
                    {actionStats.keep_one}
                  </p>
                  <p className="text-[10px] text-emerald-400/70 uppercase">Keep One</p>
                </div>
                <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 text-center">
                  <p className="text-2xl font-bold text-violet-400">
                    {actionStats.merge}
                  </p>
                  <p className="text-[10px] text-violet-400/70 uppercase">Merge</p>
                </div>
                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-center">
                  <p className="text-2xl font-bold text-cyan-400">
                    {actionStats.keep_all}
                  </p>
                  <p className="text-[10px] text-cyan-400/70 uppercase">Keep All</p>
                </div>
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
                  <p className="text-2xl font-bold text-red-400">
                    {actionStats.delete_all}
                  </p>
                  <p className="text-[10px] text-red-400/70 uppercase">Delete</p>
                </div>
              </div>

              {/* Actions List */}
              <div className="space-y-2 mb-6 max-h-[300px] overflow-y-auto">
                {Array.from(pendingActions.entries())
                  .sort(([a], [b]) => a - b)
                  .map(([index, action]) => (
                    <div
                      key={index}
                      className="group relative p-3 rounded-xl bg-theme-tertiary border border-theme hover:border-theme-hover transition-all"
                    >
                      <div className="flex items-center gap-3">
                        {/* Cover */}
                        {action.coverUrl ? (
                          <div className="relative w-10 h-14 rounded-lg overflow-hidden shrink-0">
                            <Image
                              src={action.coverUrl}
                              alt={action.gameTitle}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-14 rounded-lg bg-theme-hover flex items-center justify-center shrink-0">
                            <Gamepad2 className="w-4 h-4 text-theme-subtle" />
                          </div>
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-theme-primary truncate">
                            {action.gameTitle}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            {/* Action Badge */}
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-medium ${
                                action.actionType === 'keep_one'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : action.actionType === 'merge'
                                  ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                                  : action.actionType === 'keep_all'
                                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                  : action.actionType === 'delete_all'
                                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                  : 'bg-theme-hover text-theme-subtle border border-theme'
                              }`}
                            >
                              {action.actionType === 'keep_one'
                                ? `Keep ${action.keepPlatform || 'one'}`
                                : action.actionType === 'merge'
                                ? `Merge → ${action.mergePlatform || 'one'}`
                                : action.actionType === 'keep_all'
                                ? 'Keep all'
                                : action.actionType === 'delete_all'
                                ? 'Delete all'
                                : 'Skip'}
                            </span>
                            <span className="text-[10px] text-theme-subtle">
                              {action.gamesCount} copies
                            </span>
                          </div>
                        </div>

                        {/* Edit/Remove Buttons */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => goBackToReview(index)}
                            className="p-2 rounded-lg bg-theme-hover hover:bg-theme-active text-theme-muted hover:text-theme-primary transition-all"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeAction(index)}
                            className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all"
                            title="Remove"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Skipped notice */}
              {actionStats.skip > 0 && (
                <div className="mb-6 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <p className="text-sm text-amber-400">
                    {actionStats.skip} group{actionStats.skip !== 1 ? 's' : ''} will be
                    skipped (no changes)
                  </p>
                </div>
              )}

              {/* Execute Button */}
              <button
                onClick={executeAllActions}
                disabled={nonSkipActions === 0}
                className="w-full py-4 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                style={{
                  background:
                    nonSkipActions > 0
                      ? 'linear-gradient(135deg, rgba(52, 211, 153, 0.2) 0%, rgba(34, 211, 238, 0.2) 100%)'
                      : 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${
                    nonSkipActions > 0
                      ? 'rgba(52, 211, 153, 0.4)'
                      : 'rgba(255, 255, 255, 0.06)'
                  }`,
                }}
              >
                <Zap className="w-5 h-5 text-emerald-400" />
                <span
                  className={
                    nonSkipActions > 0 ? 'text-theme-primary' : 'text-theme-subtle'
                  }
                  style={{ fontFamily: 'var(--font-family-display)' }}
                >
                  EXECUTE {nonSkipActions} ACTION{nonSkipActions !== 1 ? 'S' : ''}
                </span>
              </button>

              <button
                onClick={onClose}
                className="w-full mt-3 py-2 text-sm text-theme-subtle hover:text-theme-muted transition-colors"
              >
                Cancel & Discard All
              </button>
            </div>
          )}

          {/* Executing Phase */}
          {phase === 'executing' && (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="relative mb-6">
                <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    className="stroke-border"
                    strokeWidth="4"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="url(#execGrad)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={`${executionProgress * 2.64} 264`}
                    className="transition-all duration-300"
                  />
                  <defs>
                    <linearGradient id="execGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#34d399" />
                      <stop offset="100%" stopColor="#22d3ee" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span
                    className="text-2xl font-bold text-theme-primary tabular-nums"
                    style={{ fontFamily: 'var(--font-family-display)' }}
                  >
                    {executionProgress}%
                  </span>
                </div>
              </div>
              <p
                className="text-sm text-theme-muted uppercase tracking-wider"
                style={{ fontFamily: 'var(--font-family-display)' }}
              >
                Executing Actions...
              </p>
            </div>
          )}

          {/* Complete Phase */}
          {phase === 'complete' && (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="relative w-20 h-20 mb-6">
                <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20" />
                <div className="absolute inset-2 rounded-full flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20">
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                </div>
              </div>

              <h3
                className="text-xl font-bold text-theme-primary mb-2"
                style={{ fontFamily: 'var(--font-family-display)' }}
              >
                {totalGroups === 0 ? 'NO DUPLICATES FOUND' : 'ALL DONE!'}
              </h3>

              {executionResults.success > 0 || executionResults.failed > 0 ? (
                <div className="flex items-center gap-4 mb-6">
                  {executionResults.success > 0 && (
                    <span className="text-sm text-emerald-400">
                      {executionResults.success} succeeded
                    </span>
                  )}
                  {executionResults.failed > 0 && (
                    <span className="text-sm text-red-400">
                      {executionResults.failed} failed
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-sm text-theme-subtle mb-8">
                  {totalGroups === 0 ? 'Your library is clean!' : 'Library cleaned up successfully'}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    resetState();
                    startScan();
                  }}
                  className="px-5 py-2.5 rounded-xl text-sm text-theme-muted hover:text-theme-primary bg-theme-hover border border-theme hover:border-theme-hover transition-all flex items-center gap-2"
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
        </div>

        {/* Navigation Footer */}
        {phase === 'reviewing' && totalGroups > 1 && (
          <div className="px-6 py-4 border-t border-theme flex items-center justify-between shrink-0">
            <button
              onClick={goToPrev}
              disabled={currentIndex === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm text-theme-subtle hover:text-theme-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <div className="flex items-center gap-1.5">
              {duplicates.slice(0, 10).map((_, idx) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    idx === currentIndex
                      ? 'bg-violet-400'
                      : pendingActions.has(idx)
                      ? 'bg-emerald-400/50'
                      : 'bg-border'
                  }`}
                />
              ))}
              {duplicates.length > 10 && (
                <span className="text-[10px] text-theme-subtle ml-1">
                  +{duplicates.length - 10}
                </span>
              )}
            </div>

            <button
              onClick={() => setPhase('summary')}
              disabled={pendingActions.size === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-400 hover:text-amber-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Review All
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Summary Footer - Go Back */}
        {phase === 'summary' && (
          <div className="px-6 py-4 border-t border-theme flex items-center justify-between shrink-0">
            <button
              onClick={() => {
                setCurrentIndex(duplicates.length - 1);
                setPhase('reviewing');
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm text-theme-subtle hover:text-theme-primary transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Review
            </button>
            <span className="text-xs text-theme-subtle">
              {actionsCount} of {totalGroups} groups have actions
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
