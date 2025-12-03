# 🎮 Game Hub

<div align="center">

![Game Hub Banner](https://img.shields.io/badge/Game-Hub-00D9FF?style=for-the-badge&logo=gamepad&logoColor=white)

**Your Gaming Library, Unified**

Track your entire game collection across Steam, PlayStation, Xbox, Epic Games, and more.  
All your games, achievements, and playtime in one beautiful dashboard.

[![Next.js](https://img.shields.io/badge/Next.js-16.0.6-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0.0-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)

</div>

---

## ✨ Features

### 🎯 Core Functionality
- **Multi-Platform Support** - Track games from 10+ platforms:
  - 🎮 Steam, Epic Games, EA App, Battle.net
  - 🎮 PlayStation (PS1-PS5 Pro)
  - 🎮 Xbox (Original-Series X/S)
  - 🎮 Nintendo (Switch, 3DS, Wii U)
  - 💿 Physical copies
  - 🪟 Windows (standalone)

- **Game Management**
  - Add games manually or via IGDB API search
  - Edit game information with real-time IGDB data
  - Track playtime, completion percentage, and personal ratings
  - Organize by status: Unplayed, Playing, Completed, On Hold
  - Add personal notes and reviews

- **Smart Dashboard**
  - Beautiful, responsive game library with cover art
  - Filter by platform and console
  - Sort by title, date added, completion, or playtime
  - "Now Playing" section for active games
  - Real-time statistics and progress tracking

- **IGDB Integration**
  - Automatic game data fetching (cover art, developer, description, genres)
  - Platform-specific search results
  - Bulk import with IGDB enrichment
  - Update existing games with latest IGDB data

### 🎨 Design
- Modern, cyberpunk-inspired UI with cyan/purple gradients
- Smooth animations and transitions
- Responsive design (mobile, tablet, desktop)
- Dark theme optimized for gaming
- Custom scrollbars and hover effects

### 🔒 Authentication
- Secure user authentication via Supabase Auth
- Email/password registration and login
- Protected routes and user sessions
- Row-level security (RLS) policies

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 20+ and **pnpm** installed
- **Supabase** account ([supabase.com](https://supabase.com))
- **IGDB API** credentials ([api.igdb.com](https://api.igdb.com))

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd game-hub
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Set up environment variables**
```bash
cp env.example .env.local
```

Edit `.env.local` with your credentials:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# IGDB API (from Twitch Developer Console)
IGDB_CLIENT_ID=your_twitch_client_id
IGDB_CLIENT_SECRET=your_twitch_client_secret
```

4. **Set up the database**
```bash
# Deploy the schema to Supabase
pnpm db:deploy

# Verify the deployment
pnpm db:verify
```

5. **Run the development server**
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser! 🎉

---

## 📚 Documentation

### Setup Guides
- **[Quick Start Guide](QUICK_START.md)** - Get up and running in 5 minutes
- **[IGDB Setup](IGDB_SETUP.md)** - Configure IGDB API access
- **[Database Schema](supabase/README.md)** - Understanding the data structure

### Import & Management
- **[Import Games Guide](IMPORT_GAMES_GUIDE.md)** - Bulk import your game library
- **[IGDB Import](scripts/IMPORT_WITH_IGDB_README.md)** - Import with automatic IGDB data
- **[Update Games](scripts/UPDATE_GAMES_README.md)** - Refresh game data from IGDB
- **[Platform Mapping](scripts/PLATFORM_MAPPING.md)** - Platform naming conventions

### Development
- **[Project Overview](Overview.md)** - Architecture and design decisions
- **[Claude AI Context](CLAUDE.md)** - AI assistant guidelines and patterns

---

## 🏗️ Tech Stack

### Frontend
- **[Next.js 16](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://react.dev/)** - UI library with latest features
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe development
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first styling
- **[Radix UI](https://www.radix-ui.com/)** - Accessible component primitives
- **[Lucide Icons](https://lucide.dev/)** - Beautiful icon library

### Backend
- **[Supabase](https://supabase.com/)** - Backend as a Service
  - PostgreSQL database
  - Authentication & authorization
  - Row Level Security (RLS)
  - Real-time subscriptions
  - Storage for assets

### APIs
- **[IGDB API](https://api.igdb.com/)** - Game database and metadata
- **Next.js API Routes** - Server-side endpoints

### Development Tools
- **[pnpm](https://pnpm.io/)** - Fast, disk space efficient package manager
- **[ESLint](https://eslint.org/)** - Code linting
- **[tsx](https://github.com/privatenumber/tsx)** - TypeScript execution for scripts

---

## 📁 Project Structure

```
game-hub/
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── page.tsx              # Landing page
│   │   ├── dashboard/            # Main dashboard
│   │   ├── library/              # Full game library
│   │   ├── login/                # Authentication pages
│   │   ├── signup/
│   │   ├── actions/              # Server actions
│   │   │   ├── auth.ts           # Auth operations
│   │   │   └── games.ts          # Game CRUD operations
│   │   └── api/                  # API routes
│   │       └── igdb/search/      # IGDB search endpoint
│   ├── components/
│   │   ├── dashboard/            # Dashboard-specific components
│   │   │   ├── cards/            # Game cards, stat cards
│   │   │   ├── DashboardHeader.tsx
│   │   │   ├── DashboardSidebar.tsx
│   │   │   └── GameLibrary.tsx
│   │   ├── layouts/              # Layout components
│   │   ├── modals/               # Modal dialogs
│   │   │   ├── AddGameModal.tsx
│   │   │   ├── EditGameModal.tsx
│   │   │   ├── DeleteConfirmModal.tsx
│   │   │   └── BaseModal.tsx
│   │   └── ui/                   # Reusable UI components
│   └── lib/
│       ├── constants/            # Platform configs, statuses
│       ├── hooks/                # Custom React hooks
│       │   ├── useDashboardData.ts
│       │   └── useIGDBSearch.ts
│       ├── supabase/             # Supabase clients
│       ├── types/                # TypeScript types
│       └── utils.ts              # Utility functions
├── supabase/
│   ├── schema.sql                # Database schema
│   ├── migrations/               # Schema migrations
│   └── README.md
├── scripts/                      # Utility scripts
│   ├── import-games.ts           # Basic game import
│   ├── import-games-with-igdb.ts # Import with IGDB data
│   ├── update-games-from-igdb.ts # Update existing games
│   └── verify-import.ts          # Verify imports
└── public/                       # Static assets
```

---

## 🎮 Usage

### Adding Games

**Option 1: IGDB Search (Recommended)**
1. Click "Add Game" button
2. Search for your game using the IGDB search bar
3. Select the correct platform version
4. Click to auto-fill game details
5. Adjust status and optional fields
6. Save!

**Option 2: Manual Entry**
1. Click "Add Game" button
2. Enter game title manually
3. Select platform and console
4. Fill in optional details (cover URL, developer, etc.)
5. Save!

### Editing Games
1. Hover over any game card
2. Click the edit icon (top-right)
3. Update information or search IGDB for fresh data
4. Save changes

### Filtering & Sorting
- **Filter by Platform**: Use the platform pills at the top
- **Sort Options**: 
  - Title (A-Z / Z-A)
  - Recently Added
  - Completion (High-Low / Low-High)
  - Playtime (High-Low / Low-High)

### Bulk Import
See [IMPORT_GAMES_GUIDE.md](IMPORT_GAMES_GUIDE.md) for importing large game lists.

---

## 🛠️ Available Scripts

### Development
```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run TypeScript type checking
```

### Database
```bash
pnpm db:deploy    # Deploy schema to Supabase
pnpm db:verify    # Verify schema deployment
pnpm db:migrate   # Apply migrations
```

### Game Management
```bash
pnpm import-games           # Import from game_list_alphabetized.txt
pnpm import-with-igdb       # Import with IGDB data enrichment
pnpm update-games           # Update existing games from IGDB
pnpm verify-import          # Verify imported games
```

---

## 🎨 Color Palette

The Game Hub uses a cyberpunk-inspired color scheme:

```css
/* Primary Colors */
--void: #0A0E27        /* Deep background */
--abyss: #0F172A       /* Card backgrounds */
--deep: #1E293B        /* Input backgrounds */
--slate: #334155       /* Borders */
--steel: #475569       /* Hover borders */

/* Accent Colors */
--cyan: #06B6D4        /* Primary accent */
--purple: #A855F7      /* Secondary accent */
--emerald: #10B981     /* Success states */
```

---

## 🔐 Security

- **Row Level Security (RLS)** enabled on all tables
- **Server-side authentication** checks
- **Environment variables** for sensitive data
- **Protected API routes** with authentication
- **Service role key** used only in server-side scripts

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style
- Use TypeScript for all new code
- Add comments for complex logic
- Test your changes thoroughly
- Update documentation as needed

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **[IGDB](https://www.igdb.com/)** - Comprehensive game database
- **[Supabase](https://supabase.com/)** - Amazing backend platform
- **[Vercel](https://vercel.com/)** - Seamless deployment
- **[Radix UI](https://www.radix-ui.com/)** - Accessible components
- **[Lucide](https://lucide.dev/)** - Beautiful icons

---

## 📧 Support

Having issues? Check out:
- [Quick Start Guide](QUICK_START.md)
- [IGDB Setup Guide](IGDB_SETUP.md)
- [Database Schema Docs](supabase/README.md)

---

<div align="center">

**Built with ❤️ for gamers, by gamers**

Made with [Next.js](https://nextjs.org/) • [Supabase](https://supabase.com/) • [Tailwind CSS](https://tailwindcss.com/)

</div>

