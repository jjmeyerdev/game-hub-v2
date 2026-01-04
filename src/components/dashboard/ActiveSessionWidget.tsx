'use client';

import { Clock, Zap, TrendingUp, Radio } from 'lucide-react';
import type { GameSession } from '@/lib/types/steam';

function formatDurationLarge(minutes: number): { value: string; unit: string } {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) return { value: `${hours}:${mins.toString().padStart(2, '0')}`, unit: 'hrs' };
  return { value: mins.toString(), unit: 'min' };
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function ActiveSessionWidget({
  activeSession,
  sessionDuration,
  todayPlaytime,
}: {
  activeSession: GameSession | null;
  sessionDuration: number;
  todayPlaytime: number;
}) {
  if (!activeSession) return null;

  const sessionTime = formatDurationLarge(sessionDuration);
  const todayTime = formatDurationLarge(todayPlaytime);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-theme-secondary">
      {/* HUD corners */}
      <div className="absolute top-0 left-0 w-5 h-5 border-l-2 border-t-2 border-emerald-400/50 z-10" />
      <div className="absolute top-0 right-0 w-5 h-5 border-r-2 border-t-2 border-emerald-400/50 z-10" />
      <div className="absolute bottom-0 left-0 w-5 h-5 border-l-2 border-b-2 border-emerald-400/50 z-10" />
      <div className="absolute bottom-0 right-0 w-5 h-5 border-r-2 border-b-2 border-emerald-400/50 z-10" />

      {/* Subtle glow */}
      <div className="absolute inset-0 bg-linear-to-br from-emerald-500/5 to-transparent pointer-events-none" />

      <div className="relative p-6">
        {/* Header row */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-2 h-2 bg-emerald-400 rounded-full" />
              <div className="absolute inset-0 w-2 h-2 bg-emerald-400 rounded-full animate-ping opacity-75" />
            </div>
            <span className="text-[10px] font-mono font-medium text-emerald-400 uppercase tracking-wider">
              // ACTIVE_SESSION
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-[10px] font-mono font-medium tracking-wider text-emerald-400">LIVE</span>
          </div>
        </div>

        {/* Game title */}
        <h3 className="text-2xl font-bold text-theme-primary mb-6 font-family-display uppercase">
          {activeSession.game?.title || 'Unknown Game'}
        </h3>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-6">
          {/* Session Duration */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] font-mono font-medium text-theme-subtle uppercase tracking-wider">Session</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold font-mono text-emerald-400 tabular-nums">
                {sessionTime.value}
              </span>
              <span className="text-xs font-mono text-emerald-400/60">{sessionTime.unit}</span>
            </div>
          </div>

          {/* Start Time */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] font-mono font-medium text-theme-subtle uppercase tracking-wider">Started</span>
            </div>
            <div className="flex items-baseline">
              <span className="text-xl font-semibold font-mono text-theme-muted">
                {formatTime(activeSession.started_at)}
              </span>
            </div>
          </div>

          {/* Today's Total */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-[10px] font-mono font-medium text-theme-subtle uppercase tracking-wider">Today</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold font-mono text-violet-400 tabular-nums">
                {todayTime.value}
              </span>
              <span className="text-xs font-mono text-violet-400/60">{todayTime.unit}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom progress bar */}
      <div className="h-0.5 bg-border">
        <div className="h-full w-1/2 bg-linear-to-r from-emerald-500 to-cyan-500 animate-pulse" />
      </div>
    </div>
  );
}
