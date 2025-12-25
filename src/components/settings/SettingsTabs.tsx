'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Gamepad2, Shield, Bell, User, ChevronRight, Database, Terminal, Book, Cpu } from 'lucide-react';
import SteamSettings from './SteamSettings';
import PsnSettings from './PsnSettings';
import XboxSettings from './XboxSettings';
import EpicSettings from './EpicSettings';
import AccountSettings from './AccountSettings';
import NotificationSettings from './NotificationSettings';
import PrivacySettings from './PrivacySettings';
import LibraryManagement from './LibraryManagement';
import SyncLogs from './SyncLogs';
import {
  SteamLogo,
  PlayStationLogo,
  XboxLogo,
  EpicLogo,
  NintendoLogo,
  GOGLogo,
  EALogo,
} from '@/components/icons/PlatformLogos';

type TabId = 'platforms' | 'account' | 'notifications' | 'privacy';

interface Tab {
  id: TabId;
  label: string;
  terminalLabel: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'cyan' | 'violet' | 'amber' | 'emerald';
}

interface SettingsTabsProps {
  profile: {
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
  userEmail: string;
}

const tabsConfig: Record<TabId, Tab> = {
  platforms: {
    id: 'platforms',
    label: 'Platforms',
    terminalLabel: 'PLATFORM_LINKS',
    description: 'Link gaming accounts',
    icon: Gamepad2,
    color: 'cyan'
  },
  account: {
    id: 'account',
    label: 'Account',
    terminalLabel: 'USER_IDENTITY',
    description: 'Profile & identity',
    icon: User,
    color: 'violet'
  },
  notifications: {
    id: 'notifications',
    label: 'Notifications',
    terminalLabel: 'ALERT_CONFIG',
    description: 'Alerts & updates',
    icon: Bell,
    color: 'amber'
  },
  privacy: {
    id: 'privacy',
    label: 'Privacy',
    terminalLabel: 'SECURITY_LAYER',
    description: 'Security settings',
    icon: Shield,
    color: 'emerald'
  },
};

// Derive array for iteration while keeping Record for type-safe lookups
const tabs = Object.values(tabsConfig);

const colorConfig = {
  cyan: {
    text: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    indicator: 'bg-cyan-400',
    glow: 'shadow-cyan-500/20',
  },
  violet: {
    text: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    indicator: 'bg-violet-400',
    glow: 'shadow-violet-500/20',
  },
  amber: {
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    indicator: 'bg-amber-400',
    glow: 'shadow-amber-500/20',
  },
  emerald: {
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    indicator: 'bg-emerald-400',
    glow: 'shadow-emerald-500/20',
  },
};

export default function SettingsTabs({ profile, userEmail }: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('platforms');
  const activeTabData = tabsConfig[activeTab];
  const colors = colorConfig[activeTabData.color];

  return (
    <div className="space-y-8">
      {/* Navigation Tabs */}
      <nav className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.id;
          const c = colorConfig[tab.color];
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                relative group overflow-hidden rounded-xl p-4 transition-all duration-200
                ${isActive
                  ? `bg-theme-secondary border ${c.border}`
                  : 'bg-theme-hover border border-theme hover:border-theme hover:bg-theme-hover'
                }
              `}
              style={{ animation: `fadeIn 0.3s ease-out ${index * 0.05}s both` }}
            >
              {/* HUD corners on active */}
              {isActive && (
                <>
                  <div className={`absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 ${c.border}`} />
                  <div className={`absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 ${c.border}`} />
                  <div className={`absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 ${c.border}`} />
                  <div className={`absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 ${c.border}`} />
                </>
              )}

              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`
                  relative p-2 rounded-lg transition-all duration-200
                  ${isActive ? `${c.bg} ${c.border} border` : 'bg-theme-hover border border-theme'}
                `}>
                  <Icon className={`w-4 h-4 ${isActive ? c.text : 'text-theme-muted'}`} />
                  {isActive && (
                    <div className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 ${c.indicator} rounded-full animate-pulse`} />
                  )}
                </div>

                {/* Text */}
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-semibold text-sm uppercase tracking-wide font-family-display ${isActive ? 'text-theme-primary' : 'text-theme-muted'}`}>
                      {tab.label}
                    </h3>
                    {isActive && <ChevronRight className={`w-3 h-3 ${c.text}`} />}
                  </div>
                  <p className="text-[10px] font-mono text-theme-subtle mt-0.5 uppercase tracking-wider">
                    {isActive ? `// ${tab.terminalLabel}` : tab.description}
                  </p>
                </div>
              </div>

              {/* Active indicator bar */}
              {isActive && (
                <div className={`absolute bottom-0 left-4 right-4 h-0.5 ${c.indicator} rounded-full`} />
              )}
            </button>
          );
        })}
      </nav>

      {/* Tab Content */}
      <div className="min-h-[500px]" style={{ animation: 'fadeIn 0.3s ease-out' }}>
        {activeTab === 'platforms' && <PlatformsContent />}
        {activeTab === 'account' && <AccountContent profile={profile} userEmail={userEmail} />}
        {activeTab === 'notifications' && <NotificationsContent />}
        {activeTab === 'privacy' && <PrivacyContent />}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// PLATFORMS CONTENT
