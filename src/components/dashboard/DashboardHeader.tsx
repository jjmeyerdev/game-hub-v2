'use client';

import { useEffect, useState } from 'react';

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
      setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
      setCurrentDate(now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="border-b border-theme bg-theme-secondary/60 backdrop-blur-xl sticky top-0 z-30">
      <div className="relative px-6 lg:px-8 py-6">
        {/* Main layout - greeting left, time/date right */}
        <div className="flex items-end justify-between gap-6">
          {/* Left: Greeting & Name */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono text-theme-muted uppercase tracking-[0.15em]">
                {greeting}
              </span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-theme-primary tracking-tight font-family-display truncate">
              {userName}
            </h1>
          </div>

          {/* Right: Date & Time */}
          <div className="shrink-0 hidden sm:flex flex-col items-end gap-1">
            {/* Date */}
            <span className="text-xs font-mono text-theme-muted uppercase tracking-wider">
              {currentDate}
            </span>

            {/* Time */}
            <span className="text-2xl lg:text-3xl font-bold text-cyan-400 tabular-nums tracking-wide font-family-display">
              {currentTime}
            </span>
          </div>

          {/* Mobile: Time only */}
          <div className="shrink-0 sm:hidden">
            <span className="text-2xl font-bold text-cyan-400 tabular-nums tracking-wide font-family-display">
              {currentTime}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
