'use server';

import { requireAuth } from '@/lib/supabase/server';

/**
 * Get user stats
 */
export async function getUserStats() {
  let user, supabase;
  try {
    ({ user, supabase } = await requireAuth());
  } catch {
    return {
      totalGames: 0,
      hoursPlayed: 0,
      achievements: 0,
      completionRate: 0,
    };
  }

  const { data: games } = await supabase
    .from('user_games')
    .select('*')
    .eq('user_id', user.id);

  if (!games) {
    return {
      totalGames: 0,
      hoursPlayed: 0,
      achievements: 0,
      completionRate: 0,
    };
  }

  const totalGames = games.length;
  const hoursPlayed = games.reduce((sum, g) => sum + (g.playtime_hours || 0), 0);
  const achievements = games.reduce((sum, g) => sum + (g.achievements_earned || 0), 0);
  const completedGames = games.filter(
    (g) => g.status === 'completed' || g.status === 'finished'
  ).length;
  const completionRate = totalGames > 0 ? Math.round((completedGames / totalGames) * 100) : 0;

  return {
    totalGames,
    hoursPlayed: Math.round(hoursPlayed),
    achievements,
    completionRate,
  };
}
