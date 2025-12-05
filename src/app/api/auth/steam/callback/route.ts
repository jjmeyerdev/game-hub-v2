// Steam OpenID Callback Handler
import { NextRequest, NextResponse } from 'next/server';
import { verifySteamOpenId, parseOpenIdParams } from '@/lib/steam/openid';
import { getPlayerSummary } from '@/lib/steam/client';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  try {
    // Get current user session
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // User not logged in - redirect to login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'not_authenticated');
      loginUrl.searchParams.set('message', 'Please log in first to connect your Steam account');
      return NextResponse.redirect(loginUrl);
    }

    // Parse OpenID parameters from callback URL
    const params = parseOpenIdParams(request.url);

    // Verify OpenID response and extract Steam ID
    const steamId = await verifySteamOpenId(params);

    // Fetch Steam profile information
    const steamProfile = await getPlayerSummary(steamId);

    if (!steamProfile) {
      throw new Error('Could not fetch Steam profile');
    }

    // Check if this Steam ID is already linked to another account
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('steam_id', steamId)
      .single();

    if (existingProfile && existingProfile.id !== user.id) {
      // Steam account already linked to different user
      const settingsUrl = new URL('/settings', request.url);
      settingsUrl.searchParams.set('error', 'steam_already_linked');
      settingsUrl.searchParams.set('message', 'This Steam account is already linked to another Game Hub account');
      return NextResponse.redirect(settingsUrl);
    }

    // Update user profile with Steam information
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        steam_id: steamId,
        steam_persona_name: steamProfile.personaname,
        steam_avatar_url: steamProfile.avatarfull,
        steam_profile_url: steamProfile.profileurl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      throw updateError;
    }

    // Success - redirect to settings
    const settingsUrl = new URL('/settings', request.url);
    settingsUrl.searchParams.set('success', 'steam_connected');
    settingsUrl.searchParams.set('message', `Successfully connected Steam account: ${steamProfile.personaname}`);

    return NextResponse.redirect(settingsUrl);
  } catch (error) {
    console.error('Steam callback error:', error);

    // Redirect to settings with error
    const settingsUrl = new URL('/settings', request.url);
    settingsUrl.searchParams.set('error', 'steam_connection_failed');
    settingsUrl.searchParams.set(
      'message',
      error instanceof Error ? error.message : 'Failed to connect Steam account'
    );

    return NextResponse.redirect(settingsUrl);
  }
}

