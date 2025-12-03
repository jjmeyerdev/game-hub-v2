'use client';

import Link from 'next/link';
import { Users, MessageCircle, Gamepad2, UserPlus, Heart, Share2, Crown } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export default function FriendsPage() {
  const socialFeatures = [
    {
      icon: Users,
      title: 'Friend Network',
      description: 'Connect with gamers across all platforms. Build your unified gaming social circle.',
      highlights: [
        'Cross-platform friend system',
        'Unified friend list from Steam, PSN, Xbox',
        'Privacy controls for profile visibility',
      ],
      phase: 'Phase 4',
      color: 'cyan',
    },
    {
      icon: Gamepad2,
      title: 'Gaming Activity Feed',
      description: 'See what your friends are playing, achieving, and discovering in real-time.',
      highlights: [
        'Live activity updates',
        'Achievement celebrations',
        'Game recommendations from friends',
      ],
      phase: 'Phase 4',
      color: 'purple',
    },
    {
      icon: MessageCircle,
      title: 'Game Discussion',
      description: 'Chat about games, share tips, organize co-op sessions, and plan gaming nights.',
      highlights: [
        'Per-game discussion threads',
        'Session planning tools',
        'Voice chat integration',
      ],
      phase: 'Phase 4',
      color: 'emerald',
    },
    {
      icon: Crown,
      title: 'Leaderboards & Challenges',
      description: 'Compete with friends on completion rates, playtime, and custom challenges.',
      highlights: [
        'Friend leaderboards',
        'Custom gaming challenges',
        'Seasonal competitions',
      ],
      phase: 'Phase 4',
      color: 'cyan',
    },
    {
      icon: Share2,
      title: 'Library Sharing',
      description: 'Discover what games your friends own, recommend titles, and coordinate multiplayer.',
      highlights: [
        'Shared game discovery',
        'Co-op game finder',
        'Game trading marketplace',
      ],
      phase: 'Phase 5',
      color: 'purple',
    },
    {
      icon: Heart,
      title: 'Gaming Communities',
      description: 'Join communities around your favorite games, genres, or playstyles.',
      highlights: [
        'Genre-based communities',
        'Game-specific groups',
        'Event organization',
      ],
      phase: 'Phase 5',
      color: 'emerald',
    },
  ];

  return (
    <DashboardLayout>
      {/* Animated connection nodes background */}
      <div className="fixed inset-0 pointer-events-none">
          <svg className="absolute inset-0 w-full h-full opacity-5">
            <defs>
              <pattern id="connections" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
                <circle cx="50" cy="50" r="2" fill="currentColor" className="text-cyan-400" />
                <circle cx="150" cy="50" r="2" fill="currentColor" className="text-purple-400" />
                <circle cx="100" cy="150" r="2" fill="currentColor" className="text-emerald-400" />
                <line x1="50" y1="50" x2="150" y2="50" stroke="currentColor" strokeWidth="0.5" className="text-cyan-400" opacity="0.3" />
                <line x1="150" y1="50" x2="100" y2="150" stroke="currentColor" strokeWidth="0.5" className="text-purple-400" opacity="0.3" />
                <line x1="100" y1="150" x2="50" y2="50" stroke="currentColor" strokeWidth="0.5" className="text-emerald-400" opacity="0.3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#connections)" />
          </svg>
          <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/3 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-12">
          {/* Header */}
          <div className="mb-12">

          {/* Hero Section */}
          <div className="relative bg-gradient-to-br from-deep via-abyss to-deep border-2 border-purple-500/30 rounded-3xl p-12 overflow-hidden">
            {/* Animated pulse circles */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="w-32 h-32 rounded-full border-2 border-purple-500/20 animate-ping" style={{ animationDuration: '3s' }} />
              <div className="absolute inset-0 w-32 h-32 rounded-full border-2 border-cyan-500/20 animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }} />
            </div>

            <div className="relative">
              <div className="flex items-start justify-between mb-6">
                <div className="inline-flex items-center gap-3">
                  <div className="relative">
                    <Users className="w-16 h-16 text-purple-400" />
                    <div className="absolute -top-2 -right-2 flex gap-0.5">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                    </div>
                  </div>
                  <Badge variant="outline" className="border-purple-500/30 text-purple-400">
                    COMING SOON
                  </Badge>
                </div>

                {/* Mock online indicator */}
                <div className="hidden md:flex items-center gap-2 bg-deep/80 backdrop-blur-sm border border-steel rounded-full px-4 py-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-sm text-gray-400">Social Features</span>
                </div>
              </div>

              <h1 className="text-7xl font-bold mb-4 leading-none">
                <span className="bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent animate-shimmer">
                  FRIENDS
                </span>
              </h1>

              <p className="text-xl text-gray-300 max-w-2xl mb-8">
                Connect with your gaming community. Share achievements, discover games together,
                and never game alone again.
              </p>

              <div className="flex items-center gap-6">
                <div className="flex -space-x-3">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 border-2 border-void flex items-center justify-center text-xs font-bold"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    >
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                  <div className="w-10 h-10 rounded-full bg-deep border-2 border-steel flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-gray-500" />
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Join the community</div>
                  <div className="text-lg font-bold text-purple-400">Q4 2026</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-steel to-transparent" />
            <h2 className="text-2xl font-bold text-purple-400 uppercase tracking-wider">
              Social Features
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-steel via-steel to-transparent" />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {socialFeatures.map((feature, index) => {
              const Icon = feature.icon;
              const colorClass = feature.color === 'cyan'
                ? 'from-cyan-500/10 to-cyan-500/5 border-cyan-500/30'
                : feature.color === 'purple'
                ? 'from-purple-500/10 to-purple-500/5 border-purple-500/30'
                : 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/30';

              const iconColor = feature.color === 'cyan'
                ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
                : feature.color === 'purple'
                ? 'text-purple-400 bg-purple-500/10 border-purple-500/30'
                : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';

              return (
                <Card
                  key={index}
                  className={`relative group bg-gradient-to-br ${colorClass} border transition-all duration-300 hover:scale-[1.02] overflow-hidden`}
                  style={{
                    animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`,
                  }}
                >
                  <div className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`w-12 h-12 rounded-xl ${iconColor} border flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-xl font-bold text-white">{feature.title}</h3>
                        </div>
                        <Badge variant="outline" className="border-steel text-gray-400 text-xs">
                          {feature.phase}
                        </Badge>
                      </div>
                    </div>

                    <p className="text-gray-400 mb-4">{feature.description}</p>

                    <div className="space-y-2">
                      {feature.highlights.map((highlight, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-gray-500">
                          <div className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${iconColor.split(' ')[0]}`} />
                          <span>{highlight}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Animated bottom border */}
                  <div className="h-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent group-hover:via-purple-500 transition-all" />
                </Card>
              );
            })}
          </div>
        </div>

        {/* Why Social Gaming Section */}
        <div className="mt-16 grid md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-cyan-500/10 to-transparent border-cyan-500/30 p-6">
            <Share2 className="w-10 h-10 text-cyan-400 mb-4" />
            <h3 className="text-lg font-bold mb-2">Discover Together</h3>
            <p className="text-sm text-gray-400">
              Find new games through your friends' libraries and recommendations
            </p>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/30 p-6">
            <MessageCircle className="w-10 h-10 text-purple-400 mb-4" />
            <h3 className="text-lg font-bold mb-2">Stay Connected</h3>
            <p className="text-sm text-gray-400">
              Never miss when your friends are online and ready to play
            </p>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/30 p-6">
            <Crown className="w-10 h-10 text-emerald-400 mb-4" />
            <h3 className="text-lg font-bold mb-2">Compete & Celebrate</h3>
            <p className="text-sm text-gray-400">
              Challenge friends, compare progress, and celebrate achievements
            </p>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-br from-purple-500/10 via-cyan-500/5 to-purple-500/10 border border-purple-500/30 rounded-2xl p-8 text-center">
          <Users className="w-12 h-12 text-purple-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">Building the Social Layer</h3>
          <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
            Social features are currently in development. We're building a unified gaming social experience
            that connects you with friends across all platforms. Stay tuned for updates!
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/dashboard">
              <Button className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-void font-bold">
                Return to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
