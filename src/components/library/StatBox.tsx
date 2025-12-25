interface StatBoxProps {
  label: string;
  value: string;
  color: 'cyan' | 'violet' | 'emerald' | 'amber';
}

const colorMap = {
  cyan: { text: 'text-cyan-400', border: 'border-cyan-400/50' },
  violet: { text: 'text-violet-400', border: 'border-violet-400/50' },
  emerald: { text: 'text-emerald-400', border: 'border-emerald-400/50' },
  amber: { text: 'text-amber-400', border: 'border-amber-400/50' },
};

export function StatBox({ label, value, color }: StatBoxProps) {
  return (
    <div className="group relative bg-[var(--theme-bg-secondary)] border border-[var(--theme-border)] rounded-xl p-4 hover:border-[var(--theme-border-hover)] transition-colors overflow-hidden">
      {/* Hover HUD corners */}
      <div className={`absolute top-0 left-0 w-2 h-2 border-l border-t ${colorMap[color].border} opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className={`absolute top-0 right-0 w-2 h-2 border-r border-t ${colorMap[color].border} opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className={`absolute bottom-0 left-0 w-2 h-2 border-l border-b ${colorMap[color].border} opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className={`absolute bottom-0 right-0 w-2 h-2 border-r border-b ${colorMap[color].border} opacity-0 group-hover:opacity-100 transition-opacity`} />

      <div className="relative">
        <div className={`text-2xl font-bold font-mono ${colorMap[color].text} tabular-nums`}>{value}</div>
        <div className="text-[10px] font-mono text-[var(--theme-text-subtle)] mt-1 uppercase tracking-wider">{label}</div>
      </div>
    </div>
  );
}
