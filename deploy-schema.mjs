#!/usr/bin/env node

/**
 * Database Schema Deployment Helper
 *
 * This script helps you deploy the Game Hub database schema to Supabase.
 * It will open the Supabase SQL Editor and provide instructions.
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Game Hub - Database Schema Deployment Helper');
console.log('================================================\n');

// Read the schema file
const schemaPath = join(__dirname, 'supabase', 'schema.sql');
let schemaSQL;

try {
  schemaSQL = readFileSync(schemaPath, 'utf-8');
  console.log('✅ Schema file loaded successfully');
  console.log(`   Location: ${schemaPath}`);
  console.log(`   Size: ${(schemaSQL.length / 1024).toFixed(2)} KB\n`);
} catch (error) {
  console.error('❌ Error reading schema file:', error.message);
  process.exit(1);
}

const projectId = 'ronrqkynoorxaggvsfcr';
const sqlEditorUrl = `https://supabase.com/dashboard/project/${projectId}/sql/new`;

console.log('📋 DEPLOYMENT INSTRUCTIONS');
console.log('================================================\n');
console.log('1. Opening Supabase SQL Editor in your browser...\n');

// Open the SQL editor in the browser
exec(`open "${sqlEditorUrl}"`, (error) => {
  if (error) {
    console.log('   ℹ️  Could not auto-open browser. Please visit:');
    console.log(`   ${sqlEditorUrl}\n`);
  }
});

console.log('2. Copy the entire schema file content:');
console.log(`   File: ${schemaPath}\n`);

console.log('3. Paste it into the SQL Editor\n');

console.log('4. Click "Run" or press Cmd/Ctrl + Enter\n');

console.log('5. Verify the tables were created:');
console.log('   • profiles');
console.log('   • games');
console.log('   • user_games');
console.log('   • custom_lists');
console.log('   • list_games\n');

console.log('================================================');
console.log('📎 Quick Access Links:');
console.log('================================================');
console.log(`SQL Editor:    ${sqlEditorUrl}`);
console.log(`Table Editor:  https://supabase.com/dashboard/project/${projectId}/editor`);
console.log(`Auth Users:    https://supabase.com/dashboard/project/${projectId}/auth/users`);
console.log('\n💡 TIP: The schema includes:');
console.log('   • Row Level Security (RLS) policies');
console.log('   • Auto-profile creation triggers');
console.log('   • Performance indexes');
console.log('   • Updated timestamp triggers\n');

console.log('🔄 After deployment, verify by running:');
console.log('   pnpm dev\n');
console.log('   Then sign up a new user and check if profile is auto-created.\n');
