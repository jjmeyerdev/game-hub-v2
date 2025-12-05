import { NextRequest, NextResponse } from 'next/server';
import { searchGames } from '@/lib/igdb';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
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

