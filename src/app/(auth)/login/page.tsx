'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { Gamepad2, X, Zap, Shield, Loader2, AlertCircle } from 'lucide-react';
import { signIn } from '@/app/_actions/auth';

export default function LoginPage() {
  const [state, formAction] = useActionState<{ error?: string } | undefined, FormData>(signIn, undefined);

  return (
    <div className="min-h-screen bg-void flex flex-col relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }}></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,217,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,217,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px]"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-6">
        <Link href="/" className="flex items-center space-x-2 group w-fit">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-lg flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-300">
              <Gamepad2 className="w-6 h-6 text-void" strokeWidth={2.5} />
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-lg blur-lg opacity-40 group-hover:opacity-60 transition-opacity"></div>
          </div>
          <span className="text-2xl font-bold tracking-tight">
            Game<span className="text-cyan-400">hub</span>
          </span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Marketing Copy */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                <span className="text-white">Welcome Back to</span>
                <br />
                <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  Your Gaming Hub
                </span>
              </h1>
              <p className="text-xl text-gray-400 leading-relaxed">
                Access your unified game library across all platforms
              </p>
            </div>

            {/* Feature Stats */}
            <div className="grid grid-cols-3 gap-4 pt-8">
              <FeatureStat icon={Gamepad2} value="10+" label="Platforms integrated" />
              <FeatureStat icon={Zap} value="24/7" label="Real-time sync" />
              <FeatureStat icon={Shield} value="Free" label="Forever to use" />
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="relative">
            {/* Modal Card */}
            <div className="relative bg-deep/80 backdrop-blur-xl border border-steel rounded-2xl p-8 shadow-2xl">
              {/* Close Button */}
              <Link
                href="/"
                className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </Link>

              {/* Form Header */}
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-2">Log In</h2>
                <p className="text-gray-400 text-sm">and continue your gaming journey</p>
              </div>

              {/* Form */}
              <form action={formAction} className="space-y-6">
                {/* Error Message */}
                {state?.error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-red-400 font-semibold">Authentication Error</p>
                      <p className="text-xs text-red-300 mt-1">{state.error}</p>
                    </div>
                  </div>
                )}

                {/* Email Field */}
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-300">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    className="w-full bg-slate/50 border border-steel rounded-lg px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-300">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    required
                    className="w-full bg-slate/50 border border-steel rounded-lg px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Submit Button */}
                <SubmitButton />
              </form>

              {/* Sign Up Link */}
              <p className="mt-6 text-center text-sm text-gray-400">
                Don't have an account?{' '}
                <Link href="/signup" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
                  Sign Up
                </Link>{' '}
                here
              </p>

              {/* Terms */}
              <p className="mt-6 text-center text-xs text-gray-600">
                By logging in, you agree to our{' '}
                <a href="#" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                  Terms and Conditions
                </a>{' '}
                and{' '}
                <a href="#" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                  Privacy Policy
                </a>
                , including{' '}
                <a href="#" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                  Cookie Use
                </a>
                .
              </p>
            </div>

            {/* Card Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-2xl blur-xl -z-10"></div>
          </div>
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
      className="w-full bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-void font-bold py-3 rounded-lg transition-all transform hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center space-x-2"
    >
      {pending ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Logging In...</span>
        </>
      ) : (
        <span>Log In</span>
      )}
    </button>
  );
}

interface FeatureStatProps {
  icon: React.ElementType;
  value: string;
  label: string;
}

function FeatureStat({ icon: Icon, value, label }: FeatureStatProps) {
  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="relative p-4 rounded-xl border border-steel/50 group-hover:border-cyan-500/50 transition-all duration-300">
        <Icon className="w-6 h-6 text-cyan-400 mb-2" />
        <div className="text-2xl font-bold text-cyan-400 mb-1">{value}</div>
        <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider leading-tight">
          {label}
        </div>
      </div>
    </div>
  );
}
