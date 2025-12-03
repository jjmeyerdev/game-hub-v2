'use client';

import Link from 'next/link';
import { Gamepad2, Zap, RefreshCw, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-void flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-void/80 backdrop-blur-xl border-b border-steel/50">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center space-x-2 group cursor-pointer">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-lg flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-300">
                  <Gamepad2 className="w-6 h-6 text-void" strokeWidth={2.5} />
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-lg blur-lg opacity-40 group-hover:opacity-60 transition-opacity"></div>
              </div>
              <span className="text-2xl font-bold tracking-tight">
                Game<span className="text-cyan-400">hub</span>
              </span>
            </div>

            {/* Auth Buttons */}
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
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-5xl mx-auto text-center pt-20 pb-32">
          {/* Main Headline */}
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold leading-tight mb-8">
            <span className="text-white">Your Gaming Library,</span>
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent glow-cyan">
              Unified
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed">
            Track your entire game collection across Steam, PlayStation, Xbox, Epic Games, and more.
            All your games, achievements, and playtime in one beautiful dashboard.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-24">
            <Link href="/signup" className="group px-8 py-4 bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-void font-bold rounded-full text-lg transition-all transform hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/40 flex items-center space-x-2">
              <span>Get Started Free</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="px-8 py-4 bg-transparent border-2 border-white/20 hover:border-cyan-400 text-white hover:text-cyan-400 font-bold rounded-full text-lg transition-all hover:shadow-lg hover:shadow-cyan-500/20">
              Learn More
            </button>
          </div>

          {/* Feature Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <FeatureStat
              value="10+"
              label="PLATFORMS"
              icon={Gamepad2}
            />
            <FeatureStat
              value="Unlimited"
              label="GAMES"
              icon={Zap}
            />
            <FeatureStat
              value="Real-time"
              label="SYNC"
              icon={RefreshCw}
            />
          </div>
        </div>
      </main>

      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }}></div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,217,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,217,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px]"></div>
      </div>
    </div>
  );
}

interface FeatureStatProps {
  value: string;
  label: string;
  icon: React.ElementType;
}

function FeatureStat({ value, label, icon: Icon }: FeatureStatProps) {
  return (
    <div className="relative group">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      {/* Content */}
      <div className="relative p-6 rounded-2xl border border-steel/50 group-hover:border-cyan-500/50 transition-all duration-300">
        <div className="flex items-center justify-center mb-3">
          <Icon className="w-8 h-8 text-cyan-400 group-hover:scale-110 transition-transform duration-300" />
        </div>
        <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
          {value}
        </div>
        <div className="text-xs text-gray-500 font-bold uppercase tracking-widest">
          {label}
        </div>
      </div>
    </div>
  );
}
