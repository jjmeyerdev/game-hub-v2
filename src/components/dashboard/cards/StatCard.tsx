'use client';

import { useEffect, useState } from 'react';

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  change: string;
  color: 'cyan' | 'purple' | 'emerald' | 'amber';
  delay?: number;
}

export function StatCard({ label, value, icon: Icon, change, color, delay = 0 }: StatCardProps) {
  const [displayValue, setDisplayValue] = useState('---');
  const [isRevealed, setIsRevealed] = useState(false);

  // Animated number reveal
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsRevealed(true);
      // Numeric scramble effect
      const numericValue = parseInt(value.replace(/[^0-9]/g, ''));
      if (!isNaN(numericValue) && numericValue > 0) {
        let iterations = 0;
        const maxIterations = 8;
        const interval = setInterval(() => {
          if (iterations >= maxIterations) {
            setDisplayValue(value);
            clearInterval(interval);
          } else {
            const randomValue = Math.floor(Math.random() * numericValue * 1.5);
            setDisplayValue(value.includes('%') ? `${randomValue}%` : randomValue.toLocaleString());
            iterations++;
          }
        }, 50);
        return () => clearInterval(interval);
      } else {
        setDisplayValue(value);
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  const colorConfig = {
    cyan: {
      text: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/30',
      glow: 'shadow-cyan-500/20',
      gradient: 'from-cyan-500/20 to-transparent',
      ring: 'ring-cyan-500/40',
    },
    purple: {
      text: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/30',
      glow: 'shadow-purple-500/20',
      gradient: 'from-purple-500/20 to-transparent',
      ring: 'ring-purple-500/40',
    },
    emerald: {
      text: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      glow: 'shadow-emerald-500/20',
      gradient: 'from-emerald-500/20 to-transparent',
      ring: 'ring-emerald-500/40',
    },
    amber: {
      text: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      glow: 'shadow-amber-500/20',
      gradient: 'from-amber-500/20 to-transparent',
      ring: 'ring-amber-500/40',
    },
  };

  const c = colorConfig[color];

  return (
    <div className={`
      relative group overflow-hidden
      bg-gradient-to-br from-deep via-abyss to-void
      border ${c.border} rounded-lg
      transition-all duration-500 ease-out
      hover:scale-[1.02] hover:shadow-lg hover:${c.glow}
      hover:ring-1 ${c.ring}
    `}>
      {/* Holographic scan effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent animate-holo-scan" />
      </div>

      {/* Corner brackets */}
      <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-current opacity-30 rounded-tl" style={{ color: `var(--color-${color}-500)` }} />
      <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-current opacity-30 rounded-tr" style={{ color: `var(--color-${color}-500)` }} />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-current opacity-30 rounded-bl" style={{ color: `var(--color-${color}-500)` }} />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-current opacity-30 rounded-br" style={{ color: `var(--color-${color}-500)` }} />

      <div className="relative p-5">
        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <div className={`p-2 rounded ${c.bg} ${c.border} border`}>
            <Icon className={`w-5 h-5 ${c.text}`} />
          </div>
          {change && (
            <span className="text-[10px] font-bold tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
              {change}
            </span>
          )}
        </div>

        {/* Value display */}
        <div className="mb-1">
          <div
            className={`text-3xl font-black ${c.text} tabular-nums tracking-tight transition-all duration-300 ${isRevealed ? 'opacity-100' : 'opacity-50'}`}
            style={{ fontFamily: 'var(--font-rajdhani)' }}
          >
            {displayValue}
          </div>
        </div>

        {/* Label with data stream effect */}
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${c.text} opacity-60 animate-pulse`} />
          <span className="text-xs font-bold tracking-[0.15em] uppercase text-gray-500">
            {label}
          </span>
        </div>

        {/* Bottom accent line */}
        <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${c.gradient}`} />
      </div>
    </div>
  );
}
