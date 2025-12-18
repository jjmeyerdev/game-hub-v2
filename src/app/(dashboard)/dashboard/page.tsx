'use client';

import { useState, useEffect } from 'react';
import { Activity, Sparkles } from 'lucide-react';
import { useDashboardData } from '@/lib/hooks';
import { useSessionTracking } from '@/lib/hooks/useSessionTracking';
import {
  DashboardHeader,
  StatsSection,
  NowPlayingSection,
} from '@/components/dashboard';
import { ActiveSessionWidget } from '@/components/dashboard/ActiveSessionWidget';
import {
  GameFormModal,
  DeleteConfirmModal,
  SteamImportModal,
} from '@/components/modals';
import { RateLimitToast } from '@/components/ui/RateLimitToast';
import type { UserGame } from '@/lib/actions/games';
import { getSteamProfile } from '@/lib/actions/steam';
import type { SteamProfile } from '@/lib/types/steam';

export default function DashboardPage() {
  const [showEditGameModal, setShowEditGameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSteamImportModal, setShowSteamImportModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState<UserGame | null>(null);
  const [steamProfile, setSteamProfile] = useState<SteamProfile | null>(null);
  const [mounted, setMounted] = useState(false);

  const { user, userGames, nowPlaying, stats, loading, refreshData } = useDashboardData();
  const { activeSession, sessionDuration, todayPlaytime, isRateLimited, clearRateLimitWarning } = useSessionTracking(!!steamProfile);

  useEffect(() => {
    setMounted(true);
    async function loadSteamProfile() {
      const steamData = await getSteamProfile();
      setSteamProfile(steamData);
    }
    loadSteamProfile();
  }, []);

  const handleGameAdded = async () => {
    await refreshData();
  };

  const handleEditGame = (game: UserGame) => {
    setSelectedGame(game);
    setShowEditGameModal(true);
  };

  const handleDeleteGame = (game: UserGame) => {
    setSelectedGame(game);
    setShowDeleteModal(true);
  };

  return (
    <div className="relative min-h-screen bg-void">
      {/* Ambient glow orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div
          className="absolute -top-40 left-1/4 w-[600px] h-[600px] rounded-full blur-[120px] animate-breathe"
          style={{ background: 'radial-gradient(circle, rgba(34, 211, 238, 0.04) 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-1/2 -right-40 w-[500px] h-[500px] rounded-full blur-[120px] animate-breathe"
          style={{
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.04) 0%, transparent 70%)',
            animationDelay: '2s'
          }}
        />
        <div
          className="absolute -bottom-40 left-1/3 w-[400px] h-[400px] rounded-full blur-[100px] animate-breathe"
          style={{
            background: 'radial-gradient(circle, rgba(52, 211, 153, 0.03) 0%, transparent 70%)',
            animationDelay: '4s'
          }}
        />
      </div>

      {/* Header */}
      <DashboardHeader
        userName={user.name}
        greeting={user.greeting}
      />

      {/* Main Content */}
      <div
        className={`p-6 lg:p-8 space-y-8 transition-all duration-700 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        {/* Active Session Widget */}
        {activeSession && (
          <section
            className="animate-fade-in-up"
            style={{ animationDelay: '0.1s' }}
          >
            <ActiveSessionWidget
              activeSession={activeSession}
              sessionDuration={sessionDuration}
              todayPlaytime={todayPlaytime}
            />
          </section>
        )}

        {/* Stats Grid */}
        <section style={{ animationDelay: '0.2s' }} className="animate-fade-in-up">
          <StatsSection stats={stats} />
        </section>

        {/* Now Playing */}
        <section style={{ animationDelay: '0.3s' }} className="animate-fade-in-up">
          <NowPlayingSection
            nowPlaying={nowPlaying}
            loading={loading}
            onEditGame={handleEditGame}
            onDeleteGame={handleDeleteGame}
          />
        </section>

        {/* Recent Activity - Coming Soon */}
        {userGames.length > 0 && (
          <section
            className="relative animate-fade-in-up"
            style={{ animationDelay: '0.4s' }}
          >
            {/* Section header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <Activity className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider">
                  // RECENT_ACTIVITY
                </span>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-white/[0.06] to-transparent" />
              <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[10px] font-mono font-medium text-amber-400/80 uppercase tracking-wider">
                Coming Soon
              </span>
            </div>

            {/* Coming soon card */}
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-abyss p-12 group hover:border-white/[0.12] transition-all duration-300">
              {/* HUD corners */}
              <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-amber-400/30" />
              <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-amber-400/30" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-amber-400/30" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-amber-400/30" />

              {/* Subtle gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.02] via-transparent to-violet-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider mb-4">// TIMELINE_PREVIEW</span>
                <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-300">
                  <Sparkles className="w-7 h-7 text-amber-400" />
                  {/* Mini HUD corners */}
                  <div className="absolute -top-1 -left-1 w-2 h-2 border-l border-t border-amber-400/50" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 border-r border-t border-amber-400/50" />
                  <div className="absolute -bottom-1 -left-1 w-2 h-2 border-l border-b border-amber-400/50" />
                  <div className="absolute -bottom-1 -right-1 w-2 h-2 border-r border-b border-amber-400/50" />
                </div>

                <h3 className="text-base font-bold text-white/60 mb-2 font-[family-name:var(--font-family-display)] uppercase">
                  Activity Tracking
                </h3>
                <p className="text-sm text-white/30 max-w-md leading-relaxed">
                  Your achievements, milestones, and gaming moments will appear here.
                  Track your progress and celebrate your victories.
                </p>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Modals */}
      <GameFormModal
        isOpen={showEditGameModal}
        onClose={() => {
          setShowEditGameModal(false);
          setSelectedGame(null);
        }}
        onSuccess={handleGameAdded}
        mode="edit"
        userGame={selectedGame}
      />

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedGame(null);
        }}
        onSuccess={handleGameAdded}
        userGame={selectedGame}
      />

      <SteamImportModal
        isOpen={showSteamImportModal}
        onClose={() => setShowSteamImportModal(false)}
        onSuccess={handleGameAdded}
      />

      <RateLimitToast
        isVisible={isRateLimited}
        onClose={clearRateLimitWarning}
        waitTimeMs={300000}
      />
    </div>
  );
}
