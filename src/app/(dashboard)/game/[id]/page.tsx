import { redirect } from 'next/navigation';
import { getGameById } from '@/lib/actions/game-detail';
import { GameDetailClient } from '@/components/game';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function GameDetailPage({ params }: PageProps) {
  const { id } = await params;
  const game = await getGameById(id);

  if (!game) {
    redirect('/dashboard');
  }

  return <GameDetailClient game={game} />;
}
