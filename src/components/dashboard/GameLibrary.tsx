'use client';

import { useState } from 'react';
import { Library, Search, Filter, ArrowUpDown } from 'lucide-react';
import type { UserGame } from '@/app/actions/games';
import { GameCard } from './cards/GameCard';

const PLATFORMS = ['All', 'Steam', 'PlayStation', 'Xbox', 'Windows', 'Epic', 'EA App', 'Battle.net', 'Physical'];

type SortOption = 'title-asc' | 'title-desc' | 'recent' | 'completion-asc' | 'completion-desc' | 'playtime-asc' | 'playtime-desc';

interface GameLibraryProps {
  userGames: UserGame[];
  loading: boolean;
  onAddGame: () => void;
  onEditGame: (game: UserGame) => void;
  onDeleteGame: (game: UserGame) => void;
}

export function GameLibrary({
  userGames,
  loading,
  onAddGame,
  onEditGame,
  onDeleteGame,
}: GameLibraryProps) {
  const [selectedPlatform, setSelectedPlatform] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('title-asc');

  // Filter games
  const filteredGames = userGames.filter((userGame) => {
    // Platform filter - smart matching
    if (selectedPlatform !== 'All') {
      const gamePlatform = userGame.platform.toLowerCase();
      const filterPlatform = selectedPlatform.toLowerCase();

      // Special case: PC should match exactly
      if (filterPlatform === 'pc') {
        if (gamePlatform !== 'pc') {
          return false;
        }
      } else {
        // For other platforms, check if game platform contains the filter
        if (!gamePlatform.includes(filterPlatform)) {
          return false;
        }
      }
    }
    // Search filter
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
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold flex items-center space-x-2">
            <Library className="w-5 h-5 text-cyan-400" />
            <span>Game Library</span>
          </h2>
          <p className="text-sm text-gray-500">All your games across platforms</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 mb-6">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search games..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-deep border border-steel rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
          />
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* Platform Filter */}
          <div className="flex items-center space-x-2 flex-wrap gap-2">
            <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
            {PLATFORMS.map((platform) => (
              <button
                key={platform}
                onClick={() => setSelectedPlatform(platform)}
                className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
                  selectedPlatform === platform
                    ? 'bg-cyan-500 text-void'
                    : 'bg-deep text-gray-400 hover:text-white hover:bg-slate'
                }`}
              >
                {platform}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center space-x-2 sm:ml-auto">
            <ArrowUpDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-deep border border-steel rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all cursor-pointer hover:bg-slate"
            >
              <option value="title-asc">Title (A-Z)</option>
              <option value="title-desc">Title (Z-A)</option>
              <option value="recent">Recently Added</option>
              <option value="completion-desc">Completion (High-Low)</option>
              <option value="completion-asc">Completion (Low-High)</option>
              <option value="playtime-desc">Playtime (High-Low)</option>
              <option value="playtime-asc">Playtime (Low-High)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Game Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading games...</div>
      ) : sortedGames.length === 0 ? (
        <div className="text-center py-12 bg-deep border border-steel rounded-xl">
          <Library className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500">
            {userGames.length === 0 ? 'Your library is empty' : 'No games found'}
          </p>
          {userGames.length === 0 && (
            <button
              onClick={onAddGame}
              className="mt-4 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-void font-semibold rounded-lg transition-colors"
            >
              Add Your First Game
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {sortedGames.map((userGame, index) => (
            <GameCard
              key={userGame.id}
              game={userGame}
              index={index}
              onEdit={() => onEditGame(userGame)}
              onDelete={() => onDeleteGame(userGame)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
