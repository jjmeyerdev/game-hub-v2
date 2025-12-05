#!/usr/bin/env node

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

async function test() {
  console.log('🔍 Testing session sync logic...\n');

  // Get user's Steam ID
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, steam_id')
    .not('steam_id', 'is', null)
    .single();

  if (!profile) {
    console.log('❌ No Steam profile found');
    return;
  }

  console.log(`👤 User ID: ${profile.id}`);
  console.log(`🎮 Steam ID: ${profile.steam_id}\n`);

  // Check Steam API
  const steamUrl = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_API_KEY}&steamids=${profile.steam_id}`;
  const steamResp = await fetch(steamUrl);
  const steamData = await steamResp.json();
  const player = steamData.response.players[0];

  console.log('📡 Steam API Response:');
  console.log(`   In-game: ${!!player.gameid}`);
  if (player.gameid) {
    console.log(`   App ID: ${player.gameid}`);
    console.log(`   Game: ${player.gameextrainfo}\n`);
  }

  // Check database for matching game
  if (player.gameid) {
    const { data: userGames, error } = await supabase
      .from('user_games')
      .select('id, game_id, steam_appid, game:games(title)')
      .eq('user_id', profile.id)
      .eq('steam_appid', parseInt(player.gameid));

    console.log('🗃️  Database Lookup:');
    console.log(`   Query: user_id=${profile.id}, steam_appid=${player.gameid}`);
    console.log(`   Results: ${userGames?.length || 0} rows`);
    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    if (userGames && userGames.length > 0) {
      userGames.forEach(g => {
        console.log(`   ✅ ${g.game?.title} (user_game_id: ${g.id})`);
      });
    }
  }

  // Check for active sessions
  const { data: activeSessions } = await supabase
    .from('game_sessions')
    .select('*')
    .eq('user_id', profile.id)
    .eq('status', 'active');

  console.log(`\n🎯 Active Sessions: ${activeSessions?.length || 0}`);
  if (activeSessions && activeSessions.length > 0) {
    activeSessions.forEach(s => {
      console.log(`   - Session ${s.id} (App ID: ${s.steam_appid})`);
    });
  }
}

test().catch(console.error);
