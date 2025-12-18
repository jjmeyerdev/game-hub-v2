'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Gamepad2,
  Library,
  Layers,
  Trophy,
  TrendingUp,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Cpu,
} from 'lucide-react';
import { signOut } from '@/app/(auth)/_actions/auth';

interface DashboardSidebarProps {
  userName: string;
  userEmail: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function DashboardSidebar({
  userName,
  userEmail,
  collapsed,
  onToggleCollapse,
}: DashboardSidebarProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  const handleSignOut = async () => {
    await signOut();
  };

  const navItems = [
    { icon: Library, label: 'Dashboard', href: '/dashboard' },
    { icon: Gamepad2, label: 'Library', href: '/library' },
    { icon: Layers, label: 'Backlog', href: '/backlog' },
  ];

  const analyticsItems = [
    { icon: Trophy, label: 'Achievements', href: '/achievements' },
    { icon: TrendingUp, label: 'Stats', href: '/stats' },
  ];

  const socialItems = [
    { icon: Users, label: 'Friends', href: '/friends' },
  ];

  return (
    <aside
      className={`
        fixed h-screen bg-abyss/95 backdrop-blur-xl border-r border-white/[0.04]
        flex flex-col transition-all duration-500 ease-out z-40
        ${collapsed ? 'w-20' : 'w-72'}
      `}
    >
      {/* Subtle gradient at top */}
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-cyan-500/[0.03] to-transparent pointer-events-none" />

      {/* Toggle Button */}
      <button
        onClick={onToggleCollapse}
        className="absolute -right-3 top-8 z-50 group"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <div className="w-6 h-6 rounded-full bg-abyss border border-white/[0.12] flex items-center justify-center transition-all hover:border-cyan-400/40 hover:bg-cyan-400/10">
          {collapsed ? (
            <ChevronRight className="w-3 h-3 text-white/50 group-hover:text-cyan-400" />
          ) : (
            <ChevronLeft className="w-3 h-3 text-white/50 group-hover:text-cyan-400" />
          )}
        </div>
      </button>

      {/* Logo Section */}
      <div className={`relative px-6 py-6 transition-all duration-500 ${collapsed ? 'px-4' : 'px-6'}`}>
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative flex-shrink-0">
            <div className="w-11 h-11 bg-gradient-to-br from-cyan-500 to-violet-600 rounded-lg flex items-center justify-center transform group-hover:scale-105 transition-all duration-300">
              <Gamepad2 className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            {/* Corner brackets */}
            <div className="absolute -top-1 -left-1 w-2 h-2 border-l-2 border-t-2 border-cyan-400/50" />
            <div className="absolute -top-1 -right-1 w-2 h-2 border-r-2 border-t-2 border-cyan-400/50" />
            <div className="absolute -bottom-1 -left-1 w-2 h-2 border-l-2 border-b-2 border-cyan-400/50" />
            <div className="absolute -bottom-1 -right-1 w-2 h-2 border-r-2 border-b-2 border-cyan-400/50" />
          </div>
          <div
            className={`flex flex-col transition-all duration-500 ${
              collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
            }`}
          >
            <span className="text-lg font-semibold tracking-wide text-white font-[family-name:var(--font-family-display)]">
              GAMEHUB
            </span>
            <span className="text-[9px] text-cyan-400/60 tracking-[0.2em] uppercase">
              Command Center
            </span>
          </div>
        </Link>
      </div>

      {/* Divider */}
      <div className="mx-6 h-px bg-gradient-to-r from-cyan-400/20 via-white/[0.06] to-transparent" />

      {/* Navigation */}
      <nav className={`flex-1 py-6 overflow-y-auto transition-all duration-500 ${collapsed ? 'px-3' : 'px-4'}`}>
        {/* Main Navigation */}
        <div className="mb-8">
          {!collapsed && (
            <div className="flex items-center gap-2 px-3 mb-3">
              <Cpu className="w-3 h-3 text-cyan-400/40" />
              <span className="text-[9px] font-mono text-cyan-400/40 uppercase tracking-[0.2em]">// Main</span>
            </div>
          )}
          <div className="space-y-1">
            {navItems.map((item) => (
              <NavItem
                key={item.href}
                icon={item.icon}
                label={item.label}
                href={item.href}
                collapsed={collapsed}
                active={pathname === item.href}
              />
            ))}
          </div>
        </div>

        {/* Analytics */}
        <div className="mb-8">
          {!collapsed && (
            <div className="flex items-center gap-2 px-3 mb-3">
              <TrendingUp className="w-3 h-3 text-violet-400/40" />
              <span className="text-[9px] font-mono text-violet-400/40 uppercase tracking-[0.2em]">// Analytics</span>
            </div>
          )}
          <div className="space-y-1">
            {analyticsItems.map((item) => (
              <NavItem
                key={item.href}
                icon={item.icon}
                label={item.label}
                href={item.href}
                collapsed={collapsed}
                active={pathname === item.href}
              />
            ))}
          </div>
        </div>

        {/* Social */}
        <div>
          {!collapsed && (
            <div className="flex items-center gap-2 px-3 mb-3">
              <Users className="w-3 h-3 text-emerald-400/40" />
              <span className="text-[9px] font-mono text-emerald-400/40 uppercase tracking-[0.2em]">// Network</span>
            </div>
          )}
          <div className="space-y-1">
            {socialItems.map((item) => (
              <NavItem
                key={item.href}
                icon={item.icon}
                label={item.label}
                href={item.href}
                collapsed={collapsed}
                active={pathname === item.href}
              />
            ))}
          </div>
        </div>
      </nav>

      {/* User Profile Section */}
      <div className={`relative p-4 transition-all duration-500 ${collapsed ? 'px-3' : 'px-4'}`} ref={userMenuRef}>
        {/* Top divider */}
        <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

        <button
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className={`
            w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-300 group
            hover:bg-white/[0.03] border border-transparent hover:border-cyan-400/20
            ${collapsed ? 'justify-center' : ''}
          `}
        >
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center text-sm font-bold text-white font-[family-name:var(--font-family-display)]">
              {userName.substring(0, 2).toUpperCase()}
            </div>
            {/* Online indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-abyss">
              <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-50" />
            </div>
          </div>

          {/* User info */}
          <div
            className={`flex-1 min-w-0 text-left transition-all duration-500 ${
              collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white/90 truncate font-[family-name:var(--font-family-display)]">
                  {userName}
                </div>
                <div className="text-[10px] text-emerald-400/80 font-mono uppercase tracking-wider">
                  Online
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-white/30 transition-all duration-300 flex-shrink-0 ${
                  userMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </div>
          </div>

          {/* Tooltip for collapsed state */}
          {collapsed && (
            <div className="absolute left-full ml-3 px-3 py-2 bg-abyss border border-white/[0.08] rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 shadow-2xl">
              <div className="text-sm font-medium text-white whitespace-nowrap font-[family-name:var(--font-family-display)]">
                {userName}
              </div>
              <div className="text-[10px] text-emerald-400/80 font-mono mt-0.5">ONLINE</div>
            </div>
          )}
        </button>

        {/* Dropdown Menu */}
        {userMenuOpen && (
          <div
            className={`
              absolute z-50 overflow-hidden
              ${collapsed ? 'left-full ml-2 bottom-4 w-56' : 'bottom-full mb-2 left-4 right-4'}
              bg-abyss border border-white/[0.08] rounded-xl shadow-2xl
            `}
          >
            {/* Menu header */}
            <div className="px-4 py-3 border-b border-white/[0.04] bg-white/[0.01]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center text-sm font-bold text-white font-[family-name:var(--font-family-display)]">
                  {userName.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate font-[family-name:var(--font-family-display)]">{userName}</div>
                  <div className="text-[10px] text-white/40 truncate font-mono">{userEmail}</div>
                </div>
              </div>
            </div>

            {/* Menu items */}
            <div className="py-2">
              <Link
                href="/settings"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.03] transition-all duration-200 group"
              >
                <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center group-hover:border-cyan-400/30 group-hover:bg-cyan-400/10 transition-all">
                  <Settings className="w-4 h-4 text-white/50 group-hover:text-cyan-400" />
                </div>
                <span className="text-sm text-white/60 group-hover:text-white/90 transition-colors">
                  Settings
                </span>
              </Link>

              <div className="h-px bg-white/[0.04] my-2 mx-4" />

              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  handleSignOut();
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-500/10 transition-all duration-200 group"
              >
                <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center group-hover:bg-red-500/20 transition-all">
                  <LogOut className="w-4 h-4 text-red-400" />
                </div>
                <span className="text-sm text-red-400 group-hover:text-red-300 transition-colors">
                  Sign out
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  href: string;
  collapsed: boolean;
  active?: boolean;
}

function NavItem({ icon: Icon, label, href, collapsed, active }: NavItemProps) {
  return (
    <Link
      href={href}
      className={`
        relative flex items-center gap-3 px-3 py-2.5 rounded-xl
        transition-all duration-300 group
        ${active
          ? 'bg-cyan-400/10 text-white border border-cyan-400/20'
          : 'text-white/40 hover:text-white/80 hover:bg-white/[0.03] border border-transparent hover:border-white/[0.06]'
        }
        ${collapsed ? 'justify-center' : ''}
      `}
    >
      {/* Active indicator */}
      {active && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-cyan-400 rounded-r-full shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
      )}

      <Icon className={`w-5 h-5 flex-shrink-0 transition-colors ${active ? 'text-cyan-400' : ''}`} />

      <span
        className={`text-sm font-medium transition-all duration-500 ${
          collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
        }`}
      >
        {label}
      </span>

      {/* Tooltip for collapsed state */}
      {collapsed && (
        <div className="absolute left-full ml-3 px-3 py-1.5 bg-abyss border border-white/[0.08] rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 shadow-xl">
          <span className="text-sm text-white whitespace-nowrap">{label}</span>
        </div>
      )}
    </Link>
  );
}
