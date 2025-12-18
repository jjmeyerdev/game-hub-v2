'use server';

import { createClient } from '@/lib/supabase/server';
import type { PsnProfile } from '@/lib/types/psn';

/**
 * Get current user's PSN profile information
 */
export async function getPsnProfile(): Promise<PsnProfile | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('psn_account_id, psn_online_id, psn_avatar_url, psn_trophy_level, psn_last_sync')
    .eq('id', user.id)
    .single();

  if (!profile || !profile.psn_account_id) {
    return null;
  }

  return profile as PsnProfile;
}
