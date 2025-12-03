# Game Hub

## Vision

A unified game library aggregation platform that solves the fragmentation problem for multi-platform gamers. Instead of checking Steam, Epic, PlayStation, Xbox, EA, and other services separately, Game Hub provides a single source of truth for your entire gaming life.

## Core Problem

Multi-platform gamers face:
- Fragmented game libraries across 5+ platforms
- No unified view of achievements, playtime, or progress
- Difficulty tracking what they own, what they've finished, and what's next
- Lost context when switching between games or platforms
- No cross-platform social features or friend comparisons

## Solution Overview

Game Hub aggregates all gaming data into one dashboard, enriched with personal knowledge management tools, intelligent recommendations, and social features.

---

## Feature Taxonomy

### 1. Library Aggregation (Core Foundation)

**Unified Game Library**
- Single dashboard displaying all games across every platform
- Automatic syncing with major platforms: Steam, Epic, PlayStation, Xbox, Nintendo, EA, GOG, Ubisoft
- Manual entry for physical copies, itch.io, Patreon exclusives, emulated titles
- IGDB API integration for automatic metadata enrichment

**Per-Game Information**
- Box art and cover images
- Release date and developer/publisher
- Game description and genre tags
- Platform-specific store links (PSN Store, Steam, eShop, etc.)
- Marketplace links for retro titles (eBay, PriceCharting)
- DLC & content ownership tracker:
  - Base game vs complete edition indicators
  - Available DLC checklist with ownership status
  - Missing content notifications

**Progress Tracking**
- Achievements/trophies with earned vs unearned status
- Playtime aggregation across platforms
- Completion percentage
- Last played timestamp

---

### 2. Backlog Management

**Backlog States**
- Unplayed
- Testing (< 2 hours)
- Actively Playing
- On Hold
- Dropped
- Completed
- 100% Completed
- Speedrun/Mastery

**Priority System**
- Low / Medium / High priority levels
- Sort and filter by priority
- Time-to-beat estimates (IGDB/HowLongToBeat)
- Backlog analytics: "You have ~240 hours of backlog if you finish everything on your High Priority list"

**Now Playing Rail**
- Dashboard widget showing 3-7 current games
- Quick stats: last played, completion %, remaining achievements
- Quick access to resume playing

---

### 3. Personal Knowledge Base

**Per-Game Notes**
- Where I left off in the story
- Build ideas, strategies, puzzle solutions
- Boss weaknesses and tips
- Timestamps for returning to long RPGs

**Custom Tags**
- User-defined tags: "Co-op with partner," "Good on Steam Deck," "Kid-friendly," "VR-compatible"
- Filter library by multiple tags
- Platform-specific tags for hardware compatibility

**Ratings & Reviews**
- Personal 5-star or 1-10 rating system
- Mini-reviews for personal reference
- Private by default, shareable with friends optionally

**Custom Lists**
- Create curated collections: "Top JRPGs," "Games to replay annually," "Finish before 2026"
- Cross-platform lists that span entire library
- Share lists with friends or keep private

**Gaming Journal & Memory Archive**
- Screenshot and video clip aggregation from all platforms
- Journal entries attached to specific games (first playthrough reflections, memorable moments, co-op sessions)
- Timeline view: "Games I played during this period of my life"
- Integration with platform screenshot APIs (PlayStation, Xbox, Steam)

---

### 4. Intelligent Recommendations

**Backlog-Aware Suggestions**
- "You've been playing roguelites—here are 5 similar games you own but haven't started"
- Avoid recommending purchases; surface owned games

**Cross-Library Discovery**
- "You own X on Steam and Y on PS5—did you know Z on Game Pass is similar?"
- Find duplicates across platforms
- Highlight subscription service alternatives

**Friend-Based Recommendations**
- "5 games your friends have finished that you own but never started"
- Compare completion rates with friends

