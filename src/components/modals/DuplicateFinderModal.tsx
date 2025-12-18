'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Scan, AlertTriangle, CheckCircle, Loader2, Trash2, Merge, Gamepad2, Clock, Trophy, Check, Layers, Sparkles, ArrowRight, Play, Ban, RotateCw, RefreshCcw, Zap, Shield } from 'lucide-react';
import { findDuplicateGames, mergeDuplicateGames, mergeStatsAcrossCopies, deleteUserGame, dismissDuplicateGroup, clearAllDismissedDuplicates } from '@/app/(dashboard)/_actions/games';
import type { DuplicateGroup, UserGame, Game } from '@/app/(dashboard)/_actions/games';

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

      const sortedDuplicates = (result.data || []).sort((a, b) => {
        const titleA = ((a.games[0]?.game as Game)?.title || '').toLowerCase();
        const titleB = ((b.games[0]?.game as Game)?.title || '').toLowerCase();
        return titleA.localeCompare(titleB);
      });
      setDuplicates(sortedDuplicates);

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

    if (toKeep.length === 0 && toMerge.length === 0) {
      setError('You must keep or merge at least one entry');
      return;
    }

    if (toMerge.length === 0 && toDelete.length === 0) {
      setResolvedGroups(prev => new Set([...prev, group.normalizedTitle]));
      return;
    }

    setProcessingGroup(group.normalizedTitle);

    try {
      if (toMerge.length >= 2) {
        const result = await mergeStatsAcrossCopies(toMerge);
        if (result.error) {
          setError(result.error);
          setProcessingGroup(null);
          return;
        }
      } else if (toMerge.length === 1 && toDelete.length > 0) {
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
      <div
        className="absolute inset-0 bg-void/90 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden rounded-2xl animate-modal-slide-in"
        style={{
          background: 'linear-gradient(180deg, #0f1011 0%, #0a0a0b 100%)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: `
            0 0 0 1px rgba(255, 255, 255, 0.02),
            0 25px 50px -12px rgba(0, 0, 0, 0.8),
            0 0 60px rgba(168, 85, 247, 0.1)
          `,
        }}
      >
        {/* Noise texture */}
        <div
          className="absolute inset-0 opacity-[0.015] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
          <div
            className={`h-full w-full bg-gradient-to-r from-violet-500 via-cyan-400 to-violet-500 ${phase === 'scanning' ? 'animate-shimmer' : ''}`}
            style={{
              backgroundSize: '200% 100%',
              opacity: phase === 'scanning' ? 1 : 0.5,
            }}
          />
        </div>

        {/* Ambient glow */}
        <div
          className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'rgba(168, 85, 247, 0.1)' }}
        />
        <div
          className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'rgba(34, 211, 238, 0.08)' }}
        />

        {/* Header */}
        <div className="relative px-6 py-5 border-b border-white/[0.04] flex-shrink-0">
          {/* HUD corners */}
          <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-violet-500/30" />
          <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-violet-500/30" />

          {/* Scanning scan line */}
          {phase === 'scanning' && (
            <div className="absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden">
              <div
                className="h-full w-1/3 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
                style={{ animation: 'shimmer 1.5s ease-in-out infinite' }}
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  phase === 'scanning' ? 'animate-pulse' : ''
                }`}
                style={{
                  background: phase === 'scanning'
                    ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(34, 211, 238, 0.2) 100%)'
                    : 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(34, 211, 238, 0.1) 100%)',
                  border: `1px solid ${phase === 'scanning' ? 'rgba(168, 85, 247, 0.4)' : 'rgba(255, 255, 255, 0.06)'}`,
                  boxShadow: phase === 'scanning' ? '0 0 20px rgba(168, 85, 247, 0.3)' : 'none',
                }}
              >
                <Scan className="w-6 h-6 text-violet-400" />
                {phase === 'scanning' && (
                  <div className="absolute inset-0 rounded-xl border border-violet-400/50 animate-ping" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider">// SCANNER</span>
                </div>
                <h2
                  className="text-xl font-bold text-white"
                  style={{ fontFamily: 'var(--font-family-display)' }}
                >
                  DUPLICATE FINDER
                </h2>
                <p className="text-xs text-white/40 mt-0.5">
                  {phase === 'idle' && 'Analyze library for duplicate entries'}
                  {phase === 'scanning' && 'Deep scanning library data...'}
                  {phase === 'complete' && unresolvedDuplicates.length > 0 && `${unresolvedDuplicates.length} groups require attention`}
                  {phase === 'complete' && unresolvedDuplicates.length === 0 && 'Library integrity verified'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Rescan Button */}
              {phase === 'complete' && (
                <button
                  onClick={() => {
                    resetState();
                    startScan();
                  }}
                  className="group relative flex items-center gap-2 px-4 py-2 rounded-xl overflow-hidden transition-all duration-300"
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <RotateCw className="relative w-4 h-4 text-white/40 group-hover:text-cyan-400 group-hover:rotate-180 transition-all duration-500" />
                  <span className="relative text-sm text-white/40 group-hover:text-white transition-colors">Rescan</span>
                </button>
              )}

              {/* Close button */}
              <button
                onClick={onClose}
                className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-white/40 hover:text-white hover:border-white/[0.12] transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {/* Error */}
          {error && (
            <div
              className="mx-6 mt-4 p-4 rounded-xl flex items-center gap-3"
              style={{
                background: 'rgba(239, 68, 68, 0.05)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
              }}
            >
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-400 flex-1">{error}</p>
              <button
                onClick={() => setError(null)}
                className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-red-400" />
              </button>
            </div>
          )}

          {/* Idle State */}
          {phase === 'idle' && (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              {/* Animated icon */}
              <div className="relative mb-8">
                <div
                  className="w-28 h-28 rounded-2xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(34, 211, 238, 0.1) 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <Layers className="w-12 h-12 text-violet-400/60" />
                  {/* Scanning line effect */}
                  <div className="absolute inset-0 overflow-hidden rounded-2xl">
                    <div
                      className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-violet-400/30 to-transparent"
                      style={{ animation: 'scan 2s ease-in-out infinite' }}
                    />
                  </div>
                </div>
                {/* Corner accents */}
                <div className="absolute -top-1 -left-1 w-3 h-3 border-l-2 border-t-2 border-violet-500/50" />
                <div className="absolute -top-1 -right-1 w-3 h-3 border-r-2 border-t-2 border-violet-500/50" />
                <div className="absolute -bottom-1 -left-1 w-3 h-3 border-l-2 border-b-2 border-violet-500/50" />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 border-r-2 border-b-2 border-violet-500/50" />
                {/* Badge */}
                <div
                  className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #0f1011 0%, #0a0a0b 100%)',
                    border: '1px solid rgba(251, 191, 36, 0.3)',
                    boxShadow: '0 0 15px rgba(251, 191, 36, 0.2)',
                  }}
                >
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </div>
              </div>

              <h3
                className="text-2xl font-bold text-white mb-2"
                style={{ fontFamily: 'var(--font-family-display)' }}
              >
                SCAN FOR DUPLICATES
              </h3>
              <p className="text-sm text-white/40 text-center max-w-md mb-8">
                Analyze your library to find games that appear multiple times and choose how to handle each copy.
              </p>

              {/* Success message */}
              {clearedCount !== null && (
                <div
                  className="mb-6 px-5 py-3 rounded-xl"
                  style={{
                    background: 'rgba(52, 211, 153, 0.05)',
                    border: '1px solid rgba(52, 211, 153, 0.2)',
                  }}
                >
                  <p className="text-sm text-emerald-400">
                    {clearedCount > 0
                      ? `Cleared ${clearedCount} dismissed ${clearedCount === 1 ? 'pair' : 'pairs'}. Starting fresh scan...`
                      : 'No dismissed pairs to clear'}
                  </p>
                </div>
              )}

              {/* Start Scan Button */}
              <button
                onClick={startScan}
                disabled={isClearing}
                className="group relative px-8 py-4 rounded-xl overflow-hidden transition-all duration-300 disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(34, 211, 238, 0.2) 100%)',
                  border: '1px solid rgba(168, 85, 247, 0.4)',
                  boxShadow: '0 0 20px rgba(168, 85, 247, 0.2)',
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400 to-transparent opacity-50" />
                <div className="relative flex items-center gap-3">
                  <Scan className="w-5 h-5 text-violet-400" />
                  <span
                    className="text-lg font-bold text-white uppercase tracking-wide"
                    style={{ fontFamily: 'var(--font-family-display)' }}
                  >
                    Initialize Scan
                  </span>
                  <Zap className="w-4 h-4 text-cyan-400" />
                </div>
              </button>

              {/* Reset dismissed */}
              <button
                onClick={handleClearDismissed}
                disabled={isClearing}
                className="mt-6 group flex items-center gap-2 px-4 py-2 text-sm text-white/30 hover:text-amber-400 transition-colors"
              >
                {isClearing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                )}
                {isClearing ? 'Clearing...' : 'Reset dismissed pairs'}
              </button>
              <p className="mt-1 text-[11px] text-white/20 text-center max-w-xs">
                Previously dismissed pairs will appear again in future scans
              </p>
            </div>
          )}

          {/* Scanning State */}
          {phase === 'scanning' && (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="relative mb-8">
                {/* Progress ring */}
                <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50" cy="50" r="42"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.04)"
                    strokeWidth="4"
                  />
                  <circle
                    cx="50" cy="50" r="42"
                    fill="none"
                    stroke="url(#progressGradient)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={`${scanProgress * 2.64} 264`}
                    className="transition-all duration-300"
                  />
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#22d3ee" />
                    </linearGradient>
                  </defs>
                </svg>
                {/* Center content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span
                    className="text-3xl font-bold text-white tabular-nums"
                    style={{ fontFamily: 'var(--font-family-display)' }}
                  >
                    {Math.round(scanProgress)}%
                  </span>
                </div>
                {/* Glow effect */}
                <div
                  className="absolute inset-0 rounded-full blur-xl -z-10"
                  style={{ background: 'rgba(168, 85, 247, 0.15)' }}
                />
              </div>
              <p
                className="text-sm text-white/50 uppercase tracking-wider"
                style={{ fontFamily: 'var(--font-family-display)' }}
              >
                Analyzing Library Data...
              </p>
              <p className="text-xs text-white/30 mt-2">Comparing titles and metadata</p>
            </div>
          )}

          {/* Results */}
          {phase === 'complete' && (
            <div className="p-6 space-y-4">
              {/* Stats Row */}
              {(unresolvedDuplicates.length > 0 || resolvedGroups.size > 0) && (
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <StatBox label="Groups Found" value={unresolvedDuplicates.length} color="violet" />
                  <StatBox label="Total Copies" value={totalDuplicateCount} color="amber" />
                  <StatBox label="Resolved" value={resolvedGroups.size} color="emerald" />
                </div>
              )}

              {/* Legend */}
              {unresolvedDuplicates.length > 0 && (
                <div
                  className="flex items-center justify-center gap-6 py-3 rounded-xl mb-4"
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-emerald-500" />
                    <span className="text-xs text-white/50">Keep</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-cyan-500" />
                    <span className="text-xs text-white/50">Merge</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-red-500" />
                    <span className="text-xs text-white/50">Delete</span>
                  </div>
                  <span className="text-[10px] text-white/30 font-mono">// CLICK TO CYCLE</span>
                </div>
              )}

              {/* No Duplicates */}
              {unresolvedDuplicates.length === 0 && duplicates.length === 0 && (
                <SuccessState
                  title="NO DUPLICATES FOUND"
                  subtitle="Your library is clean!"
                  onRescan={() => { resetState(); startScan(); }}
                  onResetDismissed={async () => {
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
                  isClearing={isClearing}
                />
              )}

              {/* All Resolved */}
              {unresolvedDuplicates.length === 0 && duplicates.length > 0 && (
                <SuccessState
                  title="ALL DONE!"
                  subtitle={`${resolvedGroups.size} duplicate ${resolvedGroups.size === 1 ? 'group' : 'groups'} resolved`}
                  onRescan={() => { resetState(); startScan(); }}
                  onClose={onClose}
                  showDoneButton
                />
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

        {/* Bottom accent */}
        <div className="h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
      </div>
    </div>
  );
}

// Stat Box Component
function StatBox({ label, value, color }: { label: string; value: number; color: 'violet' | 'amber' | 'emerald' | 'cyan' }) {
  const colors = {
    violet: { text: 'text-violet-400', border: 'border-violet-500/30', glow: 'rgba(168, 85, 247, 0.1)' },
    amber: { text: 'text-amber-400', border: 'border-amber-500/30', glow: 'rgba(251, 191, 36, 0.1)' },
    emerald: { text: 'text-emerald-400', border: 'border-emerald-500/30', glow: 'rgba(52, 211, 153, 0.1)' },
    cyan: { text: 'text-cyan-400', border: 'border-cyan-500/30', glow: 'rgba(34, 211, 238, 0.1)' },
  };

  return (
    <div
      className={`relative p-4 rounded-xl border ${colors[color].border} overflow-hidden`}
      style={{ background: colors[color].glow }}
    >
      <div
        className={`text-3xl font-bold ${colors[color].text} tabular-nums`}
        style={{ fontFamily: 'var(--font-family-display)' }}
      >
        {value}
      </div>
      <div className="text-[10px] text-white/40 uppercase tracking-wider mt-1">{label}</div>
    </div>
  );
}

// Success State Component
function SuccessState({
  title,
  subtitle,
  onRescan,
  onResetDismissed,
  onClose,
  isClearing,
  showDoneButton,
}: {
  title: string;
  subtitle: string;
  onRescan: () => void;
  onResetDismissed?: () => void;
  onClose?: () => void;
  isClearing?: boolean;
  showDoneButton?: boolean;
}) {
  return (
    <div className="text-center py-12">
      <div className="relative w-24 h-24 mx-auto mb-6">
        {/* Animated ring */}
        <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20" />
        <div
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-400/60"
          style={{ animation: 'spin 3s linear infinite' }}
        />
        {/* Inner circle */}
        <div
          className="absolute inset-2 rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.1) 0%, rgba(34, 211, 238, 0.05) 100%)',
            border: '1px solid rgba(52, 211, 153, 0.2)',
          }}
        >
          <CheckCircle className="w-10 h-10 text-emerald-400" />
        </div>
        {/* Glow */}
        <div
          className="absolute inset-0 rounded-full blur-xl -z-10"
          style={{ background: 'rgba(52, 211, 153, 0.15)' }}
        />
      </div>

      <h3
        className="text-2xl font-bold text-white mb-2"
        style={{ fontFamily: 'var(--font-family-display)' }}
      >
        {title}
      </h3>
      <p className="text-sm text-white/40 mb-8">{subtitle}</p>

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={onRescan}
          className="group flex items-center gap-2 px-5 py-3 rounded-xl transition-all duration-300"
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <RotateCw className="w-4 h-4 text-white/40 group-hover:text-cyan-400 group-hover:rotate-180 transition-all duration-500" />
          <span className="text-sm text-white/50 group-hover:text-white transition-colors">Scan Again</span>
        </button>

        {showDoneButton && onClose && (
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-5 py-3 rounded-xl transition-all duration-300"
            style={{
              background: 'rgba(52, 211, 153, 0.1)',
              border: '1px solid rgba(52, 211, 153, 0.3)',
            }}
          >
            <span className="text-sm font-medium text-emerald-400">Done</span>
          </button>
        )}
      </div>

      {onResetDismissed && (
        <button
          onClick={onResetDismissed}
          disabled={isClearing}
          className="mt-4 group inline-flex items-center gap-2 px-3 py-1.5 text-xs text-white/30 hover:text-amber-400 transition-colors"
        >
          {isClearing ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <RefreshCcw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" />
          )}
          <span>Reset dismissed pairs & scan again</span>
        </button>
      )}
    </div>
  );
}

// Duplicate Group Card Component
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

  const hasChanges = mergeCount > 0 || deleteCount > 0;
  const isValid = keepCount > 0 || mergeCount > 0;
  const mergeWarning = mergeCount === 1 ? 'Need 2+ entries to merge' : null;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors text-left"
      >
        <div
          className={`w-2.5 h-2.5 rounded-full ${group.matchType === 'exact' ? 'bg-red-400' : 'bg-amber-400'}`}
          style={{
            boxShadow: group.matchType === 'exact'
              ? '0 0 8px rgba(248, 113, 113, 0.5)'
              : '0 0 8px rgba(251, 191, 36, 0.5)',
          }}
        />

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white truncate">{gameTitle}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-white/40 font-mono">{group.games.length} copies</span>
            <span className="text-xs text-white/20">•</span>
            <span className={`text-xs ${group.matchType === 'exact' ? 'text-red-400' : 'text-amber-400'}`}>
              {group.matchType === 'exact' ? 'Exact match' : 'Similar titles'}
            </span>
          </div>
        </div>

        <div
          className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
            group.confidence >= 90
              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          }`}
        >
          {group.confidence}%
        </div>

        <ArrowRight className={`w-4 h-4 text-white/30 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-white/[0.04]">
          {/* Not duplicates option */}
          <button
            onClick={() => onDismiss(true)}
            className={`w-full mt-4 p-4 rounded-xl text-left transition-all group ${
              group.matchType === 'exact'
                ? 'bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/20'
                : 'bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/20'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    group.matchType === 'exact' ? 'bg-rose-500/10' : 'bg-amber-500/10'
                  }`}
                >
                  <Ban className={`w-4 h-4 ${group.matchType === 'exact' ? 'text-rose-400' : 'text-amber-400'}`} />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${group.matchType === 'exact' ? 'text-rose-400' : 'text-amber-400'}`}>
                    Not duplicates
                  </p>
                  <p className="text-xs text-white/40">
                    {group.matchType === 'exact'
                      ? "Same game on different platforms - won't show again"
                      : "These are different games - won't show again"}
                  </p>
                </div>
              </div>
              <span className={`text-xs opacity-0 group-hover:opacity-100 transition-opacity ${
                group.matchType === 'exact' ? 'text-rose-400' : 'text-amber-400'
              }`}>
                Remember →
              </span>
            </div>
          </button>

          {/* Quick actions */}
          <div className="flex items-center gap-2 mt-4 mb-3">
            <span className="text-[10px] text-white/30 uppercase tracking-wider">Set all:</span>
            <button
              onClick={() => onSetAllActions('keep')}
              className="px-3 py-1.5 text-xs font-medium bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg transition-colors"
            >
              Keep
            </button>
            <button
              onClick={() => onSetAllActions('merge')}
              className="px-3 py-1.5 text-xs font-medium bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 rounded-lg transition-colors"
            >
              Merge
            </button>
            <button
              onClick={() => onSetAllActions('delete')}
              className="px-3 py-1.5 text-xs font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-colors"
            >
              Delete
            </button>
            <div className="flex-1" />
            <div className="flex items-center gap-3 text-xs font-mono">
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
                keep: { bg: 'rgba(52, 211, 153, 0.05)', border: 'rgba(52, 211, 153, 0.2)' },
                merge: { bg: 'rgba(34, 211, 238, 0.05)', border: 'rgba(34, 211, 238, 0.2)' },
                delete: { bg: 'rgba(239, 68, 68, 0.05)', border: 'rgba(239, 68, 68, 0.15)' },
              };

              const checkboxColors = {
                keep: 'bg-emerald-500',
                merge: 'bg-cyan-500',
                delete: 'bg-red-500',
              };

              return (
                <div
                  key={userGame.id}
                  onClick={() => onCycleAction(userGame.id)}
                  className={`relative p-4 rounded-xl cursor-pointer transition-all ${action === 'delete' ? 'opacity-50' : ''}`}
                  style={{
                    background: actionStyles[action].bg,
                    border: `1px solid ${actionStyles[action].border}`,
                  }}
                >
                  <div className="flex items-center gap-4">
                    {/* Cover */}
                    {game?.cover_url ? (
                      <img
                        src={game.cover_url}
                        alt={game.title}
                        className={`w-12 h-16 object-cover rounded-lg ${action === 'delete' && 'grayscale'}`}
                      />
                    ) : (
                      <div
                        className="w-12 h-16 rounded-lg flex items-center justify-center"
                        style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}
                      >
                        <Gamepad2 className="w-5 h-5 text-white/20" />
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate mb-1.5 ${action === 'delete' ? 'text-white/40' : 'text-white'}`}>
                        {game?.title || 'Unknown'}
                      </p>

                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-md text-white/60 uppercase tracking-wider"
                          style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.08)' }}
                        >
                          {(() => {
                            const match = userGame.platform.match(/^(.+?)\s*\((.+)\)$/);
                            return match ? match[2] : userGame.platform;
                          })()}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md uppercase tracking-wider ${
                            userGame.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            userGame.status === 'playing' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                            'bg-white/[0.03] text-white/40 border border-white/[0.06]'
                          }`}
                        >
                          {userGame.status}
                        </span>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 mt-2">
                        {userGame.playtime_hours > 0 && (
                          <div className="flex items-center gap-1.5 text-xs text-white/40">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="tabular-nums">{userGame.playtime_hours.toFixed(1)}h</span>
                          </div>
                        )}
                        {userGame.achievements_earned > 0 && (
                          <div className="flex items-center gap-1.5 text-xs text-amber-400/70">
                            <Trophy className="w-3.5 h-3.5" />
                            <span className="tabular-nums">{userGame.achievements_earned}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action indicator */}
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${checkboxColors[action]}`}>
                      {action === 'keep' && <Check className="w-4 h-4 text-white" />}
                      {action === 'merge' && <Merge className="w-4 h-4 text-white" />}
                      {action === 'delete' && <Trash2 className="w-4 h-4 text-white" />}
                    </div>
                  </div>

                  {/* Badge */}
                  <div
                    className={`absolute top-3 right-3 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                      action === 'keep' ? 'bg-emerald-500/20 text-emerald-400' :
                      action === 'merge' ? 'bg-cyan-500/20 text-cyan-400' :
                      'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {action}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Warnings */}
          {mergeWarning && (
            <p className="mt-3 text-xs text-amber-400 text-center">{mergeWarning}</p>
          )}
          {!isValid && (
            <p className="mt-3 text-xs text-red-400 text-center">Must keep or merge at least one entry</p>
          )}

          {/* Actions */}
          <div className="mt-5 pt-4 border-t border-white/[0.04]">
            <div className="flex gap-3">
              <button
                onClick={onApply}
                disabled={isProcessing || !isValid || (mergeCount === 1 && deleteCount === 0 && keepCount === 0)}
                className="flex-1 px-5 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)',
                  border: '1px solid rgba(34, 211, 238, 0.3)',
                }}
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                ) : (
                  <Play className="w-4 h-4 text-cyan-400" />
                )}
                <span className="text-white">{hasChanges ? 'Apply Changes' : 'Done'}</span>
              </button>
              <button
                onClick={() => onDismiss(false)}
                disabled={isProcessing}
                className="px-5 py-3 rounded-xl font-medium text-white/50 hover:text-white transition-colors"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                Skip
              </button>
            </div>

            {/* Summary */}
            {hasChanges && (
              <p className="mt-3 text-[11px] text-white/30 text-center font-mono">
                {mergeCount >= 2 && `Merging ${mergeCount} entries • `}
                {deleteCount > 0 && `Deleting ${deleteCount} entries • `}
                {keepCount > 0 && `Keeping ${keepCount} separate`}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
