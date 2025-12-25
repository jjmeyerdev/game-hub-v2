'use client';

import Image from 'next/image';
import { Gamepad2, Trophy } from 'lucide-react';
import type { ComparisonResult, ComparePlatform } from '@/lib/types/compare';

interface CommonGamesGridProps {
  commonGames: NonNullable<ComparisonResult['commonGames']>;
  platform: ComparePlatform;
  userName?: string;
  friendName?: string;
}

const platformColors: Record<ComparePlatform, { accent: string; bg: string; border: string; bar: string }> = {
  psn: { accent: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', bar: 'bg-blue-500' },
  xbox: { accent: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', bar: 'bg-green-500' },
  steam: { accent: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', bar: 'bg-slate-500' },
};

export function CommonGamesGrid({ commonGames, platform, userName = 'You', friendName = 'Friend' }: CommonGamesGridProps) {
  const colors = platformColors[platform];

  if (commonGames.length === 0) {
    return (
      <div className="bg-theme-secondary border border-theme rounded-xl p-8 text-center">
        <div className={`w-14 h-14 rounded-xl ${colors.bg} ${colors.border} border flex items-center justify-center mx-auto mb-4`}>
          <Gamepad2 className={`w-7 h-7 ${colors.accent}`} />
        </div>
        <h3 className="text-lg font-semibold text-theme-primary mb-2 font-family-display">
          No Common Games
        </h3>
        <p className="text-sm text-theme-muted">
          You don&apos;t share any games with this player on this platform.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colors.bg} ${colors.border} border`}>
            <Gamepad2 className={`w-5 h-5 ${colors.accent}`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-theme-primary font-family-display">
              Common Games
            </h3>
            <p className="text-sm text-theme-muted">
              {commonGames.length} game{commonGames.length !== 1 ? 's' : ''} you both own
            </p>
          </div>
        </div>
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {commonGames.map((game, index) => (
          <div
            key={`${game.title}-${index}`}
            className="group relative bg-theme-secondary border border-theme rounded-xl overflow-hidden hover:border-theme-hover transition-all duration-300"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Cover Image */}
            <div className="relative h-32 bg-theme-hover">
              {game.coverUrl ? (
                <Image
                  src={game.coverUrl}
                  alt={game.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Gamepad2 className="w-12 h-12 text-theme-subtle" />
                </div>
              )}
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-linear-to-t from-theme-secondary via-transparent to-transparent" />
            </div>

            {/* Content */}
            <div className="p-4">
              <h4 className="font-semibold text-theme-primary text-sm mb-3 line-clamp-1">
                {game.title}
              </h4>

              {/* Progress Comparison */}
              <div className="space-y-3">
                {/* User Progress */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-cyan-400 font-medium">{userName}</span>
                    <span className="text-theme-muted font-mono">{game.userProgress}%</span>
                  </div>
                  <div className="h-1.5 bg-theme-hover rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                      style={{ width: `${game.userProgress}%` }}
                    />
                  </div>
                </div>

                {/* Friend Progress */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`${colors.accent} font-medium`}>{friendName}</span>
                    <span className="text-theme-muted font-mono">{game.friendProgress}%</span>
                  </div>
                  <div className="h-1.5 bg-theme-hover rounded-full overflow-hidden">
                    <div
                      className={`h-full ${colors.bar} rounded-full transition-all duration-500`}
                      style={{ width: `${game.friendProgress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Winner Indicator */}
              {game.userProgress !== game.friendProgress && (
                <div className="mt-3 flex items-center justify-center gap-1.5">
                  <Trophy className={`w-3 h-3 ${game.userProgress > game.friendProgress ? 'text-cyan-400' : colors.accent}`} />
                  <span className={`text-[10px] font-medium uppercase tracking-wider ${game.userProgress > game.friendProgress ? 'text-cyan-400' : colors.accent}`}>
                    {game.userProgress > game.friendProgress ? userName : friendName} leads
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
