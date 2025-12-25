interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'cyan' | 'violet' | 'amber' | 'emerald';
}

const colorMap = {
  cyan: { text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', corner: 'border-cyan-400/30' },
  violet: { text: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20', corner: 'border-violet-400/30' },
  amber: { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', corner: 'border-amber-400/30' },
  emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', corner: 'border-emerald-400/30' },
};

export function StatCard({ icon, label, value, color }: StatCardProps) {
  const c = colorMap[color];

  return (
    <div className={`relative p-4 ${c.bg} ${c.border} border rounded-xl overflow-hidden group hover:border-white/15 transition-all`}>
      {/* HUD corners on hover */}
      <div className={`absolute top-0 left-0 w-2 h-2 border-l border-t ${c.corner} opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className={`absolute top-0 right-0 w-2 h-2 border-r border-t ${c.corner} opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className={`absolute bottom-0 left-0 w-2 h-2 border-l border-b ${c.corner} opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className={`absolute bottom-0 right-0 w-2 h-2 border-r border-b ${c.corner} opacity-0 group-hover:opacity-100 transition-opacity`} />

      <div className={`${c.text} mb-2`}>{icon}</div>
      <div className="text-[10px] font-mono text-theme-muted mb-1 uppercase tracking-wider">{label}</div>
      <div className="text-lg font-bold text-white font-family-display">{value}</div>
    </div>
  );
}
