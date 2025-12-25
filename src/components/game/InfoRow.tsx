interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'cyan' | 'violet' | 'emerald';
}

const colorMap = {
  cyan: { text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
  violet: { text: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
  emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
};

export function InfoRow({ icon, label, value, color }: InfoRowProps) {
  const c = colorMap[color];

  return (
    <div className={`flex items-center gap-3 p-3 ${c.bg} ${c.border} border rounded-lg`}>
      <span className={c.text}>{icon}</span>
      <div className="flex-1">
        <div className="text-[9px] font-mono text-[var(--theme-text-subtle)] uppercase tracking-wider">{label}</div>
        <div className="text-sm font-medium text-white">{value}</div>
      </div>
    </div>
  );
}
