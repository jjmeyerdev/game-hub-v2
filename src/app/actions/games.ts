'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export interface Game {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  release_date: string | null;
  developer: string | null;
  publisher: string | null;
  genres: string[] | null;
  platforms: string[] | null;
  steam_appid: number | null;
  psn_communication_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserGame {
  id: string;
  user_id: string;
  game_id: string;
  platform: string;
  status: string;
  priority: string;
  completion_percentage: number;
  playtime_hours: number;
  last_played_at: string | null;
  personal_rating: number | null;
  notes: string | null;
  tags: string[] | null;
  achievements_earned: number;
  achievements_total: number;
  hidden: boolean;
  created_at: string;
  updated_at: string;
  game?: Game;
}

/**
 * Get all games in the user's library
 * @param includeHidden - Whether to include hidden games (default: false)
 */
export async function getUserGames(includeHidden = false) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: 'Not authenticated' };
  }

  let query = supabase
    .from('user_games')
    .select(`
      *,
      game:games(*)
    `)
    .eq('user_id', user.id);

  // Filter out hidden games unless explicitly requested
  if (!includeHidden) {
    query = query.eq('hidden', false);
  }

  const { data, error } = await query.order('last_played_at', { ascending: false, nullsFirst: false });

  return { data, error };
}

/**
 * Get now playing games (status = 'playing')
 * Hidden games are excluded from now playing
 */
export async function getNowPlayingGames() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: 'Not authenticated' };
  }

  const { data, error } = await supabase
    .from('user_games')
    .select(`
      *,
      game:games(*)
    `)
    .eq('user_id', user.id)
    .eq('status', 'playing')
    .eq('hidden', false)
    .order('last_played_at', { ascending: false, nullsFirst: false })
    .limit(5);

  return { data, error };
}

/**
 * Add a game to user's library
 */
export async function addGameToLibrary(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const title = formData.get('title') as string;
  const platform = formData.get('platform') as string;
  const status = formData.get('status') as string;
  const priority = formData.get('priority') as string;
  const coverUrl = formData.get('coverUrl') as string;
  const description = formData.get('description') as string;
  const developer = formData.get('developer') as string;

  // First, create or find the game in the games table
  const { data: existingGame, error: searchError } = await supabase
    .from('games')
    .select('*')
    .eq('title', title)
    .single();

  let gameId = existingGame?.id;

  if (!existingGame) {
    // Create new game entry
    const { data: newGame, error: createError } = await supabase
      .from('games')
      .insert({
        title,
        description,
        cover_url: coverUrl || null,
        developer: developer || null,
        platforms: [platform],
      })
      .select()
      .single();

    if (createError) {
      return { error: createError.message };
    }

    gameId = newGame.id;
  }

  // Add to user's library
  const { error: userGameError } = await supabase.from('user_games').insert({
    user_id: user.id,
    game_id: gameId,
    platform,
    status: status || 'unplayed',
    priority: priority || 'medium',
    completion_percentage: 0,
    playtime_hours: 0,
    last_played_at: status === 'playing' ? new Date().toISOString() : null,
  });

  if (userGameError) {
    return { error: userGameError.message };
  }

  revalidatePath('/dashboard');
  return { success: true };
}

/**
 * Update a game in user's library
 */
export async function updateUserGame(
  userGameId: string,
  updates: {
    status?: string;
    priority?: string;
    completion_percentage?: number;
    playtime_hours?: number;
    personal_rating?: number;
    notes?: string;
    hidden?: boolean;
  }
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const { error } = await supabase
    .from('user_games')
    .update(updates)
    .eq('id', userGameId)
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard');
  return { success: true };
}

/**
 * Edit a game - updates both the game info and user game entry
 */
