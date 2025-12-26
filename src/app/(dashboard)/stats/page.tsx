'use client';

import Link from 'next/link';
import { TrendingUp, BarChart3, PieChart, Activity, Calendar, Clock, Sparkles, ArrowRight, Zap } from 'lucide-react';

export default function StatsPage() {
  const features = [
    {
      icon: BarChart3,
      title: 'Gaming Analytics',
      description: 'Comprehensive visualizations of your gaming habits and patterns',
      metrics: ['Daily/Weekly activity', 'Genre preferences', 'Platform distribution'],
      accent: 'cyan',
    },
    {
      icon: TrendingUp,
      title: 'Progress Tracking',
      description: 'Monitor completion rates and backlog velocity',
      metrics: ['Completion trends', 'Time-to-beat', 'Backlog burn rate'],
      accent: 'emerald',
    },
    {
      icon: PieChart,
      title: 'Platform Insights',
      description: 'See which platforms you play most',
      metrics: ['Hours per platform', 'Games owned', 'Purchase patterns'],
      accent: 'violet',
    },
    {
      icon: Calendar,
      title: 'Gaming Calendar',
      description: 'Visualize history with heatmaps and timelines',
      metrics: ['Activity heatmap', 'Streaks', 'Seasonal patterns'],
      accent: 'amber',
    },
    {
      icon: Activity,
      title: 'Performance Metrics',
      description: 'Track skill progression across competitive games',
      metrics: ['Win rates', 'Skill ratings', 'Performance trends'],
      accent: 'rose',
    },
    {
      icon: Sparkles,
      title: 'AI Insights',
      description: 'Personalized recommendations based on your patterns',
      metrics: ['What to play next', 'Hidden gems', 'Playstyle analysis'],
      accent: 'cyan',
    },
  ];

  const timeline = [
    { phase: 'Phase 3', status: 'In Progress', title: 'Core Analytics', description: 'Playtime tracking, genre insights, completion analytics', color: 'cyan', progress: 35 },
    { phase: 'Phase 4', status: 'Planned', title: 'Advanced Analytics', description: 'AI-powered recommendations and predictions', color: 'violet', progress: 0 },
    { phase: 'Phase 5', status: 'Planned', title: 'Historical Analytics', description: 'Gaming journal, timeline views, activity heatmaps', color: 'emerald', progress: 0 },
  ];

  const accentColors: Record<string, { bg: string; border: string; text: string; glow: string }> = {
    cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400', glow: 'shadow-cyan-500/20' },
    emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', glow: 'shadow-emerald-500/20' },
    violet: { bg: 'bg-violet-500/10', border: 'border-violet-500/20', text: 'text-violet-400', glow: 'shadow-violet-500/20' },
    amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', glow: 'shadow-amber-500/20' },
    rose: { bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-400', glow: 'shadow-rose-500/20' },
  };

  return (
    <div className="min-h-screen bg-theme-primary relative">
      {/* Subtle ambient glow */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/3 rounded-full blur-[120px] pointer-events-none animate-breathe" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-violet-500/2 rounded-full blur-[100px] pointer-events-none animate-breathe" style={{ animationDelay: '2s' }} />

      <div className="relative max-w-6xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="mb-16">
          <div className="relative bg-theme-secondary border border-theme rounded-2xl p-10 overflow-hidden">
            {/* Subtle grid pattern */}
            <div className="absolute inset-0 opacity-[0.02]">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:60px_60px]" />
            </div>

            {/* Top accent line */}
            <div className="absolute top-0 left-8 right-8 h-px bg-linear-to-r from-transparent via-cyan-500/30 to-transparent" />

            <div className="relative">
              {/* Status badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-theme-hover border border-theme rounded-full mb-6">
                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                <span className="text-[11px] font-medium text-theme-muted uppercase tracking-wider">In Development</span>
              </div>

              <div className="flex items-start justify-between">
                <div className="max-w-2xl">
                  <span className="text-[10px] font-mono text-theme-subtle uppercase tracking-wider mb-2 block">// DATA_ANALYTICS</span>
                  <h1 className="text-5xl font-bold text-white mb-4 tracking-tight font-family-display">
                    STATISTICS
                  </h1>
                  <p className="text-lg text-theme-muted leading-relaxed mb-8">
                    Deep analytics and insights into your gaming journey. Visualize progress,
                    track habits, and discover patterns in your play style.
                  </p>

                  {/* Feature tags */}
                  <div className="flex flex-wrap gap-2">
                    {['Analytics', 'Visualizations', 'AI Insights'].map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1.5 bg-theme-hover border border-theme rounded-lg text-xs font-medium text-theme-muted"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Icon */}
                <div className="hidden md:block">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-cyan-500/10 to-violet-500/10 border border-theme flex items-center justify-center">
                      <TrendingUp className="w-10 h-10 text-cyan-400" />
                    </div>
                    {/* HUD corners */}
                    <div className="absolute -top-1 -left-1 w-3 h-3 border-l-2 border-t-2 border-cyan-400/50" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 border-r-2 border-t-2 border-cyan-400/50" />
                    <div className="absolute -bottom-1 -left-1 w-3 h-3 border-l-2 border-b-2 border-cyan-400/50" />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 border-r-2 border-b-2 border-cyan-400/50" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-400 rounded-full flex items-center justify-center">
                      <Zap className="w-2.5 h-2.5 text-[#030304]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-8">
            <BarChart3 className="w-4 h-4 text-theme-subtle" />
            <span className="text-[10px] font-mono text-theme-subtle uppercase tracking-wider">// PLANNED_FEATURES</span>
            <div className="flex-1 h-px bg-white/6" />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const colors = accentColors[feature.accent];

              return (
                <div
                  key={index}
                  className="group relative bg-theme-secondary border border-theme rounded-xl p-5 hover:border-white/12 transition-all duration-300 overflow-hidden"
                  style={{
                    animation: `fadeIn 0.4s ease-out ${index * 0.05}s both`,
                  }}
                >
                  {/* Hover HUD corners */}
                  <div className={`absolute top-0 left-0 w-3 h-3 border-l border-t ${colors.border.replace('/20', '/50')} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  <div className={`absolute top-0 right-0 w-3 h-3 border-r border-t ${colors.border.replace('/20', '/50')} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  <div className={`absolute bottom-0 left-0 w-3 h-3 border-l border-b ${colors.border.replace('/20', '/50')} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  <div className={`absolute bottom-0 right-0 w-3 h-3 border-r border-b ${colors.border.replace('/20', '/50')} opacity-0 group-hover:opacity-100 transition-opacity`} />

                  {/* Hover glow */}
                  <div className={`absolute inset-0 rounded-xl ${colors.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl`} />

                  <div className="relative">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-lg ${colors.bg} ${colors.border} border flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
                      <Icon className={`w-5 h-5 ${colors.text}`} />
                    </div>

                    <h3 className="text-base font-semibold text-white mb-2 group-hover:text-white/90 transition-colors font-family-display">
                      {feature.title}
                    </h3>

                    <p className="text-sm text-theme-subtle mb-4 leading-relaxed">
                      {feature.description}
                    </p>

                    {/* Metrics */}
                    <div className="space-y-1.5">
                      {feature.metrics.map((metric, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-theme-subtle">
                          <div className={`w-1 h-1 rounded-full ${colors.text.replace('text-', 'bg-')}`} />
                          {metric}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Timeline Section */}
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-8">
            <Clock className="w-4 h-4 text-theme-subtle" />
            <span className="text-[10px] font-mono text-theme-subtle uppercase tracking-wider">// DEV_TIMELINE</span>
            <div className="flex-1 h-px bg-white/6" />
          </div>

          <div className="relative bg-theme-secondary border border-theme rounded-xl overflow-hidden">
            {/* HUD corners */}
            <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-cyan-400/30" />
            <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-cyan-400/30" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-cyan-400/30" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-cyan-400/30" />

            {timeline.map((item, index) => {
              const colors = accentColors[item.color];
              const isLast = index === timeline.length - 1;

              return (
                <div
                  key={index}
                  className={`relative p-6 ${!isLast ? 'border-b border-white/4' : ''}`}
                >
                  <div className="flex items-start gap-6">
                    {/* Timeline indicator */}
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${colors.bg} ${colors.border} border-2`} />
                      {!isLast && <div className="w-px flex-1 bg-white/6 mt-2" />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 -mt-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`text-[10px] font-mono font-medium ${colors.text} uppercase tracking-wider`}>
                          {item.phase}
                        </span>
                        <span className="text-[10px] text-theme-subtle">•</span>
                        <span className={`text-[10px] font-mono ${item.status === 'In Progress' ? colors.text : 'text-theme-subtle'}`}>{item.status}</span>
                      </div>
                      <h4 className="font-semibold text-white mb-1 font-family-display">{item.title}</h4>
                      <p className="text-sm text-theme-subtle">{item.description}</p>

                      {/* Progress bar */}
                      {item.progress > 0 && (
                        <div className="mt-3 flex items-center gap-3">
                          <div className="flex-1 h-1 bg-white/4 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${colors.bg.replace('/10', '/40')} rounded-full transition-all duration-500`}
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-theme-subtle tabular-nums">{item.progress}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA Section */}
        <div className="relative bg-theme-secondary border border-theme rounded-xl p-8 text-center overflow-hidden">
          {/* HUD corners */}
          <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-cyan-400/30" />
          <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-cyan-400/30" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-cyan-400/30" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-cyan-400/30" />

          <span className="text-[10px] font-mono text-theme-subtle uppercase tracking-wider mb-4 block">// STATUS_UPDATE</span>
          <div className="w-12 h-12 rounded-xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-6 h-6 text-cyan-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2 font-family-display">COMING SOON</h3>
          <p className="text-sm text-theme-subtle mb-6 max-w-md mx-auto">
            Advanced statistics and analytics are in active development. Your gaming data will be ready when this launches.
          </p>
          <Link href="/dashboard">
            <button className="group relative inline-flex items-center gap-2 px-6 py-3 overflow-hidden rounded-xl">
              <div className="absolute inset-0 bg-linear-to-r from-cyan-500 to-violet-600 opacity-90 group-hover:opacity-100 transition-opacity" />
              <span className="relative font-semibold text-white uppercase tracking-wide font-family-display">Back to Dashboard</span>
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
