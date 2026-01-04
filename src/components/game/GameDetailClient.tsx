'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Clock,
  Trophy,
  Star,
  Calendar,
  Gamepad2,
  TrendingUp,
  Zap,
  PlayCircle,
  CheckCircle2,
  Tag,
  Activity,
  BarChart3,
  Building2,
  Terminal,
} from 'lucide-react';
import { GameFormModal, DeleteConfirmModal } from '@/components/modals';
import { isPcPlatform, getPlatformBrandStyle, getDisplayPlatform } from '@/lib/constants/platforms';
import { getPlatformLogo, StatCard, InfoRow, AchievementsSection } from '@/components/game';
import type { UserGame, UserAchievement } from '@/lib/actions/games';
import { getGameAchievements, getStoredAchievements, type NormalizedAchievement } from '@/lib/actions/games';

type Achievement = NormalizedAchievement & {
  icon_variant?: number;
  storedAchievement?: UserAchievement; // Linked database record for ownership toggle
};

interface GameDetailClientProps {
  game: UserGame;
}

export function GameDetailClient({ game: initialGame }: GameDetailClientProps) {
  const router = useRouter();
  const [game, setGame] = useState<UserGame>(initialGame);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [achievementFilter, setAchievementFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [showHiddenAchievements, setShowHiddenAchievements] = useState(false);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [achievementsLoading, setAchievementsLoading] = useState(false);
  const [achievementsPlatform, setAchievementsPlatform] = useState<'steam' | 'psn' | 'xbox' | 'unknown'>('unknown');

  // Fetch achievements when component mounts
  useEffect(() => {
    async function loadAchievements() {
      // Load if either total or earned > 0 (some APIs don't return total)
      if ((game.achievements_total || 0) === 0 && (game.achievements_earned || 0) === 0) return;

      setAchievementsLoading(true);
      try {
        // Fetch both API achievements and stored achievements in parallel
        const [apiResult, storedResult] = await Promise.all([
          getGameAchievements(game.id),
          getStoredAchievements(game.id),
        ]);

        if (apiResult.success && apiResult.achievements.length > 0) {
          // Create a map of stored achievements by platform_achievement_id
          const storedMap = new Map(
            (storedResult.achievements || []).map(sa => [sa.platform_achievement_id, sa])
          );

          // Merge API achievements with stored data
          const achievementsWithData = apiResult.achievements.map((a, i) => ({
            ...a,
            icon_variant: i % 8,
            storedAchievement: storedMap.get(a.id),
          }));
          setAchievements(achievementsWithData);
          setAchievementsPlatform(apiResult.platform);
        } else if (storedResult.achievements && storedResult.achievements.length > 0) {
          // Fallback to stored achievements if API fails (for offline viewing)
          const achievementsFromStored = storedResult.achievements.map((sa, i) => ({
            id: sa.platform_achievement_id,
            name: sa.name,
            description: sa.description || '',
            iconUrl: sa.icon_url || undefined,
            unlocked: sa.unlocked,
            unlockDate: sa.unlocked_at || undefined,
            rarity: (sa.rarity && sa.rarity <= 5 ? 'ultra_rare' :
                    sa.rarity && sa.rarity <= 15 ? 'very_rare' :
                    sa.rarity && sa.rarity <= 30 ? 'rare' :
                    sa.rarity && sa.rarity <= 50 ? 'uncommon' : 'common') as Achievement['rarity'],
            rarityPercentage: sa.rarity || undefined,
            trophyType: sa.achievement_type as Achievement['trophyType'],
            gamerscore: sa.points || undefined,
            icon_variant: i % 8,
            storedAchievement: sa,
          }));
          setAchievements(achievementsFromStored);
          const storedPlatform = storedResult.achievements[0]?.platform;
          if (storedPlatform === 'psn' || storedPlatform === 'xbox' || storedPlatform === 'steam') {
            setAchievementsPlatform(storedPlatform);
          }
        }
      } catch {
        // Achievement fetching failed, UI will show counts-only view
      } finally {
        setAchievementsLoading(false);
      }
    }

    loadAchievements();
  }, [game.id, game.achievements_total, game.achievements_earned]);

  const handleSuccess = () => {
    window.location.reload();
  };

  const handleDelete = () => {
    router.push('/dashboard');
  };

  // Handle achievement ownership toggle
  const handleAchievementOwnershipChange = (achievementId: string, unlockedByMe: boolean | null) => {
    setAchievements(prev =>
      prev.map(a => {
        if (a.storedAchievement?.id === achievementId) {
          return {
            ...a,
            storedAchievement: {
              ...a.storedAchievement,
              unlocked_by_me: unlockedByMe,
            },
          };
        }
        return a;
      })
    );
  };

  // Calculate achievement counts - use "by me" when stored data available
  const displayAchievementsTotal = achievements.length > 0
    ? achievements.length
    : (game.achievements_total || 0);

  // Helper to check if achievement is "unlocked by me"
  const isUnlockedByMe = (a: Achievement) => {
    if (!a.storedAchievement) return a.unlocked;
    const unlockedByMe = a.storedAchievement.unlocked_by_me;
    return unlockedByMe !== null && unlockedByMe !== undefined ? unlockedByMe : a.unlocked;
  };

  const hasStoredData = achievements.some(a => a.storedAchievement);
  const displayAchievementsEarned = achievements.length > 0
    ? hasStoredData
      ? achievements.filter(isUnlockedByMe).length
      : achievements.filter(a => a.unlocked).length
    : (game.achievements_earned || 0);

  const canHaveActiveSession = isPcPlatform(game.platform);

  const statusConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
    playing: {
      label: canHaveActiveSession ? 'Active Session' : 'Playing',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
    },
    played: { label: 'Played', color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
    completed: { label: 'Completed', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
    finished: { label: 'Finished', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    on_hold: { label: 'On Hold', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
    paused: { label: 'Paused', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
    dropped: { label: 'Dropped', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    unplayed: { label: 'Unplayed', color: 'text-theme-muted', bg: 'bg-theme-hover', border: 'border-theme' },
  };

  const status = statusConfig[game.status] || statusConfig.unplayed;
  const brandStyle = getPlatformBrandStyle(game.platform);

  return (
    <div className="relative min-h-screen bg-theme-primary">
      {/* Ambient glow blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] bg-cyan-500/3 rounded-full blur-[120px] animate-breathe" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-violet-500/3 rounded-full blur-[120px] animate-breathe" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-theme-primary/80 border-b border-theme">
        {/* Top accent line */}
        <div className="absolute top-0 left-8 right-8 h-px bg-linear-to-r from-transparent via-cyan-500/30 to-transparent" />

        <div className="px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <button
              onClick={() => router.back()}
              className="group flex items-center gap-2 px-4 py-2 bg-theme-hover hover:bg-cyan-500/10 border border-theme hover:border-cyan-500/30 rounded-xl text-sm text-theme-muted hover:text-cyan-400 transition-all"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span className="font-mono text-xs uppercase tracking-wider">Back</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowEditModal(true)}
                className="group p-2.5 bg-theme-hover hover:bg-cyan-500/10 border border-theme hover:border-cyan-500/30 rounded-xl transition-all"
                title="Edit"
              >
                <Edit className="w-4 h-4 text-theme-muted group-hover:text-cyan-400" />
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="group p-2.5 bg-theme-hover hover:bg-red-500/10 border border-theme hover:border-red-500/30 rounded-xl transition-all"
                title="Delete"
              >
                <Trash2 className="w-4 h-4 text-theme-muted group-hover:text-red-400" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative">
        {/* Blurred Background */}
        {game.game?.cover_url && (
          <div
            className="absolute inset-0 opacity-5 blur-[80px] scale-110"
            style={{
              backgroundImage: `url(${game.game.cover_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        )}

        <div className="relative px-6 lg:px-8 py-10">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-10">
              {/* Cover Art */}
              <div className="relative">
                <div className="relative w-full aspect-3/4 rounded-2xl overflow-hidden bg-theme-secondary border border-theme">
                  {/* HUD corners */}
                  <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-cyan-400/40 z-10" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-cyan-400/40 z-10" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-cyan-400/40 z-10" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-cyan-400/40 z-10" />

                  {game.game?.cover_url ? (
                    <Image
                      src={game.game.cover_url}
                      alt={game.game.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 320px"
                      priority
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Gamepad2 className="w-20 h-20 text-theme-subtle" />
                    </div>
                  )}
                </div>

                {/* Status Badge */}
                <div className="absolute -bottom-4 left-4 right-4">
                  <div className={`relative px-4 py-2.5 ${status.bg} ${status.border} border backdrop-blur-xl rounded-xl flex items-center justify-center overflow-hidden`}>
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${status.color.replace('text-', 'bg-')}`} />
                    <span className={`text-sm font-semibold uppercase tracking-wide font-family-display ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Game Info */}
              <div className="space-y-6 pt-2">
                {/* Platform Badge */}
                <div className={`inline-flex items-center gap-2.5 px-4 py-2 ${brandStyle.bg} ${brandStyle.border} border rounded-xl ${brandStyle.glow || ''}`}>
                  <span className={brandStyle.text}>
                    {getPlatformLogo(game.platform, 'w-4 h-4')}
                  </span>
                  <span className={`text-[11px] font-mono font-semibold uppercase tracking-wider ${brandStyle.text}`}>
                    {getDisplayPlatform(game.platform)}
                  </span>
                </div>

                {/* Title */}
                <div>
                  <span className="text-[10px] font-mono text-theme-subtle uppercase tracking-wider mb-2 block">// GAME_DATA</span>
                  <h1 className="text-4xl lg:text-5xl font-bold text-theme-primary leading-tight uppercase tracking-wide font-family-display">
                    {game.game?.title}
                  </h1>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
                  <StatCard
                    icon={<Clock className="w-4 h-4" />}
                    label="Playtime"
                    value={`${game.previously_owned && game.my_playtime_hours !== null ? game.my_playtime_hours : (game.playtime_hours || 0)}h`}
                    color="cyan"
                  />
                  <StatCard
                    icon={<TrendingUp className="w-4 h-4" />}
                    label="Progress"
                    value={`${game.previously_owned ? 0 : (game.completion_percentage || 0)}%`}
                    color="violet"
                  />
                  <StatCard
                    icon={<Trophy className="w-4 h-4" />}
                    label={game.platform.includes('PlayStation') || game.platform.startsWith('PS') ? 'Trophies' : 'Achievements'}
                    value={`${displayAchievementsEarned}/${displayAchievementsTotal}`}
                    color="amber"
                  />
                  <StatCard
                    icon={<Star className="w-4 h-4" />}
                    label="Rating"
                    value={game.personal_rating ? `${game.personal_rating}/10` : '—'}
                    color="emerald"
                  />
                </div>

                {/* Progress Bars */}
                {((!game.previously_owned && game.completion_percentage > 0) || displayAchievementsTotal > 0) && (
                  <ProgressSection
                    game={game}
                    displayAchievementsTotal={displayAchievementsTotal}
                    displayAchievementsEarned={displayAchievementsEarned}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div className="px-6 lg:px-8 py-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Game Information */}
            <GameInfoCard game={game} />

            {/* Activity & Tags */}
            <div className="space-y-6">
              {/* Activity */}
              <ActivityCard game={game} />

              {/* Tags */}
              {game.tags && game.tags.length > 0 && (
                <TagsCard tags={game.tags} />
              )}
            </div>
          </div>

          {/* Personal Notes */}
          {game.notes && (
            <NotesCard notes={game.notes} />
          )}

          {/* Achievements/Trophies Section - Hide for Xbox 360 (no detailed API) */}
          {(game.achievements_total > 0 || game.achievements_earned > 0) &&
           !game.platform.toLowerCase().includes('360') && (
            <AchievementsSection
              game={game}
              achievements={achievements}
              achievementsLoading={achievementsLoading}
              achievementsPlatform={achievementsPlatform}
              filter={achievementFilter}
              setFilter={setAchievementFilter}
              showHidden={showHiddenAchievements}
              setShowHidden={setShowHiddenAchievements}
              onOwnershipChange={handleAchievementOwnershipChange}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <GameFormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleSuccess}
        mode="edit"
        userGame={game}
      />

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onSuccess={handleDelete}
        userGame={game}
      />
    </div>
  );
}

// Progress Section Component
function ProgressSection({
  game,
  displayAchievementsTotal,
  displayAchievementsEarned,
}: {
  game: UserGame;
  displayAchievementsTotal: number;
  displayAchievementsEarned: number;
}) {
  const achievementPercent = displayAchievementsTotal > 0
    ? (displayAchievementsEarned / displayAchievementsTotal) * 100
    : 0;

  return (
    <div className="relative p-5 bg-theme-secondary border border-theme rounded-xl space-y-4 overflow-hidden">
      {/* HUD corners */}
      <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-white/12" />
      <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-white/12" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-white/12" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-white/12" />

      <div className="flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-cyan-400" />
        <span className="text-sm font-semibold text-theme-muted uppercase tracking-wide font-family-display">Progress</span>
        <span className="text-[10px] font-mono text-theme-subtle">// STATS</span>
      </div>

      {game.completion_percentage > 0 && !game.previously_owned && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-mono text-theme-muted uppercase tracking-wider">Completion</span>
            <span className="text-xs font-mono font-medium text-violet-400">{game.completion_percentage}%</span>
          </div>
          <div className="h-2 bg-theme-hover rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-violet-500 to-violet-400 rounded-full transition-all duration-500"
              style={{ width: `${game.completion_percentage}%` }}
            />
          </div>
        </div>
      )}

      {displayAchievementsTotal > 0 && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-mono text-theme-muted uppercase tracking-wider">
              {game.platform.includes('PlayStation') || game.platform.startsWith('PS') ? 'Trophies' : 'Achievements'}
            </span>
            <span className="text-xs font-mono font-medium text-amber-400">
              {displayAchievementsEarned} / {displayAchievementsTotal}
            </span>
          </div>
          <div className="h-2 bg-theme-hover rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${achievementPercent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Game Info Card Component
function GameInfoCard({ game }: { game: UserGame }) {
  return (
    <div className="relative p-6 bg-theme-secondary border border-cyan-500/20 rounded-xl space-y-5 overflow-hidden">
      {/* HUD corners */}
      <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-cyan-400/30" />
      <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-cyan-400/30" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-cyan-400/30" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-cyan-400/30" />

      <h3 className="text-sm font-semibold text-theme-muted flex items-center gap-2 uppercase tracking-wide font-family-display">
        <Zap className="w-4 h-4 text-cyan-400" />
        Game Details
        <span className="text-[10px] font-mono text-theme-subtle font-normal">// METADATA</span>
      </h3>

      {game.game?.description ? (
        <p className="text-sm text-theme-muted leading-relaxed">
          {game.game.description}
        </p>
      ) : (
        <p className="text-sm text-theme-subtle italic font-mono">
          // No description available
        </p>
      )}

      <div className="space-y-3 pt-2">
        {game.game?.developer && (
          <InfoRow icon={<Building2 className="w-4 h-4" />} label="Developer" value={game.game.developer} color="cyan" />
        )}
        {game.game?.publisher && (
          <InfoRow icon={<Building2 className="w-4 h-4" />} label="Publisher" value={game.game.publisher} color="violet" />
        )}
        {(game.release_date || game.game?.release_date) && (
          <InfoRow
            icon={<Calendar className="w-4 h-4" />}
            label="Release Date"
            value={(() => {
              const dateStr = game.release_date || game.game?.release_date || '';
              // Parse as UTC to avoid timezone shifts (YYYY-MM-DD format)
              const [year, month, day] = dateStr.split('-').map(Number);
              const date = new Date(Date.UTC(year, month - 1, day));
              return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                timeZone: 'UTC',
              });
            })()}
            color="emerald"
          />
        )}
      </div>

      {game.game?.genres && game.game.genres.length > 0 && (
        <div className="pt-4 border-t border-theme">
          <div className="text-[10px] font-mono text-theme-muted mb-3 uppercase tracking-wider">Genres</div>
          <div className="flex flex-wrap gap-2">
            {game.game.genres.map((genre, index) => (
              <span
                key={index}
                className="px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-[10px] font-mono font-medium text-cyan-400 uppercase tracking-wider"
              >
                {genre}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Activity Card Component
function ActivityCard({ game }: { game: UserGame }) {
  return (
    <div className="relative p-6 bg-theme-secondary border border-violet-500/20 rounded-xl space-y-4 overflow-hidden">
      {/* HUD corners */}
      <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-violet-400/30" />
      <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-violet-400/30" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-violet-400/30" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-violet-400/30" />

      <h3 className="text-sm font-semibold text-theme-muted flex items-center gap-2 uppercase tracking-wide font-family-display">
        <Activity className="w-4 h-4 text-violet-400" />
        Activity
        <span className="text-[10px] font-mono text-theme-subtle font-normal">// TIMELINE</span>
      </h3>

      <div className="space-y-3">
        {game.last_played_at && (
          <InfoRow
            icon={<PlayCircle className="w-4 h-4" />}
            label="Last Played"
            value={new Date(game.last_played_at).toLocaleDateString('en-US', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
            color="cyan"
          />
        )}
        <InfoRow
          icon={<Calendar className="w-4 h-4" />}
          label="Added to Library"
          value={new Date(game.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
          color="violet"
        />
        <InfoRow
          icon={<CheckCircle2 className="w-4 h-4" />}
          label="Last Synced"
          value={new Date(game.updated_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
          color="emerald"
        />
      </div>
    </div>
  );
}

// Tags Card Component
function TagsCard({ tags }: { tags: string[] }) {
  return (
    <div className="relative p-6 bg-theme-secondary border border-amber-500/20 rounded-xl space-y-4 overflow-hidden">
      {/* HUD corners */}
      <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-amber-400/30" />
      <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-amber-400/30" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-amber-400/30" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-amber-400/30" />

      <h3 className="text-sm font-semibold text-theme-muted flex items-center gap-2 uppercase tracking-wide font-family-display">
        <Tag className="w-4 h-4 text-amber-400" />
        Tags
        <span className="text-[10px] font-mono text-theme-subtle font-normal">// USER_TAGS</span>
      </h3>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, index) => (
          <span
            key={index}
            className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[10px] font-mono font-medium text-amber-400 uppercase tracking-wider"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

// Notes Card Component
function NotesCard({ notes }: { notes: string }) {
  return (
    <div className="relative mt-6 p-6 bg-theme-secondary border border-emerald-500/20 rounded-xl space-y-4 overflow-hidden">
      {/* HUD corners */}
      <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-emerald-400/30" />
      <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-emerald-400/30" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-emerald-400/30" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-emerald-400/30" />

      <h3 className="text-sm font-semibold text-theme-muted flex items-center gap-2 uppercase tracking-wide font-family-display">
        <Terminal className="w-4 h-4 text-emerald-400" />
        Notes
        <span className="text-[10px] font-mono text-theme-subtle font-normal">// PERSONAL_LOG</span>
      </h3>
      <p className="text-sm text-theme-muted leading-relaxed whitespace-pre-wrap">
        {notes}
      </p>
    </div>
  );
}
