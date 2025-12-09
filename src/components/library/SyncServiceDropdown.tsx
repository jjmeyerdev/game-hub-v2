'use client';

import { useState, useEffect, useRef } from 'react';
import { RefreshCw, ChevronDown, Check, AlertCircle } from 'lucide-react';
import { getSteamProfile, syncSteamLibrary } from '@/app/actions/steam';
import { getPsnProfile, syncPsnLibrary } from '@/app/actions/psn';
import { getXboxProfile, syncXboxLibrary } from '@/app/actions/xbox';
import { getEpicProfile, syncEpicLibrary } from '@/app/actions/epic';
import { SyncProgressModal } from '@/components/ui/SyncProgressModal';
import { SyncToast } from '@/components/ui/SyncToast';
import { triggerLibraryRefresh } from '@/lib/events/libraryEvents';
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
    color: 'from-sky-500 to-sky-600',
    hoverColor: 'hover:from-sky-400 hover:to-sky-500',
    bgColor: 'bg-sky-500/10',
    borderColor: 'border-sky-500/30',
    textColor: 'text-sky-400',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
      </svg>
    ),
  },
  psn: {
    name: 'PlayStation',
    color: 'from-blue-600 to-blue-700',
    hoverColor: 'hover:from-blue-500 hover:to-blue-600',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    textColor: 'text-blue-400',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
        <path d="M8.985 2.596v17.548l3.915 1.261V6.688c0-.69.304-1.151.794-.991.636.181.76.814.76 1.505v5.876c2.441 1.193 4.362-.002 4.362-3.153 0-3.237-1.126-4.675-4.438-5.827-1.307-.448-3.728-1.186-5.391-1.502h-.002zm4.656 16.242l6.296-2.275c.715-.258.826-.625.246-.818-.586-.192-1.637-.139-2.357.123l-4.205 1.5v-2.385l.24-.085s1.201-.42 2.913-.615c1.696-.18 3.792.03 5.437.661 1.848.596 2.063 1.473 1.597 2.085-.466.611-1.635 1.04-1.635 1.04l-8.532 3.047v-2.278zM1.004 18.241c-1.513-.453-1.775-1.396-1.08-1.985.654-.556 1.77-.96 1.77-.96l5.572-1.99v2.316l-4.049 1.446c-.715.257-.826.625-.247.817.587.193 1.637.14 2.358-.12l1.938-.707v2.068c-.127.026-.262.047-.39.07-1.765.286-3.655.078-5.872-.955z" />
      </svg>
    ),
  },
  xbox: {
    name: 'Xbox',
    color: 'from-green-500 to-green-600',
    hoverColor: 'hover:from-green-400 hover:to-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    textColor: 'text-green-400',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M4.102 21.033C6.211 22.881 8.977 24 12 24c3.026 0 5.789-1.119 7.902-2.967 1.877-1.912-4.316-8.709-7.902-11.417-3.582 2.708-9.779 9.505-7.898 11.417zm11.16-14.406c2.5 2.961 7.484 10.313 6.076 12.912C23.056 17.036 24 14.62 24 12c0-5.238-3.354-9.691-8.024-11.33.039.071.076.142.108.219.492 1.161.825 2.426.978 3.738zm-6.532 0c.154-1.312.487-2.577.978-3.738.033-.077.07-.148.108-.219C5.354 2.309 2 6.762 2 12c0 2.62.944 5.036 2.662 6.539-1.408-2.599 3.576-9.951 6.068-12.912z"/>
      </svg>
    ),
  },
  epic: {
    name: 'Epic Games',
    color: 'from-gray-600 to-gray-700',
    hoverColor: 'hover:from-gray-500 hover:to-gray-600',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/30',
    textColor: 'text-gray-400',
    icon: <span className="text-sm font-black">E</span>,
  },
} as const;

