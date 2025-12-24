'use client';

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Gamepad2,
  Layers,
  BarChart3,
  Trophy,
  Clock,
  Users,
  Zap,
  Monitor,
  Smartphone,
  Globe,
  Radio,
  Hand,
  Target,
  Cpu,
  Database,
  Wifi,
  Lock,
  Activity,
  Server,
} from 'lucide-react';
import {
  SteamLogo,
  PlayStationLogo,
  XboxLogo,
  EpicLogo,
  NintendoLogo,
  GOGLogo,
  EALogo,
  BattleNetLogo,
  UbisoftLogo,
} from '@/components/icons/PlatformLogos';
import { ModeToggle } from '@/components/theme';

export default function FeaturesPage() {
  const [mounted, setMounted] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [activeSection, setActiveSection] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);

    const handleScroll = () => {
      setScrollY(window.scrollY);
      const sections = document.querySelectorAll('[data-section]');
      sections.forEach((section, index) => {
        const rect = section.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.5 && rect.bottom > 0) {
          setActiveSection(index);
        }
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[var(--theme-bg-primary)] text-[var(--theme-text-primary)] overflow-x-hidden selection:bg-cyan-500/30">
      {/* Noise texture overlay */}
      <div className="noise-overlay" />

      {/* Scan line effect */}
      <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
        <div className="absolute w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent animate-scan-line" />
      </div>

      {/* Grid background */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(90deg, rgba(34, 211, 238, 0.5) 1px, transparent 1px),
              linear-gradient(rgba(34, 211, 238, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px',
          }}
        />
        {/* Hex pattern */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15z' fill='none' stroke='%2322d3ee' stroke-width='0.5'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[var(--theme-bg-primary)]/90 backdrop-blur-2xl border-b border-[var(--theme-border)]">
        <div className="max-w-[1400px] mx-auto px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center gap-3 group">
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
                  // SYSTEM_SPECS
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-4">
            <Link href="/" className="text-xs text-[var(--theme-text-muted)] hover:text-[var(--theme-accent-cyan)] transition-colors uppercase tracking-wider">
                Home
              </Link>
              <ModeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section
        ref={heroRef}
        data-section
        className="relative min-h-[100vh] flex items-center pt-20"
      >
        {/* Dynamic gradient background */}
        <div
          className="absolute inset-0 transition-opacity duration-1000"
          style={{
            background: `
              radial-gradient(800px circle at ${mousePosition.x * 100}% ${mousePosition.y * 100}%, rgba(34, 211, 238, 0.06), transparent 40%),
              radial-gradient(600px circle at ${(1 - mousePosition.x) * 100}% ${(1 - mousePosition.y) * 100}%, rgba(168, 85, 247, 0.05), transparent 40%)
            `,
            opacity: mounted ? 1 : 0,
          }}
        />

        {/* Ambient glows */}
        <div
          className="absolute top-0 left-1/4 w-[800px] h-[800px] rounded-full opacity-30 animate-breathe"
          style={{
            background: 'radial-gradient(circle, rgba(34, 211, 238, 0.08) 0%, transparent 70%)',
            transform: `translate(${scrollY * 0.02}px, ${scrollY * 0.01}px)`,
          }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full opacity-20 animate-breathe"
          style={{
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.1) 0%, transparent 70%)',
            transform: `translate(${scrollY * -0.015}px, ${scrollY * 0.02}px)`,
            animationDelay: '2s',
          }}
        />

        <div className="relative z-10 max-w-[1400px] mx-auto px-8 py-32">
          <div className="grid lg:grid-cols-[1fr,500px] gap-16 items-center">
            <div>
              {/* Eyebrow */}
              <div
                className={`inline-flex items-center gap-3 px-4 py-2 rounded-full border border-cyan-400/20 bg-cyan-400/[0.05] mb-8 transition-all duration-1000 ${
                  mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
              >
                <div className="relative">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-75" />
                </div>
                <span className="text-[10px] font-medium text-cyan-400 uppercase tracking-[0.25em] font-[family-name:var(--font-family-display)]">
                  Full System Documentation
                </span>
              </div>

              {/* Main Headline */}
              <h1
                className={`font-[family-name:var(--font-family-display)] text-[clamp(2.5rem,7vw,5.5rem)] font-bold leading-[0.95] tracking-tight mb-6 transition-all duration-1000 delay-100 ${
                  mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                <span className="block text-[var(--theme-text-primary)]">SYSTEM</span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-cyan-300 to-violet-400 glow-cyan">
                  CAPABILITIES
                </span>
              </h1>

              {/* Subtitle */}
              <p
                className={`text-base md:text-lg text-[var(--theme-text-muted)] max-w-lg mb-10 leading-relaxed transition-all duration-1000 delay-200 ${
                  mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                <span className="text-cyan-400/60 font-mono text-sm">&gt;</span> Complete technical breakdown of platform integrations,
                tracking systems, and command center features.
              </p>

              {/* CTA */}
              <div
                className={`flex flex-wrap items-center gap-4 transition-all duration-1000 delay-300 ${
                  mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                <Link
                  href="/signup"
                  className="group relative overflow-hidden"
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-violet-600 rounded-xl blur opacity-30 group-hover:opacity-60 transition-opacity duration-500" />
                  <div className="relative flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-500 to-violet-600 rounded-xl">
                    <Zap className="w-5 h-5 text-white" />
                    <span className="font-semibold text-white tracking-wide uppercase font-[family-name:var(--font-family-display)]">
                      Get Started
                    </span>
                    {/* <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" /> */}
                  </div>
                </Link>
                <a
                  href="#platforms"
                  className="group flex items-center gap-3 px-6 py-4 text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] font-medium transition-all border border-[var(--theme-border)] hover:border-[var(--theme-text-muted)] rounded-xl hover:bg-[var(--theme-hover-bg)]"
                >
                  <span className="tracking-wide">View Integrations</span>
                  {/* <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /> */}
                </a>
              </div>
            </div>

            {/* System Status Panel */}
            <div
              className={`hidden lg:block transition-all duration-1000 delay-400 ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <SystemStatusPanel />
            </div>
          </div>
        </div>
      </section>

      {/* Platform Integration Section */}
      <section
        id="platforms"
        data-section
        className="relative py-32"
      >
        <div className="max-w-[1400px] mx-auto px-8">
          {/* Connected Services */}
          <div className="mb-32">
            {/* Section header */}
            <div className="flex items-center gap-4 mb-12">
              <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-cyan-400/10 border border-cyan-400/20">
                <Radio className="w-4 h-4 text-cyan-400" />
                <span className="text-[10px] font-semibold text-cyan-400 uppercase tracking-[0.2em] font-[family-name:var(--font-family-display)]">
                  Live Sync Protocol
                </span>
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-cyan-500/30 to-transparent" />
              <span className="text-[10px] font-mono text-[var(--theme-text-subtle)]">// 01</span>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 mb-12">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold font-[family-name:var(--font-family-display)] tracking-tight mb-4">
                  <span className="text-[var(--theme-text-primary)]">CONNECTED </span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400">
                    PLATFORMS
                  </span>
                </h2>
                <p className="text-[var(--theme-text-muted)] text-lg leading-relaxed max-w-md">
                  <span className="text-cyan-400/60 font-mono text-sm">&gt;</span> Establish link once. Automatic synchronization forever.
                  Real-time data stream for games, achievements, and playtime.
                </p>
              </div>
            </div>

            {/* Connected Platform Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <ConnectedPlatformCard
                name="Steam"
                description="Full library sync with playtime & achievement tracking"
                icon={<SteamLogo size="lg" />}
                color="#66c0f4"
                stats={{ games: '50K+', sync: 'Real-time' }}
                status="online"
              />
              <ConnectedPlatformCard
                name="PlayStation"
                description="PSN trophy sync & cross-gen game library"
                icon={<PlayStationLogo size="lg" />}
                color="#0070cc"
                stats={{ games: '4K+', sync: '15 min' }}
                status="online"
              />
              <ConnectedPlatformCard
                name="Xbox"
                description="Gamerscore & achievements across all generations"
                icon={<XboxLogo size="lg" />}
                color="#107c10"
                stats={{ games: '3K+', sync: 'Real-time' }}
                status="online"
              />
              <ConnectedPlatformCard
                name="Epic Games"
                description="Library sync including weekly free game claims"
                icon={<EpicLogo size="lg" />}
                color="#000000"
                stats={{ games: '500+', sync: '30 min' }}
                status="online"
              />
            </div>
          </div>

          {/* Manual Platforms */}
          <div>
            <div className="flex items-center gap-4 mb-12">
              <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-[var(--theme-hover-bg)] border border-[var(--theme-border)]">
                <Hand className="w-4 h-4 text-[var(--theme-text-muted)]" />
                <span className="text-[10px] font-semibold text-[var(--theme-text-muted)] uppercase tracking-[0.2em] font-[family-name:var(--font-family-display)]">
                  Manual Entry Protocol
                </span>
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-[var(--theme-border)] to-transparent" />
              <span className="text-[10px] font-mono text-[var(--theme-text-subtle)]">// 02</span>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 mb-8">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-family-display)] tracking-tight mb-4 text-[var(--theme-text-secondary)]">
                  EXTENDED PLATFORM SUPPORT
                </h2>
                <p className="text-[var(--theme-text-muted)] leading-relaxed max-w-md">
                  No public API access? Manual tracking enables full feature support
                  for any gaming platform in the ecosystem.
                </p>
              </div>
            </div>

            {/* Manual Platform Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <ManualPlatformCard name="Nintendo" icon={<NintendoLogo size="md" />} brandColor="#E60012" />
              <ManualPlatformCard name="GOG Galaxy" icon={<GOGLogo size="md" />} brandColor="#86328A" />
              <ManualPlatformCard name="EA App" icon={<EALogo size="md" />} brandColor="#ff4747" />
              <ManualPlatformCard name="Battle.net" icon={<BattleNetLogo size="md" />} brandColor="#00AEFF" />
              <ManualPlatformCard name="Ubisoft" icon={<UbisoftLogo size="md" />} brandColor="#0070ff" />
            </div>

            <p className="text-[var(--theme-text-subtle)] text-xs mt-6 font-mono">
              + ADDITIONAL: Physical media, retro consoles, indie platforms, and custom entries supported
            </p>
          </div>
        </div>
      </section>

      {/* Core Systems Section */}
      <section
        data-section
        className="relative py-32"
      >
        {/* Background effect */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[600px] bg-gradient-to-r from-cyan-500/[0.02] via-violet-500/[0.03] to-cyan-500/[0.02] blur-3xl" />
        </div>

        <div className="relative max-w-[1400px] mx-auto px-8">
          {/* Section header */}
          <div className="text-center mb-20">
            <span className="inline-block text-[10px] font-mono text-cyan-400/60 uppercase tracking-wider mb-4">
              // CORE_SYSTEMS_ARRAY
            </span>
            <h2 className="text-4xl md:text-5xl font-bold font-[family-name:var(--font-family-display)] tracking-tight mb-4">
              <span className="text-[var(--theme-text-primary)]">MISSION </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400">
                CRITICAL
              </span>
              <span className="text-[var(--theme-text-primary)]"> MODULES</span>
            </h2>
            <p className="text-[var(--theme-text-muted)] text-lg max-w-xl mx-auto">
              Six integrated subsystems engineered for total gaming dominance.
            </p>
          </div>

          {/* Feature grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FeatureCard
              number="01"
              icon={Layers}
              title="UNIFIED LIBRARY"
              description="Cross-platform aggregation engine. All games indexed, searchable, and filterable in one command interface."
              color="cyan"
            />
            <FeatureCard
              number="02"
              icon={BarChart3}
              title="ANALYTICS CORE"
              description="Deep telemetry processing. Playtime patterns, completion metrics, and behavioral insights visualized."
              color="violet"
            />
            <FeatureCard
              number="03"
              icon={Trophy}
              title="ACHIEVEMENT HUB"
              description="Trophy and achievement consolidation from all platforms. Track progress toward 100% completion."
              color="amber"
            />
            <FeatureCard
              number="04"
              icon={Clock}
              title="SESSION TRACKER"
              description="Automatic play session detection. Detailed history with timestamps and duration logging."
              color="emerald"
            />
            <FeatureCard
              number="05"
              icon={Users}
              title="BACKLOG COMMAND"
              description="Priority queue management. Smart organization algorithms to conquer the pile systematically."
              color="rose"
            />
            <FeatureCard
              number="06"
              icon={Zap}
              title="SYNC ENGINE"
              description="Real-time data synchronization across all connected platforms. Always current, always accurate."
              color="blue"
            />
          </div>
        </div>
      </section>

      {/* Tech Specs Section */}
      <section
        data-section
        className="relative py-24"
      >
        <div className="max-w-[1400px] mx-auto px-8">
          <div className="relative rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-secondary)]/50 overflow-hidden">
            {/* HUD corners */}
            <div className="absolute top-0 left-0 w-12 h-12 border-l-2 border-t-2 border-cyan-400/30" />
            <div className="absolute top-0 right-0 w-12 h-12 border-r-2 border-t-2 border-cyan-400/30" />
            <div className="absolute bottom-0 left-0 w-12 h-12 border-l-2 border-b-2 border-cyan-400/30" />
            <div className="absolute bottom-0 right-0 w-12 h-12 border-r-2 border-b-2 border-cyan-400/30" />

            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-violet-500/5" />

            <div className="relative p-8 md:p-12">
              <div className="flex items-center gap-4 mb-8">
                <Cpu className="w-5 h-5 text-cyan-400" />
                <span className="text-[10px] font-mono text-cyan-400/60 uppercase tracking-wider">
                  // TECH_SPECIFICATIONS
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/30 to-transparent" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <TechSpec value="10+" label="Platforms" icon={Target} />
                <TechSpec value="100K+" label="Games Indexed" icon={Database} />
                <TechSpec value="1M+" label="Hours Tracked" icon={Clock} />
                <TechSpec value="99.9%" label="System Uptime" icon={Activity} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Access Section */}
      <section
        data-section
        className="relative py-32"
      >
        <div className="max-w-[1400px] mx-auto px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block text-[10px] font-mono text-cyan-400/60 uppercase tracking-wider mb-4">
                // DEPLOYMENT_OPTIONS
              </span>
              <h2 className="text-4xl md:text-5xl font-bold font-[family-name:var(--font-family-display)] tracking-tight mb-6">
                <span className="text-[var(--theme-text-primary)]">UNIVERSAL </span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400">
                  ACCESS
                </span>
              </h2>
              <p className="text-[var(--theme-text-muted)] text-lg leading-relaxed mb-10 max-w-md">
                Command center synchronized across all endpoints. Check your backlog
                from the couch, plan sessions on the move.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <DeviceCard icon={Monitor} title="Desktop" status="Primary" />
                <DeviceCard icon={Smartphone} title="Mobile" status="Companion" />
                <DeviceCard icon={Globe} title="Cloud Sync" status="Active" />
                <DeviceCard icon={Lock} title="Encrypted" status="256-bit" />
              </div>
            </div>

            {/* Terminal Mockup */}
            <div className="relative">
              <TerminalMockup />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        data-section
        className="relative py-32"
      >
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

            <span className="inline-block text-[10px] font-mono text-cyan-400/60 uppercase tracking-wider mb-6">
              // INITIATE_DEPLOYMENT
            </span>

            <h2 className="relative text-4xl md:text-6xl font-bold font-[family-name:var(--font-family-display)] tracking-tight mb-6">
              <span className="text-[var(--theme-text-primary)]">Ready to </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400 glow-cyan">
                Get Started
              </span>
              <span className="text-[var(--theme-text-primary)]">?</span>
            </h2>

            <p className="relative text-[var(--theme-text-muted)] text-lg mb-12 max-w-md mx-auto">
              Initialize your command center. Free forever for personal operations.
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
              NO CREDIT CARD REQUIRED • INSTANT ACCESS • UNLIMITED GAMES
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
                <span className="text-sm font-semibold text-[var(--theme-text-muted)] font-[family-name:var(--font-family-display)] tracking-wide">
                  GAMEHUB
                </span>
                <span className="hidden sm:inline text-[10px] text-[var(--theme-text-subtle)] ml-3 font-mono">
                  v2.0.0-beta
                </span>
              </div>
            </div>
            {/* <div className="flex items-center gap-8">
              <Link href="/" className="text-xs text-[var(--theme-text-muted)] hover:text-[var(--theme-accent-cyan)] transition-colors uppercase tracking-wider">
                Home
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

      {/* Progress indicator */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col items-center gap-3">
        <div className="text-[8px] font-mono text-[var(--theme-text-subtle)] uppercase tracking-wider -rotate-90 origin-center mb-4">
          Section
        </div>
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <div
            key={index}
            className={`relative w-2 h-2 rounded-full transition-all duration-500 ${
              activeSection === index
                ? 'bg-cyan-400 scale-150'
                : 'bg-[var(--theme-text-subtle)] hover:bg-[var(--theme-text-muted)]'
            }`}
          >
            {activeSection === index && (
              <div className="absolute inset-0 rounded-full bg-cyan-400 animate-ping opacity-50" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// System Status Panel Component
function SystemStatusPanel() {
  const [currentTime, setCurrentTime] = useState('--:--:--');

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      {/* HUD Frame */}
      <div className="absolute -inset-4">
        <div className="absolute top-0 left-0 w-10 h-10 border-l-2 border-t-2 border-cyan-400/40" />
        <div className="absolute top-0 right-0 w-10 h-10 border-r-2 border-t-2 border-cyan-400/40" />
        <div className="absolute bottom-0 left-0 w-10 h-10 border-l-2 border-b-2 border-cyan-400/40" />
        <div className="absolute bottom-0 right-0 w-10 h-10 border-r-2 border-b-2 border-cyan-400/40" />
      </div>

      <div className="bg-[var(--theme-bg-secondary)]/80 backdrop-blur-xl border border-[var(--theme-border)] rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--theme-border)] bg-[var(--theme-hover-bg)]">
          <div className="flex items-center gap-3">
            <Server className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] font-mono text-cyan-400/80 uppercase tracking-wider">
              // SYSTEM_OVERVIEW
            </span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 tabular-nums">{currentTime}</span>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Status indicators */}
          <div className="grid grid-cols-2 gap-3">
            <StatusIndicator label="API Gateway" status="online" />
            <StatusIndicator label="Sync Engine" status="online" />
            <StatusIndicator label="Data Pipeline" status="online" />
            <StatusIndicator label="Auth Service" status="online" />
          </div>

          {/* Metrics */}
          <div className="pt-4 border-t border-[var(--theme-border)]">
            <div className="text-[9px] font-mono text-[var(--theme-text-muted)] uppercase tracking-wider mb-3">
              Platform Connections
            </div>
            <div className="space-y-2">
              <MetricBar label="Steam" value={98} color="cyan" />
              <MetricBar label="PlayStation" value={94} color="violet" />
              <MetricBar label="Xbox" value={96} color="emerald" />
              <MetricBar label="Epic" value={92} color="amber" />
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-[var(--theme-border)]">
            <div className="flex items-center justify-between text-[9px] font-mono text-[var(--theme-text-muted)]">
              <span>Latency: 12ms</span>
              <span>Build: 2.0.0-b47</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusIndicator({ label, status }: { label: string; status: 'online' | 'offline' | 'syncing' }) {
  const statusColors = {
    online: 'bg-emerald-400',
    offline: 'bg-red-400',
    syncing: 'bg-amber-400 animate-pulse',
  };

  return (
    <div className="group relative flex items-center gap-2 p-2 rounded-lg bg-[var(--theme-hover-bg)] border border-[var(--theme-border)] hover:border-[var(--theme-text-subtle)] transition-colors overflow-hidden">
      {/* Hover HUD corners */}
      <div className="absolute top-0 left-0 w-1.5 h-1.5 border-l border-t border-emerald-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute top-0 right-0 w-1.5 h-1.5 border-r border-t border-emerald-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-l border-b border-emerald-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-r border-b border-emerald-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className={`relative w-1.5 h-1.5 rounded-full ${statusColors[status]}`} />
      <span className="relative text-[10px] text-[var(--theme-text-muted)] font-mono">{label}</span>
    </div>
  );
}

function MetricBar({ label, value, color }: { label: string; value: number; color: string }) {
  const colorClasses: Record<string, string> = {
    cyan: 'bg-cyan-400',
    violet: 'bg-violet-400',
    emerald: 'bg-emerald-400',
    amber: 'bg-amber-400',
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-[var(--theme-text-muted)] font-mono">{label}</span>
        <span className="font-mono text-[var(--theme-text-secondary)] tabular-nums">{value}%</span>
      </div>
      <div className="h-1 bg-[var(--theme-border)] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${colorClasses[color]} transition-all duration-1000`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

// Connected Platform Card
interface ConnectedPlatformCardProps {
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  stats: { games: string; sync: string };
  status: 'online' | 'offline' | 'syncing';
}

function ConnectedPlatformCard({ name, description, icon, color, stats, status }: ConnectedPlatformCardProps) {
  return (
    <div className="group relative rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-hover-bg)] overflow-hidden transition-all duration-500 hover:border-cyan-400/30 hover:bg-[var(--theme-active-bg)]">
      {/* Hover HUD corners */}
      <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-cyan-400/50 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
      <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-cyan-400/50 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-cyan-400/50 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-cyan-400/50 opacity-0 group-hover:opacity-100 transition-opacity z-10" />

      {/* Status indicator */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <div className="relative">
          <div className={`w-2 h-2 rounded-full ${status === 'online' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          {status === 'online' && (
            <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-50" />
          )}
        </div>
        <span className="text-[8px] text-emerald-400/80 uppercase tracking-wider font-mono">
          {status}
        </span>
      </div>

      {/* Hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at 50% 100%, ${color}10 0%, transparent 70%)`,
        }}
      />

      <div className="relative p-6">
        <div
          className="mb-4 transition-transform duration-300 group-hover:scale-110"
          style={{ color }}
        >
          {icon}
        </div>
        <h3 className="text-lg font-bold font-[family-name:var(--font-family-display)] text-[var(--theme-text-primary)] mb-2 tracking-wide">
          {name}
        </h3>
        <p className="text-xs text-[var(--theme-text-muted)] mb-4 leading-relaxed">{description}</p>

        {/* Stats */}
        <div className="flex items-center gap-4 pt-4 border-t border-[var(--theme-border)]">
          <div>
            <div className="text-[9px] text-[var(--theme-text-muted)] uppercase tracking-wider">Games</div>
            <div className="text-sm font-bold text-[var(--theme-text-primary)] font-mono">{stats.games}</div>
          </div>
          <div>
            <div className="text-[9px] text-[var(--theme-text-muted)] uppercase tracking-wider">Sync</div>
            <div className="text-sm font-bold text-cyan-400 font-mono">{stats.sync}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Manual Platform Card
interface ManualPlatformCardProps {
  name: string;
  icon: React.ReactNode;
  brandColor: string;
}

function ManualPlatformCard({ name, icon, brandColor }: ManualPlatformCardProps) {
  return (
    <div className="group relative p-4 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-hover-bg)] transition-all duration-300 overflow-hidden hover:scale-[1.02]">
      {/* Hover glow background */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ backgroundColor: `${brandColor}15` }}
      />

      {/* Hover HUD corners */}
      <div className="absolute top-0 left-0 w-2 h-2 border-l border-t opacity-0 group-hover:opacity-100 transition-opacity" style={{ borderColor: `${brandColor}80` }} />
      <div className="absolute top-0 right-0 w-2 h-2 border-r border-t opacity-0 group-hover:opacity-100 transition-opacity" style={{ borderColor: `${brandColor}80` }} />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b opacity-0 group-hover:opacity-100 transition-opacity" style={{ borderColor: `${brandColor}80` }} />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b opacity-0 group-hover:opacity-100 transition-opacity" style={{ borderColor: `${brandColor}80` }} />

      <div className="relative flex items-center gap-3">
        <div
          className="transition-all duration-300 group-hover:scale-110"
          style={{ color: brandColor }}
        >
          {icon}
        </div>
        <span className="text-sm font-medium text-[var(--theme-text-muted)] group-hover:text-[var(--theme-text-primary)] transition-colors font-[family-name:var(--font-family-display)] tracking-wide">
          {name}
        </span>
      </div>
    </div>
  );
}

// Feature Card
interface FeatureCardProps {
  number: string;
  icon: React.ElementType;
  title: string;
  description: string;
  color: 'cyan' | 'violet' | 'amber' | 'emerald' | 'rose' | 'blue';
}

const featureColors = {
  cyan: {
    border: 'border-cyan-400/20 group-hover:border-cyan-400/40',
    icon: 'text-cyan-400 bg-cyan-400/10',
    glow: 'group-hover:shadow-cyan-400/10',
    hud: 'border-cyan-400/50',
  },
  violet: {
    border: 'border-violet-400/20 group-hover:border-violet-400/40',
    icon: 'text-violet-400 bg-violet-400/10',
    glow: 'group-hover:shadow-violet-400/10',
    hud: 'border-violet-400/50',
  },
  amber: {
    border: 'border-amber-400/20 group-hover:border-amber-400/40',
    icon: 'text-amber-400 bg-amber-400/10',
    glow: 'group-hover:shadow-amber-400/10',
    hud: 'border-amber-400/50',
  },
  emerald: {
    border: 'border-emerald-400/20 group-hover:border-emerald-400/40',
    icon: 'text-emerald-400 bg-emerald-400/10',
    glow: 'group-hover:shadow-emerald-400/10',
    hud: 'border-emerald-400/50',
  },
  rose: {
    border: 'border-rose-400/20 group-hover:border-rose-400/40',
    icon: 'text-rose-400 bg-rose-400/10',
    glow: 'group-hover:shadow-rose-400/10',
    hud: 'border-rose-400/50',
  },
  blue: {
    border: 'border-blue-400/20 group-hover:border-blue-400/40',
    icon: 'text-blue-400 bg-blue-400/10',
    glow: 'group-hover:shadow-blue-400/10',
    hud: 'border-blue-400/50',
  },
};

function FeatureCard({ number, icon: Icon, title, description, color }: FeatureCardProps) {
  const colors = featureColors[color];

  return (
    <div className={`group relative p-6 rounded-2xl border bg-[var(--theme-hover-bg)] transition-all duration-500 hover:bg-[var(--theme-active-bg)] hover:shadow-2xl overflow-hidden ${colors.border} ${colors.glow}`}>
      {/* Hover HUD corners */}
      <div className={`absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 ${colors.hud} opacity-0 group-hover:opacity-100 transition-opacity z-10`} />
      <div className={`absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 ${colors.hud} opacity-0 group-hover:opacity-100 transition-opacity z-10`} />
      <div className={`absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 ${colors.hud} opacity-0 group-hover:opacity-100 transition-opacity z-10`} />
      <div className={`absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 ${colors.hud} opacity-0 group-hover:opacity-100 transition-opacity z-10`} />

      {/* Number */}
      <div className="relative text-[10px] text-[var(--theme-text-subtle)] font-mono mb-4 tracking-wider">// {number}</div>

      {/* Icon */}
      <div className={`relative inline-flex p-3 rounded-xl mb-4 ${colors.icon}`}>
        <Icon className="w-5 h-5" />
      </div>

      {/* Content */}
      <h3 className="relative text-lg font-bold font-[family-name:var(--font-family-display)] text-[var(--theme-text-primary)] mb-2 tracking-wide">
        {title}
      </h3>
      <p className="relative text-sm text-[var(--theme-text-muted)] leading-relaxed">{description}</p>
    </div>
  );
}

// Tech Spec Component
function TechSpec({ value, label, icon: Icon }: { value: string; label: string; icon: React.ElementType }) {
  return (
    <div className="text-center group relative">
      {/* Hover HUD corners */}
      <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-cyan-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-cyan-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-cyan-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-cyan-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="relative inline-flex p-3 rounded-xl bg-[var(--theme-hover-bg)] border border-[var(--theme-border)] mb-4 group-hover:border-cyan-400/30 transition-colors">
        <Icon className="w-5 h-5 text-cyan-400/60 group-hover:text-cyan-400 transition-colors" />
      </div>
      <div className="relative text-3xl md:text-4xl font-bold font-[family-name:var(--font-family-display)] text-[var(--theme-text-primary)] mb-1 group-hover:text-cyan-400 transition-colors tabular-nums">
        {value}
      </div>
      <div className="relative text-[10px] text-[var(--theme-text-muted)] uppercase tracking-[0.2em] font-mono">{label}</div>
    </div>
  );
}

// Device Card
function DeviceCard({ icon: Icon, title, status }: { icon: React.ElementType; title: string; status: string }) {
  return (
    <div className="group relative flex items-center gap-4 p-4 rounded-xl bg-[var(--theme-hover-bg)] border border-[var(--theme-border)] hover:border-cyan-400/20 transition-all overflow-hidden">
      {/* Hover HUD corners */}
      <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-cyan-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-cyan-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-cyan-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-cyan-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="relative p-2 rounded-lg bg-cyan-400/10">
        <Icon className="w-5 h-5 text-cyan-400" />
      </div>
      <div className="relative">
        <div className="text-sm font-medium text-[var(--theme-text-primary)]">{title}</div>
        <div className="text-[10px] text-[var(--theme-text-muted)] font-mono uppercase">{status}</div>
      </div>
    </div>
  );
}

// Terminal Mockup
function TerminalMockup() {
  return (
    <div className="relative">
      {/* HUD Frame */}
      <div className="absolute -inset-4">
        <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-cyan-400/30" />
        <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-cyan-400/30" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-cyan-400/30" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-cyan-400/30" />
      </div>

      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-[var(--theme-border)] bg-[var(--theme-bg-secondary)]">
        {/* Terminal header */}
        <div className="absolute top-0 left-0 right-0 h-10 bg-[var(--theme-hover-bg)] border-b border-[var(--theme-border)] flex items-center px-4 gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/60" />
          </div>
          <div className="flex-1 text-center">
            <span className="text-[10px] font-mono text-[var(--theme-text-muted)]">gamehub — bash</span>
          </div>
        </div>

        {/* Terminal content */}
        <div className="absolute top-10 inset-x-0 bottom-0 p-4 font-mono text-xs">
          <div className="space-y-2">
            <div>
              <span className="text-emerald-400">➜</span>
              <span className="text-cyan-400"> ~/gamehub</span>
              <span className="text-[var(--theme-text-muted)]"> gamehub status</span>
            </div>
            <div className="text-[var(--theme-text-muted)] pl-2">
              <div className="text-emerald-400">✓ Steam connected (247 games)</div>
              <div className="text-emerald-400">✓ PlayStation connected (89 games)</div>
              <div className="text-emerald-400">✓ Xbox connected (156 games)</div>
              <div className="text-emerald-400">✓ Epic connected (67 games)</div>
            </div>
            <div className="pt-2">
              <span className="text-emerald-400">➜</span>
              <span className="text-cyan-400"> ~/gamehub</span>
              <span className="text-[var(--theme-text-muted)]"> gamehub sync --all</span>
            </div>
            <div className="text-cyan-400/80 pl-2 animate-pulse">
              Syncing all platforms...
            </div>
          </div>
        </div>

        {/* Glow */}
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-cyan-500/10 via-transparent to-violet-500/10 -z-10 blur-xl" />
      </div>
    </div>
  );
}
