import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import SettingsTabs from '@/components/settings/SettingsTabs';
import { Settings, User, Shield } from 'lucide-react';

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
    <div className="relative min-h-screen">
      {/* Background Effects - matching dashboard */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `
            linear-gradient(rgba(0, 217, 255, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 217, 255, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }} />

        {/* Radial gradient overlays */}
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-cyan-500/3 to-transparent rounded-full" />
      </div>

      {/* Header - Command Center Style */}
      <header className="relative bg-gradient-to-r from-void via-abyss to-void border-b border-cyan-500/20 overflow-hidden">
        {/* Tactical grid background */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `
            linear-gradient(rgba(0, 217, 255, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 217, 255, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }} />

        {/* Horizontal scan line */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute w-full h-[2px] bg-gradient-to-r from-transparent via-purple-400/40 to-transparent animate-command-scan" />
        </div>

        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-24 h-24">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-purple-500 to-transparent" />
          <div className="absolute top-0 left-0 h-full w-[2px] bg-gradient-to-b from-purple-500 to-transparent" />
        </div>
        <div className="absolute top-0 right-0 w-24 h-24">
          <div className="absolute top-0 right-0 w-full h-[2px] bg-gradient-to-l from-purple-500 to-transparent" />
          <div className="absolute top-0 right-0 h-full w-[2px] bg-gradient-to-b from-purple-500 to-transparent" />
        </div>

        <div className="relative px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Left: Page designation */}
            <div className="flex items-center gap-6">
              {/* Status indicator cluster */}
              <div className="flex flex-col items-center gap-1">
                <div className="relative">
                  <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse" />
                  <div className="absolute inset-0 w-3 h-3 bg-purple-400 rounded-full animate-ping opacity-75" />
                </div>
                <span className="text-[10px] font-bold tracking-[0.15em] text-purple-400/80">CONFIG</span>
              </div>

              {/* Divider */}
              <div className="h-12 w-px bg-gradient-to-b from-transparent via-steel to-transparent" />

              {/* Title block */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold tracking-[0.2em] text-purple-500/60">SYSTEM</span>
                  <div className="h-px flex-1 bg-gradient-to-r from-purple-500/40 to-transparent w-16" />
                </div>
                <div className="flex items-baseline gap-3">
                  <Settings className="w-5 h-5 text-purple-400" />
                  <h1 className="text-2xl font-black tracking-wide text-white" style={{ fontFamily: 'var(--font-rajdhani)' }}>
                    CONFIGURATION
                  </h1>
                </div>
              </div>
            </div>

            {/* Right: User info */}
            <div className="flex items-center gap-4">
              {/* Security status */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded">
                <Shield className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Secure</span>
              </div>

              {/* User card */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative flex items-center gap-3 px-4 py-2 bg-deep/80 border border-steel/50 rounded-xl">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name || 'User'}
                      className="w-8 h-8 rounded-lg border border-steel object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/30 to-purple-500/30 border border-steel flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                  <div className="hidden sm:block">
                    <p className="text-sm font-semibold text-white">{profile?.full_name || 'Gamer'}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Operator</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom edge highlight */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8">
        {/* Tabs and Content */}
        <SettingsTabs
          profile={profile}
          userEmail={user.email || ''}
        />

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-steel/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <p className="text-xs text-gray-600 font-mono tracking-wider">GAME HUB v1.0 // ALL SYSTEMS NOMINAL</p>
            </div>
            <p className="text-xs text-gray-600">
              Data secured with end-to-end encryption
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
