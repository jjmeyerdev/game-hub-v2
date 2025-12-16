'use server';

import { createClient } from '@/lib/supabase/server';
import type { SteamProfile } from '@/lib/types/steam';

/**
 * Get current user's Steam profile information
 */
export async function getSteamProfile(): Promise<SteamProfile | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('steam_id, steam_persona_name, steam_avatar_url, steam_profile_url, steam_last_sync')
    .eq('id', user.id)
    .single();

  if (!profile || !profile.steam_id) {
    return null;
  }

  return profile as SteamProfile;
}
