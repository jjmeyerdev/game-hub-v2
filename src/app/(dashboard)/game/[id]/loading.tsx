import { Loader2 } from 'lucide-react';

export default function GameDetailLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--theme-bg-primary)]">
      <div className="relative">
        <Loader2 className="w-12 h-12 text-cyan-400/60 animate-spin" />
        <div className="absolute inset-0 w-12 h-12 border-2 border-cyan-400/20 rounded-full" />
      </div>
      <p className="mt-4 text-[11px] font-mono text-[var(--theme-text-subtle)] uppercase tracking-wider">
        // Loading game data...
      </p>
    </div>
  );
}
