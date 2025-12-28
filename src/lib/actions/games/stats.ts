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

  // Exclude unowned games from stats (unless previously_owned)
  const ownedGames = games.filter(g => g.ownership_status !== 'unowned' || g.previously_owned);

  const totalGames = ownedGames.length;
  // Use snapshot values when set, otherwise use synced values
  const hoursPlayed = ownedGames.reduce((sum, g) => {
    const hours = g.my_playtime_hours ?? g.playtime_hours ?? 0;
    return sum + hours;
  }, 0);
  const achievements = ownedGames.reduce((sum, g) => {
    const earned = g.my_achievements_earned ?? g.achievements_earned ?? 0;
    return sum + earned;
  }, 0);
  const completedGames = ownedGames.filter(
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
