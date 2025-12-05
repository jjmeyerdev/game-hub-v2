'use client';

import { Clock, Zap, TrendingUp } from 'lucide-react';
import type { GameSession } from '@/lib/types/steam';

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
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

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-transparent backdrop-blur-xl p-6">
      {/* Pulsing indicator */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
        <span className="text-xs uppercase tracking-[0.2em] text-emerald-400 font-bold">
          Live Session
        </span>
      </div>

      <div className="space-y-4">
        {/* Game title */}
        <h3 className="text-xl font-black uppercase text-white pr-32">
          {activeSession.game?.title || 'Unknown Game'}
        </h3>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span className="text-xs uppercase tracking-wide text-gray-400">Session</span>
            </div>
            <p className="text-2xl font-black text-emerald-400 tabular-nums">
              {formatDuration(sessionDuration)}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span className="text-xs uppercase tracking-wide text-gray-400">Started</span>
            </div>
            <p className="text-sm font-bold text-white">{formatTime(activeSession.started_at)}</p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <span className="text-xs uppercase tracking-wide text-gray-400">Today</span>
            </div>
            <p className="text-2xl font-black text-purple-400 tabular-nums">
              {formatDuration(todayPlaytime)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
