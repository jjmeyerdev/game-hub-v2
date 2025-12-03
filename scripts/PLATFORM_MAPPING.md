# Platform Mapping Reference

This document explains how the update script maps IGDB platform names to your database format.

## How It Works

The script uses intelligent platform mapping to ensure your games have the correct platform/console information:

1. **Searches IGDB** with your game title and platform context
2. **Finds the best match** by comparing IGDB platforms with your current platform
3. **Maps IGDB names** to your standardized format
4. **Updates user_games** table if the platform needs correction

## Platform Mappings

### PlayStation

| IGDB Platform Name | Maps To |
|-------------------|---------|
| PlayStation 5 | PlayStation (PS5) |
| PlayStation 4 | PlayStation (PS4) |
| PlayStation 3 | PlayStation (PS3) |
| PlayStation 2 | PlayStation (PS2) |
| PlayStation | PlayStation (PS1) |

### Xbox

| IGDB Platform Name | Maps To |
|-------------------|---------|
| Xbox Series X\|S | Xbox (Xbox Series X) |
| Xbox One | Xbox (Xbox One) |
| Xbox 360 | Xbox (Xbox 360) |
| Xbox | Xbox (Original Xbox) |

### Nintendo

| IGDB Platform Name | Maps To |
|-------------------|---------|
| Nintendo Switch | Nintendo (Switch) |
| Wii U | Nintendo (Wii U) |
| Nintendo 3DS | Nintendo (3DS) |

### PC Platforms

| IGDB Platform Name | Maps To |
|-------------------|---------|
| PC (Windows) | Steam |
| PC | Steam |

## Examples

### Example 1: Correct Platform
```
Game: "The Last of Us"
Current Platform: PlayStation (PS3)
IGDB Result: PlayStation 3
Action: ✅ No change needed
```

### Example 2: Platform Correction
```
Game: "The Last of Us"
Current Platform: PlayStation (PS3)
IGDB Result: PlayStation 4 (Remastered version found)
Action: 📝 Update to PlayStation (PS4)
```

### Example 3: Generic Platform
```
Game: "Uncharted 2"
Current Platform: PlayStation
IGDB Result: PlayStation 3
Action: 📝 Update to PlayStation (PS3)
```

## Smart Matching

The script uses smart matching to find the right version of a game:

1. **Platform Context**: Searches IGDB with up to 5 results
2. **Platform Filtering**: Prefers results that match your current platform
3. **Fallback**: If no platform match, uses the first (most relevant) result

### Example of Smart Matching

```
Game: "Grand Theft Auto V"
Current Platform: PlayStation (PS3)

IGDB Returns:
1. GTA V (PlayStation 5, PlayStation 4, Xbox Series X|S, Xbox One, PC)
2. GTA V (PlayStation 3, Xbox 360)
3. GTA V - Enhanced Edition (PlayStation 5, Xbox Series X|S)

Script Selects: Result #2 (contains PlayStation 3)
Maps To: PlayStation (PS3) ✅
```

## Preservation Rules

The script follows these rules to preserve your data:

1. **Preserve Console Info**: If you have `PlayStation (PS3)`, it won't change to just `PlayStation`
2. **Upgrade Only**: Only updates if IGDB provides more specific information
3. **No Downgrades**: Won't remove console information you've already entered
4. **User Override**: Manual edits through the dashboard are respected

## When Platforms Are Updated

Platforms are updated in the `user_games` table when:

- ✅ IGDB provides more specific console information
- ✅ The platform name format is incorrect
- ✅ The game was released on a different console than listed

Platforms are NOT updated when:

- ❌ The current platform is already correct
- ❌ IGDB doesn't provide platform information
- ❌ The game wasn't found on IGDB

## Troubleshooting

### "Platform updated" but looks wrong

The script uses IGDB's data, which may differ from your expectations:
- Check if the game was remastered/re-released on a different platform
- Verify the IGDB entry is correct
- You can manually override through the dashboard Edit Game modal

### Platform not updating

Possible reasons:
- IGDB doesn't have platform information for this game
- The current platform already matches IGDB's data
- The game has multiple platform versions and IGDB returned a different one

### Want to prevent platform updates

If you want to update only game data (not platforms):
- The script currently updates both
- You can manually revert platform changes through the dashboard
- Or modify the script to skip the `updateUserGamesPlatform` call

## Technical Details

The platform mapping logic is in the `mapPlatformName()` function:

```typescript
function mapPlatformName(igdbPlatform: string, currentPlatform: string): string {
  // Extracts base platform and console
  // Maps IGDB names to our format
  // Preserves existing console info when appropriate
  // Returns updated platform string
}
```

The function:
1. Parses your current platform format: `"PlayStation (PS3)"` → `base: "PlayStation"`, `console: "PS3"`
2. Checks IGDB platform against mapping table
3. Returns properly formatted platform string
4. Falls back to current platform if no match found

