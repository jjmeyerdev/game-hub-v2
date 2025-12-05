# Steam Integration Guide

Complete guide for setting up and using Steam integration in Game Hub.

---

## Table of Contents

1. [Overview](#overview)
2. [Getting Your Steam Web API Key](#getting-your-steam-web-api-key)
3. [Configuration](#configuration)
4. [Connecting Your Steam Account](#connecting-your-steam-account)
5. [Privacy Settings](#privacy-settings)
6. [Syncing Your Library](#syncing-your-library)
7. [Features](#features)
8. [Troubleshooting](#troubleshooting)
9. [API Rate Limits](#api-rate-limits)
10. [FAQ](#faq)

---

## Overview

Steam integration allows you to:

- **Automatically import** your entire Steam game library
- **Sync playtime** from Steam to Game Hub
- **Track achievements** for games with Steam achievements
- **Keep data updated** with manual or automatic syncing
- **Authenticate** via Steam OpenID or manual Steam ID entry

---

## Getting Your Steam Web API Key

### Step 1: Sign in to Steam

Visit [https://steamcommunity.com/dev/apikey](https://steamcommunity.com/dev/apikey) and sign in with your Steam account.

### Step 2: Register Your Domain

- **Domain Name**: For development, use `localhost`. For production, use your actual domain (e.g., `gamehub.com`)
- **Agree to Terms**: Accept the Steam Web API Terms of Use

### Step 3: Get Your API Key

Once registered, you'll receive your Steam Web API Key. Copy this key - you'll need it for configuration.

> **Important**: Keep your API key secret! Never commit it to version control or share it publicly.

---

## Configuration

### Environment Variables

Add the following to your `.env.local` file:

```env
# Steam Web API Key
STEAM_WEB_API_KEY=your-steam-web-api-key-here

# Steam OpenID Configuration
NEXT_PUBLIC_STEAM_REALM=http://localhost:3000
NEXT_PUBLIC_STEAM_RETURN_URL=http://localhost:3000/api/auth/steam/callback
```

### Production Configuration

For production, update the URLs:

```env
NEXT_PUBLIC_STEAM_REALM=https://yourdomain.com
NEXT_PUBLIC_STEAM_RETURN_URL=https://yourdomain.com/api/auth/steam/callback
```

### Database Migration

Run the Steam integration migration:

```bash
pnpm db:migrate
```

This adds Steam-related fields to your database tables.

---

## Connecting Your Steam Account

You have two options to connect your Steam account:

### Option 1: Steam OpenID Login (Recommended)

1. Navigate to **Settings** in Game Hub
2. Click **"Sign in with Steam"**
3. You'll be redirected to Steam to authenticate
4. After approval, you'll be redirected back to Game Hub
5. Your Steam account is now connected!

### Option 2: Manual Steam ID Entry

1. Navigate to **Settings** in Game Hub
2. Find your Steam ID64:
   - Visit [steamid.io](https://steamid.io/)
   - Enter your Steam profile URL or username
   - Copy your **Steam ID64** (17-digit number starting with 7656119)
3. Paste your Steam ID64 into the input field
4. Click **"Link Steam Account"**

#### Supported Formats

The manual entry accepts:

- Steam ID64: `76561198XXXXXXXXX`
- Profile URL with ID: `https://steamcommunity.com/profiles/76561198XXXXXXXXX`

> **Note**: Custom URLs (e.g., `steamcommunity.com/id/username`) are not supported for manual entry. Use Steam OpenID login instead.

---

## Privacy Settings

**Critical**: Your Steam profile and game details must be set to **Public** for syncing to work.

### How to Make Your Profile Public

1. Go to your [Steam Privacy Settings](https://steamcommunity.com/my/edit/settings)
2. Set **"My profile"** to **Public**
3. Set **"Game details"** to **Public**
4. Save changes

### What Happens if Profile is Private?

If your profile is private, you'll see an error message:

```
Unable to fetch games. Please ensure your Steam profile and game details are set to public.
```

---

## Syncing Your Library

### First Sync

After connecting your Steam account:

1. Go to **Settings** or **Dashboard**
2. Click **"Sync Steam"** button
3. Wait for the sync to complete (may take a few minutes for large libraries)
4. View the sync results

### What Gets Synced?

- **Game titles** - All games in your Steam library
- **Cover art** - High-quality header images from Steam
- **Playtime** - Total hours played (converted from minutes)
- **Achievements** - Earned and total achievements (if available)
- **Last played** - Timestamp of last play session

### Sync Frequency

You can sync as often as you like, but consider:

- **Manual sync**: Click the button whenever you want to update
- **Automatic sync**: Not yet implemented (coming in future update)
- **Rate limits**: Steam API allows 200 requests per 5 minutes

### Updating Existing Games

When you sync:

- **New games** are added to your library
- **Existing games** have their playtime and achievements updated
- **No duplicates** are created (matched by Steam App ID)

---

## Features

### Dashboard Integration

- **Sync Button**: Quick access to sync your Steam library
- **Steam Badge**: Visual indicator on Steam games
- **Last Sync Time**: Hover over sync button to see when you last synced

### Settings Page

- **Profile Display**: See your connected Steam account with avatar
- **Sync Controls**: Manual sync with detailed results
- **Disconnect Option**: Unlink your Steam account (games remain in library)

### Game Cards

- **Steam Icon**: Games imported from Steam show a Steam badge
- **Playtime Tracking**: Steam playtime is automatically updated
- **Achievement Progress**: View your achievement completion percentage

---

## Troubleshooting

### Common Issues

#### 1. "Steam profile or game details are private"

**Solution**: Make your Steam profile public (see [Privacy Settings](#privacy-settings))

#### 2. "Invalid Steam ID format"

**Solution**: 
- Ensure you're using Steam ID64 (17 digits starting with 7656119)
- Or use the Steam OpenID login method
- Check for typos in your Steam ID

#### 3. "This Steam account is already linked to another user"

**Solution**: 
- Each Steam account can only be linked to one Game Hub account
- Unlink from the other account first, or use a different Steam account

#### 4. "Rate limit exceeded"

**Solution**: 
- Wait 5 minutes before trying again
- Steam API has a limit of 200 requests per 5 minutes
- Large libraries may hit this limit during initial sync

#### 5. Games not syncing

**Solution**:
- Check that games are in your Steam library (not just wishlist)
- Verify your profile is public
- Try syncing again - some games may fail due to API issues

#### 6. Achievements not showing

**Solution**:
- Not all games have Steam achievements
- Some games don't expose achievement data via API
- Achievement data may take time to sync for large libraries

### Getting Help

If you encounter issues not listed here:

1. Check the browser console for error messages
2. Verify your Steam Web API key is correct
3. Ensure your `.env.local` file is properly configured
4. Try disconnecting and reconnecting your Steam account

---

## API Rate Limits

### Steam Web API Limits

- **200 requests per 5 minutes** per API key
- Rate limiting is built into Game Hub's Steam client
- If limit is exceeded, you'll see a wait time message

### Best Practices

- **Initial sync**: May take several minutes for large libraries (100+ games)
- **Subsequent syncs**: Much faster as they only update existing data
- **Avoid rapid syncing**: Wait at least 5-10 minutes between manual syncs
- **Achievement syncing**: Adds 1-2 API calls per game with achievements

---

## FAQ

### Q: Will syncing delete my existing games?

**A**: No! Syncing only adds new games and updates existing Steam games. Games from other platforms are not affected.

### Q: Can I sync multiple Steam accounts?

**A**: No, you can only link one Steam account per Game Hub account.

### Q: What happens if I unlink my Steam account?

**A**: Your games remain in your Game Hub library. Only the Steam connection is removed. You won't be able to sync updates until you reconnect.

### Q: Does Game Hub access my Steam password?

**A**: No! Authentication uses Steam's OpenID system. Game Hub never sees or stores your Steam password.

### Q: Can I manually edit games imported from Steam?

**A**: Yes! You can edit any game details. However, the next sync will overwrite playtime and achievement data from Steam.

### Q: How accurate is the playtime tracking?

**A**: Playtime comes directly from Steam's API and is as accurate as Steam's tracking. It's converted from minutes to hours (rounded to 2 decimal places).

### Q: Why are some games missing cover art?

**A**: Game Hub uses Steam's header images. If Steam doesn't have a header image for a game, a placeholder is shown.

### Q: Can I import games from other platforms?

**A**: Steam integration is the first platform integration. Support for PlayStation Network, Xbox Live, and other platforms is planned for future updates.

### Q: Is there a limit to how many games I can sync?

**A**: No limit on Game Hub's side! However, very large libraries (1000+ games) may take longer to sync initially.

### Q: Will my friends see my Game Hub library?

**A**: No, Game Hub is private. Only you can see your game library unless you explicitly share it (feature not yet implemented).

---

## Technical Details

### Database Schema

Steam integration adds the following fields:

**Profiles Table:**
- `steam_id` - Steam ID64
- `steam_persona_name` - Steam username
- `steam_avatar_url` - Profile avatar URL
- `steam_profile_url` - Steam profile URL
- `steam_last_sync` - Last sync timestamp

**Games Table:**
- `steam_appid` - Steam App ID (unique identifier)

**User Games Table:**
- `steam_playtime_minutes` - Raw playtime from Steam
- `steam_last_played` - Last played timestamp from Steam

### API Endpoints Used

- `ISteamUser/GetPlayerSummaries/v2` - User profile info
- `IPlayerService/GetOwnedGames/v1` - Game library
- `ISteamUserStats/GetPlayerAchievements/v1` - Achievement data
- `ISteamUserStats/GetSchemaForGame/v2` - Achievement totals

---

## Support

For issues, questions, or feature requests related to Steam integration:

1. Check this documentation first
2. Review the [Troubleshooting](#troubleshooting) section
3. Check the [FAQ](#faq)
4. Consult the main [README](README.md) for general Game Hub help

---

**Last Updated**: December 2025  
**Version**: 1.0.0

