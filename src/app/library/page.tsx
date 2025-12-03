'use client';

import { useState } from 'react';
import { Library, Grid3x3, List, SlidersHorizontal, Search } from 'lucide-react';
import { useDashboardData } from '@/lib/hooks';
import { DashboardLayout } from '@/components/layouts';
import { GameCard } from '@/components/dashboard/cards/GameCard';
import { GameListItem } from '@/components/dashboard/cards/GameListItem';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { UserGame } from '@/app/actions/games';

type ViewMode = 'grid' | 'list';
type SortOption = 'title-asc' | 'title-desc' | 'recent' | 'completion-asc' | 'completion-desc' | 'playtime-asc' | 'playtime-desc';

const PLATFORMS = ['All', 'Steam', 'PlayStation', 'Xbox', 'Windows', 'Epic', 'EA App', 'Battle.net', 'Physical'];

export default function LibraryPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedPlatform, setSelectedPlatform] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('title-asc');

  const { userGames, loading } = useDashboardData();

  // Filter games
  const filteredGames = userGames.filter((userGame) => {
    if (selectedPlatform !== 'All') {
      const gamePlatform = userGame.platform.toLowerCase();
      const filterPlatform = selectedPlatform.toLowerCase();
      if (filterPlatform === 'pc') {
        if (gamePlatform !== 'pc') return false;
      } else {
        if (!gamePlatform.includes(filterPlatform)) return false;
      }
    }
    if (searchQuery && !userGame.game?.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Sort games
  const sortedGames = [...filteredGames].sort((a, b) => {
    switch (sortBy) {
      case 'title-asc':
        return (a.game?.title || '').localeCompare(b.game?.title || '');
      case 'title-desc':
        return (b.game?.title || '').localeCompare(a.game?.title || '');
      case 'recent':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'completion-desc':
        return b.completion_percentage - a.completion_percentage;
      case 'completion-asc':
        return a.completion_percentage - b.completion_percentage;
      case 'playtime-desc':
        return b.playtime_hours - a.playtime_hours;
      case 'playtime-asc':
        return a.playtime_hours - b.playtime_hours;
      default:
        return 0;
    }
  });

  return (
    <DashboardLayout>
      {/* Animated background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-12">
          {/* Header */}
          <div className="mb-8">

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-6xl font-bold mb-3 bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent animate-shimmer">
                GAME LIBRARY
              </h1>
              <p className="text-gray-400 text-lg">
                Your complete collection across all platforms
              </p>
            </div>

            <div className="flex items-center gap-2 bg-deep border border-steel rounded-xl p-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' ? 'bg-cyan-500 text-void' : ''}
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'bg-cyan-500 text-void' : ''}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-deep border border-steel rounded-xl p-4">
            <div className="text-3xl font-bold text-cyan-400">{userGames.length}</div>
            <div className="text-sm text-gray-500">Total Games</div>
          </div>
          <div className="bg-deep border border-steel rounded-xl p-4">
            <div className="text-3xl font-bold text-purple-400">
              {userGames.filter(g => g.status === 'playing').length}
            </div>
            <div className="text-sm text-gray-500">Now Playing</div>
          </div>
          <div className="bg-deep border border-steel rounded-xl p-4">
            <div className="text-3xl font-bold text-emerald-400">
              {userGames.filter(g => g.status === 'completed' || g.status === '100_completed').length}
            </div>
            <div className="text-sm text-gray-500">Completed</div>
          </div>
          <div className="bg-deep border border-steel rounded-xl p-4">
            <div className="text-3xl font-bold text-cyan-400">
              {Math.round(userGames.reduce((acc, g) => acc + g.playtime_hours, 0))}h
            </div>
            <div className="text-sm text-gray-500">Total Playtime</div>
          </div>
        </div>

        {/* Filters - Cyber Command Panel */}
        <div className="relative bg-gradient-to-br from-deep via-abyss to-deep border-2 border-cyan-500/20 rounded-2xl p-6 mb-8 overflow-hidden group">
          {/* Animated border glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-cyan-500/40 rounded-tl-2xl" />
          <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-purple-500/40 rounded-br-2xl" />

          <div className="relative">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="relative">
                <SlidersHorizontal className="w-6 h-6 text-cyan-400" />
                <div className="absolute inset-0 blur-md bg-cyan-400/30" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold tracking-wider bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  CONTROL PANEL
                </h2>
                <div className="h-0.5 bg-gradient-to-r from-cyan-500/50 via-purple-500/30 to-transparent mt-1" />
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span>ACTIVE</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search - Enhanced */}
              <div className="relative group/search">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400 z-10 transition-all group-focus-within/search:scale-110" />
                <input
                  type="text"
                  placeholder="SEARCH DATABASE..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-abyss/50 border-2 border-steel rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-gray-600 placeholder:tracking-wider focus:outline-none focus:border-cyan-500 focus:bg-abyss focus:shadow-[0_0_20px_rgba(0,217,255,0.15)] transition-all backdrop-blur-sm uppercase tracking-wide"
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-transparent opacity-0 group-focus-within/search:opacity-100 transition-opacity pointer-events-none" />
              </div>

              {/* Platform Filter - Enhanced */}
              <div className="relative">
                <div className="absolute -top-2 left-3 px-2 bg-deep text-[10px] text-cyan-400 tracking-widest font-bold z-10">
                  PLATFORM
                </div>
                <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                  <SelectTrigger className="border-2 hover:shadow-[0_0_20px_rgba(0,217,255,0.1)] transition-shadow">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map((platform) => (
                      <SelectItem key={platform} value={platform}>
                        {platform}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort - Enhanced */}
              <div className="relative">
                <div className="absolute -top-2 left-3 px-2 bg-deep text-[10px] text-purple-400 tracking-widest font-bold z-10">
                  SORT ORDER
                </div>
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                  <SelectTrigger className="border-2 hover:shadow-[0_0_20px_rgba(180,69,255,0.1)] transition-shadow">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="title-asc">Title (A-Z)</SelectItem>
                    <SelectItem value="title-desc">Title (Z-A)</SelectItem>
                    <SelectItem value="recent">Recently Added</SelectItem>
                    <SelectItem value="completion-desc">Completion (High-Low)</SelectItem>
                    <SelectItem value="completion-asc">Completion (Low-High)</SelectItem>
                    <SelectItem value="playtime-desc">Playtime (High-Low)</SelectItem>
                    <SelectItem value="playtime-asc">Playtime (Low-High)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-400">
            Showing <span className="text-cyan-400 font-bold">{sortedGames.length}</span> of{' '}
            <span className="text-white font-bold">{userGames.length}</span> games
          </p>
        </div>

        {/* Game Grid */}
        {loading ? (
          <div className="text-center py-20">
            <Library className="w-16 h-16 text-cyan-400 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-500">Loading your library...</p>
          </div>
        ) : sortedGames.length === 0 ? (
          <div className="text-center py-20 bg-deep border border-steel rounded-xl">
            <Library className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No games found</p>
            <p className="text-sm text-gray-600">Try adjusting your filters</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {sortedGames.map((userGame, index) => (
              <GameCard
                key={userGame.id}
                game={userGame}
                index={index}
                onEdit={() => {}}
                onDelete={() => {}}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {sortedGames.map((userGame, index) => (
              <GameListItem
                key={userGame.id}
                game={userGame}
                index={index}
                onEdit={() => {}}
                onDelete={() => {}}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
