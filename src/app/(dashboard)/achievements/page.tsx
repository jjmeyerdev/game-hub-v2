import Link from 'next/link';
import {
  Trophy,
  Target,
  Crown,
  Zap,
  Gamepad2,
  ArrowRight,
  Medal,
  Star,
} from 'lucide-react';
import { SteamLogo, PlayStationLogo, XboxLogo } from '@/components/icons/PlatformLogos';
import { getAchievementStats } from '@/lib/actions/achievements';
import {
  HeroStatCard,
  PlatformCard,
  AlmostCompleteCard,
  GameProgressCard,
} from '@/components/achievements';

export default async function AchievementsPage() {
  const stats = await getAchievementStats();

  // Empty state - no achievements tracked yet
  if (!stats || stats.gamesWithAchievements === 0) {
    return (
      <div className="min-h-screen bg-theme-primary relative">
        {/* Ambient glow */}
        <div className="fixed top-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/3 rounded-full blur-[120px] pointer-events-none animate-breathe" />

        <div className="relative max-w-4xl mx-auto px-6 py-20">
          <div className="relative bg-theme-secondary border border-theme rounded-2xl p-12 text-center overflow-hidden">
            {/* HUD corners */}
            <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-emerald-400/30" />
            <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-emerald-400/30" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-emerald-400/30" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-emerald-400/30" />

            <span className="text-[10px] font-mono text-theme-subtle uppercase tracking-wider mb-6 block">
              // NO_DATA
            </span>

            <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-10 h-10 text-emerald-400" />
            </div>

            <h1 className="text-3xl font-bold text-white mb-4 font-family-display">
              NO ACHIEVEMENTS YET
            </h1>

            <p className="text-theme-muted mb-8 max-w-md mx-auto">
              Sync your Steam, PlayStation, or Xbox library to start tracking your achievements.
              Your trophy hunting journey begins here.
            </p>

            <Link href="/settings">
              <button className="group relative inline-flex items-center gap-2 px-6 py-3 overflow-hidden rounded-xl">
                <div className="absolute inset-0 bg-linear-to-r from-emerald-500 to-cyan-600 opacity-90 group-hover:opacity-100 transition-opacity" />
                <span className="relative font-semibold text-white uppercase tracking-wide font-family-display">
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
    <div className="min-h-screen bg-theme-primary relative">
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

      <div className="relative max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-xl bg-linear-to-br from-emerald-500/10 to-amber-500/10 border border-theme flex items-center justify-center">
                <Trophy className="w-7 h-7 text-emerald-400" />
              </div>
              {/* HUD corners */}
              <div className="absolute -top-1 -left-1 w-2 h-2 border-l-2 border-t-2 border-emerald-400/50" />
              <div className="absolute -top-1 -right-1 w-2 h-2 border-r-2 border-t-2 border-emerald-400/50" />
              <div className="absolute -bottom-1 -left-1 w-2 h-2 border-l-2 border-b-2 border-emerald-400/50" />
              <div className="absolute -bottom-1 -right-1 w-2 h-2 border-r-2 border-b-2 border-emerald-400/50" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-theme-subtle uppercase tracking-wider block mb-1">
                // TROPHY_HUNTER
              </span>
              <h1 className="text-3xl font-bold text-white font-family-display">
                ACHIEVEMENTS
              </h1>
            </div>
          </div>
        </div>

        {/* Hero Stats */}
        <section className="mb-10 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-4 mb-5">
            <Target className="w-4 h-4 text-theme-subtle" />
            <span className="text-[10px] font-mono text-theme-subtle uppercase tracking-wider">
              // OVERALL_STATS
            </span>
            <div className="flex-1 h-px bg-white/6" />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <HeroStatCard
              icon={Trophy}
              value={stats.totalEarned.toLocaleString()}
              label="Achievements Earned"
              sublabel={`of ${stats.totalAvailable.toLocaleString()}`}
              color="emerald"
              delay={0}
            />
            <HeroStatCard
              icon={Target}
              value={`${stats.completionPercentage}%`}
              label="Overall Completion"
              sublabel={`${stats.gamesWithAchievements} games tracked`}
              color="cyan"
              delay={0.05}
            />
            <HeroStatCard
              icon={Crown}
              value={stats.perfectGames.toString()}
              label="Perfect Games"
              sublabel="100% completion"
              color="amber"
              delay={0.1}
            />
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
            <Gamepad2 className="w-4 h-4 text-theme-subtle" />
            <span className="text-[10px] font-mono text-theme-subtle uppercase tracking-wider">
              // PLATFORM_BREAKDOWN
            </span>
            <div className="flex-1 h-px bg-white/6" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PlatformCard
              name="Steam"
              logo={<SteamLogo className="w-6 h-6" />}
              stats={stats.platformStats.steam}
              color="#66c0f4"
              bgColor="bg-[#1b2838]/40"
              borderColor="border-[#66c0f4]/30"
              delay={0}
            />
            <PlatformCard
              name="PlayStation"
              logo={<PlayStationLogo className="w-6 h-6" />}
              stats={stats.platformStats.psn}
              color="#0070cc"
              bgColor="bg-[#003791]/30"
              borderColor="border-[#0070cc]/30"
              delay={0.05}
            />
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
              <Zap className="w-4 h-4 text-theme-subtle" />
              <span className="text-[10px] font-mono text-theme-subtle uppercase tracking-wider">
                // ALMOST_THERE
              </span>
              <div className="flex-1 h-px bg-white/6" />
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
              <Medal className="w-4 h-4 text-theme-subtle" />
              <span className="text-[10px] font-mono text-theme-subtle uppercase tracking-wider">
                // IN_PROGRESS
              </span>
              <div className="flex-1 h-px bg-white/6" />
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
            <div className="relative bg-theme-secondary border border-amber-500/20 rounded-xl p-6 overflow-hidden">
              {/* HUD corners */}
              <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-amber-400/40" />
              <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-amber-400/40" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-amber-400/40" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-amber-400/40" />

              {/* Subtle gradient */}
              <div className="absolute inset-0 bg-linear-to-r from-amber-500/3 to-transparent" />

              <div className="relative flex items-center gap-6">
                <div className="w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                  <Crown className="w-7 h-7 text-amber-400" />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-bold text-white font-family-display">
                      PERFECTIONIST
                    </h3>
                    <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded text-[10px] font-mono text-amber-400 uppercase">
                      {stats.perfectGames} games
                    </span>
                  </div>
                  <p className="text-sm text-theme-muted">
                    You&apos;ve achieved 100% completion on {stats.perfectGames} game
                    {stats.perfectGames !== 1 ? 's' : ''}. That&apos;s dedication!
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
