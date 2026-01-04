import { Trophy } from 'lucide-react';

export default function AchievementsLoading() {
  return (
    <div className="min-h-screen bg-theme-primary flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Trophy className="w-12 h-12 text-emerald-400/60 animate-pulse" />
          <div className="absolute inset-0 w-12 h-12 border-2 border-emerald-400/20 rounded-full animate-ping" />
        </div>
        <p className="text-[11px] font-mono text-theme-subtle uppercase tracking-wider">
          // Loading achievement data...
        </p>
      </div>
    </div>
  );
}
