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

const { data, error } = await supabase
  .from('user_games')
  .select('steam_appid, game:games(title)')
  .not('steam_appid', 'is', null)
  .limit(15);

if (error) {
  console.error('Error:', error);
} else {
  console.log('🎮 Games in your library with Steam App IDs:\n');
  data?.forEach(g => {
    console.log(`   - ${g.game?.title} (App ID: ${g.steam_appid})`);
  });
  console.log(`\n💡 Launch any of these games on Steam to test session tracking!`);
}
