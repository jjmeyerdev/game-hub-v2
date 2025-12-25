'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Users, ArrowRight, AlertCircle, Zap } from 'lucide-react';
import { PlatformTabs, FriendSearchInput, ComparisonCard, CommonGamesGrid } from '@/components/compare';
import { compareProfile, getCurrentUserComparisonData } from '@/lib/actions/compare';
import type { ComparePlatform, ComparisonResult, ComparisonProfile } from '@/lib/types/compare';

export default function FriendsPage() {
  const [platform, setPlatform] = useState<ComparePlatform>('psn');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [userProfile, setUserProfile] = useState<ComparisonProfile | null>(null);

  const handlePlatformChange = useCallback(async (newPlatform: ComparePlatform) => {
    setPlatform(newPlatform);
    setComparisonResult(null);
    setError(null);

    // Pre-fetch user's data for the selected platform
    const result = await getCurrentUserComparisonData(newPlatform);
    if (result.success && result.profile) {
      setUserProfile(result.profile);
    } else {
      setUserProfile(null);
      if (result.error) {
        setError(result.error);
      }
    }
  }, []);

  const handleSearch = useCallback(async (identifier: string) => {
    setIsSearching(true);
    setError(null);

    try {
      const result = await compareProfile(platform, identifier);
      if (result.success) {
        setComparisonResult(result);
        if (result.user) {
          setUserProfile(result.user);
        }
      } else {
        setError(result.error || 'Comparison failed');
        setComparisonResult(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setComparisonResult(null);
    } finally {
      setIsSearching(false);
    }
  }, [platform]);

  const handleClear = useCallback(() => {
    setComparisonResult(null);
    setError(null);
  }, []);

  return (
    <div className="min-h-screen bg-theme-primary relative">
      {/* Ambient glows */}
      <div className="fixed top-0 left-1/3 w-[500px] h-[500px] bg-violet-500/3 rounded-full blur-[120px] pointer-events-none animate-breathe" />
      <div className="fixed bottom-0 right-1/4 w-[400px] h-[400px] bg-cyan-500/2 rounded-full blur-[100px] pointer-events-none animate-breathe" style={{ animationDelay: '2s' }} />

      <div className="relative max-w-6xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="mb-10">
          <div className="relative bg-theme-secondary border border-theme rounded-2xl p-8 overflow-hidden">
            {/* Top accent line */}
            <div className="absolute top-0 left-8 right-8 h-px bg-linear-to-r from-transparent via-cyan-500/30 to-transparent" />

            <div className="relative">
              {/* Status badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full mb-6">
                <Zap className="w-3 h-3 text-cyan-400" />
                <span className="text-[11px] font-medium text-cyan-400 uppercase tracking-wider">Quick Compare</span>
              </div>

              <div className="flex items-start justify-between">
                <div className="max-w-2xl">
                  <span className="text-[10px] font-mono text-theme-subtle uppercase tracking-wider mb-2 block">// COMPARE_STATS</span>
                  <h1 className="text-4xl font-bold text-white mb-4 tracking-tight font-family-display">
                    COMPARE
                  </h1>
                  <p className="text-lg text-theme-muted leading-relaxed">
                    See how you stack up against friends. Compare games, achievements, and playtime across platforms.
                  </p>
                </div>

                {/* Icon */}
                <div className="hidden md:block">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-cyan-500/10 to-violet-500/5 border border-theme flex items-center justify-center">
                      <Users className="w-10 h-10 text-cyan-400" />
                    </div>
                    {/* HUD corners */}
                    <div className="absolute -top-1 -left-1 w-3 h-3 border-l-2 border-t-2 border-cyan-400/50" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 border-r-2 border-t-2 border-cyan-400/50" />
                    <div className="absolute -bottom-1 -left-1 w-3 h-3 border-l-2 border-b-2 border-cyan-400/50" />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 border-r-2 border-b-2 border-cyan-400/50" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Selection */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-[10px] font-mono text-theme-subtle uppercase tracking-wider">// SELECT_PLATFORM</span>
            <div className="flex-1 h-px bg-white/6" />
          </div>
          <PlatformTabs
            selected={platform}
            onSelect={handlePlatformChange}
          />
        </div>

        {/* Search Input */}
        <div className="mb-8">
          <FriendSearchInput
            platform={platform}
            onSearch={handleSearch}
            isSearching={isSearching}
            onClear={handleClear}
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-400">Comparison Failed</p>
              <p className="text-sm text-red-400/80 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Comparison Results */}
        <div className="space-y-8">
          {/* Stats Comparison Card */}
          <ComparisonCard
            user={userProfile || comparisonResult?.user}
            friend={comparisonResult?.friend}
            platform={platform}
            isLoading={isSearching}
          />

          {/* Common Games */}
          {comparisonResult?.commonGames && comparisonResult.commonGames.length > 0 && (
            <CommonGamesGrid
              commonGames={comparisonResult.commonGames}
              platform={platform}
              userName={comparisonResult.user?.username}
              friendName={comparisonResult.friend?.username}
            />
          )}
        </div>

        {/* Social Features Coming Soon */}
        <div className="mt-16 pt-12 border-t border-theme">
          <div className="flex items-center gap-4 mb-8">
            <Users className="w-4 h-4 text-violet-400" />
            <span className="text-[10px] font-mono text-theme-subtle uppercase tracking-wider">// SOCIAL_FEATURES</span>
            <div className="inline-flex items-center gap-2 px-2 py-1 bg-violet-500/10 border border-violet-500/20 rounded-full">
              <span className="text-[10px] font-medium text-violet-400 uppercase tracking-wider">Phase 4</span>
            </div>
            <div className="flex-1 h-px bg-white/6" />
          </div>

          <div className="relative bg-theme-secondary border border-theme rounded-xl p-8 text-center overflow-hidden">
            {/* HUD corners */}
            <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-violet-400/30" />
            <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-violet-400/30" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-violet-400/30" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-violet-400/30" />

            <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-violet-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 font-family-display">
              FULL SOCIAL FEATURES COMING SOON
            </h3>
            <p className="text-sm text-theme-muted mb-6 max-w-md mx-auto">
              Friend lists, activity feeds, leaderboards, and more social features are in development for Phase 4.
            </p>
            <Link href="/dashboard">
              <button className="group relative inline-flex items-center gap-2 px-5 py-2.5 overflow-hidden rounded-xl">
                <div className="absolute inset-0 bg-linear-to-r from-violet-500 to-cyan-600 opacity-90 group-hover:opacity-100 transition-opacity" />
                <span className="relative font-semibold text-white text-sm uppercase tracking-wide font-family-display">Return to Dashboard</span>
                <ArrowRight className="relative w-4 h-4 text-white group-hover:translate-x-0.5 transition-transform" />
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
