# Quick Start: Import Your Game Collection

Get your 141 games into Game Hub in just 3 steps! 🎮

## Step 1: Install Dependencies

```bash
pnpm install
```

## Step 2: Configure Environment

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Get these values from: **Supabase Dashboard → Project Settings → API**

## Step 3: Import Games

### Import to Database (Required)

```bash
pnpm run import-games
```

This adds all 141 games to the global game catalog.

### Import to Your Library (Optional)

```bash
pnpm run import-to-library your-email@example.com
```

This adds all games to your personal library.

## Verify Import

```bash
pnpm run verify-import
```

Or check a specific user's library:

```bash
pnpm run verify-import your-email@example.com
```

## What You Get

- ✅ **141 games** automatically imported
- ✅ **Auto-detected genres** (Action, RPG, Sports, etc.)
- ✅ **Developer & publisher** info for major franchises
- ✅ **Platform support** (Xbox 360, PlayStation 3, PC)
- ✅ **Auto-generated descriptions**
- ✅ **Estimated release dates**

## Need More Help?

- 📖 **Detailed Guide**: See `IMPORT_GAMES_GUIDE.md`
- 🔧 **Setup Instructions**: See `scripts/SETUP.md`
- 📚 **Technical Docs**: See `scripts/README.md`

## Troubleshooting

**Missing environment variables?**
→ Make sure `.env.local` has all 3 variables

**User not found?**
→ Sign up through the app first

**Games not showing?**
→ Hard refresh your browser (Cmd+Shift+R)

---

**That's it! Your game collection is ready to manage. 🎉**

