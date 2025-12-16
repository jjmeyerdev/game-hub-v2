'use client';

import { useState } from 'react';
import { Loader2, CheckCircle, XCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { BaseModal } from '@/components/modals';
import { syncSteamLibrary } from '@/app/(dashboard)/_actions/steam';
import type { SteamSyncResult } from '@/lib/types/steam';

interface SteamImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SteamImportModal({ isOpen, onClose, onSuccess }: SteamImportModalProps) {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<SteamSyncResult | null>(null);
  const [error, setError] = useState('');

  async function handleImport() {
    setImporting(true);
    setError('');
    setResult(null);

    try {
      const syncResult = await syncSteamLibrary();
      setResult(syncResult);

      if (syncResult.success) {
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import Steam library');
    } finally {
      setImporting(false);
    }
  }

  function handleClose() {
    if (!importing) {
      setResult(null);
      setError('');
      onClose();
    }
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import Steam Library"
      icon={
        <svg className="w-6 h-6 text-void" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2a10 10 0 0 1 10 10 10 10 0 0 1-10 10A10 10 0 0 1 2 12 10 10 0 0 1 12 2m0 2a8 8 0 0 0-8 8 8 8 0 0 0 8 8 8 8 0 0 0 8-8 8 8 0 0 0-8-8m5.5 5l-4.5 6.5-3-3L7 14l4 4 6-8.5-1.5-1.5z" />
        </svg>
      }
      maxWidth="2xl"
    >
      <div className="p-6 space-y-6">
        {!result && !error && !importing && (
          /* Initial State */
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-void" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Import Your Steam Games</h3>
                <p className="text-gray-400">
                  This will fetch your Steam library and add all games to Game Hub.
                </p>
              </div>
            </div>

            <div className="p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-xl space-y-2">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-400 space-y-2">
                  <p>
                    <strong>Before importing:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Ensure your Steam profile is set to <strong>Public</strong></li>
                    <li>Game details must be visible to <strong>Public</strong></li>
                    <li>Large libraries may take a few minutes</li>
                    <li>Existing games will be updated, not duplicated</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 px-6 py-3 bg-deep border border-steel rounded-xl font-semibold text-gray-300 hover:text-white hover:border-cyan-500/50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 rounded-xl font-bold text-void transition-all"
              >
                Start Import
              </button>
            </div>
          </div>
        )}

        {importing && (
          /* Importing State */
          <div className="text-center space-y-6 py-8">
            <div className="relative inline-block">
              <Loader2 className="w-20 h-20 text-cyan-400 animate-spin" />
              <div className="absolute inset-0 bg-cyan-400/30 rounded-full blur-xl animate-pulse" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Importing Steam Library...</h3>
              <p className="text-gray-400">
                Fetching your games from Steam. This may take a moment.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        {error && (
          /* Error State */
          <div className="text-center space-y-6 py-8">
            <div className="relative inline-block">
              <XCircle className="w-20 h-20 text-red-400" />
              <div className="absolute inset-0 bg-red-400/30 rounded-full blur-xl" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Import Failed</h3>
              <p className="text-red-400">{error}</p>
            </div>
            <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-left">
              <p className="text-sm text-red-400 mb-2">
                <strong>Common issues:</strong>
              </p>
              <ul className="text-sm text-gray-400 space-y-1 list-disc list-inside">
                <li>Steam profile is set to private</li>
                <li>Game details are not public</li>
                <li>Invalid Steam ID</li>
                <li>Network connection issues</li>
              </ul>
            </div>
            <button
              onClick={handleClose}
              className="px-6 py-3 bg-deep border border-steel rounded-xl font-semibold text-gray-300 hover:text-white hover:border-cyan-500/50 transition-all"
            >
              Close
            </button>
          </div>
        )}

        {result && (
          /* Success State */
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="relative inline-block">
                <CheckCircle className="w-20 h-20 text-emerald-400" />
                <div className="absolute inset-0 bg-emerald-400/30 rounded-full blur-xl animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Import Complete!</h3>
                <p className="text-gray-400">
                  Your Steam library has been successfully imported.
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-deep border border-steel rounded-xl text-center">
                <div className="text-2xl font-bold text-cyan-400">{result.totalGames}</div>
                <div className="text-xs text-gray-400 uppercase mt-1">Total Games</div>
              </div>
              <div className="p-4 bg-deep border border-steel rounded-xl text-center">
                <div className="text-2xl font-bold text-emerald-400">{result.gamesAdded}</div>
                <div className="text-xs text-gray-400 uppercase mt-1">Added</div>
              </div>
              <div className="p-4 bg-deep border border-steel rounded-xl text-center">
                <div className="text-2xl font-bold text-purple-400">{result.gamesUpdated}</div>
                <div className="text-xs text-gray-400 uppercase mt-1">Updated</div>
              </div>
              <div className="p-4 bg-deep border border-steel rounded-xl text-center">
                <div className="text-2xl font-bold text-yellow-400">{result.achievementsUpdated}</div>
                <div className="text-xs text-gray-400 uppercase mt-1">Achievements</div>
              </div>
            </div>

            {/* Errors */}
            {result.errors.length > 0 && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-xl">
                <div className="flex items-start gap-3 mb-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold text-yellow-400">
                    Some games could not be imported ({result.errors.length} errors)
                  </p>
                </div>
                <ul className="text-xs text-gray-400 space-y-1 max-h-32 overflow-y-auto ml-8">
                  {result.errors.slice(0, 10).map((err, i) => (
                    <li key={i}>• {err}</li>
                  ))}
                  {result.errors.length > 10 && (
                    <li>• ... and {result.errors.length - 10} more</li>
                  )}
                </ul>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 px-6 py-3 bg-deep border border-steel rounded-xl font-semibold text-gray-300 hover:text-white hover:border-cyan-500/50 transition-all"
              >
                Close
              </button>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 rounded-xl font-bold text-void transition-all flex items-center justify-center gap-2"
              >
                View Library
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </BaseModal>
  );
}

