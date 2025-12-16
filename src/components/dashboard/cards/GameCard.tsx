'use client';

import { useState } from 'react';
import { Edit3, Trash2, Trophy, EyeOff, Eye, Flame, Clock, Gamepad2, Disc } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { UserGame } from '@/app/_actions/games';
import { getGameSyncSource } from '@/lib/utils';

interface GameCardProps {
  game: UserGame;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  censorHidden?: boolean;
}

export function GameCard({ game, index, onEdit, onDelete, censorHidden = true }: GameCardProps) {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const isCompleted = game.status === 'completed' || game.status === 'finished';
  const isAdult = game.tags?.includes('adult') ?? false;
  const shouldCensor = isAdult && censorHidden && !isRevealed;
  const hasPlaytime = game.playtime_hours > 0;

  const handleClick = () => {
    router.push(`/game/${game.id}`);
  };

  // Format playtime nicely
  const formatPlaytime = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 100) return `${hours.toFixed(1)}h`;
    return `${Math.round(hours)}h`;
  };

  // Get status color
  const getStatusColor = () => {
    switch (game.status) {
      case 'playing': return 'from-emerald-500 to-cyan-500';
      case 'played': return 'from-purple-500 to-violet-500';
      case 'completed': return 'from-cyan-400 to-blue-500';
      case 'finished': return 'from-amber-400 to-orange-500';
      case 'on_hold': return 'from-rose-400 to-pink-500';
      case 'dropped': return 'from-red-500 to-rose-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div
      className="group relative cursor-pointer perspective-1000"
      style={{
        animation: `cardReveal 0.5s cubic-bezier(0.22, 1, 0.36, 1) ${index * 0.04}s both`,
      }}
      onClick={handleClick}
    >
      {/* Outer glow container */}
      <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-b from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm pointer-events-none" />

      {/* Main card */}
      <div
        className={`relative aspect-[2/3] rounded-xl overflow-hidden transition-all duration-500 ease-out group-hover:-translate-y-1.5 group-hover:scale-[1.02] ${shouldCensor ? 'ring-1 ring-purple-500/30' : 'ring-1 ring-white/5 group-hover:ring-cyan-500/50'}`}
        style={{
          transformStyle: 'preserve-3d',
          boxShadow: '0 2px 8px rgba(0,0,0,0.4), 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        {/* Animated edge lighting */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-30"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(0,217,255,0.15) 2%, transparent 4%), linear-gradient(270deg, transparent 0%, rgba(184,69,255,0.15) 2%, transparent 4%), linear-gradient(180deg, transparent 0%, rgba(0,217,255,0.1) 2%, transparent 4%)',
          }}
        />

        {/* Scanline effect on hover */}
        <div className="absolute inset-0 pointer-events-none z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
          <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent animate-card-scanline" />
        </div>

        {/* Cover image */}
        {game.game?.cover_url && !imageError ? (
          <img
            src={game.game.cover_url}
            alt={game.game.title || 'Game cover'}
            className={`w-full h-full object-cover transition-all duration-500 ${shouldCensor ? 'blur-2xl scale-125 brightness-50' : 'group-hover:scale-105 group-hover:brightness-110'}`}
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br from-deep via-slate to-abyss flex items-center justify-center ${shouldCensor ? 'blur-xl' : ''}`}>
            <div className="relative">
              <Gamepad2 className="w-16 h-16 text-steel/50" strokeWidth={1} />
              <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/20 to-transparent blur-xl" />
            </div>
          </div>
        )}

        {/* Dark gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-void via-void/20 to-transparent opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-b from-void/60 via-transparent to-transparent" />

        {/* Censorship Overlay */}
        {shouldCensor && (
          <div className="absolute inset-0 bg-purple-950/60 backdrop-blur-md flex flex-col items-center justify-center z-10">
            <div className="relative">
              <div className="w-14 h-14 rounded-full bg-purple-500/10 flex items-center justify-center ring-2 ring-purple-500/30 backdrop-blur-sm">
                <EyeOff className="w-6 h-6 text-purple-400" />
              </div>
              <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl" />
            </div>
            <span className="mt-3 text-[10px] font-bold text-purple-300/80 uppercase tracking-[0.2em]">Private</span>

            {/* Reveal button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsRevealed(true);
              }}
              className="mt-4 group/reveal relative px-4 py-1.5 rounded-lg overflow-hidden transition-all duration-300 hover:scale-105"
            >
              {/* Animated gradient border */}
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500 via-cyan-500 to-purple-500 opacity-50 group-hover/reveal:opacity-100 transition-opacity" style={{ backgroundSize: '200% 100%', animation: 'shimmer 2s linear infinite' }} />
              <div className="absolute inset-[1px] rounded-[7px] bg-void/90 backdrop-blur-sm" />

              {/* Button content */}
              <div className="relative flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-purple-300 group-hover/reveal:text-cyan-300 transition-colors" />
                <span className="text-[10px] font-bold text-purple-300 group-hover/reveal:text-cyan-300 uppercase tracking-wider transition-colors">
                  Reveal
                </span>
              </div>

              {/* Glow effect on hover */}
              <div className="absolute inset-0 rounded-lg opacity-0 group-hover/reveal:opacity-100 transition-opacity pointer-events-none" style={{ boxShadow: '0 0 20px rgba(139, 92, 246, 0.3), 0 0 40px rgba(6, 182, 212, 0.2)' }} />
            </button>
          </div>
        )}

        {/* Re-hide button when revealed */}
        {isAdult && censorHidden && isRevealed && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsRevealed(false);
            }}
            className="absolute top-2.5 right-2.5 z-20 p-1.5 rounded-lg bg-void/80 backdrop-blur-md ring-1 ring-purple-500/30 hover:ring-purple-500 hover:bg-purple-500/20 transition-all duration-200 hover:scale-110 group/hide"
            title="Hide content"
          >
            <EyeOff className="w-3.5 h-3.5 text-purple-400 group-hover/hide:text-purple-300 transition-colors" />
          </button>
        )}

        {/* Top section - Platform & sync badges */}
        <div className="absolute top-0 left-0 right-0 p-2.5 z-10">
          <div className="flex items-start justify-between">
            {/* Platform badge - show console name if available, otherwise full platform */}
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 bg-void/70 backdrop-blur-md text-[10px] font-bold text-gray-300 rounded-md ring-1 ring-white/10 uppercase tracking-wide">
                {(() => {
                  // Extract console from "Platform (Console)" format
                  const match = game.platform.match(/^(.+?)\s*\((.+)\)$/);
                  if (match) {
                    // Has console - show only the console name
                    return match[2];
                  }
                  // No console - show full platform name
                  return game.platform;
                })()}
              </span>

              {/* Sync badge - based on user's platform, not shared game IDs */}
              {(() => {
                const syncSource = getGameSyncSource(game);
                if (syncSource === 'steam') return (
                  <span className="w-6 h-5 bg-[#1b2838]/90 backdrop-blur-md rounded flex items-center justify-center ring-1 ring-white/10" title="Steam">
                    <svg className="w-3 h-3 text-[#66c0f4]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0z"/>
                    </svg>
                  </span>
                );
                if (syncSource === 'psn') return (
                  <span className="w-6 h-5 bg-[#003791]/90 backdrop-blur-md rounded flex items-center justify-center ring-1 ring-white/10" title="PlayStation">
                    <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8.985 2.596v17.548l3.915 1.261V6.688c0-.69.304-1.151.794-.991.636.181.76.814.76 1.505v5.876c2.441 1.193 4.362-.002 4.362-3.153 0-3.237-1.126-4.675-4.438-5.827-1.307-.448-3.728-1.186-5.391-1.502h-.002zm4.656 16.242l6.296-2.275c.715-.258.826-.625.246-.818-.586-.192-1.637-.139-2.357.123l-4.205 1.5v-2.385l.24-.085s1.201-.42 2.913-.615c1.696-.18 3.792.03 5.437.661 1.848.596 2.063 1.473 1.597 2.085-.466.611-1.635 1.04-1.635 1.04l-8.532 3.047v-2.278zM1.004 18.241c-1.513-.453-1.775-1.396-1.08-1.985.654-.556 1.77-.96 1.77-.96l5.572-1.99v2.316l-4.049 1.446c-.715.257-.826.625-.247.817.587.193 1.637.14 2.358-.12l1.938-.707v2.068c-.127.026-.262.047-.39.07-1.765.286-3.655.078-5.872-.955z"/>
                    </svg>
                  </span>
                );
                if (syncSource === 'xbox') return (
                  <span className="w-6 h-5 bg-[#107c10]/90 backdrop-blur-md rounded flex items-center justify-center ring-1 ring-white/10" title="Xbox">
                    <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6.43 3.72A9.449 9.449 0 0 0 5.4 4.63c-.43.43.64 2.12 1.97 3.56 1.32 1.45 3.32 3.53 4.63 5.97 1.31-2.44 3.31-4.52 4.63-5.97 1.33-1.44 2.4-3.13 1.97-3.56a9.449 9.449 0 0 0-1.03-.91C14.93 2.23 13.09 2 12 2c-1.09 0-2.93.23-5.57 1.72zm-3.65 4.6c-1.58 2.05-2.3 4.1-2.3 6.2 0 1.59.29 2.97.85 4.18 1.07-1.46 2.4-3.73 3.66-5.95 1.26-2.23 2.37-3.98 3.16-4.92-1.42-1.52-3.46-3.67-4.08-3.16-.28.23-.8.87-1.29 1.65zm18.45 0c-.5-.78-1.01-1.42-1.3-1.65-.61-.51-2.65 1.64-4.07 3.16.79.94 1.9 2.69 3.16 4.92 1.26 2.22 2.59 4.49 3.66 5.95.56-1.21.85-2.59.85-4.18 0-2.1-.72-4.15-2.3-6.2zM12 13.61c-1.62 2.93-3.49 6.13-4.31 7.45.92.42 2.04.94 4.31.94 2.27 0 3.39-.52 4.31-.94-.82-1.32-2.69-4.52-4.31-7.45z"/>
                    </svg>
                  </span>
                );
                if (syncSource === 'epic') return (
                  <span className="w-6 h-5 bg-[#2a2a2a]/90 backdrop-blur-md rounded flex items-center justify-center ring-1 ring-white/10" title="Epic Games">
                    <span className="text-[10px] font-black text-white">E</span>
                  </span>
                );
                return null; // manual - no badge
              })()}
            </div>

            {/* Status indicators */}
            <div className="flex items-center gap-1">
              {game.is_physical && (
                <span className="w-6 h-5 bg-amber-500/20 backdrop-blur-md rounded flex items-center justify-center ring-1 ring-amber-500/40" title="Physical Copy">
                  <Disc className="w-3 h-3 text-amber-400" />
                </span>
              )}
              {game.priority === 'high' && (
                <span className="w-6 h-5 bg-red-500/20 backdrop-blur-md rounded flex items-center justify-center ring-1 ring-red-500/40" title="High Priority">
                  <Flame className="w-3 h-3 text-red-400" />
                </span>
              )}
              {isCompleted && (
                <span className="w-6 h-5 bg-cyan-500/20 backdrop-blur-md rounded flex items-center justify-center ring-1 ring-cyan-500/40" title="Completed">
                  <Trophy className="w-3 h-3 text-cyan-400" />
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bottom info section */}
        <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
          {/* Title */}
          <h3
            className={`font-bold text-sm leading-tight line-clamp-2 mb-2 transition-colors duration-300 ${shouldCensor ? 'text-purple-300/30 blur-sm select-none' : 'text-white group-hover:text-cyan-300'}`}
            style={{ fontFamily: 'var(--font-family-display)', textTransform: 'none', letterSpacing: '0.01em' }}
          >
            {game.game?.title || 'Untitled'}
          </h3>

          {/* Stats row */}
          {!shouldCensor && (
            <div className="flex items-center gap-2">
              {/* Playtime chip */}
              {hasPlaytime && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white/5 rounded backdrop-blur-sm">
                  <Clock className="w-2.5 h-2.5 text-gray-400" />
                  <span className="text-[10px] font-medium text-gray-400">{formatPlaytime(game.playtime_hours)}</span>
                </div>
              )}

              {/* Status indicator line */}
              <div className="flex-1 h-0.5 rounded-full overflow-hidden bg-white/5">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${getStatusColor()} transition-all duration-500`}
                  style={{
                    width: game.status === 'unplayed' ? '0%' :
                           game.status === 'playing' ? '50%' :
                           game.status === 'played' ? '75%' :
                           game.status === 'completed' ? '100%' :
                           game.status === 'finished' ? '100%' : '25%'
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Hover action buttons */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-2 z-20 opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 ease-out">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-2.5 bg-void/80 backdrop-blur-md rounded-lg text-cyan-400 ring-1 ring-cyan-500/30 hover:ring-cyan-500 hover:bg-cyan-500/20 transition-all duration-200 hover:scale-110 hover:shadow-lg hover:shadow-cyan-500/20"
            title="Edit game"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-2.5 bg-void/80 backdrop-blur-md rounded-lg text-red-400 ring-1 ring-red-500/30 hover:ring-red-500 hover:bg-red-500/20 transition-all duration-200 hover:scale-110 hover:shadow-lg hover:shadow-red-500/20"
            title="Delete game"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-white/10 rounded-tl-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-white/10 rounded-tr-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-cyan-500/30 rounded-bl-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-purple-500/30 rounded-br-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      </div>

      {/* Card reflection/glow underneath */}
      <div
        className="absolute -bottom-2 left-2 right-2 h-8 opacity-0 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,217,255,0.3), transparent)',
          filter: 'blur(8px)',
          transform: 'scaleY(-0.5)',
        }}
      />

    </div>
  );
}
