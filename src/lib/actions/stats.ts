'use server';

import { createClient } from '@/lib/supabase/server';

// Type for Supabase query result
interface GameDetails {
  title: string;
  cover_url: string | null;
}

interface UserGameRow {
  id: string;
  platform: string | null;
  status: string | null;
  playtime_hours: number | null;
  achievements_earned: number | null;
  achievements_total: number | null;
  last_played_at: string | null;
  game: unknown;
}

// Type Definitions
export interface DailyActivity {
  date: string;
  totalMinutes: number;
  sessionCount: number;
}

export interface PlatformPlaytime {
  platform: string;
  playtimeHours: number;
  gameCount: number;
  percentage: number;
}

export interface StatusDistribution {
  status: string;
  count: number;
  percentage: number;
}

export interface PlaytimeTrend {
  period: string;
  hours: number;
  sessions: number;
}

export interface MostPlayedGame {
  gameTitle: string;
  coverUrl: string | null;
  platform: string;
  playtimeHours: number;
  lastPlayed: string | null;
}

export interface StatsData {
  // Hero Stats
  totalPlaytimeHours: number;
  totalGames: number;
  completedGames: number;
  completionRate: number;
  totalAchievementsEarned: number;
  totalAchievementsAvailable: number;
  achievementCompletionRate: number;
  averageSessionMinutes: number;

  // Activity
  currentStreak: number;
  longestStreak: number;
  dailyActivity: DailyActivity[];

  // Breakdowns
  playtimeByPlatform: PlatformPlaytime[];
  statusDistribution: StatusDistribution[];
  weeklyPlaytime: PlaytimeTrend[];

  // Top Games
  mostPlayedGames: MostPlayedGame[];
}

/**
 * Calculate gaming streak from daily activity data
 */
