'use client';

import { useEffect, useState, Suspense, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft,
  Trophy,
  Crown,
  Lock,
  Unlock,
  AlertCircle,
  Loader2,
  Gamepad2,
  Zap,
  Target,
  Medal,
  Flame,
  Star,
  TrendingUp,
  Award,
  Users,
  BarChart3,
  CheckCircle2,
  User,
  Library,
  Search,
  Database,
  Swords,
} from 'lucide-react';
import { PlayStationLogo, XboxLogo, SteamLogo } from '@/components/icons/PlatformLogos';
import {
  getAchievementComparison,
  initializeComparison,
  type AchievementComparisonResult,
  type ComparisonAchievement,
  type ComparisonStep,
} from '@/lib/actions/compare/achievement-compare';
import type { ComparePlatform } from '@/lib/types/compare';

// Progress step configuration
const PROGRESS_STEPS: { key: ComparisonStep; label: string; icon: React.ElementType }[] = [
  { key: 'searching_friend', label: 'Finding friend', icon: Search },
  { key: 'loading_libraries', label: 'Loading libraries', icon: Library },
  { key: 'finding_game', label: 'Matching game', icon: Gamepad2 },
  { key: 'loading_achievements', label: 'Loading achievements', icon: Trophy },
  { key: 'processing', label: 'Processing data', icon: Database },
];

function AchievementCompareContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [data, setData] = useState<AchievementComparisonResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<ComparisonStep>('initializing');
  const [stepStartTime, setStepStartTime] = useState<number>(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [filter, setFilter] = useState<'all' | 'user_only' | 'friend_only' | 'both' | 'neither'>('all');
  const [isVisible, setIsVisible] = useState(false);
  const [friendInfo, setFriendInfo] = useState<{ username: string; avatarUrl: string | null } | null>(null);
  const [userInfo, setUserInfo] = useState<{ username: string; avatarUrl: string | null } | null>(null);

  const platform = searchParams.get('platform') as ComparePlatform | null;
  const gameTitle = searchParams.get('game');
  const friendId = searchParams.get('friend');

  // Build the back URL with preserved params
  const backUrl = platform && friendId
    ? `/friends?platform=${platform}&friend=${encodeURIComponent(friendId)}`
    : '/friends';

  // Update elapsed time every second while loading
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - stepStartTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [loading, stepStartTime]);

  const loadComparison = useCallback(async () => {
    if (!platform || !gameTitle || !friendId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setStepStartTime(Date.now());

    try {
      // Step 1: Initialize and find friend
      setCurrentStep('searching_friend');
      const initResult = await initializeComparison(platform, friendId);

      if (!initResult.success) {
        setData({
          success: false,
          game: { title: gameTitle, coverUrl: null },
          user: { username: '', avatarUrl: null, earnedCount: 0, totalCount: 0, progress: 0 },
          friend: { username: '', avatarUrl: null, earnedCount: 0, totalCount: 0, progress: 0 },
          achievements: [],
          platform: platform,
          error: initResult.error,
        });
        setCurrentStep('error');
        setLoading(false);
        return;
      }

      // Store friend/user info for display during loading
      if (initResult.friendInfo) {
        setFriendInfo({ username: initResult.friendInfo.username, avatarUrl: initResult.friendInfo.avatarUrl });
      }
      if (initResult.userInfo) {
        setUserInfo({ username: initResult.userInfo.username, avatarUrl: initResult.userInfo.avatarUrl });
      }

      // Step 2-5: Load libraries, find game, load achievements, process
      setCurrentStep('loading_libraries');

      // Small delay to show the step transition
      await new Promise(resolve => setTimeout(resolve, 100));
      setCurrentStep('loading_achievements');

      // Now do the full comparison (which is now faster thanks to caching)
      const result = await getAchievementComparison(platform, decodeURIComponent(gameTitle), friendId);

      setCurrentStep('processing');
      await new Promise(resolve => setTimeout(resolve, 200));

      setData(result);
      setCurrentStep('complete');
      // Trigger entrance animation after data loads
      setTimeout(() => setIsVisible(true), 100);
    } catch (error) {
      setCurrentStep('error');
      setData({
        success: false,
        game: { title: gameTitle, coverUrl: null },
        user: { username: '', avatarUrl: null, earnedCount: 0, totalCount: 0, progress: 0 },
        friend: { username: '', avatarUrl: null, earnedCount: 0, totalCount: 0, progress: 0 },
        achievements: [],
        platform: platform,
        error: error instanceof Error ? error.message : 'Failed to load comparison',
      });
    } finally {
      setLoading(false);
    }
  }, [platform, gameTitle, friendId]);

  useEffect(() => {
    loadComparison();
  }, [loadComparison]);

  const filteredAchievements = data?.achievements.filter(a => {
    switch (filter) {
      case 'user_only': return a.userUnlocked && !a.friendUnlocked;
      case 'friend_only': return !a.userUnlocked && a.friendUnlocked;
      case 'both': return a.userUnlocked && a.friendUnlocked;
      case 'neither': return !a.userUnlocked && !a.friendUnlocked;
      default: return true;
    }
  }) || [];

  // Calculate bragging rights stats
  const braggingRights = useMemo(() => {
    if (!data?.achievements) return null;

    const userRareCount = data.achievements.filter(a => a.userUnlocked && (a.rarityPercentage ?? 100) <= 15).length;
    const friendRareCount = data.achievements.filter(a => a.friendUnlocked && (a.rarityPercentage ?? 100) <= 15).length;

    // Count "first to unlock" for each
    let userFirstCount = 0;
    let friendFirstCount = 0;

    data.achievements.forEach(a => {
      if (a.userUnlocked && a.friendUnlocked && a.userUnlockDate && a.friendUnlockDate) {
        const userDate = new Date(a.userUnlockDate).getTime();
        const friendDate = new Date(a.friendUnlockDate).getTime();
        if (userDate < friendDate) userFirstCount++;
        else if (friendDate < userDate) friendFirstCount++;
      }
    });

    const totalPoints = data.user.earnedCount + data.friend.earnedCount;
    const userPercentage = totalPoints > 0 ? Math.round((data.user.earnedCount / totalPoints) * 100) : 50;

    const winner = data.user.earnedCount > data.friend.earnedCount ? 'user' as const :
                   data.friend.earnedCount > data.user.earnedCount ? 'friend' as const : 'tie' as const;

    return {
      userRareCount,
      friendRareCount,
      userFirstCount,
      friendFirstCount,
      userPercentage,
      friendPercentage: 100 - userPercentage,
      winner,
    };
  }, [data]);

  const platformColors: Record<ComparePlatform, { accent: string; bg: string; border: string; glow: string; gradient: string; text: string }> = {
    psn: {
      accent: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      glow: 'shadow-blue-500/30',
      gradient: 'from-blue-600 to-blue-400',
      text: 'text-blue-400',
    },
    xbox: {
      accent: 'text-green-400',
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      glow: 'shadow-green-500/30',
      gradient: 'from-green-600 to-green-400',
      text: 'text-green-400',
    },
    steam: {
      accent: 'text-slate-300',
      bg: 'bg-slate-500/10',
      border: 'border-slate-500/30',
      glow: 'shadow-slate-500/30',
      gradient: 'from-slate-600 to-slate-400',
      text: 'text-slate-300',
    },
  };

  const colors = platform ? platformColors[platform] : platformColors.psn;

  if (!platform || !gameTitle || !friendId) {
    return (
      <div className="min-h-screen bg-theme-primary flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-theme-muted">Missing required parameters</p>
          <button
            onClick={() => router.push(backUrl)}
            className="mt-4 px-4 py-2 bg-theme-hover border border-theme rounded-lg text-sm text-theme-muted hover:text-theme-primary transition-colors"
          >
            Return to Friends
          </button>
        </div>
      </div>
    );
  }

  // Calculate current step index for progress display
  const currentStepIndex = PROGRESS_STEPS.findIndex(s => s.key === currentStep);
  const progressPercentage = currentStepIndex >= 0
    ? Math.round(((currentStepIndex + 1) / PROGRESS_STEPS.length) * 100)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-theme-primary flex items-center justify-center relative overflow-hidden">
        {/* Animated scan lines */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,255,255,0.02)_50%)] bg-[length:100%_4px] animate-scan" />
        </div>

        {/* Ambient glows */}
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[100px] animate-breathe" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-violet-500/5 rounded-full blur-[80px] animate-breathe" style={{ animationDelay: '1s' }} />

        <div className="relative z-10 w-full max-w-md px-6">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <Loader2 className="w-12 h-12 text-cyan-400 mx-auto mb-4 animate-spin" />
              <div className="absolute inset-0 w-12 h-12 mx-auto rounded-full bg-cyan-400/20 blur-xl animate-pulse" />
            </div>
            <h2 className="text-lg font-bold text-theme-primary font-family-display uppercase tracking-wide mb-1">
              Loading Comparison
            </h2>
            <p className="text-sm text-theme-muted">
              {gameTitle && <span className="text-cyan-400">{decodeURIComponent(gameTitle)}</span>}
            </p>
          </div>

          {/* Players being compared */}
          {(userInfo || friendInfo) && (
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center overflow-hidden">
                  {userInfo?.avatarUrl ? (
                    <Image src={userInfo.avatarUrl} alt={userInfo.username} width={32} height={32} className="object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-cyan-400" />
                  )}
                </div>
                <span className="text-sm font-medium text-cyan-400">{userInfo?.username || 'You'}</span>
              </div>
              <span className="text-xs font-bold text-theme-subtle">VS</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-violet-400">{friendInfo?.username || friendId}</span>
                <div className="w-8 h-8 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center overflow-hidden">
                  {friendInfo?.avatarUrl ? (
                    <Image src={friendInfo.avatarUrl} alt={friendInfo.username} width={32} height={32} className="object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-violet-400" />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Progress card */}
          <div className="relative bg-theme-secondary border border-theme rounded-xl p-5 overflow-hidden">
            {/* HUD corners */}
            <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-cyan-400/30" />
            <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-cyan-400/30" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-cyan-400/30" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-cyan-400/30" />

            {/* Progress bar */}
            <div className="mb-5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-mono text-theme-subtle uppercase tracking-wider">Progress</span>
                <span className="text-xs font-mono text-cyan-400">{progressPercentage}%</span>
              </div>
              <div className="h-1.5 bg-theme-hover rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {/* Steps list */}
            <div className="space-y-3">
              {PROGRESS_STEPS.map((step, index) => {
                const StepIcon = step.icon;
                const isComplete = currentStepIndex > index;
                const isCurrent = currentStepIndex === index;
                const isPending = currentStepIndex < index;

                return (
                  <div
                    key={step.key}
                    className={`flex items-center gap-3 transition-all duration-300 ${
                      isPending ? 'opacity-40' : 'opacity-100'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 ${
                      isComplete
                        ? 'bg-emerald-500/20 border border-emerald-500/40'
                        : isCurrent
                          ? 'bg-cyan-500/20 border border-cyan-500/40'
                          : 'bg-theme-hover border border-theme'
                    }`}>
                      {isComplete ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : isCurrent ? (
                        <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                      ) : (
                        <StepIcon className="w-3.5 h-3.5 text-theme-subtle" />
                      )}
                    </div>
                    <span className={`text-sm font-medium transition-colors duration-300 ${
                      isComplete
                        ? 'text-emerald-400'
                        : isCurrent
                          ? 'text-cyan-400'
                          : 'text-theme-muted'
                    }`}>
                      {step.label}
                    </span>
                    {isCurrent && (
                      <span className="ml-auto text-[10px] font-mono text-theme-subtle">
                        {elapsedTime}s
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Estimated time hint */}
            {elapsedTime > 10 && (
              <div className="mt-4 pt-4 border-t border-theme">
                <p className="text-[11px] text-theme-subtle text-center">
                  Xbox API can be slow. Thanks for your patience!
                </p>
              </div>
            )}
          </div>

          {/* Back button */}
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push(backUrl)}
              className="text-sm text-theme-muted hover:text-theme-primary transition-colors"
            >
              ← Cancel and go back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data?.success) {
    return (
      <div className="min-h-screen bg-theme-primary flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 mb-2 font-semibold">Failed to load comparison</p>
          <p className="text-theme-muted text-sm">{data?.error}</p>
          <button
            onClick={() => router.push(backUrl)}
            className="mt-6 px-4 py-2 bg-theme-hover border border-theme rounded-lg text-sm text-theme-muted hover:text-theme-primary transition-colors"
          >
            Return to Friends
          </button>
        </div>
      </div>
    );
  }

  // Check if this is an Xbox 360 game (has counts but no detailed achievements)
  const isXbox360Game = data.achievements.length === 0 && data.user.totalCount > 0;

  const isPsn = platform === 'psn';
  const isXbox = platform === 'xbox';

  // Calculate stats for the stat cards
  const totalAchievements = data.achievements.length;
  const bothEarned = data.achievements.filter(a => a.userUnlocked && a.friendUnlocked).length;
  const userOnly = data.achievements.filter(a => a.userUnlocked && !a.friendUnlocked).length;
  const friendOnly = data.achievements.filter(a => !a.userUnlocked && a.friendUnlocked).length;

  // Simplified view for Xbox 360 games (counts only, no detailed achievements)
  if (isXbox360Game) {
    const userWinning = data.user.earnedCount > data.friend.earnedCount;
    const friendWinning = data.friend.earnedCount > data.user.earnedCount;
    const isTie = data.user.earnedCount === data.friend.earnedCount;

    return (
      <div className="relative min-h-screen bg-theme-primary">
        {/* Ambient glow blobs */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] bg-green-500/3 rounded-full blur-[120px] animate-breathe" />
          <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-emerald-500/3 rounded-full blur-[120px] animate-breathe" style={{ animationDelay: '2s' }} />
        </div>

        {/* Header */}
        <header className="sticky top-0 z-40 backdrop-blur-xl bg-theme-primary/80 border-b border-theme">
          <div className="absolute top-0 left-8 right-8 h-px bg-linear-to-r from-transparent via-green-500/30 to-transparent" />
          <div className="px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
              <button
                onClick={() => router.push(backUrl)}
                className="group flex items-center gap-2 px-4 py-2 bg-theme-hover hover:bg-green-500/10 border border-theme hover:border-green-500/30 rounded-xl text-sm text-theme-muted hover:text-green-400 transition-all"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                <span className="font-mono text-xs uppercase tracking-wider">Back to Compare</span>
              </button>
            </div>
          </div>
        </header>

        <div className="px-6 lg:px-8 py-12">
          <div className="max-w-4xl mx-auto">
            {/* Game Card */}
            <div className="relative bg-theme-secondary border border-green-500/20 rounded-2xl overflow-hidden">
              {/* HUD corners */}
              <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-green-400/30" />
              <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-green-400/30" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-green-400/30" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-green-400/30" />

              <div className="p-8">
                {/* Game Info Header */}
                <div className="mb-10">
                  {/* Platform & Mode Badges */}
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-xl">
                      <XboxLogo size="sm" className="text-green-400" />
                      <span className="text-xs font-mono font-semibold text-green-400 uppercase tracking-wider">Xbox 360</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider">Legacy Mode</span>
                    </div>
                  </div>

                  {/* Game Title */}
                  <span className="text-[10px] font-mono text-theme-subtle uppercase tracking-wider mb-2 block">// TARGET_GAME</span>
                  <h1 className="text-3xl md:text-4xl font-bold text-theme-primary mb-3 font-family-display uppercase tracking-wide">
                    {data.game.title}
                  </h1>

                  {/* Quick Stats Row */}
                  <div className="flex flex-wrap items-center gap-4 mt-4">
                    <div className="flex items-center gap-2 px-3 py-2 bg-theme-hover/50 border border-theme rounded-lg">
                      <Target className="w-4 h-4 text-green-400" />
                      <span className="text-xs text-theme-muted">Total:</span>
                      <span className="text-sm font-bold text-green-400 font-family-display">{data.user.totalCount}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-theme-hover/50 border border-theme rounded-lg">
                      <Swords className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs text-theme-muted">Duel:</span>
                      <span className="text-sm font-bold text-cyan-400">{data.user.username}</span>
                      <span className="text-xs text-theme-subtle">vs</span>
                      <span className="text-sm font-bold text-green-400">{data.friend.username}</span>
                    </div>
                  </div>
                </div>

                {/* VS Comparison */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-green-500/5 rounded-xl" />

                  <div className="relative grid grid-cols-[1fr_auto_1fr] gap-4 md:gap-8 items-center p-6">
                    {/* User */}
                    <div className="text-center">
                      <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border-2 border-cyan-500/40 mx-auto mb-3">
                        {data.user.avatarUrl ? (
                          <Image src={data.user.avatarUrl} alt={data.user.username} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full bg-cyan-500/10 flex items-center justify-center">
                            <span className="text-xl font-bold text-cyan-400">{data.user.username.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                        {userWinning && (
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center border-2 border-theme-primary">
                            <Crown className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <p className="font-bold text-cyan-400 truncate mb-1">{data.user.username}</p>
                      <div className="text-3xl md:text-4xl font-bold text-theme-primary font-family-display">
                        {data.user.earnedCount}
                      </div>
                      <p className="text-xs text-theme-muted mt-1">achievements</p>
                      <div className="mt-3 h-2 bg-theme-hover rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full transition-all duration-1000"
                          style={{ width: `${data.user.progress}%` }}
                        />
                      </div>
                      <p className="text-xs font-mono text-cyan-400 mt-1">{data.user.progress}%</p>
                    </div>

                    {/* VS */}
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-cyan-500/20 to-green-500/20 border border-white/10 flex items-center justify-center">
                        <span className="text-lg md:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-green-400 font-family-display">VS</span>
                      </div>
                      {isTie && (
                        <span className="mt-2 text-[10px] font-mono text-amber-400 uppercase tracking-wider">Tied!</span>
                      )}
                    </div>

                    {/* Friend */}
                    <div className="text-center">
                      <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border-2 border-green-500/40 mx-auto mb-3">
                        {data.friend.avatarUrl ? (
                          <Image src={data.friend.avatarUrl} alt={data.friend.username} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full bg-green-500/10 flex items-center justify-center">
                            <span className="text-xl font-bold text-green-400">{data.friend.username.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                        {friendWinning && (
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center border-2 border-theme-primary">
                            <Crown className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <p className="font-bold text-green-400 truncate mb-1">{data.friend.username}</p>
                      <div className="text-3xl md:text-4xl font-bold text-theme-primary font-family-display">
                        {data.friend.earnedCount}
                      </div>
                      <p className="text-xs text-theme-muted mt-1">achievements</p>
                      <div className="mt-3 h-2 bg-theme-hover rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-1000"
                          style={{ width: `${data.friend.progress}%` }}
                        />
                      </div>
                      <p className="text-xs font-mono text-green-400 mt-1">{data.friend.progress}%</p>
                    </div>
                  </div>
                </div>

                {/* Info Note */}
                <div className="mt-8 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-400">Xbox 360 Game</p>
                      <p className="text-xs text-theme-muted mt-1">
                        Individual achievement details are not available for Xbox 360 titles through the Xbox API.
                        Only total counts are shown.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
              onClick={() => router.push(backUrl)}
              className="group flex items-center gap-2 px-4 py-2 bg-theme-hover hover:bg-cyan-500/10 border border-theme hover:border-cyan-500/30 rounded-xl text-sm text-theme-muted hover:text-cyan-400 transition-all"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span className="font-mono text-xs uppercase tracking-wider">Back</span>
            </button>

            {/* Live indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-theme-secondary border border-theme rounded-lg">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
              </span>
              <span className="text-[10px] font-mono text-theme-muted uppercase tracking-widest">Live Comparison</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Game Detail Style Layout */}
      <div className={`relative transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {/* Blurred Background */}
        {data.game.coverUrl && (
          <div
            className="absolute inset-0 opacity-5 blur-[80px] scale-110"
            style={{
              backgroundImage: `url(${data.game.coverUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        )}

        <div className="relative px-6 lg:px-8 py-10">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-10">
              {/* Cover Art - Game Detail Style */}
              <div className="relative">
                <div className="relative w-full aspect-3/4 rounded-2xl overflow-hidden bg-theme-secondary border border-theme">
                  {/* HUD corners */}
                  <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-cyan-400/40 z-10" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-cyan-400/40 z-10" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-cyan-400/40 z-10" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-cyan-400/40 z-10" />

                  {data.game.coverUrl ? (
                    <Image
                      src={data.game.coverUrl}
                      alt={data.game.title}
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

                {/* Achievement Duel Badge - Below Cover */}
                <div className="absolute -bottom-4 left-4 right-4">
                  <div className="relative px-4 py-2.5 bg-cyan-500/10 border border-cyan-500/20 backdrop-blur-xl rounded-xl flex items-center justify-center gap-2 overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400" />
                    <Swords className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-semibold uppercase tracking-wide font-family-display text-cyan-400">
                      Achievement Duel
                    </span>
                  </div>
                </div>
              </div>

              {/* Game Info - Right Side */}
              <div className="space-y-6 pt-2">
                {/* Platform Badge */}
                <div className={`inline-flex items-center gap-2.5 px-4 py-2 ${colors.bg} ${colors.border} border rounded-xl`}>
                  <span className={colors.text}>
                    {platform === 'psn' ? <PlayStationLogo size="sm" /> :
                     platform === 'xbox' ? <XboxLogo size="sm" /> :
                     <SteamLogo size="sm" />}
                  </span>
                  <span className={`text-[11px] font-mono font-semibold uppercase tracking-wider ${colors.text}`}>
                    {platform === 'psn' ? 'PlayStation' : platform === 'xbox' ? 'Xbox One' : 'Steam'}
                  </span>
                </div>

                {/* Title */}
                <div>
                  <span className="text-[10px] font-mono text-theme-subtle uppercase tracking-wider mb-2 block">// GAME_DATA</span>
                  <h1 className="text-4xl lg:text-5xl font-bold text-theme-primary leading-tight uppercase tracking-wide font-family-display">
                    {data.game.title}
                  </h1>
                </div>

                {/* Stats Grid - Colored Cards like Game Detail */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
                  <CompareStatCard
                    icon={<Target className="w-4 h-4" />}
                    label="Total"
                    value={String(totalAchievements)}
                    color="cyan"
                  />
                  <CompareStatCard
                    icon={<Medal className="w-4 h-4" />}
                    label="Shared"
                    value={String(bothEarned)}
                    color="violet"
                  />
                  <CompareStatCard
                    icon={<Flame className="w-4 h-4" />}
                    label="You Only"
                    value={String(userOnly)}
                    color="amber"
                  />
                  <CompareStatCard
                    icon={<Star className="w-4 h-4" />}
                    label="Friend Only"
                    value={String(friendOnly)}
                    color="emerald"
                  />
                </div>

                {/* Progress Section - Game Detail Style */}
                <CompareProgressSection
                  user={data.user}
                  friend={data.friend}
                  isPsn={isPsn}
                  colors={colors}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details Section - Two Column Cards */}
      <div className="px-6 lg:px-8 py-10">
        <div className="max-w-7xl mx-auto">
          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {/* Player Comparison Card */}
            <PlayerComparisonCard
              user={data.user}
              friend={data.friend}
              isPsn={isPsn}
              colors={colors}
            />

            {/* Bragging Rights Card */}
            {braggingRights && (
              <BraggingRightsCard
                braggingRights={braggingRights}
                userName={data.user.username}
                friendName={data.friend.username}
                colors={colors}
                isPsn={isPsn}
              />
            )}
          </div>

          {/* Achievement Breakdown Section */}
          <div className={`mt-6 transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="relative p-6 bg-theme-secondary border border-amber-500/20 rounded-xl overflow-hidden">
              {/* HUD corners */}
              <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-amber-400/30" />
              <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-amber-400/30" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-amber-400/30" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-amber-400/30" />

              {/* Section Header with Filters */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <Trophy className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-theme-muted flex items-center gap-2 uppercase tracking-wide font-family-display">
                      {isPsn ? 'Trophy Breakdown' : 'Achievement Breakdown'}
                      <span className="text-[10px] font-mono text-theme-subtle font-normal">// DETAILS</span>
                    </h2>
                    <p className="text-xs text-theme-subtle">
                      {filteredAchievements.length} of {data.achievements.length} shown
                    </p>
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'all', label: 'All', icon: Target },
                    { key: 'both', label: 'Both', icon: Medal },
                    { key: 'user_only', label: 'You', icon: Flame },
                    { key: 'friend_only', label: 'Friend', icon: Star },
                    { key: 'neither', label: 'Locked', icon: Lock },
                  ].map((f) => {
                    const Icon = f.icon;
                    return (
                      <button
                        key={f.key}
                        onClick={() => setFilter(f.key as typeof filter)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium uppercase tracking-wider transition-all duration-300 ${
                          filter === f.key
                            ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                            : 'bg-theme-hover border border-theme text-theme-muted hover:text-theme-primary hover:border-theme-hover'
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                        {f.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Achievements List */}
              <div className="space-y-3">
                {filteredAchievements.map((achievement, index) => (
                  <AchievementRow
                    key={achievement.id}
                    achievement={achievement}
                    index={index}
                    isPsn={isPsn}
                    isXbox={isXbox}
                    userName={data.user.username}
                    friendName={data.friend.username}
                    colors={colors}
                    isVisible={isVisible}
                  />
                ))}

                {filteredAchievements.length === 0 && (
                  <div className="text-center py-16 relative">
                    <Trophy className="w-16 h-16 text-theme-subtle mx-auto mb-4" />
                    {data.error ? (
                      <>
                        <p className="text-amber-400 font-medium mb-2">Limited Data Available</p>
                        <p className="text-theme-muted text-sm max-w-md mx-auto">{data.error}</p>
                        <p className="text-theme-subtle text-xs mt-4 font-mono">
                          The Xbox API provides detailed achievements for Xbox One and Series X|S games,
                          but only summary counts for Xbox 360 titles.
                        </p>
                      </>
                    ) : (
                      <p className="text-theme-muted font-mono uppercase tracking-widest">No {isPsn ? 'trophies' : 'achievements'} match this filter</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Compare Stat Card Component - Matches Game Detail Style
function CompareStatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'cyan' | 'violet' | 'amber' | 'emerald';
}) {
  const colorMap = {
    cyan: { text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', corner: 'border-cyan-400/30' },
    violet: { text: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20', corner: 'border-violet-400/30' },
    amber: { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', corner: 'border-amber-400/30' },
    emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', corner: 'border-emerald-400/30' },
  };

  const c = colorMap[color];

  return (
    <div className={`relative p-4 ${c.bg} ${c.border} border rounded-xl overflow-hidden group hover:border-white/15 transition-all`}>
      {/* HUD corners on hover */}
      <div className={`absolute top-0 left-0 w-2 h-2 border-l border-t ${c.corner} opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className={`absolute top-0 right-0 w-2 h-2 border-r border-t ${c.corner} opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className={`absolute bottom-0 left-0 w-2 h-2 border-l border-b ${c.corner} opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className={`absolute bottom-0 right-0 w-2 h-2 border-r border-b ${c.corner} opacity-0 group-hover:opacity-100 transition-opacity`} />

      <div className={`${c.text} mb-2`}>{icon}</div>
      <div className="text-[10px] font-mono text-theme-muted mb-1 uppercase tracking-wider">{label}</div>
      <div className="text-lg font-bold text-theme-primary font-family-display">{value}</div>
    </div>
  );
}

// Compare Progress Section - Matches Game Detail Style
function CompareProgressSection({
  user,
  friend,
  isPsn,
  colors,
}: {
  user: { username: string; earnedCount: number; totalCount: number; progress: number };
  friend: { username: string; earnedCount: number; totalCount: number; progress: number };
  isPsn: boolean;
  colors: { accent: string; bg: string; border: string };
}) {
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

      {/* User Progress */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-mono text-theme-muted uppercase tracking-wider">
            <span className="text-cyan-400">{user.username}</span>
          </span>
          <span className="text-xs font-mono font-medium text-cyan-400">
            {user.progress}%
          </span>
        </div>
        <div className="h-2 bg-theme-hover rounded-full overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-cyan-500 to-cyan-400 rounded-full transition-all duration-500"
            style={{ width: `${user.progress}%` }}
          />
        </div>
      </div>

      {/* Friend Progress */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-mono text-theme-muted uppercase tracking-wider">
            <span className={colors.accent}>{friend.username}</span>
          </span>
          <span className={`text-xs font-mono font-medium ${colors.accent}`}>
            {friend.progress}%
          </span>
        </div>
        <div className="h-2 bg-theme-hover rounded-full overflow-hidden">
          <div
            className={`h-full bg-linear-to-r ${colors.accent.includes('blue') ? 'from-blue-500 to-blue-400' : colors.accent.includes('green') ? 'from-green-500 to-green-400' : 'from-violet-500 to-violet-400'} rounded-full transition-all duration-500`}
            style={{ width: `${friend.progress}%` }}
          />
        </div>
      </div>

      {/* Achievement Counts */}
      <div className="pt-2 border-t border-theme">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-mono text-theme-muted uppercase tracking-wider">
            {isPsn ? 'Trophies' : 'Achievements'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-xs text-theme-muted">{user.username}:</span>
            <span className="text-sm font-bold text-cyan-400 font-family-display">{user.earnedCount}/{user.totalCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${colors.accent.includes('blue') ? 'bg-blue-400' : colors.accent.includes('green') ? 'bg-green-400' : 'bg-violet-400'}`} />
            <span className="text-xs text-theme-muted">{friend.username}:</span>
            <span className={`text-sm font-bold ${colors.accent} font-family-display`}>{friend.earnedCount}/{friend.totalCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Player Comparison Card - Game Detail Activity Style
function PlayerComparisonCard({
  user,
  friend,
  isPsn,
  colors,
}: {
  user: { username: string; avatarUrl: string | null; earnedCount: number; totalCount: number; progress: number };
  friend: { username: string; avatarUrl: string | null; earnedCount: number; totalCount: number; progress: number };
  isPsn: boolean;
  colors: { accent: string; bg: string; border: string };
}) {
  const userWinning = user.earnedCount > friend.earnedCount;
  const friendWinning = friend.earnedCount > user.earnedCount;

  return (
    <div className="relative p-6 bg-theme-secondary border border-cyan-500/20 rounded-xl space-y-4 overflow-hidden">
      {/* HUD corners */}
      <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-cyan-400/30" />
      <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-cyan-400/30" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-cyan-400/30" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-cyan-400/30" />

      <h3 className="text-sm font-semibold text-theme-muted flex items-center gap-2 uppercase tracking-wide font-family-display">
        <Users className="w-4 h-4 text-cyan-400" />
        Players
        <span className="text-[10px] font-mono text-theme-subtle font-normal">// HEAD_TO_HEAD</span>
      </h3>

      <div className="space-y-3">
        {/* User Row - InfoRow Style */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
          <div className="relative w-14 h-14 rounded-xl overflow-hidden border-2 border-cyan-500/30 flex-shrink-0">
            {user.avatarUrl ? (
              <Image src={user.avatarUrl} alt={user.username} fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-cyan-500/10 flex items-center justify-center">
                <span className="text-xl font-bold text-cyan-400">{user.username.charAt(0).toUpperCase()}</span>
              </div>
            )}
            {userWinning && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center border-2 border-theme-primary">
                <Crown className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-cyan-400 truncate text-lg font-family-display">{user.username}</p>
            <p className="text-sm text-theme-muted">
              <span className="font-mono font-bold text-cyan-400">{user.earnedCount}</span>
              <span className="text-theme-subtle"> / {user.totalCount} {isPsn ? 'trophies' : 'achievements'}</span>
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-cyan-400 font-family-display">{user.progress}%</span>
          </div>
        </div>

        {/* VS Divider - Minimalist */}
        <div className="flex items-center justify-center py-1">
          <span className="text-xs font-bold text-theme-subtle font-family-display tracking-widest">VS</span>
        </div>

        {/* Friend Row - InfoRow Style */}
        <div className={`flex items-center gap-4 p-4 rounded-xl ${colors.bg} ${colors.border} border`}>
          <div className={`relative w-14 h-14 rounded-xl overflow-hidden border-2 ${colors.border} flex-shrink-0`}>
            {friend.avatarUrl ? (
              <Image src={friend.avatarUrl} alt={friend.username} fill className="object-cover" />
            ) : (
              <div className={`w-full h-full ${colors.bg} flex items-center justify-center`}>
                <span className={`text-xl font-bold ${colors.accent}`}>{friend.username.charAt(0).toUpperCase()}</span>
              </div>
            )}
            {friendWinning && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center border-2 border-theme-primary">
                <Crown className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`font-bold ${colors.accent} truncate text-lg font-family-display`}>{friend.username}</p>
            <p className="text-sm text-theme-muted">
              <span className={`font-mono font-bold ${colors.accent}`}>{friend.earnedCount}</span>
              <span className="text-theme-subtle"> / {friend.totalCount} {isPsn ? 'trophies' : 'achievements'}</span>
            </p>
          </div>
          <div className="text-right">
            <span className={`text-2xl font-bold ${colors.accent} font-family-display`}>{friend.progress}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Bragging Rights Card - Game Detail Activity Style
function BraggingRightsCard({
  braggingRights,
  userName,
  friendName,
  colors,
  isPsn,
}: {
  braggingRights: {
    userRareCount: number;
    friendRareCount: number;
    userFirstCount: number;
    friendFirstCount: number;
    userPercentage: number;
    friendPercentage: number;
    winner: 'user' | 'friend' | 'tie';
  };
  userName: string;
  friendName: string;
  colors: { accent: string; bg: string; border: string; gradient: string };
  isPsn: boolean;
}) {
  return (
    <div className="relative p-6 bg-theme-secondary border border-violet-500/20 rounded-xl space-y-4 overflow-hidden">
      {/* HUD corners */}
      <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-violet-400/30" />
      <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-violet-400/30" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-violet-400/30" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-violet-400/30" />

      <h3 className="text-sm font-semibold text-theme-muted flex items-center gap-2 uppercase tracking-wide font-family-display">
        <Award className="w-4 h-4 text-violet-400" />
        Bragging Rights
        <span className="text-[10px] font-mono text-theme-subtle font-normal">// COMPETITION</span>
      </h3>

      {/* Dominance Bar - Cleaner Style */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-mono">
          <span className="text-cyan-400 font-medium">{userName}</span>
          <span className={`${colors.accent} font-medium`}>{friendName}</span>
        </div>
        <div className="h-2.5 rounded-full bg-theme-hover overflow-hidden flex">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-1000 ease-out"
            style={{ width: `${braggingRights.userPercentage}%` }}
          />
          <div
            className={`h-full bg-gradient-to-r ${colors.gradient} transition-all duration-1000 ease-out`}
            style={{ width: `${braggingRights.friendPercentage}%` }}
          />
        </div>
        <div className="flex justify-between text-sm font-bold">
          <span className="text-cyan-400">{braggingRights.userPercentage}%</span>
          <span className={colors.accent}>{braggingRights.friendPercentage}%</span>
        </div>
      </div>

      {/* Stats - InfoRow Style */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-4 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Star className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex-1">
            <span className="text-[10px] font-mono text-theme-subtle uppercase tracking-wider block mb-0.5">
              Rare {isPsn ? 'Trophies' : 'Achievements'}
            </span>
            <div className="flex items-baseline gap-3">
              <span className="text-xl font-bold text-cyan-400 font-family-display">{braggingRights.userRareCount}</span>
              <span className="text-xs text-theme-subtle font-mono">VS</span>
              <span className={`text-xl font-bold ${colors.accent} font-family-display`}>{braggingRights.friendRareCount}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex-1">
            <span className="text-[10px] font-mono text-theme-subtle uppercase tracking-wider block mb-0.5">
              First to Unlock
            </span>
            <div className="flex items-baseline gap-3">
              <span className="text-xl font-bold text-cyan-400 font-family-display">{braggingRights.userFirstCount}</span>
              <span className="text-xs text-theme-subtle font-mono">VS</span>
              <span className={`text-xl font-bold ${colors.accent} font-family-display`}>{braggingRights.friendFirstCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Achievement Row Component
function AchievementRow({
  achievement,
  index,
  isPsn,
  isXbox,
  userName,
  friendName,
  colors,
  isVisible,
}: {
  achievement: ComparisonAchievement;
  index: number;
  isPsn: boolean;
  isXbox: boolean;
  userName: string;
  friendName: string;
  colors: { accent: string; bg: string; border: string };
  isVisible: boolean;
}) {
  const bothUnlocked = achievement.userUnlocked && achievement.friendUnlocked;
  const neitherUnlocked = !achievement.userUnlocked && !achievement.friendUnlocked;

  // Determine who unlocked first
  let firstUnlocker: 'user' | 'friend' | null = null;
  if (bothUnlocked && achievement.userUnlockDate && achievement.friendUnlockDate) {
    const userDate = new Date(achievement.userUnlockDate).getTime();
    const friendDate = new Date(achievement.friendUnlockDate).getTime();
    if (userDate < friendDate) firstUnlocker = 'user';
    else if (friendDate < userDate) firstUnlocker = 'friend';
  }

  const trophyConfig = {
    platinum: { color: 'text-blue-300', bg: 'bg-blue-500/20', border: 'border-blue-500/40', icon: '💎' },
    gold: { color: 'text-amber-300', bg: 'bg-amber-500/20', border: 'border-amber-500/40', icon: '🥇' },
    silver: { color: 'text-slate-300', bg: 'bg-slate-400/20', border: 'border-slate-400/40', icon: '🥈' },
    bronze: { color: 'text-orange-300', bg: 'bg-orange-500/20', border: 'border-orange-500/40', icon: '🥉' },
  };

  const trophyStyle = achievement.trophyType ? trophyConfig[achievement.trophyType] : null;

  return (
    <div
      className={`relative p-4 rounded-xl bg-theme-hover/30 border transition-all duration-500 hover:bg-theme-hover/50 ${
        bothUnlocked ? 'border-emerald-500/40' :
        neitherUnlocked ? 'border-theme opacity-60 hover:opacity-80' :
        'border-theme hover:border-theme-hover'
      }`}
      style={{
        animationDelay: `${index * 50}ms`,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.5s ease ${index * 50}ms, transform 0.5s ease ${index * 50}ms`,
      }}
    >
      <div className="flex items-start gap-4">
        {/* Icon with trophy type indicator */}
        <div className={`relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 ${
          neitherUnlocked ? 'grayscale opacity-50' : ''
        } ${trophyStyle ? `border-2 ${trophyStyle.border}` : 'border border-theme'}`}>
          {achievement.iconUrl ? (
            <Image
              src={neitherUnlocked && achievement.iconGrayUrl ? achievement.iconGrayUrl : achievement.iconUrl}
              alt={achievement.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-theme-hover flex items-center justify-center">
              <Trophy className="w-6 h-6 text-theme-subtle" />
            </div>
          )}

          {/* Trophy type badge for PSN */}
          {isPsn && trophyStyle && (
            <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 ${trophyStyle.bg} ${trophyStyle.border}`}>
              <span className="text-xs">{trophyStyle.icon}</span>
            </div>
          )}

          {/* Gamerscore badge for Xbox */}
          {isXbox && achievement.gamerscore && (
            <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-green-500/20 border border-green-500/40 text-[10px] font-bold text-green-400">
              {achievement.gamerscore}G
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className={`font-bold text-sm ${neitherUnlocked ? 'text-theme-muted' : 'text-theme-primary'}`}>
                  {achievement.isHidden && neitherUnlocked ? '🔒 Hidden Trophy' : achievement.name}
                </h4>
                {/* First to unlock badge - inline with title */}
                {firstUnlocker && (
                  <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${
                    firstUnlocker === 'user'
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : `${colors.bg} ${colors.accent}`
                  }`}>
                    <Zap className="w-2.5 h-2.5" />
                    {firstUnlocker === 'user' ? '1st' : '2nd'}
                  </span>
                )}
              </div>
              <p className={`text-xs mt-0.5 line-clamp-2 ${neitherUnlocked ? 'text-theme-subtle italic' : 'text-theme-muted'}`}>
                {achievement.isHidden && neitherUnlocked ? 'Complete a secret objective to reveal this trophy.' : achievement.description}
              </p>
            </div>

            {/* Rarity badge */}
            {achievement.rarityPercentage != null && (
              <div className={`flex-shrink-0 px-2 py-1 rounded-lg text-[10px] font-bold font-mono ${
                achievement.rarityPercentage <= 5
                  ? 'bg-violet-500/20 border border-violet-500/40 text-violet-300'
                  : achievement.rarityPercentage <= 15
                    ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                    : 'bg-theme-hover border border-theme text-theme-muted'
              }`}>
                {achievement.rarityPercentage <= 5 && <Star className="w-3 h-3 inline mr-1" />}
                {achievement.rarityPercentage.toFixed(1)}%
              </div>
            )}
          </div>

          {/* User/Friend Status Pills */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {/* User Status */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
              achievement.userUnlocked
                ? 'bg-cyan-500/15 border border-cyan-500/40'
                : 'bg-theme-hover/50 border border-theme'
            }`}>
              {achievement.userUnlocked ? (
                <Unlock className="w-3.5 h-3.5 text-cyan-400" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-theme-subtle" />
              )}
              <span className={`text-xs font-medium ${achievement.userUnlocked ? 'text-cyan-400' : 'text-theme-subtle'}`}>
                {userName}
              </span>
              {achievement.userUnlocked && achievement.userUnlockDate && (
                <span className="text-[10px] text-cyan-400/60 font-mono">
                  {new Date(achievement.userUnlockDate).toLocaleDateString()}
                </span>
              )}
            </div>

            {/* Friend Status */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
              achievement.friendUnlocked
                ? `${colors.bg} ${colors.border} border`
                : 'bg-theme-hover/50 border border-theme'
            }`}>
              {achievement.friendUnlocked ? (
                <Unlock className={`w-3.5 h-3.5 ${colors.accent}`} />
              ) : (
                <Lock className="w-3.5 h-3.5 text-theme-subtle" />
              )}
              <span className={`text-xs font-medium ${achievement.friendUnlocked ? colors.accent : 'text-theme-subtle'}`}>
                {friendName}
              </span>
              {achievement.friendUnlocked && achievement.friendUnlockDate && (
                <span className={`text-[10px] font-mono opacity-60 ${colors.accent}`}>
                  {new Date(achievement.friendUnlockDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AchievementComparePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-theme-primary flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,255,255,0.02)_50%)] bg-[length:100%_4px]" />
        <div className="text-center relative z-10">
          <div className="relative">
            <Loader2 className="w-16 h-16 text-cyan-400 mx-auto mb-4 animate-spin" />
            <div className="absolute inset-0 w-16 h-16 mx-auto rounded-full bg-cyan-400/20 blur-xl animate-pulse" />
          </div>
          <p className="text-theme-muted font-mono text-sm tracking-widest uppercase">Initializing...</p>
        </div>
      </div>
    }>
      <AchievementCompareContent />
    </Suspense>
  );
}
