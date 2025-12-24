'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Zap,
  Database,
  Cloud,
  Trophy,
  CheckCircle2,
  Clock,
  Activity,
  Gauge,
  Gamepad2,
  Star,
  Shield,
  Library,
  Server,
  Wifi,
} from 'lucide-react';

type PlatformType = 'steam' | 'psn' | 'xbox' | 'epic';

interface SyncPhase {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  estimatedDuration: number; // seconds
}

// Platform-specific sync phases with detailed descriptions and timing
const SYNC_PHASES: Record<PlatformType, SyncPhase[]> = {
  steam: [
    { id: 'connect', label: 'Authenticating', description: 'Verifying Steam API credentials', icon: Shield, estimatedDuration: 2 },
    { id: 'fetch', label: 'Fetching Library', description: 'Retrieving owned games from Steam', icon: Library, estimatedDuration: 5 },
    { id: 'metadata', label: 'Loading Metadata', description: 'Getting game details and artwork', icon: Database, estimatedDuration: 15 },
    { id: 'playtime', label: 'Syncing Playtime', description: 'Updating hours played per game', icon: Clock, estimatedDuration: 8 },
    { id: 'achievements', label: 'Syncing Achievements', description: 'Fetching achievement progress', icon: Trophy, estimatedDuration: 20 },
    { id: 'finalize', label: 'Finalizing', description: 'Saving to your library', icon: CheckCircle2, estimatedDuration: 3 },
  ],
  psn: [
    { id: 'connect', label: 'Connecting to PSN', description: 'Establishing secure connection', icon: Wifi, estimatedDuration: 3 },
    { id: 'profile', label: 'Loading Profile', description: 'Fetching PSN account data', icon: Shield, estimatedDuration: 4 },
    { id: 'titles', label: 'Fetching Titles', description: 'Retrieving your game collection', icon: Library, estimatedDuration: 10 },
    { id: 'trophies', label: 'Syncing Trophies', description: 'Loading Bronze, Silver, Gold & Platinum', icon: Trophy, estimatedDuration: 30 },
    { id: 'metadata', label: 'Enriching Data', description: 'Adding game artwork and details', icon: Database, estimatedDuration: 12 },
    { id: 'finalize', label: 'Finalizing', description: 'Completing sync to library', icon: CheckCircle2, estimatedDuration: 3 },
  ],
  xbox: [
    { id: 'connect', label: 'Xbox Live Auth', description: 'Authenticating with Microsoft', icon: Shield, estimatedDuration: 4 },
    { id: 'profile', label: 'Loading Gamertag', description: 'Fetching Xbox profile data', icon: Star, estimatedDuration: 3 },
    { id: 'titles', label: 'Fetching Titles', description: 'Retrieving your game library', icon: Library, estimatedDuration: 8 },
    { id: 'gamerscore', label: 'Syncing Gamerscore', description: 'Calculating total achievement points', icon: Zap, estimatedDuration: 5 },
    { id: 'achievements', label: 'Syncing Achievements', description: 'Loading achievement details', icon: Trophy, estimatedDuration: 25 },
    { id: 'finalize', label: 'Finalizing', description: 'Saving your Xbox data', icon: CheckCircle2, estimatedDuration: 3 },
  ],
  epic: [
    { id: 'connect', label: 'Epic Games Auth', description: 'Connecting to Epic services', icon: Server, estimatedDuration: 3 },
    { id: 'fetch', label: 'Fetching Library', description: 'Retrieving purchased games', icon: Library, estimatedDuration: 6 },
    { id: 'free', label: 'Checking Free Games', description: 'Including claimed free titles', icon: Gamepad2, estimatedDuration: 4 },
    { id: 'metadata', label: 'Loading Details', description: 'Fetching game information', icon: Database, estimatedDuration: 10 },
    { id: 'finalize', label: 'Finalizing', description: 'Completing Epic sync', icon: CheckCircle2, estimatedDuration: 2 },
  ],
};