export function SyncServiceDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<ServiceStatus>({
    steam: null,
    psn: null,
    xbox: null,
    epic: null,
  });
  const [syncingService, setSyncingService] = useState<ServiceKey | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [showToast, setShowToast] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load all service profiles
  async function loadProfiles() {
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

  // Load profiles on mount
  useEffect(() => {
    loadProfiles();
  }, []);

  // Close dropdown when clicking outside
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
      // Reload profiles to update last sync timestamps
      await loadProfiles();
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
    // Reload profiles to update last sync timestamps
    await loadProfiles();
    setSyncResult({
      success: true,
      gamesAdded: 0,
      gamesUpdated: 0,
      totalGames: 0,
      errors: [],
    });
    setShowToast(true);
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Main Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading || !hasConnectedServices || syncingService !== null}
        className={`
          relative group flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm
          transition-all duration-300 overflow-hidden
          ${hasConnectedServices
            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40'
            : 'bg-deep border border-steel text-gray-500 cursor-not-allowed'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        {/* Animated background shimmer */}
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {syncingService ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : (
          <RefreshCw className="w-4 h-4 transition-transform group-hover:rotate-180 duration-500" />
        )}
        <span>{syncingService ? 'Syncing...' : 'Sync'}</span>
        {hasConnectedServices && !syncingService && (
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        )}

        {/* Connected services indicator dots */}
        {hasConnectedServices && (
          <div className="flex -space-x-1 ml-1">
            {connectedServices.slice(0, 3).map(([service]) => (
              <div
                key={service}
                className={`w-2 h-2 rounded-full border border-white/50 ${
                  service === 'steam' ? 'bg-sky-400' :
                  service === 'psn' ? 'bg-blue-400' :
                  service === 'xbox' ? 'bg-green-400' :
                  'bg-gray-400'
                }`}
              />
            ))}
            {connectedServices.length > 3 && (
              <div className="w-2 h-2 rounded-full bg-white/50 border border-white/50" />
            )}
          </div>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && hasConnectedServices && (
        <div
          className="absolute right-0 top-full mt-2 w-72 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          {/* Glass morphism container */}
          <div className="bg-abyss/95 backdrop-blur-xl border border-steel/50 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-steel/30">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Sync Services
                </span>
                <span className="text-[10px] text-gray-500">
                  {connectedServices.length} connected
                </span>
              </div>
            </div>

            {/* Service List */}
            <div className="py-2">
              {connectedServices.map(([service, profile]) => {
                const config = SERVICE_CONFIG[service];
                const lastSync =
                  service === 'steam' ? (profile as SteamProfile).steam_last_sync :
                  service === 'psn' ? (profile as PsnProfile).psn_last_sync :
                  service === 'xbox' ? (profile as XboxDbProfile).xbox_last_sync :
                  (profile as EpicProfile).epic_last_sync;

                return (
                  <button
                    key={service}
                    onClick={() => handleSync(service)}
                    disabled={syncingService !== null}
                    className={`
                      w-full px-4 py-3 flex items-center gap-3 transition-all duration-200
                      hover:bg-gradient-to-r ${config.hoverColor} hover:${config.bgColor}
                      disabled:opacity-50 disabled:cursor-not-allowed
                      group/item
                    `}
                  >
                    {/* Service Icon */}
                    <div className={`
                      w-9 h-9 rounded-xl flex items-center justify-center
                      ${config.bgColor} ${config.borderColor} border
                      ${config.textColor}
                      transition-transform group-hover/item:scale-110
                    `}>
                      {config.icon}
                    </div>

                    {/* Service Info */}
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-sm">{config.name}</span>
                        <Check className={`w-3 h-3 ${config.textColor}`} />
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {lastSync
                          ? `Last sync: ${new Date(lastSync).toLocaleDateString()}`
                          : 'Never synced'
                        }
                      </div>
                    </div>

                    {/* Sync indicator */}
                    <RefreshCw className={`
                      w-4 h-4 text-gray-500 transition-all
                      group-hover/item:text-white group-hover/item:rotate-90
                    `} />
                  </button>
                );
              })}
            </div>

            {/* Sync All Footer */}
            {connectedServices.length > 1 && (
              <div className="px-3 py-2 border-t border-steel/30 bg-deep/50">
                <button
                  onClick={handleSyncAll}
                  disabled={syncingService !== null}
                  className="
                    w-full px-4 py-2.5 rounded-xl
                    bg-gradient-to-r from-cyan-500/20 to-purple-500/20
                    hover:from-cyan-500/30 hover:to-purple-500/30
                    border border-cyan-500/30
                    text-sm font-semibold text-cyan-400
                    transition-all duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed
                    flex items-center justify-center gap-2
                  "
                >
                  <RefreshCw className="w-4 h-4" />
                  Sync All Services
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* No services connected tooltip */}
      {!hasConnectedServices && !loading && (
        <div className="absolute right-0 top-full mt-2 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-abyss border border-steel rounded-lg px-3 py-2 text-xs text-gray-400 flex items-center gap-2 whitespace-nowrap">
            <AlertCircle className="w-3 h-3 text-amber-400" />
            Connect services in Settings
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
    </div>
  );
}
