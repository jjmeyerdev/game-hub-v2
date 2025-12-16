'use client';

import { RefObject } from 'react';
import { Search, Loader2, Zap, Gamepad2 } from 'lucide-react';
import type { IGDBGame } from '@/lib/types';

interface IGDBSearchSectionProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: IGDBGame[];
  searching: boolean;
  showResults: boolean;
  setShowResults: (show: boolean) => void;
  containerRef: RefObject<HTMLDivElement | null>;
  onSelectGame: (game: IGDBGame) => void;
  isEditMode: boolean;
}

export function IGDBSearchSection({
  searchQuery,
  setSearchQuery,
  searchResults,
  searching,
  showResults,
  setShowResults,
  containerRef,
  onSelectGame,
  isEditMode,
}: IGDBSearchSectionProps) {
  return (
    <div className="p-5 border-b border-steel/50" ref={containerRef}>
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
          {searching ? (
            <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
          ) : (
            <Search className="w-5 h-5 text-cyan-400" />
          )}
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => searchResults.length > 0 && setShowResults(true)}
          placeholder={isEditMode ? "Search IGDB to replace game data..." : "Search by title or IGDB ID..."}
          className="w-full pl-12 pr-24 py-3.5 bg-abyss border border-steel/50 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all font-mono text-sm"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
            <Zap className="w-3 h-3 text-cyan-400" />
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">IGDB</span>
          </div>
        </div>

        {/* Search Results - Grouped by Platform */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-abyss border border-cyan-500/30 rounded-xl overflow-hidden shadow-2xl shadow-cyan-500/10 z-50 max-h-96 overflow-y-auto">
            {(() => {
              // Group results by platform
              const grouped = searchResults.reduce((acc, game) => {
                const platform = game.platform || 'Unknown';
                if (!acc[platform]) acc[platform] = [];
                acc[platform].push(game);
                return acc;
              }, {} as Record<string, typeof searchResults>);

              // Sort platforms: PC first, then alphabetically
              const sortedPlatforms = Object.keys(grouped).sort((a, b) => {
                if (a.includes('PC') || a.includes('Windows')) return -1;
                if (b.includes('PC') || b.includes('Windows')) return 1;
                if (a.includes('PlayStation')) return -1;
                if (b.includes('PlayStation')) return 1;
                if (a.includes('Xbox')) return -1;
                if (b.includes('Xbox')) return 1;
                return a.localeCompare(b);
              });

              return sortedPlatforms.map((platform) => (
                <div key={platform}>
                  {/* Platform Header */}
                  <div className="sticky top-0 px-3 py-2 bg-deep/95 backdrop-blur-sm border-b border-steel/30 flex items-center gap-2">
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">{platform}</span>
                    <span className="text-[10px] text-gray-600">({grouped[platform].length})</span>
                  </div>
                  {/* Games for this platform */}
                  {grouped[platform].map((game) => (
                    <button
                      key={game.id}
                      type="button"
                      onClick={() => onSelectGame(game)}
                      className="w-full flex items-start gap-3 p-3 hover:bg-cyan-500/10 transition-all border-b border-steel/20 last:border-0 group"
                    >
                      <div className="flex-shrink-0 w-10 h-14 bg-deep rounded-lg overflow-hidden border border-steel/50 group-hover:border-cyan-500/50 transition-all">
                        {game.cover ? (
                          <img src={game.cover} alt={game.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Gamepad2 className="w-4 h-4 text-gray-700" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <h4 className="font-semibold text-white group-hover:text-cyan-400 transition-colors text-sm truncate">
                          {game.name}
                        </h4>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {game.releaseDate && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-steel/50 rounded text-gray-400 font-mono">
                              {new Date(game.releaseDate).getFullYear()}
                            </span>
                          )}
                          {game.developer && (
                            <span className="text-[10px] text-gray-500 truncate max-w-[100px]">
                              {game.developer}
                            </span>
                          )}
                        </div>
                        {game.genres.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {game.genres.slice(0, 2).map((genre) => (
                              <span key={genre} className="text-[10px] px-1.5 py-0.5 bg-purple-500/20 border border-purple-500/30 rounded text-purple-400">
                                {genre}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ));
            })()}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 mt-4">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-steel/50 to-transparent" />
        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
          {isEditMode ? 'or edit manually below' : 'or enter manually'}
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-steel/50 to-transparent" />
      </div>
    </div>
  );
}