// ============================================================================

function PlatformsContent() {
  return (
    <section className="space-y-8">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-theme-muted uppercase tracking-wide font-family-display">
            Platform Integrations
          </h2>
          <div className="h-px flex-1 bg-border w-20" />
        </div>
        <Link
          href="/guide"
          className="group flex items-center gap-1.5 px-3 py-1.5 bg-theme-hover hover:bg-cyan-500/10 border border-theme hover:border-cyan-500/30 rounded-lg text-[10px] font-mono font-medium text-theme-muted hover:text-cyan-400 transition-all uppercase tracking-wider"
        >
          <Book className="w-3 h-3" />
          Setup Guide
          <ChevronRight className="w-3 h-3 opacity-0 -ml-1 group-hover:opacity-100 group-hover:ml-0 transition-all" />
        </Link>
      </div>

      <p className="text-sm text-theme-muted">
        Connect your gaming accounts to import libraries, achievements, and playtime data.
      </p>

      {/* Integration Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PlatformCard color="cyan" label="Steam" icon="steam">
          <SteamSettings />
        </PlatformCard>

        <PlatformCard color="blue" label="PlayStation" icon="psn">
          <PsnSettings />
        </PlatformCard>

        <PlatformCard color="emerald" label="Xbox" icon="xbox">
          <XboxSettings />
        </PlatformCard>

        <PlatformCard color="gray" label="Epic Games" icon="epic">
          <EpicSettings />
        </PlatformCard>
      </div>

      {/* Sync Logs Section */}
      <div className="pt-4">
        <div className="flex items-center gap-3 mb-4">
          <Terminal className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-theme-muted uppercase tracking-wide font-family-display">
            Sync Diagnostics
          </h3>
          <span className="text-[10px] font-mono text-theme-subtle">// SYNC_LOGS</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <SettingsCard color="amber">
          <SyncLogs />
        </SettingsCard>
      </div>

      {/* Library Management Section */}
      <div className="pt-4">
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-4 h-4 text-red-400" />
          <h3 className="text-sm font-semibold text-theme-muted uppercase tracking-wide font-family-display">
            Library Management
          </h3>
          <div className="h-px flex-1 bg-border" />
          <div className="flex items-center gap-2 px-2 py-1 bg-red-500/10 border border-red-500/20 rounded">
            <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
            <span className="text-[10px] font-mono font-medium text-red-400 uppercase tracking-wider">Danger Zone</span>
          </div>
        </div>

        <SettingsCard color="red">
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
    <section className="space-y-6">
      {/* Section header */}
      <div className="flex items-center gap-3">
        <User className="w-4 h-4 text-violet-400" />
        <h2 className="text-sm font-semibold text-theme-muted uppercase tracking-wide font-family-display">
          Account Settings
        </h2>
        <span className="text-[10px] font-mono text-theme-subtle">// USER_PROFILE</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <SettingsCard color="violet">
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
    <section className="space-y-6">
      {/* Section header */}
      <div className="flex items-center gap-3">
        <Bell className="w-4 h-4 text-amber-400" />
        <h2 className="text-sm font-semibold text-theme-muted uppercase tracking-wide font-family-display">
          Notification Preferences
        </h2>
        <span className="text-[10px] font-mono text-theme-subtle">// ALERT_CONFIG</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <SettingsCard color="amber">
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
    <section className="space-y-6">
      {/* Section header */}
      <div className="flex items-center gap-3">
        <Shield className="w-4 h-4 text-emerald-400" />
        <h2 className="text-sm font-semibold text-theme-muted uppercase tracking-wide font-family-display">
          Privacy & Security
        </h2>
        <span className="text-[10px] font-mono text-theme-subtle">// SECURITY_LAYER</span>
        <div className="h-px flex-1 bg-border" />
        <div className="flex items-center gap-2 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded">
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">Protected</span>
        </div>
      </div>

      <SettingsCard color="emerald">
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
  color: 'cyan' | 'blue' | 'emerald' | 'gray' | 'violet' | 'amber' | 'red';
}

function SettingsCard({ children, color }: SettingsCardProps) {
  const colorMap = {
    cyan: { border: 'border-cyan-500/20', corner: 'border-cyan-400/30' },
    blue: { border: 'border-blue-500/20', corner: 'border-blue-400/30' },
    emerald: { border: 'border-emerald-500/20', corner: 'border-emerald-400/30' },
    gray: { border: 'border-theme', corner: 'border-theme' },
    violet: { border: 'border-violet-500/20', corner: 'border-violet-400/30' },
    amber: { border: 'border-amber-500/20', corner: 'border-amber-400/30' },
    red: { border: 'border-red-500/20', corner: 'border-red-400/30' },
  };

  const c = colorMap[color];

  return (
    <div className={`relative bg-theme-secondary border ${c.border} rounded-xl p-6 overflow-hidden`}>
      {/* HUD corners */}
      <div className={`absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 ${c.corner}`} />
      <div className={`absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 ${c.corner}`} />
      <div className={`absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 ${c.corner}`} />
      <div className={`absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 ${c.corner}`} />

      {children}
    </div>
  );
}

// ============================================================================
// PLATFORM CARD COMPONENT
// ============================================================================

interface PlatformCardProps {
  children: React.ReactNode;
  color: 'cyan' | 'blue' | 'emerald' | 'gray';
  label: string;
  icon: 'steam' | 'psn' | 'xbox' | 'epic' | 'nintendo' | 'gog' | 'ea';
}

function PlatformCard({ children, color, label, icon }: PlatformCardProps) {
  const colorMap = {
    cyan: {
      border: 'border-cyan-500/20',
      hoverBorder: 'hover:border-cyan-500/40',
      text: 'text-cyan-400',
      headerBg: 'bg-cyan-500/5',
      corner: 'border-cyan-400/30',
    },
    blue: {
      border: 'border-blue-500/20',
      hoverBorder: 'hover:border-blue-500/40',
      text: 'text-blue-400',
      headerBg: 'bg-blue-500/5',
      corner: 'border-blue-400/30',
    },
    emerald: {
      border: 'border-emerald-500/20',
      hoverBorder: 'hover:border-emerald-500/40',
      text: 'text-emerald-400',
      headerBg: 'bg-emerald-500/5',
      corner: 'border-emerald-400/30',
    },
    gray: {
      border: 'border-theme',
      hoverBorder: 'hover:border-theme',
      text: 'text-theme-muted',
      headerBg: 'bg-theme-hover',
      corner: 'border-theme',
    },
  };

  const c = colorMap[color];

  const IconComponent = {
    steam: SteamLogo,
    psn: PlayStationLogo,
    xbox: XboxLogo,
    epic: EpicLogo,
    nintendo: NintendoLogo,
    gog: GOGLogo,
    ea: EALogo,
  }[icon];

  return (
    <div className={`group relative bg-theme-secondary border ${c.border} ${c.hoverBorder} rounded-xl overflow-hidden transition-all duration-200`}>
      {/* HUD corners */}
      <div className={`absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 ${c.corner} opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className={`absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 ${c.corner} opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className={`absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 ${c.corner} opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className={`absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 ${c.corner} opacity-0 group-hover:opacity-100 transition-opacity`} />

      {/* Header */}
      <div className={`relative px-4 py-3 ${c.headerBg} border-b border-theme flex items-center gap-2`}>
        <IconComponent size="sm" className={c.text} />
        <span className={`text-sm font-semibold uppercase tracking-wide font-family-display ${c.text}`}>
          {label}
        </span>
        <div className="flex-1" />
        <span className="text-[9px] font-mono text-theme-subtle uppercase tracking-wider">
          // {icon.toUpperCase()}_API
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}
