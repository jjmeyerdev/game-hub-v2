import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardLayout } from '@/components/layouts';
import SettingsTabs from '@/components/settings/SettingsTabs';
import { Settings, User } from 'lucide-react';

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
    <DashboardLayout>
      <div className="relative min-h-screen">
        {/* Background Effects */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-cyan-500/3 to-transparent rounded-full" />
        </div>

        <div className="max-w-5xl mx-auto px-6 py-8">
          {/* Page Header */}
          <header className="mb-12">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center backdrop-blur-sm">
                  <Settings className="w-7 h-7 text-cyan-400" />
                </div>
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-2xl blur-lg -z-10" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white tracking-tight">Settings</h1>
                <p className="text-gray-400 mt-1">Configure your gaming command center</p>
              </div>
            </div>

            {/* User Profile Card */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative flex items-center gap-4 p-4 bg-abyss/80 backdrop-blur-sm border border-steel/50 rounded-2xl">
                <div className="relative">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name || 'User'}
                      className="w-12 h-12 rounded-xl border border-steel object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/30 to-purple-500/30 border border-steel flex items-center justify-center">
                      <User className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-abyss" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{profile?.full_name || 'Gamer'}</p>
                  <p className="text-sm text-gray-500 truncate">{profile?.email || user.email}</p>
                </div>
                <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Active</span>
                </div>
              </div>
            </div>
          </header>

          {/* Tabs and Content */}
          <SettingsTabs
            profile={profile}
            userEmail={user.email || ''}
          />

          {/* Footer Stats */}
          <footer className="mt-12 pt-8 border-t border-steel/20">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <p>Game Hub v1.0</p>
              <p>Your gaming data is secure and private</p>
            </div>
          </footer>
        </div>
      </div>
    </DashboardLayout>
  );
}