export async function editUserGame(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const userGameId = formData.get('userGameId') as string;
  const gameId = formData.get('gameId') as string;
  const title = formData.get('title') as string;
  const platform = formData.get('platform') as string;
  const status = formData.get('status') as string;
  const priority = formData.get('priority') as string;
  const coverUrl = formData.get('coverUrl') as string;
  const description = formData.get('description') as string;
  const developer = formData.get('developer') as string;
  const playtimeHours = formData.get('playtimeHours') as string;
  const completionPercentage = formData.get('completionPercentage') as string;
  const personalRating = formData.get('personalRating') as string;
  const notes = formData.get('notes') as string;
  const hidden = formData.get('hidden') === 'true';

  // Update the game info in games table
  const { error: gameError } = await supabase
    .from('games')
    .update({
      title,
      description: description || null,
      cover_url: coverUrl || null,
      developer: developer || null,
    })
    .eq('id', gameId);

  if (gameError) {
    return { error: gameError.message };
  }

  // Update user_games entry
  const { error: userGameError } = await supabase
    .from('user_games')
    .update({
      platform,
      status,
      priority: priority || 'medium',
      playtime_hours: playtimeHours ? parseFloat(playtimeHours) : 0,
      completion_percentage: completionPercentage ? parseInt(completionPercentage) : 0,
      personal_rating: personalRating ? parseInt(personalRating) : null,
      notes: notes || null,
      hidden,
      last_played_at: status === 'playing' ? new Date().toISOString() : undefined,
    })
    .eq('id', userGameId)
    .eq('user_id', user.id);

  if (userGameError) {
    return { error: userGameError.message };
  }

  revalidatePath('/dashboard');
  return { success: true };
}

/**
 * Delete a game from user's library
 */
export async function deleteUserGame(userGameId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const { error } = await supabase
    .from('user_games')
    .delete()
    .eq('id', userGameId)
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard');
  return { success: true };
}

/**
 * Get user stats
 */
export async function getUserStats() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      totalGames: 0,
      hoursPlayed: 0,
      achievements: 0,
      completionRate: 0,
    };
  }

  const { data: games } = await supabase
    .from('user_games')
    .select('*')
    .eq('user_id', user.id);

  if (!games) {
    return {
      totalGames: 0,
      hoursPlayed: 0,
      achievements: 0,
      completionRate: 0,
    };
  }

  const totalGames = games.length;
  const hoursPlayed = games.reduce((sum, g) => sum + (g.playtime_hours || 0), 0);
  const achievements = games.reduce((sum, g) => sum + (g.achievements_earned || 0), 0);
  const completedGames = games.filter(
    (g) => g.status === 'completed' || g.status === '100_completed'
  ).length;
  const completionRate = totalGames > 0 ? Math.round((completedGames / totalGames) * 100) : 0;

  return {
    totalGames,
    hoursPlayed: Math.round(hoursPlayed),
    achievements,
    completionRate,
  };
}

/**
 * Update all Steam game information from IGDB
 */
