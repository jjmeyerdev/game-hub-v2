'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Zap, Database, Cloud, Trophy, CheckCircle2, Clock, Activity, Gauge } from 'lucide-react';

type PlatformType = 'steam' | 'psn' | 'xbox' | 'epic';

interface SyncPhase {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SYNC_PHASES: Record<PlatformType, SyncPhase[]> = {
  steam: [
    { id: 'connect', label: 'Connecting to Steam', icon: Cloud },
    { id: 'fetch', label: 'Fetching library', icon: Database },
    { id: 'process', label: 'Processing games', icon: Zap },
    { id: 'achievements', label: 'Syncing achievements', icon: Trophy },
    { id: 'finalize', label: 'Finalizing', icon: CheckCircle2 },
  ],
  psn: [
    { id: 'connect', label: 'Connecting to PSN', icon: Cloud },
    { id: 'fetch', label: 'Fetching trophies', icon: Database },
    { id: 'process', label: 'Processing games', icon: Zap },
    { id: 'trophies', label: 'Syncing trophies', icon: Trophy },
    { id: 'finalize', label: 'Finalizing', icon: CheckCircle2 },
  ],
  xbox: [
    { id: 'connect', label: 'Connecting to Xbox Live', icon: Cloud },
    { id: 'fetch', label: 'Fetching titles', icon: Database },
    { id: 'process', label: 'Processing games', icon: Zap },
    { id: 'achievements', label: 'Syncing achievements', icon: Trophy },
    { id: 'finalize', label: 'Finalizing', icon: CheckCircle2 },
  ],
  epic: [
    { id: 'connect', label: 'Connecting to Epic', icon: Cloud },
    { id: 'fetch', label: 'Fetching library', icon: Database },
    { id: 'process', label: 'Processing games', icon: Zap },
    { id: 'finalize', label: 'Finalizing', icon: CheckCircle2 },
  ],
};

const PLATFORM_COLORS: Record<PlatformType, { primary: string; secondary: string; glow: string; bg: string }> = {
  steam: { primary: '#66c0f4', secondary: '#1b2838', glow: 'rgba(102, 192, 244, 0.5)', bg: '#171a21' },
  psn: { primary: '#0070d1', secondary: '#00439c', glow: 'rgba(0, 112, 209, 0.5)', bg: '#003087' },
  xbox: { primary: '#107c10', secondary: '#0e6b0e', glow: 'rgba(16, 124, 16, 0.5)', bg: '#0a4d0a' },
  epic: { primary: '#f5f5f5', secondary: '#858585', glow: 'rgba(245, 245, 245, 0.3)', bg: '#121212' },
};

const PLATFORM_NAMES: Record<PlatformType, string> = {
  steam: 'Steam',
  psn: 'PlayStation',
  xbox: 'Xbox',
  epic: 'Epic Games',
};

// Format time in MM:SS or HH:MM:SS
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
  // Optional real progress data for more accurate tracking
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

  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastProgressRef = useRef<{ time: number; count: number } | null>(null);
  const wasOpenRef = useRef(false);

  const phases = SYNC_PHASES[platform];
  const colors = PLATFORM_COLORS[platform];

  // Calculate actual progress percentage
  const actualProgress = useMemo(() => {
    if (progress?.current !== undefined && progress?.total !== undefined && progress.total > 0) {
      return Math.min((progress.current / progress.total) * 100, 100);
    }
    return null;
  }, [progress?.current, progress?.total]);

  // Simulated progress when no real data available
  const [simulatedProgress, setSimulatedProgress] = useState(0);

  // Calculate estimated time remaining based on processing rate
  const estimatedRemaining = useMemo(() => {
    if (progress?.current !== undefined && progress?.total !== undefined && processingRate > 0) {
      const remaining = progress.total - progress.current;
      return Math.ceil(remaining / processingRate);
    }
    return null;
  }, [progress?.current, progress?.total, processingRate]);

  // Update processing rate when real progress comes in
  useEffect(() => {
    if (progress?.current !== undefined && progress.current > 0) {
      const now = Date.now();
      if (lastProgressRef.current) {
        const timeDelta = (now - lastProgressRef.current.time) / 1000;
        const countDelta = progress.current - lastProgressRef.current.count;
        if (timeDelta > 0 && countDelta > 0) {
          const newRate = countDelta / timeDelta;
          // Smooth the rate with exponential moving average
          setProcessingRate(prev => prev === 0 ? newRate : prev * 0.7 + newRate * 0.3);
        }
      }
      lastProgressRef.current = { time: now, count: progress.current };
    }
  }, [progress?.current]);