**Mood Filters**
- Short vs long games
- Chill vs intense
- Solo vs co-op
- Story-driven vs gameplay-focused

---

### 5. Social & Multiplayer

**Cross-Platform Friends List**
- Add friends regardless of platform
- Compare game libraries across all platforms
- Achievement/trophy comparison
- See what friends are playing now

**Session Planning**
- Schedule co-op sessions: "Play Elden Ring with Alex, Friday 8-10 PM"
- Sync with Google Calendar, Apple Calendar, Outlook
- Session history and recurring events

---

### 6. Shopping & Price Tracking

**Smart Wishlist**
- Unified wishlist tracking prices across ALL platforms
- Historical price data and "lowest ever" indicators
- Target price alerts via email/push notifications
- "Best deal" highlighting when same game is cheaper elsewhere

**Release Calendar**
- Track wishlisted and followed upcoming releases
- Monthly calendar view
- Pre-order reminders
- Day-one Game Pass/PS Plus additions

---

### 7. Data Sources & Integration

**Platform APIs**
- Steam Web API
- PlayStation Network API
- Xbox Live API
- Epic Games Store API
- Nintendo eShop (limited)
- GOG API
- EA/Origin API

**Metadata Enrichment**
- IGDB (Internet Games Database) - primary source
- HowLongToBeat for time estimates
- Metacritic scores (optional)
- Steam user reviews sentiment

**Limitations & Challenges**
- Some platforms lack public APIs (Nintendo, Epic have restrictions)
- Achievement data may require OAuth per platform
- Playtime tracking inconsistent across platforms
- Rate limiting on API calls
- Manual entry fallback required for unsupported sources

---

## Implementation Phases

### Phase 1: MVP (Core Library)
- Steam integration only
- Basic game library display with IGDB metadata
- Manual backlog state management
- Simple notes per game

### Phase 2: Multi-Platform
- Add PlayStation, Xbox, Epic integrations
- Cross-platform friend comparisons
- Achievement tracking
- Playtime aggregation

### Phase 3: Intelligence Layer
- Backlog recommendations
- Priority system with time estimates
- Smart filtering and search
- Custom tags and lists

### Phase 4: Social & Planning
- Session planning
- Social sharing features
- Release calendar
- Wishlist price tracking

### Phase 5: Memory & Polish
- Screenshot aggregation
- Gaming journal
- Timeline views
- Advanced analytics

---

## Success Metrics

- Active users who connect 2+ platforms
- Daily active users checking their backlog
- Games started from recommendations
- Friend invites sent
- Average session length
- Notes created per user
- Wishlist price alerts clicked

---

## Competitive Landscape

**Existing Solutions:**
- **Playnite** - Desktop-only, Windows-focused, lacks cloud sync
- **GOG Galaxy 2.0** - Good multi-platform support, but tied to GOG ecosystem
- **Backloggery** - Manual entry only, dated UI
- **HowLongToBeat** - Time tracking focus, not a library manager
- **Grouvee** - Social gaming database, limited automation

**Game Hub Differentiators:**
- Cloud-first, cross-device access
- Deep backlog management with intelligent recommendations
- Personal knowledge base integrated with library
- True cross-platform friend comparisons
- Modern, responsive UI with Next.js 15

---

## Technical Considerations

**Authentication**
- Supabase Auth for user accounts
- OAuth integration per platform (Steam, PSN, Xbox Live)
- Secure token storage for API access

**Data Storage**
- PostgreSQL (Supabase) for user data, notes, tags, lists
- Cached game metadata to reduce IGDB API calls
- Platform-specific data refreshed on login or periodic sync

**Performance**
- Server-side rendering for initial page loads
- Client-side caching of library data
- Incremental sync (only fetch updates since last sync)
- Image CDN for box art (Supabase Storage or Cloudflare)

**Privacy**
- All data private by default
- Granular sharing controls for lists, reviews, library
- No public profiles unless opted in
- GDPR-compliant data export and deletion