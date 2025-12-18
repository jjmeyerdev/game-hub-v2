'use client';

import Link from 'next/link';
import { Users, MessageCircle, Gamepad2, UserPlus, Heart, Share2, Crown, ArrowRight, Radio, Globe } from 'lucide-react';

export default function FriendsPage() {
  const socialFeatures = [
    {
      icon: Users,
      title: 'Friend Network',
      description: 'Connect with gamers across all platforms. Build your unified gaming social circle.',
      highlights: ['Cross-platform friends', 'Unified friend list', 'Privacy controls'],
      phase: 'Phase 4',
      accent: 'violet',
    },
    {
      icon: Gamepad2,
      title: 'Activity Feed',
      description: 'See what your friends are playing, achieving, and discovering in real-time.',
      highlights: ['Live activity updates', 'Achievement celebrations', 'Game recommendations'],
      phase: 'Phase 4',
      accent: 'cyan',
    },
    {
      icon: MessageCircle,
      title: 'Game Discussion',
      description: 'Chat about games, share tips, organize co-op sessions, and plan gaming nights.',
      highlights: ['Discussion threads', 'Session planning', 'Voice chat integration'],
      phase: 'Phase 4',
      accent: 'emerald',
    },
    {
      icon: Crown,
      title: 'Leaderboards',
      description: 'Compete with friends on completion rates, playtime, and custom challenges.',
      highlights: ['Friend rankings', 'Custom challenges', 'Seasonal competitions'],
      phase: 'Phase 4',
      accent: 'amber',
    },
    {
      icon: Share2,
      title: 'Library Sharing',
      description: 'Discover what games your friends own, recommend titles, and coordinate multiplayer.',
      highlights: ['Shared discovery', 'Co-op finder', 'Game trading'],
      phase: 'Phase 5',
      accent: 'rose',
    },
    {
      icon: Heart,
      title: 'Communities',
      description: 'Join communities around your favorite games, genres, or playstyles.',
      highlights: ['Genre communities', 'Game groups', 'Event organization'],
      phase: 'Phase 5',
      accent: 'violet',
    },
  ];

  const quickStats = [
    { icon: Globe, label: 'Platforms', value: 'Multi' },
    { icon: Radio, label: 'Real-time', value: 'Live' },
    { icon: Users, label: 'Social', value: 'Q4 2026' },
  ];

  const accentColors: Record<string, { bg: string; border: string; text: string; dot: string }> = {
    violet: { bg: 'bg-violet-500/10', border: 'border-violet-500/20', text: 'text-violet-400', dot: 'bg-violet-400' },
    cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400', dot: 'bg-cyan-400' },
    emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-400' },
    amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', dot: 'bg-amber-400' },
    rose: { bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-400', dot: 'bg-rose-400' },
  };

  return (
    <div className="min-h-screen bg-void relative">
      {/* Subtle ambient glow */}
      <div className="fixed top-0 left-1/3 w-[500px] h-[500px] bg-violet-500/[0.03] rounded-full blur-[120px] pointer-events-none animate-breathe" />
      <div className="fixed bottom-0 right-1/4 w-[400px] h-[400px] bg-cyan-500/[0.02] rounded-full blur-[100px] pointer-events-none animate-breathe" style={{ animationDelay: '2s' }} />

      <div className="relative max-w-6xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="mb-16">
          <div className="relative bg-abyss border border-white/[0.06] rounded-2xl p-10 overflow-hidden">
            {/* Decorative connection pattern */}
            <div className="absolute top-8 right-8 opacity-[0.03]">
              <svg width="200" height="200" viewBox="0 0 200 200">
                <circle cx="50" cy="50" r="8" fill="currentColor" className="text-white" />
                <circle cx="150" cy="50" r="8" fill="currentColor" className="text-white" />
                <circle cx="100" cy="150" r="8" fill="currentColor" className="text-white" />
                <circle cx="100" cy="100" r="12" fill="currentColor" className="text-white" />
                <line x1="50" y1="50" x2="100" y2="100" stroke="currentColor" strokeWidth="2" className="text-white" />
                <line x1="150" y1="50" x2="100" y2="100" stroke="currentColor" strokeWidth="2" className="text-white" />
                <line x1="100" y1="150" x2="100" y2="100" stroke="currentColor" strokeWidth="2" className="text-white" />
              </svg>
            </div>

            {/* Top accent line */}
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />

            <div className="relative">
              {/* Status badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] border border-white/[0.08] rounded-full mb-6">
                <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse" />
                <span className="text-[11px] font-medium text-white/50 uppercase tracking-wider">Coming Q4 2026</span>
              </div>

              <div className="flex items-start justify-between">
                <div className="max-w-2xl">
                  <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider mb-2 block">// SOCIAL_NETWORK</span>
                  <h1 className="text-5xl font-bold text-white mb-4 tracking-tight font-[family-name:var(--font-family-display)]">
                    FRIENDS
                  </h1>
                  <p className="text-lg text-white/40 leading-relaxed mb-8">
                    Connect with your gaming community. Share achievements, discover games together,
                    and never game alone again.
                  </p>

                  {/* Avatar stack preview */}
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-2">
                      {['A', 'B', 'C', 'D'].map((letter, i) => (
                        <div
                          key={letter}
                          className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500/30 to-cyan-500/30 border-2 border-[#0a0a0b] flex items-center justify-center text-xs font-semibold text-white/70"
                          style={{ animationDelay: `${i * 0.1}s` }}
                        >
                          {letter}
                        </div>
                      ))}
                      <div className="w-9 h-9 rounded-full bg-white/[0.03] border-2 border-[#0a0a0b] flex items-center justify-center">
                        <UserPlus className="w-4 h-4 text-white/30" />
                      </div>
                    </div>
                    <div className="h-6 w-px bg-white/[0.06]" />
                    <span className="text-sm text-white/30">Join the community</span>
                  </div>
                </div>

                {/* Icon */}
                <div className="hidden md:block">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-violet-500/10 to-cyan-500/5 border border-white/[0.08] flex items-center justify-center">
                      <Users className="w-12 h-12 text-violet-400" />
                    </div>
                    {/* HUD corners */}
                    <div className="absolute -top-1 -left-1 w-3 h-3 border-l-2 border-t-2 border-violet-400/50" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 border-r-2 border-t-2 border-violet-400/50" />
                    <div className="absolute -bottom-1 -left-1 w-3 h-3 border-l-2 border-b-2 border-violet-400/50" />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 border-r-2 border-b-2 border-violet-400/50" />
                    {/* Online indicators */}
                    <div className="absolute -top-2 -right-2 flex gap-0.5">
                      <div className="w-2 h-2 bg-violet-400 rounded-full animate-pulse" />
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-4">
            <Radio className="w-4 h-4 text-white/20" />
            <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider">// NETWORK_STATUS</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            {quickStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="group relative bg-abyss border border-white/[0.06] rounded-xl p-4 text-center hover:border-white/[0.1] transition-all overflow-hidden"
                  style={{ animation: `fadeIn 0.4s ease-out ${index * 0.1}s both` }}
                >
                  {/* Hover HUD corners */}
                  <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-violet-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-violet-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-violet-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-violet-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />

                  <Icon className="relative w-5 h-5 text-violet-400 mx-auto mb-2" />
                  <div className="relative text-[10px] font-mono text-white/30 mb-1 uppercase tracking-wider">{stat.label}</div>
                  <div className="relative text-sm font-bold font-mono text-white">{stat.value}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-8">
            <Heart className="w-4 h-4 text-white/20" />
            <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider">// SOCIAL_FEATURES</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {socialFeatures.map((feature, index) => {
              const Icon = feature.icon;
              const colors = accentColors[feature.accent];

              return (
                <div
                  key={index}
                  className="group relative bg-abyss border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.12] transition-all duration-300 overflow-hidden"
                  style={{ animation: `fadeIn 0.4s ease-out ${index * 0.06}s both` }}
                >
                  {/* Hover HUD corners */}
                  <div className={`absolute top-0 left-0 w-3 h-3 border-l border-t ${colors.border.replace('/20', '/50')} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  <div className={`absolute top-0 right-0 w-3 h-3 border-r border-t ${colors.border.replace('/20', '/50')} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  <div className={`absolute bottom-0 left-0 w-3 h-3 border-l border-b ${colors.border.replace('/20', '/50')} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  <div className={`absolute bottom-0 right-0 w-3 h-3 border-r border-b ${colors.border.replace('/20', '/50')} opacity-0 group-hover:opacity-100 transition-opacity`} />

                  {/* Subtle hover glow */}
                  <div className={`absolute inset-0 ${colors.bg} opacity-0 group-hover:opacity-50 transition-opacity duration-300 blur-2xl`} />

                  <div className="relative">
                    <div className="flex items-start gap-4 mb-4">
                      {/* Icon */}
                      <div className={`w-11 h-11 rounded-xl ${colors.bg} ${colors.border} border flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
                        <Icon className={`w-5 h-5 ${colors.text}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3 mb-1">
                          <h3 className="font-semibold text-white font-[family-name:var(--font-family-display)]">{feature.title}</h3>
                          <span className="px-2 py-0.5 bg-white/[0.03] border border-white/[0.06] rounded text-[10px] font-mono text-white/30 uppercase tracking-wider">
                            {feature.phase}
                          </span>
                        </div>
                        <p className="text-sm text-white/30 leading-relaxed">{feature.description}</p>
                      </div>
                    </div>

                    {/* Highlights */}
                    <div className="flex flex-wrap gap-2 pl-15">
                      {feature.highlights.map((highlight, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 text-xs text-white/20"
                        >
                          <div className={`w-1 h-1 rounded-full ${colors.dot}`} />
                          {highlight}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Bottom accent */}
                  <div className={`absolute bottom-0 left-0 right-0 h-px ${colors.bg.replace('/10', '/30')} opacity-0 group-hover:opacity-100 transition-opacity`} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-6">
            <Crown className="w-4 h-4 text-white/20" />
            <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider">// KEY_BENEFITS</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: Share2, title: 'Discover Together', description: 'Find new games through friends\' libraries', accent: 'cyan' },
              { icon: MessageCircle, title: 'Stay Connected', description: 'Know when friends are online and ready', accent: 'violet' },
              { icon: Crown, title: 'Compete & Celebrate', description: 'Challenge friends and share victories', accent: 'emerald' },
            ].map((item, index) => {
              const Icon = item.icon;
              const colors = accentColors[item.accent];

              return (
                <div
                  key={index}
                  className="group relative bg-abyss border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.12] transition-all duration-300 overflow-hidden"
                  style={{ animation: `fadeIn 0.4s ease-out ${index * 0.1 + 0.3}s both` }}
                >
                  {/* Hover HUD corners */}
                  <div className={`absolute top-0 left-0 w-2 h-2 border-l border-t ${colors.border.replace('/20', '/50')} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  <div className={`absolute top-0 right-0 w-2 h-2 border-r border-t ${colors.border.replace('/20', '/50')} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  <div className={`absolute bottom-0 left-0 w-2 h-2 border-l border-b ${colors.border.replace('/20', '/50')} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  <div className={`absolute bottom-0 right-0 w-2 h-2 border-r border-b ${colors.border.replace('/20', '/50')} opacity-0 group-hover:opacity-100 transition-opacity`} />

                  <div className={`relative w-10 h-10 rounded-lg ${colors.bg} ${colors.border} border flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
                    <Icon className={`w-5 h-5 ${colors.text}`} />
                  </div>
                  <h3 className="relative font-semibold text-white mb-2 font-[family-name:var(--font-family-display)]">{item.title}</h3>
                  <p className="relative text-sm text-white/30">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA Section */}
        <div className="relative bg-abyss border border-white/[0.06] rounded-xl p-8 text-center overflow-hidden">
          {/* HUD corners */}
          <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-violet-400/30" />
          <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-violet-400/30" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-violet-400/30" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-violet-400/30" />

          <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider mb-4 block">// STATUS_UPDATE</span>
          <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6 text-violet-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2 font-[family-name:var(--font-family-display)]">BUILDING THE NETWORK</h3>
          <p className="text-sm text-white/30 mb-6 max-w-md mx-auto">
            Social features are in development. We're building a unified gaming social experience
            that connects you with friends across all platforms.
          </p>
          <Link href="/dashboard">
            <button className="group relative inline-flex items-center gap-2 px-6 py-3 overflow-hidden rounded-xl">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-cyan-600 opacity-90 group-hover:opacity-100 transition-opacity" />
              <span className="relative font-semibold text-white uppercase tracking-wide font-[family-name:var(--font-family-display)]">Return to Dashboard</span>
              <ArrowRight className="relative w-4 h-4 text-white group-hover:translate-x-0.5 transition-transform" />
            </button>
          </Link>
        </div>
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
