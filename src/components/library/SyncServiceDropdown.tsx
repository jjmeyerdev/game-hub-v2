'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, ChevronDown, Check, AlertCircle, Clock, Zap } from 'lucide-react';
import { getSteamProfile, syncSteamLibrary } from '@/app/(dashboard)/_actions/steam';
import { getPsnProfile, syncPsnLibrary } from '@/app/(dashboard)/_actions/psn';
import { getXboxProfile, syncXboxLibrary } from '@/app/(dashboard)/_actions/xbox';
import { getEpicProfile, syncEpicLibrary } from '@/app/(dashboard)/_actions/epic';
import { SyncProgressModal } from '@/components/ui/SyncProgressModal';
import { SyncToast } from '@/components/ui/SyncToast';
import { triggerLibraryRefresh } from '@/lib/events/libraryEvents';
import { SteamLogo, PlayStationLogo, XboxLogo, EpicLogo } from '@/components/icons/PlatformLogos';
import type { SteamProfile } from '@/lib/types/steam';
import type { PsnProfile } from '@/lib/types/psn';
import type { XboxDbProfile } from '@/lib/types/xbox';
import type { EpicProfile } from '@/lib/types/epic';

interface ServiceStatus {
  steam: SteamProfile | null;
  psn: PsnProfile | null;
  xbox: XboxDbProfile | null;
  epic: EpicProfile | null;
}

type ServiceKey = keyof ServiceStatus;
type SyncResult = { success: boolean; gamesAdded: number; gamesUpdated: number; totalGames: number; errors: string[] };

const SERVICE_CONFIG = {
  steam: {
    name: 'Steam',
    gradient: 'from-[#1b2838] via-[#2a475e] to-[#1b2838]',
    border: 'border-[#66c0f4]/30',
    shadow: '0 0 20px rgba(102, 192, 244, 0.15)',
    glowColor: 'rgba(102, 192, 244, 0.4)',
    textColor: 'text-[#66c0f4]',
    bgHover: 'hover:bg-[#66c0f4]/5',
    icon: <SteamLogo className="w-4 h-4" />,
    dot: 'bg-[#66c0f4]',
  },
  psn: {
    name: 'PlayStation',
    gradient: 'from-[#003087] via-[#0070d1] to-[#003087]',
    border: 'border-[#0070d1]/30',
    shadow: '0 0 20px rgba(0, 112, 209, 0.15)',
    glowColor: 'rgba(0, 112, 209, 0.4)',
    textColor: 'text-[#0070d1]',
    bgHover: 'hover:bg-[#0070d1]/5',
    icon: <PlayStationLogo className="w-4 h-4" />,
    dot: 'bg-[#0070d1]',
  },
  xbox: {
    name: 'Xbox',
    gradient: 'from-[#0e7a0d] via-[#107c10] to-[#0e7a0d]',
    border: 'border-[#52b043]/30',
    shadow: '0 0 20px rgba(16, 124, 16, 0.15)',
    glowColor: 'rgba(82, 176, 67, 0.4)',
    textColor: 'text-[#52b043]',
    bgHover: 'hover:bg-[#107c10]/5',
    icon: <XboxLogo className="w-4 h-4" />,
    dot: 'bg-[#52b043]',
  },
  epic: {
    name: 'Epic Games',
    gradient: 'from-[#1a1a1a] via-[#2d2d2d] to-[#1a1a1a]',
    border: 'border-white/20',
    shadow: '0 0 20px rgba(255, 255, 255, 0.05)',
    glowColor: 'rgba(255, 255, 255, 0.3)',
    textColor: 'text-white',
    bgHover: 'hover:bg-white/5',
    icon: <EpicLogo className="w-4 h-4" />,
    dot: 'bg-white',
  },
} as const;

// Per-service cooldown periods based on API rate limits
const SERVICE_COOLDOWNS: Record<ServiceKey, number> = {
  steam: 1 * 60 * 1000,
  psn: 3 * 60 * 1000,
  xbox: 5 * 60 * 1000,
  epic: 2 * 60 * 1000,
};

function getCooldownRemaining(lastSync: string | null, service: ServiceKey): number {
  if (!lastSync) return 0;
  const lastSyncTime = new Date(lastSync).getTime();
  const now = Date.now();
  const elapsed = now - lastSyncTime;
  const cooldownMs = SERVICE_COOLDOWNS[service];
  const remaining = cooldownMs - elapsed;
  return Math.max(0, remaining);
}

