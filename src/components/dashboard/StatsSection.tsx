import { Library, Clock, Trophy, Target } from 'lucide-react';
import { StatCard } from './cards/StatCard';

interface Stats {
  totalGames: number;
  hoursPlayed: number;
  achievements: number;
  completionRate: number;
}

interface StatsSectionProps {
  stats: Stats;
}

export function StatsSection({ stats }: StatsSectionProps) {
  return (
    <section className="relative">
      {/* Section header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
          <Target className="w-3.5 h-3.5 text-cyan-400" />
        </div>
        <span className="text-[10px] font-mono text-theme-muted uppercase tracking-wider">
          // STATS_OVERVIEW
        </span>
        <div className="flex-1 h-px bg-linear-to-r from-border to-transparent" />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Games"
          value={stats.totalGames.toString()}
          icon={Library}
          change=""
          color="cyan"
          delay={0}
        />
        <StatCard
          label="Hours Played"
          value={stats.hoursPlayed.toLocaleString()}
          icon={Clock}
          change=""
          color="purple"
          delay={100}
        />
        <StatCard
          label="Achievements"
          value={stats.achievements.toString()}
          icon={Trophy}
          change=""
          color="amber"
          delay={200}
        />
        <StatCard
          label="Completion"
          value={`${stats.completionRate}%`}
          icon={Target}
          change=""
          color="emerald"
          delay={300}
        />
      </div>
    </section>
  );
}
