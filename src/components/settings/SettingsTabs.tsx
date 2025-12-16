'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Gamepad2, Shield, Bell, User, ChevronRight, Zap, Database, Lock, Radio, Book, Terminal } from 'lucide-react';
import SteamSettings from './SteamSettings';
import PsnSettings from './PsnSettings';
import XboxSettings from './XboxSettings';
import EpicSettings from './EpicSettings';
import AccountSettings from './AccountSettings';
import NotificationSettings from './NotificationSettings';
import PrivacySettings from './PrivacySettings';
import LibraryManagement from './LibraryManagement';
import SyncLogs from './SyncLogs';

type TabId = 'platforms' | 'account' | 'notifications' | 'privacy';

interface Tab {
  id: TabId;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: 'cyan' | 'purple' | 'amber' | 'emerald';
}

interface SettingsTabsProps {
  profile: {
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
  userEmail: string;
}

const tabs: Tab[] = [
  {
    id: 'platforms',
    label: 'Platforms',
    description: 'Link gaming accounts',
    icon: <Gamepad2 className="w-4 h-4" />,
    color: 'cyan'
  },
  {
    id: 'account',
    label: 'Account',
    description: 'Profile & identity',
    icon: <User className="w-4 h-4" />,
    color: 'purple'
  },
  {
    id: 'notifications',
    label: 'Notifications',
    description: 'Alerts & updates',
    icon: <Bell className="w-4 h-4" />,
    color: 'amber'
  },
  {
    id: 'privacy',
    label: 'Privacy',
    description: 'Security settings',
    icon: <Shield className="w-4 h-4" />,
    color: 'emerald'
  },
];

const colorConfig = {
  cyan: {
    text: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    glow: 'from-cyan-500/20 to-cyan-600/20',
    activeBg: 'from-cyan-500/20 via-cyan-500/10 to-transparent',
    indicator: 'bg-cyan-400',
  },
  purple: {
    text: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    glow: 'from-purple-500/20 to-purple-600/20',
    activeBg: 'from-purple-500/20 via-purple-500/10 to-transparent',
    indicator: 'bg-purple-400',
  },
  amber: {
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    glow: 'from-amber-500/20 to-amber-600/20',
    activeBg: 'from-amber-500/20 via-amber-500/10 to-transparent',
    indicator: 'bg-amber-400',
  },
  emerald: {
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    glow: 'from-emerald-500/20 to-emerald-600/20',
    activeBg: 'from-emerald-500/20 via-emerald-500/10 to-transparent',
    indicator: 'bg-emerald-400',
  },
};

export default function SettingsTabs({ profile, userEmail }: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('platforms');
  const activeTabData = tabs.find(t => t.id === activeTab)!;
  const colors = colorConfig[activeTabData.color];

  return (
    <div className="space-y-8">
      {/* Navigation Section Header */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-purple-400" />
          <h2 className="text-xs font-bold tracking-[0.25em] uppercase text-purple-500/70">
            Control Modules
          </h2>
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-purple-500/30 to-transparent" />
        <span className="text-[10px] font-mono text-gray-600 tracking-wider">
          SELECT CATEGORY
        </span>
      </div>

      {/* Navigation Tabs - Command Panel Style */}
      <nav className="relative">
        {/* Background panel */}
        <div className="absolute inset-0 bg-gradient-to-br from-deep via-abyss to-void rounded-xl border border-steel/30 -z-10" />

        {/* Corner brackets */}
        <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-purple-500/30 rounded-tl-xl" />
        <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-purple-500/30 rounded-tr-xl" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-purple-500/30 rounded-bl-xl" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-purple-500/30 rounded-br-xl" />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 p-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const c = colorConfig[tab.color];

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative group overflow-hidden rounded-lg transition-all duration-300
                  ${isActive
                    ? `bg-gradient-to-br ${c.activeBg} border ${c.border}`
                    : 'bg-transparent border border-transparent hover:border-steel/50 hover:bg-white/[0.02]'
                  }
                `}
              >
                {/* Scan line on hover */}
                {!isActive && (
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent animate-holo-scan" />
                  </div>
                )}

                <div className="relative p-4">
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`
                      p-2 rounded-lg transition-all duration-300
                      ${isActive ? `${c.bg} ${c.border} border` : 'bg-steel/20 border border-steel/30'}
                    `}>
                      <span className={isActive ? c.text : 'text-gray-500'}>{tab.icon}</span>
                    </div>

                    {/* Text */}
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-bold text-sm tracking-wide ${isActive ? 'text-white' : 'text-gray-400'}`}>
                          {tab.label}
                        </h3>
                        {isActive && <ChevronRight className={`w-3 h-3 ${c.text}`} />}
                      </div>
                      <p className="text-[10px] text-gray-600 uppercase tracking-wider mt-0.5">
                        {tab.description}
                      </p>
                    </div>
                  </div>

                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5">
                      <div className={`h-full bg-gradient-to-r from-transparent ${c.glow.replace('from-', 'via-').replace('to-', 'to-')}/50 to-transparent`} />
                    </div>
                  )}
                </div>

