'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  collapsed?: boolean;
  href?: string;
}

export function NavItem({ icon: Icon, label, collapsed, href }: NavItemProps) {
  const pathname = usePathname();
  const active = href ? pathname === href : false;

  const content = (
    <>
      {/* Active indicator bar */}
      {active && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 bg-cyan-500 rounded-r shadow-[0_0_10px_rgba(0,217,255,0.5)]" />
      )}

      {/* Icon container */}
      <div className={`
        relative flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-300
        ${active
          ? 'bg-cyan-500/15 border border-cyan-500/30'
          : 'bg-transparent group-hover:bg-steel/50'
        }
      `}>
        <Icon className={`w-[18px] h-[18px] flex-shrink-0 transition-colors duration-300 ${active ? 'text-cyan-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
      </div>

      {/* Label */}
      <span
        className={`
          font-semibold text-sm tracking-wide whitespace-nowrap transition-all duration-500
          ${collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}
          ${active ? 'text-cyan-400' : 'text-gray-500 group-hover:text-white'}
        `}
        style={{ fontFamily: 'var(--font-rajdhani)' }}
      >
        {label}
      </span>

      {/* Tooltip for collapsed state */}
      {collapsed && (
        <div className="absolute left-full ml-3 px-3 py-2 bg-abyss border border-cyan-500/30 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 shadow-xl">
          <div className="text-xs font-bold text-cyan-400 whitespace-nowrap" style={{ fontFamily: 'var(--font-rajdhani)' }}>
            {label}
          </div>
          {/* Tooltip arrow */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-abyss border-l border-b border-cyan-500/30 rotate-45" />
        </div>
      )}
    </>
  );

  const className = `
    w-full flex items-center gap-3 py-2 rounded-lg transition-all duration-300 group relative
    ${collapsed ? 'justify-center px-2' : 'px-3'}
    ${active ? 'bg-cyan-500/5' : 'hover:bg-steel/30'}
  `;

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button className={className}>
      {content}
    </button>
  );
}
