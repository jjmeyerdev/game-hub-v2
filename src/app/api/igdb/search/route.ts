import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    // Get IGDB access token
    const tokenResponse = await fetch(
      `https://id.twitch.tv/oauth2/token?client_id=${process.env.IGDB_CLIENT_ID}&client_secret=${process.env.IGDB_CLIENT_SECRET}&grant_type=client_credentials`,
      { method: 'POST' }
    );

    if (!tokenResponse.ok) {
      throw new Error('Failed to get IGDB access token');
    }

    const { access_token } = await tokenResponse.json();

    // Search games on IGDB
    const gamesResponse = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Client-ID': process.env.IGDB_CLIENT_ID!,
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'text/plain',
      },
      body: `
        search "${query}";
        fields name, cover.url, first_release_date, summary, genres.name, platforms.name, involved_companies.company.name, involved_companies.developer;
        limit 10;
      `,
    });

    if (!gamesResponse.ok) {
      throw new Error('Failed to search games');
    }

    const games = await gamesResponse.json();

    // Transform the data - create separate entries for each platform
    const transformedGames: any[] = [];
    
    games.forEach((game: any) => {
      const platforms = game.platforms?.map((p: any) => p.name) || ['Unknown Platform'];
      
      // Create a result for each platform
      platforms.forEach((platform: string) => {
        transformedGames.push({
          id: `${game.id}-${platform}`,
          igdbId: game.id,
          name: game.name,
          cover: game.cover?.url ? `https:${game.cover.url.replace('t_thumb', 't_cover_big')}` : null,
          releaseDate: game.first_release_date
            ? new Date(game.first_release_date * 1000).toISOString().split('T')[0]
            : null,
          summary: game.summary || null,
          genres: game.genres?.map((g: any) => g.name) || [],
          platform: platform,
          platforms: platforms,
          developer:
            game.involved_companies?.find((ic: any) => ic.developer)?.company?.name ||
            game.involved_companies?.[0]?.company?.name ||
            null,
        });
      });
    });

    return NextResponse.json(transformedGames);
  } catch (error) {
    console.error('IGDB API Error:', error);
    return NextResponse.json(
      { error: 'Failed to search games' },
      { status: 500 }
    );
  }
}

