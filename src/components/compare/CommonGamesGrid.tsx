'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Gamepad2, Trophy, ChevronRight, Swords, Target, Crown } from 'lucide-react';
import type { ComparisonResult, ComparePlatform } from '@/lib/types/compare';
import { PlayStationLogo, XboxLogo, SteamLogo } from '@/components/icons/PlatformLogos';

interface CommonGamesGridProps {
  commonGames: NonNullable<ComparisonResult['commonGames']>;
  platform: ComparePlatform;
  userName?: string;
  friendName?: string;
  friendIdentifier?: string;
  userAvatarUrl?: string | null;
  friendAvatarUrl?: string | null;
}

const platformColors: Record<ComparePlatform, { accent: string; bg: string; border: string; bar: string; gradient: string }> = {
  psn: { accent: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', bar: 'bg-blue-500', gradient: 'from-blue-500 to-blue-400' },
  xbox: { accent: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', bar: 'bg-green-500', gradient: 'from-green-500 to-green-400' },
  steam: { accent: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', bar: 'bg-slate-500', gradient: 'from-slate-500 to-slate-400' },
};

export function CommonGamesGrid({ commonGames, platform, userName = 'You', friendName = 'Friend', friendIdentifier, userAvatarUrl, friendAvatarUrl }: CommonGamesGridProps) {
  const colors = platformColors[platform];
  const PlatformIcon = platform === 'psn' ? PlayStationLogo : platform === 'xbox' ? XboxLogo : SteamLogo;

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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {commonGames.map((game, index) => {
          const compareUrl = friendIdentifier
            ? `/friends/compare?platform=${platform}&game=${encodeURIComponent(game.title)}&friend=${encodeURIComponent(friendIdentifier)}`
            : null;

          const userWinning = game.userProgress > game.friendProgress;
          const friendWinning = game.friendProgress > game.userProgress;
          const isTie = game.userProgress === game.friendProgress;
          const leadAmount = Math.abs(game.userProgress - game.friendProgress);

          const CardWrapper = compareUrl
            ? ({ children }: { children: React.ReactNode }) => (
                <Link href={compareUrl} className="block">
                  {children}
                </Link>
              )
            : ({ children }: { children: React.ReactNode }) => <>{children}</>;

          return (
            <CardWrapper key={`${game.title}-${index}`}>
              <div
                className={`group relative bg-theme-secondary border border-theme rounded-xl overflow-hidden transition-all duration-300 ${
                  compareUrl ? 'hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/10 cursor-pointer' : ''
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* HUD Corners */}
                <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-cyan-400/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-cyan-400/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-cyan-400/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-cyan-400/30 opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Content */}
                <div className="p-4">
                  {/* Header Row - Platform & Compare Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <div className={`flex items-center gap-1.5 px-2 py-1 ${colors.bg} ${colors.border} border rounded-lg`}>
                      <PlatformIcon size="sm" className={colors.accent} />
                      <span className={`text-[10px] font-mono ${colors.accent} uppercase tracking-wider`}>
                        {game.console || (platform === 'psn' ? 'PlayStation' : platform === 'xbox' ? 'Xbox' : 'PC')}
                      </span>
                    </div>
                    {compareUrl && (
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-lg opacity-60 group-hover:opacity-100 transition-opacity">
                        <Swords className="w-3 h-3 text-cyan-400" />
                        <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-wider">Compare</span>
                        <ChevronRight className="w-3 h-3 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    )}
                  </div>

                  {/* Game Title */}
                  <h4 className="font-bold text-theme-primary text-base mb-4 line-clamp-2 leading-tight font-family-display uppercase tracking-wide group-hover:text-cyan-400 transition-colors">
                    {game.title}
                  </h4>

                  {/* VS Comparison - Mini Duel View */}
                  <div className="relative">
                    {/* Glowing center divider */}
                    <div className="absolute left-1/2 top-2 bottom-2 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />

                    <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
                      {/* User Side */}
                      <div className="text-center">
                        <div className="relative inline-block mb-2">
                          <div className={`w-10 h-10 rounded-lg overflow-hidden bg-cyan-500/10 border ${userWinning ? 'border-cyan-500/50' : 'border-cyan-500/20'} flex items-center justify-center`}>
                            {userAvatarUrl ? (
                              <Image src={userAvatarUrl} alt={userName} width={40} height={40} className="object-cover" />
                            ) : (
                              <span className="text-sm font-bold text-cyan-400">{userName.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          {userWinning && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                              <Crown className="w-2.5 h-2.5 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-cyan-400/60 uppercase tracking-wider mb-1 truncate">{userName}</div>
                        <div className="text-xl font-bold text-cyan-400 font-family-display">{game.userProgress}%</div>
                      </div>

                      {/* VS Badge */}
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-white/10 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400 font-family-display">VS</span>
                        </div>
                      </div>

                      {/* Friend Side */}
                      <div className="text-center">
                        <div className="relative inline-block mb-2">
                          <div className={`w-10 h-10 rounded-lg overflow-hidden ${colors.bg} border ${friendWinning ? colors.border.replace('/20', '/50') : colors.border} flex items-center justify-center`}>
                            {friendAvatarUrl ? (
                              <Image src={friendAvatarUrl} alt={friendName} width={40} height={40} className="object-cover" />
                            ) : (
                              <span className={`text-sm font-bold ${colors.accent}`}>{friendName.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          {friendWinning && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                              <Crown className="w-2.5 h-2.5 text-white" />
                            </div>
                          )}
                        </div>
                        <div className={`text-[10px] font-mono ${colors.accent} opacity-60 uppercase tracking-wider mb-1 truncate`}>{friendName}</div>
                        <div className={`text-xl font-bold ${colors.accent} font-family-display`}>{game.friendProgress}%</div>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bars - Side by Side */}
                  <div className="mt-4 space-y-2">
                    <div className="flex gap-1">
                      <div className="flex-1 h-1.5 bg-theme-hover rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full transition-all duration-500"
                          style={{ width: `${game.userProgress}%` }}
                        />
                      </div>
                      <div className="flex-1 h-1.5 bg-theme-hover rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${colors.gradient} rounded-full transition-all duration-500`}
                          style={{ width: `${game.friendProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bottom Stats Row */}
                  <div className="mt-3 pt-3 border-t border-theme flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Target className="w-3 h-3 text-theme-subtle" />
                      <span className="text-[10px] text-theme-muted font-mono uppercase tracking-wider">
                        Click to compare
                      </span>
                    </div>
                    {!isTie ? (
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded ${userWinning ? 'bg-cyan-500/10' : colors.bg}`}>
                        <Trophy className={`w-3 h-3 ${userWinning ? 'text-cyan-400' : colors.accent}`} />
                        <span className={`text-[10px] font-bold ${userWinning ? 'text-cyan-400' : colors.accent}`}>
                          +{leadAmount}%
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10">
                        <span className="text-[10px] font-bold text-amber-400">TIE</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardWrapper>
          );
        })}
      </div>
    </div>
  );
}
