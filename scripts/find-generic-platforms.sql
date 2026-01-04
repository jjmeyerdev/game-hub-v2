-- Find games with generic platform names that don't have a specific console
-- Run this in Supabase SQL Editor

SELECT
  ug.id,
  g.title,
  ug.platform,
  CASE
    WHEN ug.psn_title_id IS NOT NULL THEN 'PSN'
    WHEN ug.steam_appid IS NOT NULL THEN 'Steam'
    WHEN ug.xbox_title_id IS NOT NULL THEN 'Xbox'
    ELSE 'Manual'
  END as sync_source
FROM user_games ug
JOIN games g ON ug.game_id = g.id
WHERE
  -- Generic PlayStation (no specific console)
  LOWER(ug.platform) = 'playstation'
  OR
  -- Generic Xbox (no specific console)
  LOWER(ug.platform) = 'xbox'
  OR
  -- Generic Nintendo (no specific console)
  LOWER(ug.platform) = 'nintendo'
ORDER BY ug.platform, g.title;
