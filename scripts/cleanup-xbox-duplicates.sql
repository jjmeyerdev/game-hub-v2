-- Cleanup script to delete Xbox duplicates created on Dec 15, 2025
-- Run this in Supabase SQL Editor

-- First, let's see what will be deleted (preview)
-- Only targets exact 'Xbox 360' and 'Xbox One' platforms
-- Does NOT delete 'Xbox (Xbox 360)' or 'Xbox (Xbox One)'
SELECT
  ug.id,
  g.title,
  ug.platform,
  ug.created_at,
  ug.updated_at
FROM user_games ug
JOIN games g ON g.id = ug.game_id
WHERE ug.platform IN ('Xbox 360', 'Xbox One')
  AND ug.created_at::date = '2025-12-15'
ORDER BY g.title;

-- DELETE statement - run after reviewing the preview above
DELETE FROM user_games
WHERE platform IN ('Xbox 360', 'Xbox One')
  AND created_at::date = '2025-12-15';
