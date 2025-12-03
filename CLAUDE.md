# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Game Hub is a unified game library aggregation platform built with Next.js 16. The application solves the fragmentation problem for multi-platform gamers by providing a single dashboard to track games, achievements, playtime, and progress across Steam, PlayStation, Xbox, Epic Games, and other platforms.

**Current Phase**: MVP/Landing Page - The project currently has a landing page with cyber-gaming aesthetic. Future phases will implement Steam integration, multi-platform support, backlog management, and social features.

## Development Commands

```bash
# Install dependencies (uses pnpm)
pnpm install

# Run development server (default port 3000)
pnpm dev

# Run on specific port
pnpm dev --port 3001

# Build for production
pnpm build

# Start production server
pnpm start

# Lint code
pnpm lint
```

## Architecture

### Tech Stack

- **Framework**: Next.js 16.0.6 with App Router (React 19.2.0)
- **Language**: TypeScript 5.7.2 (strict mode enabled)
- **Styling**: Tailwind CSS 4.0.0 with custom theme variables
- **UI Components**: shadcn/ui (built on Radix UI primitives)
  - Available components: Button, Select, Dialog, Input, Label, Badge, Card
  - All components are customizable and live in `src/components/ui/`
- **Icons**: Lucide React
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **External API**: IGDB API for game metadata
- **Package Manager**: pnpm

### Project Structure

```
src/
├── app/
│   ├── actions/         # Server actions (auth, games)
│   ├── api/             # API routes (IGDB search)
│   ├── achievements/    # Achievements page (coming soon)
│   ├── dashboard/       # Dashboard page
│   ├── friends/         # Friends page (coming soon)
│   ├── library/         # Game library page
│   ├── login/           # Login page
│   ├── signup/          # Signup page
│   ├── stats/           # Stats page (coming soon)
│   ├── globals.css      # Tailwind theme + custom cyber-gaming design system
│   ├── layout.tsx       # Root layout with font configuration
│   └── page.tsx         # Landing page component
├── components/
│   ├── dashboard/       # Dashboard-specific components
│   │   ├── cards/       # GameCard, NowPlayingCard, StatCard
│   │   ├── DashboardHeader.tsx
│   │   ├── DashboardSidebar.tsx
│   │   ├── GameLibrary.tsx
│   │   ├── NavItem.tsx
│   │   ├── NowPlayingSection.tsx
│   │   └── StatsSection.tsx
│   ├── layouts/         # Shared layout components
│   │   └── DashboardLayout.tsx  # Shared layout with sidebar
│   ├── modals/          # Modal dialogs (Add/Edit/Delete game)
│   └── ui/              # shadcn/ui components (Button, Select, Dialog, etc.)
├── lib/
│   ├── constants/       # Shared constants (platforms, statuses)
│   ├── hooks/           # Custom React hooks (useDashboardData, useIGDBSearch)
│   ├── supabase/        # Supabase client setup
│   ├── types/           # TypeScript type definitions
│   └── utils.ts         # Utility functions (cn helper)
└── proxy.ts             # IGDB API proxy
```

### Design System

The application uses a **cyber-gaming aesthetic** with a custom color palette defined in `globals.css`:

**Color Tokens:**
- `void`, `abyss`, `deep`, `slate`, `steel` - Dark background shades (#060a0f to #252b35)
- `cyan-400/500/600/700` - Primary accent colors (#00d9ff range)
- `purple-400/500/600` - Secondary accent colors (#b845ff range)
- `emerald-400/500` - Success/completion colors (#00ff9f range)

**Typography:**
- Display font: Rajdhani (bold, geometric, uppercase headings)
- Body font: Inter (clean, readable text)
- Custom utilities: `.glow-cyan`, `.glow-purple` for text glow effects

**Visual Effects:**
- Grain texture overlay on body
- Gradient orbs and grid patterns for depth
- Border glows and card shadows with cyan/purple accents
- Smooth animations using CSS transitions and keyframes

### Path Aliases

- `@/*` maps to `./src/*`

### Image Configuration

Next.js is configured to allow images from:
- `images.igdb.com` (for future game cover art from IGDB API)

## Key Implementation Notes

### Fonts

The app uses Google Fonts via Next.js Font optimization:
- `Inter` for body text with CSS variable `--font-inter`
- `Rajdhani` (weights 300-700) for display text with CSS variable `--font-rajdhani`

Both fonts are loaded in `layout.tsx` and applied via CSS variables to maintain consistency across the design system.

### Tailwind CSS 4.0

This project uses Tailwind CSS 4.0, which has a different configuration approach:
- Theme is defined using `@theme` directive in `globals.css`
- Uses `@import "tailwindcss"` instead of traditional directives
- PostCSS config uses `@tailwindcss/postcss` plugin
- Custom color tokens are prefixed with `--color-`

### Component Patterns

Currently, the landing page demonstrates:
- Fixed header with backdrop blur and transparent background
- Centered hero layout with large typography
- Gradient text using `bg-gradient-to-r` with `bg-clip-text`
- Feature stat cards with hover effects
- Background effects (animated orbs, grid patterns) using fixed positioning

## Future Architecture (from Overview.md)

The following features are planned but not yet implemented:

**Phase 1 (MVP)**: Steam integration, basic library display with IGDB metadata, manual backlog management, per-game notes

**Phase 2**: Multi-platform support (PlayStation, Xbox, Epic), cross-platform friend comparisons, achievement tracking

**Phase 3**: Intelligent recommendations, priority system, custom tags and lists

**Phase 4**: Session planning, social features, release calendar, price tracking

**Phase 5**: Screenshot aggregation, gaming journal, timeline views

### Planned Data Sources

- Steam Web API
- PlayStation Network API
- Xbox Live API
- Epic Games Store API
- Nintendo eShop (limited)
- GOG API
- EA/Origin API
- IGDB (Internet Games Database) for metadata enrichment

## Development Guidelines

### Type Safety

TypeScript strict mode is enabled. Avoid using:
- `any` types
- Non-null assertion operator (`!`)
- Type assertions (`as Type`) unless absolutely necessary

### Styling

- Use Tailwind utility classes for styling
- Reference custom color tokens: `bg-void`, `text-cyan-400`, `border-steel`, etc.
- Use custom utilities for effects: `.glow-cyan`, `.glow-purple`, `.border-glow`, `.card-glow`
- Follow the cyber-gaming aesthetic with dark backgrounds and cyan/purple accents

### Component Development

- Use `'use client'` directive for components requiring interactivity
- Import icons from `lucide-react`
- Follow the established pattern of gradient buttons with hover effects
- Use Rajdhani font (via CSS variable) for headings and display text
