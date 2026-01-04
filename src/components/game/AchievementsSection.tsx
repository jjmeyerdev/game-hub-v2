'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Trophy,
  Loader2,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Medal,
  Crown,
  Diamond,
  Circle,
  Sparkles,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react';
import { SteamAchievementIcon } from './SteamAchievementIcon';
import type { UserGame, UserAchievement } from '@/lib/actions/games';
import type { NormalizedAchievement } from '@/lib/actions/games';
import { updateAchievementOwnership } from '@/lib/actions/games';

type Achievement = NormalizedAchievement & {
  icon_variant?: number;
  storedAchievement?: UserAchievement;
};

interface AchievementsSectionProps {
  game: UserGame;
  achievements: Achievement[];
  achievementsLoading: boolean;
  achievementsPlatform: 'steam' | 'psn' | 'xbox' | 'unknown';
  filter: 'all' | 'unlocked' | 'locked';
  setFilter: (filter: 'all' | 'unlocked' | 'locked') => void;
  showHidden: boolean;
  setShowHidden: (show: boolean) => void;
  onOwnershipChange?: (achievementId: string, unlockedByMe: boolean | null) => void;
}

// Get rarity color and icon
function getRarityConfig(rarity: Achievement['rarity']) {
  switch (rarity) {
    case 'ultra_rare':
      return { color: 'text-amber-300', bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: Diamond, label: 'Ultra Rare', glow: 'shadow-[0_0_15px_rgba(251,191,36,0.3)]' };
    case 'very_rare':
      return { color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/30', icon: Crown, label: 'Very Rare', glow: 'shadow-[0_0_12px_rgba(167,139,250,0.25)]' };
    case 'rare':
      return { color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', icon: Medal, label: 'Rare', glow: '' };
    case 'uncommon':
      return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: Sparkles, label: 'Uncommon', glow: '' };
    default:
      return { color: 'text-theme-muted', bg: 'bg-theme-hover', border: 'border-theme', icon: Circle, label: 'Common', glow: '' };
  }
}

// Get trophy type config for PlayStation
function getTrophyConfig(trophyType: Achievement['trophyType']) {
  switch (trophyType) {
    case 'platinum':
      return { color: 'text-sky-300', bg: 'bg-sky-500/20', border: 'border-sky-400/40', glow: 'shadow-[0_0_20px_rgba(125,211,252,0.4)]' };
    case 'gold':
      return { color: 'text-amber-300', bg: 'bg-amber-500/20', border: 'border-amber-400/40', glow: 'shadow-[0_0_15px_rgba(251,191,36,0.3)]' };
    case 'silver':
      return { color: 'text-slate-300', bg: 'bg-slate-400/20', border: 'border-slate-400/40', glow: '' };
    default:
      return { color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-400/40', glow: '' };
  }
}

export function AchievementsSection({
  game,
  achievements,
  achievementsLoading,
  achievementsPlatform,
  filter,
  setFilter,
  showHidden,
  setShowHidden,
  onOwnershipChange,
}: AchievementsSectionProps) {
  // Determine platform from props or fallback to game.platform
  const isPlayStation = achievementsPlatform === 'psn' ||
    game.platform.toLowerCase().includes('playstation') ||
    game.platform.toLowerCase().startsWith('ps');
  const isXbox = achievementsPlatform === 'xbox' || game.platform.toLowerCase().includes('xbox');
  const termLabel = isPlayStation ? 'TROPHIES' : 'ACHIEVEMENTS';

  // Use real achievements if available, otherwise show counts only
  const hasRealData = achievements.length > 0;
  const hasStoredData = achievements.some(a => a.storedAchievement);

  // Helper to check if achievement is "unlocked by me"
  const isUnlockedByMe = (a: Achievement) => {
    if (!a.storedAchievement) return a.unlocked;
    const unlockedByMe = a.storedAchievement.unlocked_by_me;
    // If explicitly set, use that value; otherwise fall back to unlocked status
    return unlockedByMe !== null && unlockedByMe !== undefined ? unlockedByMe : a.unlocked;
  };

  // Calculate totals from real data when available (more accurate than sync data)
  const totalAchievements = hasRealData ? achievements.length : (game.achievements_total || 0);

  // When we have stored data, use "by me" as the primary count
  const displayEarned = hasStoredData
    ? achievements.filter(isUnlockedByMe).length
    : hasRealData
      ? achievements.filter(a => a.unlocked).length
      : (game.achievements_earned || 0);

  // Filter achievements - use "by me" logic when stored data available
  const filteredAchievements = achievements.filter(a => {
    const unlocked = isUnlockedByMe(a);
    if (filter === 'unlocked') return unlocked;
    if (filter === 'locked') return !unlocked;
    return true;
  });

  const progressPercent = totalAchievements > 0
    ? (displayEarned / totalAchievements) * 100
    : 0;

  // Count by trophy type for PlayStation - use "by me" logic when stored data available
  const trophyCounts = isPlayStation && hasRealData ? {
    platinum: achievements.filter(a => a.trophyType === 'platinum' && isUnlockedByMe(a)).length,
    gold: achievements.filter(a => a.trophyType === 'gold' && isUnlockedByMe(a)).length,
    silver: achievements.filter(a => a.trophyType === 'silver' && isUnlockedByMe(a)).length,
    bronze: achievements.filter(a => a.trophyType === 'bronze' && isUnlockedByMe(a)).length,
  } : null;

  // Total gamerscore for Xbox - use "by me" logic when stored data available
  const totalGamerscore = isXbox && hasRealData ? achievements.filter(isUnlockedByMe).reduce((sum, a) => sum + (a.gamerscore || 0), 0) : null;
  const maxGamerscore = isXbox && hasRealData ? achievements.reduce((sum, a) => sum + (a.gamerscore || 0), 0) : null;

  return (
    <div className="relative mt-8 p-6 bg-theme-secondary border border-amber-500/20 rounded-2xl overflow-hidden">
      {/* HUD corners */}
      <div className="absolute top-0 left-0 w-5 h-5 border-l-2 border-t-2 border-amber-400/40" />
      <div className="absolute top-0 right-0 w-5 h-5 border-r-2 border-t-2 border-amber-400/40" />
      <div className="absolute bottom-0 left-0 w-5 h-5 border-l-2 border-b-2 border-amber-400/40" />
      <div className="absolute bottom-0 right-0 w-5 h-5 border-r-2 border-b-2 border-amber-400/40" />

      {/* Decorative scan line */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-full h-px bg-linear-to-r from-transparent via-amber-400/20 to-transparent animate-scan-line" />
      </div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="relative p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            <Trophy className="w-5 h-5 text-amber-400" />
            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-1.5 h-1.5 border-l border-t border-amber-400/50" />
            <div className="absolute top-0 right-0 w-1.5 h-1.5 border-r border-t border-amber-400/50" />
            <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-l border-b border-amber-400/50" />
            <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-r border-b border-amber-400/50" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-theme-primary uppercase tracking-wide font-family-display flex items-center gap-2">
              {termLabel}
              <span className="text-[10px] font-mono text-theme-subtle font-normal">// {isPlayStation ? 'PSN_TROPHIES' : isXbox ? 'XBOX_ACHIEVEMENTS' : 'PROGRESS_TRACKING'}</span>
            </h3>
            <p className="text-[11px] font-mono text-theme-muted">
              {displayEarned} of {totalAchievements} unlocked
            </p>
          </div>
        </div>

        {/* Platform-specific summary */}
        <div className="flex items-center gap-3">
          {isPlayStation && trophyCounts && (
            <div className="flex items-center gap-2 px-4 py-2 bg-theme-hover border border-theme rounded-xl">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-linear-to-br from-sky-300 to-sky-500 flex items-center justify-center shadow-[0_0_10px_rgba(125,211,252,0.5)]">
                  <span className="text-[8px] font-bold text-white">P</span>
                </div>
                <span className="text-xs font-mono text-sky-300">{trophyCounts.platinum}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-linear-to-br from-amber-300 to-amber-500 flex items-center justify-center shadow-[0_0_8px_rgba(251,191,36,0.4)]">
                  <span className="text-[8px] font-bold text-white">G</span>
                </div>
                <span className="text-xs font-mono text-amber-300">{trophyCounts.gold}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-linear-to-br from-slate-300 to-slate-400 flex items-center justify-center">
                  <span className="text-[8px] font-bold text-white">S</span>
                </div>
                <span className="text-xs font-mono text-slate-300">{trophyCounts.silver}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-linear-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                  <span className="text-[8px] font-bold text-white">B</span>
                </div>
                <span className="text-xs font-mono text-orange-400">{trophyCounts.bronze}</span>
              </div>
            </div>
          )}

          {isXbox && totalGamerscore !== null && maxGamerscore !== null && (
            <div className="flex items-center gap-3 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
              <div className="w-6 h-6 rounded-full bg-linear-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-[0_0_12px_rgba(52,211,153,0.4)]">
                <span className="text-[9px] font-bold text-white">G</span>
              </div>
              <div>
                <span className="text-lg font-bold text-emerald-400 font-family-display">{totalGamerscore}</span>
                <span className="text-xs font-mono text-theme-subtle ml-1">/ {maxGamerscore}</span>
              </div>
            </div>
          )}

          {/* Toggle hidden achievements */}
          <button
            onClick={() => setShowHidden(!showHidden)}
            className={`p-2.5 rounded-xl border transition-all ${
              showHidden
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-theme-hover border-theme text-theme-muted hover:text-theme-muted hover:border-white/15'
            }`}
            title={showHidden ? 'Hide locked descriptions' : 'Show locked descriptions'}
          >
            {showHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-mono text-theme-muted uppercase tracking-wider">Overall Progress</span>
          <span className="text-sm font-mono font-bold text-amber-400">{progressPercent.toFixed(1)}%</span>
        </div>
        <div className="relative h-3 bg-theme-hover rounded-full overflow-hidden">
          {/* Striped background pattern */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(255,255,255,0.03) 8px, rgba(255,255,255,0.03) 16px)'
            }}
          />
          <div
            className="absolute inset-y-0 left-0 bg-linear-to-r from-amber-500 via-amber-400 to-yellow-400 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progressPercent}%` }}
          >
            {/* Animated shine effect */}
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </div>
          {/* Segment markers */}
          {[25, 50, 75].map(percent => (
            <div
              key={percent}
              className="absolute top-0 bottom-0 w-px bg-white/10"
              style={{ left: `${percent}%` }}
            />
          ))}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-6 p-1 bg-theme-hover border border-theme rounded-xl w-fit">
        {(['all', 'unlocked', 'locked'] as const).map(f => {
          const count = f === 'all'
            ? achievements.length
            : f === 'unlocked'
              ? achievements.filter(isUnlockedByMe).length
              : achievements.filter(a => !isUnlockedByMe(a)).length;

          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`relative px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition-all overflow-hidden ${
                filter === f
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'text-theme-muted hover:text-theme-muted border border-transparent hover:bg-theme-hover'
              }`}
            >
              {filter === f && (
                <>
                  <div className="absolute top-0 left-0 w-1 h-1 border-l border-t border-amber-400/60" />
                  <div className="absolute top-0 right-0 w-1 h-1 border-r border-t border-amber-400/60" />
                  <div className="absolute bottom-0 left-0 w-1 h-1 border-l border-b border-amber-400/60" />
                  <div className="absolute bottom-0 right-0 w-1 h-1 border-r border-b border-amber-400/60" />
                </>
              )}
              {f === 'all' ? 'All' : f === 'unlocked' ? 'Unlocked' : 'Locked'}
              <span className="ml-1.5 text-[10px] opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Loading state */}
      {achievementsLoading && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="relative mb-4">
            <Loader2 className="w-8 h-8 text-amber-400/60 animate-spin" />
            <div className="absolute inset-0 w-8 h-8 border-2 border-amber-400/20 rounded-full" />
          </div>
          <p className="text-[11px] font-mono text-theme-subtle uppercase tracking-wider">// Fetching {termLabel.toLowerCase()}...</p>
        </div>
      )}

      {/* No real data - show counts only view */}
      {!achievementsLoading && !hasRealData && (
        <div className="text-center py-12 border border-theme rounded-xl bg-theme-hover">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Trophy className="w-10 h-10 text-amber-400/60" />
          </div>
          <p className="text-sm font-mono text-theme-muted mb-2">
            {displayEarned} of {totalAchievements} {termLabel.toLowerCase()} unlocked
          </p>
          <p className="text-[11px] font-mono text-theme-subtle">
            {isXbox
              ? '// Xbox 360 games only provide summary counts via API'
              : `// Individual ${termLabel.toLowerCase()} data not available`
            }
          </p>
        </div>
      )}

      {/* Achievements grid */}
      {!achievementsLoading && hasRealData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredAchievements.map((achievement, index) => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              index={index}
              isPlayStation={isPlayStation}
              isXbox={isXbox}
              showHidden={showHidden}
              onOwnershipChange={onOwnershipChange}
            />
          ))}

          {/* Empty state for filtered results */}
          {filteredAchievements.length === 0 && (
            <div className="col-span-full text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-theme-hover border border-theme flex items-center justify-center">
                {filter === 'unlocked' ? (
                  <Lock className="w-8 h-8 text-theme-subtle" />
                ) : (
                  <Unlock className="w-8 h-8 text-theme-subtle" />
                )}
              </div>
              <p className="text-sm font-mono text-theme-subtle">
                // No {filter === 'unlocked' ? 'unlocked' : 'locked'} {termLabel.toLowerCase()} found
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Individual achievement card component
function AchievementCard({
  achievement,
  index,
  isPlayStation,
  isXbox,
  showHidden,
  onOwnershipChange,
}: {
  achievement: Achievement;
  index: number;
  isPlayStation: boolean;
  isXbox: boolean;
  showHidden: boolean;
  onOwnershipChange?: (achievementId: string, unlockedByMe: boolean | null) => void;
}) {
  const [isUpdating, setIsUpdating] = useState(false);
  const rarityConfig = getRarityConfig(achievement.rarity);
  const trophyConfig = isPlayStation && achievement.trophyType ? getTrophyConfig(achievement.trophyType) : null;
  const RarityIcon = rarityConfig.icon;

  // Determine current ownership state
  const storedAchievement = achievement.storedAchievement;
  const unlockedByMe = storedAchievement?.unlocked_by_me;
  const hasOwnershipOverride = unlockedByMe !== null && unlockedByMe !== undefined;

  // Determine if achievement should display as unlocked
  // If marked as "not mine", show as locked even if platform says unlocked
  const displayAsUnlocked = hasOwnershipOverride
    ? unlockedByMe === true
    : achievement.unlocked;

  // Handle ownership toggle
  const handleOwnershipToggle = async () => {
    if (!storedAchievement || isUpdating) return;

    setIsUpdating(true);
    try {
      // Cycle through: null (use sync) -> true (by me) -> false (not by me) -> null
      let newValue: boolean | null;
      if (unlockedByMe === null || unlockedByMe === undefined) {
        newValue = true; // Mark as "by me"
      } else if (unlockedByMe === true) {
        newValue = false; // Mark as "not by me"
      } else {
        newValue = null; // Reset to sync status
      }

      const result = await updateAchievementOwnership(storedAchievement.id, newValue);
      if (result.success && onOwnershipChange) {
        onOwnershipChange(storedAchievement.id, newValue);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div
      className={`group relative p-4 rounded-xl border transition-all duration-300 overflow-hidden ${
        displayAsUnlocked
          ? `${trophyConfig?.bg || rarityConfig.bg} ${trophyConfig?.border || rarityConfig.border} ${trophyConfig?.glow || rarityConfig.glow} hover:scale-[1.01]`
          : 'bg-theme-hover border-theme hover:border-white/12'
      }`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* HUD corners on hover */}
      <div className={`absolute top-0 left-0 w-2 h-2 border-l border-t ${displayAsUnlocked ? (trophyConfig?.border || rarityConfig.border).replace('border-', 'border-').replace('/30', '/60').replace('/40', '/70') : 'border-white/20'} opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className={`absolute top-0 right-0 w-2 h-2 border-r border-t ${displayAsUnlocked ? (trophyConfig?.border || rarityConfig.border).replace('border-', 'border-').replace('/30', '/60').replace('/40', '/70') : 'border-white/20'} opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className={`absolute bottom-0 left-0 w-2 h-2 border-l border-b ${displayAsUnlocked ? (trophyConfig?.border || rarityConfig.border).replace('border-', 'border-').replace('/30', '/60').replace('/40', '/70') : 'border-white/20'} opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className={`absolute bottom-0 right-0 w-2 h-2 border-r border-b ${displayAsUnlocked ? (trophyConfig?.border || rarityConfig.border).replace('border-', 'border-').replace('/30', '/60').replace('/40', '/70') : 'border-white/20'} opacity-0 group-hover:opacity-100 transition-opacity`} />

      <div className="flex items-start gap-4">
        {/* Achievement icon */}
        {isPlayStation && achievement.trophyType ? (
          // PlayStation Trophy Icon
          <PlayStationTrophyIcon achievement={achievement} trophyConfig={trophyConfig} displayAsUnlocked={displayAsUnlocked} />
        ) : isXbox ? (
          // Xbox Achievement Icon
          <XboxAchievementIcon achievement={achievement} rarityConfig={rarityConfig} RarityIcon={RarityIcon} displayAsUnlocked={displayAsUnlocked} />
        ) : (
          // Steam/PC Style Achievement Icon
          <SteamPCAchievementIcon achievement={achievement} rarityConfig={rarityConfig} displayAsUnlocked={displayAsUnlocked} />
        )}

        {/* Achievement details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className={`font-semibold text-sm uppercase tracking-wide font-family-display ${
              displayAsUnlocked ? 'text-white' : 'text-theme-muted'
            }`}>
              {displayAsUnlocked || showHidden ? achievement.name : '// CLASSIFIED'}
            </h4>

            {/* Rarity badge */}
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider ${
              displayAsUnlocked ? `${rarityConfig.bg} ${rarityConfig.color}` : 'bg-theme-hover text-theme-subtle'
            }`}>
              {achievement.rarityPercentage?.toFixed(1)}%
            </div>
          </div>

          <p className={`text-xs leading-relaxed mb-2 ${
            displayAsUnlocked ? 'text-theme-muted' : 'text-theme-subtle'
          }`}>
            {displayAsUnlocked || showHidden
              ? achievement.description
              : '████████ ███████ ██████████ ████'
            }
          </p>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Unlock status */}
            {displayAsUnlocked ? (
              <div className="flex items-center gap-1.5 text-emerald-400">
                <Unlock className="w-3 h-3" />
                <span className="text-[10px] font-mono">
                  {achievement.unlockDate
                    ? new Date(achievement.unlockDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : 'Unlocked'
                  }
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-theme-subtle">
                <Lock className="w-3 h-3" />
                <span className="text-[10px] font-mono uppercase">Locked</span>
              </div>
            )}

            {/* Rarity label */}
            <div className={`text-[10px] font-mono uppercase tracking-wider ${
              displayAsUnlocked ? rarityConfig.color : 'text-theme-subtle'
            }`}>
              {rarityConfig.label}
            </div>

            {/* Xbox gamerscore */}
            {isXbox && achievement.gamerscore && (
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded ${
                displayAsUnlocked
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-theme-hover text-theme-subtle'
              }`}>
                <span className="text-[10px] font-mono font-bold">{achievement.gamerscore}G</span>
              </div>
            )}

            {/* Ownership toggle button - only show for achievements that were unlocked on platform */}
            {achievement.unlocked && storedAchievement && (
              <button
                onClick={handleOwnershipToggle}
                disabled={isUpdating}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider transition-all ${
                  isUpdating ? 'opacity-50 cursor-wait' :
                  unlockedByMe === true ? 'bg-violet-500/20 border border-violet-500/30 text-violet-400 hover:bg-violet-500/30' :
                  unlockedByMe === false ? 'bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:bg-rose-500/30' :
                  'bg-theme-hover border border-theme text-theme-muted hover:border-white/20 hover:text-white'
                }`}
                title={
                  unlockedByMe === true ? 'Marked as unlocked by me - click to mark as not mine' :
                  unlockedByMe === false ? 'Marked as not mine - click to reset' :
                  'Click to mark as unlocked by me'
                }
              >
                {isUpdating ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : unlockedByMe === true ? (
                  <UserCheck className="w-3 h-3" />
                ) : unlockedByMe === false ? (
                  <UserX className="w-3 h-3" />
                ) : (
                  <Users className="w-3 h-3" />
                )}
                <span>
                  {unlockedByMe === true ? 'Mine' :
                   unlockedByMe === false ? 'Not mine' :
                   'Ownership'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// PlayStation Trophy Icon component
function PlayStationTrophyIcon({
  achievement,
  trophyConfig,
  displayAsUnlocked,
}: {
  achievement: Achievement;
  trophyConfig: ReturnType<typeof getTrophyConfig> | null;
  displayAsUnlocked: boolean;
}) {
  return (
    <div className={`relative shrink-0 w-14 h-14 rounded-xl overflow-hidden ${
      displayAsUnlocked
        ? `${trophyConfig?.glow} ring-1 ${trophyConfig?.border}`
        : 'ring-1 ring-white/10 grayscale opacity-60'
    }`}>
      {achievement.iconUrl ? (
        <Image
          src={achievement.iconUrl}
          alt={achievement.name}
          fill
          className="object-cover"
          sizes="56px"
        />
      ) : displayAsUnlocked ? (
        <div className={`w-full h-full flex items-center justify-center ${
          achievement.trophyType === 'platinum' ? 'bg-linear-to-br from-sky-200 via-sky-400 to-sky-600' :
          achievement.trophyType === 'gold' ? 'bg-linear-to-br from-amber-200 via-amber-400 to-amber-600' :
          achievement.trophyType === 'silver' ? 'bg-linear-to-br from-slate-200 via-slate-300 to-slate-500' :
          'bg-linear-to-br from-orange-300 via-orange-500 to-orange-700'
        }`}>
          <Trophy className="w-6 h-6 text-white" />
        </div>
      ) : (
        <div className="w-full h-full bg-white/5 flex items-center justify-center">
          <Lock className="w-5 h-5 text-theme-subtle" />
        </div>
      )}
      {!displayAsUnlocked && achievement.iconUrl && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <Lock className="w-4 h-4 text-theme-muted" />
        </div>
      )}
    </div>
  );
}

// Xbox Achievement Icon component
function XboxAchievementIcon({
  achievement,
  rarityConfig,
  RarityIcon,
  displayAsUnlocked,
}: {
  achievement: Achievement;
  rarityConfig: ReturnType<typeof getRarityConfig>;
  RarityIcon: React.ComponentType<{ className?: string }>;
  displayAsUnlocked: boolean;
}) {
  return (
    <div className={`relative shrink-0 w-14 h-14 rounded-xl overflow-hidden ${
      displayAsUnlocked
        ? `${rarityConfig.glow} ring-1 ${rarityConfig.border}`
        : 'ring-1 ring-white/10 grayscale opacity-60'
    }`}>
      {achievement.iconUrl ? (
        <Image
          src={achievement.iconUrl}
          alt={achievement.name}
          fill
          className="object-cover"
          sizes="56px"
        />
      ) : displayAsUnlocked ? (
        <div className="w-full h-full bg-linear-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
          <RarityIcon className="w-6 h-6 text-white" />
        </div>
      ) : (
        <div className="w-full h-full bg-white/5 flex items-center justify-center">
          <Lock className="w-5 h-5 text-theme-subtle" />
        </div>
      )}
      {!displayAsUnlocked && achievement.iconUrl && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <Lock className="w-4 h-4 text-theme-muted" />
        </div>
      )}
    </div>
  );
}

// Steam/PC Achievement Icon component
function SteamPCAchievementIcon({
  achievement,
  rarityConfig,
  displayAsUnlocked,
}: {
  achievement: Achievement;
  rarityConfig: ReturnType<typeof getRarityConfig>;
  displayAsUnlocked: boolean;
}) {
  const iconSrc = displayAsUnlocked
    ? achievement.iconUrl
    : (achievement.iconGrayUrl || achievement.iconUrl);

  return (
    <div className={`relative shrink-0 w-14 h-14 rounded-lg overflow-hidden ${
      displayAsUnlocked
        ? `${rarityConfig.glow} ring-1 ${rarityConfig.border}`
        : 'ring-1 ring-white/10 grayscale opacity-60'
    }`}>
      {iconSrc ? (
        <Image
          src={iconSrc}
          alt={achievement.name}
          fill
          className="object-cover"
          sizes="56px"
        />
      ) : (
        <SteamAchievementIcon
          variant={achievement.icon_variant || 0}
          unlocked={displayAsUnlocked}
          rarity={achievement.rarity}
        />
      )}
      {!displayAsUnlocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <Lock className="w-4 h-4 text-theme-muted" />
        </div>
      )}
    </div>
  );
}
