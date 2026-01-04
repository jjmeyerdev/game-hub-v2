# Game Hub - Complete Features Documentation

**Version:** 1.0.0
**Last Updated:** December 27, 2025
**Current Phase:** Phase 3 (Intelligence)

---

## Table of Contents

1. [Overview](#overview)
2. [Platform Integrations](#platform-integrations)
3. [Library Management](#library-management)
4. [Achievement System](#achievement-system)
5. [Friend Comparison](#friend-comparison)
6. [Backlog Management](#backlog-management)
7. [Game Sessions](#game-sessions)
8. [Settings & Configuration](#settings--configuration)
9. [User Interface](#user-interface)
10. [Phase Roadmap](#phase-roadmap)

---

## Overview

Game Hub is a unified game library aggregation platform that solves the fragmentation problem for multi-platform gamers. It provides a single dashboard to track games, achievements, playtime, and progress across multiple gaming platforms.

### Core Value Proposition

- **Unified Library View**: See all your games from Steam, PlayStation, Xbox, and Epic Games in one place
- **Cross-Platform Achievement Tracking**: Track achievements/trophies across all platforms
- **Friend Comparison**: Compare your gaming stats with friends on any platform
- **Smart Backlog Management**: Prioritize your gaming backlog with status tracking
- **Session Tracking**: Track your active gaming sessions in real-time
- **IGDB Metadata Enrichment**: Automatically enhance game data with covers, descriptions, and more

---

## Platform Integrations

### Steam Integration

**Status:** Complete (Phase 1)

Steam integration provides full library synchronization with comprehensive data fetching.

#### Features

| Feature | Description |
|---------|-------------|
| **Library Sync** | Fetches all owned games including free-to-play titles |
| **Playtime Tracking** | Imports total and recent playtime data |
| **Achievement Sync** | Tracks all earned achievements with percentages |
| **Profile Import** | Imports Steam profile, persona name, and avatar |
| **Real-time Status** | Detects currently playing games for session tracking |

#### Authentication

- Uses Steam OpenID for authentication
- Requires Steam Web API key (server-side)
- User profile must be set to public for game details

#### Rate Limiting

- **Limit:** 200 requests per 5 minutes
- Automatic rate limiting with queue management
- Cached responses for 5 minutes to reduce API calls

#### Data Synced

```typescript
interface SteamSyncData {
  games: {
    appid: number;
    name: string;
    playtime_forever: number;      // Total playtime in minutes
    playtime_2weeks?: number;      // Recent playtime
    img_icon_url: string;
    img_logo_url: string;
    rtime_last_played?: number;    // Unix timestamp
  }[];
  achievements: {
    apiname: string;
    achieved: number;              // 0 or 1
    unlocktime: number;
  }[];
  profile: {
    steamid: string;
    personaname: string;
    avatarfull: string;
    profileurl: string;
  };
}
```

---

### PlayStation Network Integration

**Status:** Complete (Phase 2)

PlayStation Network integration supports trophy tracking and library synchronization across all PlayStation platforms.

#### Features

| Feature | Description |
|---------|-------------|
| **Trophy Sync** | Full trophy data with bronze, silver, gold, and platinum counts |
| **Library Sync** | All games with trophy data across PS5, PS4, PS3, PS Vita, PSP |
| **Playtime Tracking** | Play duration via getUserPlayedGames API |
| **Profile Import** | PSN Online ID, avatar, trophy level |
| **Trophy Details** | Individual trophy names, descriptions, icons, rarity |
| **User Search** | Search PSN users by Online ID for friend comparison |

#### Authentication

- NPSSO token-based authentication
- OAuth2 flow with access token and refresh token
- Auto-refresh of expired tokens

#### Rate Limiting

- **Limit:** 30 requests per minute (conservative)
- Automatic rate limiting with wait time calculation

#### Platform Normalization

Games are categorized by their original PlayStation platform:

| Platform String | Normalized To |
|-----------------|---------------|
| PS5 | PlayStation (PS5) |
| PS4 | PlayStation (PS4) |
| PS3 | PlayStation (PS3) |
| VITA | PlayStation (PS Vita) |
| PSP | PlayStation (PSP) |

#### Trophy Types

```typescript
interface PsnTrophy {
  trophyId: number;
  trophyType: 'bronze' | 'silver' | 'gold' | 'platinum';
  trophyName: string;
  trophyDetail: string;
  trophyIconUrl: string;
  earned: boolean;
  earnedDateTime?: string;
  trophyEarnedRate?: string;    // Global completion percentage
  trophyRare?: number;          // Rarity tier
}
```

---

### Xbox Live Integration

**Status:** Complete (Phase 2)

Xbox integration via OpenXBL API provides comprehensive Xbox gaming data.

#### Features

| Feature | Description |
|---------|-------------|
| **Library Sync** | Title history with device/platform tracking |
| **Achievement Sync** | Full achievement data with gamerscore values |
| **Profile Import** | Gamertag, avatar, gamerscore, account tier |
| **User Search** | Search Xbox users by gamertag |
| **Cross-Gen Support** | Supports Xbox Series X|S, Xbox One, Xbox 360 |

#### Authentication

- OpenXBL API key authentication
- User provides their own API key from xbl.io

#### Rate Limiting

- **Limit:** 30 requests per minute
- Matches PSN rate limiting for consistency

#### Platform Normalization

Games are identified by their original platform:

| Device Array | Normalized To |
|--------------|---------------|
| Xbox360 | Xbox (Xbox 360) |
| XboxOne | Xbox (Xbox One) |
| XboxSeriesXS / Scarlett | Xbox (Xbox Series X\|S) |
| PC | PC |

#### Achievement Data

```typescript
interface XboxAchievement {
  id: string;
  serviceConfigId: string;
  name: string;
  titleAssociations: {
    name: string;
    id: number;
  }[];
  progressState: 'Achieved' | 'NotStarted' | 'InProgress';
  progression: {
    requirements: {
      id: string;
      current: string;
      target: string;
    }[];
    timeUnlocked: string;
  };
  mediaAssets: {
    name: string;
    type: string;
    url: string;
  }[];
  rewards: {
    name: string;
    description: string;
    value: string;      // Gamerscore value
    type: 'Gamerscore';
  }[];
}
```

---

### Epic Games Integration

**Status:** Complete (Phase 2)

Epic Games Store integration for library synchronization.

#### Features

| Feature | Description |
|---------|-------------|
| **Library Sync** | Full game library with pagination support |
| **Account Linking** | OAuth flow for account connection |
| **Metadata Enrichment** | IGDB fallback for game metadata |
| **DLC Filtering** | Filters out DLC and non-game content |

#### Limitations

- **No Playtime Data**: Epic Games API does not provide playtime information
- **No Achievements**: Epic Games has no achievement system

#### Authentication

- OAuth authorization code flow
- Access token with refresh token support
- Token expiration tracking

---

## Library Management

### Game Organization

The library supports multiple organizational features:

#### Platforms Supported

| Platform | Sync | Manual | Console Variants |
|----------|------|--------|------------------|
| Steam | Yes | Yes | - |
| PlayStation | Yes | Yes | PS5, PS4, PS3, PS2, PS1, PS Vita, PSP |
| Xbox | Yes | Yes | Series X\|S, One, 360, Original |
| Epic Games | Yes | Yes | - |
| Nintendo | - | Yes | Switch 2, Switch, Wii U, 3DS |
| EA App | - | Yes | - |
| Battle.net | - | Yes | - |
| GOG | - | Yes | - |
| Ubisoft Connect | - | Yes | - |
| Physical | - | Yes | All console variants |

#### Game Statuses

| Status | Description | Icon |
|--------|-------------|------|
| Unplayed | Not yet started | ○ |
| Playing | Currently in progress | ▶ |
| Played | Started but not completed | ● |
| Completed | Main story/campaign finished | ✓ |
| Finished | 100% completed including extras | ⚑ |
| On Hold | Paused, may return later | ⏸ |

#### Priority Levels

| Priority | Description | Color |
|----------|-------------|-------|
| High | Play next | Red |
| Medium | When ready | Amber |
| Low | Someday | Blue |
| None | No priority set | Gray |
| Finished | Completed games | Emerald |

### Filtering & Sorting

#### Filter Options

- **Platform**: Filter by any supported platform
- **Console**: Filter by specific console (e.g., PS5, Xbox 360)
- **Status**: Filter by game status
- **Priority**: Filter by priority level
- **Sync Source**: Filter by how game was added (Steam, PSN, Xbox, Epic, Manual)
- **Tags**: Filter by custom tags
- **Hidden Games**: Toggle visibility of hidden games

#### Sort Options

| Sort | Description |
|------|-------------|
| Title A-Z | Alphabetical ascending |
| Title Z-A | Alphabetical descending |
| Recently Played | Most recently played first |
| Completion High-Low | Highest completion percentage first |
| Completion Low-High | Lowest completion percentage first |
| Playtime High-Low | Most playtime first |
| Playtime Low-High | Least playtime first |
| Priority High | Highest priority first |
| Priority Low | Lowest priority first |
| Release Newest | Newest release date first |
| Release Oldest | Oldest release date first |

### Game Details

Each game entry contains:

```typescript
interface UserGame {
  // Identity
  id: string;
  user_id: string;
  game_id: string;

  // Platform Info
  platform: string;
  ownership_status: 'owned' | 'wishlist' | 'unowned';
  is_physical: boolean;
  hidden: boolean;

  // Progress
  status: 'unplayed' | 'playing' | 'played' | 'completed' | 'finished' | 'on_hold';
  priority: 'high' | 'medium' | 'low' | 'none' | 'finished';
  completion_percentage: number;
  playtime_hours: number;
  last_played_at: Date;

  // Personal Data
  personal_rating: number;      // 1-10
  notes: string;
  tags: string[];
  locked_fields: Record<string, boolean>;

  // Achievements
  achievements_earned: number;
  achievements_total: number;

  // Platform-specific IDs
  steam_appid?: number;
  xbox_title_id?: string;
  psn_title_id?: string;

  // Timestamps
  created_at: Date;
  updated_at: Date;
  completed_at?: Date;
}
```

### IGDB Metadata Enrichment

Games are automatically enriched with metadata from IGDB (Internet Games Database):

#### Data Enriched

- **Cover Art**: High-quality game covers
- **Description**: Game summary
- **Release Date**: Platform-specific release dates
- **Developer**: Studio that developed the game
- **Publisher**: Publishing company
- **Genres**: Game genres/categories

#### Field Locking

Users can lock specific fields to prevent automatic updates:

- Cover image
- Description
- Developer
- Publisher
- Release date
- Genres

#### Enrichment Process

1. Search IGDB by game title
2. Select best match based on platform
3. Extract only missing/empty fields
4. Update database with new data
5. Respect locked fields

---

## Achievement System

### Overview

The achievement system provides a unified view of achievements/trophies across all platforms.

### Achievement Statistics

```typescript
interface AchievementStats {
  totalEarned: number;
  totalAvailable: number;
  completionPercentage: number;
  gamesWithAchievements: number;
  perfectGames: number;

  platformStats: {
    steam: PlatformStats;
    psn: PlatformStats;
    xbox: PlatformStats;
  };

  topCompletedGames: Array<{
    userGame: UserGame;
    percentage: number;
  }>;

  almostComplete: Array<{
    userGame: UserGame;
    percentage: number;
    remaining: number;
  }>;
}
```

### Features

| Feature | Description |
|---------|-------------|
| **Total Tracking** | Aggregate achievement counts across all platforms |
| **Per-Platform Stats** | Breakdown by Steam, PSN, and Xbox |
| **Perfect Games** | Games with 100% achievement completion |
| **Almost Complete** | Games at 90-99% completion |
| **Hall of Fame** | Display of perfect games |

### Automatic Completion Detection

When a game reaches 100% achievement completion during sync:
1. Status is automatically set to "Completed"
2. `completed_at` timestamp is set
3. Game appears in the Hall of Fame

---

## Friend Comparison

### Overview

Compare your gaming progress with friends across different platforms.

### Features

| Feature | Description |
|---------|-------------|
| **Cross-Platform Search** | Search users on PSN, Xbox, and Steam |
| **Side-by-Side Stats** | Compare total games, achievements, playtime |
| **Common Games** | Find games you both own |
| **Progress Comparison** | Compare achievement progress on shared games |
| **Platform-Specific Stats** | Trophy level (PSN), Gamerscore (Xbox) |

### User Search

```typescript
interface CompareUserResult {
  platform: 'steam' | 'psn' | 'xbox';
  id: string;                    // Steam ID, Account ID, or XUID
  username: string;              // Display name
  avatar?: string;               // Avatar URL

  // Platform-specific
  trophyLevel?: number;          // PSN trophy level
  gamerscore?: number;           // Xbox gamerscore
}
```

### Comparison Data

```typescript
interface ComparisonResult {
  user: CompareUserResult;
  friend: CompareUserResult;

  commonGames: Array<{
    title: string;
    userProgress: number;
    friendProgress: number;
    userPlatform: string;
    friendPlatform: string;
  }>;

  stats: {
    user: {
      totalGames: number;
      totalAchievements: number;
      totalPlaytime: number;
    };
    friend: {
      totalGames: number;
      totalAchievements: number;
      totalPlaytime: number;
    };
  };
}
```

### Limitations

- Steam achievement comparison limited to top 20 games (rate limiting)
- Self-comparison is prevented
- User profiles must be public for data access

---

## Backlog Management

### Overview

The backlog page provides a Kanban-style interface for managing your gaming priorities.

### Kanban Columns

| Column | Priority | Description |
|--------|----------|-------------|
| **Play Next** | High | Games you want to play immediately |
| **When Ready** | Medium | Games for when you have time |
| **Someday** | Low | Games for the distant future |
| **Finished** | Finished | Completed games |

### Features

| Feature | Description |
|---------|-------------|
| **Collapsible Columns** | Expand/collapse priority columns |
| **Search** | Search games by title |
| **Filter by Tags** | Filter games by custom tags |
| **Quick Actions** | Start playing, change priority |
| **Status Badges** | Visual status indicators |
| **Completion Progress** | Progress bars for each game |

### Quick Actions

- **Start Playing**: Sets status to "Playing" and opens game
- **Change Priority**: Move between Kanban columns
- **Edit Game**: Open game edit modal
- **View Details**: Navigate to game detail page

---

## Game Sessions

### Overview

Track your active gaming sessions with real-time detection.

### Features

| Feature | Description |
|---------|-------------|
| **Auto-Detection** | Detects Steam games currently running |
| **Manual Start** | Start sessions for any PC platform game |
| **Duration Tracking** | Track session length in real-time |
| **Session History** | View past gaming sessions |

### Session Data

```typescript
interface GameSession {
  id: string;
  user_id: string;
  game_id: string;
  user_game_id: string;

  started_at: Date;
  ended_at?: Date;
  duration_minutes?: number;

  status: 'active' | 'completed';
  platform: string;
  steam_appid?: number;
}
```

### Supported Platforms for Sessions

PC platforms that support session tracking:
- Steam (auto-detection)
- Epic Games (manual)
- EA App (manual)
- Battle.net (manual)
- GOG (manual)
- Xbox Game Pass (manual)

---

## Settings & Configuration

### Account Settings

- Profile information (name, avatar)
- Email and password management
- Account deletion

### Platform Connections

#### Steam Settings

- Link/unlink Steam account
- View connected Steam ID
- Trigger library sync
- View last sync timestamp

#### PlayStation Settings

- NPSSO token authentication
- Link/unlink PSN account
- View connected PSN ID
- Trophy level display
- Trigger library sync

#### Xbox Settings

- OpenXBL API key authentication
- Link/unlink Xbox account
- View connected gamertag
- Gamerscore display
- Trigger library sync

#### Epic Games Settings

- OAuth authentication
- Link/unlink Epic account
- View connected display name
- Trigger library sync

### Library Management

#### Batch Operations

- **Enrich All Games**: Update metadata from IGDB
- **Refresh Release Dates**: Update platform-specific release dates
- **Find Duplicates**: Detect potential duplicate games
- **Merge Games**: Combine duplicate entries

#### Duplicate Detection

The system detects potential duplicates using:
- Normalized title comparison
- Cross-platform matching
- User can dismiss non-duplicates
- Dismissed pairs stored for future exclusion

### Sync Logs

View history of all platform syncs:
- Sync timestamp
- Platform synced
- Games added/updated
- Errors encountered

---

## User Interface

### Design System

#### Color Palette

**Dark Mode (Cyber Gaming Theme)**

| Token | Color | Usage |
|-------|-------|-------|
| void | #030304 | Primary background |
| abyss | #0a0a0b | Secondary background |
| deep | #0f1011 | Tertiary background |
| slate | #161719 | Elevated surfaces |
| steel | #1e2023 | Borders |
| cyan-500 | #00d9ff | Primary accent |
| violet-500 | #9333ea | Secondary accent |
| emerald-500 | #10b981 | Success states |
| amber-500 | #f59e0b | Warning states |

**Light Mode (Refined Tech)**

| Token | Color | Usage |
|-------|-------|-------|
| background | #faf9f7 | Primary background |
| card | #ffffff | Card surfaces |
| text-primary | #1a1a1a | Primary text |
| text-muted | #6b6b6b | Secondary text |
| accent-cyan | #0891b2 | Primary accent |
| accent-violet | #7c3aed | Secondary accent |

#### Typography

- **Display Font**: Rajdhani (headings, bold, geometric)
- **Body Font**: Inter (readable text)

#### Visual Effects

- Noise texture overlay
- Gradient orbs
- Glow effects (.glow-cyan, .glow-violet)
- Card shadows
- Smooth animations

### Pages

| Page | Route | Description |
|------|-------|-------------|
| Landing | / | Marketing homepage |
| Dashboard | /dashboard | Overview and quick stats |
| Library | /library | Full game library |
| Backlog | /backlog | Kanban backlog manager |
| Achievements | /achievements | Achievement statistics |
| Friends | /friends | Friend comparison |
| Stats | /stats | Playtime analytics |
| Settings | /settings | Account & platform settings |
| Game Detail | /game/[id] | Individual game details |

### Responsive Design

- Mobile-first approach
- Responsive breakpoints (sm, md, lg, xl)
- Collapsible sidebar navigation
- Touch-friendly interactions

---

## Phase Roadmap

### Phase 1: Foundation (100% Complete)

| Feature | Status |
|---------|--------|
| Steam library sync | Complete |
| IGDB metadata enrichment | Complete |
| Manual backlog management | Complete |
| Per-game notes & status | Complete |
| Basic dashboard | Complete |

### Phase 2: Multi-Platform (100% Complete)

| Feature | Status |
|---------|--------|
| PlayStation Network sync | Complete |
| Xbox Live integration | Complete |
| Epic Games integration | Complete |
| Cross-platform friend comparison | Complete |
| Unified achievement tracking | Complete |

### Phase 3: Intelligence (35% Complete)

| Feature | Status |
|---------|--------|
| Priority queue system | Complete |
| Custom tags | Complete |
| Custom lists | Schema only |
| Smart recommendations | Not started |
| Playtime analytics visualizations | Partial |

### Phase 4: Social (5% Planned)

| Feature | Status |
|---------|--------|
| Persistent friend lists | Planned |
| Activity feeds | Planned |
| Leaderboards | Planned |
| Session planning | Planned |
| Release calendar | Planned |
| Price tracking | Planned |

### Phase 5: Journal (0% Planned)

| Feature | Status |
|---------|--------|
| Screenshot aggregation | Planned |
| Gaming journal | Planned |
| Timeline views | Planned |

---

## Technical Details

### Tech Stack

- **Framework**: Next.js 16.0.6 with App Router
- **Language**: TypeScript 5.7.2 (strict mode)
- **Styling**: Tailwind CSS 4.0
- **UI Components**: shadcn/ui (Radix UI)
- **Backend**: Supabase (PostgreSQL)
- **External API**: IGDB for metadata

### Environment Variables

| Variable | Description |
|----------|-------------|
| STEAM_WEB_API_KEY | Steam Web API key |
| IGDB_CLIENT_ID | Twitch/IGDB Client ID |
| IGDB_CLIENT_SECRET | Twitch/IGDB Client Secret |
| NEXT_PUBLIC_SUPABASE_URL | Supabase project URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase anonymous key |
| SUPABASE_SERVICE_ROLE_KEY | Supabase service role key |

---

*Documentation generated December 27, 2025*
