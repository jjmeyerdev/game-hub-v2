'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentlyPlayingGame } from '@/lib/steam/client';
import type { GameSession } from '@/lib/types/steam';

/**
 * Sync session state with Steam API
 * Main orchestrator function called by polling hook
 */
export async function syncSessionWithSteam() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { activeSession: null, error: 'Not authenticated' };
  }

  // Get user's Steam ID
  const { data: profile } = await supabase
    .from('profiles')
    .select('steam_id')
    .eq('id', user.id)
    .single();

  if (!profile?.steam_id) {
    return { activeSession: null, error: 'No Steam connected' };
  }

  try {
    // Check what user is currently playing on Steam
    const currentlyPlaying = await getCurrentlyPlayingGame(profile.steam_id);

    // Get any active session from database
    const { data: activeSessions } = await supabase
      .from('game_sessions')
      .select('*, game:games(title, cover_url)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('started_at', { ascending: false })
      .limit(1);

    const activeSession = activeSessions?.[0] || null;

    // Decision logic
    if (!currentlyPlaying.isPlaying && activeSession) {
      // User stopped playing - end the session
      await endGameSession(activeSession.id);
      return { activeSession: null };
    }

    if (currentlyPlaying.isPlaying && !activeSession) {
      // User started playing - create new session
      const newSession = await startGameSessionBySteamAppId(
        currentlyPlaying.steamAppId!,
        currentlyPlaying.gameName!
      );
      return { activeSession: newSession };
    }

    if (currentlyPlaying.isPlaying && activeSession) {
      // Check if same game
      if (activeSession.steam_appid !== currentlyPlaying.steamAppId) {
        // Different game - end old, start new
        await endGameSession(activeSession.id);
        const newSession = await startGameSessionBySteamAppId(
          currentlyPlaying.steamAppId!,
          currentlyPlaying.gameName!
        );
        return { activeSession: newSession };
      }
      // Same game - return existing session
      return { activeSession };
    }

    // No session active
    return { activeSession: null };
  } catch (error) {
    console.error('Session sync error:', error);
    return {
      activeSession: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Start a new game session by Steam App ID
 * Internal function used by syncSessionWithSteam
 */
async function startGameSessionBySteamAppId(
  steamAppId: number,
  gameName: string
): Promise<GameSession | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Find the user_game record for this Steam game
  // Note: user_games needs steam_appid column for this to work
  const { data: userGame, error: userGameError } = await supabase
    .from('user_games')
    .select('id, game_id')
    .eq('user_id', user.id)
    .eq('steam_appid', steamAppId)
    .single();

  if (userGameError || !userGame) {
    console.warn(`Game not found in library: ${gameName} (${steamAppId})`);
    return null;
  }

  // Create session
  const { data: session, error: sessionError } = await supabase
    .from('game_sessions')
    .insert({
      user_id: user.id,
      game_id: userGame.game_id,
      user_game_id: userGame.id,
      steam_appid: steamAppId,
      status: 'active',
    })
    .select('*, game:games(title, cover_url)')
    .single();

  if (sessionError) {
    console.error('Failed to create session:', sessionError);
    return null;
  }

  // Update user_games status to 'playing' and last_played_at
  await supabase
    .from('user_games')
    .update({
      status: 'playing',
      last_played_at: new Date().toISOString(),
    })
    .eq('id', userGame.id);

  return session;
}

/**
 * End a game session
 * Internal function used by syncSessionWithSteam
 */
async function endGameSession(sessionId: string): Promise<void> {
  const supabase = await createClient();

  const { data: session } = await supabase
    .from('game_sessions')
    .select('started_at, user_game_id')
    .eq('id', sessionId)
    .single();

  if (!session) return;

  const now = new Date();
  const started = new Date(session.started_at);
  const durationMinutes = Math.floor((now.getTime() - started.getTime()) / (1000 * 60));

  // Update session
  await supabase
    .from('game_sessions')
    .update({
      ended_at: now.toISOString(),
      duration_minutes: durationMinutes,
      status: 'completed',
    })
    .eq('id', sessionId);

  // Update user_games: total playtime and reset status from 'playing' to 'backlog'
  const { data: userGame } = await supabase
    .from('user_games')
    .select('playtime_hours, status')
    .eq('id', session.user_game_id)
    .single();

  if (userGame) {
    const newPlaytimeHours = (userGame.playtime_hours || 0) + durationMinutes / 60;
    await supabase
      .from('user_games')
      .update({
        playtime_hours: newPlaytimeHours,
        // Reset status from 'playing' to 'backlog' when session ends
        status: userGame.status === 'playing' ? 'backlog' : userGame.status,
      })
      .eq('id', session.user_game_id);
  }
}

/**
 * Get the currently active session
 */
export async function getActiveSession(): Promise<GameSession | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from('game_sessions')
    .select('*, game:games(title, cover_url)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  return data || null;
}

/**
 * Get total playtime for today
 * Includes completed sessions + active session time
 */
export async function getTodayPlaytime(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return 0;

  const today = new Date().toISOString().split('T')[0];

  const { data } = await supabase
    .from('daily_playtime_summary')
    .select('total_minutes')
    .eq('user_id', user.id)
    .eq('play_date', today)
    .maybeSingle();

  // Add active session time
  const activeSession = await getActiveSession();
  let activeMinutes = 0;
  if (activeSession) {
    const started = new Date(activeSession.started_at);
    activeMinutes = Math.floor((Date.now() - started.getTime()) / (1000 * 60));
  }

  return (data?.total_minutes || 0) + activeMinutes;
}

/**
 * Get session history
 * Returns completed sessions ordered by most recent
 */
export async function getSessionHistory(limit = 20): Promise<GameSession[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from('game_sessions')
    .select('*, game:games(title, cover_url)')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .order('started_at', { ascending: false })
    .limit(limit);

  return data || [];
}

/**
 * Get session history for a specific game
 */
export async function getGameSessionHistory(gameId: string, limit = 10): Promise<GameSession[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from('game_sessions')
    .select('*, game:games(title, cover_url)')
    .eq('user_id', user.id)
    .eq('game_id', gameId)
    .eq('status', 'completed')
    .order('started_at', { ascending: false })
    .limit(limit);

  return data || [];
}

/**
 * Cleanup abandoned sessions
 * Ends any active sessions older than 6 hours
 */
export async function cleanupAbandonedSessions(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return 0;

  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

  // Find abandoned sessions
  const { data: abandonedSessions } = await supabase
    .from('game_sessions')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .lt('started_at', sixHoursAgo);

  if (!abandonedSessions || abandonedSessions.length === 0) {
    return 0;
  }

  // End each abandoned session
  for (const session of abandonedSessions) {
    await endGameSession(session.id);
  }

  return abandonedSessions.length;
}
