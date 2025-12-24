'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Gamepad2, Trophy, X, Sparkles } from 'lucide-react';

interface SyncToastProps {
  isVisible: boolean;
  onClose: () => void;
  type: 'steam' | 'psn' | 'xbox' | 'epic';
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

const PLATFORM_NAMES: Record<string, string> = {
  steam: 'Steam',
  psn: 'PlayStation',
  xbox: 'Xbox',
  epic: 'Epic Games',
};

export function SyncToast({ isVisible, onClose, type, result }: SyncToastProps) {
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  useEffect(() => {
    if (isVisible && result) {
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
  const isXbox = type === 'xbox';
  const isEpic = type === 'epic';
  const platformName = PLATFORM_NAMES[type];
  const achievementLabel = isPsn ? 'Trophies' : 'Achievements';
  const achievementCount = isPsn ? result.trophiesUpdated : result.achievementsUpdated;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[90] bg-[var(--theme-bg-primary)]/60 backdrop-blur-sm transition-opacity duration-300 ${
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
          animation: isAnimatingOut ? 'none' : 'modalSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div
          className={`relative overflow-hidden rounded-2xl bg-[var(--theme-bg-secondary)] ${
            result.success ? 'border border-emerald-500/20' : 'border border-red-500/20'
          }`}
          style={{
            boxShadow: `
              0 0 0 1px var(--theme-border),
              0 4px 60px ${result.success ? 'rgba(52, 211, 153, 0.15)' : 'rgba(239, 68, 68, 0.15)'},
              0 25px 50px -12px rgba(0, 0, 0, 0.6)
            `,
          }}
        >
          {/* Animated top accent line */}
          <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
            <div
              className={`h-full w-full ${
                result.success
                  ? 'bg-gradient-to-r from-emerald-500 via-cyan-400 to-emerald-500'
                  : 'bg-gradient-to-r from-red-500 via-amber-400 to-red-500'
              }`}
              style={{
                animation: 'shimmer 2s linear infinite',
                backgroundSize: '200% 100%',
              }}
            />
          </div>

          {/* Ambient glow effects */}
          <div
            className="absolute -top-20 -left-20 w-40 h-40 rounded-full blur-3xl pointer-events-none"
            style={{
              background: result.success ? 'rgba(34, 211, 238, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            }}
          />
          <div
            className="absolute -bottom-20 -right-20 w-40 h-40 rounded-full blur-3xl pointer-events-none"
            style={{
              background: 'rgba(168, 85, 247, 0.1)',
            }}
          />

          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-lg bg-[var(--theme-hover-bg)] border border-[var(--theme-border)] text-[var(--theme-text-subtle)] hover:text-[var(--theme-text-primary)] hover:border-[var(--theme-border-hover)] transition-all z-10"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="relative p-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div
                className="relative w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{
                  background: result.success
                    ? 'linear-gradient(135deg, rgba(52, 211, 153, 0.1) 0%, rgba(34, 211, 238, 0.1) 100%)'
                    : 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(251, 191, 36, 0.1) 100%)',
                  border: `1px solid ${result.success ? 'rgba(52, 211, 153, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                }}
              >
                {result.success ? (
                  <>
                    <CheckCircle className="w-8 h-8 text-emerald-400" />
                    <Sparkles
                      className="absolute -top-1 -right-1 w-5 h-5 text-amber-400"
                      style={{ animation: 'sparkle 1.5s ease-in-out infinite' }}
                    />
                  </>
                ) : (
                  <XCircle className="w-8 h-8 text-red-400" />
                )}
                <div
                  className="absolute inset-0 rounded-2xl blur-xl -z-10"
                  style={{
                    background: result.success ? 'rgba(52, 211, 153, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  }}
                />
              </div>

              <div className="flex-1">
                <h3
                  className="text-xl font-bold text-[var(--theme-text-primary)] mb-1"
                  style={{ fontFamily: 'var(--font-family-display)' }}
                >
                  {result.success ? `${platformName} Sync Complete!` : `${platformName} Sync Failed`}
                </h3>
                <p className="text-sm text-[var(--theme-text-muted)] flex items-center gap-2">
                  {isPsn ? (
                    <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8.985 2.596v17.548l3.915 1.261V6.688c0-.69.304-1.151.794-.991.636.181.76.814.76 1.505v5.876c2.441 1.193 4.362-.002 4.362-3.153 0-3.237-1.126-4.675-4.438-5.827-1.307-.448-3.728-1.186-5.391-1.502h-.002z" />
                    </svg>
                  ) : isXbox ? (
                    <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M4.102 21.033C6.211 22.881 8.977 24 12 24c3.026 0 5.789-1.119 7.902-2.967 1.877-1.912-4.316-8.709-7.902-11.417-3.582 2.708-9.779 9.505-7.898 11.417zm11.16-14.406c2.5 2.961 7.484 10.313 6.076 12.912C23.056 17.036 24 14.62 24 12c0-5.238-3.354-9.691-8.024-11.33.039.071.076.142.108.219.492 1.161.825 2.426.978 3.738zm-6.532 0c.154-1.312.487-2.577.978-3.738.033-.077.07-.148.108-.219C5.354 2.309 2 6.762 2 12c0 2.62.944 5.036 2.662 6.539-1.408-2.599 3.576-9.951 6.068-12.912z"/>
                    </svg>
                  ) : isEpic ? (
                    <span className="w-4 h-4 text-white/60 font-black text-xs flex items-center justify-center">E</span>
                  ) : (
                    <svg className="w-4 h-4 text-[#66c0f4]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012H7.54zm11.415-9.303a3.01 3.01 0 0 0-3.015-3.015 3.01 3.01 0 0 0-3.015 3.015 3.01 3.01 0 0 0 3.015 3.015 3.01 3.01 0 0 0 3.015-3.015zm-5.273-.005c0-1.264 1.027-2.286 2.291-2.286s2.286 1.022 2.286 2.286c0 1.263-1.022 2.286-2.286 2.286s-2.291-1.023-2.291-2.286z"/>
                    </svg>
                  )}
                  {platformName} Library
                </p>
              </div>
            </div>

            {/* Stats Grid */}
            {result.success && (
              <div className={`grid ${isEpic ? 'grid-cols-3' : 'grid-cols-4'} gap-3 mb-5`}>
                <div
                  className="relative overflow-hidden p-3 rounded-xl text-center group transition-all bg-[var(--theme-hover-bg)] border border-[var(--theme-border)]"
                  style={{
                    animation: 'cardReveal 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.1s backwards',
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Gamepad2 className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                  <div
                    className="text-2xl font-black text-[var(--theme-text-primary)] tabular-nums"
                    style={{ fontFamily: 'var(--font-family-display)' }}
                  >
                    {result.totalGames}
                  </div>
                  <div className="text-[9px] uppercase tracking-wider text-[var(--theme-text-subtle)] font-semibold">Total</div>
                </div>

                <div
                  className="relative overflow-hidden p-3 rounded-xl text-center group transition-all bg-[var(--theme-hover-bg)] border border-[var(--theme-border)]"
                  style={{
                    animation: 'cardReveal 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.2s backwards',
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-4 h-4 mx-auto mb-1 text-emerald-400 font-bold text-sm">+</div>
                  <div
                    className="text-2xl font-black text-emerald-400 tabular-nums"
                    style={{ fontFamily: 'var(--font-family-display)' }}
                  >
                    {result.gamesAdded}
                  </div>
                  <div className="text-[9px] uppercase tracking-wider text-[var(--theme-text-subtle)] font-semibold">Added</div>
                </div>

                <div
                  className="relative overflow-hidden p-3 rounded-xl text-center group transition-all bg-[var(--theme-hover-bg)] border border-[var(--theme-border)]"
                  style={{
                    animation: 'cardReveal 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.3s backwards',
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-4 h-4 mx-auto mb-1 text-violet-400 font-bold text-sm">↻</div>
                  <div
                    className="text-2xl font-black text-violet-400 tabular-nums"
                    style={{ fontFamily: 'var(--font-family-display)' }}
                  >
                    {result.gamesUpdated}
                  </div>
                  <div className="text-[9px] uppercase tracking-wider text-[var(--theme-text-subtle)] font-semibold">Updated</div>
                </div>

                {!isEpic && (
                  <div
                    className="relative overflow-hidden p-3 rounded-xl text-center group transition-all bg-[var(--theme-hover-bg)] border border-[var(--theme-border)]"
                    style={{
                      animation: 'cardReveal 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.4s backwards',
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Trophy className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                    <div
                      className="text-2xl font-black text-amber-400 tabular-nums"
                      style={{ fontFamily: 'var(--font-family-display)' }}
                    >
                      {achievementCount || 0}
                    </div>
                    <div className="text-[9px] uppercase tracking-wider text-[var(--theme-text-subtle)] font-semibold">{achievementLabel}</div>
                  </div>
                )}
              </div>
            )}

            {/* Errors */}
            {result.errors.length > 0 && (
              <div
                className="p-4 rounded-xl mb-5"
                style={{
                  background: 'rgba(239, 68, 68, 0.05)',
                  border: '1px solid rgba(239, 68, 68, 0.15)',
                }}
              >
                <p className="text-xs font-semibold text-red-400 mb-2">
                  {result.errors.length} {result.errors.length === 1 ? 'error' : 'errors'} occurred:
                </p>
                <ul className="text-[11px] text-red-300/70 space-y-1 max-h-20 overflow-y-auto">
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
              className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 group"
            >
              <span>Continue</span>
              <span className="text-[var(--theme-bg-primary)] group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>

          {/* Bottom decorative bar */}
          <div className="h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
        </div>
      </div>

      <style jsx global>{`
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
