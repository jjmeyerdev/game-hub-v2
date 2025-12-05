'use client';

import { useState } from 'react';
import { Gamepad2, Shield, Bell, User } from 'lucide-react';
import SteamSettings from './SteamSettings';
import PsnSettings from './PsnSettings';
import AccountSettings from './AccountSettings';
import NotificationSettings from './NotificationSettings';
import PrivacySettings from './PrivacySettings';

type TabId = 'platforms' | 'account' | 'notifications' | 'privacy';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  color: string;
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
  { id: 'platforms', label: 'Platforms', icon: <Gamepad2 className="w-4 h-4" />, color: 'cyan' },
  { id: 'account', label: 'Account', icon: <User className="w-4 h-4" />, color: 'cyan' },
  { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" />, color: 'purple' },
  { id: 'privacy', label: 'Privacy', icon: <Shield className="w-4 h-4" />, color: 'emerald' },
];

export default function SettingsTabs({ profile, userEmail }: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('platforms');

  const getTabStyles = (tab: Tab, isActive: boolean) => {
    if (!isActive) {
      return 'text-gray-400 hover:text-white hover:bg-white/5';
    }

    const colorMap = {
      cyan: 'bg-gradient-to-r from-cyan-500/20 to-cyan-600/20 border border-cyan-500/30 text-white',
      purple: 'bg-gradient-to-r from-purple-500/20 to-purple-600/20 border border-purple-500/30 text-white',
      emerald: 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30 text-white',
    };

    return colorMap[tab.color as keyof typeof colorMap];
  };

  const getIconColor = (tab: Tab, isActive: boolean) => {
    if (!isActive) return '';

    const colorMap = {
      cyan: 'text-cyan-400',
      purple: 'text-purple-400',
      emerald: 'text-emerald-400',
    };

    return colorMap[tab.color as keyof typeof colorMap];
  };

  return (
    <>
      {/* Navigation Tabs */}
      <nav className="flex flex-wrap gap-2 mb-8 p-1.5 bg-abyss/50 backdrop-blur-sm border border-steel/30 rounded-xl w-fit">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${getTabStyles(tab, isActive)}`}
            >
              <span className={getIconColor(tab, isActive)}>{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {activeTab === 'platforms' && <PlatformsContent />}
        {activeTab === 'account' && <AccountSettings profile={profile} userEmail={userEmail} />}
        {activeTab === 'notifications' && <NotificationSettings />}
        {activeTab === 'privacy' && <PrivacySettings />}
      </div>
    </>
  );
}

function PlatformsContent() {
  return (
    <section className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="w-1 h-6 bg-gradient-to-b from-cyan-400 to-purple-500 rounded-full" />
            Platform Integrations
          </h2>
          <p className="text-gray-400 mt-1 ml-4">
            Connect your gaming accounts to sync libraries, achievements, and playtime
          </p>
        </div>
      </div>

      {/* Integration Cards Grid */}
      <div className="grid gap-6">
        {/* Steam Card */}
        <div className="group relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/30 via-blue-400/20 to-blue-500/30 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-all duration-500" />
          <div className="relative bg-abyss/90 backdrop-blur-sm border border-steel/50 rounded-2xl overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
            <div className="p-6">
              <SteamSettings />
            </div>
          </div>
        </div>

        {/* PSN Card */}
        <div className="group relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600/30 via-blue-500/20 to-blue-600/30 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-all duration-500" />
          <div className="relative bg-abyss/90 backdrop-blur-sm border border-steel/50 rounded-2xl overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-transparent via-blue-600 to-transparent" />
            <div className="p-6">
              <PsnSettings />
            </div>
          </div>
        </div>

        {/* Coming Soon Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Xbox Card */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500/20 via-green-400/10 to-green-500/20 rounded-2xl blur opacity-0 group-hover:opacity-50 transition-all duration-500" />
            <div className="relative bg-abyss/60 backdrop-blur-sm border border-steel/30 rounded-2xl overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-transparent via-green-500/50 to-transparent" />
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-500/60" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M4.102 21.033C6.211 22.881 8.977 24 12 24c3.026 0 5.789-1.119 7.902-2.967l-5.904-5.904c-.693.46-1.522.721-2.398.721-.874 0-1.703-.26-2.396-.72l-5.102 5.903zM12 6c1.665 0 3.202.616 4.39 1.634l5.576-5.576C19.668.809 16.025 0 12 0 7.973 0 4.329.809 2.031 2.058l5.579 5.576C8.798 6.616 10.335 6 12 6z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-400">Xbox Live</h3>
                    <p className="text-sm text-gray-600">Xbox & PC Game Pass</p>
                  </div>
                  <div className="px-3 py-1 bg-gray-500/10 border border-gray-500/20 rounded-full">
                    <span className="text-xs font-bold text-gray-500 uppercase">Coming Soon</span>
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  Xbox Live integration will sync your Xbox and PC Game Pass library, achievements, and gamerscore.
                </p>
              </div>
            </div>
          </div>

          {/* Epic Card */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-gray-400/20 via-gray-300/10 to-gray-400/20 rounded-2xl blur opacity-0 group-hover:opacity-50 transition-all duration-500" />
            <div className="relative bg-abyss/60 backdrop-blur-sm border border-steel/30 rounded-2xl overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-transparent via-gray-400/50 to-transparent" />
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-500/10 border border-gray-500/20 flex items-center justify-center">
                    <span className="text-xl font-black text-gray-500/60">E</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-400">Epic Games</h3>
                    <p className="text-sm text-gray-600">Epic Games Store</p>
                  </div>
                  <div className="px-3 py-1 bg-gray-500/10 border border-gray-500/20 rounded-full">
                    <span className="text-xs font-bold text-gray-500 uppercase">Coming Soon</span>
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  Epic Games integration will sync your library including free games claimed from the store.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