// Platform-specific configuration
const PLATFORM_CONFIG: Record<PlatformType, {
  name: string;
  accent: string;
  glow: string;
  statLabel: string;
  statIcon: React.ComponentType<{ className?: string }>;
  avgSyncTime: number; // Average total sync time in seconds
  apiNote: string;
}> = {
  steam: {
    name: 'Steam',
    accent: 'rgb(102, 192, 244)',
    glow: 'rgba(102, 192, 244, 0.4)',
    statLabel: 'Achievements',
    statIcon: Trophy,
    avgSyncTime: 53,
    apiNote: 'Steam Web API',
  },
  psn: {
    name: 'PlayStation',
    accent: 'rgb(0, 112, 209)',
    glow: 'rgba(0, 112, 209, 0.4)',
    statLabel: 'Trophies',
    statIcon: Trophy,
    avgSyncTime: 62,
    apiNote: 'PlayStation Network',
  },
  xbox: {
    name: 'Xbox',
    accent: 'rgb(82, 176, 67)',
    glow: 'rgba(82, 176, 67, 0.4)',
    statLabel: 'Gamerscore',
    statIcon: Zap,
    avgSyncTime: 48,
    apiNote: 'Xbox Live API',
  },
  epic: {
    name: 'Epic Games',
    accent: 'rgb(255, 255, 255)',
    glow: 'rgba(255, 255, 255, 0.2)',
    statLabel: 'Games',
    statIcon: Gamepad2,
    avgSyncTime: 25,
    apiNote: 'Epic Games Store',
  },
};

// Platform-specific tips shown during sync
const PLATFORM_TIPS: Record<PlatformType, string[]> = {
  steam: [
    'Steam achievements are fetched per-game for accuracy',
    'Private profiles may limit available data',
    'Playtime updates every time you play',
    'Steam tracks achievements since 2007',
  ],
  psn: [
    'Trophy sync includes all PlayStation platforms',
    'Platinum trophies require 100% game completion',
    'PSN tracks trophies since PS3 era',
    'Hidden trophies are revealed after unlock',
  ],
  xbox: [
    'Gamerscore accumulates across all Xbox games',
    'Xbox achievements started with Xbox 360',
    'Some achievements have time-limited unlock windows',
    'Rare achievements show community completion %',
  ],
  epic: [
    'Epic Games includes claimed free games',
    'Achievement system varies by game',
    'Library includes games from Epic exclusives',
    'Cross-buy titles appear once in library',
  ],
};

