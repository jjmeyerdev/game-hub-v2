'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { syncSessionWithSteam, getTodayPlaytime } from '@/app/_actions/sessions';
import type { GameSession } from '@/lib/types/steam';

// Polling intervals - conservative to avoid Steam API rate limits
// Steam allows 200 requests per 5 minutes, but we share with other features
const ACTIVE_SESSION_INTERVAL = 90000; // 1.5 minutes when playing
const IDLE_INTERVAL = 180000; // 3 minutes when not playing
const RATE_LIMIT_BACKOFF = 300000; // 5 minutes backoff when rate limited

export function useSessionTracking(enabled = true) {
  const [activeSession, setActiveSession] = useState<GameSession | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [todayPlaytime, setTodayPlaytime] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const isSyncingRef = useRef(false);

  // Determine polling interval based on session state and rate limit status
  const pollingInterval = isRateLimited
    ? RATE_LIMIT_BACKOFF
    : activeSession
      ? ACTIVE_SESSION_INTERVAL
      : IDLE_INTERVAL;

  // Main sync function - with guard against concurrent calls
  const sync = useCallback(async () => {
    if (!enabled || isSyncingRef.current) return;

    isSyncingRef.current = true;
    setIsTracking(true);
    try {
      const result = await syncSessionWithSteam();

      // Check for rate limit error in response
      if (result.error?.includes('Rate limit')) {
        setIsRateLimited(true);
        // Auto-clear rate limit flag after backoff period
        setTimeout(() => setIsRateLimited(false), RATE_LIMIT_BACKOFF);
      } else {
        setIsRateLimited(false);
        setActiveSession(result.activeSession || null);
        setLastSync(new Date());

        // Refresh today's playtime
        const todayMinutes = await getTodayPlaytime();
        setTodayPlaytime(todayMinutes);
      }
    } catch (error) {
      // Handle rate limit errors from thrown exceptions
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage.includes('Rate limit')) {
        setIsRateLimited(true);
        setTimeout(() => setIsRateLimited(false), RATE_LIMIT_BACKOFF);
      } else {
        console.error('Session sync failed:', error);
      }
    } finally {
      setIsTracking(false);
      isSyncingRef.current = false;
    }
  }, [enabled]);

  // Initial sync on mount
  useEffect(() => {
    if (enabled) {
      sync();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // Polling loop
  useEffect(() => {
    if (!enabled) return;

    intervalRef.current = setInterval(sync, pollingInterval);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, pollingInterval]);

  // Live timer for active session
  useEffect(() => {
    if (activeSession) {
      timerRef.current = setInterval(() => {
        const started = new Date(activeSession.started_at);
        const minutes = Math.floor((Date.now() - started.getTime()) / (1000 * 60));
        setSessionDuration(minutes);
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    } else {
      setSessionDuration(0);
    }
  }, [activeSession]);

  // Pause polling when tab is hidden (Page Visibility API)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Clear interval when tab is hidden
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = undefined;
        }
      } else if (!intervalRef.current) {
        // Only restart if not already running
        sync();
        intervalRef.current = setInterval(sync, pollingInterval);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollingInterval]);

  return {
    activeSession,
    sessionDuration, // Live minutes counter
    todayPlaytime, // Total minutes today
    isTracking,
    lastSync,
    isRateLimited,
    clearRateLimitWarning: () => setIsRateLimited(false),
  };
}
