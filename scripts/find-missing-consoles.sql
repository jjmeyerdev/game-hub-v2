-- Find games that should have a console but don't have the "Platform (Console)" format
-- These are games where the platform is PlayStation/Xbox/Nintendo related but missing parentheses

SELECT
  g.title,
  ug.platform,
  CASE
    WHEN ug.psn_title_id IS NOT NULL THEN 'PSN'
    WHEN ug.steam_appid IS NOT NULL THEN 'Steam'
    WHEN ug.xbox_title_id IS NOT NULL THEN 'Xbox'
    ELSE 'Manual'
  END as sync_source,
  ug.id as user_game_id
FROM user_games ug
JOIN games g ON ug.game_id = g.id
WHERE
  -- PlayStation games without proper format
  (
    (LOWER(ug.platform) LIKE '%playstation%' OR LOWER(ug.platform) LIKE 'ps%')
    AND ug.platform NOT LIKE '%(%'
  )
  OR
  -- Xbox games without proper format
  (
    LOWER(ug.platform) LIKE '%xbox%'
    AND ug.platform NOT LIKE '%(%'
  )
  OR
  -- Nintendo games without proper format
  (
    (LOWER(ug.platform) LIKE '%nintendo%' OR LOWER(ug.platform) LIKE '%switch%' OR LOWER(ug.platform) LIKE '%wii%')
    AND ug.platform NOT LIKE '%(%'
  )
ORDER BY
  CASE
    WHEN LOWER(ug.platform) LIKE '%playstation%' OR LOWER(ug.platform) LIKE 'ps%' THEN 1
    WHEN LOWER(ug.platform) LIKE '%xbox%' THEN 2
    ELSE 3
  END,
  ug.platform,
  g.title;
