-- Add physical copy field to user_games table
-- Tracks whether the user owns a physical copy of the game

ALTER TABLE user_games
ADD COLUMN IF NOT EXISTS is_physical BOOLEAN NOT NULL DEFAULT false;

-- Add index for filtering physical copies
CREATE INDEX IF NOT EXISTS idx_user_games_is_physical
ON user_games(is_physical) WHERE is_physical = true;

-- Add comment for documentation
COMMENT ON COLUMN user_games.is_physical IS 'Whether the user owns a physical copy of the game';
