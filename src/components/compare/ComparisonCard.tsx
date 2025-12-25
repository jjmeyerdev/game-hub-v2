'use client';

import Image from 'next/image';
import { User, Gamepad2, Trophy, Clock, Percent, Star, ShieldCheck } from 'lucide-react';
import type { ComparisonProfile, ComparePlatform } from '@/lib/types/compare';

interface ComparisonCardProps {
  user?: ComparisonProfile;
  friend?: ComparisonProfile;
  platform: ComparePlatform;
  isLoading?: boolean;
}

const platformColors: Record<ComparePlatform, { accent: string; bg: string; border: string }> = {
  psn: { accent: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  xbox: { accent: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
  steam: { accent: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20' },
};

interface ProfileColumnProps {
  profile: ComparisonProfile;
  platform: ComparePlatform;
  isUser?: boolean;
}

function ProfileColumn({ profile, platform, isUser }: ProfileColumnProps) {
  const colors = platformColors[platform];

  return (
    <div className="flex-1 space-y-4">
      {/* Avatar & Name */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className={`w-14 h-14 rounded-xl ${colors.bg} ${colors.border} border overflow-hidden flex items-center justify-center`}>
            {profile.avatarUrl ? (
              <Image
                src={profile.avatarUrl}
                alt={profile.username}
                fill
                className="object-cover"
              />
            ) : (
              <User className={`w-7 h-7 ${colors.accent}`} />
            )}
          </div>
          {isUser && (
            <div className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 bg-cyan-500 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <span className="text-[9px] font-bold text-white tracking-wide">YOU</span>
            </div>
          )}
        </div>
        <div>
          <h3 className="font-semibold text-theme-primary font-family-display">
            {profile.username}
          </h3>
          <span className={`text-xs ${colors.accent} uppercase tracking-wider`}>
            {platform === 'psn' ? 'PlayStation' : platform === 'xbox' ? 'Xbox' : 'Steam'}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatBox
          icon={Gamepad2}
          label="Games"
          value={profile.stats.totalGames.toLocaleString()}
          platform={platform}
        />
        <StatBox
          icon={Trophy}
          label={platform === 'psn' ? 'Trophies' : 'Achievements'}
          value={profile.stats.totalAchievements.toLocaleString()}
          platform={platform}
        />
        <StatBox
          icon={Clock}
          label="Playtime"
          value={`${Math.round(profile.stats.totalPlaytime)}h`}
          platform={platform}
        />
        <StatBox
          icon={Percent}
          label="Avg Completion"
          value={`${profile.stats.completionRate}%`}
          platform={platform}
        />
      </div>

      {/* Platform-Specific Stats */}
      {platform === 'psn' && profile.stats.platformSpecific.trophyLevel !== undefined && (
        <div className={`flex items-center gap-3 p-3 rounded-lg ${colors.bg} ${colors.border} border`}>
          <Star className={`w-5 h-5 ${colors.accent}`} />
          <div>
            <div className="text-xs text-theme-subtle">Trophy Level</div>
            <div className={`text-lg font-bold font-mono ${colors.accent}`}>
              {profile.stats.platformSpecific.trophyLevel}
            </div>
          </div>
          {profile.stats.platformSpecific.isPsPlus && (
            <div className="ml-auto flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-medium text-amber-400">PS+</span>
            </div>
          )}
        </div>
      )}

      {platform === 'xbox' && profile.stats.platformSpecific.gamerscore !== undefined && (
        <div className={`flex items-center gap-3 p-3 rounded-lg ${colors.bg} ${colors.border} border`}>
          <Star className={`w-5 h-5 ${colors.accent}`} />
          <div>
            <div className="text-xs text-theme-subtle">Gamerscore</div>
            <div className={`text-lg font-bold font-mono ${colors.accent}`}>
              {profile.stats.platformSpecific.gamerscore?.toLocaleString() || 0}
            </div>
          </div>
          {profile.stats.platformSpecific.tier && (
            <div className="ml-auto px-2 py-1 bg-theme-hover border border-theme rounded-lg">
              <span className="text-xs font-medium text-theme-muted">
                {profile.stats.platformSpecific.tier}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface StatBoxProps {
  icon: React.ElementType;
  label: string;
  value: string;
  platform: ComparePlatform;
}

function StatBox({ icon: Icon, label, value, platform }: StatBoxProps) {
  const colors = platformColors[platform];

  return (
    <div className="p-3 bg-theme-tertiary border border-theme rounded-lg">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${colors.accent}`} />
        <span className="text-[10px] font-mono text-theme-subtle uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-xl font-bold font-mono text-theme-primary">{value}</div>
    </div>
  );
}

function LoadingColumn() {
  return (
    <div className="flex-1 space-y-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-xl bg-theme-hover" />
        <div className="space-y-2">
          <div className="h-4 w-24 rounded bg-theme-hover" />
          <div className="h-3 w-16 rounded bg-theme-hover" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 rounded-lg bg-theme-hover" />
        ))}
      </div>
    </div>
  );
}

function EmptyColumn({ platform }: { platform: ComparePlatform }) {
  const colors = platformColors[platform];

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
      <div className={`w-16 h-16 rounded-xl ${colors.bg} ${colors.border} border flex items-center justify-center mb-4`}>
        <User className={`w-8 h-8 ${colors.accent}`} />
      </div>
      <p className="text-sm text-theme-muted mb-1">Search for a friend</p>
      <p className="text-xs text-theme-subtle">
        Enter their {platform === 'psn' ? 'PSN username' : platform === 'xbox' ? 'Xbox gamertag' : 'Steam ID'}
      </p>
    </div>
  );
}

export function ComparisonCard({ user, friend, platform, isLoading }: ComparisonCardProps) {
  const colors = platformColors[platform];

  return (
    <div className="relative bg-theme-secondary border border-theme rounded-2xl p-6 overflow-hidden">
      {/* HUD corners */}
      <div className={`absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 ${colors.border.replace('/20', '/40')}`} />
      <div className={`absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 ${colors.border.replace('/20', '/40')}`} />
      <div className={`absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 ${colors.border.replace('/20', '/40')}`} />
      <div className={`absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 ${colors.border.replace('/20', '/40')}`} />

      <div className="flex gap-8">
        {/* User Column */}
        {user ? (
          <ProfileColumn profile={user} platform={platform} isUser />
        ) : (
          <LoadingColumn />
        )}

        {/* VS Divider */}
        <div className="flex flex-col items-center justify-center">
          <div className="w-px h-16 bg-linear-to-b from-transparent via-border to-transparent" />
          <div className={`px-3 py-2 rounded-lg ${colors.bg} ${colors.border} border`}>
            <span className={`text-sm font-bold font-mono ${colors.accent}`}>VS</span>
          </div>
          <div className="w-px h-16 bg-linear-to-b from-border via-border to-transparent" />
        </div>

        {/* Friend Column */}
        {isLoading ? (
          <LoadingColumn />
        ) : friend ? (
          <ProfileColumn profile={friend} platform={platform} />
        ) : (
          <EmptyColumn platform={platform} />
        )}
      </div>
    </div>
  );
}
