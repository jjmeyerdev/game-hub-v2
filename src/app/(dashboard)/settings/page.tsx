import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import SettingsTabs from '@/components/settings/SettingsTabs';
import { Settings, User, Shield, Terminal } from 'lucide-react';

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch profile for user info display
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, avatar_url')
    .eq('id', user.id)
    .single();

  return (
    <div className="relative min-h-screen bg-theme-primary">
      {/* Ambient glow blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-violet-500/3 rounded-full blur-[120px] animate-breathe" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-cyan-500/3 rounded-full blur-[120px] animate-breathe" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <header className="relative border-b border-theme">
        {/* Top accent line */}
        <div className="absolute top-0 left-8 right-8 h-px bg-linear-to-r from-transparent via-violet-500/30 to-transparent" />

        <div className="px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Left: Page title */}
            <div className="flex items-center gap-4">
              {/* Icon with HUD corners */}
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                  <Settings className="w-6 h-6 text-violet-400" />
                </div>
                {/* HUD corners */}
                <div className="absolute -top-1 -left-1 w-2 h-2 border-l-2 border-t-2 border-violet-400/50" />
                <div className="absolute -top-1 -right-1 w-2 h-2 border-r-2 border-t-2 border-violet-400/50" />
                <div className="absolute -bottom-1 -left-1 w-2 h-2 border-l-2 border-b-2 border-violet-400/50" />
                <div className="absolute -bottom-1 -right-1 w-2 h-2 border-r-2 border-b-2 border-violet-400/50" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono text-theme-subtle uppercase tracking-wider">// SYSTEM_CONFIG</span>
                </div>
                <h1 className="text-2xl font-bold text-theme-primary uppercase tracking-wide font-family-display">
                  SETTINGS
                </h1>
              </div>
            </div>

            {/* Right: User info */}
            <div className="flex items-center gap-3">
              {/* Security badge */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-[10px] font-mono font-medium text-emerald-400 uppercase tracking-wider">Encrypted</span>
              </div>

              {/* User card */}
              <div className="relative flex items-center gap-3 px-4 py-2 bg-theme-secondary border border-theme rounded-xl hover:border-theme-hover transition-colors">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name || 'User'}
                    className="w-8 h-8 rounded-lg border border-theme object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-linear-to-br from-violet-500/20 to-cyan-500/20 border border-theme flex items-center justify-center">
                    <User className="w-4 h-4 text-theme-muted" />
                  </div>
                )}
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-theme-primary">{profile?.full_name || 'Operator'}</p>
                  <p className="text-[11px] font-mono text-theme-subtle">{user.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8">
        {/* Tabs and Content */}
        <SettingsTabs
          profile={profile}
          userEmail={user.email || ''}
        />

        {/* Footer */}
        <footer className="relative mt-12 pt-6 border-t border-theme">
          {/* HUD corners */}
          <div className="absolute top-0 left-0 w-6 h-6 border-l border-t border-theme" />
          <div className="absolute top-0 right-0 w-6 h-6 border-r border-t border-theme" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Terminal className="w-3.5 h-3.5 text-theme-subtle" />
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <p className="text-[11px] font-mono text-theme-subtle uppercase tracking-wider">
                  Game Hub v2.0.0-pre-alpha <span className="text-theme-subtle">•</span> All systems operational
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-3 h-3 text-theme-subtle" />
              <p className="text-[10px] font-mono text-theme-subtle uppercase tracking-wider">
                End-to-end encrypted
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
