'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Target,
  Crown,
  Zap,
  Gamepad2,
  ArrowRight,
  Loader2,
  Sparkles,
  Medal,
  Star,
} from 'lucide-react';
import { SteamLogo, PlayStationLogo, XboxLogo } from '@/components/icons/PlatformLogos';
import { getAchievementStats, type AchievementStats } from '@/lib/actions/achievements';

export default function AchievementsPage() {
  const [stats, setStats] = useState<AchievementStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    async function loadStats() {
      const data = await getAchievementStats();
      setStats(data);
      setLoading(false);
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--theme-bg-primary)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Trophy className="w-12 h-12 text-emerald-400/60 animate-pulse" />
            <div className="absolute inset-0 w-12 h-12 border-2 border-emerald-400/20 rounded-full animate-ping" />
          </div>
          <p className="text-[11px] font-mono text-[var(--theme-text-subtle)] uppercase tracking-wider">
            // Loading achievement data...
          </p>
        </div>
      </div>
    );
  }

  // Empty state - no achievements tracked yet
  if (!stats || stats.gamesWithAchievements === 0) {
    return (
      <div className="min-h-screen bg-[var(--theme-bg-primary)] relative">
        {/* Ambient glow */}
        <div className="fixed top-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/[0.03] rounded-full blur-[120px] pointer-events-none animate-breathe" />

        <div className="relative max-w-4xl mx-auto px-6 py-20">
          <div className="relative bg-[var(--theme-bg-secondary)] border border-[var(--theme-border)] rounded-2xl p-12 text-center overflow-hidden">
            {/* HUD corners */}
            <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-emerald-400/30" />
            <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-emerald-400/30" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-emerald-400/30" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-emerald-400/30" />

            <span className="text-[10px] font-mono text-[var(--theme-text-subtle)] uppercase tracking-wider mb-6 block">
              // NO_DATA
            </span>

            <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-10 h-10 text-emerald-400" />
            </div>

            <h1 className="text-3xl font-bold text-white mb-4 font-[family-name:var(--font-family-display)]">
              NO ACHIEVEMENTS YET
            </h1>

            <p className="text-[var(--theme-text-muted)] mb-8 max-w-md mx-auto">
              Sync your Steam, PlayStation, or Xbox library to start tracking your achievements.
              Your trophy hunting journey begins here.
            </p>

            <Link href="/settings">
              <button className="group relative inline-flex items-center gap-2 px-6 py-3 overflow-hidden rounded-xl">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-cyan-600 opacity-90 group-hover:opacity-100 transition-opacity" />
                <span className="relative font-semibold text-white uppercase tracking-wide font-[family-name:var(--font-family-display)]">
                  Connect Platforms
                </span>
                <ArrowRight className="relative w-4 h-4 text-white group-hover:translate-x-0.5 transition-transform" />
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--theme-bg-primary)] relative">
      {/* Ambient glow orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div
          className="absolute -top-40 left-1/4 w-[600px] h-[600px] rounded-full blur-[120px] animate-breathe"
          style={{ background: 'radial-gradient(circle, rgba(52, 211, 153, 0.04) 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-1/2 -right-40 w-[500px] h-[500px] rounded-full blur-[120px] animate-breathe"
          style={{
            background: 'radial-gradient(circle, rgba(251, 191, 36, 0.03) 0%, transparent 70%)',
            animationDelay: '2s',
          }}
        />
      </div>

      <div
        className={`relative max-w-7xl mx-auto px-6 py-10 transition-all duration-500 ${
          mounted ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500/10 to-amber-500/10 border border-[var(--theme-border)] flex items-center justify-center">
                <Trophy className="w-7 h-7 text-emerald-400" />
              </div>
              {/* HUD corners */}
              <div className="absolute -top-1 -left-1 w-2 h-2 border-l-2 border-t-2 border-emerald-400/50" />
              <div className="absolute -top-1 -right-1 w-2 h-2 border-r-2 border-t-2 border-emerald-400/50" />
              <div className="absolute -bottom-1 -left-1 w-2 h-2 border-l-2 border-b-2 border-emerald-400/50" />
              <div className="absolute -bottom-1 -right-1 w-2 h-2 border-r-2 border-b-2 border-emerald-400/50" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-[var(--theme-text-subtle)] uppercase tracking-wider block mb-1">
                // TROPHY_HUNTER
              </span>
              <h1 className="text-3xl font-bold text-white font-[family-name:var(--font-family-display)]">
                ACHIEVEMENTS
              </h1>
            </div>
          </div>
        </div>

        {/* Hero Stats */}
        <section className="mb-10 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-4 mb-5">
            <Target className="w-4 h-4 text-[var(--theme-text-subtle)]" />
            <span className="text-[10px] font-mono text-[var(--theme-text-subtle)] uppercase tracking-wider">
              // OVERALL_STATS
            </span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Earned */}
            <HeroStatCard
              icon={Trophy}
              value={stats.totalEarned.toLocaleString()}
              label="Achievements Earned"
              sublabel={`of ${stats.totalAvailable.toLocaleString()}`}
              color="emerald"
              delay={0}
            />

            {/* Completion */}
            <HeroStatCard
              icon={Target}
              value={`${stats.completionPercentage}%`}
              label="Overall Completion"
              sublabel={`${stats.gamesWithAchievements} games tracked`}
              color="cyan"
              delay={0.05}
            />

            {/* Perfect Games */}
            <HeroStatCard
              icon={Crown}
              value={stats.perfectGames.toString()}
              label="Perfect Games"
              sublabel="100% completion"
              color="amber"
              delay={0.1}
            />

            {/* Almost There */}
            <HeroStatCard
              icon={Zap}
              value={stats.almostComplete.length.toString()}
              label="Almost Complete"
              sublabel="90-99% done"
              color="violet"
              delay={0.15}
            />
          </div>
        </section>

        {/* Platform Breakdown */}
        <section className="mb-10 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-4 mb-5">
            <Gamepad2 className="w-4 h-4 text-[var(--theme-text-subtle)]" />
            <span className="text-[10px] font-mono text-[var(--theme-text-subtle)] uppercase tracking-wider">
              // PLATFORM_BREAKDOWN
            </span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Steam */}
            <PlatformCard
              name="Steam"
              logo={<SteamLogo className="w-6 h-6" />}
              stats={stats.platformStats.steam}
              color="#66c0f4"
              bgColor="bg-[#1b2838]/40"
              borderColor="border-[#66c0f4]/30"
              delay={0}
            />

            {/* PlayStation */}
            <PlatformCard
              name="PlayStation"
              logo={<PlayStationLogo className="w-6 h-6" />}
              stats={stats.platformStats.psn}
              color="#0070cc"
              bgColor="bg-[#003791]/30"
              borderColor="border-[#0070cc]/30"
              delay={0.05}
            />

            {/* Xbox */}
            <PlatformCard
              name="Xbox"
              logo={<XboxLogo className="w-6 h-6" />}
              stats={stats.platformStats.xbox}
              color="#52b043"
              bgColor="bg-[#107c10]/30"
              borderColor="border-[#52b043]/30"
              delay={0.1}
            />
          </div>
        </section>

        {/* Almost Complete Section */}
        {stats.almostComplete.length > 0 && (
          <section className="mb-10 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center gap-4 mb-5">
              <Zap className="w-4 h-4 text-[var(--theme-text-subtle)]" />
              <span className="text-[10px] font-mono text-[var(--theme-text-subtle)] uppercase tracking-wider">
                // ALMOST_THERE
              </span>
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="text-[10px] font-mono text-violet-400/60 uppercase">
                {stats.almostComplete.length} games at 90%+
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.almostComplete.map((item, index) => (
                <AlmostCompleteCard
                  key={item.userGame.id}
                  userGame={item.userGame}
                  percentage={item.percentage}
                  remaining={item.remaining}
                  index={index}
                />
              ))}
            </div>
          </section>
        )}

        {/* Top Progress Section */}
        {stats.topCompletedGames.length > 0 && (
          <section className="mb-10 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center gap-4 mb-5">
              <Medal className="w-4 h-4 text-[var(--theme-text-subtle)]" />
              <span className="text-[10px] font-mono text-[var(--theme-text-subtle)] uppercase tracking-wider">
                // IN_PROGRESS
              </span>
              <div className="flex-1 h-px bg-white/[0.06]" />
              <Link
                href="/library"
                className="text-[10px] font-mono text-cyan-400/60 hover:text-cyan-400 uppercase flex items-center gap-1 transition-colors"
              >
                View All
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {stats.topCompletedGames.map((item, index) => (
                <GameProgressCard
                  key={item.userGame.id}
                  userGame={item.userGame}
                  percentage={item.percentage}
                  index={index}
                />
              ))}
            </div>
          </section>
        )}

        {/* Perfect Games Section */}
        {stats.perfectGames > 0 && (
          <section className="animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
            <div className="relative bg-[var(--theme-bg-secondary)] border border-amber-500/20 rounded-xl p-6 overflow-hidden">
              {/* HUD corners */}
              <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-amber-400/40" />
              <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-amber-400/40" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-amber-400/40" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-amber-400/40" />

              {/* Subtle gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/[0.03] to-transparent" />

              <div className="relative flex items-center gap-6">
                <div className="w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                  <Crown className="w-7 h-7 text-amber-400" />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-bold text-white font-[family-name:var(--font-family-display)]">
                      PERFECTIONIST
                    </h3>
                    <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded text-[10px] font-mono text-amber-400 uppercase">
                      {stats.perfectGames} games
                    </span>
                  </div>
                  <p className="text-sm text-[var(--theme-text-muted)]">
                    You've achieved 100% completion on {stats.perfectGames} game
                    {stats.perfectGames !== 1 ? 's' : ''}. That's dedication!
                  </p>
                </div>

                <div className="hidden md:flex items-center gap-1">
                  {Array.from({ length: Math.min(stats.perfectGames, 5) }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 text-amber-400 fill-amber-400"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                  {stats.perfectGames > 5 && (
                    <span className="text-sm font-mono text-amber-400/60 ml-1">
                      +{stats.perfectGames - 5}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

// Hero stat card component
function HeroStatCard({
  icon: Icon,
  value,
  label,
  sublabel,
  color,
  delay,
}: {
  icon: typeof Trophy;
  value: string;
  label: string;
  sublabel: string;
  color: 'emerald' | 'cyan' | 'amber' | 'violet';
  delay: number;
}) {
  const colorStyles = {
    emerald: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      text: 'text-emerald-400',
      glow: 'group-hover:shadow-emerald-500/10',
    },
    cyan: {
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20',
      text: 'text-cyan-400',
      glow: 'group-hover:shadow-cyan-500/10',
    },
    amber: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      text: 'text-amber-400',
      glow: 'group-hover:shadow-amber-500/10',
    },
    violet: {
      bg: 'bg-violet-500/10',
      border: 'border-violet-500/20',
      text: 'text-violet-400',
      glow: 'group-hover:shadow-violet-500/10',
    },
  };

  const styles = colorStyles[color];

  return (
    <div
      className={`group relative bg-[var(--theme-bg-secondary)] border border-[var(--theme-border)] rounded-xl p-5 hover:border-white/[0.12] transition-all duration-300 overflow-hidden ${styles.glow} hover:shadow-lg`}
      style={{ animation: `fadeIn 0.4s ease-out ${delay}s both` }}
    >
      {/* HUD corners */}
      <div className={`absolute top-0 left-0 w-2 h-2 border-l border-t ${styles.border} opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className={`absolute top-0 right-0 w-2 h-2 border-r border-t ${styles.border} opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className={`absolute bottom-0 left-0 w-2 h-2 border-l border-b ${styles.border} opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className={`absolute bottom-0 right-0 w-2 h-2 border-r border-b ${styles.border} opacity-0 group-hover:opacity-100 transition-opacity`} />

      <div className="relative flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl ${styles.bg} ${styles.border} border flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
          <Icon className={`w-6 h-6 ${styles.text}`} />
        </div>

        <div className="min-w-0">
          <div className={`text-2xl font-bold font-mono ${styles.text} tabular-nums`}>
            {value}
          </div>
          <div className="text-sm text-[var(--theme-text-muted)] font-medium truncate">{label}</div>
          <div className="text-[11px] font-mono text-[var(--theme-text-subtle)]">{sublabel}</div>
        </div>
      </div>
    </div>
  );
}

// Platform card component
function PlatformCard({
  name,
  logo,
  stats,
  color,
  bgColor,
  borderColor,
  delay,
}: {
  name: string;
  logo: React.ReactNode;
  stats: { earned: number; total: number; games: number; completionPercentage: number };
  color: string;
  bgColor: string;
  borderColor: string;
  delay: number;
}) {
  const hasData = stats.games > 0;

  return (
    <div
      className={`group relative bg-[var(--theme-bg-secondary)] border ${borderColor} rounded-xl p-5 transition-all duration-300 overflow-hidden hover:border-opacity-60`}
      style={{ animation: `fadeIn 0.4s ease-out ${delay}s both` }}
    >
      {/* HUD corners */}
      <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 opacity-40 group-hover:opacity-70 transition-opacity" style={{ borderColor: color }} />
      <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 opacity-40 group-hover:opacity-70 transition-opacity" style={{ borderColor: color }} />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 opacity-40 group-hover:opacity-70 transition-opacity" style={{ borderColor: color }} />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 opacity-40 group-hover:opacity-70 transition-opacity" style={{ borderColor: color }} />

      {/* Background glow */}
      <div className={`absolute inset-0 ${bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform"
            style={{ backgroundColor: `${color}15`, borderColor: `${color}30`, borderWidth: 1 }}
          >
            <div style={{ color }}>{logo}</div>
          </div>
          <div>
            <h3 className="font-semibold text-white font-[family-name:var(--font-family-display)]">
              {name}
            </h3>
            <p className="text-[10px] font-mono text-[var(--theme-text-subtle)] uppercase">
              {stats.games} games
            </p>
          </div>
        </div>

        {hasData ? (
          <>
            {/* Stats */}
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-2xl font-bold font-mono text-white tabular-nums">
                {stats.earned.toLocaleString()}
              </span>
              <span className="text-sm text-[var(--theme-text-subtle)]">
                / {stats.total.toLocaleString()}
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden mb-2">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${stats.completionPercentage}%`,
                  backgroundColor: color,
                }}
              />
            </div>

            <div className="text-right">
              <span className="text-sm font-mono font-medium" style={{ color }}>
                {stats.completionPercentage}%
              </span>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-[var(--theme-text-subtle)]">No achievements synced</p>
            <Link
              href="/settings"
              className="text-xs font-mono uppercase tracking-wider hover:opacity-80 transition-opacity mt-2 inline-block"
              style={{ color }}
            >
              Connect {name}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// Almost complete game card
function AlmostCompleteCard({
  userGame,
  percentage,
  remaining,
  index,
}: {
  userGame: import('@/lib/actions/games').UserGame;
  percentage: number;
  remaining: number;
  index: number;
}) {
  const game = userGame.game;
  const title = game?.title || 'Unknown Game';
  const coverUrl = game?.cover_url;

  return (
    <Link href={`/game/${userGame.id}`}>
      <div
        className="group relative bg-[var(--theme-bg-secondary)] border border-violet-500/20 rounded-xl p-4 hover:border-violet-500/40 transition-all duration-300 overflow-hidden cursor-pointer"
        style={{ animation: `fadeIn 0.4s ease-out ${index * 0.05}s both` }}
      >
        {/* HUD corners */}
        <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-violet-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-violet-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-violet-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-violet-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Subtle background glow */}
        <div className="absolute inset-0 bg-violet-500/[0.03] opacity-0 group-hover:opacity-100 transition-opacity" />

        <div className="relative flex items-center gap-4">
          {/* Cover */}
          <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border border-[var(--theme-border)] group-hover:border-violet-400/30 transition-colors">
            {coverUrl ? (
              <img src={coverUrl} alt={title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[var(--theme-hover-bg)] flex items-center justify-center">
                <Gamepad2 className="w-6 h-6 text-[var(--theme-text-subtle)]" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-white truncate text-sm group-hover:text-violet-200 transition-colors">
              {title}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg font-bold font-mono text-violet-400">
                {percentage}%
              </span>
              <span className="text-xs text-[var(--theme-text-subtle)]">
                {remaining} left
              </span>
            </div>
          </div>

          {/* Arrow */}
          <ArrowRight className="w-4 h-4 text-violet-400/50 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </Link>
  );
}

// Game progress card
function GameProgressCard({
  userGame,
  percentage,
  index,
}: {
  userGame: import('@/lib/actions/games').UserGame;
  percentage: number;
  index: number;
}) {
  const game = userGame.game;
  const title = game?.title || 'Unknown Game';
  const coverUrl = game?.cover_url;
  const earned = userGame.achievements_earned || 0;
  const total = userGame.achievements_total || 0;

  return (
    <Link href={`/game/${userGame.id}`}>
      <div
        className="group relative bg-[var(--theme-bg-secondary)] border border-[var(--theme-border)] rounded-xl overflow-hidden hover:border-cyan-400/30 transition-all duration-300 cursor-pointer"
        style={{ animation: `fadeIn 0.4s ease-out ${index * 0.03}s both` }}
      >
        {/* Cover */}
        <div className="relative aspect-[3/4] overflow-hidden">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-[var(--theme-hover-bg)] flex items-center justify-center">
              <Gamepad2 className="w-10 h-10 text-[var(--theme-text-subtle)]" />
            </div>
          )}

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#030304] via-transparent to-transparent" />

          {/* Progress overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-bold font-mono text-white">
                {percentage}%
              </span>
              <span className="text-[10px] font-mono text-[var(--theme-text-muted)]">
                {earned}/{total}
              </span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-400 rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="p-3 pt-2">
          <h4 className="text-xs font-medium text-[var(--theme-text-primary)] truncate group-hover:text-white transition-colors">
            {title}
          </h4>
        </div>

        {/* HUD corners on hover */}
        <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-cyan-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-cyan-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-cyan-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-cyan-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </Link>
  );
}
