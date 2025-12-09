'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Scan, AlertTriangle, CheckCircle, Loader2, Trash2, Merge, Gamepad2, Clock, Trophy, ChevronRight, Check, ShieldCheck, Radio } from 'lucide-react';
import { findDuplicateGames, mergeDuplicateGames, mergeStatsAcrossCopies, mergeSelectedKeepRest, deleteUserGame } from '@/app/actions/games';
import type { DuplicateGroup, UserGame, Game } from '@/app/actions/games';

interface DuplicateFinderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type ScanPhase = 'idle' | 'scanning' | 'analyzing' | 'complete';

export default function DuplicateFinderModal({ isOpen, onClose, onSuccess }: DuplicateFinderModalProps) {
  const [phase, setPhase] = useState<ScanPhase>('idle');
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [error, setError] = useState<string | null>(null);
  // Changed from single selection to multi-select: track which entries to KEEP per group
  const [selectedToKeep, setSelectedToKeep] = useState<Record<string, Set<string>>>({});
  const [processingGroup, setProcessingGroup] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [resolvedGroups, setResolvedGroups] = useState<Set<string>>(new Set());

  const resetState = useCallback(() => {
    setPhase('idle');
    setDuplicates([]);
    setError(null);
    setSelectedToKeep({});
    setProcessingGroup(null);
    setScanProgress(0);
    setResolvedGroups(new Set());
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

    // Animate progress
    const progressInterval = setInterval(() => {
      setScanProgress(prev => Math.min(prev + Math.random() * 15, 85));
    }, 200);

    try {
      // Simulate scanning phase
      await new Promise(resolve => setTimeout(resolve, 800));
      setPhase('analyzing');

      const result = await findDuplicateGames();

      clearInterval(progressInterval);
      setScanProgress(100);

      if (result.error) {
        setError(result.error);
        setPhase('idle');
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 400));
      setDuplicates(result.data || []);

      // Initialize selection: by default, select all entries to keep (user will uncheck the true duplicates)
      const keepSelections: Record<string, Set<string>> = {};
      result.data?.forEach(group => {
        // Start with first entry selected, user can add more
        if (group.games.length > 0) {
          keepSelections[group.normalizedTitle] = new Set([group.games[0].id]);
        }
      });
      setSelectedToKeep(keepSelections);

      setPhase('complete');
    } catch (err) {
      clearInterval(progressInterval);
      setError(err instanceof Error ? err.message : 'Scan failed');
      setPhase('idle');
    }
  };

  // Toggle selection for multi-select
  const toggleSelection = (groupTitle: string, gameId: string) => {
    setSelectedToKeep(prev => {
      const currentSet = prev[groupTitle] || new Set<string>();
      const newSet = new Set(currentSet);

      if (newSet.has(gameId)) {
        // Don't allow deselecting if it's the only one selected
        if (newSet.size > 1) {
          newSet.delete(gameId);
        }
      } else {
        newSet.add(gameId);
      }

      return { ...prev, [groupTitle]: newSet };
    });
  };

  const handleMerge = async (group: DuplicateGroup) => {
    const keepIds = selectedToKeep[group.normalizedTitle];
    if (!keepIds || keepIds.size === 0) return;

    // Get the entries to delete (not in keepIds)
    const toDeleteIds = group.games
      .filter(g => !keepIds.has(g.id))
      .map(g => g.id);

    if (toDeleteIds.length === 0) {
      // Nothing to delete - all entries are marked to keep, just mark as resolved
      setResolvedGroups(prev => new Set([...prev, group.normalizedTitle]));
      return;
    }

    // Use the first kept entry as primary for merging stats
    const primaryId = Array.from(keepIds)[0];

    setProcessingGroup(group.normalizedTitle);

    try {
      const result = await mergeDuplicateGames(primaryId, toDeleteIds);

      if (result.error) {
        setError(result.error);
      } else {
        setResolvedGroups(prev => new Set([...prev, group.normalizedTitle]));
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Merge failed');
    } finally {
      setProcessingGroup(null);
    }
  };

  const handleDeleteOnly = async (group: DuplicateGroup) => {
    const keepIds = selectedToKeep[group.normalizedTitle];
    if (!keepIds || keepIds.size === 0) return;

    const toDelete = group.games.filter(g => !keepIds.has(g.id));

    if (toDelete.length === 0) {
      // Nothing to delete - mark as resolved
      setResolvedGroups(prev => new Set([...prev, group.normalizedTitle]));
      return;
    }

    setProcessingGroup(group.normalizedTitle);

    try {
      for (const game of toDelete) {
        await deleteUserGame(game.id);
      }
      setResolvedGroups(prev => new Set([...prev, group.normalizedTitle]));
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setProcessingGroup(null);
    }
  };

  // Mark group as "not duplicates" - keep all entries
  const handleMarkNotDuplicates = (group: DuplicateGroup) => {
    setResolvedGroups(prev => new Set([...prev, group.normalizedTitle]));
  };

  // Merge stats across all copies without deleting any
  const handleMergeStatsOnly = async (group: DuplicateGroup) => {
    const allIds = group.games.map(g => g.id);

    setProcessingGroup(group.normalizedTitle);

    try {
      const result = await mergeStatsAcrossCopies(allIds);

      if (result.error) {
        setError(result.error);
      } else {
        setResolvedGroups(prev => new Set([...prev, group.normalizedTitle]));
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Merge failed');
    } finally {
      setProcessingGroup(null);
    }
  };

  // Merge only selected entries into one, keep unselected entries separate
  const handleMergeSelectedKeepRest = async (group: DuplicateGroup) => {
    const keepIds = selectedToKeep[group.normalizedTitle];
    if (!keepIds || keepIds.size < 2) return;

    const selectedIds = Array.from(keepIds);

    setProcessingGroup(group.normalizedTitle);

    try {
      const result = await mergeSelectedKeepRest(selectedIds);

      if (result.error) {
        setError(result.error);
      } else {
        setResolvedGroups(prev => new Set([...prev, group.normalizedTitle]));
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Merge failed');
    } finally {
      setProcessingGroup(null);
    }
  };

  if (!isOpen) return null;

  const unresolvedDuplicates = duplicates.filter(d => !resolvedGroups.has(d.normalizedTitle));
  const totalDuplicateCount = unresolvedDuplicates.reduce((sum, g) => sum + g.games.length - 1, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with scan lines effect */}
      <div
        className="absolute inset-0 bg-void/95 backdrop-blur-md"
        onClick={onClose}
      >
        {/* Animated scan lines */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent"
              style={{
                top: `${i * 5}%`,
                animation: `scanLineMove ${3 + i * 0.2}s linear infinite`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[85vh] flex flex-col bg-abyss border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-500/10 overflow-hidden">
        {/* Animated corner accents */}
        <div className="absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2 border-cyan-500/50 rounded-tl-2xl" />
        <div className="absolute top-0 right-0 w-16 h-16 border-r-2 border-t-2 border-cyan-500/50 rounded-tr-2xl" />
        <div className="absolute bottom-0 left-0 w-16 h-16 border-l-2 border-b-2 border-purple-500/50 rounded-bl-2xl" />
        <div className="absolute bottom-0 right-0 w-16 h-16 border-r-2 border-b-2 border-purple-500/50 rounded-br-2xl" />

        {/* Header */}
        <div className="relative px-8 py-6 border-b border-steel/50 bg-deep/50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className={`p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 ${phase === 'scanning' || phase === 'analyzing' ? 'animate-pulse' : ''}`}>
                  <Scan className="w-6 h-6 text-cyan-400" />
                </div>
                {(phase === 'scanning' || phase === 'analyzing') && (
                  <div className="absolute -inset-1 rounded-xl bg-cyan-500/20 blur-md animate-pulse" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white" style={{ fontFamily: 'var(--font-family-display)' }}>
                  DUPLICATE SCANNER
                </h2>
                <p className="text-sm text-gray-500 font-mono">
                  {phase === 'idle' && 'Ready to analyze library'}
                  {phase === 'scanning' && 'Scanning game entries...'}
                  {phase === 'analyzing' && 'Analyzing title patterns...'}
                  {phase === 'complete' && `${unresolvedDuplicates.length} duplicate groups found`}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-steel/30 rounded-lg transition-all group"
            >
              <X className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto p-1 hover:bg-red-500/20 rounded transition-colors"
              >
                <X className="w-4 h-4 text-red-400" />
              </button>
            </div>
          )}

          {/* Idle State - Start Scan */}
          {phase === 'idle' && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative mb-8">
                {/* Radar-like scanner animation */}
                <div className="w-40 h-40 rounded-full border-2 border-steel/30 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent" />
                  <div className="w-28 h-28 rounded-full border border-steel/20 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full border border-cyan-500/30 flex items-center justify-center bg-cyan-500/5">
                      <Scan className="w-8 h-8 text-cyan-400" />
                    </div>
                  </div>
                  {/* Radar sweep */}
                  <div
                    className="absolute top-1/2 left-1/2 w-1/2 h-px bg-gradient-to-r from-cyan-400 to-transparent origin-left"
                    style={{ animation: 'radarSweep 3s linear infinite' }}
                  />
                </div>
                {/* Pulsing rings */}
                <div className="absolute inset-0 rounded-full border border-cyan-500/20 animate-ping" style={{ animationDuration: '2s' }} />
                <div className="absolute -inset-4 rounded-full border border-cyan-500/10 animate-ping" style={{ animationDuration: '2.5s' }} />
              </div>

              <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-family-display)' }}>
                LIBRARY ANALYSIS
              </h3>
              <p className="text-gray-500 text-center max-w-md mb-8">
                Scan your game library to detect duplicate entries across different platforms.
                Merge stats or clean up extra copies.
              </p>

              <button
                onClick={startScan}
                className="group relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 rounded-xl font-bold text-void transition-all duration-300 overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-3">
                  <Radio className="w-5 h-5" />
                  INITIATE SCAN
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </button>
            </div>
          )}

          {/* Scanning State */}
          {(phase === 'scanning' || phase === 'analyzing') && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative mb-8">
                {/* Active scanner visualization */}
                <div className="w-48 h-48 relative">
                  {/* Outer ring */}
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-steel/30"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="url(#scanGradient)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={`${scanProgress * 2.83} 283`}
                      className="transition-all duration-300"
                    />
                    <defs>
                      <linearGradient id="scanGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#00d9ff" />
                        <stop offset="100%" stopColor="#b845ff" />
                      </linearGradient>
                    </defs>
                  </svg>
                  {/* Center content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mb-2" />
                    <span className="text-2xl font-bold text-white font-mono">{Math.round(scanProgress)}%</span>
                  </div>
                </div>
                {/* Scanning line */}
                <div className="absolute left-0 right-0 top-1/2 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />
              </div>

              <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'var(--font-family-display)' }}>
                {phase === 'scanning' ? 'SCANNING LIBRARY' : 'ANALYZING PATTERNS'}
              </h3>
              <p className="text-gray-500 text-sm font-mono">
                {phase === 'scanning' ? 'Reading game entries...' : 'Detecting duplicate titles...'}
              </p>
            </div>
          )}

          {/* Results */}
          {phase === 'complete' && (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="p-4 bg-deep/50 border border-steel/30 rounded-xl text-center">
                  <div className="text-3xl font-bold text-cyan-400 font-mono">{unresolvedDuplicates.length}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Duplicate Groups</div>
                </div>
                <div className="p-4 bg-deep/50 border border-steel/30 rounded-xl text-center">
                  <div className="text-3xl font-bold text-purple-400 font-mono">{totalDuplicateCount}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Extra Copies</div>
                </div>
                <div className="p-4 bg-deep/50 border border-steel/30 rounded-xl text-center">
                  <div className="text-3xl font-bold text-emerald-400 font-mono">{resolvedGroups.size}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Resolved</div>
                </div>
              </div>

              {/* No Duplicates */}
              {unresolvedDuplicates.length === 0 && duplicates.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                    <CheckCircle className="w-10 h-10 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Library Clean</h3>
                  <p className="text-gray-500">No duplicate games detected in your library.</p>
                </div>
              )}

              {/* All Resolved */}
              {unresolvedDuplicates.length === 0 && duplicates.length > 0 && (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                    <CheckCircle className="w-10 h-10 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">All Duplicates Resolved</h3>
                  <p className="text-gray-500">You&apos;ve cleaned up all duplicate entries.</p>
                </div>
              )}

              {/* Duplicate Groups */}
              {unresolvedDuplicates.map((group, groupIndex) => (
                <DuplicateGroupCard
                  key={group.normalizedTitle}
                  group={group}
                  groupIndex={groupIndex}
                  selectedToKeep={selectedToKeep[group.normalizedTitle] || new Set()}
                  onToggleSelection={(id) => toggleSelection(group.normalizedTitle, id)}
                  onMerge={() => handleMerge(group)}
                  onDeleteOnly={() => handleDeleteOnly(group)}
                  onMarkNotDuplicates={() => handleMarkNotDuplicates(group)}
                  onMergeStatsOnly={() => handleMergeStatsOnly(group)}
                  onMergeSelectedKeepRest={() => handleMergeSelectedKeepRest(group)}
                  isProcessing={processingGroup === group.normalizedTitle}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {phase === 'complete' && unresolvedDuplicates.length > 0 && (
          <div className="px-8 py-4 border-t border-steel/30 bg-deep/30 flex-shrink-0">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Select multiple entries to keep (e.g., same game on different consoles). Unselected entries will be deleted.
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-steel/30 hover:bg-steel/50 text-white rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Custom styles */}
      <style jsx global>{`
        @keyframes scanLineMove {
          0% { opacity: 0; transform: translateY(-100vh); }
          10% { opacity: 0.5; }
          90% { opacity: 0.5; }
          100% { opacity: 0; transform: translateY(100vh); }
        }

        @keyframes radarSweep {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Separate component for duplicate group cards
interface DuplicateGroupCardProps {
  group: DuplicateGroup;
  groupIndex: number;
  selectedToKeep: Set<string>;
  onToggleSelection: (id: string) => void;
  onMerge: () => void;
  onDeleteOnly: () => void;
  onMarkNotDuplicates: () => void;
  onMergeStatsOnly: () => void;
  onMergeSelectedKeepRest: () => void;
  isProcessing: boolean;
}

function DuplicateGroupCard({
  group,
  groupIndex,
  selectedToKeep,
  onToggleSelection,
  onMerge,
  onDeleteOnly,
  onMarkNotDuplicates,
  onMergeStatsOnly,
  onMergeSelectedKeepRest,
  isProcessing,
}: DuplicateGroupCardProps) {
  const [expanded, setExpanded] = useState(groupIndex === 0);

  const toDeleteCount = group.games.filter(g => !selectedToKeep.has(g.id)).length;
  const toKeepCount = selectedToKeep.size;
  const allSelected = toKeepCount === group.games.length;

  return (
    <div
      className="border border-steel/30 rounded-xl overflow-hidden bg-deep/30 transition-all"
      style={{ animation: `fadeInUp 0.4s ease-out ${groupIndex * 0.1}s both` }}
    >
      {/* Group Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-4 flex items-center gap-4 hover:bg-steel/10 transition-colors"
      >
        <div className={`p-2 rounded-lg ${group.matchType === 'exact' ? 'bg-red-500/10 border border-red-500/30' : 'bg-amber-500/10 border border-amber-500/30'}`}>
          <AlertTriangle className={`w-4 h-4 ${group.matchType === 'exact' ? 'text-red-400' : 'text-amber-400'}`} />
        </div>

        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-white">
              {(group.games[0]?.game as Game)?.title || 'Unknown Game'}
            </h3>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
              group.matchType === 'exact'
                ? 'bg-red-500/20 text-red-400'
                : 'bg-amber-500/20 text-amber-400'
            }`}>
              {group.matchType === 'exact' ? 'Exact Match' : 'Similar'}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            {group.games.length} copies across {new Set(group.games.map(g => g.platform)).size} platforms
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-xs font-bold text-cyan-400">
            {group.confidence}% match
          </span>
          <ChevronRight className={`w-5 h-5 text-gray-500 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-steel/20">
          {/* Quick dismiss for similar matches - prominent banner */}
          {group.matchType === 'similar' && (
            <button
              onClick={onMarkNotDuplicates}
              disabled={isProcessing}
              className="w-full mt-4 mb-3 p-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500/50 rounded-xl transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-amber-400">Not the same game?</p>
                  <p className="text-xs text-gray-500">These are different games with similar names</p>
                </div>
              </div>
              <span className="px-3 py-1.5 bg-amber-500/20 group-hover:bg-amber-500/30 rounded-lg text-xs font-bold text-amber-400 transition-colors">
                Keep All Separate
              </span>
            </button>
          )}

          {/* Selection hint */}
          <div className="mt-4 mb-3 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {group.matchType === 'similar'
                ? <>If these ARE duplicates, select which to <span className="text-emerald-400 font-semibold">keep</span></>
                : <>Select entries to <span className="text-emerald-400 font-semibold">keep</span> • Unselected will be deleted</>
              }
            </p>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-emerald-400 font-mono">{toKeepCount} keep</span>
              <span className="text-gray-600">|</span>
              <span className="text-red-400 font-mono">{toDeleteCount} delete</span>
            </div>
          </div>

          {/* Game Cards */}
          <div className="grid gap-3">
            {group.games.map((userGame) => {
              const game = userGame.game as Game;
              const isSelected = selectedToKeep.has(userGame.id);

              return (
                <div
                  key={userGame.id}
                  onClick={() => onToggleSelection(userGame.id)}
                  className={`relative p-4 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-emerald-500/10 border-2 border-emerald-500/50 ring-2 ring-emerald-500/20'
                      : 'bg-red-500/5 border border-red-500/30 hover:border-red-500/50 opacity-75'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-emerald-500 rounded text-[10px] font-bold text-void uppercase flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Keep
                    </div>
                  )}
                  {!isSelected && (
                    <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-red-500/80 rounded text-[10px] font-bold text-white uppercase">
                      Delete
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    {/* Cover */}
                    {game?.cover_url ? (
                      <img
                        src={game.cover_url}
                        alt={game.title}
                        className={`w-12 h-16 object-cover rounded-lg border ${isSelected ? 'border-emerald-500/30' : 'border-red-500/30 grayscale'}`}
                      />
                    ) : (
                      <div className={`w-12 h-16 rounded-lg flex items-center justify-center ${isSelected ? 'bg-steel/20' : 'bg-red-500/10'}`}>
                        <Gamepad2 className="w-5 h-5 text-gray-600" />
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-semibold truncate ${isSelected ? 'text-white' : 'text-gray-400'}`}>{game?.title || 'Unknown'}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`px-2 py-0.5 rounded text-xs ${isSelected ? 'bg-steel/30 text-gray-400' : 'bg-red-500/10 text-gray-500'}`}>
                          {userGame.platform}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          !isSelected ? 'bg-red-500/10 text-gray-500' :
                          userGame.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                          userGame.status === 'playing' ? 'bg-cyan-500/20 text-cyan-400' :
                          'bg-steel/30 text-gray-500'
                        }`}>
                          {userGame.status}
                        </span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm">
                      {userGame.playtime_hours > 0 && (
                        <div className={`flex items-center gap-1.5 ${isSelected ? 'text-gray-400' : 'text-gray-600'}`}>
                          <Clock className="w-3.5 h-3.5" />
                          <span className="font-mono">{userGame.playtime_hours.toFixed(1)}h</span>
                        </div>
                      )}
                      {userGame.achievements_earned > 0 && (
                        <div className={`flex items-center gap-1.5 ${isSelected ? 'text-amber-400' : 'text-gray-600'}`}>
                          <Trophy className="w-3.5 h-3.5" />
                          <span className="font-mono">{userGame.achievements_earned}</span>
                        </div>
                      )}
                    </div>

                    {/* Checkbox indicator */}
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      isSelected ? 'border-emerald-500 bg-emerald-500' : 'border-steel/50 hover:border-red-500/50'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-void" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-steel/20">
            {/* When all are selected - show Merge Into One and Not Duplicates options */}
            {allSelected ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={onMergeStatsOnly}
                  disabled={isProcessing}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 disabled:from-gray-600 disabled:to-gray-700 rounded-xl font-semibold text-white disabled:text-gray-400 transition-all"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Merge className="w-4 h-4" />
                  )}
                  Merge Into One Entry
                </button>
                <button
                  onClick={onMarkNotDuplicates}
                  disabled={isProcessing}
                  className="px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/50 disabled:border-gray-600 rounded-xl font-semibold text-emerald-400 disabled:text-gray-500 transition-all flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Keep All
                </button>
              </div>
            ) : (
              <>
                {/* Primary action: Merge selected & keep the rest */}
                {toKeepCount >= 2 && (
                  <button
                    onClick={onMergeSelectedKeepRest}
                    disabled={isProcessing}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 disabled:from-gray-600 disabled:to-gray-700 rounded-xl font-semibold text-void disabled:text-gray-400 transition-all"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Merge className="w-4 h-4" />
                    )}
                    Merge {toKeepCount} Selected & Keep {toDeleteCount} Separate
                  </button>
                )}
                {/* Secondary actions */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={onMerge}
                    disabled={isProcessing || toDeleteCount === 0}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 hover:border-purple-500/50 disabled:border-gray-600 rounded-xl font-semibold text-purple-400 disabled:text-gray-500 transition-all"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Merge className="w-4 h-4" />
                    )}
                    Merge & Delete {toDeleteCount}
                  </button>
                  <button
                    onClick={onDeleteOnly}
                    disabled={isProcessing || toDeleteCount === 0}
                    className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 disabled:border-gray-600 rounded-xl font-semibold text-red-400 disabled:text-gray-500 transition-all flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete {toDeleteCount}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
