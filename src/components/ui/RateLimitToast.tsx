'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Clock, X, Zap } from 'lucide-react';

interface RateLimitToastProps {
  isVisible: boolean;
  onClose: () => void;
  waitTimeMs?: number;
}

export function RateLimitToast({ isVisible, onClose, waitTimeMs = 300000 }: RateLimitToastProps) {
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(Math.ceil(waitTimeMs / 1000));

  // Countdown timer
  useEffect(() => {
    if (!isVisible) return;

    setRemainingSeconds(Math.ceil(waitTimeMs / 1000));

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          handleClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible, waitTimeMs]);

  const handleClose = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setIsAnimatingOut(false);
      onClose();
    }, 400);
  };

  if (!isVisible) return null;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeDisplay = minutes > 0
    ? `${minutes}m ${seconds.toString().padStart(2, '0')}s`
    : `${seconds}s`;

  // Progress percentage (inverted - fills as time passes)
  const progressPercent = ((waitTimeMs / 1000 - remainingSeconds) / (waitTimeMs / 1000)) * 100;

  return (
    <div
      className={`fixed bottom-6 right-6 z-[100] w-[380px] transition-all duration-400 ${
        isAnimatingOut
          ? 'opacity-0 translate-x-8 scale-95'
          : 'opacity-100 translate-x-0 scale-100'
      }`}
      style={{
        animation: isAnimatingOut ? 'none' : 'rateToastSlide 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      {/* Main container with warning glow */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/40 bg-[var(--theme-bg-secondary)] backdrop-blur-xl shadow-2xl shadow-amber-500/10">

        {/* Animated warning stripe pattern at top */}
        <div className="absolute top-0 left-0 right-0 h-1.5 overflow-hidden">
          <div
            className="h-full w-[200%] bg-repeating-linear"
            style={{
              background: 'repeating-linear-gradient(90deg, #f59e0b 0px, #f59e0b 10px, #0a0e27 10px, #0a0e27 20px)',
              animation: 'hazardScroll 1s linear infinite',
            }}
          />
        </div>

        {/* Subtle glow effects */}
        <div className="absolute -top-10 -left-10 w-24 h-24 bg-amber-500/15 rounded-full blur-2xl" />
        <div className="absolute -bottom-8 -right-8 w-20 h-20 bg-orange-500/10 rounded-full blur-xl" />

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 p-1 rounded-lg bg-[var(--theme-hover-bg)] border border-[var(--theme-border)] text-[var(--theme-text-subtle)] hover:text-[var(--theme-text-primary)] hover:border-amber-500/50 hover:bg-amber-500/10 transition-all z-10"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="relative p-5 pt-6">
          {/* Header with icon */}
          <div className="flex items-start gap-4 mb-4">
            {/* Animated warning icon */}
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 flex items-center justify-center">
                <AlertTriangle
                  className="w-6 h-6 text-amber-400"
                  style={{ animation: 'warningPulse 2s ease-in-out infinite' }}
                />
              </div>
              {/* Pulsing ring */}
              <div
                className="absolute inset-0 rounded-xl border-2 border-amber-500/40"
                style={{ animation: 'ringPulse 2s ease-out infinite' }}
              />
            </div>

            <div className="flex-1 min-w-0 pr-6">
              <h3 className="text-base font-bold text-[var(--theme-text-primary)] mb-1 flex items-center gap-2">
                Steam API Rate Limited
                <Zap className="w-3.5 h-3.5 text-amber-400" />
              </h3>
              <p className="text-xs text-[var(--theme-text-muted)] leading-relaxed">
                Too many requests sent to Steam. Session tracking is paused to protect your account.
              </p>
            </div>
          </div>

          {/* Countdown display */}
          <div className="relative mb-4 p-3 bg-[var(--theme-hover-bg)] border border-[var(--theme-border)] rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs text-[var(--theme-text-muted)]">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Resuming in</span>
              </div>
              <div
                className="font-mono text-lg font-bold text-amber-400 tabular-nums tracking-wider"
                style={{ textShadow: '0 0 20px rgba(245, 158, 11, 0.4)' }}
              >
                {timeDisplay}
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-[var(--theme-bg-primary)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-linear"
                style={{
                  width: `${progressPercent}%`,
                  background: 'linear-gradient(90deg, #f59e0b, #f97316)',
                  boxShadow: '0 0 10px rgba(245, 158, 11, 0.5)',
                }}
              />
            </div>
          </div>

          {/* Info footer */}
          <div className="flex items-center gap-2 text-[10px] text-[var(--theme-text-subtle)] uppercase tracking-wider">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>Steam allows 200 requests per 5 minutes</span>
          </div>
        </div>

        {/* Bottom accent line */}
        <div className="h-0.5 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
      </div>

      <style jsx global>{`
        @keyframes rateToastSlide {
          0% {
            opacity: 0;
            transform: translateX(100%) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        @keyframes hazardScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-20px); }
        }

        @keyframes warningPulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(0.95);
          }
        }

        @keyframes ringPulse {
          0% {
            opacity: 0.6;
            transform: scale(1);
          }
          50% {
            opacity: 0;
            transform: scale(1.3);
          }
          100% {
            opacity: 0;
            transform: scale(1.3);
          }
        }
      `}</style>
    </div>
  );
}
