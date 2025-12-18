'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getMyProfile } from '@/lib/xbox/client';
import type { XboxDbProfile, XboxAuthError } from '@/lib/types/xbox';
import { getValidApiKey } from './auth';

/**
 * Get current user's Xbox profile information
 */
export async function getXboxProfile(): Promise<XboxDbProfile | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('xbox_xuid, xbox_gamertag, xbox_avatar_url, xbox_gamerscore, xbox_last_sync')
    .eq('id', user.id)
    .single();

  if (!profile || !profile.xbox_xuid) {
    return null;
  }

  return profile as XboxDbProfile;
}

/**
 * Refresh Xbox profile data
 */
export async function refreshXboxProfile() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  try {
    const apiKey = await getValidApiKey(user.id);

    if (!apiKey) {
      return { error: 'Xbox account not linked' };
    }

    const xboxProfile = await getMyProfile(apiKey);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        xbox_gamertag: xboxProfile.gamertag,
        xbox_avatar_url: xboxProfile.gamerPicture || null,
        xbox_gamerscore: xboxProfile.gamerscore || 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      return { error: updateError.message };
    }

    revalidatePath('/settings');
    revalidatePath('/dashboard');

    return {
      success: true,
      profile: {
        xbox_gamertag: xboxProfile.gamertag,
        xbox_avatar_url: xboxProfile.gamerPicture || null,
        xbox_gamerscore: xboxProfile.gamerscore || 0,
      },
    };
  } catch (error) {
    // Check for auth error dynamically to avoid import issues
    if (error && typeof error === 'object' && 'name' in error && error.name === 'XboxAuthError') {
      return { error: 'Xbox API key is invalid. Please re-link your account.' };
    }
    return {
      error: error instanceof Error ? error.message : 'Failed to refresh Xbox profile',
    };
  }
}
