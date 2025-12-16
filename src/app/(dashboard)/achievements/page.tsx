'use client';

import Link from 'next/link';
import { Trophy, Lock, Star, Target, Award, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function AchievementsPage() {
  const roadmapItems = [
    {
      icon: Trophy,
      title: 'Cross-Platform Achievement Tracking',
      description: 'Unified view of achievements from Steam, PlayStation, Xbox, and more',
      phase: 'Phase 2',
      color: 'emerald',
    },
    {
      icon: Target,
      title: 'Achievement Analytics',
      description: 'Track completion rates, rarity, and progress across your library',
      phase: 'Phase 2',
      color: 'cyan',
    },
    {
      icon: Star,
      title: 'Rare Achievement Showcase',
      description: 'Highlight your rarest achievements with global completion percentages',
      phase: 'Phase 2',
      color: 'purple',
    },
    {
      icon: Zap,
      title: 'Achievement Challenges',
      description: 'Set personal achievement goals and track your hunting progress',
      phase: 'Phase 3',
      color: 'cyan',
    },
    {
      icon: Award,
      title: 'Achievement Comparisons',
      description: 'Compare your achievement progress with friends',
      phase: 'Phase 4',
      color: 'purple',
    },
  ];

  return (
    <>
      {/* Animated background with rotating trophy pattern */}
      <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 opacity-5">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${i * 0.3}s`,
                  animationDuration: '4s',
                }}
              >
                <Trophy className="w-12 h-12 text-emerald-400 rotate-12" />
              </div>
            ))}
          </div>
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 py-12">
          {/* Header */}
          <div className="mb-12">

          {/* Hero Section */}
          <div className="relative">
            <div className="absolute -top-8 -left-8 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl animate-pulse" />
            <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-cyan-500/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />

            <div className="relative bg-gradient-to-br from-deep via-abyss to-deep border-2 border-emerald-500/30 rounded-3xl p-12 overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-3xl" />

              <div className="relative">
                <div className="inline-flex items-center gap-3 mb-6">
                  <div className="relative">
                    <Trophy className="w-16 h-16 text-emerald-400" />
                    <Lock className="absolute -bottom-1 -right-1 w-6 h-6 text-emerald-400 bg-void rounded-full p-1" />
                  </div>
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
                    COMING SOON
                  </Badge>
                </div>

                <h1 className="text-7xl font-bold mb-4 leading-none">
                  <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                    ACHIEVEMENTS
                  </span>
                </h1>

                <p className="text-xl text-gray-300 max-w-2xl mb-8">
                  Track, compare, and showcase your gaming achievements across all platforms.
                  Hunt for rare trophies and celebrate your victories.
                </p>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-sm text-gray-400">In Development</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Expected: <span className="text-emerald-400 font-bold">Q2 2026</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Roadmap Section */}
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-steel to-transparent" />
            <h2 className="text-2xl font-bold text-cyan-400 uppercase tracking-wider">
              Development Roadmap
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-steel via-steel to-transparent" />
          </div>

          <div className="grid gap-6">
            {roadmapItems.map((item, index) => {
              const Icon = item.icon;
              const colorClass = item.color === 'emerald'
                ? 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/30'
                : item.color === 'cyan'
                ? 'from-cyan-500/10 to-cyan-500/5 border-cyan-500/30'
                : 'from-purple-500/10 to-purple-500/5 border-purple-500/30';

              const iconColor = item.color === 'emerald'
                ? 'text-emerald-400'
                : item.color === 'cyan'
                ? 'text-cyan-400'
                : 'text-purple-400';

              return (
                <div
                  key={index}
                  className={`relative group bg-gradient-to-r ${colorClass} border rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl`}
                  style={{
                    animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`,
                  }}
                >
                  <div className="flex items-start gap-6">
                    <div className={`w-14 h-14 rounded-xl bg-deep border border-steel flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-7 h-7 ${iconColor}`} />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-xl font-bold text-white">{item.title}</h3>
                        <Badge variant="outline" className="border-steel text-gray-400 ml-4">
                          {item.phase}
                        </Badge>
                      </div>
                      <p className="text-gray-400">{item.description}</p>
                    </div>
                  </div>

                  {/* Progress indicator */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-steel/20 rounded-b-2xl overflow-hidden">
                    <div className={`h-full bg-gradient-to-r ${iconColor === 'text-emerald-400' ? 'from-emerald-500' : iconColor === 'text-cyan-400' ? 'from-cyan-500' : 'from-purple-500'} to-transparent`}
                      style={{ width: index === 0 ? '60%' : index < 3 ? '30%' : '10%' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stay Updated Section */}
        <div className="mt-16 bg-gradient-to-br from-deep to-abyss border border-steel rounded-2xl p-8 text-center">
          <Trophy className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">Stay Updated</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Achievement tracking is in active development. Check back soon for updates!
          </p>
          <Link href="/dashboard">
            <Button className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-void font-bold">
              Return to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
}
