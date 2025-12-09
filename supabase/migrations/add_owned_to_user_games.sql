-- Add ownership fields to user_games table
-- This tracks whether the user owns the game, has it on wishlist, or doesn't own it

-- Legacy boolean field (kept for backwards compatibility)
ALTER TABLE user_games
ADD COLUMN IF NOT EXISTS owned BOOLEAN NOT NULL DEFAULT true;

-- New ownership_status field with three states
ALTER TABLE user_games
ADD COLUMN IF NOT EXISTS ownership_status TEXT NOT NULL DEFAULT 'owned';

-- Add check constraint for valid values
ALTER TABLE user_games
DROP CONSTRAINT IF EXISTS user_games_ownership_status_check;

ALTER TABLE user_games
ADD CONSTRAINT user_games_ownership_status_check
CHECK (ownership_status IN ('owned', 'wishlist', 'unowned'));

-- Add index for filtering by ownership status
CREATE INDEX IF NOT EXISTS idx_user_games_ownership_status
ON user_games(ownership_status);

-- Add comments for documentation
COMMENT ON COLUMN user_games.owned IS 'DEPRECATED: Use ownership_status instead. Kept for backwards compatibility.';
COMMENT ON COLUMN user_games.ownership_status IS 'Ownership status: owned (user owns it), wishlist (user wants it), unowned (user does not own it)';
