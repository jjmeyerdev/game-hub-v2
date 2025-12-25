'use client';

import { RefObject } from 'react';
import Image from 'next/image';
import { Search, Loader2, Gamepad2, Database } from 'lucide-react';
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
    <div className="p-5 border-b border-[var(--theme-border)]" ref={containerRef}>
      <div className="relative">
        {/* Search input */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
          {searching ? (
            <Loader2 className="w-4 h-4 text-[var(--theme-accent-cyan)] animate-spin" />
          ) : (
            <Search className="w-4 h-4 text-[var(--theme-text-muted)]" />
          )}
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => searchResults.length > 0 && setShowResults(true)}
          placeholder={isEditMode ? "Search IGDB to update game data..." : "Search IGDB by title..."}
          className="w-full pl-11 pr-24 py-3 bg-[var(--theme-hover-bg)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text-primary)] text-sm placeholder:text-[var(--theme-text-muted)] focus:outline-none focus:border-[var(--theme-border-hover)] focus:bg-[var(--theme-active-bg)] transition-all"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--theme-hover-bg)] border border-[var(--theme-border)] rounded-lg">
          <Database className="w-3 h-3 text-[var(--theme-accent-cyan)]" />
          <span className="text-[10px] font-medium text-[var(--theme-text-muted)]">IGDB</span>
        </div>

        {/* Search Results Dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-[var(--theme-bg-secondary)] border border-[var(--theme-border)] rounded-xl overflow-hidden z-50 max-h-80 overflow-y-auto" style={{ boxShadow: 'var(--theme-shadow-xl)' }}>
            {(() => {
              // Group results by platform
              const grouped = searchResults.reduce((acc, game) => {
                const platform = game.platform || 'Unknown';
                if (!acc[platform]) acc[platform] = [];
                acc[platform].push(game);
                return acc;
              }, {} as Record<string, typeof searchResults>);

              // Sort platforms
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
                  <div className="sticky top-0 px-4 py-2 bg-[var(--theme-bg-secondary)]/95 backdrop-blur-sm border-b border-[var(--theme-border)]">
                    <span className="text-[10px] font-medium text-[var(--theme-text-muted)] uppercase tracking-wider">{platform}</span>
                    <span className="text-[10px] text-[var(--theme-text-subtle)] ml-2">({grouped[platform].length})</span>
                  </div>
                  {/* Games list */}
                  {grouped[platform].map((game) => (
                    <button
                      key={game.id}
                      type="button"
                      onClick={() => onSelectGame(game)}
                      className="w-full flex items-start gap-3 p-3 hover:bg-[var(--theme-hover-bg)] transition-all border-b border-[var(--theme-border)] last:border-0 group"
                    >
                      <div className="flex-shrink-0 w-10 h-14 bg-[var(--theme-hover-bg)] rounded-lg overflow-hidden border border-[var(--theme-border)] group-hover:border-[var(--theme-border-hover)] transition-all relative">
                        {game.cover ? (
                          <Image src={game.cover} alt={game.name} fill className="object-cover" sizes="40px" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Gamepad2 className="w-4 h-4 text-[var(--theme-text-subtle)]" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <h4 className="font-medium text-[var(--theme-text-secondary)] group-hover:text-[var(--theme-text-primary)] transition-colors text-sm truncate">
                          {game.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          {game.releaseDate && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-[var(--theme-hover-bg)] border border-[var(--theme-border)] rounded text-[var(--theme-text-muted)]">
                              {new Date(game.releaseDate).getFullYear()}
                            </span>
                          )}
                          {game.developer && (
                            <span className="text-[10px] text-[var(--theme-text-muted)] truncate max-w-[120px]">
                              {game.developer}
                            </span>
                          )}
                        </div>
                        {game.genres.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {game.genres.slice(0, 2).map((genre) => (
                              <span key={genre} className="text-[10px] px-1.5 py-0.5 bg-violet-500/10 border border-violet-500/20 rounded text-violet-500">
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
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--theme-border)] to-transparent" />
        <span className="text-[10px] text-[var(--theme-text-subtle)] uppercase tracking-wider">
          {isEditMode ? 'or edit manually' : 'or enter manually'}
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--theme-border)] to-transparent" />
      </div>
    </div>
  );
}
