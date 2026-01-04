'use server';

import { createClient } from '@/lib/supabase/server';
import type { UserGame } from './games';

export async function getGameById(id: string): Promise<UserGame | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: userGame, error } = await supabase
    .from('user_games')
    .select(`
      *,
      game:games(*)
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.error('Error fetching game:', error);
    return null;
  }

  return userGame;
}
