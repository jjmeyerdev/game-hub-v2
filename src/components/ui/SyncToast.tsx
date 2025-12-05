'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Gamepad2, Trophy, X, Sparkles } from 'lucide-react';

interface SyncToastProps {
  isVisible: boolean;
  onClose: () => void;
  type: 'steam' | 'psn';
  result: {
    success: boolean;
    gamesAdded: number;
    gamesUpdated: number;
    achievementsUpdated?: number;
    trophiesUpdated?: number;
    totalGames: number;
    errors: string[];
  } | null;
}

export function SyncToast({ isVisible, onClose, type, result }: SyncToastProps) {
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  useEffect(() => {
    if (isVisible && result) {
      // Auto-dismiss after 8 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, result]);

  const handleClose = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setIsAnimatingOut(false);
      onClose();
    }, 300);
  };

  if (!isVisible || !result) return null;

  const isPsn = type === 'psn';
  const accentColor = isPsn ? 'blue-600' : 'blue-500';
  const platformName = isPsn ? 'PlayStation' : 'Steam';
  const achievementLabel = isPsn ? 'Trophies' : 'Achievements';
  const achievementCount = isPsn ? result.trophiesUpdated : result.achievementsUpdated;

  return (
    <>
      {/* Backdrop blur overlay */}
      <div
        className={`fixed inset-0 z-[90] bg-void/40 backdrop-blur-sm transition-opacity duration-300 ${
          isAnimatingOut ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={handleClose}
      />

      {/* Toast Container */}
      <div
        className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] w-full max-w-md transition-all duration-300 ${
          isAnimatingOut
            ? 'opacity-0 scale-95 translate-y-4'
            : 'opacity-100 scale-100 translate-y-0'
        }`}
        style={{
          animation: isAnimatingOut ? 'none' : 'toastSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <div className="relative overflow-hidden rounded-2xl border-2 border-cyan-500/30 bg-abyss/95 backdrop-blur-xl shadow-2xl shadow-cyan-500/20">
          {/* Animated top accent line */}
          <div className="absolute top-0 left-0 right-0 h-1">
            <div
              className={`h-full bg-gradient-to-r ${
                result.success
                  ? 'from-emerald-500 via-cyan-400 to-emerald-500'
                  : 'from-red-500 via-orange-400 to-red-500'
              }`}
              style={{
                animation: 'shimmerLine 2s linear infinite',
                backgroundSize: '200% 100%',
              }}
            />
          </div>

          {/* Glow effects */}
          <div className="absolute -top-20 -left-20 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl" />

          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg bg-deep/50 border border-steel/30 text-gray-400 hover:text-white hover:border-cyan-500/50 transition-all z-10"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="relative p-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${
                result.success
                  ? 'from-emerald-500/20 to-cyan-500/20 border-emerald-500/40'
                  : 'from-red-500/20 to-orange-500/20 border-red-500/40'
              } border-2 flex items-center justify-center`}>
                {result.success ? (
                  <>
                    <CheckCircle className="w-8 h-8 text-emerald-400" />
                    <Sparkles
                      className="absolute -top-1 -right-1 w-5 h-5 text-yellow-400"
                      style={{ animation: 'sparkle 1.5s ease-in-out infinite' }}
                    />
                  </>
                ) : (
                  <XCircle className="w-8 h-8 text-red-400" />
                )}
                <div className={`absolute inset-0 rounded-2xl ${
                  result.success ? 'bg-emerald-400/20' : 'bg-red-400/20'
                } blur-xl -z-10`} />
              </div>

              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-1">
                  {result.success ? 'Sync Complete!' : 'Sync Failed'}
                </h3>
                <p className="text-sm text-gray-400 flex items-center gap-2">
                  {isPsn ? (
                    <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8.985 2.596v17.548l3.915 1.261V6.688c0-.69.304-1.151.794-.991.636.181.76.814.76 1.505v5.876c2.441 1.193 4.362-.002 4.362-3.153 0-3.237-1.126-4.675-4.438-5.827-1.307-.448-3.728-1.186-5.391-1.502h-.002z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  )}
                  {platformName} Library
                </p>
              </div>
            </div>

            {/* Stats Grid */}
            {result.success && (
              <div className="grid grid-cols-4 gap-3 mb-4">
                <div
                  className="relative overflow-hidden p-3 bg-deep/50 border border-steel/20 rounded-xl text-center group hover:border-cyan-500/30 transition-all"
                  style={{ animation: 'statPop 0.4s ease-out 0.1s backwards' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Gamepad2 className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                  <div className="text-2xl font-black text-white tabular-nums">{result.totalGames}</div>
                  <div className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">Total</div>
                </div>

                <div
                  className="relative overflow-hidden p-3 bg-deep/50 border border-steel/20 rounded-xl text-center group hover:border-emerald-500/30 transition-all"
                  style={{ animation: 'statPop 0.4s ease-out 0.2s backwards' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-4 h-4 mx-auto mb-1 text-emerald-400 font-bold text-sm">+</div>
                  <div className="text-2xl font-black text-emerald-400 tabular-nums">{result.gamesAdded}</div>
                  <div className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">Added</div>
                </div>

                <div
                  className="relative overflow-hidden p-3 bg-deep/50 border border-steel/20 rounded-xl text-center group hover:border-purple-500/30 transition-all"
                  style={{ animation: 'statPop 0.4s ease-out 0.3s backwards' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-4 h-4 mx-auto mb-1 text-purple-400 font-bold text-sm">↻</div>
                  <div className="text-2xl font-black text-purple-400 tabular-nums">{result.gamesUpdated}</div>
                  <div className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">Updated</div>
                </div>

                <div
                  className="relative overflow-hidden p-3 bg-deep/50 border border-steel/20 rounded-xl text-center group hover:border-yellow-500/30 transition-all"
                  style={{ animation: 'statPop 0.4s ease-out 0.4s backwards' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Trophy className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
                  <div className="text-2xl font-black text-yellow-400 tabular-nums">{achievementCount || 0}</div>
                  <div className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">{achievementLabel}</div>
                </div>
              </div>
            )}

            {/* Errors */}
            {result.errors.length > 0 && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl mb-4">
                <p className="text-xs font-semibold text-red-400 mb-1">
                  {result.errors.length} {result.errors.length === 1 ? 'error' : 'errors'} occurred:
                </p>
                <ul className="text-[11px] text-red-300/70 space-y-0.5 max-h-20 overflow-y-auto">
                  {result.errors.slice(0, 3).map((err, i) => (
                    <li key={i} className="truncate">• {err}</li>
                  ))}
                  {result.errors.length > 3 && (
                    <li className="text-red-400">• +{result.errors.length - 3} more errors</li>
                  )}
                </ul>
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={handleClose}
              className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 hover:from-cyan-500/30 hover:to-purple-500/30 border border-cyan-500/30 hover:border-cyan-500/50 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 group"
            >
              <span>Continue</span>
              <span className="text-cyan-400 group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>

          {/* Bottom decorative bar */}
          <div className="h-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
        </div>
      </div>

      <style jsx global>{`
        @keyframes toastSlideIn {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.9) translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1) translateY(0);
          }
        }

        @keyframes shimmerLine {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        @keyframes statPop {
          0% {
            opacity: 0;
            transform: scale(0.8) translateY(10px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes sparkle {
          0%, 100% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.2) rotate(15deg);
          }
        }
      `}</style>
    </>
  );
}
