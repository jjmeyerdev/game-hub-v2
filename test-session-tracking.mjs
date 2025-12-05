#!/usr/bin/env node

/**
 * Test session tracking - check if Steam activity is being detected
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSessionTracking() {
  console.log('🔍 Testing Session Tracking...\n');

  try {
    // Get all users with Steam connected
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, steam_id, steam_persona_name')
      .not('steam_id', 'is', null);

    if (profileError) throw profileError;

    console.log(`📊 Found ${profiles.length} user(s) with Steam connected:\n`);

    for (const profile of profiles) {
      console.log(`👤 ${profile.email} (${profile.steam_persona_name})`);
      console.log(`   Steam ID: ${profile.steam_id}`);

      // Check for active sessions
      const { data: activeSessions, error: sessionError } = await supabase
        .from('game_sessions')
        .select('*, game:games(title)')
        .eq('user_id', profile.id)
        .eq('status', 'active');

      if (sessionError) {
        console.log(`   ❌ Error checking sessions: ${sessionError.message}`);
        continue;
      }

      if (activeSessions && activeSessions.length > 0) {
        console.log(`   🟢 ACTIVE SESSION DETECTED!`);
        activeSessions.forEach(session => {
          const started = new Date(session.started_at);
          const duration = Math.floor((Date.now() - started.getTime()) / (1000 * 60));
          console.log(`      Game: ${session.game?.title || 'Unknown'}`);
          console.log(`      Duration: ${duration} minutes`);
          console.log(`      Started: ${started.toLocaleString()}`);
        });
      } else {
        console.log(`   ⚪ No active session`);
      }

      // Check session history
      const { data: recentSessions, error: historyError } = await supabase
        .from('game_sessions')
        .select('*, game:games(title)')
        .eq('user_id', profile.id)
        .eq('status', 'completed')
        .order('started_at', { ascending: false })
        .limit(3);

      if (!historyError && recentSessions && recentSessions.length > 0) {
        console.log(`   📜 Recent sessions: ${recentSessions.length}`);
        recentSessions.forEach(session => {
          console.log(`      - ${session.game?.title || 'Unknown'}: ${session.duration_minutes || 0} min`);
        });
      }

      console.log('');
    }

    // Check table structure
    console.log('🔧 Checking database setup...');
    const { data: sessions, error: checkError } = await supabase
      .from('game_sessions')
      .select('*')
      .limit(1);

    if (checkError) {
      console.log(`❌ Error accessing game_sessions table: ${checkError.message}`);
    } else {
      console.log('✅ game_sessions table is accessible');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSessionTracking();
