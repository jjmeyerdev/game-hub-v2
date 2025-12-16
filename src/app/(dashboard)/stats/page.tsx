'use client';

import Link from 'next/link';
import { TrendingUp, BarChart3, PieChart, Activity, Calendar, Clock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export default function StatsPage() {
  const features = [
    {
      icon: BarChart3,
      title: 'Gaming Analytics Dashboard',
      description: 'Comprehensive visualizations of your gaming habits, trends, and patterns over time',
      metrics: ['Daily/Weekly/Monthly activity', 'Genre preferences', 'Platform distribution'],
    },
    {
      icon: TrendingUp,
      title: 'Progress Tracking',
      description: 'Monitor your completion rates, backlog velocity, and achievement hunting progress',
      metrics: ['Completion trends', 'Time-to-beat analysis', 'Backlog burn rate'],
    },
    {
      icon: PieChart,
      title: 'Platform Insights',
      description: 'See which platforms you play most and how your time is distributed',
      metrics: ['Hours per platform', 'Games per platform', 'Purchase patterns'],
    },
    {
      icon: Calendar,
      title: 'Gaming Calendar',
      description: 'Visualize your gaming history with heatmaps and activity timelines',
      metrics: ['Activity heatmap', 'Streaks & milestones', 'Seasonal patterns'],
    },
    {
      icon: Activity,
      title: 'Performance Metrics',
      description: 'Track your skill progression and improvement across competitive games',
      metrics: ['Win rates', 'Skill ratings', 'Performance trends'],
    },
    {
      icon: Sparkles,
      title: 'AI-Powered Insights',
      description: 'Get personalized recommendations based on your gaming patterns and preferences',
      metrics: ['What to play next', 'Hidden gems discovery', 'Playstyle analysis'],
    },
  ];

  return (
    <>
      {/* Animated grid background */}
      <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,217,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,217,255,0.1)_1px,transparent_1px)] bg-[length:100px_100px]" />
          </div>
          <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/3 right-1/4 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-12">
          {/* Header */}
          <div className="mb-12">

          {/* Hero Section with Chart Visualization */}
          <div className="relative bg-gradient-to-br from-deep via-void to-abyss border-2 border-cyan-500/30 rounded-3xl p-12 overflow-hidden">
            {/* Animated chart lines in background */}
            <div className="absolute inset-0 opacity-5">
              <svg className="w-full h-full" viewBox="0 0 1000 400">
                <path
                  d="M0,200 Q250,100 500,150 T1000,100"
                  stroke="currentColor"
                  fill="none"
                  strokeWidth="3"
                  className="text-cyan-400"
                  style={{ animation: 'dash 3s ease-in-out infinite' }}
                />
                <path
                  d="M0,250 Q250,200 500,220 T1000,180"
                  stroke="currentColor"
                  fill="none"
                  strokeWidth="3"
                  className="text-purple-400"
                  style={{ animation: 'dash 3s ease-in-out infinite', animationDelay: '0.5s' }}
                />
              </svg>
            </div>

            <div className="relative">
              <div className="flex items-start justify-between mb-6">
                <div className="inline-flex items-center gap-3">
                  <div className="relative">
                    <TrendingUp className="w-16 h-16 text-cyan-400" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-400 rounded-full animate-ping" />
                  </div>
                  <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">
                    IN DEVELOPMENT
                  </Badge>
                </div>

                {/* Mock stats badges */}
                <div className="hidden md:flex flex-col gap-2">
                  <div className="bg-deep/80 backdrop-blur-sm border border-steel rounded-lg px-4 py-2">
                    <div className="text-xs text-gray-500">Phase</div>
                    <div className="text-lg font-bold text-purple-400">3</div>
                  </div>
                  <div className="bg-deep/80 backdrop-blur-sm border border-steel rounded-lg px-4 py-2">
                    <div className="text-xs text-gray-500">ETA</div>
                    <div className="text-lg font-bold text-cyan-400">Q3</div>
                  </div>
                </div>
              </div>

              <h1 className="text-7xl font-bold mb-4 leading-none">
                <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent animate-shimmer">
                  STATISTICS
                </span>
              </h1>

              <p className="text-xl text-gray-300 max-w-2xl mb-8">
                Deep analytics and insights into your gaming journey. Visualize your progress,
                track your habits, and discover patterns in your play style.
              </p>

              <div className="flex flex-wrap gap-3">
                <Badge variant="outline" className="border-cyan-500/20 bg-cyan-500/5 text-cyan-400">
                  Advanced Analytics
                </Badge>
                <Badge variant="outline" className="border-purple-500/20 bg-purple-500/5 text-purple-400">
                  Data Visualization
                </Badge>
                <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/5 text-emerald-400">
                  AI Insights
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-steel to-transparent" />
            <h2 className="text-2xl font-bold text-cyan-400 uppercase tracking-wider">
              Planned Features
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-steel via-steel to-transparent" />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;

              return (
                <Card
                  key={index}
                  className="relative group bg-gradient-to-br from-deep to-abyss border-steel hover:border-cyan-500/50 transition-all duration-300 hover:scale-105 overflow-hidden"
                  style={{
                    animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`,
                  }}
                >
                  {/* Animated gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 via-cyan-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="relative p-6">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6 text-cyan-400" />
                    </div>

                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                      {feature.title}
                    </h3>

                    <p className="text-sm text-gray-400 mb-4">
                      {feature.description}
                    </p>

                    <div className="space-y-1.5">
                      {feature.metrics.map((metric, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
                          <div className="w-1 h-1 rounded-full bg-cyan-400" />
                          {metric}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom gradient bar */}
                  <div className="h-1 bg-gradient-to-r from-cyan-500/50 via-purple-500/50 to-cyan-500/50 opacity-50 group-hover:opacity-100 transition-opacity" />
                </Card>
              );
            })}
          </div>
        </div>

        {/* Timeline Section */}
        <div className="mt-16">
          <div className="bg-gradient-to-r from-deep via-abyss to-deep border border-steel rounded-2xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <Clock className="w-8 h-8 text-purple-400" />
              <h3 className="text-2xl font-bold">Development Timeline</h3>
            </div>

            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-cyan-400" />
                  <div className="w-px flex-1 bg-steel" />
                </div>
                <div className="pb-8">
                  <Badge className="mb-2 bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
                    Phase 3 - Q3 2026
                  </Badge>
                  <h4 className="font-bold mb-1">Core Analytics</h4>
                  <p className="text-sm text-gray-400">
                    Basic statistics dashboard with essential metrics and visualizations
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-purple-400" />
                  <div className="w-px flex-1 bg-steel" />
                </div>
                <div className="pb-8">
                  <Badge className="mb-2 bg-purple-500/10 text-purple-400 border-purple-500/30">
                    Phase 4 - Q4 2026
                  </Badge>
                  <h4 className="font-bold mb-1">Advanced Analytics</h4>
                  <p className="text-sm text-gray-400">
                    AI-powered insights, predictions, and personalized recommendations
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                </div>
                <div>
                  <Badge className="mb-2 bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                    Phase 5 - Q1 2027
                  </Badge>
                  <h4 className="font-bold mb-1">Social Analytics</h4>
                  <p className="text-sm text-gray-400">
                    Compare your stats with friends and the community
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-cyan-500/10 border border-cyan-500/30 rounded-2xl p-8 text-center">
          <BarChart3 className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">Coming Soon</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Advanced statistics and analytics are in active development. Your gaming data will be ready when this launches!
          </p>
          <Link href="/dashboard">
            <Button className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-void font-bold">
              Back to Dashboard
            </Button>
          </Link>
        </div>
        </div>

        <style jsx global>{`
          @keyframes dash {
            0%, 100% {
              stroke-dasharray: 1000;
              stroke-dashoffset: 0;
            }
            50% {
              stroke-dashoffset: 500;
            }
          }
        `}</style>
    </>
  );
}
