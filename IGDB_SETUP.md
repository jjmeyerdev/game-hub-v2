# IGDB API Setup Guide

The Add Game Modal now includes a beautiful search feature powered by the IGDB (Internet Game Database) API. This allows users to search for games and auto-fill game details.

## 🎮 Features

- **Real-time Search**: Search games as you type with debounced API calls
- **Auto-fill**: Automatically fills in game details (title, cover, developer, description)
- **Beautiful UI**: Cyber-themed search interface with smooth animations
- **Game Metadata**: Shows cover art, release year, developer, and genres
- **Fallback**: Manual entry still available if game not found

## 🔑 Getting IGDB API Credentials

IGDB uses Twitch authentication. Follow these steps:

### Step 1: Create a Twitch Developer Account

1. Go to [Twitch Developer Console](https://dev.twitch.tv/console)
2. Log in with your Twitch account (or create one if you don't have it)

### Step 2: Register Your Application

1. Click **"Register Your Application"**
2. Fill in the details:
   - **Name**: Game Hub (or any name you prefer)
   - **OAuth Redirect URLs**: `http://localhost:3000` (for development)
   - **Category**: Website Integration
3. Click **"Create"**

### Step 3: Get Your Credentials

1. Click **"Manage"** on your newly created application
2. Copy the **Client ID**
3. Click **"New Secret"** to generate a Client Secret
4. Copy the **Client Secret** (you can only see it once!)

### Step 4: Add to Environment Variables

Add these to your `.env.local` file:

```env
IGDB_CLIENT_ID=your-client-id-here
IGDB_CLIENT_SECRET=your-client-secret-here
```

## 🚀 Usage

Once configured, the search feature will automatically work in the Add Game Modal:

1. Click **"Add Game"** in the dashboard
2. Start typing in the search bar
3. Results will appear after 500ms (debounced)
4. Click on a game to auto-fill all details
5. Adjust platform and status as needed
6. Click **"Add Game"** to save

## 📊 API Response Structure

The IGDB API returns rich game data:

```typescript
{
  id: number;
  name: string;
  cover: string | null;           // High-quality cover image URL
  releaseDate: string | null;     // ISO date string
  summary: string | null;         // Game description
  genres: string[];               // Array of genre names
  platforms: string[];            // Array of platform names
  developer: string | null;       // Developer company name
}
```

## 🎨 UI Components

### Search Bar
- **Icon**: Animated search icon (or spinner when loading)
- **Badge**: "IGDB" badge showing data source
- **Placeholder**: Clear instruction text
- **Focus State**: Cyan glow effect

### Search Results
- **Dropdown**: Smooth slide-in animation
- **Game Cards**: Hover effects with cover art
- **Metadata**: Release year, developer, genres
- **Empty State**: Helpful message when no results

### Animations
- **Debounced Search**: 500ms delay to prevent excessive API calls
- **Staggered Results**: Each result fades in with slight delay
- **Smooth Transitions**: All state changes animated

## 🔒 Security Notes

- ✅ API calls are made server-side (Next.js API route)
- ✅ Credentials never exposed to client
- ✅ Rate limiting handled by IGDB
- ✅ CORS handled automatically

## 🛠️ Troubleshooting

### "Failed to get IGDB access token"
- Check that your Client ID and Client Secret are correct
- Ensure they're in `.env.local` (not `env.example`)
- Restart your dev server after adding env variables

### "Failed to search games"
- Check your internet connection
- Verify IGDB API is not down (check status page)
- Check browser console for detailed error messages

### No results appearing
- Make sure you're typing at least 2 characters
- Wait for the 500ms debounce delay
- Try a more specific game title

### Search is slow
- This is normal - IGDB API can take 1-2 seconds
- The loading spinner indicates search is in progress
- Results are cached by the browser

## 📝 Manual Entry Fallback

If IGDB search doesn't find your game or you prefer manual entry:

1. Ignore the search bar
2. Scroll down to "Or Enter Manually"
3. Fill in the form fields directly
4. Expand "Additional Details" for more fields

## 🔮 Future Enhancements

Potential improvements:

- **Platform Matching**: Auto-select platform based on IGDB data
- **Bulk Import**: Import multiple games at once
- **Cover Upload**: Upload custom covers if IGDB doesn't have one
- **Favorites**: Save frequently searched games
- **Recent Searches**: Show recent search history
- **Advanced Filters**: Filter by platform, genre, year in search

## 📚 Resources

- [IGDB API Documentation](https://api-docs.igdb.com/)
- [Twitch Developer Console](https://dev.twitch.tv/console)
- [IGDB API Status](https://status.igdb.com/)

## 💡 Tips

- **Exact Titles**: Use exact game titles for best results
- **Abbreviations**: Try both full names and abbreviations (e.g., "GTA V" vs "Grand Theft Auto V")
- **Year**: Add release year if multiple games have same name
- **Franchise**: Search by franchise name to see all games in series

---

**Enjoy the enhanced game search experience! 🎮✨**

