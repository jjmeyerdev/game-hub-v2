'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Gamepad2, Zap, Shield, Target, Trophy, Clock, Users } from 'lucide-react';
import {
  SteamLogo,
  PlayStationLogo,
  XboxLogo,
  EpicLogo,
  NintendoLogo,
  GOGLogo,
} from '@/components/icons/PlatformLogos';
import { ModeToggle } from '@/components/theme';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [activeStatIndex, setActiveStatIndex] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);

    const handleMouseMove = (e: MouseEvent) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        setMousePosition({
          x: (e.clientX - rect.left) / rect.width,
          y: (e.clientY - rect.top) / rect.height,
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Cycle through stats
    const statInterval = setInterval(() => {
      setActiveStatIndex((prev) => (prev + 1) % 4);
    }, 3000);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(statInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[var(--theme-bg-primary)] text-[var(--theme-text-primary)] overflow-hidden">
      {/* Noise texture */}
      <div className="noise-overlay" />

      {/* Scan line effect */}
      <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
        <div
          className="absolute w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent animate-scan-line"
        />
      </div>

      {/* Grid background */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(90deg, rgba(34, 211, 238, 0.5) 1px, transparent 1px),
              linear-gradient(rgba(34, 211, 238, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
        {/* Hex pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15z' fill='none' stroke='%2322d3ee' stroke-width='0.5'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[var(--theme-bg-primary)]/80 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-8">
          <div className="flex items-center justify-between h-20 border-b border-[var(--theme-border)]">
            <Link href="/" className="flex items-center gap-3 group">
              {/* HUD-style logo container */}
              <div className="relative">
                <div className="w-11 h-11 bg-gradient-to-br from-cyan-500 to-violet-600 rounded-lg flex items-center justify-center transform group-hover:scale-105 transition-all duration-300">
                  <Gamepad2 className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
                {/* Corner brackets */}
                <div className="absolute -top-1 -left-1 w-2 h-2 border-l-2 border-t-2 border-cyan-400/50" />
                <div className="absolute -top-1 -right-1 w-2 h-2 border-r-2 border-t-2 border-cyan-400/50" />
                <div className="absolute -bottom-1 -left-1 w-2 h-2 border-l-2 border-b-2 border-cyan-400/50" />
                <div className="absolute -bottom-1 -right-1 w-2 h-2 border-r-2 border-b-2 border-cyan-400/50" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-semibold tracking-wide text-[var(--theme-text-primary)] font-[family-name:var(--font-family-display)]">
                  GAMEHUB
                </span>
                <span className="text-[9px] font-mono text-[var(--theme-text-muted)] tracking-wider uppercase">
                  // COMMAND_CENTER
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <Link href="/features" className="text-sm text-[var(--theme-text-muted)] hover:text-[var(--theme-accent-cyan)] transition-colors tracking-wide uppercase">
                Features
              </Link>
              <Link href="/login" className="text-sm text-[var(--theme-text-muted)] hover:text-[var(--theme-accent-cyan)] transition-colors tracking-wide uppercase">
                Sign in
              </Link>
              <ModeToggle />
              {/* <Link
                href="/signup"
                className="group relative px-6 py-2.5 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-violet-600 rounded-lg opacity-90 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative text-sm font-semibold text-white tracking-wide uppercase">
                  Get Started
                </span>
              </Link> */}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center pt-20"
      >
        {/* Dynamic gradient that follows mouse */}
        <div
          className="absolute inset-0 transition-opacity duration-1000"
          style={{
            background: `
              radial-gradient(600px circle at ${mousePosition.x * 100}% ${mousePosition.y * 100}%, rgba(34, 211, 238, 0.08), transparent 40%),
              radial-gradient(400px circle at ${(1 - mousePosition.x) * 100}% ${(1 - mousePosition.y) * 100}%, rgba(168, 85, 247, 0.06), transparent 40%)
            `,
            opacity: mounted ? 1 : 0,
          }}
        />

        {/* Ambient glows */}
        <div className="absolute top-1/4 left-1/4 w-[800px] h-[800px] rounded-full bg-cyan-500/[0.03] blur-[150px] animate-breathe" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] rounded-full bg-violet-500/[0.04] blur-[120px] animate-breathe" style={{ animationDelay: '2s' }} />

        {/* Floating platform logos */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {mounted && (
            <>
              <FloatingPlatform Logo={SteamLogo} delay={0} x={8} y={22} />
              <FloatingPlatform Logo={PlayStationLogo} delay={1.5} x={88} y={18} />
              <FloatingPlatform Logo={XboxLogo} delay={3} x={85} y={68} />
              <FloatingPlatform Logo={EpicLogo} delay={4.5} x={12} y={72} />
              <FloatingPlatform Logo={NintendoLogo} delay={6} x={92} y={45} />
              <FloatingPlatform Logo={GOGLogo} delay={7.5} x={5} y={48} />
            </>
          )}
        </div>

        {/* Main content */}
        <div className="relative z-10 max-w-6xl mx-auto px-8">
          <div className="grid lg:grid-cols-[1fr,400px] gap-16 items-center">
            {/* Left column - Main headline */}
            <div className="text-left">
              {/* Status badge */}
              <div
                className={`inline-flex items-center gap-3 px-4 py-2 rounded-full border border-cyan-400/20 bg-cyan-400/[0.05] mb-8 transition-all duration-1000 ${
                  mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                <span className="text-[10px] font-medium text-cyan-400 uppercase tracking-[0.25em] font-[family-name:var(--font-family-display)]">
                  System Online • All Platforms Synced
                </span>
              </div>

              {/* Main headline with terminal-style effect */}
              <h1
                className={`font-[family-name:var(--font-family-display)] text-[clamp(3rem,8vw,6rem)] font-bold leading-[0.95] tracking-tight mb-6 transition-all duration-1000 delay-100 ${
                  mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                <span className="block text-[var(--theme-text-primary)]">
                  UNIFIED
                </span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-cyan-300 to-violet-400 glow-cyan">
                  COMMAND
                </span>
                <span className="block text-[var(--theme-text-secondary)]">
                  CENTER
                </span>
              </h1>

              {/* Subtitle with typing effect styling */}
              <p
                className={`text-base md:text-lg text-[var(--theme-text-muted)] max-w-lg mb-10 leading-relaxed transition-all duration-1000 delay-200 ${
                  mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                <span className="text-cyan-400/60 font-mono text-sm">&gt;</span> Aggregate your entire gaming universe.
                Track playtime, achievements, and backlog across
                <span className="text-cyan-400"> Steam</span>,
                <span className="text-violet-400"> PlayStation</span>,
                <span className="text-emerald-400"> Xbox</span>, and more.
              </p>

              {/* CTA Buttons */}
              <div
                className={`flex flex-col sm:flex-row items-start gap-4 transition-all duration-1000 delay-300 ${
                  mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                <Link
                  href="/signup"
                  className="group relative overflow-hidden"
                >
                  {/* Glow effect */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-violet-600 rounded-xl blur opacity-30 group-hover:opacity-60 transition-opacity duration-500" />
                  <div className="relative flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-500 to-violet-600 rounded-xl">
                    <Zap className="w-5 h-5 text-white" />
                    <span className="font-semibold text-white tracking-wide uppercase font-[family-name:var(--font-family-display)]">
                      Get Started
                    </span>
                    {/* <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" /> */}
                  </div>
                </Link>
                <Link
                  href="/features"
                  className="group flex items-center gap-3 px-6 py-4 text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] font-medium transition-all border border-[var(--theme-border)] hover:border-[var(--theme-border-hover)] rounded-xl hover:bg-[var(--theme-hover-bg)]"
                >
                  <span className="tracking-wide">Learn More</span>
                  {/* <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /> */}
                </Link>
              </div>
            </div>

            {/* Right column - Stats HUD */}
            <div
              className={`hidden lg:block transition-all duration-1000 delay-400 ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <div className="relative">
                {/* HUD Frame */}
                <div className="absolute -inset-4">
                  <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-cyan-400/30" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-cyan-400/30" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-cyan-400/30" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-cyan-400/30" />
                </div>

                <div className="bg-[var(--theme-bg-secondary)]/80 backdrop-blur-xl border border-[var(--theme-border)] rounded-2xl p-6 space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-[var(--theme-border)] pb-4">
                    <span className="text-[10px] font-mono text-cyan-400/60 uppercase tracking-wider">// SYSTEM_STATUS</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] font-mono text-emerald-400">ACTIVE</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="space-y-3">
                    {[
                      { icon: Target, label: 'Platforms Connected', value: '6+', color: 'cyan', hud: 'border-cyan-400/50' },
                      { icon: Trophy, label: 'Achievements Tracked', value: '∞', color: 'amber', hud: 'border-amber-400/50' },
                      { icon: Clock, label: 'Sync Interval', value: 'Real-time', color: 'emerald', hud: 'border-emerald-400/50' },
                      { icon: Users, label: 'Active Users', value: '10K+', color: 'violet', hud: 'border-violet-400/50' },
                    ].map((stat, index) => (
                      <div
                        key={stat.label}
                        className={`group relative flex items-center gap-4 p-3 rounded-lg transition-all duration-500 overflow-hidden ${
                          activeStatIndex === index
                            ? 'bg-[var(--theme-hover-bg)] border border-[var(--theme-border)]'
                            : 'hover:bg-[var(--theme-hover-bg)]'
                        }`}
                      >
                        {/* Hover HUD corners */}
                        <div className={`absolute top-0 left-0 w-2 h-2 border-l border-t ${stat.hud} opacity-0 group-hover:opacity-100 transition-opacity`} />
                        <div className={`absolute top-0 right-0 w-2 h-2 border-r border-t ${stat.hud} opacity-0 group-hover:opacity-100 transition-opacity`} />
                        <div className={`absolute bottom-0 left-0 w-2 h-2 border-l border-b ${stat.hud} opacity-0 group-hover:opacity-100 transition-opacity`} />
                        <div className={`absolute bottom-0 right-0 w-2 h-2 border-r border-b ${stat.hud} opacity-0 group-hover:opacity-100 transition-opacity`} />

                        <div className={`relative p-2 rounded-lg bg-${stat.color}-400/10`}>
                          <stat.icon className={`w-4 h-4 text-${stat.color}-400`} />
                        </div>
                        <div className="relative flex-1">
                          <div className="text-[10px] text-[var(--theme-text-muted)] uppercase tracking-wider font-mono">{stat.label}</div>
                          <div className="text-lg font-bold font-[family-name:var(--font-family-display)] text-[var(--theme-text-primary)] tabular-nums">
                            {stat.value}
                          </div>
                        </div>
                        {activeStatIndex === index && (
                          <div className={`relative w-1 h-8 rounded-full bg-${stat.color}-400`} />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="pt-4 border-t border-[var(--theme-border)]">
                    <div className="flex items-center justify-between text-[10px] font-mono text-[var(--theme-text-subtle)]">
                      <span>Last Update: NOW</span>
                      <span>v2.0.0</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          className={`absolute bottom-12 left-1/2 -translate-x-1/2 transition-all duration-1000 delay-700 ${
            mounted ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="flex flex-col items-center gap-3">
            <span className="text-[9px] uppercase tracking-[0.4em] text-cyan-400/40 font-[family-name:var(--font-family-display)]">
              Scroll to Explore
            </span>
            <div className="w-5 h-8 rounded-full border border-cyan-400/30 flex items-start justify-center p-1">
              <div className="w-1 h-2 rounded-full bg-cyan-400 animate-bounce" />
            </div>
          </div>
        </div>
      </section>

      {/* Platform Logos Section */}
      <section className="relative py-20 border-t border-[var(--theme-border)]">
        <div className="max-w-[1400px] mx-auto px-8">
          <div className="flex items-center justify-center gap-4 mb-12">
            <div className="h-px flex-1 max-w-32 bg-gradient-to-r from-transparent to-[var(--theme-border)]" />
            <span className="text-[10px] font-mono text-[var(--theme-accent-cyan)] opacity-60 uppercase tracking-wider">
              // INTEGRATED_PLATFORMS
            </span>
            <div className="h-px flex-1 max-w-32 bg-gradient-to-l from-transparent to-[var(--theme-border)]" />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            {[
              { Logo: SteamLogo, name: 'Steam', hoverColor: 'group-hover:text-[#66c0f4]', borderColor: 'border-[#66c0f4]/50', glowColor: 'group-hover:bg-[#66c0f4]/10' },
              { Logo: PlayStationLogo, name: 'PlayStation', hoverColor: 'group-hover:text-[#003087]', borderColor: 'border-[#003087]/50', glowColor: 'group-hover:bg-[#003087]/10' },
              { Logo: XboxLogo, name: 'Xbox', hoverColor: 'group-hover:text-[#107C10]', borderColor: 'border-[#107C10]/50', glowColor: 'group-hover:bg-[#107C10]/10' },
              { Logo: EpicLogo, name: 'Epic', hoverColor: 'group-hover:text-black', borderColor: 'border-black/50', glowColor: 'group-hover:bg-[#333333]/30' },
              { Logo: NintendoLogo, name: 'Nintendo', hoverColor: 'group-hover:text-[#E60012]', borderColor: 'border-[#E60012]/50', glowColor: 'group-hover:bg-[#E60012]/10' },
              { Logo: GOGLogo, name: 'GOG', hoverColor: 'group-hover:text-[#86328A]', borderColor: 'border-[#86328A]/50', glowColor: 'group-hover:bg-[#86328A]/10' },
            ].map(({ Logo, name, hoverColor, borderColor, glowColor }) => (
              <div key={name} className="group relative">
                <div className="relative p-4 overflow-hidden">
                  {/* Hover HUD corners */}
                  <div className={`absolute top-0 left-0 w-2 h-2 border-l border-t ${borderColor} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  <div className={`absolute top-0 right-0 w-2 h-2 border-r border-t ${borderColor} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  <div className={`absolute bottom-0 left-0 w-2 h-2 border-l border-b ${borderColor} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  <div className={`absolute bottom-0 right-0 w-2 h-2 border-r border-b ${borderColor} opacity-0 group-hover:opacity-100 transition-opacity`} />

                  <Logo size="lg" className={`relative text-[var(--theme-text-subtle)] ${hoverColor} opacity-60 group-hover:opacity-100 transition-all duration-500`} />
                  {/* Glow on hover */}
                  <div className={`absolute inset-0 bg-transparent ${glowColor} rounded-full blur-xl transition-all duration-500`} />
                </div>
                <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] font-mono uppercase tracking-wider text-transparent group-hover:text-[var(--theme-text-muted)] transition-all duration-300 whitespace-nowrap">
                  {name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-32">
        <div className="max-w-[1400px] mx-auto px-8">
          {/* Section header */}
          <div className="text-center mb-20">
            <span className="inline-block text-[10px] font-mono text-[var(--theme-accent-cyan)] opacity-60 uppercase tracking-wider mb-4">
              // SYSTEM_CAPABILITIES
            </span>
            <h2 className="text-4xl md:text-5xl font-bold font-[family-name:var(--font-family-display)] tracking-tight">
              <span className="text-[var(--theme-text-primary)]">MISSION </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400">
                CONTROL
              </span>
            </h2>
          </div>

          {/* Feature grid */}
          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              number="01"
              icon={Target}
              title="AGGREGATE"
              description="Connect all your gaming platforms in one secure dashboard. Steam, PlayStation, Xbox, Epic, Nintendo - unified under a single command."
              color="cyan"
            />
            <FeatureCard
              number="02"
              icon={Trophy}
              title="ANALYZE"
              description="Track every achievement, completion percentage, and playtime hour. Visual analytics reveal your gaming patterns and milestones."
              color="violet"
            />
            <FeatureCard
              number="03"
              icon={Shield}
              title="CONQUER"
              description="Manage your backlog strategically. Priority queues, smart recommendations, and progress tracking to dominate your library."
              color="emerald"
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-32 overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[400px] bg-gradient-to-r from-cyan-500/[0.02] via-violet-500/[0.03] to-cyan-500/[0.02] blur-3xl" />
        </div>

        <div className="relative max-w-[1400px] mx-auto px-8">
          {/* Section header */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <div className="h-px flex-1 max-w-32 bg-gradient-to-r from-transparent to-[var(--theme-border)]" />
            <span className="text-[10px] font-mono text-[var(--theme-accent-cyan)] opacity-60 uppercase tracking-wider">
              // PERFORMANCE_METRICS
            </span>
            <div className="h-px flex-1 max-w-32 bg-gradient-to-l from-transparent to-[var(--theme-border)]" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatCard value="10+" label="Platforms" icon="🎮" />
            <StatCard value="∞" label="Games Tracked" icon="📊" />
            <StatCard value="Real-time" label="Sync" highlight />
            <StatCard value="Free" label="Forever" icon="⚡" />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-32">
        <div className="max-w-4xl mx-auto px-8 text-center">
          {/* Background glow */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[600px] h-[400px] rounded-full bg-gradient-to-r from-cyan-500/[0.04] to-violet-500/[0.04] blur-[100px]" />
          </div>

          {/* HUD corners */}
          <div className="relative">
            <div className="absolute -top-8 -left-8 w-16 h-16 border-l-2 border-t-2 border-cyan-400/30" />
            <div className="absolute -top-8 -right-8 w-16 h-16 border-r-2 border-t-2 border-cyan-400/30" />
            <div className="absolute -bottom-8 -left-8 w-16 h-16 border-l-2 border-b-2 border-cyan-400/30" />
            <div className="absolute -bottom-8 -right-8 w-16 h-16 border-r-2 border-b-2 border-cyan-400/30" />

            <span className="inline-block text-[10px] font-mono text-[var(--theme-accent-cyan)] opacity-60 uppercase tracking-wider mb-6">
              // INITIATE_SEQUENCE
            </span>

            <h2 className="relative text-4xl md:text-6xl font-bold font-[family-name:var(--font-family-display)] tracking-tight mb-6">
              <span className="text-[var(--theme-text-primary)]">Ready to </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400 glow-cyan">
                Unify
              </span>
              <span className="text-[var(--theme-text-primary)]">?</span>
            </h2>

            <p className="relative text-[var(--theme-text-muted)] text-lg mb-12 max-w-md mx-auto">
              Join the commanders who&apos;ve brought order to their gaming chaos.
            </p>

            <Link
              href="/signup"
              className="group relative inline-flex items-center gap-3 overflow-hidden"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-violet-600 rounded-xl blur opacity-40 group-hover:opacity-70 transition-opacity duration-500" />
              <div className="relative flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-cyan-500 to-violet-600 rounded-xl">
                <span className="font-semibold text-white text-lg tracking-wide uppercase font-[family-name:var(--font-family-display)]">
                  Create Free Account
                </span>
                {/* <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" /> */}
              </div>
            </Link>

            <p className="relative mt-8 text-xs text-[var(--theme-text-subtle)] font-mono">
              NO CREDIT CARD REQUIRED • INSTANT ACCESS
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 border-t border-[var(--theme-border)]">
        <div className="max-w-[1400px] mx-auto px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 bg-gradient-to-br from-cyan-500 to-violet-600 rounded-lg flex items-center justify-center">
                <Gamepad2 className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <span className="text-sm font-semibold text-[var(--theme-text-secondary)] font-[family-name:var(--font-family-display)] tracking-wide">
                  GAMEHUB
                </span>
                <span className="hidden sm:inline text-[10px] text-[var(--theme-text-muted)] ml-3 font-mono">
                  v2.0.0-beta
                </span>
              </div>
            </div>
            {/* <div className="flex items-center gap-8">
              <Link href="/features" className="text-xs text-[var(--theme-text-muted)] hover:text-[var(--theme-accent-cyan)] transition-colors uppercase tracking-wider">
                Features
              </Link>
              <Link href="/login" className="text-xs text-[var(--theme-text-muted)] hover:text-[var(--theme-accent-cyan)] transition-colors uppercase tracking-wider">
                Sign in
              </Link>
            </div> */}
            <div className="text-[10px] text-[var(--theme-text-subtle)] font-mono">
              &copy; {new Date().getFullYear()} GAMEHUB • ALL SYSTEMS OPERATIONAL
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Floating platform logo component
interface FloatingPlatformProps {
  Logo: React.ComponentType<{ size: 'sm' | 'md' | 'lg' | 'xl'; className?: string }>;
  delay: number;
  x: number;
  y: number;
}

function FloatingPlatform({ Logo, delay, x, y }: FloatingPlatformProps) {
  return (
    <div
      className="absolute animate-float"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        animationDelay: `${delay}s`,
      }}
    >
      <div className="relative group">
        <Logo size="xl" className="text-[var(--theme-text-primary)] opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-1000" />
        {/* Glow effect */}
        <div className="absolute inset-0 bg-cyan-400/0 blur-xl group-hover:bg-cyan-400/10 transition-all duration-1000" />
      </div>
    </div>
  );
}

// Feature card component
interface FeatureCardProps {
  number: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: 'cyan' | 'violet' | 'emerald';
}

function FeatureCard({ number, icon: Icon, title, description, color }: FeatureCardProps) {
  const colorClasses = {
    cyan: 'border-cyan-400/20 group-hover:border-cyan-400/40 group-hover:shadow-cyan-400/10',
    violet: 'border-violet-400/20 group-hover:border-violet-400/40 group-hover:shadow-violet-400/10',
    emerald: 'border-emerald-400/20 group-hover:border-emerald-400/40 group-hover:shadow-emerald-400/10',
  };

  const iconColorClasses = {
    cyan: 'text-cyan-400 bg-cyan-400/10',
    violet: 'text-violet-400 bg-violet-400/10',
    emerald: 'text-emerald-400 bg-emerald-400/10',
  };

  const hudColorClasses = {
    cyan: 'border-cyan-400/50',
    violet: 'border-violet-400/50',
    emerald: 'border-emerald-400/50',
  };

  return (
    <div className={`group relative p-8 rounded-2xl border bg-[var(--theme-bg-secondary)] transition-all duration-500 hover:bg-[var(--theme-hover-bg)] hover:shadow-2xl overflow-hidden ${colorClasses[color]}`}>
      {/* Hover HUD corners */}
      <div className={`absolute top-0 left-0 w-5 h-5 border-l-2 border-t-2 ${hudColorClasses[color]} opacity-0 group-hover:opacity-100 transition-opacity z-10`} />
      <div className={`absolute top-0 right-0 w-5 h-5 border-r-2 border-t-2 ${hudColorClasses[color]} opacity-0 group-hover:opacity-100 transition-opacity z-10`} />
      <div className={`absolute bottom-0 left-0 w-5 h-5 border-l-2 border-b-2 ${hudColorClasses[color]} opacity-0 group-hover:opacity-100 transition-opacity z-10`} />
      <div className={`absolute bottom-0 right-0 w-5 h-5 border-r-2 border-b-2 ${hudColorClasses[color]} opacity-0 group-hover:opacity-100 transition-opacity z-10`} />

      {/* Number */}
      <div className="relative text-[10px] text-[var(--theme-text-subtle)] font-mono mb-6 tracking-wider">
        // {number}
      </div>

      {/* Icon */}
      <div className={`relative inline-flex p-3 rounded-xl mb-6 ${iconColorClasses[color]}`}>
        <Icon className="w-6 h-6" />
      </div>

      {/* Content */}
      <h3 className="relative text-xl font-bold font-[family-name:var(--font-family-display)] text-[var(--theme-text-primary)] mb-3 tracking-wide">
        {title}
      </h3>
      <p className="relative text-sm text-[var(--theme-text-muted)] leading-relaxed">
        {description}
      </p>

      {/* Bottom accent line */}
      <div className={`absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-${color}-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
    </div>
  );
}

// Stat card component
interface StatCardProps {
  value: string;
  label: string;
  icon?: string;
  highlight?: boolean;
}

function StatCard({ value, label, highlight = false }: StatCardProps) {
  return (
    <div className="relative text-center p-8 group overflow-hidden">
      {/* Hover HUD corners */}
      <div className="absolute top-2 left-2 w-3 h-3 border-l border-t border-cyan-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute top-2 right-2 w-3 h-3 border-r border-t border-cyan-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-2 left-2 w-3 h-3 border-l border-b border-cyan-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-2 right-2 w-3 h-3 border-r border-b border-cyan-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* HUD frame on hover */}
      <div className="absolute inset-2 border border-transparent group-hover:border-cyan-400/20 rounded-xl transition-all duration-500" />

      <div
        className={`relative text-4xl md:text-6xl font-bold font-[family-name:var(--font-family-display)] mb-2 transition-all duration-500 tabular-nums ${
          highlight
            ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400 glow-cyan'
            : 'text-[var(--theme-text-primary)] group-hover:text-[var(--theme-accent-cyan)]'
        }`}
      >
        {value}
      </div>
      <div className="relative text-[10px] text-[var(--theme-text-muted)] uppercase tracking-wider font-mono">
        {label}
      </div>
    </div>
  );
}
