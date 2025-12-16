'use client';

import { useState, useEffect } from 'react';
import {
  Terminal,
  Download,
  Trash2,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Gamepad2,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export type ServiceType = 'steam' | 'psn' | 'xbox' | 'epic';

export interface SyncLogEntry {
  id: string;
  service: ServiceType;
  timestamp: string;
  success: boolean;
  gamesAdded: number;
  gamesUpdated: number;
  totalGames: number;
  errors: string[];
  duration?: number; // in ms
  metadata?: {
    achievementsUpdated?: number;
    trophiesUpdated?: number;
    gamesSkipped?: number;
  };
}

// ============================================================================
// Storage utilities
// ============================================================================

const STORAGE_KEY = 'gamehub_sync_logs';
const MAX_LOGS_PER_SERVICE = 10;

export function getSyncLogs(): SyncLogEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addSyncLog(entry: Omit<SyncLogEntry, 'id' | 'timestamp'>): SyncLogEntry {
  const logs = getSyncLogs();
  const newEntry: SyncLogEntry = {
    ...entry,
    id: `${entry.service}-${Date.now()}`,
    timestamp: new Date().toISOString(),
  };

  // Add new entry at the beginning
  logs.unshift(newEntry);

  // Keep only the last N logs per service
  const serviceCounts: Record<string, number> = {};
  const filtered = logs.filter((log) => {
    serviceCounts[log.service] = (serviceCounts[log.service] || 0) + 1;
    return serviceCounts[log.service] <= MAX_LOGS_PER_SERVICE;
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return newEntry;
}

export function clearSyncLogs(service?: ServiceType): void {
  if (service) {
    const logs = getSyncLogs().filter((log) => log.service !== service);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

// ============================================================================
// Service configuration
// ============================================================================

const serviceConfig: Record<
  ServiceType,
  {
    name: string;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: React.ReactNode;
  }
> = {
  steam: {
    name: 'Steam',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658a3.387 3.387 0 0 1 1.912-.59c.064 0 .128.003.191.006l2.866-4.158v-.058c0-2.495 2.03-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.091 2.921c0 .054.003.108.003.164 0 1.872-1.521 3.393-3.393 3.393-1.703 0-3.113-1.268-3.346-2.913l-4.603-1.905A11.996 11.996 0 0 0 11.979 24c6.627 0 12-5.373 12-12s-5.372-12-12-12z" />
      </svg>
    ),
  },
  psn: {
    name: 'PlayStation',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8.985 2.596v17.548l3.915 1.261V6.688c0-.69.304-1.151.794-.991.636.181.76.814.76 1.505v5.876c2.441 1.193 4.362-.002 4.362-3.153 0-3.237-1.126-4.675-4.438-5.827-1.307-.448-3.728-1.186-5.393-1.502zm4.656 16.242l6.296-2.275c.715-.258.826-.625.246-.818-.586-.192-1.637-.139-2.357.123l-4.205 1.5v-2.385l.24-.085s1.201-.42 2.913-.615c1.696-.18 3.792.03 5.437.661 1.848.596 2.063 1.473 1.597 2.085-.466.611-1.635 1.04-1.635 1.04l-8.532 3.047v-2.278zM1.004 18.241c-1.513-.453-1.775-1.396-1.08-1.985.654-.556 1.77-.96 1.77-.96l5.572-1.99v2.316l-4.049 1.446c-.715.257-.826.625-.247.817.587.193 1.637.14 2.358-.12l1.938-.707v2.068c-.127.026-.262.047-.39.07-1.765.286-3.655.078-5.872-.955z" />
      </svg>
    ),
  },
  xbox: {
    name: 'Xbox',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm0 1.5a6.5 6.5 0 0 1 3.25.87c-.87.87-1.75 1.87-2.5 2.87L8 6l-.75-.76c-.75-1-1.63-2-2.5-2.87A6.5 6.5 0 0 1 8 1.5zM3.37 3.87c.75.75 1.63 1.75 2.38 2.88C4.25 8.5 3 10.75 2.5 12A6.47 6.47 0 0 1 1.5 8c0-1.5.5-3 1.87-4.13zM8 7.5l.75.75c1.12 1.25 2.12 2.75 2.87 4.12a6.45 6.45 0 0 1-7.24 0c.75-1.37 1.75-2.87 2.87-4.12L8 7.5zm4.63-3.63A6.47 6.47 0 0 1 14.5 8c0 1.5-.5 2.87-1.37 4-.5-1.25-1.75-3.5-3.25-5.25.75-1.13 1.63-2.13 2.75-2.88z" />
      </svg>
    ),
  },
  epic: {
    name: 'Epic Games',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/30',
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
        <path d="M2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2zm3 4h6v1.5H6.5v2.25H10V9.25H6.5V12H11v1.5H5V4z" />
      </svg>
    ),
  },
};

// ============================================================================
// Component
// ============================================================================

export default function SyncLogs() {
  const [logs, setLogs] = useState<SyncLogEntry[]>([]);
  const [expandedServices, setExpandedServices] = useState<Set<ServiceType>>(new Set());
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLogs(getSyncLogs());

    // Listen for storage events from other tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setLogs(getSyncLogs());
      }
    };

    // Custom event for same-tab updates
    const handleUpdate = () => setLogs(getSyncLogs());

    window.addEventListener('storage', handleStorage);
    window.addEventListener('syncLogUpdate', handleUpdate);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('syncLogUpdate', handleUpdate);
    };
  }, []);

  const toggleService = (service: ServiceType) => {
    setExpandedServices((prev) => {
      const next = new Set(prev);
      if (next.has(service)) {
        next.delete(service);
      } else {
        next.add(service);
      }
      return next;
    });
  };

  const toggleLog = (logId: string) => {
    setExpandedLogs((prev) => {
      const next = new Set(prev);
      if (next.has(logId)) {
        next.delete(logId);
      } else {
        next.add(logId);
      }
      return next;
    });
  };

  const handleClearLogs = (service?: ServiceType) => {
    if (confirm(service ? `Clear all ${serviceConfig[service].name} logs?` : 'Clear all sync logs?')) {
      clearSyncLogs(service);
      setLogs(getSyncLogs());
    }
  };

  const handleDownload = (service?: ServiceType) => {
    const logsToDownload = service ? logs.filter((l) => l.service === service) : logs;

    const data = {
      exportedAt: new Date().toISOString(),
      service: service || 'all',
      logs: logsToDownload,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gamehub-sync-logs${service ? `-${service}` : ''}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Group logs by service
  const logsByService = logs.reduce(
    (acc, log) => {
      if (!acc[log.service]) acc[log.service] = [];
      acc[log.service].push(log);
      return acc;
    },
    {} as Record<ServiceType, SyncLogEntry[]>
  );

  const services: ServiceType[] = ['steam', 'psn', 'xbox', 'epic'];
  const hasLogs = logs.length > 0;
  const totalErrors = logs.reduce((sum, log) => sum + log.errors.length, 0);

  return (
    <div className="space-y-4">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-orange-500/20 blur-md rounded-full" />
            <div className="relative p-2 bg-gradient-to-br from-orange-500/20 to-amber-600/20 border border-orange-500/30 rounded-lg">
              <Terminal className="w-4 h-4 text-orange-400" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide" style={{ fontFamily: 'var(--font-rajdhani)' }}>
              SYNC DIAGNOSTICS
            </h3>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">
              {logs.length} {logs.length === 1 ? 'entry' : 'entries'}
              {totalErrors > 0 && (
                <span className="text-amber-400 ml-2">
                  {totalErrors} {totalErrors === 1 ? 'warning' : 'warnings'}
                </span>
              )}
            </p>
          </div>
        </div>

        {hasLogs && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDownload()}
              className="p-2 bg-steel/20 hover:bg-steel/30 border border-steel/30 rounded-lg transition-all group"
              title="Download all logs"
            >
              <Download className="w-3.5 h-3.5 text-gray-400 group-hover:text-cyan-400 transition-colors" />
            </button>
            <button
              onClick={() => handleClearLogs()}
              className="p-2 bg-steel/20 hover:bg-red-500/10 border border-steel/30 hover:border-red-500/30 rounded-lg transition-all group"
              title="Clear all logs"
            >
              <Trash2 className="w-3.5 h-3.5 text-gray-400 group-hover:text-red-400 transition-colors" />
            </button>
          </div>
        )}
      </div>

      {/* Terminal-style log viewer */}
      <div className="relative">
        {/* Scanline effect */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl opacity-30">
          <div
            className="absolute inset-0"
            style={{
              background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
            }}
          />
        </div>

        {/* Terminal window */}
        <div className="relative bg-[#0a0e14] border border-steel/40 rounded-xl overflow-hidden">
          {/* Terminal header bar */}
          <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-[#0d1218] to-[#0a0e14] border-b border-steel/30">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              </div>
              <span className="ml-3 text-[10px] font-mono text-gray-500 tracking-wider">sync_diagnostic.log</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-[9px] font-mono text-emerald-400/70 uppercase tracking-wider">Live</span>
            </div>
          </div>

          {/* Log content */}
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {!hasLogs ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-gray-500/10 blur-xl rounded-full" />
                  <Gamepad2 className="relative w-10 h-10 text-gray-600" />
                </div>
                <p className="text-sm text-gray-500 font-mono mb-1">No sync logs yet</p>
                <p className="text-[10px] text-gray-600">Sync your gaming platforms to see diagnostics here</p>
              </div>
            ) : (
              <div className="divide-y divide-steel/20">
                {services.map((service) => {
                  const serviceLogs = logsByService[service] || [];
                  const config = serviceConfig[service];
                  const isExpanded = expandedServices.has(service);
                  const hasErrors = serviceLogs.some((l) => l.errors.length > 0);

                  return (
                    <div key={service} className="group">
                      {/* Service header */}
                      <div
                        onClick={() => serviceLogs.length > 0 && toggleService(service)}
                        className={`
                          w-full flex items-center justify-between px-4 py-3
                          hover:bg-white/[0.02] transition-colors cursor-pointer
                          ${serviceLogs.length === 0 ? 'opacity-50 cursor-default' : ''}
                        `}
                        role="button"
                        tabIndex={serviceLogs.length > 0 ? 0 : -1}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            if (serviceLogs.length > 0) toggleService(service);
                          }
                        }}
                      >
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
                          )}
                          <div className={`p-1.5 rounded ${config.bgColor} ${config.borderColor} border`}>
                            <span className={config.color}>{config.icon}</span>
                          </div>
                          <span className={`text-xs font-semibold ${config.color}`}>{config.name}</span>
                          {hasErrors && <AlertTriangle className="w-3 h-3 text-amber-400" />}
                        </div>

                        <div className="flex items-center gap-3">
                          {serviceLogs.length > 0 && (
                            <>
                              <span className="text-[10px] font-mono text-gray-500">
                                {serviceLogs.length} {serviceLogs.length === 1 ? 'log' : 'logs'}
                              </span>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownload(service);
                                  }}
                                  className="p-1 hover:bg-steel/30 rounded transition-colors"
                                  title={`Download ${config.name} logs`}
                                >
                                  <Download className="w-3 h-3 text-gray-500 hover:text-cyan-400" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleClearLogs(service);
                                  }}
                                  className="p-1 hover:bg-red-500/10 rounded transition-colors"
                                  title={`Clear ${config.name} logs`}
                                >
                                  <Trash2 className="w-3 h-3 text-gray-500 hover:text-red-400" />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Expanded log entries */}
                      {isExpanded && serviceLogs.length > 0 && (
                        <div className="bg-black/30 border-t border-steel/10">
                          {serviceLogs.map((log) => {
                            const isLogExpanded = expandedLogs.has(log.id);
                            const date = new Date(log.timestamp);

                            return (
                              <div key={log.id} className="border-b border-steel/10 last:border-b-0">
                                {/* Log entry header */}
                                <button
                                  onClick={() => toggleLog(log.id)}
                                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-white/[0.01] transition-colors text-left"
                                >
                                  <div className="w-4 flex justify-center">
                                    {log.success ? (
                                      log.errors.length > 0 ? (
                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                                      ) : (
                                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                                      )
                                    ) : (
                                      <XCircle className="w-3.5 h-3.5 text-red-400" />
                                    )}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 text-[11px] font-mono">
                                      <span className="text-gray-500">
                                        [{date.toLocaleDateString()} {date.toLocaleTimeString()}]
                                      </span>
                                      <span className={log.success ? 'text-emerald-400' : 'text-red-400'}>
                                        {log.success ? 'SUCCESS' : 'FAILED'}
                                      </span>
                                    </div>
                                    <div className="text-[10px] text-gray-400 mt-0.5">
                                      +{log.gamesAdded} added, {log.gamesUpdated} updated
                                      {log.errors.length > 0 && (
                                        <span className="text-amber-400 ml-2">({log.errors.length} warnings)</span>
                                      )}
                                    </div>
                                  </div>

                                  <ChevronRight
                                    className={`w-3 h-3 text-gray-600 transition-transform ${isLogExpanded ? 'rotate-90' : ''}`}
                                  />
                                </button>

                                {/* Expanded log details */}
                                {isLogExpanded && (
                                  <div className="px-4 py-3 bg-black/40 font-mono text-[10px] space-y-2">
                                    {/* Stats */}
                                    <div className="grid grid-cols-4 gap-2">
                                      <div className="p-2 bg-steel/10 rounded border border-steel/20">
                                        <div className="text-cyan-400 font-bold">{log.totalGames}</div>
                                        <div className="text-gray-600 uppercase">Total</div>
                                      </div>
                                      <div className="p-2 bg-emerald-500/5 rounded border border-emerald-500/20">
                                        <div className="text-emerald-400 font-bold">{log.gamesAdded}</div>
                                        <div className="text-gray-600 uppercase">Added</div>
                                      </div>
                                      <div className="p-2 bg-purple-500/5 rounded border border-purple-500/20">
                                        <div className="text-purple-400 font-bold">{log.gamesUpdated}</div>
                                        <div className="text-gray-600 uppercase">Updated</div>
                                      </div>
                                      <div className="p-2 bg-amber-500/5 rounded border border-amber-500/20">
                                        <div className="text-amber-400 font-bold">
                                          {log.metadata?.achievementsUpdated || log.metadata?.trophiesUpdated || 0}
                                        </div>
                                        <div className="text-gray-600 uppercase">
                                          {service === 'psn' ? 'Trophies' : 'Achieve'}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Duration */}
                                    {log.duration && (
                                      <div className="flex items-center gap-2 text-gray-500">
                                        <Clock className="w-3 h-3" />
                                        <span>Completed in {(log.duration / 1000).toFixed(2)}s</span>
                                      </div>
                                    )}

                                    {/* Errors */}
                                    {log.errors.length > 0 && (
                                      <div className="mt-2 p-2 bg-amber-500/5 border border-amber-500/20 rounded">
                                        <div className="flex items-center gap-1.5 text-amber-400 mb-1.5">
                                          <AlertTriangle className="w-3 h-3" />
                                          <span className="uppercase font-semibold">Warnings ({log.errors.length})</span>
                                        </div>
                                        <div className="space-y-1 max-h-32 overflow-y-auto">
                                          {log.errors.map((error, i) => (
                                            <div key={i} className="text-amber-300/80 pl-4 border-l border-amber-500/30">
                                              {error}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Terminal footer */}
          <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-[#0d1218] to-[#0a0e14] border-t border-steel/30">
            <div className="flex items-center gap-2 text-[9px] font-mono text-gray-600">
              <span>$</span>
              <span className="text-gray-500">gamehub sync --status</span>
              <span className="w-2 h-3.5 bg-gray-500 animate-pulse" />
            </div>
            <span className="text-[9px] font-mono text-gray-600">
              Last updated: {logs[0] ? new Date(logs[0].timestamp).toLocaleString() : 'Never'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Dispatch event when logs are updated
export function notifySyncLogUpdate() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('syncLogUpdate'));
  }
}
