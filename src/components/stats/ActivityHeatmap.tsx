'use client';

import { useMemo, useState } from 'react';
import type { DailyActivity } from '@/lib/actions/stats';

interface ActivityHeatmapProps {
  data: DailyActivity[];
  currentStreak: number;
  longestStreak: number;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getIntensityClass(minutes: number): string {
  if (minutes === 0) return 'bg-theme-hover';
  if (minutes < 30) return 'bg-cyan-500/20';
  if (minutes < 60) return 'bg-cyan-500/40';
  if (minutes < 120) return 'bg-cyan-500/60';
  return 'bg-cyan-500/80';
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function ActivityHeatmap({ data, currentStreak, longestStreak }: ActivityHeatmapProps) {
  const [hoveredDay, setHoveredDay] = useState<{ date: string; minutes: number; x: number; y: number } | null>(null);

  // Build 52-week grid
  const { weeks, monthLabels } = useMemo(() => {
    const activityMap = new Map(data.map(d => [d.date, d.totalMinutes]));
    const weeks: Array<Array<{ date: string; minutes: number; dayOfWeek: number }>> = [];
    const monthLabels: Array<{ month: string; weekIndex: number }> = [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Start from 52 weeks ago, aligned to Sunday
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 364 - today.getDay());

    let currentWeek: Array<{ date: string; minutes: number; dayOfWeek: number }> = [];
    let lastMonth = -1;

    for (let i = 0; i <= 371; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      if (date > today) break;

      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay();
      const month = date.getMonth();

      // Track month changes for labels
      if (month !== lastMonth && dayOfWeek === 0) {
        monthLabels.push({ month: MONTHS[month], weekIndex: weeks.length });
        lastMonth = month;
      }

      currentWeek.push({
        date: dateStr,
        minutes: activityMap.get(dateStr) || 0,
        dayOfWeek,
      });

      if (dayOfWeek === 6) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return { weeks, monthLabels };
  }, [data]);

  return (
    <div className="space-y-4">
      {/* Streak Stats */}
      <div className="flex items-center gap-6 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs text-theme-muted">
            Current: <span className="text-cyan-400 font-semibold">{currentStreak} days</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-xs text-theme-muted">
            Longest: <span className="text-emerald-400 font-semibold">{longestStreak} days</span>
          </span>
        </div>
      </div>

      {/* Month Labels */}
      <div className="flex ml-8">
        {monthLabels.map((label, i) => (
          <div
            key={i}
            className="text-[10px] font-mono text-theme-subtle"
            style={{
              position: 'absolute',
              left: `${32 + label.weekIndex * 14}px`,
            }}
          >
            {label.month}
          </div>
        ))}
      </div>

      {/* Heatmap Grid */}
      <div className="relative flex gap-0.5 mt-6">
        {/* Day Labels */}
        <div className="flex flex-col gap-0.5 mr-1">
          {DAYS.map((day, i) => (
            <div
              key={day}
              className="h-[10px] text-[9px] font-mono text-theme-subtle flex items-center"
              style={{ visibility: i % 2 === 1 ? 'visible' : 'hidden' }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Weeks */}
        <div className="flex gap-0.5 overflow-x-auto pb-2">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-0.5">
              {week.map((day) => (
                <div
                  key={day.date}
                  className={`w-[10px] h-[10px] rounded-sm ${getIntensityClass(day.minutes)} cursor-pointer transition-all hover:ring-1 hover:ring-cyan-400/50`}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setHoveredDay({
                      date: day.date,
                      minutes: day.minutes,
                      x: rect.left + rect.width / 2,
                      y: rect.top,
                    });
                  }}
                  onMouseLeave={() => setHoveredDay(null)}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Tooltip */}
        {hoveredDay && (
          <div
            className="fixed z-50 px-3 py-2 bg-theme-secondary border border-theme rounded-lg shadow-xl pointer-events-none"
            style={{
              left: hoveredDay.x,
              top: hoveredDay.y - 50,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="text-xs font-medium text-theme-primary">
              {new Date(hoveredDay.date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </div>
            <div className="text-[10px] text-theme-muted">
              {hoveredDay.minutes > 0 ? formatDuration(hoveredDay.minutes) : 'No activity'}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-2">
        <span className="text-[10px] text-theme-subtle">Less</span>
        <div className="flex gap-0.5">
          <div className="w-[10px] h-[10px] rounded-sm bg-theme-hover" />
          <div className="w-[10px] h-[10px] rounded-sm bg-cyan-500/20" />
          <div className="w-[10px] h-[10px] rounded-sm bg-cyan-500/40" />
          <div className="w-[10px] h-[10px] rounded-sm bg-cyan-500/60" />
          <div className="w-[10px] h-[10px] rounded-sm bg-cyan-500/80" />
        </div>
        <span className="text-[10px] text-theme-subtle">More</span>
      </div>
    </div>
  );
}
