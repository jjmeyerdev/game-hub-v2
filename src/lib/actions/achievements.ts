'use server';

import { createClient } from '@/lib/supabase/server';
import type { UserGame, Game } from './games';

export interface PlatformStats {
  earned: number;
  total: number;
  games: number;
  completionPercentage: number;
}

export interface AchievementStats {
  totalEarned: number;
  totalAvailable: number;
  completionPercentage: number;
  gamesWithAchievements: number;
  perfectGames: number;
  perfectGamesList: Array<{
    userGame: UserGame;
    totalAchievements: number;
  }>;
  platformStats: {
    steam: PlatformStats;
    psn: PlatformStats;
    xbox: PlatformStats;
  };
  topCompletedGames: Array<{
    userGame: UserGame;
    percentage: number;
  }>;
  almostComplete: Array<{
    userGame: UserGame;
    percentage: number;
    remaining: number;
  }>;
}

/**
 * Get aggregate achievement statistics for the current user
 */
export async function getAchievementStats(): Promise<AchievementStats | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch all user games with achievements
  const { data: userGames, error } = await supabase
    .from('user_games')
    .select(`
      *,
      game:games(*)
    `)
    .eq('user_id', user.id)
    .gt('achievements_total', 0);

  if (error || !userGames) {
    console.error('Error fetching achievement stats:', error);
    return null;
  }

  // Calculate totals
  let totalEarned = 0;
  let totalAvailable = 0;
  let perfectGames = 0;

  // Platform-specific stats
  const platformStats = {
    steam: { earned: 0, total: 0, games: 0, completionPercentage: 0 },
    psn: { earned: 0, total: 0, games: 0, completionPercentage: 0 },
    xbox: { earned: 0, total: 0, games: 0, completionPercentage: 0 },
  };

  // Process each game
  const gamesWithPercentage: Array<{ userGame: UserGame; percentage: number }> = [];
  const perfectGamesList: Array<{ userGame: UserGame; totalAchievements: number }> = [];

  for (const ug of userGames) {
    const earned = ug.achievements_earned || 0;
    const total = ug.achievements_total || 0;

    if (total === 0) continue;

    totalEarned += earned;
    totalAvailable += total;

    const percentage = Math.round((earned / total) * 100);

    if (earned === total) {
      perfectGames++;
      perfectGamesList.push({
        userGame: ug as UserGame,
        totalAchievements: total,
      });
    }

    // Determine platform
    const platform = (ug.platform || '').toLowerCase();
    const gameData = ug.game as Game | null;

    // Check sync source indicators
    const isSteam = platform.includes('steam') || gameData?.steam_appid;
    const isPsn = platform.includes('playstation') || platform.includes('ps') || gameData?.psn_communication_id;
    const isXbox = platform.includes('xbox') || gameData?.xbox_title_id;

    if (isSteam) {
      platformStats.steam.earned += earned;
      platformStats.steam.total += total;
      platformStats.steam.games++;
    } else if (isPsn) {
      platformStats.psn.earned += earned;
      platformStats.psn.total += total;
      platformStats.psn.games++;
    } else if (isXbox) {
      platformStats.xbox.earned += earned;
      platformStats.xbox.total += total;
      platformStats.xbox.games++;
    }

    gamesWithPercentage.push({
      userGame: ug as UserGame,
      percentage,
    });
  }

  // Calculate platform completion percentages
  for (const key of Object.keys(platformStats) as Array<keyof typeof platformStats>) {
    const stats = platformStats[key];
    if (stats.total > 0) {
      stats.completionPercentage = Math.round((stats.earned / stats.total) * 100);
    }
  }

  // Sort by percentage descending
  gamesWithPercentage.sort((a, b) => {
    // First by percentage
    if (b.percentage !== a.percentage) {
      return b.percentage - a.percentage;
    }
    // Then by total achievements (more impressive if more achievements)
    return (b.userGame.achievements_total || 0) - (a.userGame.achievements_total || 0);
  });

  // Top completed games (exclude 100% complete, take top 10)
  const topCompletedGames = gamesWithPercentage
    .filter((g) => g.percentage < 100 && g.percentage > 0)
    .slice(0, 10);

  // Almost complete (90-99%)
  const almostComplete = gamesWithPercentage
    .filter((g) => g.percentage >= 90 && g.percentage < 100)
    .map((g) => ({
      ...g,
      remaining: (g.userGame.achievements_total || 0) - (g.userGame.achievements_earned || 0),
    }))
    .slice(0, 6);

  const overallPercentage = totalAvailable > 0
    ? Math.round((totalEarned / totalAvailable) * 100)
    : 0;

  // Sort perfect games by completion date (newest first), then by total achievements
  perfectGamesList.sort((a, b) => {
    const aDate = a.userGame.completed_at ? new Date(a.userGame.completed_at).getTime() : 0;
    const bDate = b.userGame.completed_at ? new Date(b.userGame.completed_at).getTime() : 0;

    // If both have completion dates, sort by date (newest first)
    if (aDate && bDate) {
      return bDate - aDate;
    }

    // Games with completion dates come before those without
    if (aDate && !bDate) return -1;
    if (!aDate && bDate) return 1;

    // Fallback: sort by total achievements (most impressive first)
    return b.totalAchievements - a.totalAchievements;
  });

  return {
    totalEarned,
    totalAvailable,
    completionPercentage: overallPercentage,
    gamesWithAchievements: userGames.length,
    perfectGames,
    perfectGamesList,
    platformStats,
    topCompletedGames,
    almostComplete,
  };
}
