'use client';

import { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
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
import type { UserGame } from '@/app/_actions/games';
import { getSteamProfile } from '@/app/_actions/steam';
import type { SteamProfile } from '@/lib/types/steam';

export default function DashboardPage() {
  const [showEditGameModal, setShowEditGameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSteamImportModal, setShowSteamImportModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState<UserGame | null>(null);
  const [steamProfile, setSteamProfile] = useState<SteamProfile | null>(null);

  // Load all dashboard data with custom hook
  const { user, userGames, nowPlaying, stats, loading, refreshData } = useDashboardData();

  // Session tracking (only enabled if Steam is connected)
  const { activeSession, sessionDuration, todayPlaytime, isRateLimited, clearRateLimitWarning } = useSessionTracking(!!steamProfile);

  // Load Steam profile for session tracking
  useEffect(() => {
    async function loadSteamProfile() {
      const steamData = await getSteamProfile();
      setSteamProfile(steamData);
    }
    loadSteamProfile();
  }, []);


  const handleGameAdded = async () => {
    // Reload all data after adding, editing, or deleting a game
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
    <div className="relative min-h-screen">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `
            linear-gradient(rgba(0, 217, 255, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 217, 255, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }} />

        {/* Radial gradient overlays */}
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2" />
      </div>

      {/* Header */}
      <DashboardHeader
        userName={user.name}
        greeting={user.greeting}
      />

      {/* Main Content */}
      <div className="p-6 lg:p-8 space-y-8">
        {/* Active Session Widget - Most prominent when active */}
        {activeSession && (
          <section className="animate-fade-in">
            <ActiveSessionWidget
              activeSession={activeSession}
              sessionDuration={sessionDuration}
              todayPlaytime={todayPlaytime}
            />
          </section>
        )}

        {/* Stats Grid */}
        <StatsSection stats={stats} />

        {/* Now Playing / Active Missions */}
        <NowPlayingSection
          nowPlaying={nowPlaying}
          loading={loading}
          onEditGame={handleEditGame}
          onDeleteGame={handleDeleteGame}
        />

        {/* Recent Activity - Coming Soon */}
        {userGames.length > 0 && (
          <section className="relative">
            {/* Section header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-400" />
                <h2 className="text-xs font-bold tracking-[0.25em] uppercase text-amber-400/70">
                  Mission Log
                </h2>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-amber-500/30 to-transparent" />
              <span className="text-[10px] font-mono text-gray-600 tracking-wider">
                COMING SOON
              </span>
            </div>

            {/* Coming soon card */}
            <div className="relative overflow-hidden rounded-lg border border-dashed border-amber-500/20 bg-gradient-to-br from-amber-950/10 to-transparent p-10">
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-[0.02]" style={{
                backgroundImage: `
                  linear-gradient(rgba(245, 158, 11, 0.5) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(245, 158, 11, 0.5) 1px, transparent 1px)
                `,
                backgroundSize: '30px 30px'
              }} />

              <div className="relative flex flex-col items-center justify-center text-center">
                <div className="relative mb-4">
                  <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <Activity className="w-7 h-7 text-amber-500/40" />
                  </div>
                </div>

                <h3 className="text-sm font-bold tracking-wider text-gray-400 uppercase mb-1">
                  Activity Tracking
                </h3>
                <p className="text-xs text-gray-600 max-w-md">
                  Your achievements, milestones, and gaming moments will appear here. Track your progress across all platforms.
                </p>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Edit Game Modal */}
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

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedGame(null);
        }}
        onSuccess={handleGameAdded}
        userGame={selectedGame}
      />

      {/* Steam Import Modal */}
      <SteamImportModal
        isOpen={showSteamImportModal}
        onClose={() => setShowSteamImportModal(false)}
        onSuccess={handleGameAdded}
      />

      {/* Rate Limit Toast */}
      <RateLimitToast
        isVisible={isRateLimited}
        onClose={clearRateLimitWarning}
        waitTimeMs={300000}
      />
    </div>
  );
}
