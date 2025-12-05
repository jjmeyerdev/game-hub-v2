#!/usr/bin/env node
// Manually trigger a session sync using the same logic as the server action

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const STEAM_API_KEY = process.env.STEAM_WEB_API_KEY;

async function getCurrentlyPlayingGame(steamId) {
  const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_API_KEY}&steamids=${steamId}`;
  const resp = await fetch(url);
  const data = await resp.json();
  const player = data.response.players[0];

  if (!player) {
    return { isPlaying: false, steamAppId: null, gameName: null };
  }

  return {
    isPlaying: !!player.gameid,
    steamAppId: player.gameid ? parseInt(player.gameid) : null,
    gameName: player.gameextrainfo || null
  };
}

async function manualSync() {
  console.log('🔄 Manually syncing session...\n');

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, steam_id')
    .not('steam_id', 'is', null)
    .single();

  if (!profile) {
    console.log('❌ No Steam profile found');
    return;
  }

  console.log(`👤 User: ${profile.id}`);
  console.log(`🎮 Steam ID: ${profile.steam_id}\n`);

  // Check Steam API
  const currentlyPlaying = await getCurrentlyPlayingGame(profile.steam_id);
  console.log('📡 Steam API:');
  console.log(`   Playing: ${currentlyPlaying.isPlaying}`);
  if (currentlyPlaying.isPlaying) {
    console.log(`   Game: ${currentlyPlaying.gameName}`);
    console.log(`   App ID: ${currentlyPlaying.steamAppId}\n`);
  }

  // Check active sessions
  const { data: activeSessions } = await supabase
    .from('game_sessions')
    .select('*, game:games(title)')
    .eq('user_id', profile.id)
    .eq('status', 'active');

  const activeSession = activeSessions?.[0] || null;
  console.log(`🎯 Active sessions in DB: ${activeSessions?.length || 0}`);
  if (activeSession) {
    console.log(`   Current: ${activeSession.game?.title} (${activeSession.steam_appid})\n`);
  }

  // Decision logic
  if (!currentlyPlaying.isPlaying && !activeSession) {
    console.log('⚪ Not playing, no session - nothing to do');
    return;
  }

  if (!currentlyPlaying.isPlaying && activeSession) {
    console.log('🏁 Ending session (stopped playing)...');
    return;
  }

  if (currentlyPlaying.isPlaying && !activeSession) {
    console.log('🆕 Starting new session...');

    // Find user_game
    const { data: userGame, error } = await supabase
      .from('user_games')
      .select('id, game_id, game:games(title)')
      .eq('user_id', profile.id)
      .eq('steam_appid', currentlyPlaying.steamAppId)
      .single();

    if (error || !userGame) {
      console.log(`❌ Game not found in library!`);
      console.log(`   Looking for steam_appid: ${currentlyPlaying.steamAppId}`);
      console.log(`   Error: ${error?.message || 'No matching user_game record'}`);
      return;
    }

    console.log(`   Found: ${userGame.game?.title}`);

    // Create session
    const { data: session, error: sessionError } = await supabase
      .from('game_sessions')
      .insert({
        user_id: profile.id,
        game_id: userGame.game_id,
        user_game_id: userGame.id,
        steam_appid: currentlyPlaying.steamAppId,
        status: 'active',
      })
      .select('*, game:games(title)')
      .single();

    if (sessionError) {
      console.log(`❌ Failed to create session: ${sessionError.message}`);
      return;
    }

    console.log(`\n✅ SESSION CREATED!`);
    console.log(`   ID: ${session.id}`);
    console.log(`   Game: ${session.game?.title}`);
    console.log(`   Started: ${new Date(session.started_at).toLocaleTimeString()}`);
    return;
  }

  if (currentlyPlaying.isPlaying && activeSession) {
    if (activeSession.steam_appid === currentlyPlaying.steamAppId) {
      console.log(`✅ Same game still playing: ${activeSession.game?.title}`);
    } else {
      console.log('🔄 Different game - would switch sessions');
    }
  }
}

manualSync().catch(console.error);
