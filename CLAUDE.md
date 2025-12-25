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

## AI Rules & Coding Conventions

### Core Architectural Rules

- **Prioritize Server Components (RSC)**: Server Components should be the default. Use `"use client"` only when necessary for interactions like event handlers, effects, or browser-specific APIs (e.g., local storage).
- **Minimize Client-Side Logic**: Avoid client-side data fetching (`useEffect`, `useState` with fetch) if possible. Leverage Next.js data fetching methods within Server Components or Server Actions.
- **Use the App Router**: Structure your application using the `app/` directory for all routing and project structure.
- **Implement Streaming with Suspense**: Wrap client components or data-fetching components with `<Suspense fallback={<LoadingComponent />}>` to improve perceived performance and enable streaming.

### Code Style and Standards

- **Use TypeScript Exclusively**: All code should be written in TypeScript (`.ts`, `.tsx`). Prefer interfaces over types for object shapes, and use `unknown` with runtime checks instead of `any`.
- **Functional Programming**: Favor functional components and functional, declarative programming patterns. Avoid classes.
- **File Structure**: Keep files concise (around 150 lines). Structure files with the exported component first, followed by subcomponents, helpers, and types/interfaces at the end.
- **Naming Conventions**:
  - Use lowercase with dashes for directories (e.g., `components/auth-wizard`).
  - Favor named exports for components over default exports.
  - Use descriptive variable names (e.g., `isLoading`, `hasError`).

### Performance and Optimization

- **Image Optimization**: Use the Next.js `Image` component for all images. Always include `alt`, `width`, and `height` properties or use `fill`, and prefer the WebP format when possible.
- **Font Optimization**: Use `next/font` for automatic optimization of local and Google fonts; avoid manual `<link>` tags.
- **Minimize JavaScript**: Aim to ship minimal JavaScript to the browser by leveraging server-side rendering and static generation capabilities.
- **Optimize Web Vitals**: Regularly run Lighthouse and address performance bottlenecks, focusing on LCP, CLS, and FID.

### Error Handling and Security

- **Sanitize User Input**: Always sanitize user inputs and use validation libraries like Zod to prevent XSS and other vulnerabilities.
- **Implement Error Boundaries**: Use `error.tsx` files to handle unexpected errors gracefully in the UI.
- **Handle Errors Early**: Use guard clauses and early returns for expected error conditions to avoid deeply nested logic.
- **Prioritize Security Reviews**: For high-risk areas (authentication, user input), enforce a mandatory security review as part of the process. Use `<SECURITY_REVIEW>` tag to flag code requiring security attention.

### Tailwind CSS v4 Rules

- **Specify the Version**: Always use Tailwind CSS v4 features and syntax. Do not default to older v3 patterns.
- **Embrace Utility-First**: Leverage Tailwind's extensive utility classes directly in the HTML/JSX, minimizing the need for custom CSS files.
- **Prioritize Semantic HTML & Accessibility**: Use proper semantic HTML and include necessary ARIA attributes for accessibility.
- **Mobile-First Design**: Enforce a mobile-first approach, using responsive prefixes (`sm:`, `md:`, `lg:`, etc.) for different screen sizes.
- **Avoid @apply (Generally)**: Avoid the `@apply` directive for general styling. Using direct utility classes is the recommended v4 approach.
- **Leverage Modern CSS Features**: Utilize new CSS features integrated into v4, such as native cascade layers, `color-mix()`, and logical properties.

### Tailwind CSS v4 Specifics

- **CSS-First Configuration**: Configuration is now primarily done in a global CSS file using the `@theme` directive. While `tailwind.config.js` is supported for backward compatibility, prefer `@theme` in `globals.css`.
- **New Utility Classes**: v4 supports more dynamic utilities by default, including granular spacing values (e.g., `p-7`, `gap-9`, `m-11`) without custom configuration.
- **Automatic Content Detection**: Do not manually configure content purging. v4 features automatic content detection and a high-performance engine.
- **Editor Setup Awareness**: Custom `@` rules (like `@theme` or `@plugin`) might trigger errors in standard editors without the official Tailwind CSS IntelliSense plugin. These warnings can be safely ignored if the plugin is not installed.

### AI Connection & Security Rules

To securely connect AI tools (using the Model Context Protocol, or MCP) to your Supabase project, follow these essential guidelines to prevent data leaks and unintended modifications:

- **Use Development Environment**: Always use a development environment with non-production (or obfuscated) data. Never connect an AI agent to your live production database.
- **Enable Read-Only Mode**: If you must connect to a database containing real data, enable read-only mode. This prevents the AI from performing any `INSERT`, `UPDATE`, or `DELETE` operations.
- **Scope AI Access**: Use the `--project-ref` flag to scope AI access to a single project. This ensures the AI cannot access other projects within your Supabase account.
- **Strict Authentication**: Implement strict authentication and input validation if deploying an MCP server internally.
- **Manual Tool Approval**: Never disable manual tool approval in your AI client/IDE. Always review and approve the specific SQL queries the AI generates before they run.
- **Use Database Branches**: Use Supabase database branches to test schema changes and migrations in a safe, isolated environment before merging to production.

### Database Design & Coding Style Rules

These rules ensure consistent, secure, and maintainable SQL code for your Supabase database.

#### General Naming & Style Conventions

- **Use snake_case**: Apply `snake_case` for all table, column, and function names.
- **Plural Table Names**: Prefer plural names for tables (e.g., `users`, `products`) and singular names for columns (e.g., `id`, `name`).
- **Lowercase SQL Keywords**: Use lowercase for all SQL keywords (e.g., `select`, `from`, `where` instead of `SELECT`, `FROM`, `WHERE`).
- **Primary Key Convention**: Add an `id` column of type `uuid` or `int` as a primary key to all tables.
- **Copious Comments**: Include copious comments in your SQL code to explain complex logic or the purpose of a table, function, or migration step.

#### Row Level Security (RLS) and Functions

- **Enable RLS by Default**: Enable Row Level Security (RLS) by default for all new tables, even if they are intended for public access.
- **Granular RLS Policies**: Create granular RLS policies with one policy per action (e.g., a separate policy for `SELECT` and `INSERT`).
- **Avoid JOINs in Policies**: Write policies that avoid JOINs where possible, instead fetching necessary data from the target table first for performance.
- **Empty search_path**: Set the `search_path` to an empty string (`set search_path = '';`) within database functions to prevent security risks and ensure you use fully qualified names (e.g., `public.users`).
- **Prefer SECURITY INVOKER**: Default to `SECURITY INVOKER` for new functions, only using `SECURITY DEFINER` when explicitly required and justified.