export async function updateAllSteamCovers() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  try {
    // Get all Steam games for the user
    const { data: userGames, error: fetchError } = await supabase
      .from('user_games')
      .select(`
        id,
        game_id,
        platform,
        game:games(id, title, cover_url, description, developer, publisher, release_date, genres, steam_appid)
      `)
      .eq('user_id', user.id)
      .eq('platform', 'Steam');

    if (fetchError) {
      return { error: fetchError.message };
    }

    if (!userGames || userGames.length === 0) {
      return {
        success: true,
        message: 'No Steam games found',
        updated: 0,
        skipped: 0,
        failed: 0
      };
    }

    let updated = 0;
    let skipped = 0;
    let failed = 0;

    // Get IGDB access token once
    const tokenResponse = await fetch(
      `https://id.twitch.tv/oauth2/token?client_id=${process.env.IGDB_CLIENT_ID}&client_secret=${process.env.IGDB_CLIENT_SECRET}&grant_type=client_credentials`,
      { method: 'POST' }
    );

    if (!tokenResponse.ok) {
      return { error: 'Failed to authenticate with IGDB' };
    }

    const { access_token } = await tokenResponse.json();

    // Process each game
    for (const userGame of userGames) {
      const game = userGame.game as unknown as Game;

      if (!game) {
        skipped++;
        continue;
      }

      try {

        // Search IGDB for the game with more fields
        const gamesResponse = await fetch('https://api.igdb.com/v4/games', {
          method: 'POST',
          headers: {
            'Client-ID': process.env.IGDB_CLIENT_ID!,
            Authorization: `Bearer ${access_token}`,
            'Content-Type': 'text/plain',
          },
          body: `
            search "${game.title}";
            fields name, cover.url, summary, first_release_date, genres.name, platforms.name, involved_companies.company.name, involved_companies.developer, involved_companies.publisher;
            limit 10;
          `,
        });

        if (!gamesResponse.ok) {
          failed++;
          continue;
        }

        const igdbGames = await gamesResponse.json();

        if (!igdbGames || igdbGames.length === 0) {
          skipped++;
          continue;
        }

        // Find PC version
        interface IGDBPlatform { name: string }
        interface IGDBCompany { company: { name: string }, developer?: boolean, publisher?: boolean }
        interface IGDBResult {
          cover?: { url: string },
          summary?: string,
          platforms?: IGDBPlatform[],
          involved_companies?: IGDBCompany[],
          first_release_date?: number,
          genres?: { name: string }[]
        }

        let selectedGame: IGDBResult | null = null;
        for (const igdbGame of igdbGames as IGDBResult[]) {
          const platforms = igdbGame.platforms?.map((p) => p.name) || [];
          if (platforms.some((p: string) => p.toLowerCase().includes('pc') || p.toLowerCase().includes('windows'))) {
            selectedGame = igdbGame;
            break;
          }
        }

        // If no PC version found, use first result
        if (!selectedGame) {
          selectedGame = igdbGames[0] as IGDBResult;
        }

        // Prepare update data - only update fields that are missing
        const updateData: any = {
          updated_at: new Date().toISOString(),
        };

        // Update cover if missing or from Steam CDN
        if (!game.cover_url || game.cover_url.includes('steamstatic.com')) {
          if (selectedGame.cover?.url) {
            updateData.cover_url = `https:${selectedGame.cover.url.replace('t_thumb', 't_cover_big')}`;
          }
        }

        // Update description if missing
        if (!game.description && selectedGame.summary) {
          updateData.description = selectedGame.summary;
        }

        // Update developer if missing
        if (!game.developer) {
          const developer = selectedGame.involved_companies?.find((ic: any) => ic.developer)?.company?.name;
          if (developer) {
            updateData.developer = developer;
          }
        }

        // Update publisher if missing
        if (!game.publisher) {
          const publisher = selectedGame.involved_companies?.find((ic: any) => ic.publisher)?.company?.name;
          if (publisher) {
            updateData.publisher = publisher;
          }
        }

        // Update release date if missing
        if (!game.release_date && selectedGame.first_release_date) {
          updateData.release_date = new Date(selectedGame.first_release_date * 1000).toISOString().split('T')[0];
        }

        // Update genres if missing
        if ((!game.genres || game.genres.length === 0) && selectedGame.genres) {
          updateData.genres = selectedGame.genres.map((g: any) => g.name);
        }

        // Only update if we have something to update
        if (Object.keys(updateData).length > 1) { // More than just updated_at
          const { error: updateError } = await supabase
            .from('games')
            .update(updateData)
            .eq('id', game.id);

          if (updateError) {
            failed++;
          } else {
            updated++;
          }
        } else {
          skipped++;
        }

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 250));

      } catch {
        failed++;
      }
    }

    revalidatePath('/dashboard');
    revalidatePath('/library');
    revalidatePath('/game/[id]', 'page');

    return {
      success: true,
      message: `Updated ${updated} games with missing info, skipped ${skipped}, failed ${failed}`,
      updated,
      skipped,
      failed,
      total: userGames.length
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to update game information',
    };
  }
}

/**
 * Update game cover art from IGDB search
 */