function calculateStreak(dailyActivity: DailyActivity[]): { current: number; longest: number } {
  if (dailyActivity.length === 0) return { current: 0, longest: 0 };

  // Sort by date descending
  const sorted = [...dailyActivity].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let lastDate: Date | null = null;

  for (const day of sorted) {
    const dayDate = new Date(day.date);
    dayDate.setHours(0, 0, 0, 0);

    if (lastDate === null) {
      // First day - check if it's today or yesterday
      const diffDays = Math.floor((today.getTime() - dayDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 1) {
        tempStreak = 1;
        currentStreak = 1;
      } else {
        tempStreak = 1;
      }
    } else {
      const diffDays = Math.floor((lastDate.getTime() - dayDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak++;
        if (currentStreak > 0) currentStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
        if (currentStreak > 0) currentStreak = 0;
      }
    }

    lastDate = dayDate;
  }

  longestStreak = Math.max(longestStreak, tempStreak);

  return { current: currentStreak, longest: longestStreak };
}

/**
 * Get weekly playtime trends for the last 12 weeks
 */
function calculateWeeklyPlaytime(dailyActivity: DailyActivity[]): PlaytimeTrend[] {
  const weeks: PlaytimeTrend[] = [];
  const now = new Date();

  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - (i * 7) - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const weekData = dailyActivity.filter(d => {
      const date = new Date(d.date);
      return date >= weekStart && date <= weekEnd;
    });

    const totalMinutes = weekData.reduce((sum, d) => sum + d.totalMinutes, 0);
    const totalSessions = weekData.reduce((sum, d) => sum + d.sessionCount, 0);

    weeks.push({
      period: `Week ${12 - i}`,
      hours: Math.round(totalMinutes / 60 * 10) / 10,
      sessions: totalSessions,
    });
  }

  return weeks;
}

/**
 * Get comprehensive stats data for the stats page
 */
export async function getStatsData(): Promise<StatsData | null> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Parallel data fetching for performance
  const [userGamesResult, dailyPlaytimeResult, sessionsCountResult] = await Promise.all([
    // Fetch all user games with game details
    supabase
      .from('user_games')
      .select(`
        id,
        platform,
        status,
        playtime_hours,
        achievements_earned,
        achievements_total,
        last_played_at,
        game:games(title, cover_url)
      `)
      .eq('user_id', user.id),

    // Fetch daily playtime summary (last 365 days)
    supabase
      .from('daily_playtime_summary')
      .select('play_date, total_minutes, session_count')
      .eq('user_id', user.id)
      .gte('play_date', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),

    // Get total session count for average calculation
    supabase
      .from('game_sessions')
      .select('duration_minutes')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .not('duration_minutes', 'is', null),
  ]);

  const userGames = (userGamesResult.data || []) as UserGameRow[];
  const dailyPlaytime = dailyPlaytimeResult.data || [];
  const sessions = sessionsCountResult.data || [];

  // Calculate Hero Stats
  const totalPlaytimeHours = userGames.reduce((sum, g) => sum + (g.playtime_hours || 0), 0);
  const totalGames = userGames.length;
  const completedGames = userGames.filter(g => g.status === 'completed' || g.status === 'finished').length;
  const completionRate = totalGames > 0 ? Math.round((completedGames / totalGames) * 100) : 0;

  const totalAchievementsEarned = userGames.reduce((sum, g) => sum + (g.achievements_earned || 0), 0);
  const totalAchievementsAvailable = userGames.reduce((sum, g) => sum + (g.achievements_total || 0), 0);
  const achievementCompletionRate = totalAchievementsAvailable > 0
    ? Math.round((totalAchievementsEarned / totalAchievementsAvailable) * 100)
    : 0;

  const totalSessionMinutes = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
  const averageSessionMinutes = sessions.length > 0
    ? Math.round(totalSessionMinutes / sessions.length)
    : 0;

  // Calculate Daily Activity for Heatmap
  const dailyActivity: DailyActivity[] = dailyPlaytime.map(d => ({
    date: d.play_date,
    totalMinutes: d.total_minutes || 0,
    sessionCount: d.session_count || 0,
  }));

  // Calculate Streaks
  const { current: currentStreak, longest: longestStreak } = calculateStreak(dailyActivity);

  // Calculate Playtime by Platform
  const platformMap = new Map<string, { hours: number; count: number }>();
  for (const game of userGames) {
    const platform = game.platform || 'Unknown';
    const existing = platformMap.get(platform) || { hours: 0, count: 0 };
    existing.hours += game.playtime_hours || 0;
    existing.count += 1;
    platformMap.set(platform, existing);
  }

  const totalHours = Array.from(platformMap.values()).reduce((sum, p) => sum + p.hours, 0);
  const playtimeByPlatform: PlatformPlaytime[] = Array.from(platformMap.entries())
    .map(([platform, data]) => ({
      platform,
      playtimeHours: Math.round(data.hours * 10) / 10,
      gameCount: data.count,
      percentage: totalHours > 0 ? Math.round((data.hours / totalHours) * 100) : 0,
    }))
    .sort((a, b) => b.playtimeHours - a.playtimeHours);

  // Calculate Status Distribution
  const statusMap = new Map<string, number>();
  const statusLabels: Record<string, string> = {
    unplayed: 'Unplayed',
    playing: 'Playing',
    in_progress: 'In Progress',
    on_hold: 'On Hold',
    completed: 'Completed',
    finished: 'Finished',
  };

  for (const game of userGames) {
    const status = game.status || 'unplayed';
    statusMap.set(status, (statusMap.get(status) || 0) + 1);
  }

  const statusDistribution: StatusDistribution[] = Array.from(statusMap.entries())
    .map(([status, count]) => ({
      status: statusLabels[status] || status,
      count,
      percentage: totalGames > 0 ? Math.round((count / totalGames) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Calculate Weekly Playtime Trends
  const weeklyPlaytime = calculateWeeklyPlaytime(dailyActivity);

  // Get Most Played Games (top 10)
  const mostPlayedGames: MostPlayedGame[] = userGames
    .filter(g => (g.playtime_hours || 0) > 0)
    .sort((a, b) => (b.playtime_hours || 0) - (a.playtime_hours || 0))
    .slice(0, 10)
    .map(g => {
      const gameInfo = g.game as GameDetails | null;
      return {
        gameTitle: gameInfo?.title || 'Unknown Game',
        coverUrl: gameInfo?.cover_url || null,
        platform: g.platform || 'Unknown',
        playtimeHours: Math.round((g.playtime_hours || 0) * 10) / 10,
        lastPlayed: g.last_played_at,
      };
    });

  return {
    totalPlaytimeHours: Math.round(totalPlaytimeHours * 10) / 10,
    totalGames,
    completedGames,
    completionRate,
    totalAchievementsEarned,
    totalAchievementsAvailable,
    achievementCompletionRate,
    averageSessionMinutes,
    currentStreak,
    longestStreak,
    dailyActivity,
    playtimeByPlatform,
    statusDistribution,
    weeklyPlaytime,
    mostPlayedGames,
  };
}
