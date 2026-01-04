'use client';

import { useState, useRef } from 'react';
import { Edit3, Trash2, Trophy, EyeOff, Eye, Flame, Clock, Gamepad2, Disc, Target, Zap, UserX, Lock, Ban } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { UserGame } from '@/lib/actions/games';
import { getGameSyncSource } from '@/lib/utils';
import { getDisplayPlatform } from '@/lib/constants/platforms';
import { SteamLogo, PlayStationLogo, XboxLogo, EpicLogo, EALogo, WindowsLogo, NintendoLogo, GOGLogo, BattleNetLogo, UbisoftLogo } from '@/components/icons/PlatformLogos';

interface GameCardProps {
  game: UserGame;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  censorHidden?: boolean;
}

export function GameCard({ game, index, onEdit, onDelete, censorHidden = true }: GameCardProps) {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const [imageError, setImageError] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const isCompleted = game.status === 'completed' || game.status === 'finished';
  const isUnowned = game.ownership_status === 'unowned';
  const isLocked = game.is_locked ?? false;
  const isNotCompatible = game.is_not_compatible ?? false;
  const isAdult = game.tags?.includes('adult') ?? false;
  const shouldCensor = isAdult && censorHidden && !isRevealed;

  // Use my_playtime_hours for previously owned games (matches game detail page)
  const displayPlaytime = game.previously_owned && game.my_playtime_hours !== null
    ? game.my_playtime_hours
    : (game.playtime_hours || 0);
  const hasPlaytime = displayPlaytime > 0;

  // Use my_achievements_earned for previously owned games (matches game detail page)
  const displayAchievementsEarned = game.previously_owned && game.my_achievements_earned !== null
    ? game.my_achievements_earned
    : (game.achievements_earned || 0);
  const displayAchievementsTotal = game.achievements_total || 0;
  const hasAchievements = displayAchievementsTotal > 0;
  const achievementPercent = hasAchievements ? Math.round((displayAchievementsEarned / displayAchievementsTotal) * 100) : 0;
  const completionPercent = game.completion_percentage || 0;

  const handleClick = () => {
    router.push(`/game/${game.id}`);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * 8, y: -x * 8 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const formatPlaytime = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 100) return `${hours.toFixed(1)}h`;
    return `${Math.round(hours)}h`;
  };

  const getStatusConfig = () => {
    switch (game.status) {
      case 'playing': return { color: 'emerald', label: 'PLAYING', glow: 'rgba(16, 185, 129, 0.4)', bg: 'bg-emerald-500', text: 'text-emerald-50' };
      case 'played': return { color: 'violet', label: 'PLAYED', glow: 'rgba(139, 92, 246, 0.4)', bg: 'bg-violet-500', text: 'text-violet-50' };
      case 'completed': return { color: 'cyan', label: 'COMPLETE', glow: 'rgba(34, 211, 238, 0.4)', bg: 'bg-cyan-500', text: 'text-cyan-50' };
      case 'finished': return { color: 'amber', label: '100%', glow: 'rgba(251, 191, 36, 0.4)', bg: 'bg-amber-500', text: 'text-amber-50' };
      case 'on_hold': return { color: 'rose', label: 'ON HOLD', glow: 'rgba(251, 113, 133, 0.3)', bg: 'bg-rose-500', text: 'text-rose-50' };
      case 'dropped': return { color: 'red', label: 'DROPPED', glow: 'rgba(248, 113, 113, 0.3)', bg: 'bg-red-500', text: 'text-red-50' };
      default: return { color: 'gray', label: 'NEW', glow: 'transparent', bg: 'bg-emerald-500', text: 'text-emerald-50' };
    }
  };

  const statusConfig = getStatusConfig();

  const getPlatformIcon = (platform: string) => {
    const lowerPlatform = platform.toLowerCase();
    if (lowerPlatform.includes('steam')) return <SteamLogo className="w-4 h-4 text-white" />;
    if (lowerPlatform.includes('playstation') || lowerPlatform.includes('ps')) return <PlayStationLogo className="w-4 h-4 text-white" />;
    if (lowerPlatform.includes('xbox')) return <XboxLogo className="w-4 h-4 text-white" />;
    if (lowerPlatform.includes('epic')) return <EpicLogo className="w-4 h-4 text-white" />;
    if (lowerPlatform.includes('ea app') || lowerPlatform.includes('origin')) return <EALogo className="w-4 h-4 text-white" />;
    if (lowerPlatform.includes('nintendo') || lowerPlatform.includes('switch') || lowerPlatform.includes('wii')) return <NintendoLogo className="w-4 h-4 text-white" />;
    if (lowerPlatform.includes('gog')) return <GOGLogo className="w-4 h-4 text-white" />;
    if (lowerPlatform.includes('battle.net') || lowerPlatform.includes('blizzard')) return <BattleNetLogo className="w-4 h-4 text-white" />;
    if (lowerPlatform.includes('ubisoft') || lowerPlatform.includes('uplay')) return <UbisoftLogo className="w-4 h-4 text-white" />;
    if (lowerPlatform.includes('pc') || lowerPlatform.includes('windows')) return <WindowsLogo className="w-4 h-4 text-white" />;
    return <Gamepad2 className="w-4 h-4 text-white" />;
  };

  const syncSource = getGameSyncSource(game);

  return (
    <div
      ref={cardRef}
      className="group relative cursor-pointer perspective-1000"
      style={{
        animation: `cardSlideIn 0.5s cubic-bezier(0.23, 1, 0.32, 1) ${index * 0.04}s both`,
      }}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Outer glow effect - persistent rose glow for unowned, status-based for others */}
      <div
        className={`absolute -inset-1 rounded-2xl transition-opacity duration-500 blur-xl ${
          isUnowned
            ? 'opacity-60 group-hover:opacity-80'
            : 'opacity-0 group-hover:opacity-100'
        }`}
        style={{ background: isUnowned ? 'rgba(244, 63, 94, 0.25)' : statusConfig.glow }}
      />

      {/* Unowned border glow ring */}
      {isUnowned && (
        <div
          className="absolute -inset-[2px] rounded-2xl pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.4) 0%, rgba(190, 18, 60, 0.2) 50%, rgba(244, 63, 94, 0.4) 100%)',
            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            maskComposite: 'xor',
            WebkitMaskComposite: 'xor',
            padding: '2px',
          }}
        />
      )}

      {/* Main card with 3D tilt */}
      <div
        className="relative aspect-2/3 rounded-xl overflow-hidden transition-transform duration-200 ease-out"
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Base card background */}
        <div className="absolute inset-0 bg-theme-secondary border border-theme rounded-xl transition-all duration-300 group-hover:border-theme-hover" />

        {/* HUD Corner Brackets - rose for unowned, cyan for owned */}
        <div className="absolute inset-0 pointer-events-none z-30">
          {/* Top-left bracket */}
          <div className="absolute top-2 left-2 w-5 h-5">
            <div className={`absolute top-0 left-0 w-full h-[2px] bg-linear-to-r ${isUnowned ? 'from-rose-500' : 'from-cyan-400'} to-transparent ${isUnowned ? 'opacity-70' : 'opacity-40'} group-hover:opacity-100 transition-all duration-300 ${isUnowned ? 'group-hover:shadow-[0_0_8px_rgba(244,63,94,0.6)]' : 'group-hover:shadow-[0_0_8px_rgba(34,211,238,0.6)]'}`} />
            <div className={`absolute top-0 left-0 h-full w-[2px] bg-linear-to-b ${isUnowned ? 'from-rose-500' : 'from-cyan-400'} to-transparent ${isUnowned ? 'opacity-70' : 'opacity-40'} group-hover:opacity-100 transition-all duration-300 ${isUnowned ? 'group-hover:shadow-[0_0_8px_rgba(244,63,94,0.6)]' : 'group-hover:shadow-[0_0_8px_rgba(34,211,238,0.6)]'}`} />
          </div>
          {/* Top-right bracket */}
          <div className="absolute top-2 right-2 w-5 h-5">
            <div className={`absolute top-0 right-0 w-full h-[2px] bg-linear-to-l ${isUnowned ? 'from-rose-500' : 'from-cyan-400'} to-transparent ${isUnowned ? 'opacity-70' : 'opacity-40'} group-hover:opacity-100 transition-all duration-300`} />
            <div className={`absolute top-0 right-0 h-full w-[2px] bg-linear-to-b ${isUnowned ? 'from-rose-500' : 'from-cyan-400'} to-transparent ${isUnowned ? 'opacity-70' : 'opacity-40'} group-hover:opacity-100 transition-all duration-300`} />
          </div>
          {/* Bottom-left bracket */}
          <div className="absolute bottom-2 left-2 w-5 h-5">
            <div className={`absolute bottom-0 left-0 w-full h-[2px] bg-linear-to-r ${isUnowned ? 'from-rose-500' : 'from-cyan-400'} to-transparent ${isUnowned ? 'opacity-70' : 'opacity-40'} group-hover:opacity-100 transition-all duration-300`} />
            <div className={`absolute bottom-0 left-0 h-full w-[2px] bg-linear-to-t ${isUnowned ? 'from-rose-500' : 'from-cyan-400'} to-transparent ${isUnowned ? 'opacity-70' : 'opacity-40'} group-hover:opacity-100 transition-all duration-300`} />
          </div>
          {/* Bottom-right bracket */}
          <div className="absolute bottom-2 right-2 w-5 h-5">
            <div className={`absolute bottom-0 right-0 w-full h-[2px] bg-linear-to-l ${isUnowned ? 'from-rose-500' : 'from-cyan-400'} to-transparent ${isUnowned ? 'opacity-70' : 'opacity-40'} group-hover:opacity-100 transition-all duration-300`} />
            <div className={`absolute bottom-0 right-0 h-full w-[2px] bg-linear-to-t ${isUnowned ? 'from-rose-500' : 'from-cyan-400'} to-transparent ${isUnowned ? 'opacity-70' : 'opacity-40'} group-hover:opacity-100 transition-all duration-300`} />
          </div>
        </div>

        {/* Cover image with holographic effect */}
        <div className="absolute inset-0 overflow-hidden rounded-xl">
          {game.game?.cover_url && !imageError ? (
            <>
              <img
                src={game.game.cover_url}
                alt={game.game.title || 'Game cover'}
                className={`w-full h-full object-cover transition-all duration-700 ${
                  shouldCensor ? 'blur-2xl scale-125 brightness-[0.15]' : 'group-hover:scale-110'
                }`}
                loading="lazy"
                onError={() => setImageError(true)}
              />
              {/* Holographic shimmer overlay */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none mix-blend-overlay"
                style={{
                  background: 'linear-gradient(135deg, transparent 0%, rgba(34,211,238,0.1) 25%, transparent 50%, rgba(139,92,246,0.1) 75%, transparent 100%)',
                  backgroundSize: '200% 200%',
                  animation: 'shimmer 3s linear infinite',
                }}
              />
            </>
          ) : (
            <div className={`absolute inset-0 flex items-center justify-center ${shouldCensor ? 'blur-xl' : ''}`}>
              <div className="relative">
                <Gamepad2 className="w-16 h-16 text-theme-primary/6" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Target className="w-8 h-8 text-cyan-500/20" />
                </div>
              </div>
            </div>
          )}

          {/* Scan line effect on hover */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none overflow-hidden"
            style={{ mixBlendMode: 'overlay' }}
          >
            <div
              className="absolute w-full h-[2px] bg-linear-to-r from-transparent via-cyan-400/60 to-transparent"
              style={{
                animation: 'scanLine 2s linear infinite',
                boxShadow: '0 0 20px 5px rgba(34,211,238,0.3)',
              }}
            />
          </div>

          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-linear-to-t from-theme-primary via-theme-primary/30 to-transparent" />
          <div className="absolute inset-0 bg-linear-to-br from-cyan-500/3 to-violet-500/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>

        {/* Censorship Overlay */}
        {shouldCensor && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-theme-primary/80 backdrop-blur-md">
            <div className="relative w-14 h-14 mb-4">
              <div className="absolute inset-0 rounded-full border-2 border-theme animate-pulse" />
              <div className="absolute inset-2 rounded-full border border-text-subtle/30 flex items-center justify-center">
                <EyeOff className="w-5 h-5 text-theme-subtle" />
              </div>
            </div>
            <span className="text-[9px] font-bold tracking-[0.25em] text-theme-subtle uppercase mb-4">CLASSIFIED</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsRevealed(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-theme-hover hover:bg-cyan-500/20 border border-theme hover:border-cyan-500/50 rounded-lg text-[10px] font-bold text-theme-muted hover:text-cyan-400 transition-all uppercase tracking-wider"
            >
              <Eye className="w-3.5 h-3.5" />
              Decrypt
            </button>
          </div>
        )}

        {/* Locked Overlay - centered lock icon */}
        {isLocked && !shouldCensor && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-xl scale-150" />
              <div className="relative p-4 bg-black/60 backdrop-blur-sm rounded-full border-2 border-cyan-500/50 shadow-lg shadow-cyan-500/20">
                <Lock className="w-8 h-8 text-cyan-400" />
              </div>
            </div>
          </div>
        )}

        {/* Not Compatible Overlay - centered ban icon */}
        {isNotCompatible && !shouldCensor && !isLocked && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-rose-500/20 blur-xl scale-150" />
              <div className="relative p-4 bg-black/60 backdrop-blur-sm rounded-full border-2 border-rose-500/50 shadow-lg shadow-rose-500/20">
                <Ban className="w-8 h-8 text-rose-400" />
              </div>
            </div>
          </div>
        )}

        {/* NEW badge - top right corner, fades on hover to make room for action buttons */}
        {statusConfig.label === 'NEW' && !shouldCensor && (
          <div className="absolute top-3 right-3 z-30 transition-opacity duration-300 group-hover:opacity-0">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500 rounded-md shadow-lg shadow-emerald-500/30">
              <span className="text-[9px] font-bold text-white uppercase tracking-wider">NEW</span>
            </div>
          </div>
        )}

        {/* Re-hide button */}
        {isAdult && censorHidden && isRevealed && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsRevealed(false);
            }}
            className="absolute top-8 right-3 z-30 p-1.5 rounded-lg bg-theme-primary/80 backdrop-blur-sm border border-theme hover:border-cyan-500/50 transition-all group/hide"
            title="Re-encrypt"
          >
            <EyeOff className="w-3 h-3 text-theme-muted group-hover/hide:text-cyan-400" />
          </button>
        )}

        {/* Top HUD Bar - Platform badge */}
        <div className="absolute top-0 left-0 p-3 z-20">
          <div className="flex items-center gap-1.5">
            {/* Platform badge - HUD style */}
            <div className="relative">
              <div className="flex items-center gap-2 px-2.5 py-1.5 bg-black/70 backdrop-blur-md border border-white/20 rounded-lg shadow-lg">
                {getPlatformIcon(game.platform)}
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                  {getDisplayPlatform(game.platform)}
                </span>
              </div>
              {/* Sync pulse indicator - only show for synced games, not manual */}
              {syncSource && syncSource !== 'manual' && (
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5">
                  <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
                  <div className="absolute inset-0 rounded-full bg-emerald-400 border border-emerald-300" />
                </div>
              )}
            </div>
            {/* Priority indicator */}
            {game.priority === 'high' && (
              <div className="p-1.5 bg-red-500/80 backdrop-blur-sm rounded-lg border border-red-400/30 animate-pulse shadow-lg shadow-red-500/20" title="High Priority">
                <Flame className="w-3.5 h-3.5 text-white" />
              </div>
            )}
          </div>
        </div>

        {/* Bottom Data Panel - Solid dark overlay for universal readability */}
        <div className="absolute bottom-0 left-0 right-0 z-20">
          {/* Gradient fade from image to solid panel */}
          <div className="h-12 bg-gradient-to-t from-black/95 to-transparent" />

          {/* Solid panel with content */}
          <div className="bg-black/95 dark:bg-black/90 px-3 pb-3 -mt-px">
            {/* Title - always white on dark background for maximum readability */}
            <h3 className={`font-bold text-sm leading-tight line-clamp-2 mb-2 transition-all duration-300 ${
              shouldCensor
                ? 'text-white/10 blur-sm'
                : 'text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyan-400 group-hover:to-violet-400'
            }`}>
              {game.game?.title || 'UNTITLED'}
            </h3>

            {!shouldCensor && (
              <>
                {/* Stats Row - Pill badges with solid backgrounds */}
                <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                  {hasPlaytime && (
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-white/15 rounded-full">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      <span className="text-[10px] font-mono font-semibold text-white/90">
                        {formatPlaytime(displayPlaytime)}
                      </span>
                    </div>
                  )}
                  {hasAchievements && (
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-white/15 rounded-full">
                      <Trophy className="w-3 h-3 text-amber-400" />
                      <span className="text-[10px] font-mono font-semibold text-white/90">
                        {displayAchievementsEarned}/{displayAchievementsTotal}
                      </span>
                    </div>
                  )}
                  {completionPercent > 0 && !hasAchievements && (
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-white/15 rounded-full">
                      <Zap className="w-3 h-3 text-violet-400" />
                      <span className="text-[10px] font-mono font-semibold text-white/90">
                        {completionPercent}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Progress bar with status badge */}
                <div className="relative">
                  {/* Status badge - positioned above progress bar */}
                  {statusConfig.label !== 'NEW' && (
                    <div className="absolute -top-5 right-0">
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wider uppercase ${statusConfig.bg} ${statusConfig.text} shadow-sm`}>
                        {statusConfig.label}
                      </span>
                    </div>
                  )}

                  {/* Background track */}
                  <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                    {/* Completion fill */}
                    <div
                      className="h-full rounded-full transition-all duration-700 relative overflow-hidden"
                      style={{
                        width: `${hasAchievements ? achievementPercent : (completionPercent || (game.status === 'completed' ? 100 : game.status === 'playing' ? 50 : 0))}%`,
                        background: `linear-gradient(90deg,
                          ${statusConfig.color === 'emerald' ? '#10b981' :
                            statusConfig.color === 'cyan' ? '#22d3ee' :
                            statusConfig.color === 'violet' ? '#8b5cf6' :
                            statusConfig.color === 'amber' ? '#fbbf24' :
                            statusConfig.color === 'rose' ? '#fb7185' :
                            statusConfig.color === 'red' ? '#f87171' : '#6b7280'},
                          ${statusConfig.color === 'emerald' ? '#34d399' :
                            statusConfig.color === 'cyan' ? '#67e8f9' :
                            statusConfig.color === 'violet' ? '#a78bfa' :
                            statusConfig.color === 'amber' ? '#fcd34d' :
                            statusConfig.color === 'rose' ? '#fda4af' :
                            statusConfig.color === 'red' ? '#fca5a5' : '#9ca3af'})`,
                      }}
                    >
                      {/* Animated shine */}
                      <div
                        className="absolute inset-0 opacity-50"
                        style={{
                          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                          animation: 'progressShine 2s ease-in-out infinite',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Unowned badge - bottom right corner, above the data panel */}
        {isUnowned && !shouldCensor && (
          <div className="absolute bottom-[4.5rem] right-3 z-30">
            <div className="flex items-center gap-1 px-2 py-1 bg-rose-500/20 backdrop-blur-sm rounded-lg border border-rose-500/40" title="Not counted in stats">
              <UserX className="w-3 h-3 text-rose-400" />
              <span className="text-[8px] font-bold text-rose-400 uppercase tracking-wider">Unowned</span>
            </div>
          </div>
        )}

        {/* Physical copy badge - bottom right, above the data panel */}
        {game.is_physical && !shouldCensor && !isUnowned && (
          <div className="absolute bottom-[4.5rem] right-3 z-30">
            <div className="p-1.5 bg-amber-500/20 backdrop-blur-sm rounded-lg border border-amber-500/30" title="Physical Copy">
              <Disc className="w-3.5 h-3.5 text-amber-400" />
            </div>
          </div>
        )}

        {/* Hover action buttons - top right */}
        {!shouldCensor && (
          <div className="absolute top-3 right-3 flex items-center gap-1 z-30 opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-1.5 bg-black/70 backdrop-blur-md rounded-md text-white/70 hover:text-cyan-400 border border-white/10 hover:border-cyan-500/50 transition-all hover:shadow-[0_0_12px_rgba(34,211,238,0.3)]"
              title="Edit"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1.5 bg-black/70 backdrop-blur-md rounded-md text-white/70 hover:text-red-400 border border-white/10 hover:border-red-500/50 transition-all hover:shadow-[0_0_12px_rgba(248,113,113,0.3)]"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Corner accent triangles */}
        <div className="absolute top-0 right-0 w-8 h-8 overflow-hidden pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute -top-4 -right-4 w-8 h-8 bg-linear-to-bl from-cyan-500/30 to-transparent rotate-45" />
        </div>
      </div>

      <style jsx>{`
        @keyframes cardSlideIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes scanLine {
          0% {
            top: -10%;
          }
          100% {
            top: 110%;
          }
        }

        @keyframes shimmer {
          0% {
            background-position: 200% 200%;
          }
          100% {
            background-position: -200% -200%;
          }
        }

        @keyframes progressShine {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>
    </div>
  );
}
