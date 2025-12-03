interface StatCardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  change: string;
  color: 'cyan' | 'purple' | 'emerald';
}

export function StatCard({ label, value, icon: Icon, change, color }: StatCardProps) {
  const colorClasses = {
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  };

  return (
    <div className="bg-deep border border-steel rounded-xl p-6 hover:border-cyan-500/50 transition-all group">
      <div className="flex items-center justify-between mb-4">
        <Icon className={`w-6 h-6 ${colorClasses[color].split(' ')[0]}`} />
        <span className="text-xs font-bold text-emerald-400">{change}</span>
      </div>
      <div className={`text-4xl font-bold ${colorClasses[color].split(' ')[0]} mb-1`}>{value}</div>
      <div className="text-sm text-gray-500 font-semibold">{label}</div>
    </div>
  );
}
