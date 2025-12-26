# Library Filter Behavior

## Filter Logic Summary

- **OR logic** within each filter type (selecting PSN + Manual shows games from either source)
- **AND logic** between filter types (must pass Platform AND Synced From AND Priority, etc.)

## Expected Behavior by Scenario

| Scenario | Expected Result |
|----------|-----------------|
| **Platform = PlayStation** (no Synced From) | ALL PlayStation games (PSN-synced + manually-entered) |
| **Synced From = PSN** (no Platform) | ALL games synced from PSN |
| **Synced From = Manual** (no Platform) | ALL manually-entered games (any platform) |
| **Platform = PlayStation + Synced From = PSN** | PlayStation games that were synced from PSN |
| **Platform = PlayStation + Synced From = Manual** | PlayStation games that were manually entered |
| **Platform = PlayStation + Synced From = PSN + Manual** | PlayStation games that are EITHER PSN-synced OR manually-entered |

## Filter Types

### Platform Filter
Filters by game platform (PlayStation, Xbox, Nintendo, Steam, etc.)
- Multiple selections use OR logic
- Empty selection = show all platforms

### Synced From Filter
Filters by sync source (how the game was added)
- **Steam** - Games synced from Steam
- **PSN** - Games synced from PlayStation Network
- **Xbox** - Games synced from Xbox Live
- **Epic** - Games synced from Epic Games Store
- **Manual** - Games added manually by the user

### Priority Filter
Filters by user-assigned priority (High, Medium, Low)

### Console Filter
Appears when PlayStation, Xbox, Nintendo platform or Manual source is selected.
Allows drilling down to specific consoles (PS3, PS4, PS5, Xbox One, Switch, etc.)

## Key Implementation Details

1. **Sync Source Detection** (`src/lib/utils.ts` - `getGameSyncSource`)
   - Steam: Checks `user_games.steam_appid`
   - Xbox: Checks `user_games.xbox_title_id`
   - PSN: Checks `user_games.psn_title_id`
   - Epic: Checks platform + `games.epic_catalog_item_id`
   - Manual: Default if no platform-specific ID is found

2. **Filter Function** (`src/lib/utils.ts` - `filterGames`)
   - Applies all active filters sequentially
   - A game must pass ALL filter types to be displayed
