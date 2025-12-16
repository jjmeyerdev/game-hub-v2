'use client';

import { useState } from 'react';
import { Library, Edit3, Trash2, Eye, EyeOff, Unlock, Trophy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { UserGame } from '@/app/_actions/games';

interface NowPlayingCardProps {
  game: UserGame;
  onEdit: () => void;
  onDelete: () => void;
  index?: number;
}

export function NowPlayingCard({ game, onEdit, onDelete, index = 0 }: NowPlayingCardProps) {
  const router = useRouter();
  const [isRevealed, setIsRevealed] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const isHidden = game.hidden;

  // Check if game has adult tag
  const hasAdultTag = game.tags?.some(tag =>
    tag.toLowerCase() === 'adult' ||
    tag.toLowerCase() === 'nsfw' ||
    tag.toLowerCase() === '18+' ||
    tag.toLowerCase() === 'mature'
  ) ?? false;

  // Show blur for hidden games OR games with adult tags
  const isRestricted = isHidden || hasAdultTag;

  const formatLastPlayed = (date: string | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const played = new Date(date);
    const diffMs = now.getTime() - played.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return played.toLocaleDateString();
  };

  const handleClick = () => {
    router.push(`/game/${game.id}`);
  };

  const handleReveal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRevealing(true);
    setTimeout(() => {
      setIsRevealed(true);
      setIsRevealing(false);
    }, 600);
  };

  const handleHide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRevealed(false);
  };

  const showBlur = isRestricted && !isRevealed;

  // Noise texture SVG as data URL
  const noiseTexture = "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")";

  return (
    <div
      className={`
        relative flex-shrink-0 w-80 lg:w-96 bg-gradient-to-br from-deep via-abyss to-void rounded-xl overflow-hidden transition-all duration-500 group cursor-pointer
        animate-card-reveal
        ${isRestricted
          ? 'border-2 border-violet-500/50 shadow-[0_0_30px_-5px_rgba(139,92,246,0.4),0_0_60px_-10px_rgba(245,158,11,0.2)] hover:shadow-[0_0_40px_-5px_rgba(139,92,246,0.6),0_0_80px_-10px_rgba(245,158,11,0.3)] hover:border-violet-400/70'
          : 'border border-purple-500/30 hover:border-cyan-500/60 hover:shadow-[0_0_30px_-5px_rgba(0,217,255,0.3)] shadow-lg shadow-purple-500/10'
        }
      `}
      style={{ animationDelay: `${index * 100}ms` }}
      onClick={handleClick}
    >
      {/* Animated corner accents for restricted games - violet/amber */}
      {isRestricted && (
        <>
          <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-violet-500 z-30 animate-pulse" />
          <div
            className="absolute top-0 right-0 w-10 h-10 border-t-2 border-r-2 border-amber-500 z-30 animate-pulse"
            style={{ animationDelay: '0.5s' }}
          />
          <div
            className="absolute bottom-0 left-0 w-10 h-10 border-b-2 border-l-2 border-amber-500 z-30 animate-pulse"
            style={{ animationDelay: '1s' }}
          />
          <div
            className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-violet-500 z-30 animate-pulse"
            style={{ animationDelay: '1.5s' }}
          />
        </>
      )}

      <div className="aspect-video bg-gradient-to-br from-slate via-steel to-deep relative overflow-hidden">
        {/* Base image */}
        {game.game?.cover_url ? (
          <img
            src={game.game.cover_url}
            alt={game.game.title}
            className={`
              w-full h-full object-cover transition-all duration-700
              ${showBlur ? 'blur-2xl scale-125 brightness-[0.3] saturate-50' : ''}
              ${isRevealing ? 'blur-md scale-110 brightness-75' : ''}
            `}
            crossOrigin="anonymous"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
              if (placeholder) placeholder.style.display = 'flex';
            }}
          />
        ) : null}
        <div
          className={`absolute inset-0 ${game.game?.cover_url ? 'hidden' : 'flex'} items-center justify-center ${showBlur ? 'blur-xl' : ''}`}
        >
          <Library className="w-16 h-16 text-gray-700 opacity-30" />
        </div>

        {/* Pixelation / mosaic overlay effect */}
        {showBlur && (
          <div
            className="absolute inset-0 z-[5] opacity-60"
            style={{
              backgroundImage: `
                repeating-linear-gradient(0deg, transparent, transparent 8px, rgba(0,0,0,0.1) 8px, rgba(0,0,0,0.1) 16px),
                repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(0,0,0,0.1) 8px, rgba(0,0,0,0.1) 16px)
              `,
            }}
          />
        )}

        {/* Animated scanlines - violet/amber tones */}
        {showBlur && (
          <div className="absolute inset-0 z-[6] overflow-hidden pointer-events-none">
            {/* Horizontal scanlines */}
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(139,92,246,0.08) 2px, rgba(139,92,246,0.08) 4px)',
              }}
            />
            {/* Moving scan beam - amber glow */}
            <div
              className="absolute left-0 right-0 h-20 bg-gradient-to-b from-transparent via-amber-500/25 to-transparent animate-censor-scanline"
              style={{
                boxShadow: '0 0 60px 30px rgba(245,158,11,0.15)',
              }}
            />
          </div>
        )}

        {/* Noise/grain texture overlay */}
        {showBlur && (
          <div
            className="absolute inset-0 z-[7] opacity-40 mix-blend-overlay pointer-events-none"
            style={{ backgroundImage: noiseTexture }}
          />
        )}

        {/* Glitch RGB split effect layer */}
        {showBlur && game.game?.cover_url && (
          <>
            <div
              className="absolute inset-0 z-[4] mix-blend-screen opacity-50 animate-censor-glitch-r"
              style={{
                backgroundImage: `url(${game.game.cover_url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(20px) brightness(0.3)',
              }}
            />
            <div
              className="absolute inset-0 z-[4] mix-blend-screen opacity-50 animate-censor-glitch-b"
              style={{
                backgroundImage: `url(${game.game.cover_url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(20px) brightness(0.3)',
              }}
            />
          </>
        )}

        {/* Dark gradient overlay - deep violet/indigo */}
        {showBlur && (
          <div className="absolute inset-0 z-[8] bg-gradient-to-b from-violet-950/50 via-indigo-950/40 to-void/90" />
        )}


        {/* Decryption animation overlay */}
        {isRevealing && (
          <div className="absolute inset-0 z-[20] pointer-events-none overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 to-transparent animate-censor-decrypt" />
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute left-0 right-0 h-px bg-cyan-400/60 animate-censor-decrypt-line"
                style={{
                  top: `${(i + 1) * 12}%`,
                  animationDelay: `${i * 0.05}s`,
                  boxShadow: '0 0 10px rgba(0,217,255,0.5)',
                }}
              />
            ))}
          </div>
        )}

        {/* Re-hide button when revealed */}
        {isRestricted && isRevealed && (
          <button
            onClick={handleHide}
            className="
              absolute bottom-2 left-2 z-20
              flex items-center gap-1.5 px-2.5 py-1.5
              bg-void/80 hover:bg-violet-600/90
              border border-violet-500/50 hover:border-amber-400
              rounded-lg text-xs font-bold text-violet-300 hover:text-white
              transition-all duration-300 hover:scale-105
              shadow-lg backdrop-blur-sm
              group/hide
            "
            title="Hide content"
          >
            <EyeOff className="w-3.5 h-3.5 group-hover/hide:animate-pulse" />
            <span>Hide</span>
          </button>
        )}

        {/* Platform badge */}
        <div
          className={`
          absolute top-2 left-2 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded z-[25]
          ${
            isRestricted
              ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-violet-100 shadow-lg shadow-violet-500/40'
              : 'bg-cyan-500 text-void'
          }
        `}
        >
          {game.platform}
        </div>

        {/* Action buttons */}
        <div
          className={`absolute top-2 right-2 flex gap-1.5 transition-all duration-300 z-[25] ${showBlur ? 'opacity-0 pointer-events-none' : 'opacity-0 group-hover:opacity-100'}`}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-1.5 bg-cyan-500 hover:bg-cyan-400 rounded-md text-void transition-all transform hover:scale-110 shadow-lg"
            title="Edit game"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 bg-red-500 hover:bg-red-400 rounded-md text-white transition-all transform hover:scale-110 shadow-lg"
            title="Delete game"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Card content */}
      <div className={`relative p-5 lg:p-6 transition-all duration-500 ${showBlur ? 'blur-sm' : ''}`}>
        {/* Redacted text effect for hidden games - violet/amber tones */}
        {showBlur && (
          <div className="absolute inset-0 p-5 lg:p-6 z-10">
            <div className="h-6 w-3/4 bg-gradient-to-r from-violet-900/60 to-indigo-900/40 rounded mb-4 animate-pulse" />
            <div className="flex justify-between mb-4">
              <div className="h-4 w-20 bg-violet-900/40 rounded" />
              <div className="h-4 w-24 bg-amber-900/30 rounded" />
            </div>
            <div className="h-4 w-full bg-violet-900/30 rounded mb-2" />
            <div className="h-2.5 w-full bg-indigo-900/20 rounded-full" />
          </div>
        )}

        {/* Mission identifier */}
        {!showBlur && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-bold tracking-[0.2em] text-gray-600 uppercase">
              Mission #{String(index + 1).padStart(2, '0')}
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-steel to-transparent" />
          </div>
        )}

        <h3
          className={`
          text-lg lg:text-xl font-bold mb-3 transition-all duration-300 truncate
          ${isRestricted ? 'text-violet-200 group-hover:text-violet-100' : 'text-white group-hover:text-cyan-300'}
          ${showBlur ? 'opacity-0' : ''}
        `}
          style={{ fontFamily: 'var(--font-rajdhani)' }}
        >
          {game.game?.title || 'Untitled'}
        </h3>
        <div className={`flex items-center justify-between text-sm mb-4 ${showBlur ? 'opacity-0' : ''}`}>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-400/60" />
            <span className="text-gray-500 font-medium">{Math.round(game.playtime_hours)}h logged</span>
          </span>
          <span className="text-gray-600 text-xs font-bold tracking-wider">{formatLastPlayed(game.last_played_at)}</span>
        </div>
        {(() => {
          const platform = game.platform?.toLowerCase() || '';
          const isPlayStation = platform.includes('playstation') || platform.includes('ps3') || platform.includes('ps4') || platform.includes('ps5') || platform.includes('psn') || platform.includes('vita');
          const label = isPlayStation ? 'Trophies' : 'Achievements';

          return (
            <div className={`space-y-2.5 ${showBlur ? 'opacity-0' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-bold tracking-[0.15em] text-gray-500 uppercase">{label}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className={`text-lg font-black tabular-nums ${isRestricted ? 'text-amber-400' : 'text-amber-400'}`} style={{ fontFamily: 'var(--font-rajdhani)' }}>
                    {game.achievements_earned}
                  </span>
                  <span className="text-xs text-gray-600 font-medium">/</span>
                  <span className="text-sm font-bold text-gray-500 tabular-nums" style={{ fontFamily: 'var(--font-rajdhani)' }}>
                    {game.achievements_total}
                  </span>
                </div>
              </div>
              <div className="relative w-full h-2 bg-void/50 rounded-full overflow-hidden border border-steel/50">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${isRestricted ? 'bg-gradient-to-r from-violet-500 via-fuchsia-500 to-amber-500' : 'bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-400'}`}
                  style={{ width: `${game.achievements_total > 0 ? (game.achievements_earned / game.achievements_total) * 100 : 0}%` }}
                />
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
              </div>
            </div>
          );
        })()}
      </div>

      {/* Bottom accent */}
      {!isRestricted && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      )}

      {/* 18+ badge - upper right corner */}
      {showBlur && (
        <div className="absolute top-2 right-2 z-[45] px-2 py-0.5 bg-rose-500/90 rounded text-[10px] font-black text-white tracking-wide shadow-lg shadow-rose-500/30">
          18+
        </div>
      )}

      {/* RESTRICTED content overlay - minimal floating design */}
      {showBlur && (
        <div className="absolute inset-0 z-[40] flex items-center justify-center rounded-xl">
          <div className="flex flex-col items-center">
            {/* Icon in circular outline - rose/red color */}
            <div className="relative mb-4">
              <div className="w-16 h-16 rounded-full border-2 border-rose-500/60 flex items-center justify-center">
                <EyeOff className="w-7 h-7 text-rose-500" />
              </div>
            </div>

            {/* RESTRICTED text */}
            <span
              className="text-sm font-bold tracking-[0.3em] text-rose-400/90 uppercase mb-6"
              style={{ fontFamily: 'var(--font-rajdhani)' }}
            >
              RESTRICTED
            </span>

            {/* Reveal button - minimal style */}
            <button
              onClick={handleReveal}
              disabled={isRevealing}
              className="
                flex items-center justify-center gap-2 px-6 py-2.5
                bg-transparent
                border border-violet-500/50 hover:border-violet-400
                rounded-full
                text-sm font-semibold text-violet-300 hover:text-violet-200
                transition-all duration-300
                hover:bg-violet-500/10
                disabled:opacity-50 disabled:cursor-wait
              "
            >
              {isRevealing ? (
                <>
                  <Unlock className="w-4 h-4 animate-pulse" />
                  <span>Revealing...</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  <span>REVEAL</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
