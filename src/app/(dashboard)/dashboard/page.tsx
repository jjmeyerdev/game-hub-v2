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
    <div className="relative min-h-screen bg-theme-primary overflow-x-hidden">
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

        {/* Development Roadmap */}
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
                <span className="text-[10px] font-mono text-theme-subtle uppercase tracking-wider">
                  // DEVELOPMENT_ROADMAP
                </span>
              </div>
              <div className="flex-1 h-px bg-linear-to-r from-border to-transparent" />
              <span className="px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-[10px] font-mono font-medium text-cyan-400/80 uppercase tracking-wider">
                Phase 3 Active
              </span>
            </div>

            {/* Roadmap card */}
            <div className="relative overflow-hidden rounded-2xl border border-theme bg-theme-secondary p-8">
              {/* HUD corners */}
              <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-amber-400/30" />
              <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-amber-400/30" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-amber-400/30" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-amber-400/30" />

              {/* Roadmap timeline */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Phase 1 - Complete */}
                <div className="group relative p-5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 transition-all hover:border-emerald-500/40">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                      <span className="text-xs font-bold text-emerald-400">1</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-emerald-400 uppercase tracking-wide">Foundation</h4>
                      <span className="text-[10px] font-mono text-emerald-400/60 uppercase">Complete</span>
                    </div>
                  </div>
                  <ul className="space-y-1.5 text-xs text-theme-muted">
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-emerald-400" />
                      Steam library sync
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-emerald-400" />
                      IGDB metadata enrichment
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-emerald-400" />
                      Manual backlog management
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-emerald-400" />
                      Per-game notes & status
                    </li>
                  </ul>
                </div>

                {/* Phase 2 - Complete */}
                <div className="group relative p-5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 transition-all hover:border-emerald-500/40">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                      <span className="text-xs font-bold text-emerald-400">2</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-emerald-400 uppercase tracking-wide">Multi-Platform</h4>
                      <span className="text-[10px] font-mono text-emerald-400/60 uppercase">Complete</span>
                    </div>
                  </div>
                  <ul className="space-y-1.5 text-xs text-theme-muted">
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-emerald-400" />
                      PlayStation Network sync
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-emerald-400" />
                      Xbox Live integration
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-emerald-400" />
                      Cross-platform comparison
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-emerald-400" />
                      Achievement tracking
                    </li>
                  </ul>
                </div>

                {/* Phase 3 - In Progress */}
                <div className="group relative p-5 rounded-xl bg-cyan-500/5 border border-cyan-500/30 transition-all hover:border-cyan-500/50 ring-1 ring-cyan-500/20">
                  <div className="absolute -top-px left-4 right-4 h-px bg-linear-to-r from-transparent via-cyan-400 to-transparent" />
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center relative">
                      <span className="text-xs font-bold text-cyan-400">3</span>
                      <div className="absolute inset-0 rounded-lg bg-cyan-400/20 animate-ping" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-cyan-400 uppercase tracking-wide">Intelligence</h4>
                      <span className="text-[10px] font-mono text-cyan-400/60 uppercase">In Progress</span>
                    </div>
                  </div>
                  <ul className="space-y-1.5 text-xs text-theme-muted">
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-cyan-400" />
                      Smart recommendations
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-cyan-400" />
                      Priority queue system
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-cyan-400" />
                      Custom tags & lists
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-cyan-400" />
                      Playtime analytics
                    </li>
                  </ul>
                </div>
              </div>

              {/* Future phases hint */}
              <div className="mt-6 pt-4 border-t border-theme">
                <div className="flex items-center justify-center gap-6 text-[10px] font-mono text-theme-subtle uppercase tracking-wider">
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-3 h-3 text-amber-400/50" />
                    Phase 4: Social & Planning
                  </span>
                  <span className="text-theme-subtle/30">•</span>
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-3 h-3 text-rose-400/50" />
                    Phase 5: Gaming Journal
                  </span>
                </div>
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
