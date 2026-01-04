'use client';

import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { PlatformPlaytime } from '@/lib/actions/stats';

interface PlatformBreakdownProps {
  data: PlatformPlaytime[];
}

const PLATFORM_COLORS: Record<string, string> = {
  Steam: '#1a9fff',
  PlayStation: '#003087',
  Xbox: '#107c10',
  Nintendo: '#e60012',
  'Epic Games': '#2a2a2a',
  PC: '#0078D4',
  Mobile: '#ff6b6b',
};

const DEFAULT_COLOR = '#6b7280';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: PlatformPlaytime }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-theme-secondary border border-theme rounded-lg px-3 py-2 shadow-xl">
      <div className="text-xs font-semibold text-theme-primary mb-1">{data.platform}</div>
      <div className="space-y-0.5">
        <div className="text-[11px] text-theme-muted">
          <span className="text-cyan-400 font-medium">{data.playtimeHours}h</span> playtime
        </div>
        <div className="text-[11px] text-theme-muted">
          <span className="text-violet-400 font-medium">{data.gameCount}</span> games
        </div>
        <div className="text-[11px] text-theme-muted">
          <span className="text-emerald-400 font-medium">{data.percentage}%</span> of total
        </div>
      </div>
    </div>
  );
}

export function PlatformBreakdown({ data }: PlatformBreakdownProps) {
  const [metric, setMetric] = useState<'playtime' | 'games'>('playtime');

  const chartData = data.map(d => ({
    ...d,
    value: metric === 'playtime' ? d.playtimeHours : d.gameCount,
    color: PLATFORM_COLORS[d.platform] || DEFAULT_COLOR,
  }));

  const totalValue = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="space-y-4">
      {/* Toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setMetric('playtime')}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
            metric === 'playtime'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              : 'bg-theme-hover text-theme-muted border border-theme hover:border-theme-hover'
          }`}
        >
          By Hours
        </button>
        <button
          onClick={() => setMetric('games')}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
            metric === 'games'
              ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
              : 'bg-theme-hover text-theme-muted border border-theme hover:border-theme-hover'
          }`}
        >
          By Games
        </button>
      </div>

      <div className="flex items-center gap-6">
        {/* Donut Chart */}
        <div className="relative w-[180px] h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Center Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-theme-primary font-family-display">
              {metric === 'playtime' ? `${Math.round(totalValue)}h` : totalValue}
            </span>
            <span className="text-[10px] text-theme-subtle uppercase tracking-wider">
              {metric === 'playtime' ? 'Total Hours' : 'Total Games'}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2">
          {chartData.slice(0, 5).map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-theme-muted flex-1 truncate">{item.platform}</span>
              <span className="text-xs font-medium text-theme-primary tabular-nums">
                {metric === 'playtime' ? `${item.playtimeHours}h` : item.gameCount}
              </span>
            </div>
          ))}
          {data.length > 5 && (
            <div className="text-[10px] text-theme-subtle">
              +{data.length - 5} more platforms
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
