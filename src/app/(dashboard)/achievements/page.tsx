'use client';

import Link from 'next/link';
import { Trophy, Star, Target, Award, Zap, ArrowRight, Gem, Crown, Medal } from 'lucide-react';

export default function AchievementsPage() {
  const roadmapItems = [
    {
      icon: Trophy,
      title: 'Cross-Platform Tracking',
      description: 'Unified view of achievements from Steam, PlayStation, Xbox, and more',
      phase: 'Phase 2',
      progress: 60,
      accent: 'emerald',
    },
    {
      icon: Target,
      title: 'Achievement Analytics',
      description: 'Track completion rates, rarity, and progress across your library',
      phase: 'Phase 2',
      progress: 40,
      accent: 'cyan',
    },
    {
      icon: Star,
      title: 'Rare Achievement Showcase',
      description: 'Highlight your rarest achievements with global completion percentages',
      phase: 'Phase 2',
      progress: 25,
      accent: 'amber',
    },
    {
      icon: Zap,
      title: 'Achievement Challenges',
      description: 'Set personal achievement goals and track your hunting progress',
      phase: 'Phase 3',
      progress: 10,
      accent: 'violet',
    },
    {
      icon: Award,
      title: 'Achievement Comparisons',
      description: 'Compare your achievement progress with friends',
      phase: 'Phase 4',
      progress: 0,
      accent: 'rose',
    },
  ];

  const highlights = [
    { icon: Gem, label: 'Platinum Tracking', description: 'Track rare & platinum trophies' },
    { icon: Crown, label: 'Leaderboards', description: 'Compete with friends & community' },
    { icon: Medal, label: 'Achievement Score', description: 'Unified gamerscore across platforms' },
  ];

  const accentColors: Record<string, { bg: string; border: string; text: string; barBg: string }> = {
    emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', barBg: 'bg-emerald-500/50' },
    cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400', barBg: 'bg-cyan-500/50' },
    amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', barBg: 'bg-amber-500/50' },
    violet: { bg: 'bg-violet-500/10', border: 'border-violet-500/20', text: 'text-violet-400', barBg: 'bg-violet-500/50' },
    rose: { bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-400', barBg: 'bg-rose-500/50' },
  };

  return (
    <div className="min-h-screen bg-void relative">
      {/* Subtle ambient glow */}
      <div className="fixed top-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/[0.03] rounded-full blur-[120px] pointer-events-none animate-breathe" />
      <div className="fixed bottom-0 left-1/3 w-[400px] h-[400px] bg-amber-500/[0.02] rounded-full blur-[100px] pointer-events-none animate-breathe" style={{ animationDelay: '2s' }} />

      <div className="relative max-w-6xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="mb-16">
          <div className="relative bg-abyss border border-white/[0.06] rounded-2xl p-10 overflow-hidden">
            {/* Decorative trophy pattern */}
            <div className="absolute top-0 right-0 w-64 h-64 opacity-[0.02]">
              <Trophy className="w-full h-full" />
            </div>

            {/* Top accent line */}
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

            <div className="relative">
              {/* Status badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] border border-white/[0.08] rounded-full mb-6">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-[11px] font-medium text-white/50 uppercase tracking-wider">Coming Q2 2026</span>
              </div>

              <div className="flex items-start justify-between">
                <div className="max-w-2xl">
                  <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider mb-2 block">// TROPHY_HUNTER</span>
                  <h1 className="text-5xl font-bold text-white mb-4 tracking-tight font-[family-name:var(--font-family-display)]">
                    ACHIEVEMENTS
                  </h1>
                  <p className="text-lg text-white/40 leading-relaxed mb-8">
                    Track, compare, and showcase your gaming achievements across all platforms.
                    Hunt for rare trophies and celebrate your victories.
                  </p>

                  {/* Quick stats preview */}
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <Trophy className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <div className="text-xs text-white/30">Platforms</div>
                        <div className="text-sm font-medium text-white">4+</div>
                      </div>
                    </div>
                    <div className="w-px h-8 bg-white/[0.06]" />
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                        <Star className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <div className="text-xs text-white/30">Rarity Tracking</div>
                        <div className="text-sm font-medium text-white">Global %</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trophy Icon */}
                <div className="hidden md:block">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-amber-500/5 border border-white/[0.08] flex items-center justify-center">
                      <Trophy className="w-12 h-12 text-emerald-400" />
                    </div>
                    {/* HUD corners */}
                    <div className="absolute -top-1 -left-1 w-3 h-3 border-l-2 border-t-2 border-emerald-400/50" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 border-r-2 border-t-2 border-emerald-400/50" />
                    <div className="absolute -bottom-1 -left-1 w-3 h-3 border-l-2 border-b-2 border-emerald-400/50" />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 border-r-2 border-b-2 border-emerald-400/50" />
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/30">
                      <Star className="w-3.5 h-3.5 text-[#030304]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Highlight Cards */}
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-6">
            <Gem className="w-4 h-4 text-white/20" />
            <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider">// FEATURE_PREVIEW</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {highlights.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className="group relative bg-abyss border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.12] transition-all duration-300 overflow-hidden"
                  style={{ animation: `fadeIn 0.4s ease-out ${index * 0.1}s both` }}
                >
                  {/* Hover HUD corners */}
                  <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-emerald-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-emerald-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-emerald-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-emerald-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="relative flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1 font-[family-name:var(--font-family-display)]">{item.label}</h3>
                      <p className="text-sm text-white/30">{item.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Roadmap Section */}
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-8">
            <Target className="w-4 h-4 text-white/20" />
            <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider">// DEV_ROADMAP</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          <div className="space-y-3">
            {roadmapItems.map((item, index) => {
              const Icon = item.icon;
              const colors = accentColors[item.accent];

              return (
                <div
                  key={index}
                  className="group relative bg-abyss border border-white/[0.06] rounded-xl overflow-hidden hover:border-white/[0.12] transition-all duration-300"
                  style={{ animation: `slideIn 0.4s ease-out ${index * 0.08}s both` }}
                >
                  {/* Hover HUD corners */}
                  <div className={`absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 ${colors.border.replace('/20', '/50')} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  <div className={`absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 ${colors.border.replace('/20', '/50')} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  <div className={`absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 ${colors.border.replace('/20', '/50')} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  <div className={`absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 ${colors.border.replace('/20', '/50')} opacity-0 group-hover:opacity-100 transition-opacity`} />

                  <div className="relative p-5">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`w-12 h-12 rounded-xl ${colors.bg} ${colors.border} border flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
                        <Icon className={`w-6 h-6 ${colors.text}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <h3 className="font-semibold text-white mb-1 font-[family-name:var(--font-family-display)]">{item.title}</h3>
                            <p className="text-sm text-white/30">{item.description}</p>
                          </div>
                          <span className={`flex-shrink-0 px-2.5 py-1 ${colors.bg} ${colors.border} border rounded-lg text-[10px] font-mono font-medium ${colors.text} uppercase tracking-wider`}>
                            {item.phase}
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div className="flex items-center gap-3 mt-3">
                          <div className="flex-1 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                            <div
                              className={`h-full ${colors.barBg} rounded-full transition-all duration-700 ease-out`}
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-mono text-white/30 tabular-nums">{item.progress}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom accent line */}
                  <div className={`h-px ${colors.barBg} opacity-30 group-hover:opacity-60 transition-opacity`} />
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA Section */}
        <div className="relative bg-abyss border border-white/[0.06] rounded-xl p-8 text-center overflow-hidden">
          {/* HUD corners */}
          <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-emerald-400/30" />
          <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-emerald-400/30" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-emerald-400/30" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-emerald-400/30" />

          <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider mb-4 block">// STATUS_UPDATE</span>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-6 h-6 text-emerald-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2 font-[family-name:var(--font-family-display)]">STAY UPDATED</h3>
          <p className="text-sm text-white/30 mb-6 max-w-md mx-auto">
            Achievement tracking is in active development. Check back soon for updates!
          </p>
          <Link href="/dashboard">
            <button className="group relative inline-flex items-center gap-2 px-6 py-3 overflow-hidden rounded-xl">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-cyan-600 opacity-90 group-hover:opacity-100 transition-opacity" />
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
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-12px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
