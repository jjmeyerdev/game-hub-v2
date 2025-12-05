#!/usr/bin/env node

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '.env.local') });

const STEAM_API_KEY = process.env.STEAM_WEB_API_KEY;
const STEAM_ID = '76561198131293798';

async function checkSteamAPI() {
  console.log('🔍 Checking Steam API directly...\n');

  const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_API_KEY}&steamids=${STEAM_ID}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    const player = data.response.players[0];

    console.log('👤 Player Info:');
    console.log(`   Name: ${player.personaname}`);
    console.log(`   Status: ${player.personastate === 1 ? 'Online' : 'Offline'}`);

    if (player.gameid) {
      console.log(`\n🎮 CURRENTLY PLAYING!`);
      console.log(`   Game ID: ${player.gameid}`);
      console.log(`   Game Name: ${player.gameextrainfo || 'Unknown'}`);

      if (player.gameid === '491950') {
        console.log(`   ✅ This is Orwell!`);
      } else if (player.gameid === '633060') {
        console.log(`   ✅ This is Orwell: Ignorance is Strength!`);
      }
    } else {
      console.log(`\n⚪ No game detected`);
      console.log(`   Make sure Orwell is running and Steam is online`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkSteamAPI();