function formatTime(seconds: number): string {
  if (seconds < 0) return '--:--';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

interface SyncProgressModalProps {
  isOpen: boolean;
  platform: PlatformType;
  progress?: {
    phase?: string;
    current?: number;
    total?: number;
    message?: string;
  };
}

export function SyncProgressModal({ isOpen, platform, progress }: SyncProgressModalProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [displayPhaseIndex, setDisplayPhaseIndex] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [processingRate, setProcessingRate] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastProgressRef = useRef<{ time: number; count: number } | null>(null);
  const wasOpenRef = useRef(false);
  const tipIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const phases = SYNC_PHASES[platform];
  const config = PLATFORM_CONFIG[platform];
  const tips = PLATFORM_TIPS[platform];

  // Calculate total estimated duration
  const totalEstimatedDuration = useMemo(() => {
    return phases.reduce((sum, phase) => sum + phase.estimatedDuration, 0);
  }, [phases]);

  // Calculate cumulative duration up to current phase
  const cumulativeDuration = useMemo(() => {
    let sum = 0;
    return phases.map(phase => {
      sum += phase.estimatedDuration;
      return sum;
    });
  }, [phases]);

  // Calculate actual progress percentage based on phases and timing
  const calculatedProgress = useMemo(() => {
    if (progress?.current !== undefined && progress?.total !== undefined && progress.total > 0) {
      // If we have item-level progress, use it
      return Math.min((progress.current / progress.total) * 100, 100);
    }

    // Otherwise, estimate based on elapsed time and phase
    const phaseStartTime = displayPhaseIndex > 0 ? cumulativeDuration[displayPhaseIndex - 1] : 0;
    const phaseEndTime = cumulativeDuration[displayPhaseIndex];
    const phaseDuration = phaseEndTime - phaseStartTime;

    // How far into the current phase are we (based on elapsed time)?
    const timeInCurrentPhase = Math.max(0, elapsedTime - phaseStartTime);
    const phaseProgress = Math.min(timeInCurrentPhase / phaseDuration, 1);

    // Calculate overall progress
    const baseProgress = (phaseStartTime / totalEstimatedDuration) * 100;
    const phaseContribution = ((phaseDuration / totalEstimatedDuration) * 100) * phaseProgress;

    return Math.min(baseProgress + phaseContribution, 95); // Cap at 95% until complete
  }, [progress?.current, progress?.total, displayPhaseIndex, elapsedTime, cumulativeDuration, totalEstimatedDuration]);

  const [displayProgress, setDisplayProgress] = useState(0);

  // Smooth progress updates
  useEffect(() => {
    const target = isCompleting ? 100 : calculatedProgress;
    const diff = target - displayProgress;
    if (Math.abs(diff) > 0.5) {
      const step = diff * 0.15;
      setDisplayProgress(prev => prev + step);
    }
  }, [calculatedProgress, isCompleting, displayProgress]);

  // Estimated time remaining based on phase timing
  const estimatedRemaining = useMemo(() => {
    if (isCompleting) return 0;

    // Use phase-based estimation
    const remainingPhaseTime = Math.max(0, cumulativeDuration[displayPhaseIndex] - elapsedTime);
    const futurePhaseTime = phases
      .slice(displayPhaseIndex + 1)
      .reduce((sum, phase) => sum + phase.estimatedDuration, 0);

    return Math.ceil(remainingPhaseTime + futurePhaseTime);
  }, [isCompleting, cumulativeDuration, displayPhaseIndex, elapsedTime, phases]);

  // Update processing rate when real progress comes in
  useEffect(() => {
    if (progress?.current !== undefined && progress.current > 0) {
      const now = Date.now();
      if (lastProgressRef.current) {
        const timeDelta = (now - lastProgressRef.current.time) / 1000;
        const countDelta = progress.current - lastProgressRef.current.count;
        if (timeDelta > 0 && countDelta > 0) {
          const newRate = countDelta / timeDelta;
          setProcessingRate(prev => prev === 0 ? newRate : prev * 0.7 + newRate * 0.3);
        }
      }
      lastProgressRef.current = { time: now, count: progress.current };
    }
  }, [progress?.current]);

  // Find current phase index from progress data or elapsed time
  useEffect(() => {
    if (progress?.phase) {
      const idx = phases.findIndex(p => p.id === progress.phase);
      if (idx >= 0) {
        setDisplayPhaseIndex(idx);
      }
    } else if (!isCompleting) {
      // Estimate phase based on elapsed time
      let cumulativeTime = 0;
      for (let i = 0; i < phases.length; i++) {
        cumulativeTime += phases[i].estimatedDuration;
        if (elapsedTime < cumulativeTime) {
          setDisplayPhaseIndex(i);
          break;
        }
      }
    }
  }, [progress?.phase, phases, elapsedTime, isCompleting]);

  // Rotate tips
  useEffect(() => {
    if (isVisible && !isCompleting) {
      tipIntervalRef.current = setInterval(() => {
        setTipIndex(prev => (prev + 1) % tips.length);
      }, 5000);
    }

    return () => {
      if (tipIntervalRef.current) {
        clearInterval(tipIntervalRef.current);
        tipIntervalRef.current = null;
      }
    };
  }, [isVisible, isCompleting, tips.length]);

  // Handle open/close transitions
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      wasOpenRef.current = true;
      setIsVisible(true);
      setIsCompleting(false);
      startTimeRef.current = Date.now();
      setElapsedTime(0);
      setDisplayPhaseIndex(0);
      setDisplayProgress(0);
      setProcessingRate(0);
      setWaveformData([]);
      setTipIndex(0);
      lastProgressRef.current = null;
    } else if (!isOpen && wasOpenRef.current) {
      wasOpenRef.current = false;
      setIsCompleting(true);
      setDisplayPhaseIndex(phases.length - 1);

      const hideTimeout = setTimeout(() => {
        setIsVisible(false);
        setIsCompleting(false);
      }, 1000);

      return () => clearTimeout(hideTimeout);
    }
  }, [isOpen, phases.length]);

  // Timer and waveform updates
  useEffect(() => {
    if (isVisible && !isCompleting) {
      intervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        setElapsedTime(elapsed);

        setWaveformData(prev => {
          const newVal = 20 + Math.sin(elapsed * 2) * 15 + Math.random() * 30;
          const newData = [...prev, newVal];
          return newData.slice(-60);
        });
      }, 100);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isVisible, isCompleting]);

  if (!isVisible || !mounted) return null;

  // Safety check for phases array and config
  if (!phases || phases.length === 0 || displayPhaseIndex >= phases.length || !config) {
    return null;
  }

  const currentPhase = phases[displayPhaseIndex];
  const PhaseIcon = currentPhase.icon;
  const StatIcon = config.statIcon;
  const hasRealProgress = progress?.current !== undefined && progress?.total !== undefined;

  const modalContent = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-[var(--theme-bg-primary)]/95 backdrop-blur-md"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-lg overflow-hidden rounded-2xl animate-modal-slide-in bg-[var(--theme-bg-secondary)] border border-[var(--theme-border)]"
          style={{
            boxShadow: `
              0 0 0 1px var(--theme-border),
              0 4px 60px ${config.glow},
              0 25px 50px -12px rgba(0, 0, 0, 0.6)
            `,
          }}
        >
          {/* Ambient glow effects */}
          <div
            className="absolute -top-32 -left-32 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-30"
            style={{ background: config.glow }}
          />
          <div
            className="absolute -bottom-32 -right-32 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-20"
            style={{ background: 'rgba(168, 85, 247, 0.3)' }}
          />

          {/* Scan line effect */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.03]">
            <div className="absolute left-0 right-0 h-px bg-white animate-scan-line" />
          </div>

          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-8 h-8">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-[var(--theme-text-primary)]/20 to-transparent" />
            <div className="absolute top-0 left-0 h-full w-px bg-gradient-to-b from-[var(--theme-text-primary)]/20 to-transparent" />
          </div>
          <div className="absolute top-0 right-0 w-8 h-8">
            <div className="absolute top-0 right-0 w-full h-px bg-gradient-to-l from-[var(--theme-text-primary)]/20 to-transparent" />
            <div className="absolute top-0 right-0 h-full w-px bg-gradient-to-b from-[var(--theme-text-primary)]/20 to-transparent" />
          </div>
          <div className="absolute bottom-0 left-0 w-8 h-8">
            <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-[var(--theme-text-primary)]/10 to-transparent" />
            <div className="absolute bottom-0 left-0 h-full w-px bg-gradient-to-t from-[var(--theme-text-primary)]/10 to-transparent" />
          </div>
          <div className="absolute bottom-0 right-0 w-8 h-8">
            <div className="absolute bottom-0 right-0 w-full h-px bg-gradient-to-l from-[var(--theme-text-primary)]/10 to-transparent" />
            <div className="absolute bottom-0 right-0 h-full w-px bg-gradient-to-t from-[var(--theme-text-primary)]/10 to-transparent" />
          </div>

          {/* Header */}
          <div className="relative px-6 pt-6 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Platform indicator */}
                <div className="relative">
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 ${
                      isCompleting
                        ? 'bg-emerald-500/10 border border-emerald-500/30'
                        : 'bg-[var(--theme-hover-bg)] border border-[var(--theme-border)]'
                    }`}
                  >
                    {isCompleting ? (
                      <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                    ) : (
                      <Activity className="w-7 h-7" style={{ color: config.accent }} />
                    )}
                  </div>
                  {!isCompleting && (
                    <div
                      className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full animate-pulse"
                      style={{
                        background: config.accent,
                        boxShadow: `0 0 12px ${config.glow}`,
                      }}
                    />
                  )}
                </div>
                <div>
                  <h3
                    className="text-xl font-semibold tracking-wide transition-colors duration-300"
                    style={{
                      fontFamily: 'var(--font-family-display)',
                      color: isCompleting ? '#34d399' : config.accent,
                      textShadow: isCompleting
                        ? '0 0 20px rgba(52, 211, 153, 0.5)'
                        : `0 0 20px ${config.glow}`,
                    }}
                  >
                    {isCompleting ? 'Sync Complete!' : `${config.name} Sync`}
                  </h3>
                  <p className="text-[11px] text-[var(--theme-text-subtle)] font-medium tracking-wider uppercase">
                    {isCompleting ? 'All data synchronized' : config.apiNote}
                  </p>
                </div>
              </div>

              {/* Timer section */}
              <div className="text-right">
                <div className="flex items-center gap-1.5 justify-end text-[var(--theme-text-subtle)]">
                  <Clock className="w-3 h-3" />
                  <span className="text-[10px] uppercase tracking-wider font-medium">Elapsed</span>
                </div>
                <div
                  className="text-2xl font-bold tabular-nums text-[var(--theme-text-primary)]"
                  style={{ fontFamily: 'var(--font-family-display)' }}
                >
                  {formatTime(elapsedTime)}
                </div>
              </div>
            </div>
          </div>

          {/* Progress section */}
          <div className="px-6 pb-5 space-y-4">
            {/* Main progress bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[var(--theme-text-subtle)] uppercase tracking-wider font-medium">
                  {hasRealProgress
                    ? `${progress?.current?.toLocaleString()} / ${progress?.total?.toLocaleString()} items`
                    : currentPhase.description
                  }
                </span>
                <span
                  className="text-sm font-bold tabular-nums"
                  style={{
                    fontFamily: 'var(--font-family-display)',
                    color: config.accent,
                  }}
                >
                  {displayProgress.toFixed(0)}%
                </span>
              </div>

              {/* Progress bar */}
              <div
                className="relative h-2.5 rounded-full overflow-hidden bg-[var(--theme-border)]"
                style={{
                  boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.2)',
                }}
              >
                {/* Animated pattern */}
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: `repeating-linear-gradient(
                      90deg,
                      transparent,
                      transparent 8px,
                      rgba(255, 255, 255, 0.05) 8px,
                      rgba(255, 255, 255, 0.05) 16px
                    )`,
                    animation: 'slidePattern 0.8s linear infinite',
                  }}
                />

                {/* Progress fill */}
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${displayProgress}%`,
                    background: `linear-gradient(90deg, ${config.accent}80, ${config.accent})`,
                    boxShadow: `0 0 20px ${config.glow}`,
                  }}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 60%)',
                    }}
                  />
                </div>

                {/* Progress head glow */}
                {displayProgress > 2 && (
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full transition-all duration-300"
                    style={{
                      left: `calc(${displayProgress}% - 8px)`,
                      background: config.accent,
                      boxShadow: `0 0 16px ${config.glow}, 0 0 32px ${config.glow}`,
                      opacity: 0.6,
                    }}
                  />
                )}
              </div>
            </div>

            {/* Phase timeline */}
            <div className="relative p-4 rounded-xl bg-[var(--theme-hover-bg)] border border-[var(--theme-border)]">
              <div className="flex items-center gap-3">
                {/* Current phase icon */}
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300"
                  style={{
                    background: `${config.accent}15`,
                    border: `1px solid ${config.accent}30`,
                    color: config.accent,
                  }}
                >
                  <PhaseIcon className="w-5 h-5" />
                </div>

                {/* Phase info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--theme-text-primary)] truncate">
                    {progress?.message || currentPhase.label}
                  </p>
                  <p className="text-[11px] text-[var(--theme-text-subtle)] truncate">
                    {currentPhase.description}
                  </p>
                </div>

                {/* Phase counter */}
                <div className="text-right flex-shrink-0">
                  <div
                    className="text-lg font-bold tabular-nums"
                    style={{
                      fontFamily: 'var(--font-family-display)',
                      color: config.accent,
                    }}
                  >
                    {displayPhaseIndex + 1}/{phases.length}
                  </div>
                  <div className="text-[9px] text-[var(--theme-text-subtle)] uppercase tracking-wider">Phase</div>
                </div>
              </div>

              {/* Phase progress dots */}
              <div className="flex items-center gap-1 mt-3 pt-3 border-t border-[var(--theme-border)]">
                {phases.map((phase, i) => (
                  <div key={phase.id} className="flex-1 flex items-center gap-1">
                    <div
                      className="w-2 h-2 rounded-full transition-all duration-300 flex-shrink-0"
                      style={{
                        background: i < displayPhaseIndex
                          ? config.accent
                          : i === displayPhaseIndex
                            ? config.accent
                            : 'rgba(255, 255, 255, 0.1)',
                        boxShadow: i <= displayPhaseIndex ? `0 0 8px ${config.glow}` : 'none',
                        opacity: i < displayPhaseIndex ? 0.6 : 1,
                      }}
                    />
                    {i < phases.length - 1 && (
                      <div
                        className="flex-1 h-px transition-all duration-300"
                        style={{
                          background: i < displayPhaseIndex
                            ? config.accent
                            : 'rgba(255, 255, 255, 0.1)',
                          opacity: i < displayPhaseIndex ? 0.4 : 1,
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Activity waveform with stats */}
            <div className="grid grid-cols-3 gap-3">
              {/* Waveform */}
              <div className="col-span-2 relative min-h-[5.5rem] rounded-xl overflow-hidden bg-[var(--theme-hover-bg)] border border-[var(--theme-border)]">
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 88" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id={`waveGrad-${platform}`} x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor={config.accent} stopOpacity="0.4" />
                      <stop offset="100%" stopColor={config.accent} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {waveformData.length > 1 && (
                    <>
                      <path
                        d={`
                          M 0 88
                          ${waveformData.map((y, i) => `L ${(i / (waveformData.length - 1)) * 100} ${88 - (y * 0.7)}`).join(' ')}
                          L 100 88 Z
                        `}
                        fill={`url(#waveGrad-${platform})`}
                        vectorEffect="non-scaling-stroke"
                      />
                      <path
                        d={waveformData.map((y, i) =>
                          `${i === 0 ? 'M' : 'L'} ${(i / (waveformData.length - 1)) * 100} ${88 - (y * 0.7)}`
                        ).join(' ')}
                        fill="none"
                        stroke={config.accent}
                        strokeWidth="1.5"
                        vectorEffect="non-scaling-stroke"
                        style={{ filter: `drop-shadow(0 0 4px ${config.glow})` }}
                      />
                    </>
                  )}
                </svg>

                {processingRate > 0 && (
                  <div className="absolute top-2 right-3 flex items-center gap-1.5 text-[10px] font-medium text-[var(--theme-text-muted)]">
                    <Gauge className="w-3 h-3" style={{ color: config.accent }} />
                    <span className="tabular-nums">{processingRate.toFixed(1)}/s</span>
                  </div>
                )}

                <div className="absolute bottom-2 left-3 text-[9px] font-medium text-[var(--theme-text-subtle)] uppercase tracking-widest">
                  Activity
                </div>
              </div>

              {/* Stats panel */}
              <div className="flex flex-col justify-center items-center p-3 rounded-xl min-h-[5.5rem] bg-[var(--theme-hover-bg)] border border-[var(--theme-border)]">
                <div className="mb-1" style={{ color: config.accent }}>
                  <StatIcon className="w-5 h-5" />
                </div>
                <div className="text-[9px] text-[var(--theme-text-subtle)] uppercase tracking-wider font-medium">
                  {config.statLabel}
                </div>
                {estimatedRemaining > 0 && !isCompleting && (
                  <div
                    className="text-lg font-bold tabular-nums mt-1"
                    style={{
                      fontFamily: 'var(--font-family-display)',
                      color: config.accent,
                    }}
                  >
                    ~{formatTime(estimatedRemaining)}
                  </div>
                )}
                {isCompleting && (
                  <div className="text-sm text-emerald-400 font-semibold mt-1">Done</div>
                )}
              </div>
            </div>

            {/* Status row */}
            <div className="flex items-center justify-between">
              {/* Platform tip */}
              <div
                className="flex-1 text-[10px] text-[var(--theme-text-subtle)] truncate pr-4 transition-opacity duration-500"
                style={{ opacity: isCompleting ? 0 : 1 }}
              >
                {tips[tipIndex]}
              </div>

              {/* Status indicator */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <div
                  className="w-2 h-2 rounded-full transition-colors duration-300"
                  style={{
                    background: isCompleting ? '#34d399' : config.accent,
                    boxShadow: isCompleting
                      ? '0 0 10px rgba(52, 211, 153, 0.5)'
                      : `0 0 10px ${config.glow}`,
                    animation: isCompleting ? 'none' : 'pulseGlow 2s ease-in-out infinite',
                  }}
                />
                <span className="text-[10px] text-[var(--theme-text-subtle)] font-medium uppercase tracking-wider">
                  {isCompleting ? 'Complete' : 'Syncing'}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            className={`px-6 py-4 border-t transition-colors duration-300 bg-[var(--theme-bg-primary)]/50 ${
              isCompleting ? 'border-emerald-500/10' : 'border-[var(--theme-border)]'
            }`}
          >
            <p className="text-[11px] text-[var(--theme-text-subtle)] text-center font-medium">
              {isCompleting
                ? `Your ${config.name} library has been synchronized`
                : `Syncing your ${config.name} library • Do not close this window`
              }
            </p>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes slidePattern {
          0% { transform: translateX(0); }
          100% { transform: translateX(16px); }
        }
      `}</style>
    </>
  );

  return createPortal(modalContent, document.body);
}
