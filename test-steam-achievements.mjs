// Test Steam Achievement API directly
import { createClient } from '@supabase/supabase-js';

const STEAM_API_KEY = '4040E46BDC5651A8FED2319249E7C4F4';
const STEAM_API_BASE = 'https://api.steampowered.com';

const supabase = createClient(
  'https://ronrqkynoorxaggvsfcr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvbnJxa3lub29yeGFnZ3ZzZmNyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzYzNzgzOCwiZXhwIjoyMDc5MjEzODM4fQ.bYd68u496G2rLLbp27z8M-wivRSBvS9kdTtuJpyLAH4'
);

async function testAchievements() {
  // Get a user with Steam linked
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, steam_id, steam_persona_name')
    .not('steam_id', 'is', null)
    .limit(1);

  if (error || !profiles?.length) {
    console.error('No Steam-linked profiles found:', error);
    return;
  }

  const profile = profiles[0];
  console.log(`\nTesting with Steam user: ${profile.steam_persona_name} (${profile.steam_id})\n`);

  // Get some games from their library
  const { data: userGames } = await supabase
    .from('user_games')
    .select('game_id, steam_appid, achievements_earned, achievements_total, game:games(title, steam_appid)')
    .eq('user_id', profile.id)
    .eq('platform', 'Steam')
    .not('steam_appid', 'is', null)
    .limit(5);

  if (!userGames?.length) {
    console.log('No Steam games found in library');
    return;
  }

  console.log('Testing achievement fetch for games:\n');

  for (const ug of userGames) {
    const appId = ug.steam_appid || ug.game?.steam_appid;
    const title = ug.game?.title || `AppID ${appId}`;

    if (!appId) {
      console.log(`❌ ${title}: No appId available`);
      continue;
    }

    console.log(`\n📦 ${title} (appid: ${appId})`);
    console.log(`   DB values: earned=${ug.achievements_earned}, total=${ug.achievements_total}`);

    // Test GetPlayerAchievements API
    const achievementUrl = `${STEAM_API_BASE}/ISteamUserStats/GetPlayerAchievements/v1/?key=${STEAM_API_KEY}&steamid=${profile.steam_id}&appid=${appId}`;

    try {
      const response = await fetch(achievementUrl);
      const data = await response.json();

      if (data.playerstats?.success) {
        const achievements = data.playerstats.achievements || [];
        const earned = achievements.filter(a => a.achieved === 1).length;
        console.log(`   API response: ${earned}/${achievements.length} achievements earned`);

        if (earned > 0) {
          console.log(`   Sample earned: ${achievements.filter(a => a.achieved === 1).slice(0, 3).map(a => a.apiname).join(', ')}`);
        }
      } else {
        console.log(`   API response: No achievements (success=${data.playerstats?.success}, error=${data.playerstats?.error})`);
      }
    } catch (err) {
      console.log(`   API error: ${err.message}`);
    }

    // Test GetSchemaForGame API
    const schemaUrl = `${STEAM_API_BASE}/ISteamUserStats/GetSchemaForGame/v2/?key=${STEAM_API_KEY}&appid=${appId}`;

    try {
      const response = await fetch(schemaUrl);
      const data = await response.json();

      const schemaAchievements = data.game?.availableGameStats?.achievements;
      if (schemaAchievements) {
        console.log(`   Schema: ${schemaAchievements.length} total achievements defined`);
      } else {
        console.log(`   Schema: No achievements in schema`);
      }
    } catch (err) {
      console.log(`   Schema error: ${err.message}`);
    }
  }
}

testAchievements().catch(console.error);
