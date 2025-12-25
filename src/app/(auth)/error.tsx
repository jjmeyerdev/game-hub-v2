'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Auth error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-[var(--theme-bg-primary)]">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>

        <h2 className="text-2xl font-bold text-[var(--theme-text-primary)] mb-2 font-[family-name:var(--font-family-display)]">
          Authentication Error
        </h2>
        <p className="text-[var(--theme-text-muted)] mb-6">
          {error.message || 'An error occurred during authentication. Please try again.'}
        </p>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-bold rounded-xl transition-all hover:scale-105"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--theme-bg-secondary)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] font-medium rounded-xl transition-all hover:bg-[var(--theme-hover-bg)]"
          >
            <Home className="w-4 h-4" />
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
