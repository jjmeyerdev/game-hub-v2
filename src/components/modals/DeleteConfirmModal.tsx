'use client';

import { useState } from 'react';
import { X, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { deleteUserGame } from '@/lib/actions/games';
import type { UserGame } from '@/lib/actions/games';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userGame: UserGame | null;
}

export function DeleteConfirmModal({ isOpen, onClose, onSuccess, userGame }: DeleteConfirmModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    if (!userGame) return;

    setLoading(true);
    setError('');

    const result = await deleteUserGame(userGame.id);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setLoading(false);
      onSuccess();
      onClose();
    }
  };

  if (!isOpen || !userGame) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-overlay backdrop-blur-md z-50 transition-opacity duration-300"
        style={{ animation: 'fadeIn 0.3s ease-out' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-theme-secondary border-2 border-red-500/30 rounded-2xl w-full max-w-md pointer-events-auto relative"
          style={{
            animation: 'modalSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            boxShadow: 'var(--theme-shadow-xl)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Animated background effects */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '3s' }} />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-orange-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }} />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(239,68,68,0.03)_1px,transparent_1px)] bg-size-[100%_4px] opacity-30" />
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            disabled={loading}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-lg bg-theme-tertiary backdrop-blur-sm border border-theme hover:border-theme-hover hover:bg-theme-hover transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5 text-theme-muted group-hover:text-theme-primary mx-auto transition-colors" />
          </button>

          {/* Content */}
          <div className="relative p-6 space-y-6">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center">
                  <AlertTriangle className="w-10 h-10 text-red-400" />
                </div>
                <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl animate-pulse" />
              </div>
            </div>

            {/* Title & Message */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-theme-primary">Delete Game?</h2>
              <p className="text-theme-muted">
                Are you sure you want to remove <span className="text-theme-primary font-semibold">"{userGame.game?.title}"</span> from your library?
              </p>
              <p className="text-sm text-theme-subtle">
                This action cannot be undone. All progress and stats will be lost.
              </p>
            </div>

            {/* Game Info Card */}
            <div className="bg-theme-tertiary border border-theme rounded-xl p-4 flex items-center gap-4">
              {userGame.game?.cover_url ? (
                <img
                  src={userGame.game.cover_url}
                  alt={userGame.game.title}
                  className="w-16 h-20 rounded-lg object-cover border border-theme"
                />
              ) : (
                <div className="w-16 h-20 rounded-lg bg-theme-secondary border border-theme flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-theme-subtle" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-theme-primary truncate">{userGame.game?.title}</h3>
                <div className="flex flex-wrap gap-2 mt-1">
                  <span className="text-xs px-2 py-0.5 bg-theme-secondary border border-theme rounded text-theme-muted">
                    {userGame.platform}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-theme-secondary border border-theme rounded text-theme-muted">
                    {userGame.status}
                  </span>
                </div>
                {userGame.playtime_hours > 0 && (
                  <p className="text-xs text-theme-subtle mt-2">
                    {userGame.playtime_hours}h played • {userGame.completion_percentage}% complete
                  </p>
                )}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-theme-tertiary border border-theme rounded-xl font-semibold text-theme-secondary hover:text-theme-primary hover:border-theme-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-linear-to-r from-red-500 to-orange-500 hover:from-red-400 hover:to-orange-400 rounded-xl font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:shadow-red-500/30 hover:scale-105"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Deleting...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Trash2 className="w-5 h-5" />
                    Delete Game
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </>
  );
}
