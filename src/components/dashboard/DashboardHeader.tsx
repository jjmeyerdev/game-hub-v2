'use client';

interface DashboardHeaderProps {
  userName: string;
  greeting: string;
}

export function DashboardHeader({
  userName,
  greeting,
}: DashboardHeaderProps) {
  return (
    <header className="bg-abyss/80 backdrop-blur-xl border-b border-steel px-8 py-6 sticky top-0 z-40 overflow-hidden">
      {/* Animated scan line effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute h-px w-full bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"
          style={{
            animation: 'scanline 3s linear infinite',
            top: '0',
          }}
        />
      </div>

      <div className="flex items-center justify-between w-full relative">
        {/* Left: Greeting Section */}
        <div className="flex-1">
          {/* Dashboard label with cyber styling */}
          <div className="flex items-center gap-3 mb-2">
            <h1
              className="text-sm font-bold tracking-[0.2em] uppercase text-cyan-400/60"
              style={{ fontFamily: 'var(--font-rajdhani)' }}
            >
              ▸ Dashboard
            </h1>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-400/80 tracking-wide">
                ONLINE
              </span>
            </div>
          </div>

          {/* Dynamic greeting with holographic effect */}
          <div className="flex items-baseline gap-2">
            <span
              className="text-lg text-gray-400 font-medium"
              style={{ fontFamily: 'var(--font-rajdhani)' }}
            >
              {greeting},
            </span>
            <div className="relative group">
              <h2
                className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent animate-shimmer"
                style={{
                  fontFamily: 'var(--font-rajdhani)',
                  backgroundSize: '200% auto',
                }}
              >
                {userName}
              </h2>
              {/* Holographic glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-purple-400/20 blur-xl opacity-50 group-hover:opacity-70 transition-opacity -z-10" />
            </div>
          </div>
        </div>

      </div>
    </header>
  );
}
