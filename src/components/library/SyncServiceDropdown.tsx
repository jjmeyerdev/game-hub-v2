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

// Platform brand colors that complement the design system
const SERVICE_CONFIG = {
  steam: {
    name: 'Steam',
    accent: '#66c0f4',
    accentGlow: 'rgba(102, 192, 244, 0.4)',
    icon: <SteamLogo className="w-4 h-4 text-white" />,
  },
  psn: {
    name: 'PlayStation',
    accent: '#0070d1',
    accentGlow: 'rgba(0, 112, 209, 0.4)',
    icon: <PlayStationLogo className="w-4 h-4 text-white" />,
  },
  xbox: {
    name: 'Xbox',
    accent: '#52b043',
    accentGlow: 'rgba(82, 176, 67, 0.4)',
    icon: <XboxLogo className="w-4 h-4 text-white" />,
  },
  epic: {
    name: 'Epic Games',
    accent: '#ffffff',
    accentGlow: 'rgba(255, 255, 255, 0.2)',
    icon: <EpicLogo className="w-4 h-4 text-white" />,
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
        className="group relative flex items-center gap-2.5 px-5 py-2.5 overflow-hidden rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
        style={{
          background: syncingService
            ? 'linear-gradient(135deg, rgba(34, 211, 238, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)'
            : 'linear-gradient(135deg, rgba(34, 211, 238, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
          border: '1px solid rgba(34, 211, 238, 0.3)',
          boxShadow: syncingService
            ? '0 0 20px rgba(34, 211, 238, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
            : '0 0 15px rgba(34, 211, 238, 0.15), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        {/* Hover glow effect */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)',
          }}
        />

        {/* Animated top border */}
        <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
          <div
            className="h-full w-full bg-gradient-to-r from-cyan-400 via-violet-400 to-cyan-400"
            style={{
              animation: syncingService ? 'shimmer 1.5s linear infinite' : 'none',
              backgroundSize: '200% 100%',
              opacity: syncingService ? 1 : 0.5,
            }}
          />
        </div>

        {syncingService ? (
          <RefreshCw className="relative w-4 h-4 animate-spin text-cyan-400" />
        ) : (
          <RefreshCw className="relative w-4 h-4 text-cyan-400 transition-transform duration-500 group-hover:rotate-180" />
        )}
        <span
          className="relative font-semibold text-white uppercase tracking-wide text-sm"
          style={{ fontFamily: 'var(--font-family-display)' }}
        >
          {syncingService ? 'Syncing...' : 'Sync'}
        </span>
        {!syncingService && (
          <ChevronDown className={`relative w-4 h-4 text-cyan-400/70 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        )}

        {/* Connected services indicator */}
        {hasConnectedServices && (
          <div className="relative flex -space-x-1.5 ml-1">
            {connectedServices.slice(0, 4).map(([service]) => (
              <div
                key={service}
                className="w-2.5 h-2.5 rounded-full border-2 border-void"
                style={{
                  background: SERVICE_CONFIG[service].accent,
                  boxShadow: `0 0 6px ${SERVICE_CONFIG[service].accentGlow}`,
                }}
              />
            ))}
          </div>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (loading || hasConnectedServices) && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Container */}
          <div className="absolute right-0 top-full mt-2 z-50 w-80 animate-dropdown-slide-in">
            <div
              className="relative overflow-hidden rounded-xl"
              style={{
                background: 'linear-gradient(180deg, #0f1011 0%, #0a0a0b 100%)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                boxShadow: `
                  0 0 0 1px rgba(255, 255, 255, 0.02),
                  0 20px 40px -10px rgba(0, 0, 0, 0.6)
                `,
              }}
            >
              {/* Noise texture */}
              <div
                className="absolute inset-0 opacity-[0.015] pointer-events-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                }}
              />

              {/* Top accent line */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

              {/* Header */}
              <div className="relative px-5 py-4 border-b border-white/[0.04]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                      }}
                    >
                      <Zap className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    <span
                      className="text-xs font-semibold text-white/60 uppercase tracking-wider"
                      style={{ fontFamily: 'var(--font-family-display)' }}
                    >
                      Sync Services
                    </span>
                  </div>
                  <span className="text-[10px] font-medium text-white/30 bg-white/[0.03] px-2 py-1 rounded-md border border-white/[0.04]">
                    {connectedServices.length} connected
                  </span>
                </div>
              </div>

              {/* Service List */}
              <div className="relative py-2">
                {loading ? (
                  <div className="px-5 py-8 text-center">
                    <div
                      className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center"
                      style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.04)',
                      }}
                    >
                      <RefreshCw className="w-5 h-5 animate-spin text-white/40" />
                    </div>
                    <p className="text-sm text-white/40">Loading services...</p>
                  </div>
                ) : !hasConnectedServices ? (
                  <div className="px-5 py-8 text-center">
                    <div
                      className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center"
                      style={{
                        background: 'rgba(251, 191, 36, 0.05)',
                        border: '1px solid rgba(251, 191, 36, 0.15)',
                      }}
                    >
                      <AlertCircle className="w-5 h-5 text-amber-400" />
                    </div>
                    <p className="text-sm text-white/50 font-medium">No services connected</p>
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
                      className="animate-fade-in-up"
                    >
                      <button
                        onClick={() => handleSync(service)}
                        disabled={syncingService !== null || isOnCooldown}
                        className={`
                          w-full px-4 py-3.5 flex items-center gap-3.5 transition-all duration-200
                          ${isOnCooldown ? 'opacity-60' : 'hover:bg-white/[0.02]'}
                          disabled:cursor-not-allowed
                          group/item relative
                        `}
                      >
                        {/* Service Icon */}
                        <div
                          className="relative w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300"
                          style={{
                            background: `linear-gradient(135deg, ${config.accent}15 0%, ${config.accent}08 100%)`,
                            border: `1px solid ${config.accent}25`,
                            boxShadow: isOnCooldown ? 'none' : `0 0 20px ${config.accentGlow}`,
                          }}
                        >
                          {config.icon}

                          {/* Cooldown overlay */}
                          {isOnCooldown && (
                            <svg
                              className="absolute inset-0 w-full h-full -rotate-90"
                              viewBox="0 0 44 44"
                            >
                              <circle
                                cx="22"
                                cy="22"
                                r="20"
                                fill="none"
                                stroke={config.accent}
                                strokeWidth="2"
                                strokeDasharray={`${cooldownProgress * 1.26} 126`}
                                className="opacity-40"
                                style={{ strokeLinecap: 'round' }}
                              />
                            </svg>
                          )}
                        </div>

                        {/* Service Info */}
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white text-sm">{config.name}</span>
                            <div
                              className="w-4 h-4 rounded-full flex items-center justify-center"
                              style={{
                                background: `${config.accent}15`,
                                color: config.accent,
                              }}
                            >
                              <Check className="w-2.5 h-2.5" />
                            </div>
                          </div>

                          {isOnCooldown ? (
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex items-center gap-1.5 text-[11px] text-amber-400">
                                <Clock className="w-3 h-3" />
                                <span
                                  className="font-medium tabular-nums"
                                  style={{ fontFamily: 'var(--font-family-display)' }}
                                >
                                  {formatTimeRemaining(cooldownMs)}
                                </span>
                              </div>
                              <div className="flex-1 h-1 bg-white/[0.04] rounded-full overflow-hidden max-w-20">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${cooldownProgress}%`,
                                    background: `linear-gradient(90deg, rgba(251, 191, 36, 0.3) 0%, rgba(251, 191, 36, 0.6) 100%)`,
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
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center"
                              style={{
                                background: 'rgba(251, 191, 36, 0.05)',
                                border: '1px solid rgba(251, 191, 36, 0.15)',
                              }}
                            >
                              <Clock className="w-4 h-4 text-amber-400/70" />
                            </div>
                          ) : (
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all group-hover/item:bg-white/[0.04] group-hover/item:border-white/[0.08]"
                              style={{
                                background: 'rgba(255, 255, 255, 0.02)',
                                border: '1px solid rgba(255, 255, 255, 0.04)',
                              }}
                            >
                              <RefreshCw className="w-4 h-4 text-white/40 group-hover/item:text-white/70 group-hover/item:rotate-90 transition-all duration-300" />
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
                        w-full px-4 py-3 rounded-xl text-sm font-semibold
                        transition-all duration-200
                        disabled:opacity-70 disabled:cursor-not-allowed
                        flex items-center justify-center gap-2
                        ${allOnCooldown
                          ? 'bg-amber-500/5 border border-amber-500/15 text-amber-400/70'
                          : 'btn-primary'
                        }
                      `}
                    >
                      {allOnCooldown ? (
                        <>
                          <Clock className="w-4 h-4" />
                          <span>Available in</span>
                          <span
                            className="tabular-nums"
                            style={{ fontFamily: 'var(--font-family-display)' }}
                          >
                            {formatTimeRemaining(maxCooldown)}
                          </span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          <span>Sync All Services</span>
                          {someOnCooldown && (
                            <span className="text-[10px] text-void/50 bg-black/10 px-1.5 py-0.5 rounded">
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
        </>
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
    </div>
  );
}
