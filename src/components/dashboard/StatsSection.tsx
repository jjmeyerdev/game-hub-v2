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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Total Games" value={stats.totalGames.toString()} icon={Library} change="" color="cyan" />
      <StatCard label="Hours Played" value={stats.hoursPlayed.toLocaleString()} icon={Clock} change="" color="purple" />
      <StatCard label="Achievements" value={stats.achievements.toString()} icon={Trophy} change="" color="emerald" />
      <StatCard label="Completion" value={`${stats.completionRate}%`} icon={Target} change="" color="cyan" />
    </div>
  );
}
