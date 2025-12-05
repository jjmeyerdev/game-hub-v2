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

async function updateGames() {
  // Get all Steam user_games with their game titles
  const { data: userGames } = await supabase
    .from('user_games')
    .select('id, game:games(title)')
    .eq('platform', 'Steam');

  const keepPlaying = ['ace combat 7', 'orwell', 'stardew valley'];

  let updated = 0;
  let skipped = 0;

  for (const ug of userGames) {
    const title = ug.game?.title?.toLowerCase() || '';
    const shouldKeep = keepPlaying.some(k => title.includes(k));

    if (shouldKeep) {
      skipped++;
      console.log('✅ Keeping:', ug.game?.title);
    } else {
      await supabase
        .from('user_games')
        .update({ status: 'unplayed' })
        .eq('id', ug.id);
      updated++;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   Updated ${updated} games to "unplayed"`);
  console.log(`   Kept ${skipped} games unchanged`);
}

updateGames().catch(console.error);
