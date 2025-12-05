#!/usr/bin/env node

/**
 * Direct SQL execution for session tracking migration
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
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  console.log('🔄 Running session tracking migration...\n');

  try {
    // Read the migration file
    const migrationPath = join(__dirname, 'supabase', 'migrations', 'add_session_tracking.sql');
    const sql = readFileSync(migrationPath, 'utf-8');

    // Execute the full SQL at once
    const { data, error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      throw error;
    }

    console.log('✅ Migration completed successfully!\n');
    console.log('📋 Created:');
    console.log('   - game_sessions table');
    console.log('   - Indexes for performance');
    console.log('   - RLS policies');
    console.log('   - daily_playtime_summary view\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n💡 Please apply the migration manually:');
    console.log('   1. Open Supabase Dashboard → SQL Editor');
    console.log('   2. Copy the contents of: supabase/migrations/add_session_tracking.sql');
    console.log('   3. Paste and run the SQL\n');
  }
}

runMigration();
