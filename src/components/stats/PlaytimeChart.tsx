'use client';

import { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { PlaytimeTrend } from '@/lib/actions/stats';

// Hook to detect dark mode
function useIsDarkMode() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const checkDark = () => setIsDark(document.documentElement.classList.contains('dark'));
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}

interface PlaytimeChartProps {
  weeklyData: PlaytimeTrend[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: PlaytimeTrend }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-theme-secondary border border-theme rounded-lg px-3 py-2 shadow-xl">
      <div className="text-xs font-semibold text-theme-primary mb-1">{label}</div>
      <div className="space-y-0.5">
        <div className="text-[11px] text-theme-muted">
          <span className="text-cyan-400 font-medium">{data.hours}h</span> playtime
        </div>
        <div className="text-[11px] text-theme-muted">
          <span className="text-violet-400 font-medium">{data.sessions}</span> sessions
        </div>
      </div>
    </div>
  );
}

export function PlaytimeChart({ weeklyData }: PlaytimeChartProps) {
  const [showSessions, setShowSessions] = useState(false);
  const isDark = useIsDarkMode();

  const maxHours = Math.max(...weeklyData.map(d => d.hours), 1);
  const maxSessions = Math.max(...weeklyData.map(d => d.sessions), 1);

  // Theme-aware colors
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';
  const tickColor = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.5)';
  const cyanColor = isDark ? '#22d3ee' : '#0891b2';
  const violetColor = isDark ? '#a855f7' : '#7c3aed';

  return (
    <div className="space-y-4">
      {/* Toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowSessions(false)}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
            !showSessions
              ? 'bg-cyan-500/20 text-accent-cyan border border-cyan-500/30'
              : 'bg-theme-hover text-theme-muted border border-theme hover:border-theme-hover'
          }`}
        >
          Hours
        </button>
        <button
          onClick={() => setShowSessions(true)}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
            showSessions
              ? 'bg-violet-500/20 text-accent-violet border border-violet-500/30'
              : 'bg-theme-hover text-theme-muted border border-theme hover:border-theme-hover'
          }`}
        >
          Sessions
        </button>
      </div>

      {/* Chart */}
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={cyanColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={cyanColor} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={violetColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={violetColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={gridColor}
              vertical={false}
            />
            <XAxis
              dataKey="period"
              axisLine={false}
              tickLine={false}
              tick={{ fill: tickColor, fontSize: 10 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: tickColor, fontSize: 10 }}
              domain={[0, showSessions ? maxSessions * 1.2 : maxHours * 1.2]}
              dx={-10}
            />
            <Tooltip content={<CustomTooltip />} />
            {!showSessions ? (
              <Area
                type="monotone"
                dataKey="hours"
                stroke={cyanColor}
                strokeWidth={2}
                fill="url(#colorHours)"
              />
            ) : (
              <Area
                type="monotone"
                dataKey="sessions"
                stroke={violetColor}
                strokeWidth={2}
                fill="url(#colorSessions)"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