  // Find current phase index from progress data
  useEffect(() => {
    if (progress?.phase) {
      const idx = phases.findIndex(p => p.id === progress.phase);
      if (idx >= 0) {
        setDisplayPhaseIndex(idx);
      }
    }
  }, [progress?.phase, phases]);

  // Handle open/close transitions with completion animation
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      // Opening: reset everything and show
      wasOpenRef.current = true;
      setIsVisible(true);
      setIsCompleting(false);
      startTimeRef.current = Date.now();
      setElapsedTime(0);
      setDisplayPhaseIndex(0);
      setSimulatedProgress(0);
      setProcessingRate(0);
      setWaveformData([]);
      lastProgressRef.current = null;
    } else if (!isOpen && wasOpenRef.current) {
      // Closing: trigger completion animation
      wasOpenRef.current = false;
      setIsCompleting(true);
      setSimulatedProgress(100);
      setDisplayPhaseIndex(phases.length - 1);

      // Hide after completion animation
      const hideTimeout = setTimeout(() => {
        setIsVisible(false);
        setIsCompleting(false);
      }, 800);

      return () => clearTimeout(hideTimeout);
    }
  }, [isOpen, phases.length]);

  // Run timer while visible and not completing
  useEffect(() => {
    if (isVisible && !isCompleting) {
      intervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        setElapsedTime(elapsed);

        // Generate waveform data for visualization
        setWaveformData(prev => {
          const newVal = 20 + Math.sin(elapsed * 2) * 15 + Math.random() * 30;
          const newData = [...prev, newVal];
          return newData.slice(-60);
        });

        // Simulated progress if no real data - use slow curve, completion will snap to 100%
        if (actualProgress === null) {
          // Slow curve that approaches but doesn't reach 95%
          // Real completion will trigger the snap to 100%
          const maxProgress = 92;
          const speed = 0.08;
          setSimulatedProgress(prev => {
            const newVal = prev + (maxProgress - prev) * speed;
            return Math.min(newVal, maxProgress);
          });

          // Cycle through phases (excluding final phase until complete)
          const maxPhaseIndex = phases.length - 2; // Save last phase for completion
          const phaseProgress = elapsed / 20; // Roughly 4s per phase
          const newPhaseIndex = Math.min(
            Math.floor(phaseProgress),
            maxPhaseIndex
          );
          setDisplayPhaseIndex(Math.max(0, newPhaseIndex));
        }
      }, 100);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isVisible, isCompleting, actualProgress, phases.length, platform]);

  // Scan lines for HUD effect
  const scanLineCount = 8;

  if (!isVisible) return null;

  const displayProgress = isCompleting ? 100 : (actualProgress ?? simulatedProgress);
  const currentPhase = phases[displayPhaseIndex];
  const PhaseIcon = currentPhase.icon;
  const hasRealProgress = progress?.current !== undefined && progress?.total !== undefined;

  return (
    <>
      {/* Backdrop with radial gradient */}
      <div
        className="fixed inset-0 z-[100]"
        style={{
          background: `radial-gradient(ellipse at center, ${colors.bg}ee 0%, #000000f5 100%)`,
          backdropFilter: 'blur(8px)',
        }}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-md overflow-hidden"
          style={{
            background: `linear-gradient(180deg, #0d1117 0%, #010409 100%)`,
            borderRadius: '16px',
            border: `1px solid ${colors.primary}40`,
            boxShadow: `
              0 0 0 1px ${colors.primary}10,
              0 4px 60px ${colors.glow},
              inset 0 1px 0 rgba(255,255,255,0.03)
            `,
          }}
        >
          {/* Animated scan lines overlay */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: scanLineCount }).map((_, i) => (
              <div
                key={i}
                className="absolute left-0 right-0 h-px opacity-[0.07]"
                style={{
                  top: `${(i / scanLineCount) * 100}%`,
                  background: colors.primary,
                  animation: `scanMove 4s linear ${i * 0.5}s infinite`,
                }}
              />
            ))}
          </div>

          {/* Decorative corner elements */}
          <svg className="absolute top-0 left-0 w-6 h-6" viewBox="0 0 24 24" fill="none">
            <path d="M2 12V2h10" stroke={colors.primary} strokeWidth="2" strokeOpacity="0.6" />
          </svg>
          <svg className="absolute top-0 right-0 w-6 h-6" viewBox="0 0 24 24" fill="none">
            <path d="M22 12V2H12" stroke={colors.primary} strokeWidth="2" strokeOpacity="0.6" />
          </svg>
          <svg className="absolute bottom-0 left-0 w-6 h-6" viewBox="0 0 24 24" fill="none">
            <path d="M2 12v10h10" stroke={colors.primary} strokeWidth="2" strokeOpacity="0.4" />
          </svg>
          <svg className="absolute bottom-0 right-0 w-6 h-6" viewBox="0 0 24 24" fill="none">
            <path d="M22 12v10H12" stroke={colors.primary} strokeWidth="2" strokeOpacity="0.4" />
          </svg>

          {/* Header */}
          <div className="relative px-5 pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Platform indicator with pulse/check */}
                <div className="relative">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300"
                    style={{ background: isCompleting ? '#10b98130' : `${colors.primary}18` }}
                  >
                    {isCompleting ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Activity className="w-5 h-5" style={{ color: colors.primary }} />
                    )}
                  </div>
                  {!isCompleting && (
                    <div
                      className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full animate-pulse"
                      style={{
                        background: colors.primary,
                        boxShadow: `0 0 12px ${colors.glow}`,
                      }}
                    />
                  )}
                </div>
                <div>
                  <h3
                    className="text-base font-semibold tracking-wide transition-colors duration-300"
                    style={{
                      color: isCompleting ? '#10b981' : colors.primary,
                      textShadow: isCompleting ? '0 0 20px rgba(16, 185, 129, 0.5)' : `0 0 20px ${colors.glow}`,
                    }}
                  >
                    {isCompleting ? 'Sync Complete!' : `${PLATFORM_NAMES[platform]} Sync`}
                  </h3>
                  <p className="text-[11px] text-gray-500 font-mono tracking-wider uppercase">
                    {isCompleting ? 'Finished' : hasRealProgress ? 'Live Progress' : 'Processing'}
                  </p>
                </div>
              </div>

              {/* Elapsed time - prominent display */}
              <div className="text-right">
                <div className="flex items-center gap-1.5 justify-end text-gray-400">
                  <Clock className="w-3 h-3" />
                  <span className="text-[10px] uppercase tracking-wider">Elapsed</span>
                </div>
                <div
                  className="text-xl font-mono font-bold tabular-nums"
                  style={{ color: '#fff' }}
                >
                  {formatTime(elapsedTime)}
                </div>
              </div>
            </div>
          </div>

          {/* Progress section */}
          <div className="px-5 pb-4 space-y-4">
            {/* Main progress bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
                  {hasRealProgress
                    ? `${progress?.current?.toLocaleString()} / ${progress?.total?.toLocaleString()} items`
                    : 'Syncing library...'
                  }
                </span>
                <span
                  className="text-sm font-mono font-bold tabular-nums"
                  style={{ color: colors.primary }}
                >
                  {displayProgress.toFixed(0)}%
                </span>
              </div>

              {/* Progress bar with glow */}
              <div
                className="relative h-2 rounded-full overflow-hidden"
                style={{
                  background: '#1a1f2e',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)',
                }}
              >
                {/* Animated background pattern */}
                <div
                  className="absolute inset-0 opacity-30"
                  style={{
                    backgroundImage: `repeating-linear-gradient(
                      90deg,
                      transparent,
                      transparent 8px,
                      ${colors.primary}20 8px,
                      ${colors.primary}20 16px
                    )`,
                    animation: 'slidePattern 0.8s linear infinite',
                  }}
                />

                {/* Progress fill */}
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-300 ease-out"
                  style={{
                    width: `${displayProgress}%`,
                    background: `linear-gradient(90deg, ${colors.secondary}, ${colors.primary})`,
                    boxShadow: `0 0 20px ${colors.glow}`,
                  }}
                >
                  {/* Shine effect */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.25) 0%, transparent 60%)',
                    }}
                  />
                </div>

                {/* Progress head glow */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full transition-all duration-300"
                  style={{
                    left: `calc(${displayProgress}% - 8px)`,
                    background: colors.primary,
                    boxShadow: `0 0 16px ${colors.glow}, 0 0 32px ${colors.glow}`,
                    opacity: 0.8,
                  }}
                />
              </div>
            </div>

            {/* Activity waveform visualization */}
            <div
              className="relative h-12 rounded-lg overflow-hidden"
              style={{
                background: '#0a0d12',
                border: '1px solid #1a1f2e',
              }}
            >
              {/* Waveform */}
              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id={`waveGrad-${platform}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={colors.primary} stopOpacity="0.5" />
                    <stop offset="100%" stopColor={colors.primary} stopOpacity="0" />
                  </linearGradient>
                </defs>
                {waveformData.length > 1 && (
                  <>
                    <path
                      d={`
                        M 0 48
                        ${waveformData.map((y, i) => `L ${(i / (waveformData.length - 1)) * 100} ${48 - (y * 0.4)}`).join(' ')}
                        L 100 48 Z
                      `}
                      fill={`url(#waveGrad-${platform})`}
                      vectorEffect="non-scaling-stroke"
                    />
                    <path
                      d={waveformData.map((y, i) =>
                        `${i === 0 ? 'M' : 'L'} ${(i / (waveformData.length - 1)) * 100} ${48 - (y * 0.4)}`
                      ).join(' ')}
                      fill="none"
                      stroke={colors.primary}
                      strokeWidth="1.5"
                      vectorEffect="non-scaling-stroke"
                      style={{ filter: `drop-shadow(0 0 4px ${colors.glow})` }}
                    />
                  </>
                )}
              </svg>

              {/* Rate indicator */}
              {processingRate > 0 && (
                <div className="absolute top-1 right-2 flex items-center gap-1 text-[9px] font-mono text-gray-500">
                  <Gauge className="w-3 h-3" style={{ color: colors.primary }} />
                  {processingRate.toFixed(1)}/s
                </div>
              )}

              <div className="absolute bottom-1 left-2 text-[9px] font-mono text-gray-600 uppercase tracking-widest">
                Activity
              </div>
            </div>

            {/* Current phase indicator */}
            <div
              className="flex items-center gap-3 p-3 rounded-lg"
              style={{
                background: `${colors.primary}08`,
                border: `1px solid ${colors.primary}20`,
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${colors.primary}15` }}
              >
                <div style={{ color: colors.primary }}>
                  <PhaseIcon className="w-4 h-4" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {progress?.message || currentPhase.label}
                </p>
                <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">
                  Phase {displayPhaseIndex + 1} of {phases.length}
                </p>
              </div>

              {/* Phase dots */}
              <div className="flex items-center gap-1">
                {phases.map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                    style={{
                      background: i <= displayPhaseIndex ? colors.primary : '#2a2f3e',
                      boxShadow: i <= displayPhaseIndex ? `0 0 6px ${colors.glow}` : 'none',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Time estimates row */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-4">
                {estimatedRemaining !== null && !isCompleting && (
                  <div className="text-center">
                    <div className="text-[9px] text-gray-500 uppercase tracking-wider mb-0.5">
                      Est. Remaining
                    </div>
                    <div className="text-sm font-mono font-semibold text-gray-300">
                      ~{formatTime(estimatedRemaining)}
                    </div>
                  </div>
                )}
              </div>

              {/* Status indicator */}
              <div className="flex items-center gap-2">
                <div
                  className="w-1.5 h-1.5 rounded-full transition-colors duration-300"
                  style={{
                    background: isCompleting ? '#10b981' : colors.primary,
                    boxShadow: isCompleting ? '0 0 8px rgba(16, 185, 129, 0.5)' : `0 0 8px ${colors.glow}`,
                    animation: isCompleting ? 'none' : 'pulse 1.5s ease-in-out infinite',
                  }}
                />
                <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">
                  {isCompleting ? 'Complete' : 'Syncing'}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            className="px-5 py-3 border-t flex items-center justify-center transition-colors duration-300"
            style={{
              borderColor: isCompleting ? 'rgba(16, 185, 129, 0.15)' : `${colors.primary}15`,
              background: 'rgba(0,0,0,0.3)',
            }}
          >
            <p className="text-[10px] text-gray-600 text-center">
              {isCompleting
                ? `Your ${PLATFORM_NAMES[platform]} library has been synced`
                : `Please wait while we sync your ${PLATFORM_NAMES[platform]} library`
              }
            </p>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes scanMove {
          0% { opacity: 0.07; transform: translateY(0); }
          50% { opacity: 0.12; }
          100% { opacity: 0.07; transform: translateY(100vh); }
        }

        @keyframes slidePattern {
          0% { transform: translateX(0); }
          100% { transform: translateX(16px); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
      `}</style>
    </>
  );
}