                {/* Status indicator */}
                {isActive && (
                  <div className="absolute top-2 right-2">
                    <div className="relative">
                      <div className={`w-2 h-2 ${c.indicator} rounded-full animate-pulse`} />
                      <div className={`absolute inset-0 w-2 h-2 ${c.indicator} rounded-full animate-ping opacity-50`} />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Tab Content */}
      <div className="min-h-[500px] animate-fade-in">
        {activeTab === 'platforms' && <PlatformsContent />}
        {activeTab === 'account' && <AccountContent profile={profile} userEmail={userEmail} />}
        {activeTab === 'notifications' && <NotificationsContent />}
        {activeTab === 'privacy' && <PrivacyContent />}
      </div>
    </div>
  );
}

// ============================================================================
// PLATFORMS CONTENT
// ============================================================================

function PlatformsContent() {
  return (
    <section className="space-y-6 animate-fade-in">
      {/* Section header */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-bold tracking-[0.25em] uppercase text-cyan-500/70">
            Platform Integrations
          </h2>
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/30 to-transparent" />
        <span className="text-[10px] font-mono text-gray-600 tracking-wider">
          SYNC STATUS
        </span>
      </div>

      <div className="flex items-center justify-between ml-6">
        <p className="text-sm text-gray-500">
          Connect your gaming accounts to import libraries, achievements, and playtime data.
        </p>
        <Link
          href="/guide"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg text-xs font-medium text-amber-400 transition-all"
        >
          <Book className="w-3 h-3" />
          Setup Guide
        </Link>
      </div>

      {/* Integration Cards Grid - 2x2 Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PlatformCard color="blue" label="Steam" icon="steam">
          <SteamSettings />
        </PlatformCard>

        <PlatformCard color="blue" label="PlayStation" icon="psn">
          <PsnSettings />
        </PlatformCard>

        <PlatformCard color="green" label="Xbox" icon="xbox">
          <XboxSettings />
        </PlatformCard>

        <PlatformCard color="gray" label="Epic Games" icon="epic">
          <EpicSettings />
        </PlatformCard>
      </div>

      {/* Sync Logs Section */}
      <div className="mt-8">
        {/* Section header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-orange-400" />
            <h2 className="text-xs font-bold tracking-[0.25em] uppercase text-orange-500/70">
              Sync Diagnostics
            </h2>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-orange-500/30 to-transparent" />
          <span className="text-[10px] font-mono text-gray-600 tracking-wider">
            LOGS
          </span>
        </div>

        <SettingsCard color="amber" label="SYNC LOGS" sublabel="DIAGNOSTIC">
          <SyncLogs />
        </SettingsCard>
      </div>

      {/* Library Management Section */}
      <div className="mt-8">
        {/* Section header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-red-400" />
            <h2 className="text-xs font-bold tracking-[0.25em] uppercase text-red-500/70">
              Library Management
            </h2>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-red-500/30 to-transparent" />
          <span className="text-[10px] font-mono text-gray-600 tracking-wider">
            DANGER ZONE
          </span>
        </div>

        <SettingsCard color="red" label="DATA MANAGEMENT" sublabel="CAUTION">
          <LibraryManagement />
        </SettingsCard>
      </div>
    </section>
  );
}

// ============================================================================
// ACCOUNT CONTENT
// ============================================================================

function AccountContent({ profile, userEmail }: { profile: SettingsTabsProps['profile']; userEmail: string }) {
  return (
    <section className="space-y-6 animate-fade-in">
      {/* Section header */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-purple-400" />
          <h2 className="text-xs font-bold tracking-[0.25em] uppercase text-purple-500/70">
            Operator Profile
          </h2>
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-purple-500/30 to-transparent" />
        <span className="text-[10px] font-mono text-gray-600 tracking-wider">
          IDENTITY
        </span>
      </div>

      <SettingsCard color="purple" label="ACCOUNT SETTINGS" sublabel="PROFILE">
        <AccountSettings profile={profile} userEmail={userEmail} />
      </SettingsCard>
    </section>
  );
}

// ============================================================================
// NOTIFICATIONS CONTENT
// ============================================================================

function NotificationsContent() {
  return (
    <section className="space-y-6 animate-fade-in">
      {/* Section header */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-amber-400" />
          <h2 className="text-xs font-bold tracking-[0.25em] uppercase text-amber-500/70">
            Alert Systems
          </h2>
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-amber-500/30 to-transparent" />
        <span className="text-[10px] font-mono text-gray-600 tracking-wider">
          COMMS
        </span>
      </div>

      <SettingsCard color="amber" label="NOTIFICATION PREFERENCES" sublabel="ALERTS">
        <NotificationSettings />
      </SettingsCard>
    </section>
  );
}

// ============================================================================
// PRIVACY CONTENT
// ============================================================================

function PrivacyContent() {
  return (
    <section className="space-y-6 animate-fade-in">
      {/* Section header */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-400" />
          <h2 className="text-xs font-bold tracking-[0.25em] uppercase text-emerald-500/70">
            Security Protocols
          </h2>
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-emerald-500/30 to-transparent" />
        <span className="text-[10px] font-mono text-gray-600 tracking-wider">
          ENCRYPTED
        </span>
      </div>

      <SettingsCard color="emerald" label="PRIVACY SETTINGS" sublabel="SECURITY">
        <PrivacySettings />
      </SettingsCard>
    </section>
  );
}

// ============================================================================
// SETTINGS CARD COMPONENT
// ============================================================================

interface SettingsCardProps {
  children: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'amber' | 'emerald' | 'gray' | 'red';
  label: string;
  sublabel: string;
}

function SettingsCard({ children, color, label, sublabel }: SettingsCardProps) {
  const colorMap = {
    blue: {
      glow: 'from-blue-500/30 via-blue-400/20 to-blue-500/30',
      top: 'via-blue-500',
      text: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    green: {
      glow: 'from-green-500/30 via-green-400/20 to-green-500/30',
      top: 'via-green-500',
      text: 'text-green-400',
      bg: 'bg-green-500/10',
    },
    purple: {
      glow: 'from-purple-500/30 via-purple-400/20 to-purple-500/30',
      top: 'via-purple-500',
      text: 'text-purple-400',
      bg: 'bg-purple-500/10',
    },
    amber: {
      glow: 'from-amber-500/30 via-amber-400/20 to-amber-500/30',
      top: 'via-amber-500',
      text: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
    emerald: {
      glow: 'from-emerald-500/30 via-emerald-400/20 to-emerald-500/30',
      top: 'via-emerald-500',
      text: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    gray: {
      glow: 'from-gray-500/30 via-gray-400/20 to-gray-500/30',
      top: 'via-gray-500',
      text: 'text-gray-400',
      bg: 'bg-gray-500/10',
    },
    red: {
      glow: 'from-red-500/20 via-red-400/10 to-red-500/20',
      top: 'via-red-500/50',
      text: 'text-red-400',
      bg: 'bg-red-500/10',
    },
  };

  const c = colorMap[color];

  return (
    <div className="group relative">
      {/* Glow effect on hover */}
      <div className={`absolute -inset-0.5 bg-gradient-to-r ${c.glow} rounded-xl blur opacity-0 group-hover:opacity-100 transition-all duration-500`} />

      {/* Card container */}
      <div className="relative bg-gradient-to-br from-deep via-abyss to-void border border-steel/50 rounded-xl overflow-hidden">
        {/* Top accent line */}
        <div className={`h-0.5 bg-gradient-to-r from-transparent ${c.top} to-transparent`} />

        {/* Corner brackets */}
        <div className="absolute top-0 left-0 w-4 h-4 border-l border-t border-steel/30 rounded-tl" />
        <div className="absolute top-0 right-0 w-4 h-4 border-r border-t border-steel/30 rounded-tr" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-l border-b border-steel/30 rounded-bl" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-r border-b border-steel/30 rounded-br" />

        {/* Scan line on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent animate-holo-scan" />
        </div>

        {/* Header bar */}
        <div className="relative px-6 py-3 border-b border-steel/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-1.5 h-1.5 rounded-full ${c.text.replace('text-', 'bg-')} animate-pulse`} />
            <span className={`text-[10px] font-bold tracking-[0.2em] uppercase ${c.text}`}>
              {label}
            </span>
          </div>
          <span className="text-[9px] font-mono text-gray-600 tracking-wider">
            {sublabel}
          </span>
        </div>

        {/* Content */}
        <div className="relative p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PLATFORM CARD COMPONENT - Compact version for grid layout
// ============================================================================

interface PlatformCardProps {
  children: React.ReactNode;
  color: 'blue' | 'green' | 'gray';
  label: string;
  icon: 'steam' | 'psn' | 'xbox' | 'epic';
}

function PlatformCard({ children, color, label, icon }: PlatformCardProps) {
  const colorMap = {
    blue: {
      border: 'border-blue-500/30',
      text: 'text-blue-400',
      top: 'via-blue-500',
    },
    green: {
      border: 'border-green-500/30',
      text: 'text-green-400',
      top: 'via-green-500',
    },
    gray: {
      border: 'border-gray-500/30',
      text: 'text-gray-400',
      top: 'via-gray-500',
    },
  };

  const c = colorMap[color];

  const icons = {
    steam: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658a3.387 3.387 0 0 1 1.912-.59c.064 0 .128.003.191.006l2.866-4.158v-.058c0-2.495 2.03-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.091 2.921c0 .054.003.108.003.164 0 1.872-1.521 3.393-3.393 3.393-1.703 0-3.113-1.268-3.346-2.913l-4.603-1.905A11.996 11.996 0 0 0 11.979 24c6.627 0 12-5.373 12-12s-5.372-12-12-12z"/>
      </svg>
    ),
    psn: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8.985 2.596v17.548l3.915 1.261V6.688c0-.69.304-1.151.794-.991.636.181.76.814.76 1.505v5.876c2.441 1.193 4.362-.002 4.362-3.153 0-3.237-1.126-4.675-4.438-5.827-1.307-.448-3.728-1.186-5.393-1.502zm4.656 16.242l6.296-2.275c.715-.258.826-.625.246-.818-.586-.192-1.637-.139-2.357.123l-4.205 1.5v-2.385l.24-.085s1.201-.42 2.913-.615c1.696-.18 3.792.03 5.437.661 1.848.596 2.063 1.473 1.597 2.085-.466.611-1.635 1.04-1.635 1.04l-8.532 3.047v-2.278zM1.004 18.241c-1.513-.453-1.775-1.396-1.08-1.985.654-.556 1.77-.96 1.77-.96l5.572-1.99v2.316l-4.049 1.446c-.715.257-.826.625-.247.817.587.193 1.637.14 2.358-.12l1.938-.707v2.068c-.127.026-.262.047-.39.07-1.765.286-3.655.078-5.872-.955z"/>
      </svg>
    ),
    xbox: (
      <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm0 1.5a6.5 6.5 0 0 1 3.25.87c-.87.87-1.75 1.87-2.5 2.87L8 6l-.75-.76c-.75-1-1.63-2-2.5-2.87A6.5 6.5 0 0 1 8 1.5zM3.37 3.87c.75.75 1.63 1.75 2.38 2.88C4.25 8.5 3 10.75 2.5 12A6.47 6.47 0 0 1 1.5 8c0-1.5.5-3 1.87-4.13zM8 7.5l.75.75c1.12 1.25 2.12 2.75 2.87 4.12a6.45 6.45 0 0 1-7.24 0c.75-1.37 1.75-2.87 2.87-4.12L8 7.5zm4.63-3.63A6.47 6.47 0 0 1 14.5 8c0 1.5-.5 2.87-1.37 4-.5-1.25-1.75-3.5-3.25-5.25.75-1.13 1.63-2.13 2.75-2.88z"/>
      </svg>
    ),
    epic: (
      <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
        <path d="M2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2zm3 4h6v1.5H6.5v2.25H10V9.25H6.5V12H11v1.5H5V4z"/>
      </svg>
    ),
  };

  return (
    <div className="relative bg-deep/50 border border-steel/30 rounded-lg overflow-hidden hover:border-steel/50 transition-colors">
      {/* Top accent line */}
      <div className={`h-px bg-gradient-to-r from-transparent ${c.top} to-transparent`} />

      {/* Header */}
      <div className="px-4 py-2 border-b border-steel/20 flex items-center gap-2">
        <span className={c.text}>{icons[icon]}</span>
        <span className={`text-xs font-semibold ${c.text}`}>{label}</span>
      </div>

      {/* Content */}
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}
