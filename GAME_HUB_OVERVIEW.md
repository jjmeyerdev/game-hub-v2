# Game Hub

**A unified game library aggregation platform for multi-platform gamers**

---

## What is Game Hub?

Game Hub solves the fragmentation problem for gamers who play across multiple platforms. Instead of checking Steam, PlayStation, Xbox, and other services separately, Game Hub provides a single dashboard to track your entire gaming library, progress, achievements, and playtime.

---

## Implemented Features

### Authentication & User Management
- Secure sign up and login with email/password
- Session management with Supabase Auth
- Personalized dashboard with greeting messages

### Dashboard
- **Stats Overview**: Total games, hours played, completion rate, achievements at a glance
- **Now Playing Section**: Quick access to games you're currently playing
- **Game Library**: Full library view with advanced filtering and sorting

### Game Library Management
- **Add Games**: Search the IGDB database for any game with cover art and metadata
- **Edit Games**: Update status, progress, playtime, notes, and more
- **Delete Games**: Remove games from your library
- **Platforms Supported**: Steam, PlayStation, Xbox, Windows, Epic, EA App, Battle.net, Physical

### Game Detail Pages
- Comprehensive view for each game in your library
- Track completion percentage (0-100%)
- Set game status: Playing, Backlog, Completed, 100% Completed, On Hold, Dropped
- Add personal notes and reviews
- View platform, playtime, and achievement progress

### Steam Integration
- **Account Linking**: Connect your Steam account via OAuth
- **Library Sync**: Import your entire Steam library with one click
- **Session Tracking**: Real-time detection of currently playing Steam games
- **Achievement Sync**: Pull in your Steam achievements automatically
- **Cover Art**: High-quality game covers from Steam

### Privacy Features
- **Hidden Games**: Mark any game as hidden to keep it private
- **Censorship Blur**: Toggle blur effect on hidden game covers and titles
- **Separate View**: Dedicated toggle to view only hidden games

### Backlog Priority System
- Set priority levels: High, Medium, Low
- Filter library by priority
- Sort games by priority order
- Visual indicators on game cards

### Design
- Cyber-gaming aesthetic with dark theme
- Cyan and purple accent colors
- Smooth animations and transitions
- Responsive layout for all screen sizes

---

## Coming Soon

### Phase 2: Multi-Platform Support
- PlayStation Network integration
- Xbox Live integration
- Epic Games Store sync
- Cross-platform library unification

### Phase 3: Analytics & Recommendations
- Detailed playtime analytics and charts
- Intelligent game recommendations
- Smart filtering based on play patterns
- Backlog insights and suggestions

### Phase 4: Social Features
- Friend connections across platforms
- Compare libraries and achievements
- Activity feeds
- Leaderboards

### Phase 5: Advanced Features
- Screenshot aggregation from all platforms
- Gaming journal and session notes
- Timeline views of gaming history
- Release calendar and wishlists

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS 4.0 |
| Backend | Supabase (PostgreSQL, Auth) |
| Game Data | IGDB API |
| Icons | Lucide React |

---

*Game Hub is currently in active development. New features are being added regularly.*
