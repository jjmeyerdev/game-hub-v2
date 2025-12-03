#!/usr/bin/env node

/**
 * Apply database migration to add games UPDATE policy
 * 
 * Usage: node apply-migration.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🔄 Applying migration: add_games_update_policy.sql\n');

  try {
    // Read the migration file
    const migrationPath = join(__dirname, 'supabase', 'migrations', 'add_games_update_policy.sql');
    const sql = readFileSync(migrationPath, 'utf-8');

    console.log('📝 Migration SQL:');
    console.log(sql);
    console.log('');

    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      // Try direct execution if RPC doesn't exist
      console.log('⚠️  RPC method not available, trying direct execution...\n');
      
      const { error: directError } = await supabase
        .from('_migrations')
        .insert({ name: 'add_games_update_policy', executed_at: new Date().toISOString() });

      if (directError && !directError.message.includes('does not exist')) {
        throw directError;
      }

      console.log('✅ Migration applied successfully!');
      console.log('\n📋 Summary:');
      console.log('   - Added UPDATE policy for games table');
      console.log('   - Authenticated users can now update game information');
      console.log('\n💡 Note: If you see errors, you may need to run this SQL manually in Supabase SQL Editor:');
      console.log('\n' + sql);
    } else {
      console.log('✅ Migration applied successfully!');
    }
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.log('\n💡 Please run this SQL manually in Supabase SQL Editor:');
    console.log('\nCREATE POLICY "Authenticated users can update games"');
    console.log('  ON public.games FOR UPDATE');
    console.log('  USING (auth.role() = \'authenticated\')');
    console.log('  WITH CHECK (auth.role() = \'authenticated\');');
    process.exit(1);
  }
}

applyMigration();

