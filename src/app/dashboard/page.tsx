'use client';

import { useState } from 'react';
import { Activity } from 'lucide-react';
import { useDashboardData } from '@/lib/hooks';
import { DashboardLayout } from '@/components/layouts';
import {
  DashboardHeader,
  StatsSection,
  NowPlayingSection,
  GameLibrary,
} from '@/components/dashboard';
import {
  AddGameModal,
  EditGameModal,
  DeleteConfirmModal,
} from '@/components/modals';
import type { UserGame } from '@/app/actions/games';

export default function DashboardPage() {
  const [showAddGameModal, setShowAddGameModal] = useState(false);
  const [showEditGameModal, setShowEditGameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState<UserGame | null>(null);

  // Load all dashboard data with custom hook
  const { user, userGames, nowPlaying, stats, loading, refreshData } = useDashboardData();

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
        onAddGame={() => setShowAddGameModal(true)}
      />

      {/* Content */}
      <div className="p-8 space-y-8">
        {/* Stats Grid */}
        <StatsSection stats={stats} />

        {/* Now Playing */}
        <NowPlayingSection
          nowPlaying={nowPlaying}
          loading={loading}
          onAddGame={() => setShowAddGameModal(true)}
          onEditGame={handleEditGame}
          onDeleteGame={handleDeleteGame}
        />

        {/* Game Library */}
        <GameLibrary
          userGames={userGames}
          loading={loading}
          onAddGame={() => setShowAddGameModal(true)}
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

      {/* Add Game Modal */}
      <AddGameModal
        isOpen={showAddGameModal}
        onClose={() => setShowAddGameModal(false)}
        onSuccess={handleGameAdded}
      />

      {/* Edit Game Modal */}
      <EditGameModal
        isOpen={showEditGameModal}
        onClose={() => {
          setShowEditGameModal(false);
          setSelectedGame(null);
        }}
        onSuccess={handleGameAdded}
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
    </DashboardLayout>
  );
}
