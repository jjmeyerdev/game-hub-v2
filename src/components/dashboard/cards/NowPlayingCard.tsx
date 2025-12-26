'use client';

import { useState } from 'react';
import { Library, Edit3, Trash2, Eye, EyeOff, Trophy, Gamepad2, ShieldOff, Unlock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { UserGame } from '@/lib/actions/games';
import { getPlatformBrandStyle, getDisplayPlatform } from '@/lib/constants/platforms';
import { SteamLogo, PlayStationLogo, XboxLogo, EpicLogo } from '@/components/icons/PlatformLogos';

const getPlatformIcon = (platform: string) => {
  const lowerPlatform = platform.toLowerCase();
  if (lowerPlatform.includes('steam')) return <SteamLogo className="w-3.5 h-3.5" />;
  if (lowerPlatform.includes('playstation') || lowerPlatform.includes('ps')) return <PlayStationLogo className="w-3.5 h-3.5" />;
  if (lowerPlatform.includes('xbox')) return <XboxLogo className="w-3.5 h-3.5" />;
  if (lowerPlatform.includes('epic')) return <EpicLogo className="w-3.5 h-3.5" />;
  return <Gamepad2 className="w-3.5 h-3.5" />;
};

interface NowPlayingCardProps {
  game: UserGame;
  onEdit: () => void;
  onDelete: () => void;
  index?: number;
}

export function NowPlayingCard({ game, onEdit, onDelete, index = 0 }: NowPlayingCardProps) {
  const router = useRouter();
  const [isRevealed, setIsRevealed] = useState(false);
  const isHidden = game.hidden;

  const hasAdultTag = game.tags?.some(tag =>
    tag.toLowerCase() === 'adult' ||
    tag.toLowerCase() === 'nsfw' ||
    tag.toLowerCase() === '18+' ||
    tag.toLowerCase() === 'mature'
  ) ?? false;

  const isRestricted = isHidden || hasAdultTag;

  const formatLastPlayed = (date: string | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const played = new Date(date);
    const diffMs = now.getTime() - played.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return played.toLocaleDateString();
  };

  const handleClick = () => {
    router.push(`/game/${game.id}`);
  };

  const handleReveal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRevealed(true);
  };

  const handleHide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRevealed(false);
  };

  const showBlur = isRestricted && !isRevealed;

  return (
    <div
      className="relative shrink-0 w-80 lg:w-[340px] bg-card border border-theme rounded-2xl overflow-hidden transition-all duration-500 group cursor-pointer hover:bg-theme-hover hover:border-theme-hover"
      style={{ animationDelay: `${index * 100}ms` }}
      onClick={handleClick}
    >
      {/* Cover Image */}
      <div className="aspect-16/10 bg-card relative overflow-hidden">
        {game.game?.cover_url ? (
          <img
            src={game.game.cover_url}
            alt={game.game.title}
            className={`w-full h-full object-cover transition-all duration-700 ${showBlur ? 'blur-2xl scale-125 brightness-[0.2]' : 'group-hover:scale-105'}`}
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
          <Library className="w-12 h-12 text-theme-subtle" />
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-theme-primary via-transparent to-transparent opacity-80" />

        {/* Platform badge */}
        {(() => {
          const brandStyle = getPlatformBrandStyle(game.platform);
          return (
            <div className={`absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider rounded-lg backdrop-blur-sm border ${brandStyle.bg} ${brandStyle.text} ${brandStyle.border} ${brandStyle.glow ?? ''}`}>
              {getPlatformIcon(game.platform)}
              {getDisplayPlatform(game.platform)}
            </div>
          );
        })()}

        {/* Action buttons */}
        <div className={`absolute top-3 right-3 flex gap-2 transition-all duration-300 ${showBlur ? 'opacity-0 pointer-events-none' : 'opacity-0 group-hover:opacity-100'}`}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-2 bg-theme-hover backdrop-blur-sm hover:bg-card-hover rounded-lg text-theme-muted hover:text-theme-primary transition-all border border-theme"
            title="Edit game"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-2 bg-red-500/20 backdrop-blur-sm hover:bg-red-500/30 rounded-lg text-red-400 hover:text-red-300 transition-all border border-red-500/20"
            title="Delete game"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Re-hide button */}
        {isRestricted && isRevealed && (
          <button
            onClick={handleHide}
            className="restricted-hide-btn absolute bottom-3 left-3"
          >
            <EyeOff className="w-3.5 h-3.5" />
            Restrict
          </button>
        )}

        {/* Restricted overlay */}
        {showBlur && (
          <div className="absolute inset-0 restricted-overlay restricted-stripes flex items-center justify-center">
            {/* Scanning line effect */}
            <div className="restricted-scanline" />

            <div className="flex flex-col items-center relative z-10">
              {/* Shield icon with pulse ring */}
              <div className="restricted-shield mb-4">
                <ShieldOff className="w-6 h-6 text-orange-400" />
              </div>

              {/* Restricted badge */}
              <div className="restricted-badge mb-5">
                Restricted Content
              </div>

              {/* Reveal button */}
              <button
                onClick={handleReveal}
                className="restricted-reveal-btn"
              >
                <Unlock className="w-4 h-4" />
                <span>Authorize</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Card content */}
      <div className={`p-5 ${showBlur ? 'blur-sm' : ''}`}>
        <h3 className="text-lg font-semibold text-theme-primary mb-3 truncate group-hover:text-cyan-400 transition-colors">
          {game.game?.title || 'Untitled'}
        </h3>

        <div className="flex items-center justify-between text-sm mb-4">
          <span className="text-theme-subtle">
            {Math.round(game.playtime_hours)}h played
          </span>
          <span className="text-theme-subtle text-xs">
            {formatLastPlayed(game.last_played_at)}
          </span>
        </div>

        {/* Achievements */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs text-theme-subtle">
                {game.platform?.toLowerCase().includes('playstation') ? 'Trophies' : 'Achievements'}
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-semibold text-amber-400 tabular-nums">
                {game.achievements_earned}
              </span>
              <span className="text-xs text-theme-subtle">/</span>
              <span className="text-xs text-theme-subtle tabular-nums">
                {game.achievements_total}
              </span>
            </div>
          </div>
          <div className="relative w-full h-1.5 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${game.achievements_total > 0 ? (game.achievements_earned / game.achievements_total) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
