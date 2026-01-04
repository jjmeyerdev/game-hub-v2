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
  const [displayValue, setDisplayValue] = useState('--');
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsRevealed(true);
      const numericValue = parseInt(value.replace(/[^0-9]/g, ''));
      if (!isNaN(numericValue) && numericValue > 0) {
        let iterations = 0;
        const maxIterations = 6;
        const interval = setInterval(() => {
          if (iterations >= maxIterations) {
            setDisplayValue(value);
            clearInterval(interval);
          } else {
            const randomValue = Math.floor(Math.random() * numericValue * 1.5);
            setDisplayValue(value.includes('%') ? `${randomValue}%` : randomValue.toLocaleString());
            iterations++;
          }
        }, 40);
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
      iconBg: 'bg-cyan-500/10',
      iconBorder: 'border-cyan-500/20',
      accent: 'bg-cyan-400',
    },
    purple: {
      text: 'text-violet-400',
      iconBg: 'bg-violet-500/10',
      iconBorder: 'border-violet-500/20',
      accent: 'bg-violet-400',
    },
    emerald: {
      text: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10',
      iconBorder: 'border-emerald-500/20',
      accent: 'bg-emerald-400',
    },
    amber: {
      text: 'text-amber-400',
      iconBg: 'bg-amber-500/10',
      iconBorder: 'border-amber-500/20',
      accent: 'bg-amber-400',
    },
  };

  const c = colorConfig[color];

  return (
    <div className="group relative bg-theme-secondary border border-theme rounded-2xl p-6 transition-all duration-500 hover:bg-theme-tertiary hover:border-theme-hover overflow-hidden">
      {/* HUD corners on hover */}
      <div className={`absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 ${c.iconBorder.replace('/20', '/50')} opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className={`absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 ${c.iconBorder.replace('/20', '/50')} opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className={`absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 ${c.iconBorder.replace('/20', '/50')} opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className={`absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 ${c.iconBorder.replace('/20', '/50')} opacity-0 group-hover:opacity-100 transition-opacity`} />

      {/* Subtle glow on hover */}
      <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10 ${c.iconBg}`} />

      {/* Header row */}
      <div className="relative flex items-center justify-between mb-5">
        <div className={`p-2.5 rounded-xl ${c.iconBg} border ${c.iconBorder}`}>
          <Icon className={`w-5 h-5 ${c.text}`} />
        </div>
        {change && (
          <span className="text-[10px] font-mono font-medium tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full uppercase">
            {change}
          </span>
        )}
      </div>

      {/* Value */}
      <div className="relative mb-2">
        <span
          className={`text-4xl font-bold font-mono ${c.text} tabular-nums tracking-tight transition-all duration-300 ${isRevealed ? 'opacity-100' : 'opacity-50'}`}
        >
          {displayValue}
        </span>
      </div>

      {/* Label */}
      <div className="relative flex items-center gap-2">
        <div className={`w-1 h-1 rounded-full ${c.accent}`} />
        <span className="text-[10px] font-mono text-theme-muted uppercase tracking-wider">
          {label}
        </span>
      </div>
    </div>
  );
}
