'use client';

import { useState } from 'react';
import { Edit3, Trash2, Trophy, EyeOff, Eye, Flame, Clock, Gamepad2, Disc } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { UserGame } from '@/lib/actions/games';
import { getGameSyncSource } from '@/lib/utils';
import { SteamLogo, PlayStationLogo, XboxLogo, EpicLogo } from '@/components/icons/PlatformLogos';
import { getPlatformBrandStyle } from '@/lib/constants/platforms';

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

  const formatPlaytime = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 100) return `${hours.toFixed(1)}h`;
    return `${Math.round(hours)}h`;
  };

  const getStatusColor = () => {
    switch (game.status) {
      case 'playing': return 'bg-emerald-400';
      case 'played': return 'bg-violet-400';
      case 'completed': return 'bg-cyan-400';
      case 'finished': return 'bg-amber-400';
      case 'on_hold': return 'bg-rose-400';
      case 'dropped': return 'bg-red-400';
      default: return 'bg-white/20';
    }
  };

  return (
    <div
      className="group relative cursor-pointer"
      style={{
        animation: `fadeIn 0.4s ease-out ${index * 0.03}s both`,
      }}
      onClick={handleClick}
    >
      {/* Main card */}
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-white/[0.02] border border-white/[0.06] transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.03]">
        {/* Cover image */}
        {game.game?.cover_url && !imageError ? (
          <img
            src={game.game.cover_url}
            alt={game.game.title || 'Game cover'}
            className={`w-full h-full object-cover transition-all duration-500 ${shouldCensor ? 'blur-2xl scale-125 brightness-[0.2]' : 'group-hover:scale-105'}`}
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent flex items-center justify-center ${shouldCensor ? 'blur-xl' : ''}`}>
            <Gamepad2 className="w-12 h-12 text-white/10" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#030304] via-[#030304]/20 to-transparent opacity-90" />

        {/* Censorship Overlay */}
        {shouldCensor && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/40 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center mb-3">
              <EyeOff className="w-5 h-5 text-white/50" />
            </div>
            <span className="text-[10px] font-medium tracking-[0.2em] text-white/40 uppercase mb-3">Private</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsRevealed(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-[10px] font-medium text-white/60 hover:text-white transition-all"
            >
              <Eye className="w-3 h-3" />
              Reveal
            </button>
          </div>
        )}

        {/* Re-hide button */}
        {isAdult && censorHidden && isRevealed && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsRevealed(false);
            }}
            className="absolute top-2 right-2 z-20 p-1.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-all"
            title="Hide content"
          >
            <EyeOff className="w-3 h-3 text-white/60" />
          </button>
        )}

        {/* Top badges */}
        <div className="absolute top-0 left-0 right-0 p-2 z-10">
          <div className="flex items-start justify-between">
            {/* Platform badge */}
            <div className="flex items-center gap-1">
              {(() => {
                const match = game.platform.match(/^(.+?)\s*\((.+)\)$/);
                const displayPlatform = match ? match[2] : game.platform;
                const brandStyle = getPlatformBrandStyle(game.platform);
                return (
                  <span className={`px-2.5 py-1.5 backdrop-blur-sm text-[10px] font-medium rounded-lg border uppercase tracking-wide ${brandStyle.bg} ${brandStyle.text} ${brandStyle.border} ${brandStyle.glow ?? ''}`}>
                    {displayPlatform}
                  </span>
                );
              })()}

              {/* Sync badge */}
              {(() => {
                const syncSource = getGameSyncSource(game);
                const badgeStyles: Record<string, {
                  gradient: string;
                  border: string;
                  shadow: string;
                  icon: React.ReactNode;
                }> = {
                  steam: {
                    gradient: 'bg-gradient-to-br from-[#1b2838] via-[#2a475e] to-[#1b2838]',
                    border: 'border-[#66c0f4]/30',
                    shadow: '0 0 12px rgba(102, 192, 244, 0.25), inset 0 1px 0 rgba(255,255,255,0.1)',
                    icon: <SteamLogo className="w-3.5 h-3.5 text-[#66c0f4] drop-shadow-[0_0_3px_rgba(102,192,244,0.5)]" />,
                  },
                  psn: {
                    gradient: 'bg-gradient-to-br from-[#003087] via-[#0070d1] to-[#003087]',
                    border: 'border-[#0070d1]/40',
                    shadow: '0 0 12px rgba(0, 112, 209, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
                    icon: <PlayStationLogo className="w-3.5 h-3.5 text-white drop-shadow-[0_0_3px_rgba(0,112,209,0.6)]" />,
                  },
                  xbox: {
                    gradient: 'bg-gradient-to-br from-[#0e7a0d] via-[#107c10] to-[#0e7a0d]',
                    border: 'border-[#52b043]/40',
                    shadow: '0 0 12px rgba(16, 124, 16, 0.35), inset 0 1px 0 rgba(255,255,255,0.1)',
                    icon: <XboxLogo className="w-3.5 h-3.5 text-white drop-shadow-[0_0_3px_rgba(82,176,67,0.6)]" />,
                  },
                  epic: {
                    gradient: 'bg-gradient-to-br from-[#1a1a1a] via-[#2d2d2d] to-[#1a1a1a]',
                    border: 'border-white/20',
                    shadow: '0 0 12px rgba(255, 255, 255, 0.08), inset 0 1px 0 rgba(255,255,255,0.1)',
                    icon: <EpicLogo className="w-3.5 h-3.5 text-white drop-shadow-[0_0_2px_rgba(255,255,255,0.4)]" />,
                  },
                };

                const badge = badgeStyles[syncSource];
                if (!badge) return null;

                return (
                  <span
                    className={`relative p-1.5 ${badge.gradient} backdrop-blur-md rounded-lg flex items-center justify-center border ${badge.border} transition-all duration-300 hover:scale-110`}
                    style={{ boxShadow: badge.shadow }}
                  >
                    {badge.icon}
                  </span>
                );
              })()}
            </div>

            {/* Status indicators */}
            <div className="flex items-center gap-1.5">
              {game.is_physical && (
                <span className="p-1.5 bg-amber-500/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-amber-500/30" title="Physical">
                  <Disc className="w-3.5 h-3.5 text-amber-400" />
                </span>
              )}
              {game.priority === 'high' && (
                <span className="p-1.5 bg-red-500/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-red-500/30" title="High Priority">
                  <Flame className="w-3.5 h-3.5 text-red-400" />
                </span>
              )}
              {isCompleted && (
                <span className="p-1.5 bg-cyan-500/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-cyan-500/30" title="Completed">
                  <Trophy className="w-3.5 h-3.5 text-cyan-400" />
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
          <h3
            className={`font-semibold text-base leading-tight line-clamp-2 mb-2 transition-colors ${shouldCensor ? 'text-white/10 blur-sm' : 'text-white group-hover:text-cyan-400'}`}
          >
            {game.game?.title || 'Untitled'}
          </h3>

          {!shouldCensor && (
            <div className="flex items-center gap-2">
              {hasPlaytime && (
                <div className="flex items-center gap-1 text-white/40">
                  <Clock className="w-2.5 h-2.5" />
                  <span className="text-[10px]">{formatPlaytime(game.playtime_hours)}</span>
                </div>
              )}
              <div className="flex-1 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${getStatusColor()} transition-all duration-500`}
                  style={{
                    width: game.status === 'unplayed' ? '0%' :
                           game.status === 'playing' ? '50%' :
                           game.status === 'played' ? '75%' :
                           game.status === 'completed' || game.status === 'finished' ? '100%' : '25%'
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Hover action buttons - hidden when adult content is censored */}
        {!shouldCensor && (
          <div className="absolute bottom-8 right-2 flex gap-1.5 z-20 opacity-0 group-hover:opacity-100 transition-all duration-200">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-2 bg-white/10 backdrop-blur-sm rounded-lg text-white/70 hover:text-white border border-white/10 hover:border-white/20 hover:bg-white/20 transition-all"
              title="Edit"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-2 bg-red-500/10 backdrop-blur-sm rounded-lg text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 hover:bg-red-500/20 transition-all"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
