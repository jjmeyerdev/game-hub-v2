'use client';

import { Clock, Zap, TrendingUp, Radio, Activity } from 'lucide-react';
import type { GameSession } from '@/lib/types/steam';

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function formatDurationLarge(minutes: number): { value: string; unit: string } {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) return { value: `${hours}:${mins.toString().padStart(2, '0')}`, unit: 'HRS' };
  return { value: mins.toString(), unit: 'MIN' };
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
    <div className="relative overflow-hidden rounded-xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/50 via-abyss to-void">
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: `
          linear-gradient(rgba(16, 185, 129, 0.8) 1px, transparent 1px),
          linear-gradient(90deg, rgba(16, 185, 129, 0.8) 1px, transparent 1px)
        `,
        backgroundSize: '20px 20px'
      }} />

      {/* Pulsing wave effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -inset-[100%] animate-mission-pulse opacity-30">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] aspect-square rounded-full border border-emerald-500/30" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] aspect-square rounded-full border border-emerald-500/20" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100%] aspect-square rounded-full border border-emerald-500/10" />
        </div>
      </div>

      {/* Scan line effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-full h-[2px] bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent animate-mission-scan" />
      </div>

      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-8 h-8">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-emerald-500" />
        <div className="absolute top-0 left-0 h-full w-[2px] bg-emerald-500" />
      </div>
      <div className="absolute top-0 right-0 w-8 h-8">
        <div className="absolute top-0 right-0 w-full h-[2px] bg-emerald-500" />
        <div className="absolute top-0 right-0 h-full w-[2px] bg-emerald-500" />
      </div>
      <div className="absolute bottom-0 left-0 w-8 h-8">
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-emerald-500" />
        <div className="absolute bottom-0 left-0 h-full w-[2px] bg-emerald-500" />
      </div>
      <div className="absolute bottom-0 right-0 w-8 h-8">
        <div className="absolute bottom-0 right-0 w-full h-[2px] bg-emerald-500" />
        <div className="absolute bottom-0 right-0 h-full w-[2px] bg-emerald-500" />
      </div>

      <div className="relative p-6">
        {/* Header row */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Radio className="w-5 h-5 text-emerald-400" />
              <div className="absolute inset-0 animate-ping">
                <Radio className="w-5 h-5 text-emerald-400 opacity-40" />
              </div>
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-[0.3em] text-emerald-400 block">
                MISSION ACTIVE
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/40 rounded">
            <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-xs font-bold tracking-wider text-emerald-400">LIVE</span>
          </div>
        </div>

        {/* Game title - large and prominent */}
        <div className="mb-6">
          <h3
            className="text-2xl md:text-3xl font-black uppercase text-white tracking-wide"
            style={{ fontFamily: 'var(--font-rajdhani)' }}
          >
            {activeSession.game?.title || 'Unknown Game'}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <div className="h-px flex-1 bg-gradient-to-r from-emerald-500/50 to-transparent" />
            <span className="text-[10px] text-emerald-500/60 tracking-wider">ID: {activeSession.id?.slice(0, 8) || 'N/A'}</span>
          </div>
        </div>

        {/* Stats in a horizontal layout */}
        <div className="grid grid-cols-3 gap-6">
          {/* Session Duration - Primary */}
          <div className="relative">
            <div className="absolute -left-3 top-0 bottom-0 w-[2px] bg-gradient-to-b from-emerald-500 via-emerald-500/50 to-transparent" />
            <div className="flex items-center gap-1.5 mb-2">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] font-bold tracking-[0.2em] text-gray-500">SESSION</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span
                className="text-4xl font-black text-emerald-400 tabular-nums"
                style={{ fontFamily: 'var(--font-rajdhani)' }}
              >
                {sessionTime.value}
              </span>
              <span className="text-xs font-bold text-emerald-500/60">{sessionTime.unit}</span>
            </div>
          </div>

          {/* Start Time */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] font-bold tracking-[0.2em] text-gray-500">STARTED</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span
                className="text-2xl font-black text-cyan-400"
                style={{ fontFamily: 'var(--font-rajdhani)' }}
              >
                {formatTime(activeSession.started_at)}
              </span>
            </div>
          </div>

          {/* Today's Total */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-[10px] font-bold tracking-[0.2em] text-gray-500">TODAY</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span
                className="text-4xl font-black text-purple-400 tabular-nums"
                style={{ fontFamily: 'var(--font-rajdhani)' }}
              >
                {todayTime.value}
              </span>
              <span className="text-xs font-bold text-purple-500/60">{todayTime.unit}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom status bar */}
      <div className="relative h-1 bg-void/50 overflow-hidden">
        <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-500 animate-shimmer" style={{ width: '60%', backgroundSize: '200% 100%' }} />
      </div>
    </div>
  );
}
