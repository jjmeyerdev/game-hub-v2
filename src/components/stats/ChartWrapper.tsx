import type { LucideIcon } from 'lucide-react';

interface ChartWrapperProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  color: 'cyan' | 'violet' | 'emerald' | 'amber';
  children: React.ReactNode;
  className?: string;
}

const colorConfig = {
  cyan: {
    iconBg: 'bg-cyan-500/10',
    iconBorder: 'border-cyan-500/20',
    iconColor: 'text-cyan-400',
    corner: 'border-cyan-400/30',
    accent: 'via-cyan-500/30',
  },
  violet: {
    iconBg: 'bg-violet-500/10',
    iconBorder: 'border-violet-500/20',
    iconColor: 'text-violet-400',
    corner: 'border-violet-400/30',
    accent: 'via-violet-500/30',
  },
  emerald: {
    iconBg: 'bg-emerald-500/10',
    iconBorder: 'border-emerald-500/20',
    iconColor: 'text-emerald-400',
    corner: 'border-emerald-400/30',
    accent: 'via-emerald-500/30',
  },
  amber: {
    iconBg: 'bg-amber-500/10',
    iconBorder: 'border-amber-500/20',
    iconColor: 'text-amber-400',
    corner: 'border-amber-400/30',
    accent: 'via-amber-500/30',
  },
};

export function ChartWrapper({
  title,
  subtitle,
  icon: Icon,
  color,
  children,
  className = '',
}: ChartWrapperProps) {
  const colors = colorConfig[color];

  return (
    <div className={`relative bg-theme-secondary border border-theme rounded-2xl overflow-hidden ${className}`}>
      {/* Top accent line */}
      <div className={`absolute top-0 left-8 right-8 h-px bg-linear-to-r from-transparent ${colors.accent} to-transparent`} />

      {/* HUD corners */}
      <div className={`absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 ${colors.corner}`} />
      <div className={`absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 ${colors.corner}`} />
      <div className={`absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 ${colors.corner}`} />
      <div className={`absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 ${colors.corner}`} />

      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b border-theme">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colors.iconBg} border ${colors.iconBorder}`}>
            <Icon className={`w-4 h-4 ${colors.iconColor}`} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-theme-primary uppercase tracking-wide font-family-display">
              {title}
            </h3>
            {subtitle && (
              <p className="text-[10px] font-mono text-theme-subtle uppercase tracking-wider mt-0.5">
                // {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}