function formatTimeRemaining(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatLastSync(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function SyncServiceDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<ServiceStatus>({
    steam: null,
    psn: null,
    xbox: null,
    epic: null,
  });
  const [syncingService, setSyncingService] = useState<ServiceKey | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [cooldowns, setCooldowns] = useState<Record<ServiceKey, number>>({
    steam: 0,
    psn: 0,
    xbox: 0,
    epic: 0,
  });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const hasLoadedRef = useRef(false);

  const getLastSync = useCallback((service: ServiceKey): string | null => {
    const profile = services[service];
    if (!profile) return null;
    switch (service) {
      case 'steam':
        return (profile as SteamProfile).steam_last_sync;
      case 'psn':
        return (profile as PsnProfile).psn_last_sync;
      case 'xbox':
        return (profile as XboxDbProfile).xbox_last_sync;
      case 'epic':
        return (profile as EpicProfile).epic_last_sync;
    }
  }, [services]);

  useEffect(() => {
    const updateCooldowns = () => {
      setCooldowns({
        steam: getCooldownRemaining(getLastSync('steam'), 'steam'),
        psn: getCooldownRemaining(getLastSync('psn'), 'psn'),
        xbox: getCooldownRemaining(getLastSync('xbox'), 'xbox'),
        epic: getCooldownRemaining(getLastSync('epic'), 'epic'),
      });
    };

    updateCooldowns();
    const interval = setInterval(updateCooldowns, 1000);
    return () => clearInterval(interval);
  }, [getLastSync]);

  async function loadProfiles(forceReload = false) {
    if (hasLoadedRef.current && !forceReload) return;
    hasLoadedRef.current = true;
    setLoading(true);
    const [steam, psn, xbox, epic] = await Promise.all([
      getSteamProfile(),
      getPsnProfile(),
      getXboxProfile(),
      getEpicProfile(),
    ]);
    setServices({ steam, psn, xbox, epic });
    setLoading(false);
  }

  useEffect(() => {
    if (isOpen && !hasLoadedRef.current) {
      loadProfiles();
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const connectedServices = Object.entries(services).filter(([, profile]) => profile !== null) as [ServiceKey, NonNullable<ServiceStatus[ServiceKey]>][];
  const hasConnectedServices = connectedServices.length > 0;

  async function handleSync(service: ServiceKey) {
    setSyncingService(service);
    setIsOpen(false);
    setSyncResult(null);

    try {
      let result: SyncResult;
      switch (service) {
        case 'steam':
          result = await syncSteamLibrary();
          break;
        case 'psn':
          result = await syncPsnLibrary();
          break;
        case 'xbox':
          result = await syncXboxLibrary();
          break;
        case 'epic':
          result = await syncEpicLibrary();
          break;
      }
      setSyncResult(result);
      setShowToast(true);
      triggerLibraryRefresh();
      await loadProfiles(true);
    } catch (error) {
      console.error(`Failed to sync ${service}:`, error);
      setSyncResult({
        success: false,
        gamesAdded: 0,
        gamesUpdated: 0,
        totalGames: 0,
        errors: [error instanceof Error ? error.message : 'Sync failed'],
      });
      setShowToast(true);
    } finally {
      setSyncingService(null);
    }
  }

  async function handleSyncAll() {
    setIsOpen(false);

    for (const [service] of connectedServices) {
      setSyncingService(service);
      try {
        switch (service) {
          case 'steam':
            await syncSteamLibrary();
            break;
          case 'psn':
            await syncPsnLibrary();
            break;
          case 'xbox':
            await syncXboxLibrary();
            break;
          case 'epic':
            await syncEpicLibrary();
            break;
        }
      } catch (error) {
        console.error(`Failed to sync ${service}:`, error);
      }
    }

    setSyncingService(null);
    triggerLibraryRefresh();
    await loadProfiles(true);
    setSyncResult({
      success: true,
      gamesAdded: 0,
      gamesUpdated: 0,
      totalGames: 0,
      errors: [],
    });
    setShowToast(true);
  }

  const hasLoadedAndNoServices = hasLoadedRef.current && !hasConnectedServices;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Main Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={hasLoadedAndNoServices || syncingService !== null}
        className={`
          relative group flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-medium text-sm
          transition-all duration-300 overflow-hidden
          ${hasLoadedAndNoServices
            ? 'bg-white/[0.02] border border-white/[0.06] text-white/30 cursor-not-allowed'
            : 'bg-white text-[#030304] hover:bg-cyan-400 shadow-lg shadow-white/10 hover:shadow-cyan-400/20'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        {syncingService ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : (
          <RefreshCw className="w-4 h-4 transition-transform duration-500 group-hover:rotate-180" />
        )}
        <span className="font-semibold">{syncingService ? 'Syncing...' : 'Sync'}</span>
        {!syncingService && (
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        )}

        {/* Connected services indicator */}
        {hasConnectedServices && (
          <div className="flex -space-x-1.5 ml-1">
            {connectedServices.slice(0, 4).map(([service]) => (
              <div
                key={service}
                className={`w-2.5 h-2.5 rounded-full border-2 border-[#030304] ${SERVICE_CONFIG[service].dot}`}
                style={{ boxShadow: `0 0 6px ${SERVICE_CONFIG[service].glowColor}` }}
              />
            ))}
          </div>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (loading || hasConnectedServices) && (
        <div
          className="absolute right-0 top-full mt-2 w-80 z-50"
          style={{ animation: 'dropdownSlide 0.2s ease-out' }}
        >
          {/* Main container */}
          <div className="relative bg-[#0a0a0b] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">
            {/* Noise texture */}
            <div
              className="absolute inset-0 opacity-[0.015] pointer-events-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
              }}
            />

            {/* Subtle gradient glow at top */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            {/* Header */}
            <div className="relative px-5 py-4 border-b border-white/[0.04]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center border border-white/[0.08]">
                    <Zap className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                    Sync Services
                  </span>
                </div>
                <span className="text-[10px] font-medium text-white/30 bg-white/[0.04] px-2 py-1 rounded-md">
                  {connectedServices.length} connected
                </span>
              </div>
            </div>

            {/* Service List */}
            <div className="relative py-2">
              {loading ? (
                <div className="px-5 py-8 text-center">
                  <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 animate-spin text-white/40" />
                  </div>
                  <p className="text-sm text-white/40">Loading services...</p>
                </div>
              ) : !hasConnectedServices ? (
                <div className="px-5 py-8 text-center">
                  <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-amber-400" />
                  </div>
                  <p className="text-sm text-white/50">No services connected</p>
                  <p className="text-xs text-white/30 mt-1">Connect services in Settings</p>
                </div>
              ) : connectedServices.map(([service, profile], idx) => {
                const config = SERVICE_CONFIG[service];
                const lastSync =
                  service === 'steam' ? (profile as SteamProfile).steam_last_sync :
                  service === 'psn' ? (profile as PsnProfile).psn_last_sync :
                  service === 'xbox' ? (profile as XboxDbProfile).xbox_last_sync :
                  (profile as EpicProfile).epic_last_sync;

                const cooldownMs = cooldowns[service];
                const isOnCooldown = cooldownMs > 0;
                const serviceCooldown = SERVICE_COOLDOWNS[service];
                const cooldownProgress = isOnCooldown
                  ? ((serviceCooldown - cooldownMs) / serviceCooldown) * 100
                  : 100;

                return (
                  <div
                    key={service}
                    style={{ animationDelay: `${idx * 50}ms` }}
                    className="animate-in fade-in slide-in-from-left-2"
                  >
                    <button
                      onClick={() => handleSync(service)}
                      disabled={syncingService !== null || isOnCooldown}
                      className={`
                        w-full px-4 py-3 flex items-center gap-3 transition-all duration-200
                        ${isOnCooldown ? 'opacity-60' : config.bgHover}
                        disabled:cursor-not-allowed
                        group/item relative
                      `}
                    >
                      {/* Service Icon with brand styling */}
                      <div
                        className={`
                          relative w-10 h-10 rounded-xl flex items-center justify-center
                          bg-gradient-to-br ${config.gradient}
                          border ${config.border}
                          ${config.textColor}
                          transition-all duration-300
                          ${!isOnCooldown ? 'group-hover/item:scale-105' : ''}
                        `}
                        style={{
                          boxShadow: isOnCooldown ? 'none' : config.shadow,
                        }}
                      >
                        {config.icon}

                        {/* Cooldown overlay */}
                        {isOnCooldown && (
                          <svg
                            className="absolute inset-0 w-full h-full -rotate-90"
                            viewBox="0 0 40 40"
                          >
                            <circle
                              cx="20"
                              cy="20"
                              r="18"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeDasharray={`${cooldownProgress * 1.13} 113`}
                              className="opacity-50"
                              style={{ strokeLinecap: 'round' }}
                            />
                          </svg>
                        )}
                      </div>

                      {/* Service Info */}
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-sm">{config.name}</span>
                          <div className={`w-4 h-4 rounded-full ${config.textColor} bg-current/10 flex items-center justify-center`}>
                            <Check className="w-2.5 h-2.5" />
                          </div>
                        </div>

                        {isOnCooldown ? (
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="flex items-center gap-1 text-[11px] text-amber-400">
                              <Clock className="w-3 h-3" />
                              <span className="font-mono font-medium">
                                {formatTimeRemaining(cooldownMs)}
                              </span>
                            </div>
                            <div className="flex-1 h-1 bg-white/[0.04] rounded-full overflow-hidden max-w-20">
                              <div
                                className="h-full bg-gradient-to-r from-amber-500/50 to-amber-400/70 rounded-full"
                                style={{
                                  width: `${cooldownProgress}%`,
                                  transition: 'width 1s linear',
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          <p className="text-[11px] text-white/40 truncate">
                            {lastSync ? `Synced ${formatLastSync(lastSync)}` : 'Never synced'}
                          </p>
                        )}
                      </div>

                      {/* Action indicator */}
                      <div className="flex-shrink-0">
                        {isOnCooldown ? (
                          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                            <Clock className="w-3.5 h-3.5 text-amber-400/70" />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center group-hover/item:bg-white/[0.06] group-hover/item:border-white/[0.1] transition-all">
                            <RefreshCw className="w-3.5 h-3.5 text-white/40 group-hover/item:text-white/70 group-hover/item:rotate-90 transition-all duration-300" />
                          </div>
                        )}
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Sync All Footer */}
            {connectedServices.length > 1 && (() => {
              const servicesOnCooldown = connectedServices.filter(([service]) => cooldowns[service] > 0);
              const allOnCooldown = servicesOnCooldown.length === connectedServices.length;
              const someOnCooldown = servicesOnCooldown.length > 0;
              const maxCooldown = someOnCooldown
                ? Math.max(...servicesOnCooldown.map(([service]) => cooldowns[service]))
                : 0;

              return (
                <div className="relative px-4 py-3 border-t border-white/[0.04]">
                  <button
                    onClick={handleSyncAll}
                    disabled={syncingService !== null || allOnCooldown}
                    className={`
                      w-full px-4 py-3 rounded-xl
                      ${allOnCooldown
                        ? 'bg-amber-500/5 border-amber-500/20'
                        : 'bg-white hover:bg-cyan-400'
                      }
                      border border-white/[0.08]
                      text-sm font-semibold
                      ${allOnCooldown ? 'text-amber-400/70' : 'text-[#030304]'}
                      transition-all duration-200
                      disabled:opacity-70 disabled:cursor-not-allowed
                      flex items-center justify-center gap-2
                    `}
                  >
                    {allOnCooldown ? (
                      <>
                        <Clock className="w-4 h-4" />
                        <span>Available in</span>
                        <span className="font-mono">{formatTimeRemaining(maxCooldown)}</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        <span>Sync All Services</span>
                        {someOnCooldown && (
                          <span className="text-[10px] text-[#030304]/50 bg-black/10 px-1.5 py-0.5 rounded">
                            {connectedServices.length - servicesOnCooldown.length} ready
                          </span>
                        )}
                      </>
                    )}
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Sync Progress Modal */}
      <SyncProgressModal
        isOpen={syncingService !== null}
        platform={syncingService || 'steam'}
      />

      {/* Sync Toast */}
      <SyncToast
        isVisible={showToast}
        onClose={() => setShowToast(false)}
        type={syncingService || 'steam'}
        result={syncResult}
      />

      <style jsx>{`
        @keyframes dropdownSlide {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
