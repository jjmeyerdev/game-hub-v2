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
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
          <h2 className="text-xs font-bold tracking-[0.25em] uppercase text-cyan-500/70">
            System Status
          </h2>
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/30 to-transparent" />
        <span className="text-[10px] font-mono text-gray-600 tracking-wider">
          REAL-TIME DATA
        </span>
      </div>

      {/* Stats grid with staggered reveal */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Arsenal"
          value={stats.totalGames.toString()}
          icon={Library}
          change=""
          color="cyan"
          delay={0}
        />
        <StatCard
          label="Time Logged"
          value={stats.hoursPlayed.toLocaleString()}
          icon={Clock}
          change=""
          color="purple"
          delay={100}
        />
        <StatCard
          label="Trophies"
          value={stats.achievements.toString()}
          icon={Trophy}
          change=""
          color="amber"
          delay={200}
        />
        <StatCard
          label="Mastery"
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
