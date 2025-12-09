import { NextRequest, NextResponse } from 'next/server';
import { searchGames, getGameById } from '@/lib/igdb';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    // Check if query is a numeric IGDB ID
    const igdbId = parseInt(query, 10);
    if (!isNaN(igdbId) && query.match(/^\d+$/)) {
      const game = await getGameById(igdbId);
      if (game) {
        return NextResponse.json([game]);
      }
      // If ID lookup fails, fall through to title search
    }

    const games = await searchGames(query, 10);
    return NextResponse.json(games);
  } catch (error) {
    console.error('IGDB API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to search games' },
      { status: 500 }
    );
  }
}

