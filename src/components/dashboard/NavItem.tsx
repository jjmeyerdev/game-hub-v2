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
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span
        className={`font-semibold text-sm whitespace-nowrap transition-all duration-500 ${
          collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
        }`}
      >
        {label}
      </span>
      {/* Tooltip for collapsed state */}
      {collapsed && (
        <span className="absolute left-full ml-4 px-3 py-1.5 bg-deep border border-steel rounded-lg text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
          {label}
        </span>
      )}
    </>
  );

  const className = `w-full flex items-center ${
    collapsed ? 'justify-center px-2' : 'space-x-3 px-4'
  } py-3 rounded-lg transition-all group relative ${
    active
      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
      : 'text-gray-400 hover:text-white hover:bg-slate'
  }`;

  if (href) {
    return (
      <Link href={href} className={className} title={collapsed ? label : undefined}>
        {content}
      </Link>
    );
  }

  return (
    <button className={className} title={collapsed ? label : undefined}>
      {content}
    </button>
  );
}
