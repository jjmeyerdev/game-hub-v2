-- Add platform-specific release date to user_games
-- This allows storing different release dates for the same game on different platforms
-- (e.g., God of War released 2018 on PS4, but 2022 on PC)

ALTER TABLE user_games ADD COLUMN IF NOT EXISTS release_date DATE;

-- Copy existing release dates from games table as starting point
-- This provides backward compatibility - existing games keep their dates
UPDATE user_games ug
SET release_date = g.release_date
FROM games g
WHERE ug.game_id = g.id
  AND g.release_date IS NOT NULL
  AND ug.release_date IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN user_games.release_date IS 'Platform-specific release date for this game entry. May differ from games.release_date for cross-platform releases.';
