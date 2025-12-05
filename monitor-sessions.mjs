#!/usr/bin/env node

/**
 * Real-time session tracking monitor
 * Continuously checks for active sessions and displays updates
 */

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

let lastSessionId = null;
let checkCount = 0;

async function checkSessions() {
  checkCount++;
  const timestamp = new Date().toLocaleTimeString();

  try {
    // Get active sessions
    const { data: activeSessions, error } = await supabase
      .from('game_sessions')
      .select('*, game:games(title)')
      .eq('status', 'active')
      .order('started_at', { ascending: false });

    if (error) {
      console.log(`[${timestamp}] ❌ Error: ${error.message}`);
      return;
    }

    if (activeSessions && activeSessions.length > 0) {
      const session = activeSessions[0];
      const started = new Date(session.started_at);
      const duration = Math.floor((Date.now() - started.getTime()) / (1000 * 60));

      // New session detected
      if (lastSessionId !== session.id) {
        console.log('\n' + '='.repeat(60));
        console.log(`🎉 SESSION STARTED!`);
        console.log('='.repeat(60));
        console.log(`🎮 Game: ${session.game?.title || 'Unknown'}`);
        console.log(`⏰ Started: ${started.toLocaleString()}`);
        console.log(`🆔 Session ID: ${session.id}`);
        console.log(`📱 Platform: ${session.platform}`);
        if (session.steam_appid) {
          console.log(`🎯 Steam App ID: ${session.steam_appid}`);
        }
        console.log('='.repeat(60) + '\n');
        lastSessionId = session.id;
      } else {
        // Update existing session
        process.stdout.write(`\r[${timestamp}] 🟢 LIVE: ${session.game?.title || 'Unknown'} | Duration: ${duration}m | Check #${checkCount}`);
      }
    } else {
      // No active session
      if (lastSessionId !== null) {
        console.log('\n' + '='.repeat(60));
        console.log(`🏁 SESSION ENDED`);
        console.log('='.repeat(60) + '\n');
        lastSessionId = null;
      } else {
        process.stdout.write(`\r[${timestamp}] ⚪ Waiting for session... | Check #${checkCount}`);
      }
    }

    // Check recent completed sessions
    const { data: recentSessions } = await supabase
      .from('game_sessions')
      .select('*, game:games(title)')
      .eq('status', 'completed')
      .order('ended_at', { ascending: false })
      .limit(1);

    if (recentSessions && recentSessions.length > 0 && checkCount === 1) {
      const last = recentSessions[0];
      console.log(`\n📊 Last completed session:`);
      console.log(`   ${last.game?.title || 'Unknown'} - ${last.duration_minutes || 0} minutes`);
      console.log(`   Ended: ${new Date(last.ended_at).toLocaleString()}\n`);
    }

  } catch (error) {
    console.log(`\n[${timestamp}] ❌ Error: ${error.message}`);
  }
}

console.log('🔍 Real-Time Session Monitor Starting...\n');
console.log('📋 Instructions:');
console.log('   1. Go to: http://localhost:3000/dashboard');
console.log('   2. Launch a game on Steam');
console.log('   3. Watch for session detection!\n');
console.log('⏱️  Checking every 5 seconds...\n');

// Initial check
await checkSessions();

// Check every 5 seconds
setInterval(checkSessions, 5000);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Monitor stopped. Sessions are still being tracked by the dashboard!');
  process.exit(0);
});
