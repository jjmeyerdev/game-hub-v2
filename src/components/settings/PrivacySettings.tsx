'use client';

import { useState, useEffect } from 'react';
import {
  Shield,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Users,
  Activity,
  Download,
  Trash2,
  CheckCircle,
  Loader2,
  Save,
  AlertTriangle,
  FileText,
  Database,
  Clock,
} from 'lucide-react';
import { getSteamProfile } from '@/lib/actions/steam/profile';
import { getPsnProfile } from '@/lib/actions/psn/profile';
import { getXboxProfile } from '@/lib/actions/xbox/profile';
import { getEpicProfile } from '@/lib/actions/epic';

type VisibilityLevel = 'public' | 'friends' | 'private';

interface PrivacySetting {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  visibility: VisibilityLevel;
}

interface ConnectedPlatform {
  name: string;
  enabled: boolean;
  color: string;
}

export default function PrivacySettings() {
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [connectedPlatforms, setConnectedPlatforms] = useState<ConnectedPlatform[]>([
    { name: 'Steam', enabled: false, color: 'blue' },
    { name: 'PlayStation Network', enabled: false, color: 'blue' },
    { name: 'Xbox Live', enabled: false, color: 'green' },
    { name: 'Epic Games', enabled: false, color: 'gray' },
  ]);
  const [loadingPlatforms, setLoadingPlatforms] = useState(true);

  useEffect(() => {
    async function loadConnectedPlatforms() {
      setLoadingPlatforms(true);
      try {
        const [steam, psn, xbox, epic] = await Promise.all([
          getSteamProfile(),
          getPsnProfile(),
          getXboxProfile(),
          getEpicProfile(),
        ]);

        setConnectedPlatforms([
          { name: 'Steam', enabled: !!steam?.steam_id, color: 'blue' },
          { name: 'PlayStation Network', enabled: !!psn?.psn_online_id, color: 'blue' },
          { name: 'Xbox Live', enabled: !!xbox?.xbox_gamertag, color: 'green' },
          { name: 'Epic Games', enabled: !!epic?.epic_display_name, color: 'gray' },
        ]);
      } catch (error) {
        console.error('Failed to load connected platforms:', error);
      } finally {
        setLoadingPlatforms(false);
      }
    }

    loadConnectedPlatforms();
  }, []);

  const [settings, setSettings] = useState<PrivacySetting[]>([
    {
      id: 'profile',
      title: 'Profile Visibility',
      description: 'Control who can see your profile and gaming stats',
      icon: <Eye className="w-5 h-5 text-emerald-400" />,
      visibility: 'public',
    },
    {
      id: 'library',
      title: 'Game Library',
      description: 'Who can see the games you own and play',
      icon: <Database className="w-5 h-5 text-cyan-400" />,
      visibility: 'friends',
    },
    {
      id: 'activity',
      title: 'Activity Status',
      description: 'Show when you are online and what you are playing',
      icon: <Activity className="w-5 h-5 text-purple-400" />,
      visibility: 'friends',
    },
    {
      id: 'achievements',
      title: 'Achievements',
      description: 'Who can see your unlocked achievements and progress',
      icon: <Shield className="w-5 h-5 text-yellow-400" />,
      visibility: 'public',
    },
    {
      id: 'playtime',
      title: 'Playtime Statistics',
      description: 'Display your total hours played per game',
      icon: <Clock className="w-5 h-5 text-pink-400" />,
      visibility: 'private',
    },
  ]);

  const visibilityOptions: { value: VisibilityLevel; label: string; icon: React.ReactNode; color: string }[] = [
    { value: 'public', label: 'Public', icon: <Globe className="w-4 h-4" />, color: 'emerald' },
    { value: 'friends', label: 'Friends', icon: <Users className="w-4 h-4" />, color: 'purple' },
    { value: 'private', label: 'Private', icon: <Lock className="w-4 h-4" />, color: 'cyan' },
  ];

  const updateVisibility = (id: string, visibility: VisibilityLevel) => {
    setSettings(prev =>
      prev.map(setting =>
        setting.id === id ? { ...setting, visibility } : setting
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1200));
    setSaving(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleDownloadData = async () => {
    setDownloading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setDownloading(false);
    setShowDataModal(false);
  };

  const getVisibilityColor = (visibility: VisibilityLevel) => {
    switch (visibility) {
      case 'public':
        return 'emerald';
      case 'friends':
        return 'purple';
      case 'private':
        return 'cyan';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Section Header */}
      <div className="relative">
        <div className="flex items-center gap-4 mb-2">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30 flex items-center justify-center">
              <Shield className="w-6 h-6 text-emerald-400" />
            </div>
            {/* Shield glow effect */}
            <div className="absolute -inset-1 bg-emerald-500/20 rounded-xl blur-lg -z-10" />
            {/* Orbiting dot */}
            <div className="absolute -inset-3">
              <div className="w-2 h-2 bg-emerald-400 rounded-full absolute animate-[spin_3s_linear_infinite]" style={{ top: '50%', left: '0', transform: 'translateY(-50%)' }} />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[var(--theme-text-primary)] tracking-wide">Privacy Settings</h2>
            <p className="text-[var(--theme-text-muted)] text-sm">Control your data and who sees your gaming activity</p>
          </div>
        </div>
        <div className="absolute -bottom-4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
      </div>

      {/* Success Message */}
      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3 animate-fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <p className="text-sm text-emerald-400">Privacy settings saved successfully</p>
        </div>
      )}

      {/* Privacy Overview Card */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 via-cyan-500/10 to-emerald-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative bg-[var(--theme-bg-secondary)] backdrop-blur-sm border border-[var(--theme-border)] rounded-2xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
          <div className="p-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              {visibilityOptions.map((option) => {
                const count = settings.filter(s => s.visibility === option.value).length;
                const colorClasses = {
                  emerald: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
                  purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
                  cyan: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
                };
                return (
                  <div
                    key={option.value}
                    className={`p-4 rounded-xl border ${colorClasses[option.color as keyof typeof colorClasses]}`}
                  >
                    <div className="flex items-center justify-center gap-2 mb-2">
                      {option.icon}
                      <span className="font-semibold">{option.label}</span>
                    </div>
                    <div className="text-2xl font-bold">{count}</div>
                    <div className="text-xs opacity-60">settings</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Controls */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-[var(--theme-text-primary)] flex items-center gap-3">
          <span className="w-1 h-5 bg-gradient-to-b from-emerald-400 to-cyan-500 rounded-full" />
          Visibility Controls
        </h3>

        <div className="grid gap-4">
          {settings.map((setting, index) => {
            const color = getVisibilityColor(setting.visibility);
            return (
              <div
                key={setting.id}
                className="relative group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`absolute -inset-0.5 bg-gradient-to-r from-${color}-500/10 via-transparent to-${color}-500/10 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="relative bg-[var(--theme-bg-secondary)] backdrop-blur-sm border border-[var(--theme-border)] rounded-xl overflow-hidden">
                  <div className={`h-0.5 bg-gradient-to-r from-transparent via-${color}-500/50 to-transparent`} />
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="w-10 h-10 rounded-lg bg-[var(--theme-hover-bg)] border border-[var(--theme-border)] flex items-center justify-center flex-shrink-0">
                        {setting.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-[var(--theme-text-primary)] mb-1">{setting.title}</h4>
                        <p className="text-sm text-[var(--theme-text-muted)] mb-4">{setting.description}</p>

                        {/* Visibility Selector */}
                        <div className="flex gap-2">
                          {visibilityOptions.map((option) => {
                            const isSelected = setting.visibility === option.value;
                            const bgColors = {
                              emerald: isSelected ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : '',
                              purple: isSelected ? 'bg-purple-500/20 border-purple-500/50 text-purple-400' : '',
                              cyan: isSelected ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' : '',
                            };
                            return (
                              <button
                                key={option.value}
                                onClick={() => updateVisibility(setting.id, option.value)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                                  isSelected
                                    ? bgColors[option.color as keyof typeof bgColors]
                                    : 'bg-[var(--theme-hover-bg)] text-[var(--theme-text-muted)] border-[var(--theme-border)] hover:border-[var(--theme-border-hover)] hover:text-[var(--theme-text-primary)]'
                                }`}
                              >
                                {option.icon}
                                {option.label}
                                {isSelected && (
                                  <CheckCircle className="w-3 h-3 ml-1" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Current Status Indicator */}
                      <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                        setting.visibility === 'public'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : setting.visibility === 'friends'
                          ? 'bg-purple-500/10 text-purple-400'
                          : 'bg-cyan-500/10 text-cyan-400'
                      }`}>
                        {setting.visibility === 'public' ? (
                          <Eye className="w-3 h-3" />
                        ) : setting.visibility === 'friends' ? (
                          <Users className="w-3 h-3" />
                        ) : (
                          <EyeOff className="w-3 h-3" />
                        )}
                        {setting.visibility.charAt(0).toUpperCase() + setting.visibility.slice(1)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Data Management Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-[var(--theme-text-primary)] flex items-center gap-3">
          <span className="w-1 h-5 bg-gradient-to-b from-cyan-400 to-purple-500 rounded-full" />
          Data Management
        </h3>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Download Data Card */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 via-transparent to-cyan-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative bg-[var(--theme-bg-secondary)] backdrop-blur-sm border border-[var(--theme-border)] rounded-xl overflow-hidden h-full">
              <div className="h-0.5 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
              <div className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                    <Download className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[var(--theme-text-primary)]">Export Your Data</h4>
                    <p className="text-xs text-[var(--theme-text-subtle)]">Download a copy of your data</p>
                  </div>
                </div>
                <p className="text-sm text-[var(--theme-text-muted)] mb-4">
                  Get a complete export of your gaming library, achievements, playtime, and preferences.
                </p>
                <button
                  onClick={() => setShowDataModal(true)}
                  className="w-full px-4 py-2.5 bg-[var(--theme-hover-bg)] border border-[var(--theme-border)] hover:border-cyan-500/50 hover:bg-cyan-500/10 rounded-lg font-medium text-[var(--theme-text-muted)] hover:text-cyan-400 transition-all flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Request Data Export
                </button>
              </div>
            </div>
          </div>

          {/* Delete Data Card */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500/20 via-transparent to-red-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative bg-[var(--theme-bg-secondary)] backdrop-blur-sm border border-red-500/20 rounded-xl overflow-hidden h-full">
              <div className="h-0.5 bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
              <div className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-red-400">Delete All Data</h4>
                    <p className="text-xs text-[var(--theme-text-subtle)]">Permanently remove your data</p>
                  </div>
                </div>
                <p className="text-sm text-[var(--theme-text-muted)] mb-4">
                  Request deletion of all your personal data from our servers. This action cannot be undone.
                </p>
                <button className="w-full px-4 py-2.5 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 hover:border-red-500/50 rounded-lg font-medium text-red-400 transition-all flex items-center justify-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Request Data Deletion
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Third-Party Connections */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 via-emerald-500/10 to-purple-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative bg-[var(--theme-bg-secondary)] backdrop-blur-sm border border-[var(--theme-border)] rounded-2xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
          <div className="p-6">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 flex items-center justify-center">
                <Globe className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--theme-text-primary)]">Third-Party Data Sharing</h3>
                <p className="text-sm text-[var(--theme-text-subtle)]">Control how your data is shared with connected platforms</p>
              </div>
            </div>

            <div className="space-y-3">
              {loadingPlatforms ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 text-[var(--theme-text-muted)] animate-spin" />
                </div>
              ) : connectedPlatforms.map((platform) => (
                <div
                  key={platform.name}
                  className="flex items-center justify-between p-4 bg-[var(--theme-hover-bg)] border border-[var(--theme-border)] rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${platform.enabled ? 'bg-emerald-500' : 'bg-gray-500'}`} />
                    <span className={`font-medium ${platform.enabled ? 'text-[var(--theme-text-primary)]' : 'text-[var(--theme-text-muted)]'}`}>
                      {platform.name}
                    </span>
                    {!platform.enabled && (
                      <span className="text-xs text-[var(--theme-text-subtle)]">(Not connected)</span>
                    )}
                  </div>
                  {platform.enabled && (
                    <span className="text-xs text-emerald-400">Connected</span>
                  )}
                </div>
              ))}
            </div>

            <p className="mt-4 text-xs text-[var(--theme-text-muted)] flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              Your data is encrypted and only shared with your explicit consent
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="relative px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 rounded-xl font-semibold text-[var(--theme-bg-primary)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 overflow-hidden group/btn"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Privacy Settings
            </>
          )}
        </button>
      </div>

      {/* Data Export Modal */}
      {showDataModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-[var(--theme-bg-primary)]/80 backdrop-blur-sm" onClick={() => setShowDataModal(false)} />
          <div className="relative bg-[var(--theme-bg-secondary)] border border-cyan-500/30 rounded-2xl p-6 max-w-md w-full animate-modal-slide-in">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                <Download className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[var(--theme-text-primary)]">Export Your Data</h3>
                <p className="text-sm text-[var(--theme-text-subtle)]">Choose what to include</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {[
                { label: 'Profile Information', checked: true },
                { label: 'Game Library', checked: true },
                { label: 'Achievements & Progress', checked: true },
                { label: 'Playtime Statistics', checked: true },
                { label: 'Settings & Preferences', checked: false },
              ].map((item) => (
                <label
                  key={item.label}
                  className="flex items-center gap-3 p-3 bg-[var(--theme-hover-bg)] border border-[var(--theme-border)] rounded-lg cursor-pointer hover:border-cyan-500/30 transition-colors"
                >
                  <input
                    type="checkbox"
                    defaultChecked={item.checked}
                    className="w-4 h-4 rounded border-[var(--theme-border)] bg-[var(--theme-bg-tertiary)] text-cyan-500 focus:ring-cyan-500/50"
                  />
                  <span className="text-sm text-[var(--theme-text-muted)]">{item.label}</span>
                </label>
              ))}
            </div>

            <p className="text-xs text-[var(--theme-text-subtle)] mb-6 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              Data will be exported as a JSON file
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDataModal(false)}
                className="flex-1 px-5 py-2.5 bg-[var(--theme-hover-bg)] border border-[var(--theme-border)] hover:border-[var(--theme-border-hover)] rounded-xl font-medium text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDownloadData}
                disabled={downloading}
                className="flex-1 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 rounded-xl font-semibold text-[var(--theme-bg-primary)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {downloading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Preparing...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
