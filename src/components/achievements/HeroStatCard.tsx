import type { LucideIcon } from 'lucide-react';

interface HeroStatCardProps {
  icon: LucideIcon;
  value: string;
  label: string;
  sublabel: string;
  color: 'emerald' | 'cyan' | 'amber' | 'violet';
  delay: number;
}

const colorStyles = {
  emerald: {
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-400/30',
    glow: 'hover:shadow-emerald-500/10',
  },
  cyan: {
    text: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-400/30',
    glow: 'hover:shadow-cyan-500/10',
  },
  amber: {
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-400/30',
    glow: 'hover:shadow-amber-500/10',
  },
  violet: {
    text: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-400/30',
    glow: 'hover:shadow-violet-500/10',
  },
};

export function HeroStatCard({ icon: Icon, value, label, sublabel, color, delay }: HeroStatCardProps) {
  const styles = colorStyles[color];

  return (
    <div
      className={`group relative bg-[var(--theme-bg-secondary)] border border-[var(--theme-border)] rounded-xl p-5 hover:border-white/[0.12] transition-all duration-300 overflow-hidden ${styles.glow} hover:shadow-lg`}
      style={{ animation: `fadeIn 0.4s ease-out ${delay}s both` }}
    >
      {/* HUD corners */}
      <div className={`absolute top-0 left-0 w-2 h-2 border-l border-t ${styles.border} opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className={`absolute top-0 right-0 w-2 h-2 border-r border-t ${styles.border} opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className={`absolute bottom-0 left-0 w-2 h-2 border-l border-b ${styles.border} opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className={`absolute bottom-0 right-0 w-2 h-2 border-r border-b ${styles.border} opacity-0 group-hover:opacity-100 transition-opacity`} />

      <div className="relative flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl ${styles.bg} ${styles.border} border flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
          <Icon className={`w-6 h-6 ${styles.text}`} />
        </div>

        <div className="min-w-0">
          <div className={`text-2xl font-bold font-mono ${styles.text} tabular-nums`}>
            {value}
          </div>
          <div className="text-sm text-[var(--theme-text-muted)] font-medium truncate">{label}</div>
          <div className="text-[11px] font-mono text-[var(--theme-text-subtle)]">{sublabel}</div>
        </div>
      </div>
    </div>
  );
}
