'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { Gamepad2, ArrowLeft, Loader2, AlertCircle, Shield, Zap } from 'lucide-react';
import { signIn } from '@/lib/actions/auth/auth';
import {
  SteamLogo,
  PlayStationLogo,
  XboxLogo,
  EpicLogo,
} from '@/components/icons/PlatformLogos';

export default function LoginPage() {
  const [state, formAction] = useActionState<{ error?: string } | undefined, FormData>(signIn, undefined);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-void text-white overflow-hidden">
      {/* Noise texture */}
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
            backgroundSize: '60px 60px',
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

      {/* Background gradient orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-[700px] h-[700px] rounded-full bg-cyan-500/[0.04] blur-[140px] animate-breathe" />
        <div className="absolute bottom-1/4 left-1/3 w-[500px] h-[500px] rounded-full bg-violet-500/[0.05] blur-[100px] animate-breathe" style={{ animationDelay: '2s' }} />
      </div>

      {/* Floating platform logos */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {mounted && (
          <>
            <FloatingLogo Logo={SteamLogo} x={10} y={25} delay={0.5} />
            <FloatingLogo Logo={PlayStationLogo} x={85} y={18} delay={1.5} />
            <FloatingLogo Logo={XboxLogo} x={90} y={65} delay={2.5} />
            <FloatingLogo Logo={EpicLogo} x={7} y={72} delay={3.5} />
          </>
        )}
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-white/[0.04]">
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
                <span className="text-lg font-semibold tracking-wide text-white font-[family-name:var(--font-family-display)]">
                  GAMEHUB
                </span>
                <span className="text-[9px] font-mono text-white/30 tracking-wider uppercase">
                  // AUTH_PORTAL
                </span>
              </div>
            </Link>

            <Link
              href="/"
              className="group relative flex items-center gap-2 px-5 py-2.5 text-sm text-white/70 hover:text-cyan-400 transition-all uppercase tracking-wide border border-white/20 hover:border-cyan-400/50 rounded-lg bg-white/[0.03] hover:bg-cyan-400/10"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span className="hidden sm:inline font-[family-name:var(--font-family-display)] font-medium">Return</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 min-h-screen flex items-center justify-center px-8 py-32">
        <div className="w-full max-w-md">
          {/* Card */}
          <div
            className={`relative transition-all duration-1000 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            {/* HUD Frame */}
            <div className="absolute -inset-4">
              <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-cyan-400/30" />
              <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-cyan-400/30" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-cyan-400/30" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-cyan-400/30" />
            </div>

            {/* Glow effect behind card */}
            <div className="absolute -inset-px bg-gradient-to-b from-cyan-400/10 to-violet-400/5 rounded-2xl blur-sm" />

            <div className="relative bg-abyss/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl overflow-hidden">
              {/* Card header */}
              <div className="px-8 py-4 border-b border-white/[0.06] bg-white/[0.01]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    <span className="text-[10px] font-mono text-cyan-400/80 uppercase tracking-wider">
                      Secure Authentication
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-mono text-emerald-400">READY</span>
                  </div>
                </div>
              </div>

              <div className="p-8">
                {/* Header */}
                <div className="text-center mb-8">
                  <span className="inline-block text-[10px] font-mono text-cyan-400/60 uppercase tracking-[0.3em] mb-3">
                    // OPERATOR LOGIN
                  </span>
                  <h1 className="text-3xl font-bold font-[family-name:var(--font-family-display)] tracking-tight mb-2">
                    WELCOME BACK
                  </h1>
                  <p className="text-white/40 text-sm">
                    Authenticate to access your command center
                  </p>
                </div>

                {/* Form */}
                <form action={formAction} className="space-y-5">
                  {/* Error Message */}
                  {state?.error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-red-400 font-medium">{state.error}</p>
                      </div>
                    </div>
                  )}

                  {/* Email Field */}
                  <div className="space-y-2">
                    <label htmlFor="email" className="flex items-center gap-2 text-[10px] font-mono text-white/50 uppercase tracking-wider">
                      <span className="text-cyan-400/60">&gt;</span>
                      Email Address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="operator@example.com"
                      required
                      autoComplete="email"
                      className="w-full bg-white/[0.02] border border-white/[0.08] rounded-xl px-4 py-3.5 text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-400/30 focus:bg-white/[0.04] focus:ring-1 focus:ring-cyan-400/20 transition-all font-mono text-sm"
                    />
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor="password" className="flex items-center gap-2 text-[10px] font-mono text-white/50 uppercase tracking-wider">
                        <span className="text-cyan-400/60">&gt;</span>
                        Password
                      </label>
                      <a href="#" className="text-[10px] text-white/30 hover:text-cyan-400 transition-colors font-mono">
                        Reset Password?
                      </a>
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Enter your password"
                      required
                      autoComplete="current-password"
                      className="w-full bg-white/[0.02] border border-white/[0.08] rounded-xl px-4 py-3.5 text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-400/30 focus:bg-white/[0.04] focus:ring-1 focus:ring-cyan-400/20 transition-all font-mono text-sm"
                    />
                  </div>

                  {/* Submit Button */}
                  <SubmitButton />
                </form>

                {/* Divider */}
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/[0.06]" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-abyss px-4 text-[10px] font-mono text-white/30">OR</span>
                  </div>
                </div>

                {/* Sign Up Link */}
                <p className="text-center text-sm text-white/40">
                  New operator?{' '}
                  <Link href="/signup" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
                    Create Account
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Platform icons */}
          <div
            className={`mt-10 flex items-center justify-center gap-6 transition-all duration-1000 delay-200 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <span className="text-[9px] font-mono text-white/20 uppercase tracking-wider">Integrated Platforms</span>
            <div className="flex items-center gap-3">
              {[
                { Logo: SteamLogo, name: 'Steam' },
                { Logo: PlayStationLogo, name: 'PlayStation' },
                { Logo: XboxLogo, name: 'Xbox' },
                { Logo: EpicLogo, name: 'Epic' },
              ].map(({ Logo, name }) => (
                <div
                  key={name}
                  className="group relative w-9 h-9 rounded-lg bg-white/[0.02] border border-white/[0.06] flex items-center justify-center hover:border-cyan-400/30 hover:bg-white/[0.04] transition-all overflow-hidden"
                >
                  {/* Hover HUD corners */}
                  <div className="absolute top-0 left-0 w-1.5 h-1.5 border-l border-t border-cyan-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute top-0 right-0 w-1.5 h-1.5 border-r border-t border-cyan-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-l border-b border-cyan-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-r border-b border-cyan-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Logo size="sm" className="relative text-white/30 group-hover:text-cyan-400/60 transition-colors" />
                </div>
              ))}
            </div>
          </div>

          {/* Terms */}
          <p
            className={`mt-8 text-center text-[10px] font-mono text-white/20 leading-relaxed transition-all duration-1000 delay-300 ${
              mounted ? 'opacity-100' : 'opacity-0'
            }`}
          >
            BY AUTHENTICATING, YOU ACCEPT OUR{' '}
            <a href="#" className="text-white/40 hover:text-cyan-400 transition-colors">
              TERMS
            </a>{' '}
            AND{' '}
            <a href="#" className="text-white/40 hover:text-cyan-400 transition-colors">
              PRIVACY PROTOCOL
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="group relative w-full overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {/* Glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-violet-600 rounded-xl blur opacity-30 group-hover:opacity-60 transition-opacity duration-500" />
      <div className="relative flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-cyan-500 to-violet-600 rounded-xl">
        {pending ? (
          <>
            <Loader2 className="w-5 h-5 text-white animate-spin" />
            <span className="font-semibold text-white tracking-wide uppercase font-[family-name:var(--font-family-display)]">
              Authenticating...
            </span>
          </>
        ) : (
          <>
            <Zap className="w-5 h-5 text-white" />
            <span className="font-semibold text-white tracking-wide uppercase font-[family-name:var(--font-family-display)]">
              Sign In
            </span>
          </>
        )}
      </div>
    </button>
  );
}

interface FloatingLogoProps {
  Logo: React.ComponentType<{ size: 'sm' | 'md' | 'lg' | 'xl'; className?: string }>;
  x: number;
  y: number;
  delay: number;
}

function FloatingLogo({ Logo, x, y, delay }: FloatingLogoProps) {
  return (
    <div
      className="absolute animate-float"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        animationDelay: `${delay}s`,
      }}
    >
      <Logo size="lg" className="w-12 h-12 text-white/[0.03]" />
    </div>
  );
}
