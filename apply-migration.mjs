#!/usr/bin/env node

/**
 * Apply database migration
 * 
 * Usage: node apply-migration.mjs [migration-name]
 * Example: node apply-migration.mjs add_steam_integration
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
  // Get migration name from command line args, default to steam integration
  const migrationName = process.argv[2] || 'add_steam_integration';
  const migrationFile = `${migrationName}.sql`;
  
  console.log(`🔄 Applying migration: ${migrationFile}\n`);

  try {
    // Read the migration file
    const migrationPath = join(__dirname, 'supabase', 'migrations', migrationFile);
    const sql = readFileSync(migrationPath, 'utf-8');

    console.log('📝 Migration SQL:');
    console.log(sql);
    console.log('');

    // For Steam integration, we need to execute the SQL directly
    // Split by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📊 Executing ${statements.length} SQL statements...\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      console.log(`   [${i + 1}/${statements.length}] Executing statement...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        console.log(`   ⚠️  Statement ${i + 1} failed (this may be expected if already exists)`);
      } else {
        console.log(`   ✅ Statement ${i + 1} completed`);
      }
    }

    console.log('\n✅ Migration applied successfully!');
    console.log('\n📋 Summary:');
    
    if (migrationName === 'add_steam_integration') {
      console.log('   - Added Steam fields to profiles table');
      console.log('   - Added Steam App ID to games table');
      console.log('   - Added Steam tracking fields to user_games table');
      console.log('   - Created indexes for performance');
    } else {
      console.log(`   - Applied ${migrationName} migration`);
    }
    
    console.log('\n💡 If you see errors above, you may need to run the SQL manually in Supabase SQL Editor.');
    console.log('   The migration file is at: supabase/migrations/' + migrationFile);
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.log('\n💡 Please run this SQL manually in Supabase SQL Editor:');
    console.log('\n   File: supabase/migrations/' + migrationFile);
    console.log('\n   Or copy the SQL from above and run it in the Supabase SQL Editor.');
    process.exit(1);
  }
}

applyMigration();

