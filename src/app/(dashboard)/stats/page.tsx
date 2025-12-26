import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  TrendingUp,
  Clock,
  Trophy,
  Gamepad2,
  Calendar,
  PieChart,
  BarChart3,
  Flame,
  Target,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getStatsData } from '@/lib/actions/stats';
import { getDisplayPlatform } from '@/lib/constants/platforms';
import {
  ChartWrapper,
  ActivityHeatmap,
  PlaytimeChart,
  PlatformBreakdown,
  StatusDistribution,
} from '@/components/stats';

export default async function StatsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const stats = await getStatsData();

  // Empty state - no games yet
  if (!stats || stats.totalGames === 0) {
    return (
      <div className="min-h-screen bg-theme-primary relative">
        {/* Ambient glow */}
        <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/3 rounded-full blur-[120px] pointer-events-none animate-breathe" />
        <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-violet-500/2 rounded-full blur-[100px] pointer-events-none animate-breathe" style={{ animationDelay: '2s' }} />

        <div className="relative max-w-4xl mx-auto px-6 py-16">
          <div className="relative bg-theme-secondary border border-theme rounded-2xl p-12 text-center overflow-hidden">
            {/* HUD corners */}
            <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-cyan-400/30" />
            <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-cyan-400/30" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-cyan-400/30" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-cyan-400/30" />

            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto mb-6">
              <BarChart3 className="w-8 h-8 text-cyan-400" />
            </div>

            <h1 className="text-3xl font-bold text-theme-primary mb-3 font-family-display">
              NO STATS YET
            </h1>
            <p className="text-theme-muted mb-8 max-w-md mx-auto">
              Connect your gaming platforms and sync your library to see detailed statistics about your gaming habits.
            </p>

            <div className="flex items-center justify-center gap-4">
              <Link
                href="/settings"
                className="px-6 py-3 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-xl font-semibold hover:bg-cyan-500/20 transition-colors"
              >
                Connect Platforms
              </Link>
              <Link
                href="/library"
                className="px-6 py-3 bg-theme-hover border border-theme text-theme-muted rounded-xl font-semibold hover:border-theme-hover transition-colors"
              >
                View Library
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-primary relative">
      {/* Ambient glow orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] bg-cyan-500/3 rounded-full blur-[120px] animate-breathe" />
        <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] bg-violet-500/3 rounded-full blur-[120px] animate-breathe" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-10">
        {/* Page Header */}
        <header className="mb-10">
          <div className="flex items-center gap-4 mb-2">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-cyan-400" />
              </div>
              {/* HUD corners */}
              <div className="absolute -top-1 -left-1 w-2 h-2 border-l-2 border-t-2 border-cyan-400/50" />
              <div className="absolute -top-1 -right-1 w-2 h-2 border-r-2 border-t-2 border-cyan-400/50" />
              <div className="absolute -bottom-1 -left-1 w-2 h-2 border-l-2 border-b-2 border-cyan-400/50" />
              <div className="absolute -bottom-1 -right-1 w-2 h-2 border-r-2 border-b-2 border-cyan-400/50" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-theme-subtle uppercase tracking-wider block">
                // GAMING_ANALYTICS
              </span>
              <h1 className="text-3xl font-bold text-theme-primary font-family-display tracking-tight">
                STATISTICS
              </h1>
            </div>
          </div>
        </header>

        {/* Hero Stats Grid */}
        <section className="mb-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Playtime */}
            <HeroStatCard
              icon={Clock}
              value={`${Math.round(stats.totalPlaytimeHours)}h`}
              label="Total Playtime"
              sublabel={`~${Math.round(stats.totalPlaytimeHours / 24)} days`}
              color="cyan"
            />

            {/* Total Games */}
            <HeroStatCard
              icon={Gamepad2}
              value={stats.totalGames.toString()}
              label="Games"
              sublabel={`${stats.completedGames} completed`}
              color="violet"
            />

            {/* Achievements */}
            <HeroStatCard
              icon={Trophy}
              value={stats.totalAchievementsEarned.toString()}
              label="Achievements"
              sublabel={`${stats.achievementCompletionRate}% unlocked`}
              color="amber"
            />

            {/* Current Streak */}
            <HeroStatCard
              icon={Flame}
              value={`${stats.currentStreak}d`}
              label="Current Streak"
              sublabel={`Best: ${stats.longestStreak} days`}
              color="emerald"
            />
          </div>
        </section>

        {/* Activity Heatmap Section */}
        <section className="mb-8">
          <ChartWrapper
            title="Gaming Activity"
            subtitle="ACTIVITY_HEATMAP"
            icon={Calendar}
            color="cyan"
          >
            <ActivityHeatmap
              data={stats.dailyActivity}
              currentStreak={stats.currentStreak}
              longestStreak={stats.longestStreak}
            />
          </ChartWrapper>
        </section>

        {/* Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Playtime Trends */}
          <ChartWrapper
            title="Playtime Trends"
            subtitle="WEEKLY_ANALYTICS"
            icon={TrendingUp}
            color="cyan"
          >
            <PlaytimeChart weeklyData={stats.weeklyPlaytime} />
          </ChartWrapper>

          {/* Platform Breakdown */}
          <ChartWrapper
            title="Platform Breakdown"
            subtitle="PLATFORM_DISTRIBUTION"
            icon={PieChart}
            color="violet"
          >
            <PlatformBreakdown data={stats.playtimeByPlatform} />
          </ChartWrapper>
        </div>

        {/* Status Distribution */}
        <section className="mb-8">
          <ChartWrapper
            title="Library Status"
            subtitle="COMPLETION_PROGRESS"
            icon={Target}
            color="emerald"
          >
            <StatusDistribution data={stats.statusDistribution} />
          </ChartWrapper>
        </section>

        {/* Most Played Games */}
        {stats.mostPlayedGames.length > 0 && (
          <section className="mb-8">
            <ChartWrapper
              title="Most Played"
              subtitle="TOP_GAMES"
              icon={Zap}
              color="amber"
            >
              <div className="space-y-3">
                {stats.mostPlayedGames.slice(0, 5).map((game, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-3 bg-theme-hover rounded-lg border border-theme hover:border-theme-hover transition-colors"
                  >
                    {/* Rank */}
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-amber-400">#{index + 1}</span>
                    </div>

                    {/* Cover */}
                    {game.coverUrl ? (
                      <img
                        src={game.coverUrl}
                        alt={game.gameTitle}
                        className="w-10 h-10 rounded-lg object-cover border border-theme"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-theme-secondary border border-theme flex items-center justify-center">
                        <Gamepad2 className="w-5 h-5 text-theme-muted" />
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-theme-primary truncate">
                        {game.gameTitle}
                      </h4>
                      <p className="text-[11px] text-theme-subtle">{getDisplayPlatform(game.platform)}</p>
                    </div>

                    {/* Playtime */}
                    <div className="text-right">
                      <div className="text-sm font-semibold text-cyan-400">{game.playtimeHours}h</div>
                      {game.lastPlayed && (
                        <div className="text-[10px] text-theme-subtle">
                          {new Date(game.lastPlayed).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {stats.mostPlayedGames.length > 5 && (
                  <Link
                    href="/library?sort=playtime"
                    className="flex items-center justify-center gap-2 p-3 text-sm text-theme-muted hover:text-cyan-400 transition-colors"
                  >
                    View all games
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </ChartWrapper>
          </section>
        )}

        {/* Quick Stats Footer */}
        <footer className="mt-12 pt-6 border-t border-theme">
          <div className="flex items-center justify-between text-[11px] font-mono text-theme-subtle">
            <div className="flex items-center gap-4">
              <span>Avg Session: {stats.averageSessionMinutes}min</span>
              <span className="text-theme-subtle/30">|</span>
              <span>Completion Rate: {stats.completionRate}%</span>
            </div>
            <span>Data from {stats.playtimeByPlatform.length} platforms</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

// Hero Stat Card Component
interface HeroStatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  label: string;
  sublabel: string;
  color: 'cyan' | 'violet' | 'amber' | 'emerald';
}

function HeroStatCard({ icon: Icon, value, label, sublabel, color }: HeroStatCardProps) {
  const colorConfig = {
    cyan: {
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20',
      text: 'text-cyan-400',
      corner: 'border-cyan-400/30',
    },
    violet: {
      bg: 'bg-violet-500/10',
      border: 'border-violet-500/20',
      text: 'text-violet-400',
      corner: 'border-violet-400/30',
    },
    amber: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      text: 'text-amber-400',
      corner: 'border-amber-400/30',
    },
    emerald: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      text: 'text-emerald-400',
      corner: 'border-emerald-400/30',
    },
  };

  const colors = colorConfig[color];

  return (
    <div className={`relative ${colors.bg} border ${colors.border} rounded-xl p-5 overflow-hidden`}>
      {/* HUD corners */}
      <div className={`absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 ${colors.corner}`} />
      <div className={`absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 ${colors.corner}`} />
      <div className={`absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 ${colors.corner}`} />
      <div className={`absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 ${colors.corner}`} />

      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${colors.bg} border ${colors.border}`}>
          <Icon className={`w-4 h-4 ${colors.text}`} />
        </div>
      </div>

      <div className={`text-3xl font-bold ${colors.text} mb-1 font-family-display tracking-tight`}>
        {value}
      </div>
      <div className="text-sm font-medium text-theme-primary mb-0.5">{label}</div>
      <div className="text-[11px] text-theme-subtle">{sublabel}</div>
    </div>
  );
}
