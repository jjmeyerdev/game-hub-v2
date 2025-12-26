'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { StatusDistribution as StatusDistributionType } from '@/lib/actions/stats';

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

interface StatusDistributionProps {
  data: StatusDistributionType[];
}

const STATUS_COLORS: Record<string, string> = {
  Completed: '#34d399',
  Finished: '#34d399',
  Playing: '#22d3ee',
  'In Progress': '#22d3ee',
  'On Hold': '#fbbf24',
  Backlog: '#a855f7',
  Unplayed: '#6b7280',
};

const DEFAULT_COLOR = '#6b7280';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: StatusDistributionType }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-theme-secondary border border-theme rounded-lg px-3 py-2 shadow-xl">
      <div className="text-xs font-semibold text-theme-primary mb-1">{data.status}</div>
      <div className="space-y-0.5">
        <div className="text-[11px] text-theme-muted">
          <span className="text-cyan-400 font-medium">{data.count}</span> games
        </div>
        <div className="text-[11px] text-theme-muted">
          <span className="text-violet-400 font-medium">{data.percentage}%</span> of library
        </div>
      </div>
    </div>
  );
}

export function StatusDistribution({ data }: StatusDistributionProps) {
  const isDark = useIsDarkMode();
  const chartData = data.map(d => ({
    ...d,
    color: STATUS_COLORS[d.status] || DEFAULT_COLOR,
  }));

  const totalGames = data.reduce((sum, d) => sum + d.count, 0);

  // Theme-aware colors
  const tickColorLight = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.5)';
  const tickColorDark = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)';
  const cursorColor = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.04)';

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-theme-hover rounded-lg border border-theme">
          <div className="text-lg font-bold text-theme-primary font-family-display">{totalGames}</div>
          <div className="text-[10px] text-theme-subtle uppercase tracking-wider">Total Games</div>
        </div>
        <div className="p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/20">
          <div className="text-lg font-bold text-emerald-400 font-family-display">
            {data.find(d => d.status === 'Completed' || d.status === 'Finished')?.count || 0}
          </div>
          <div className="text-[10px] text-theme-subtle uppercase tracking-wider">Completed</div>
        </div>
        <div className="p-3 bg-cyan-500/5 rounded-lg border border-cyan-500/20">
          <div className="text-lg font-bold text-cyan-400 font-family-display">
            {data.find(d => d.status === 'Playing' || d.status === 'In Progress')?.count || 0}
          </div>
          <div className="text-[10px] text-theme-subtle uppercase tracking-wider">In Progress</div>
        </div>
      </div>

      {/* Horizontal Bar Chart */}
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
          >
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{ fill: tickColorLight, fontSize: 10 }}
            />
            <YAxis
              type="category"
              dataKey="status"
              axisLine={false}
              tickLine={false}
              tick={{ fill: tickColorDark, fontSize: 11 }}
              width={80}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: cursorColor }} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={24}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Progress Bar Summary */}
      <div className="space-y-1">
        <div className="flex h-2 rounded-full overflow-hidden bg-theme-hover">
          {chartData.map((item, index) => (
            <div
              key={index}
              className="h-full transition-all"
              style={{
                width: `${item.percentage}%`,
                backgroundColor: item.color,
              }}
            />
          ))}
        </div>
        <div className="flex justify-between text-[9px] text-theme-subtle">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
}
