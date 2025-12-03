# 🎮 Game Update Guide

Quick guide for updating your game library with IGDB data.

## Quick Start

```bash
pnpm update-games
```

That's it! The script will automatically:
- Find games with missing data
- Search IGDB for accurate information
- Update your database
- Show you a detailed report

## What Gets Updated

The script fills in missing:
- 🖼️ **Cover Images** - High-quality game art
- 📝 **Descriptions** - Game summaries
- 🏢 **Developers** - Studio names
- ✏️ **Corrected Titles** - Fixes any title inconsistencies
- 🎮 **Platform/Console** - Corrects platform information (e.g., PS3 → PS4 if needed)

## When to Run This Script

Run this script when:
- ✅ You've just imported games from a list
- ✅ You notice games with missing cover art
- ✅ Games are missing descriptions or developer info
- ✅ You want to ensure all data is accurate and complete

## Safety

- ✅ **Non-destructive** - Only adds missing data
- ✅ **Smart** - Skips games that are already complete
- ✅ **Safe** - Can be interrupted and resumed anytime
- ✅ **Respectful** - Follows API rate limits

## Example Output

```
📊 Status:
   ✓ Complete: 45 games
   ⚠ Need update: 96 games

🔄 Starting updates...

[1/96] Processing: Uncharted 2: Among Thieves
   Platform: PlayStation (PS3)
   ✅ Updated successfully
```

## Tips

💡 **First Time Setup**: After importing games from a text file, run this script to fill in all the details.

💡 **Regular Maintenance**: Run periodically to keep your library up to date.

💡 **Manual Override**: You can still manually edit games through the dashboard - the script won't overwrite complete data.

## Need Help?

See the detailed documentation: `scripts/UPDATE_GAMES_README.md`

