import { X } from 'lucide-react';

interface FilterTagProps {
  label: string;
  onRemove: () => void;
}

export function FilterTag({ label, onRemove }: FilterTagProps) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-mono font-medium rounded-md uppercase tracking-wider">
      {label}
      <button onClick={onRemove} className="hover:text-cyan-300 transition-colors">
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}
