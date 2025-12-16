'use client';

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Gamepad2,
  ArrowRight,
  Layers,
  BarChart3,
  Trophy,
  Clock,
  Users,
  Zap,
  Monitor,
  Smartphone,
  Globe,
  Shield,
  Sparkles,
  ChevronDown,
  Play
} from 'lucide-react';

export default function FeaturesPage() {
  const [scrollY, setScrollY] = useState(0);
  const [activeSection, setActiveSection] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);

      // Determine active section based on scroll position
      const sections = document.querySelectorAll('[data-section]');
      sections.forEach((section, index) => {
        const rect = section.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.5 && rect.bottom > 0) {
          setActiveSection(index);
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-void text-white overflow-x-hidden">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-void/80 backdrop-blur-xl border-b border-steel/50">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-lg flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-300">
                  <Gamepad2 className="w-6 h-6 text-void" strokeWidth={2.5} />
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-lg blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
              </div>
              <span className="text-2xl font-bold tracking-tight">
                Game<span className="text-cyan-400">hub</span>
              </span>
            </Link>

            <div className="flex items-center space-x-4">
              <Link href="/login" className="px-6 py-2.5 text-white hover:text-cyan-400 font-semibold transition-colors">
                Login
              </Link>
              <Link href="/signup" className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-void font-bold rounded-full transition-all transform hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/30">
                Sign Up Free
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section
        ref={heroRef}
        data-section
        className="relative min-h-screen flex items-center justify-center pt-20"
        style={{
          background: `radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0, 217, 255, 0.15) 0%, transparent 50%)`
        }}
      >
        {/* Animated Grid Background */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 217, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 217, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
            transform: `translateY(${scrollY * 0.1}px)`,
          }}
        />

        {/* Floating Orbs */}
        <div
          className="absolute top-1/4 left-1/5 w-64 h-64 bg-cyan-500/20 rounded-full blur-[100px]"
          style={{ transform: `translate(${scrollY * 0.05}px, ${scrollY * -0.03}px)` }}
        />
        <div
          className="absolute bottom-1/4 right-1/5 w-80 h-80 bg-purple-500/20 rounded-full blur-[120px]"
          style={{ transform: `translate(${scrollY * -0.05}px, ${scrollY * 0.02}px)` }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
          {/* Eyebrow */}
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/30 bg-cyan-500/5 mb-8"
            style={{
              animation: 'fadeInUp 0.8s ease-out',
            }}
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-medium text-cyan-400 tracking-wide">DISCOVER THE FUTURE OF GAME TRACKING</span>
          </div>

          {/* Main Headline */}
          <h1
            className="text-5xl md:text-7xl lg:text-8xl font-black leading-[0.9] mb-8 tracking-tight"
            style={{
              animation: 'fadeInUp 0.8s ease-out 0.1s both',
            }}
          >
            <span className="block text-white">ONE DASHBOARD.</span>
            <span className="block bg-gradient-to-r from-cyan-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
              EVERY GAME.
            </span>
            <span className="block text-white/60 text-4xl md:text-5xl lg:text-6xl mt-4">ALL PLATFORMS.</span>
          </h1>

          {/* Subtitle */}
          <p
            className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12"
            style={{
              animation: 'fadeInUp 0.8s ease-out 0.2s both',
            }}
          >
            Stop juggling between Steam, PlayStation, Xbox, and Epic.
            Gamehub brings your entire collection together with real-time sync,
            detailed analytics, and beautiful organization.
          </p>

          {/* CTA */}
          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            style={{
              animation: 'fadeInUp 0.8s ease-out 0.3s both',
            }}
          >
            <Link
              href="/signup"
              className="group relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-cyan-400 text-void font-bold rounded-full text-lg overflow-hidden transition-all transform hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/40"
            >
              <span className="relative z-10 flex items-center gap-2">
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            <a
              href="#platforms"
              className="px-8 py-4 border-2 border-white/20 hover:border-cyan-400 text-white hover:text-cyan-400 font-bold rounded-full text-lg transition-all flex items-center gap-2"
            >
              <Play className="w-5 h-5" />
              See How It Works
            </a>
          </div>

          {/* Scroll Indicator */}
          <div
            className="absolute bottom-12 left-1/2 -translate-x-1/2"
            style={{
              animation: 'fadeInUp 0.8s ease-out 0.5s both',
            }}
          >
            <div className="flex flex-col items-center gap-2 text-gray-500">
              <span className="text-xs uppercase tracking-widest">Scroll to explore</span>
              <ChevronDown className="w-5 h-5 animate-bounce" />
            </div>
          </div>
        </div>
      </section>

      {/* Platform Integration Section */}
      <section
        id="platforms"
        data-section
        className="relative py-32 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-6">
          {/* Section Header */}
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="text-white">Connect </span>
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Everything</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Link your gaming accounts once. We handle the rest with automatic syncing.
            </p>
          </div>

          {/* Platform Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <PlatformCard
              name="Steam"
              color="#1b2838"
              accent="#66c0f4"
              games="50,000+"
              icon={
                <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0z"/>
                </svg>
              }
            />
            <PlatformCard
              name="PlayStation"
              color="#003791"
              accent="#0070cc"
              games="Trophies"
              icon={
                <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8.985 2.596v17.548l3.915 1.261V6.688c0-.69.304-1.151.794-.991.636.181.76.814.76 1.505v5.876c2.441 1.193 4.362-.002 4.362-3.153 0-3.237-1.126-4.675-4.438-5.827-1.307-.448-3.728-1.186-5.391-1.502h-.002zm4.656 16.242l6.296-2.275c.715-.258.826-.625.246-.818-.586-.192-1.637-.139-2.357.123l-4.205 1.5v-2.385l.24-.085s1.201-.42 2.913-.615c1.696-.18 3.792.03 5.437.661 1.848.596 2.063 1.473 1.597 2.085-.466.611-1.635 1.04-1.635 1.04l-8.532 3.047v-2.278zM1.004 18.241c-1.513-.453-1.775-1.396-1.08-1.985.654-.556 1.77-.96 1.77-.96l5.572-1.99v2.316l-4.049 1.446c-.715.257-.826.625-.247.817.587.193 1.637.14 2.358-.12l1.938-.707v2.068c-.127.026-.262.047-.39.07-1.765.286-3.655.078-5.872-.955z"/>
                </svg>
              }
            />
            <PlatformCard
              name="Xbox"
              color="#107c10"
              accent="#52b043"
              games="Achievements"
              icon={
                <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4.102 21.033C6.211 22.881 8.977 24 12 24c3.026 0 5.789-1.119 7.902-2.967 1.877-1.912-4.316-8.709-7.902-11.417-3.582 2.708-9.779 9.505-7.898 11.417zm11.16-14.406c2.5 2.961 7.484 10.313 6.076 12.912C23.056 17.036 24 14.62 24 12c0-5.238-3.354-9.691-8.024-11.33.039.071.076.142.108.219.492 1.161.825 2.426.978 3.738zm-6.532 0c.154-1.312.487-2.577.978-3.738.033-.077.07-.148.108-.219C5.354 2.309 2 6.762 2 12c0 2.62.944 5.036 2.662 6.539-1.408-2.599 3.576-9.951 6.068-12.912z"/>
                </svg>
              }
            />
            <PlatformCard
              name="Epic Games"
              color="#2a2a2a"
              accent="#ffffff"
              games="Free Games"
              icon={
                <span className="text-3xl font-black">E</span>
              }
            />
          </div>

          {/* Additional platforms hint */}
          <p className="text-center text-gray-500 mt-8 text-sm">
            + Nintendo, GOG, EA Play, and more coming soon
          </p>
        </div>
      </section>

      {/* Features Grid Section */}
      <section
        data-section
        className="relative py-32 bg-gradient-to-b from-void via-deep to-void"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="text-white">Powerful </span>
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Features</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Everything you need to organize, track, and conquer your gaming backlog.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={Layers}
              title="Unified Library"
              description="All your games from every platform in one searchable, filterable collection. No more switching between apps."
              gradient="from-cyan-500 to-blue-500"
            />
            <FeatureCard
              icon={BarChart3}
              title="Playtime Analytics"
              description="Track your gaming habits with detailed stats. See your most played games, daily patterns, and yearly reviews."
              gradient="from-purple-500 to-pink-500"
            />
            <FeatureCard
              icon={Trophy}
              title="Achievement Tracking"
              description="View all your trophies and achievements across platforms. Track completion rates and rare unlocks."
              gradient="from-amber-500 to-orange-500"
            />
            <FeatureCard
              icon={Clock}
              title="Session Tracking"
              description="Automatic detection of what you're playing. See real-time sessions and build your gaming history."
              gradient="from-emerald-500 to-teal-500"
            />
            <FeatureCard
              icon={Users}
              title="Backlog Management"
              description="Organize your pile of shame with priority levels, custom lists, and smart recommendations."
              gradient="from-rose-500 to-red-500"
            />
            <FeatureCard
              icon={Zap}
              title="Real-time Sync"
              description="Changes sync automatically. Add a game on Steam? It appears in Gamehub within minutes."
              gradient="from-yellow-500 to-amber-500"
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section
        data-section
        className="relative py-32 overflow-hidden"
      >
        {/* Background Effect */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-emerald-500/10" />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)`,
              backgroundSize: '32px 32px',
            }}
          />
        </div>

        <div className="relative max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            <StatItem value="10+" label="Platforms" />
            <StatItem value="100K+" label="Games Tracked" />
            <StatItem value="1M+" label="Hours Logged" />
            <StatItem value="99.9%" label="Uptime" />
          </div>
        </div>
      </section>

      {/* Device Compatibility Section */}
      <section
        data-section
        className="relative py-32"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                <span className="text-white">Access </span>
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Anywhere</span>
              </h2>
              <p className="text-xl text-gray-400 mb-8">
                Whether you're at your PC, on the couch, or on the go. Your gaming library is always with you.
              </p>

              <div className="space-y-4">
                <DeviceFeature icon={Monitor} title="Desktop" description="Full-featured web dashboard" />
                <DeviceFeature icon={Smartphone} title="Mobile" description="Responsive design for any screen" />
                <DeviceFeature icon={Globe} title="Cloud Sync" description="Data synced across all devices" />
                <DeviceFeature icon={Shield} title="Secure" description="Your data is encrypted and private" />
              </div>
            </div>

            {/* Device Mockup */}
            <div className="relative">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-steel bg-gradient-to-br from-deep to-abyss shadow-2xl shadow-cyan-500/10">
                {/* Browser Chrome */}
                <div className="absolute top-0 left-0 right-0 h-10 bg-slate/50 border-b border-steel flex items-center px-4 gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                  <div className="flex-1 mx-4">
                    <div className="bg-abyss rounded-md px-3 py-1 text-xs text-gray-500 w-48">
                      gamehub.app/dashboard
                    </div>
                  </div>
                </div>

                {/* Dashboard Preview */}
                <div className="absolute top-10 inset-x-0 bottom-0 p-4">
                  <div className="h-full rounded-lg bg-void/50 border border-steel/50 p-4 space-y-3">
                    {/* Mini stat cards */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-deep rounded-lg p-3 border border-steel/30">
                        <div className="text-2xl font-bold text-cyan-400">247</div>
                        <div className="text-[10px] text-gray-500">Games</div>
                      </div>
                      <div className="bg-deep rounded-lg p-3 border border-steel/30">
                        <div className="text-2xl font-bold text-purple-400">12</div>
                        <div className="text-[10px] text-gray-500">Playing</div>
                      </div>
                      <div className="bg-deep rounded-lg p-3 border border-steel/30">
                        <div className="text-2xl font-bold text-emerald-400">892h</div>
                        <div className="text-[10px] text-gray-500">Total</div>
                      </div>
                    </div>

                    {/* Mini game cards */}
                    <div className="flex gap-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex-1 aspect-[2/3] bg-gradient-to-br from-slate to-deep rounded-lg border border-steel/30" />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Glow effect */}
                <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-emerald-500/20 blur-3xl -z-10" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        data-section
        className="relative py-32"
      >
        <div className="max-w-4xl mx-auto px-6 text-center">
          {/* Decorative elements */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[600px] h-[600px] bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-emerald-500/10 rounded-full blur-3xl" />
          </div>

          <div className="relative">
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8">
              <span className="text-white">Ready to </span>
              <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">Level Up</span>
              <span className="text-white">?</span>
            </h2>
            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
              Join thousands of gamers who've already unified their libraries.
              Free forever for personal use.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="group relative px-10 py-5 bg-gradient-to-r from-cyan-500 to-cyan-400 text-void font-bold rounded-full text-xl overflow-hidden transition-all transform hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/40"
              >
                <span className="relative z-10 flex items-center gap-3">
                  Create Free Account
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </div>

            <p className="mt-6 text-sm text-gray-500">
              No credit card required. Takes less than 30 seconds.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 border-t border-steel/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Gamepad2 className="w-5 h-5 text-void" strokeWidth={2.5} />
              </div>
              <span className="text-lg font-bold">
                Game<span className="text-cyan-400">hub</span>
              </span>
            </div>
            <p className="text-sm text-gray-500">
              Your gaming library, unified.
            </p>
          </div>
        </div>
      </footer>

      {/* Progress indicator */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col gap-2">
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              activeSection === index
                ? 'bg-cyan-400 scale-125'
                : 'bg-steel hover:bg-gray-500'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// Component: Platform Card
interface PlatformCardProps {
  name: string;
  color: string;
  accent: string;
  games: string;
  icon: React.ReactNode;
}

function PlatformCard({ name, color, accent, games, icon }: PlatformCardProps) {
  return (
    <div
      className="group relative p-6 rounded-2xl border border-steel/50 overflow-hidden transition-all duration-500 hover:border-transparent hover:scale-105"
      style={{
        background: `linear-gradient(135deg, ${color}20 0%, transparent 50%)`,
      }}
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${accent}20 0%, transparent 70%)`,
        }}
      />

      <div className="relative z-10">
        <div
          className="mb-4 transition-transform duration-300 group-hover:scale-110"
          style={{ color: accent }}
        >
          {icon}
        </div>
        <h3 className="text-lg font-bold text-white mb-1">{name}</h3>
        <p className="text-sm text-gray-500">{games}</p>
      </div>

      {/* Corner accent */}
      <div
        className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full opacity-20 group-hover:opacity-40 transition-opacity"
        style={{ background: accent }}
      />
    </div>
  );
}

// Component: Feature Card
interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  gradient: string;
}

function FeatureCard({ icon: Icon, title, description, gradient }: FeatureCardProps) {
  return (
    <div className="group relative p-6 rounded-2xl bg-deep/50 border border-steel/50 overflow-hidden transition-all duration-300 hover:border-cyan-500/30 hover:bg-deep">
      {/* Icon */}
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} p-0.5 mb-4`}>
        <div className="w-full h-full rounded-[10px] bg-deep flex items-center justify-center">
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>

      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{description}</p>

      {/* Hover gradient line */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`} />
    </div>
  );
}

// Component: Stat Item
interface StatItemProps {
  value: string;
  label: string;
}

function StatItem({ value, label }: StatItemProps) {
  return (
    <div className="text-center">
      <div className="text-4xl md:text-6xl font-black bg-gradient-to-r from-cyan-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent mb-2">
        {value}
      </div>
      <div className="text-sm text-gray-500 uppercase tracking-widest font-medium">{label}</div>
    </div>
  );
}

// Component: Device Feature
interface DeviceFeatureProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

function DeviceFeature({ icon: Icon, title, description }: DeviceFeatureProps) {
  return (
    <div className="flex items-start gap-4 group">
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0 group-hover:border-purple-400/50 transition-colors">
        <Icon className="w-5 h-5 text-purple-400" />
      </div>
      <div>
        <h4 className="font-semibold text-white mb-0.5">{title}</h4>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </div>
  );
}
