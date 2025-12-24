'use client';

import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';

interface DashboardHeaderProps {
  userName: string;
  greeting: string;
}

export function DashboardHeader({
  userName,
  greeting,
}: DashboardHeaderProps) {
  const [currentTime, setCurrentTime] = useState<string>('--:--');
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }));
      setCurrentDate(now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="relative border-b border-[var(--theme-border)] bg-[var(--theme-bg-secondary)]/80 backdrop-blur-xl sticky top-0 z-30">
      {/* Subtle top gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/[0.02] to-transparent pointer-events-none" />

      <div className="relative px-8 py-5">
        <div className="flex items-center justify-between">
          {/* Left: Greeting */}
          <div className="flex items-center gap-4">
            {/* Status indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-400/10 border border-emerald-400/20">
              <div className="relative">
                <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                <div className="absolute inset-0 w-2 h-2 bg-emerald-400 rounded-full animate-ping opacity-75" />
              </div>
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">Online</span>
            </div>

            {/* Divider */}
            <div className="h-8 w-px bg-gradient-to-b from-transparent via-[var(--theme-border)] to-transparent" />

            {/* Greeting */}
            <div>
              <p className="text-[10px] font-mono text-cyan-400/60 uppercase tracking-[0.2em] mb-1">
                // {greeting}
              </p>
              <h1 className="text-2xl font-bold text-[var(--theme-text-primary)] tracking-tight font-[family-name:var(--font-family-display)]">
                {userName}
              </h1>
            </div>
          </div>

          {/* Right: Date & Time */}
          <div className="flex items-center gap-4">
            {/* System status */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--theme-bg-tertiary)] border border-[var(--theme-border)]">
              <Activity className="w-3.5 h-3.5 text-cyan-400/60" />
              <span className="text-[10px] font-mono text-[var(--theme-text-muted)] uppercase tracking-wider">
                All Systems Nominal
              </span>
            </div>

            <div className="h-8 w-px bg-gradient-to-b from-transparent via-[var(--theme-border)] to-transparent hidden md:block" />

            {/* Date */}
            <div className="text-right hidden sm:block">
              <p className="text-[9px] font-mono text-[var(--theme-text-muted)] uppercase tracking-[0.2em] mb-1">Local Date</p>
              <p className="text-sm text-[var(--theme-text-secondary)] font-medium">{currentDate}</p>
            </div>

            {/* Time display */}
            <div className="relative">
              {/* HUD corners */}
              <div className="absolute -top-1 -left-1 w-2 h-2 border-l border-t border-cyan-400/30" />
              <div className="absolute -top-1 -right-1 w-2 h-2 border-r border-t border-cyan-400/30" />
              <div className="absolute -bottom-1 -left-1 w-2 h-2 border-l border-b border-cyan-400/30" />
              <div className="absolute -bottom-1 -right-1 w-2 h-2 border-r border-b border-cyan-400/30" />

              <div className="px-5 py-3 bg-[var(--theme-bg-tertiary)] border border-[var(--theme-border)] rounded-xl">
                <span className="text-2xl font-bold text-cyan-400 tabular-nums tracking-wider font-[family-name:var(--font-family-display)]">
                  {currentTime}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