export async function updateGameCoverFromIGDB(gameId: string, gameTitle: string, userPlatform?: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  try {
    // Get IGDB access token
    const tokenResponse = await fetch(
      `https://id.twitch.tv/oauth2/token?client_id=${process.env.IGDB_CLIENT_ID}&client_secret=${process.env.IGDB_CLIENT_SECRET}&grant_type=client_credentials`,
      { method: 'POST' }
    );

    if (!tokenResponse.ok) {
      return { error: 'Failed to authenticate with IGDB' };
    }

    const { access_token } = await tokenResponse.json();

    // Search IGDB for the game
    const gamesResponse = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Client-ID': process.env.IGDB_CLIENT_ID!,
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'text/plain',
      },
      body: `
        search "${gameTitle}";
        fields name, cover.url, first_release_date, summary, genres.name, platforms.name, involved_companies.company.name, involved_companies.developer;
        limit 10;
      `,
    });

    if (!gamesResponse.ok) {
      return { error: 'Failed to search IGDB' };
    }

    const igdbResults = await gamesResponse.json();

    if (!igdbResults || igdbResults.length === 0) {
      return { error: 'No results found on IGDB' };
    }

    // Transform the data - create separate entries for each platform
    interface TransformedGame {
      id: string;
      igdbId: number;
      name: string;
      cover: string | null;
      platform: string;
      platforms: string[];
    }
    const transformedGames: TransformedGame[] = [];

    interface IGDBGameResult {
      id: number;
      name: string;
      cover?: { url: string };
      platforms?: { name: string }[];
    }

    (igdbResults as IGDBGameResult[]).forEach((igdbGame) => {
      const platforms = igdbGame.platforms?.map((p) => p.name) || ['Unknown Platform'];

      // Create a result for each platform
      platforms.forEach((platform: string) => {
        transformedGames.push({
          id: `${igdbGame.id}-${platform}`,
          igdbId: igdbGame.id,
          name: igdbGame.name,
          cover: igdbGame.cover?.url ? `https:${igdbGame.cover.url.replace('t_thumb', 't_cover_big')}` : null,
          platform: platform,
          platforms: platforms,
        });
      });
    });

    // Map user platform to IGDB platform names
    const platformMap: Record<string, string[]> = {
      'Steam': ['PC (Microsoft Windows)', 'PC'],
      'Epic Games': ['PC (Microsoft Windows)', 'PC'],
      'GOG': ['PC (Microsoft Windows)', 'PC'],
      'Xbox Game Pass': ['PC (Microsoft Windows)', 'PC'],
      'EA App': ['PC (Microsoft Windows)', 'PC'],
      'Windows': ['PC (Microsoft Windows)', 'PC'],
      'PlayStation': ['PlayStation', 'PS5', 'PS4', 'PS3', 'PS2', 'PS1'],
      'Xbox': ['Xbox Series X|S', 'Xbox One', 'Xbox 360', 'Xbox'],
      'Nintendo': ['Nintendo Switch', 'Wii U', 'Wii', 'Nintendo 3DS', 'Nintendo DS'],
      'Physical Copy': [], // Will use first result with cover
    };

    // Extract base platform (e.g., "PlayStation (PS3)" -> "PlayStation")
    const basePlatform = userPlatform?.split('(')[0].trim() || '';
    const preferredPlatforms = platformMap[basePlatform] || [];

    // Try to find a result matching the user's platform
    let selectedResult = transformedGames[0]; // Default to first result

    if (preferredPlatforms.length > 0) {
      const platformMatch = transformedGames.find((result) =>
        preferredPlatforms.some(platform =>
          result.platform?.toLowerCase().includes(platform.toLowerCase()) ||
          result.platforms?.some((p: string) => p.toLowerCase().includes(platform.toLowerCase()))
        )
      );

      if (platformMatch) {
        selectedResult = platformMatch;
      }
    }

    // Find first result with a cover
    if (!selectedResult?.cover) {
      const resultWithCover = transformedGames.find((result) => result.cover);
      if (resultWithCover) {
        selectedResult = resultWithCover;
      }
    }

    if (!selectedResult?.cover) {
      return { error: 'No cover art found for this game' };
    }

    // Update the game's cover URL
    const { error: updateError } = await supabase
      .from('games')
      .update({
        cover_url: selectedResult.cover,
        updated_at: new Date().toISOString(),
      })
      .eq('id', gameId);

    if (updateError) {
      return { error: updateError.message };
    }

    revalidatePath('/dashboard');
    revalidatePath('/library');

    return {
      success: true,
      coverUrl: selectedResult.cover,
      message: `Cover updated from IGDB (${selectedResult.platform})`
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to update cover art',
    };
  }
}
