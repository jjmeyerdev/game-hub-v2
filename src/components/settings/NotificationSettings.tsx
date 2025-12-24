'use client';

import { useState } from 'react';
import {
  Bell,
  BellRing,
  Mail,
  Smartphone,
  Monitor,
  Gamepad2,
  Trophy,
  Users,
  Clock,
  Volume2,
  VolumeX,
  CheckCircle,
  Loader2,
  Save,
} from 'lucide-react';

interface NotificationCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  channels: {
    email: boolean;
    push: boolean;
    inApp: boolean;
  };
}

export default function NotificationSettings() {
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [masterEnabled, setMasterEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [categories, setCategories] = useState<NotificationCategory[]>([
    {
      id: 'achievements',
      title: 'Achievements Unlocked',
      description: 'Get notified when you unlock new achievements across platforms',
      icon: <Trophy className="w-5 h-5 text-yellow-400" />,
      enabled: true,
      channels: { email: false, push: true, inApp: true },
    },
    {
      id: 'friends',
      title: 'Friend Activity',
      description: 'Updates when friends start playing or achieve milestones',
      icon: <Users className="w-5 h-5 text-purple-400" />,
      enabled: true,
      channels: { email: false, push: true, inApp: true },
    },
    {
      id: 'games',
      title: 'Game Updates',
      description: 'News about games in your library (updates, DLC, sales)',
      icon: <Gamepad2 className="w-5 h-5 text-cyan-400" />,
      enabled: true,
      channels: { email: true, push: false, inApp: true },
    },
    {
      id: 'sessions',
      title: 'Session Reminders',
      description: 'Reminders for scheduled gaming sessions and breaks',
      icon: <Clock className="w-5 h-5 text-emerald-400" />,
      enabled: false,
      channels: { email: false, push: true, inApp: true },
    },
  ]);

  const toggleCategory = (id: string) => {
    setCategories(prev =>
      prev.map(cat =>
        cat.id === id ? { ...cat, enabled: !cat.enabled } : cat
      )
    );
  };

  const toggleChannel = (categoryId: string, channel: 'email' | 'push' | 'inApp') => {
    setCategories(prev =>
      prev.map(cat =>
        cat.id === categoryId
          ? { ...cat, channels: { ...cat.channels, [channel]: !cat.channels[channel] } }
          : cat
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

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Section Header */}
      <div className="relative">
        <div className="flex items-center gap-4 mb-2">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 flex items-center justify-center">
              <Bell className="w-6 h-6 text-purple-400" />
            </div>
            {/* Pulse ring animation */}
            <div className="absolute -inset-2 rounded-xl border border-purple-500/30 animate-ping opacity-20" />
            <div className="absolute -inset-1 bg-purple-500/20 rounded-xl blur-lg -z-10" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[var(--theme-text-primary)] tracking-wide">Notification Settings</h2>
            <p className="text-[var(--theme-text-muted)] text-sm">Control how and when you receive alerts</p>
          </div>
        </div>
        <div className="absolute -bottom-4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
      </div>

      {/* Success Message */}
      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3 animate-fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <p className="text-sm text-emerald-400">Notification preferences saved successfully</p>
        </div>
      )}

      {/* Master Toggle */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 via-cyan-500/10 to-purple-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative bg-[var(--theme-bg-secondary)] backdrop-blur-sm border border-[var(--theme-border)] rounded-2xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl border flex items-center justify-center transition-all duration-300 ${
                  masterEnabled
                    ? 'bg-gradient-to-br from-purple-500/30 to-purple-600/30 border-purple-500/50'
                    : 'bg-[var(--theme-hover-bg)] border-[var(--theme-border)]'
                }`}>
                  {masterEnabled ? (
                    <BellRing className="w-7 h-7 text-purple-400 animate-pulse" />
                  ) : (
                    <Bell className="w-7 h-7 text-[var(--theme-text-subtle)]" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[var(--theme-text-primary)]">All Notifications</h3>
                  <p className="text-sm text-[var(--theme-text-subtle)]">
                    {masterEnabled ? 'Notifications are enabled' : 'All notifications are disabled'}
                  </p>
                </div>
              </div>

              {/* Custom Toggle Switch */}
              <button
                onClick={() => setMasterEnabled(!masterEnabled)}
                className={`relative w-16 h-8 rounded-full transition-all duration-300 ${
                  masterEnabled
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600'
                    : 'bg-[var(--theme-hover-bg)] border border-[var(--theme-border)]'
                }`}
              >
                <div
                  className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-lg transition-all duration-300 flex items-center justify-center ${
                    masterEnabled ? 'left-9' : 'left-1'
                  }`}
                >
                  {masterEnabled ? (
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                  )}
                </div>
                {/* Glow effect when enabled */}
                {masterEnabled && (
                  <div className="absolute inset-0 rounded-full bg-purple-500/30 blur animate-pulse" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sound Toggle */}
      <div className={`relative group transition-opacity duration-300 ${!masterEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/10 to-cyan-500/10 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative bg-[var(--theme-bg-secondary)]/60 backdrop-blur-sm border border-[var(--theme-border)] rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {soundEnabled ? (
                <Volume2 className="w-5 h-5 text-cyan-400" />
              ) : (
                <VolumeX className="w-5 h-5 text-[var(--theme-text-subtle)]" />
              )}
              <div>
                <h4 className="font-semibold text-[var(--theme-text-primary)]">Notification Sounds</h4>
                <p className="text-xs text-[var(--theme-text-subtle)]">Play sounds for in-app notifications</p>
              </div>
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                soundEnabled
                  ? 'bg-cyan-500'
                  : 'bg-[var(--theme-hover-bg)] border border-[var(--theme-border)]'
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300 ${
                  soundEnabled ? 'left-6' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Notification Categories */}
      <div className={`space-y-4 transition-opacity duration-300 ${!masterEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <h3 className="text-lg font-bold text-[var(--theme-text-primary)] flex items-center gap-3">
          <span className="w-1 h-5 bg-gradient-to-b from-purple-400 to-cyan-500 rounded-full" />
          Notification Types
        </h3>

        <div className="grid gap-4">
          {categories.map((category, index) => (
            <div
              key={category.id}
              className="relative group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/10 via-transparent to-cyan-500/10 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className={`relative bg-[var(--theme-bg-secondary)] backdrop-blur-sm border rounded-xl overflow-hidden transition-all duration-300 ${
                category.enabled ? 'border-[var(--theme-border)]' : 'border-[var(--theme-border)]/50'
              }`}>
                {/* Top accent line */}
                <div className={`h-0.5 transition-all duration-300 ${
                  category.enabled
                    ? 'bg-gradient-to-r from-transparent via-purple-500/50 to-transparent'
                    : 'bg-transparent'
                }`} />

                <div className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-lg border flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                      category.enabled
                        ? 'bg-[var(--theme-hover-bg)] border-[var(--theme-border)]'
                        : 'bg-[var(--theme-hover-bg)]/50 border-[var(--theme-border)]/50'
                    }`}>
                      {category.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className={`font-semibold transition-colors ${
                          category.enabled ? 'text-[var(--theme-text-primary)]' : 'text-[var(--theme-text-muted)]'
                        }`}>
                          {category.title}
                        </h4>

                        {/* Category Toggle */}
                        <button
                          onClick={() => toggleCategory(category.id)}
                          className={`relative w-10 h-5 rounded-full transition-all duration-300 ${
                            category.enabled
                              ? 'bg-purple-500'
                              : 'bg-[var(--theme-hover-bg)] border border-[var(--theme-border)]'
                          }`}
                        >
                          <div
                            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${
                              category.enabled ? 'left-5' : 'left-0.5'
                            }`}
                          />
                        </button>
                      </div>

                      <p className={`text-sm mb-4 transition-colors ${
                        category.enabled ? 'text-[var(--theme-text-muted)]' : 'text-[var(--theme-text-subtle)]'
                      }`}>
                        {category.description}
                      </p>

                      {/* Channel toggles */}
                      <div className={`flex gap-2 transition-opacity ${
                        category.enabled ? 'opacity-100' : 'opacity-30'
                      }`}>
                        {/* Email */}
                        <button
                          onClick={() => toggleChannel(category.id, 'email')}
                          disabled={!category.enabled}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            category.channels.email
                              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                              : 'bg-[var(--theme-hover-bg)] text-[var(--theme-text-muted)] border border-[var(--theme-border)] hover:border-[var(--theme-border-hover)]'
                          }`}
                        >
                          <Mail className="w-3.5 h-3.5" />
                          Email
                        </button>

                        {/* Push */}
                        <button
                          onClick={() => toggleChannel(category.id, 'push')}
                          disabled={!category.enabled}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            category.channels.push
                              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                              : 'bg-[var(--theme-hover-bg)] text-[var(--theme-text-muted)] border border-[var(--theme-border)] hover:border-[var(--theme-border-hover)]'
                          }`}
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          Push
                        </button>

                        {/* In-App */}
                        <button
                          onClick={() => toggleChannel(category.id, 'inApp')}
                          disabled={!category.enabled}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            category.channels.inApp
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-[var(--theme-hover-bg)] text-[var(--theme-text-muted)] border border-[var(--theme-border)] hover:border-[var(--theme-border-hover)]'
                          }`}
                        >
                          <Monitor className="w-3.5 h-3.5" />
                          In-App
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quiet Hours */}
      <div className={`relative group transition-opacity duration-300 ${!masterEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 via-purple-500/10 to-cyan-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative bg-[var(--theme-bg-secondary)] backdrop-blur-sm border border-[var(--theme-border)] rounded-2xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
          <div className="p-6">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 border border-cyan-500/30 flex items-center justify-center">
                <Clock className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--theme-text-primary)]">Quiet Hours</h3>
                <p className="text-sm text-[var(--theme-text-subtle)]">Pause notifications during specific times</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[var(--theme-text-muted)]">Start Time</label>
                <div className="relative">
                  <input
                    type="time"
                    defaultValue="22:00"
                    className="w-full px-4 py-3 bg-[var(--theme-hover-bg)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text-primary)] focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[var(--theme-text-muted)]">End Time</label>
                <div className="relative">
                  <input
                    type="time"
                    defaultValue="08:00"
                    className="w-full px-4 py-3 bg-[var(--theme-hover-bg)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text-primary)] focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  />
                </div>
              </div>
            </div>

            <p className="mt-4 text-xs text-[var(--theme-text-subtle)] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-500/50" />
              Notifications will be silently delivered during quiet hours
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="relative px-6 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 rounded-xl font-semibold text-[var(--theme-bg-primary)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 overflow-hidden group/btn"
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
              Save Preferences
            </>
          )}
        </button>
      </div>
    </div>
  );
}
