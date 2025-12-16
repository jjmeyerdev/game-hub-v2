'use client';

interface DashboardHeaderProps {
  userName: string;
  greeting: string;
}

export function DashboardHeader({
  userName,
  greeting,
}: DashboardHeaderProps) {
  const now = new Date();
  const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  const dateString = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();

  return (
    <header className="relative bg-gradient-to-r from-void via-abyss to-void border-b border-cyan-500/20 overflow-hidden">
      {/* Tactical grid background */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `
          linear-gradient(rgba(0, 217, 255, 0.5) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 217, 255, 0.5) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px'
      }} />

      {/* Horizontal scan line */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent animate-command-scan" />
      </div>

      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-24 h-24">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-cyan-500 to-transparent" />
        <div className="absolute top-0 left-0 h-full w-[2px] bg-gradient-to-b from-cyan-500 to-transparent" />
      </div>
      <div className="absolute top-0 right-0 w-24 h-24">
        <div className="absolute top-0 right-0 w-full h-[2px] bg-gradient-to-l from-cyan-500 to-transparent" />
        <div className="absolute top-0 right-0 h-full w-[2px] bg-gradient-to-b from-cyan-500 to-transparent" />
      </div>

      <div className="relative px-8 py-6">
        <div className="flex items-center justify-between">
          {/* Left: Command designation */}
          <div className="flex items-center gap-6">
            {/* Status indicator cluster */}
            <div className="flex flex-col items-center gap-1">
              <div className="relative">
                <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
                <div className="absolute inset-0 w-3 h-3 bg-emerald-400 rounded-full animate-ping opacity-75" />
              </div>
              <span className="text-[10px] font-bold tracking-[0.15em] text-emerald-400/80">LIVE</span>
            </div>

            {/* Divider */}
            <div className="h-12 w-px bg-gradient-to-b from-transparent via-steel to-transparent" />

            {/* Greeting block */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold tracking-[0.2em] text-cyan-500/60">COMMANDER</span>
                <div className="h-px flex-1 bg-gradient-to-r from-cyan-500/40 to-transparent w-16" />
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-sm text-gray-500 font-medium tracking-wide" style={{ fontFamily: 'var(--font-rajdhani)' }}>
                  {greeting},
                </span>
                <h2 className="text-2xl font-black tracking-wide text-white" style={{ fontFamily: 'var(--font-rajdhani)' }}>
                  {userName}
                </h2>
              </div>
            </div>
          </div>

          {/* Right: System time display */}
          <div className="flex items-center gap-6">
            {/* Date block */}
            <div className="text-right">
              <div className="text-[10px] font-bold tracking-[0.2em] text-gray-600 mb-0.5">STARDATE</div>
              <div className="text-sm font-bold tracking-wider text-gray-400" style={{ fontFamily: 'var(--font-rajdhani)' }}>
                {dateString}
              </div>
            </div>

            {/* Time block */}
            <div className="relative">
              <div className="px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded">
                <div className="text-2xl font-black tracking-wider text-cyan-400 tabular-nums" style={{ fontFamily: 'var(--font-rajdhani)' }}>
                  {timeString}
                </div>
              </div>
              {/* Subtle glow */}
              <div className="absolute inset-0 bg-cyan-500/20 blur-xl -z-10" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom edge highlight */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
    </header>
  );
}
