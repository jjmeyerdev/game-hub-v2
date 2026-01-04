import Link from 'next/link';

interface PlatformStats {
  earned: number;
  total: number;
  games: number;
  completionPercentage: number;
}

interface PlatformCardProps {
  name: string;
  logo: React.ReactNode;
  stats: PlatformStats;
  color: string;
  bgColor: string;
  borderColor: string;
  delay: number;
}

export function PlatformCard({
  name,
  logo,
  stats,
  color,
  bgColor,
  borderColor,
  delay,
}: PlatformCardProps) {
  const hasData = stats.games > 0;

  return (
    <div
      className={`group relative bg-theme-secondary border ${borderColor} rounded-xl p-5 transition-all duration-300 overflow-hidden hover:border-opacity-60`}
      style={{ animation: `fadeIn 0.4s ease-out ${delay}s both` }}
    >
      {/* HUD corners */}
      <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 opacity-40 group-hover:opacity-70 transition-opacity" style={{ borderColor: color }} />
      <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 opacity-40 group-hover:opacity-70 transition-opacity" style={{ borderColor: color }} />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 opacity-40 group-hover:opacity-70 transition-opacity" style={{ borderColor: color }} />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 opacity-40 group-hover:opacity-70 transition-opacity" style={{ borderColor: color }} />

      {/* Background glow */}
      <div className={`absolute inset-0 ${bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform"
            style={{ backgroundColor: `${color}15`, borderColor: `${color}30`, borderWidth: 1 }}
          >
            <div style={{ color }}>{logo}</div>
          </div>
          <div>
            <h3 className="font-semibold text-theme-primary font-family-display">
              {name}
            </h3>
            <p className="text-[10px] font-mono text-theme-subtle uppercase">
              {stats.games} games
            </p>
          </div>
        </div>

        {hasData ? (
          <>
            {/* Stats */}
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-2xl font-bold font-mono text-theme-primary tabular-nums">
                {stats.earned.toLocaleString()}
              </span>
              <span className="text-sm text-theme-subtle">
                / {stats.total.toLocaleString()}
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-white/6 rounded-full overflow-hidden mb-2">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${stats.completionPercentage}%`,
                  backgroundColor: color,
                }}
              />
            </div>

            <div className="text-right">
              <span className="text-sm font-mono font-medium" style={{ color }}>
                {stats.completionPercentage}%
              </span>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-theme-subtle">No achievements synced</p>
            <Link
              href="/settings"
              className="text-xs font-mono uppercase tracking-wider hover:opacity-80 transition-opacity mt-2 inline-block"
              style={{ color }}
            >
              Connect {name}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
