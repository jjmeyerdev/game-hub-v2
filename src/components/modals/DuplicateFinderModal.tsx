'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Scan, AlertTriangle, CheckCircle, Loader2, Trash2, Merge, Gamepad2, Clock, Trophy, Check, Layers, Sparkles, ArrowRight, Play, Ban, RotateCw, RefreshCcw } from 'lucide-react';
import { findDuplicateGames, mergeDuplicateGames, mergeStatsAcrossCopies, deleteUserGame, dismissDuplicateGroup, clearAllDismissedDuplicates } from '@/app/_actions/games';
import type { DuplicateGroup, UserGame, Game } from '@/app/_actions/games';

interface DuplicateFinderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type ScanPhase = 'idle' | 'scanning' | 'complete';
type EntryAction = 'keep' | 'merge' | 'delete';

export default function DuplicateFinderModal({ isOpen, onClose, onSuccess }: DuplicateFinderModalProps) {
  const [phase, setPhase] = useState<ScanPhase>('idle');
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [error, setError] = useState<string | null>(null);
  // Track action for each entry: keep, merge, or delete
  const [entryActions, setEntryActions] = useState<Record<string, Record<string, EntryAction>>>({});
  const [processingGroup, setProcessingGroup] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [resolvedGroups, setResolvedGroups] = useState<Set<string>>(new Set());
  const [isClearing, setIsClearing] = useState(false);
  const [clearedCount, setClearedCount] = useState<number | null>(null);

  const resetState = useCallback(() => {
    setPhase('idle');
    setDuplicates([]);
    setError(null);
    setEntryActions({});
    setProcessingGroup(null);
    setScanProgress(0);
    setResolvedGroups(new Set());
    setClearedCount(null);
  }, []);

  const handleClearDismissed = async () => {
    setIsClearing(true);
    setError(null);
    setClearedCount(null);

    try {
      const result = await clearAllDismissedDuplicates();
      if (result.error) {
        setError(result.error);
      } else {
        setClearedCount(result.count);
        // Auto-start scan after clearing
        if (result.count > 0) {
          setTimeout(() => {
            startScan();
          }, 1000);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear dismissed duplicates');
    } finally {
      setIsClearing(false);
    }
  };

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

      // Sort duplicates by game title
      const sortedDuplicates = (result.data || []).sort((a, b) => {
        const titleA = ((a.games[0]?.game as Game)?.title || '').toLowerCase();
        const titleB = ((b.games[0]?.game as Game)?.title || '').toLowerCase();
        return titleA.localeCompare(titleB);
      });
      setDuplicates(sortedDuplicates);

      // Initialize: all entries default to "keep"
      const actions: Record<string, Record<string, EntryAction>> = {};
      result.data?.forEach(group => {
        actions[group.normalizedTitle] = {};
        group.games.forEach(g => {
          actions[group.normalizedTitle][g.id] = 'keep';
        });
      });
      setEntryActions(actions);

      setPhase('complete');
    } catch (err) {
      clearInterval(progressInterval);
      setError(err instanceof Error ? err.message : 'Scan failed');
      setPhase('idle');
    }
  };

  const cycleAction = (groupTitle: string, gameId: string) => {
    setEntryActions(prev => {
      const groupActions = prev[groupTitle] || {};
      const currentAction = groupActions[gameId] || 'keep';

      // Cycle: keep -> merge -> delete -> keep
      const nextAction: EntryAction =
        currentAction === 'keep' ? 'merge' :
        currentAction === 'merge' ? 'delete' : 'keep';

      return {
        ...prev,
        [groupTitle]: {
          ...groupActions,
          [gameId]: nextAction,
        },
      };
    });
  };

  const setAllActions = (groupTitle: string, action: EntryAction) => {
    setEntryActions(prev => {
      const group = duplicates.find(d => d.normalizedTitle === groupTitle);
      if (!group) return prev;

      const newGroupActions: Record<string, EntryAction> = {};
      group.games.forEach(g => {
        newGroupActions[g.id] = action;
      });

      return {
        ...prev,
        [groupTitle]: newGroupActions,
      };
    });
  };

  const handleApplyActions = async (group: DuplicateGroup) => {
    const actions = entryActions[group.normalizedTitle] || {};

    const toMerge = group.games.filter(g => actions[g.id] === 'merge').map(g => g.id);
    const toDelete = group.games.filter(g => actions[g.id] === 'delete').map(g => g.id);
    const toKeep = group.games.filter(g => actions[g.id] === 'keep').map(g => g.id);

    // Validation: need at least one entry to keep or merge
    if (toKeep.length === 0 && toMerge.length === 0) {
      setError('You must keep or merge at least one entry');
      return;
    }

    // If nothing to do (all keep), just dismiss
    if (toMerge.length === 0 && toDelete.length === 0) {
      setResolvedGroups(prev => new Set([...prev, group.normalizedTitle]));
      return;
    }

    setProcessingGroup(group.normalizedTitle);

    try {
      // Step 1: Merge entries marked for merge (if any)
      if (toMerge.length >= 2) {
        const result = await mergeStatsAcrossCopies(toMerge);
        if (result.error) {
          setError(result.error);
          setProcessingGroup(null);
          return;
        }
      } else if (toMerge.length === 1 && toDelete.length > 0) {
        // If only one merge entry but we have deletes, merge stats into that one
        const primaryId = toMerge[0];
        const result = await mergeDuplicateGames(primaryId, toDelete);
        if (result.error) {
          setError(result.error);
        } else {
          setResolvedGroups(prev => new Set([...prev, group.normalizedTitle]));
          onSuccess();
        }
        setProcessingGroup(null);
        return;
      }

      // Step 2: Delete entries marked for delete
      if (toDelete.length > 0) {
        for (const id of toDelete) {
          await deleteUserGame(id);
        }
      }

      setResolvedGroups(prev => new Set([...prev, group.normalizedTitle]));
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setProcessingGroup(null);
    }
  };

  const handleDismiss = async (group: DuplicateGroup, remember: boolean = false) => {
    if (remember) {
      // Save the dismissal to the database so it's remembered for future scans
      const gameIds = group.games.map(g => g.id);
      await dismissDuplicateGroup(group.normalizedTitle, gameIds);
    }
    setResolvedGroups(prev => new Set([...prev, group.normalizedTitle]));
  };

  if (!isOpen) return null;

  const unresolvedDuplicates = duplicates.filter(d => !resolvedGroups.has(d.normalizedTitle));
  const totalDuplicateCount = unresolvedDuplicates.reduce((sum, g) => sum + g.games.length, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[85vh] flex flex-col bg-[#0a0f14] border border-[#1e2a35] rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="relative px-6 py-5 border-b border-[#1e2a35] flex-shrink-0">
          {/* Animated scan line accent */}
          {phase === 'scanning' && (
            <div className="absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden">
              <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-[shimmer_1.5s_ease-in-out_infinite]"
                style={{ animation: 'shimmer 1.5s ease-in-out infinite' }} />
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl border transition-all duration-300 ${
                phase === 'scanning'
                  ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-cyan-500/40 shadow-lg shadow-cyan-500/20'
                  : 'bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/20'
              }`}>
                <Scan className={`w-5 h-5 text-cyan-400 transition-transform duration-300 ${
                  phase === 'scanning' ? 'animate-pulse' : ''
                }`} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Duplicate Scanner</h2>
                <p className="text-xs text-gray-500">
                  {phase === 'idle' && 'Find and clean up duplicate games'}
                  {phase === 'scanning' && 'Analyzing your library...'}
                  {phase === 'complete' && unresolvedDuplicates.length > 0 && `${unresolvedDuplicates.length} groups need attention`}
                  {phase === 'complete' && unresolvedDuplicates.length === 0 && 'All clean!'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Rescan Button - only visible when scan is complete */}
              {phase === 'complete' && (
                <button
                  onClick={() => {
                    resetState();
                    startScan();
                  }}
                  className="group relative flex items-center gap-2 px-3 py-2 rounded-lg overflow-hidden transition-all duration-300 hover:pr-4"
                >
                  {/* Background layers */}
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute inset-0 border border-cyan-500/0 group-hover:border-cyan-500/30 rounded-lg transition-all duration-300" />

                  {/* Scan line effect on hover */}
                  <div className="absolute inset-0 overflow-hidden rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  </div>

                  {/* Icon with rotation animation */}
                  <RotateCw className="relative w-4 h-4 text-gray-500 group-hover:text-cyan-400 transition-all duration-300 group-hover:rotate-180" />

                  {/* Label */}
                  <span className="relative text-sm font-medium text-gray-500 group-hover:text-cyan-400 transition-colors duration-300">
                    Rescan
                  </span>

                  {/* Decorative dot */}
                  <div className="absolute right-2 w-1 h-1 rounded-full bg-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100" />
                </button>
              )}

              {/* Close button */}
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 hover:text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Error */}
          {error && (
            <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
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
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500/5 to-blue-500/5 border border-[#1e2a35] flex items-center justify-center">
                  <Layers className="w-10 h-10 text-cyan-400/60" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#0a0f14] border border-[#1e2a35] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>
              </div>

              <h3 className="text-lg font-medium text-white mb-2">Scan for Duplicates</h3>
              <p className="text-sm text-gray-500 text-center max-w-sm mb-6">
                Find games that appear multiple times in your library and choose what to do with each copy.
              </p>

              {/* Success message after clearing */}
              {clearedCount !== null && (
                <div className="mb-4 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <p className="text-sm text-emerald-400">
                    {clearedCount > 0
                      ? `Cleared ${clearedCount} dismissed ${clearedCount === 1 ? 'pair' : 'pairs'}. Starting fresh scan...`
                      : 'No dismissed pairs to clear'}
                  </p>
                </div>
              )}

              <button
                onClick={startScan}
                disabled={isClearing}
                className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 disabled:bg-gray-600 text-[#0a0f14] font-semibold rounded-xl transition-colors flex items-center gap-2"
              >
                <Scan className="w-4 h-4" />
                Start Scan
              </button>

              {/* Reset dismissed duplicates button */}
              <button
                onClick={handleClearDismissed}
                disabled={isClearing}
                className="mt-4 group flex items-center gap-2 px-4 py-2 text-sm text-gray-500 hover:text-amber-400 transition-colors"
              >
                {isClearing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                )}
                {isClearing ? 'Clearing...' : 'Reset "Not Duplicates" list'}
              </button>
              <p className="mt-1 text-xs text-gray-600 text-center max-w-xs">
                Previously dismissed pairs will appear again in scans
              </p>
            </div>
          )}

          {/* Scanning State */}
          {phase === 'scanning' && (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="relative mb-6">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#1e2a35" strokeWidth="6" />
                  <circle
                    cx="50" cy="50" r="40" fill="none" stroke="#22d3ee" strokeWidth="6"
                    strokeLinecap="round" strokeDasharray={`${scanProgress * 2.51} 251`}
                    className="transition-all duration-300"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-semibold text-white">{Math.round(scanProgress)}%</span>
                </div>
              </div>
              <p className="text-sm text-gray-400">Scanning library...</p>
            </div>
          )}

          {/* Results */}
          {phase === 'complete' && (
            <div className="p-6 space-y-4">
              {/* Stats Row */}
              {(unresolvedDuplicates.length > 0 || resolvedGroups.size > 0) && (
                <div className="flex gap-3 mb-6">
                  <div className="flex-1 p-3 bg-[#0d1318] border border-[#1e2a35] rounded-xl">
                    <div className="text-2xl font-bold text-white">{unresolvedDuplicates.length}</div>
                    <div className="text-xs text-gray-500">Groups Found</div>
                  </div>
                  <div className="flex-1 p-3 bg-[#0d1318] border border-[#1e2a35] rounded-xl">
                    <div className="text-2xl font-bold text-amber-400">{totalDuplicateCount}</div>
                    <div className="text-xs text-gray-500">Total Copies</div>
                  </div>
                  <div className="flex-1 p-3 bg-[#0d1318] border border-[#1e2a35] rounded-xl">
                    <div className="text-2xl font-bold text-emerald-400">{resolvedGroups.size}</div>
                    <div className="text-xs text-gray-500">Resolved</div>
                  </div>
                </div>
              )}

              {/* Legend */}
              {unresolvedDuplicates.length > 0 && (
                <div className="flex items-center justify-center gap-4 py-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-emerald-500" />
                    <span className="text-gray-400">Keep</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-cyan-500" />
                    <span className="text-gray-400">Merge</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-red-500" />
                    <span className="text-gray-400">Delete</span>
                  </div>
                  <span className="text-gray-600">• Click entries to cycle</span>
                </div>
              )}

              {/* No Duplicates */}
              {unresolvedDuplicates.length === 0 && duplicates.length === 0 && (
                <div className="text-center py-12">
                  <div className="relative w-20 h-20 mx-auto mb-5">
                    {/* Animated ring */}
                    <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20" />
                    <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-400/60 animate-spin" style={{ animationDuration: '3s' }} />
                    {/* Inner circle */}
                    <div className="absolute inset-2 rounded-full bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-emerald-400" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">No Duplicates Found</h3>
                  <p className="text-sm text-gray-500 mb-6">Your library is clean!</p>

                  {/* Actions */}
                  <div className="flex flex-col items-center gap-3">
                    {/* Rescan button */}
                    <button
                      onClick={() => {
                        resetState();
                        startScan();
                      }}
                      className="group inline-flex items-center gap-2 px-4 py-2 bg-[#0d1318] hover:bg-[#141c24] border border-[#1e2a35] hover:border-cyan-500/30 rounded-lg transition-all duration-300"
                    >
                      <RotateCw className="w-4 h-4 text-gray-500 group-hover:text-cyan-400 group-hover:rotate-180 transition-all duration-500" />
                      <span className="text-sm text-gray-400 group-hover:text-white transition-colors">Scan Again</span>
                    </button>

                    {/* Reset dismissed */}
                    <button
                      onClick={async () => {
                        setIsClearing(true);
                        const result = await clearAllDismissedDuplicates();
                        setIsClearing(false);
                        if (result.count > 0) {
                          resetState();
                          startScan();
                        } else {
                          setError('No dismissed pairs to reset');
                        }
                      }}
                      disabled={isClearing}
                      className="group inline-flex items-center gap-2 px-3 py-1.5 text-xs text-gray-500 hover:text-amber-400 transition-colors"
                    >
                      {isClearing ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <RefreshCcw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" />
                      )}
                      <span>Reset dismissed pairs & scan again</span>
                    </button>
                  </div>
                </div>
              )}

              {/* All Resolved */}
              {unresolvedDuplicates.length === 0 && duplicates.length > 0 && (
                <div className="text-center py-12">
                  <div className="relative w-20 h-20 mx-auto mb-5">
                    {/* Success burst effect */}
                    <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping" style={{ animationDuration: '2s' }} />
                    {/* Inner circle */}
                    <div className="relative w-full h-full rounded-full bg-gradient-to-br from-emerald-500/15 to-cyan-500/10 border border-emerald-500/30 flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-emerald-400" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">All Done!</h3>
                  <p className="text-sm text-gray-500 mb-2">
                    {resolvedGroups.size} duplicate {resolvedGroups.size === 1 ? 'group' : 'groups'} resolved
                  </p>
                  <p className="text-xs text-gray-600 mb-6">Changes have been saved to your library</p>

                  {/* Actions */}
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => {
                        resetState();
                        startScan();
                      }}
                      className="group inline-flex items-center gap-2 px-4 py-2 bg-[#0d1318] hover:bg-[#141c24] border border-[#1e2a35] hover:border-cyan-500/30 rounded-lg transition-all duration-300"
                    >
                      <RotateCw className="w-4 h-4 text-gray-500 group-hover:text-cyan-400 group-hover:rotate-180 transition-all duration-500" />
                      <span className="text-sm text-gray-400 group-hover:text-white transition-colors">Scan Again</span>
                    </button>
                    <button
                      onClick={onClose}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg transition-all duration-300"
                    >
                      <span className="text-sm font-medium">Done</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Duplicate Groups */}
              {unresolvedDuplicates.map((group, idx) => (
                <DuplicateGroupCard
                  key={group.normalizedTitle}
                  group={group}
                  index={idx}
                  actions={entryActions[group.normalizedTitle] || {}}
                  onCycleAction={(id) => cycleAction(group.normalizedTitle, id)}
                  onSetAllActions={(action) => setAllActions(group.normalizedTitle, action)}
                  onApply={() => handleApplyActions(group)}
                  onDismiss={(remember) => handleDismiss(group, remember)}
                  isProcessing={processingGroup === group.normalizedTitle}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface DuplicateGroupCardProps {
  group: DuplicateGroup;
  index: number;
  actions: Record<string, EntryAction>;
  onCycleAction: (id: string) => void;
  onSetAllActions: (action: EntryAction) => void;
  onApply: () => void;
  onDismiss: (remember: boolean) => void;
  isProcessing: boolean;
}

function DuplicateGroupCard({
  group,
  index,
  actions,
  onCycleAction,
  onSetAllActions,
  onApply,
  onDismiss,
  isProcessing,
}: DuplicateGroupCardProps) {
  const [expanded, setExpanded] = useState(index === 0);

  const keepCount = group.games.filter(g => actions[g.id] === 'keep').length;
  const mergeCount = group.games.filter(g => actions[g.id] === 'merge').length;
  const deleteCount = group.games.filter(g => actions[g.id] === 'delete').length;
  const gameTitle = (group.games[0]?.game as Game)?.title || 'Unknown Game';

  // Check if there are any changes from default (all keep)
  const hasChanges = mergeCount > 0 || deleteCount > 0;

  // Validation
  const isValid = keepCount > 0 || mergeCount > 0;
  const mergeWarning = mergeCount === 1 ? 'Need 2+ entries to merge' : null;

  return (
    <div className="border border-[#1e2a35] rounded-xl overflow-hidden bg-[#0d1318]">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors text-left"
      >
        <div className={`w-2 h-2 rounded-full ${group.matchType === 'exact' ? 'bg-red-400' : 'bg-amber-400'}`} />

        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-white truncate">{gameTitle}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-500">{group.games.length} copies</span>
            <span className="text-xs text-gray-600">•</span>
            <span className={`text-xs ${group.matchType === 'exact' ? 'text-red-400' : 'text-amber-400'}`}>
              {group.matchType === 'exact' ? 'Exact match' : 'Similar titles'}
            </span>
          </div>
        </div>

        <div className={`px-2 py-0.5 rounded text-xs font-medium ${
          group.confidence >= 90 ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'
        }`}>
          {group.confidence}%
        </div>

        <ArrowRight className={`w-4 h-4 text-gray-500 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-[#1e2a35]">
          {/* Not duplicates option - works for both exact and similar matches */}
          <button
            onClick={() => onDismiss(true)}
            className={`w-full mt-3 p-2.5 border rounded-lg text-left transition-colors group ${
              group.matchType === 'exact'
                ? 'bg-rose-500/5 hover:bg-rose-500/10 border-rose-500/20'
                : 'bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/20'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium flex items-center gap-1.5 ${
                  group.matchType === 'exact' ? 'text-rose-400' : 'text-amber-400'
                }`}>
                  <Ban className="w-3.5 h-3.5" />
                  Not duplicates
                </p>
                <p className="text-xs text-gray-500">
                  {group.matchType === 'exact'
                    ? 'Same game on different platforms - won\'t show again'
                    : 'These are different games - won\'t show again'}
                </p>
              </div>
              <span className={`text-xs opacity-0 group-hover:opacity-100 transition-opacity ${
                group.matchType === 'exact' ? 'text-rose-400' : 'text-amber-400'
              }`}>
                Remember →
              </span>
            </div>
          </button>

          {/* Quick actions */}
          <div className="flex items-center gap-2 mt-3 mb-2">
            <span className="text-xs text-gray-500">Set all:</span>
            <button
              onClick={() => onSetAllActions('keep')}
              className="px-2 py-1 text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded transition-colors"
            >
              Keep
            </button>
            <button
              onClick={() => onSetAllActions('merge')}
              className="px-2 py-1 text-xs bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded transition-colors"
            >
              Merge
            </button>
            <button
              onClick={() => onSetAllActions('delete')}
              className="px-2 py-1 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded transition-colors"
            >
              Delete
            </button>
            <div className="flex-1" />
            <div className="flex items-center gap-2 text-xs">
              {keepCount > 0 && <span className="text-emerald-400">{keepCount} keep</span>}
              {mergeCount > 0 && <span className="text-cyan-400">{mergeCount} merge</span>}
              {deleteCount > 0 && <span className="text-red-400">{deleteCount} delete</span>}
            </div>
          </div>

          {/* Game Cards */}
          <div className="space-y-2">
            {group.games.map((userGame) => {
              const game = userGame.game as Game;
              const action = actions[userGame.id] || 'keep';

              const actionStyles = {
                keep: 'bg-emerald-500/5 border-emerald-500/30',
                merge: 'bg-cyan-500/5 border-cyan-500/30',
                delete: 'bg-red-500/5 border-red-500/20 opacity-60',
              };

              const badgeStyles = {
                keep: 'bg-emerald-500/20 text-emerald-400',
                merge: 'bg-cyan-500/20 text-cyan-400',
                delete: 'bg-red-500/20 text-red-400',
              };

              const checkboxStyles = {
                keep: 'border-emerald-500 bg-emerald-500',
                merge: 'border-cyan-500 bg-cyan-500',
                delete: 'border-red-500 bg-red-500',
              };

              return (
                <div
                  key={userGame.id}
                  onClick={() => onCycleAction(userGame.id)}
                  className={`relative p-3 rounded-lg cursor-pointer transition-all border ${actionStyles[action]}`}
                >
                  <div className="flex items-center gap-3">
                    {/* Cover */}
                    {game?.cover_url ? (
                      <img
                        src={game.cover_url}
                        alt={game.title}
                        className={`w-10 h-14 object-cover rounded ${action === 'delete' && 'grayscale'}`}
                      />
                    ) : (
                      <div className="w-10 h-14 rounded bg-[#1e2a35] flex items-center justify-center">
                        <Gamepad2 className="w-4 h-4 text-gray-600" />
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      {/* Game title */}
                      <p className={`text-sm font-medium truncate mb-1 ${action === 'delete' ? 'text-gray-500' : 'text-white'}`}>
                        {game?.title || 'Unknown'}
                      </p>

                      <div className="flex items-center gap-2">
                        <span className="text-xs px-1.5 py-0.5 bg-[#1e2a35] rounded text-gray-400">
                          {(() => {
                            const match = userGame.platform.match(/^(.+?)\s*\((.+)\)$/);
                            return match ? match[2] : userGame.platform;
                          })()}
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          userGame.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                          userGame.status === 'playing' ? 'bg-cyan-500/10 text-cyan-400' :
                          'bg-[#1e2a35] text-gray-500'
                        }`}>
                          {userGame.status}
                        </span>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-3 mt-1.5">
                        {userGame.playtime_hours > 0 && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span>{userGame.playtime_hours.toFixed(1)}h</span>
                          </div>
                        )}
                        {userGame.achievements_earned > 0 && (
                          <div className="flex items-center gap-1 text-xs text-amber-400/70">
                            <Trophy className="w-3 h-3" />
                            <span>{userGame.achievements_earned}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action indicator */}
                    <div className={`w-6 h-6 rounded flex items-center justify-center ${checkboxStyles[action]}`}>
                      {action === 'keep' && <Check className="w-3.5 h-3.5 text-white" />}
                      {action === 'merge' && <Merge className="w-3.5 h-3.5 text-white" />}
                      {action === 'delete' && <Trash2 className="w-3.5 h-3.5 text-white" />}
                    </div>
                  </div>

                  {/* Badge */}
                  <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-medium uppercase ${badgeStyles[action]}`}>
                    {action}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Validation warning */}
          {mergeWarning && (
            <p className="mt-2 text-xs text-amber-400 text-center">{mergeWarning}</p>
          )}
          {!isValid && (
            <p className="mt-2 text-xs text-red-400 text-center">Must keep or merge at least one entry</p>
          )}

          {/* Actions */}
          <div className="mt-4 pt-3 border-t border-[#1e2a35]">
            <div className="flex gap-2">
              <button
                onClick={onApply}
                disabled={isProcessing || !isValid || (mergeCount === 1 && deleteCount === 0 && keepCount === 0)}
                className="flex-1 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-gray-700 text-[#0a0f14] disabled:text-gray-500 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                {hasChanges ? 'Apply Changes' : 'Done'}
              </button>
              <button
                onClick={() => onDismiss(false)}
                disabled={isProcessing}
                className="px-4 py-2.5 bg-[#1e2a35] hover:bg-[#2a3a45] text-gray-300 font-medium rounded-lg transition-colors"
              >
                Skip
              </button>
            </div>

            {/* Summary */}
            {hasChanges && (
              <p className="mt-2 text-[11px] text-gray-500 text-center">
                {mergeCount >= 2 && `Merging ${mergeCount} entries into one. `}
                {deleteCount > 0 && `Deleting ${deleteCount} entries. `}
                {keepCount > 0 && `Keeping ${keepCount} separate.`}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
