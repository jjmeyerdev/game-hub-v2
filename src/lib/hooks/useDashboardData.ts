import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getUserGames, getNowPlayingGames, getUserStats, type UserGame } from '@/lib/actions/games';
import { libraryEvents } from '@/lib/events/libraryEvents';

interface DashboardUser {
  email: string;
  name: string;
  greeting: string;
}

export function useDashboardData(includeHidden = false) {
  const [user, setUser] = useState<DashboardUser>({
    email: '',
    name: 'User',
    greeting: '',
  });
  const [userGames, setUserGames] = useState<UserGame[]>([]);
  const [nowPlaying, setNowPlaying] = useState<UserGame[]>([]);
  const [stats, setStats] = useState({
    totalGames: 0,
    hoursPlayed: 0,
    achievements: 0,
    completionRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        const email = authUser.email || '';
        const emailName = email.split('@')[0] || 'User';

        // Try to get name from profiles table first
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', authUser.id)
          .single();

        const name =
          profile?.full_name ||
          authUser.user_metadata?.full_name ||
          authUser.user_metadata?.name ||
          emailName.charAt(0).toUpperCase() + emailName.slice(1);

        // Set time-based greeting
        const hour = new Date().getHours();
        let greeting = 'Good morning';
        if (hour >= 12 && hour < 18) greeting = 'Good afternoon';
        else if (hour >= 18) greeting = 'Good evening';

        setUser({ email, name, greeting });
      }

      // Fetch real data
      const [gamesResult, nowPlayingResult, statsResult] = await Promise.all([
        getUserGames(includeHidden),
        getNowPlayingGames(),
        getUserStats(),
      ]);

      if (gamesResult.error) throw new Error(gamesResult.error);
      if (nowPlayingResult.error) throw new Error(nowPlayingResult.error);

      setUserGames(gamesResult.data || []);
      setNowPlaying(nowPlayingResult.data || []);
      setStats(statsResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [includeHidden]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Subscribe to library refresh events (from settings pages, etc.)
  useEffect(() => {
    const unsubscribe = libraryEvents.subscribe(() => {
      loadData();
    });
    return unsubscribe;
  }, [loadData]);

  return {
    user,
    userGames,
    nowPlaying,
    stats,
    loading,
    error,
    refreshData: loadData,
  };
}
