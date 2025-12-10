'use client';

import { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import { useDashboardData } from '@/lib/hooks';
import { useSessionTracking } from '@/lib/hooks/useSessionTracking';
import { DashboardLayout } from '@/components/layouts';
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
import type { UserGame } from '@/app/actions/games';
import { getSteamProfile } from '@/app/actions/steam';
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

  // Refresh dashboard data when active session changes (updates Now Playing)
  useEffect(() => {
    refreshData();
  }, [activeSession, refreshData]);

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
    <DashboardLayout>
      {/* Header */}
      <DashboardHeader
        userName={user.name}
        greeting={user.greeting}
      />

      {/* Active Session Widget */}
      {activeSession && (
        <div className="px-8 pt-4">
          <ActiveSessionWidget
            activeSession={activeSession}
            sessionDuration={sessionDuration}
            todayPlaytime={todayPlaytime}
          />
        </div>
      )}

        {/* Content */}
        <div className="p-8 space-y-8">
          {/* Stats Grid */}
        <StatsSection stats={stats} />

          {/* Now Playing */}
        <NowPlayingSection
          nowPlaying={nowPlaying}
          loading={loading}
          onEditGame={handleEditGame}
          onDeleteGame={handleDeleteGame}
        />

          {/* Recent Activity - Coming Soon */}
          {userGames.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-cyan-400" />
                    <span>Recent Activity</span>
                  </h2>
                  <p className="text-sm text-gray-500">Your latest gaming moments</p>
                </div>
              </div>
              <div className="bg-deep border border-steel rounded-xl p-12 text-center">
                <Activity className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500">Activity tracking coming soon</p>
                <p className="text-sm text-gray-600 mt-1">Your achievements and milestones will appear here</p>
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
    </DashboardLayout>
  );
}
