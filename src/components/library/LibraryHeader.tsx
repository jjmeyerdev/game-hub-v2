'use client';

import { Library, Plus } from 'lucide-react';
import { SyncServiceDropdown } from './SyncServiceDropdown';

interface LibraryHeaderProps {
  totalGames: number;
  onAddGame: () => void;
}

export function LibraryHeader({ totalGames, onAddGame }: LibraryHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--theme-border)] bg-[var(--theme-bg-secondary)]/80 backdrop-blur-xl">
      <div className="px-8 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <Library className="w-6 h-6 text-cyan-400" />
              </div>
              {/* HUD corners */}
              <div className="absolute -top-1 -left-1 w-2 h-2 border-l-2 border-t-2 border-cyan-400/50" />
              <div className="absolute -top-1 -right-1 w-2 h-2 border-r-2 border-t-2 border-cyan-400/50" />
              <div className="absolute -bottom-1 -left-1 w-2 h-2 border-l-2 border-b-2 border-cyan-400/50" />
              <div className="absolute -bottom-1 -right-1 w-2 h-2 border-r-2 border-b-2 border-cyan-400/50" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-[var(--theme-text-subtle)] uppercase tracking-wider block mb-1">
                // GAME_LIBRARY
              </span>
              <h1 className="text-2xl font-bold text-[var(--theme-text-primary)] font-[family-name:var(--font-family-display)]">LIBRARY</h1>
            </div>
            <span className="px-3 py-1.5 text-xs font-mono text-cyan-400/80 bg-cyan-400/10 border border-cyan-400/20 rounded-lg">
              {totalGames} games
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Add Game */}
            <button
              onClick={onAddGame}
              className="group relative flex items-center gap-2 px-5 py-2.5 overflow-hidden rounded-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-violet-600 opacity-90 group-hover:opacity-100 transition-opacity" />
              <Plus className="relative w-4 h-4 text-white" />
              <span className="relative text-sm font-semibold text-white uppercase tracking-wide font-[family-name:var(--font-family-display)]">Add Game</span>
            </button>

            {/* Sync Dropdown */}
            <SyncServiceDropdown />
          </div>
        </div>
      </div>
    </header>
  );
}
