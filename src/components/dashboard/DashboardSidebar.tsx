'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
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
  Radio,
} from 'lucide-react';
import { signOut } from '@/app/_actions/auth';
import { NavItem } from './NavItem';

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

  // Handle click outside to close user menu
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

  return (
    <aside
      className={`
        relative bg-gradient-to-b from-abyss via-void to-abyss
        border-r border-cyan-500/20 flex flex-col fixed h-screen
        transition-all duration-500 ease-in-out overflow-hidden
        ${collapsed ? 'w-20' : 'w-64'}
      `}
    >
      {/* Subtle grid background */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{
        backgroundImage: `
          linear-gradient(rgba(0, 217, 255, 0.5) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 217, 255, 0.5) 1px, transparent 1px)
        `,
        backgroundSize: '30px 30px'
      }} />

      {/* Right edge glow line */}
      <div className="absolute top-0 right-0 bottom-0 w-px bg-gradient-to-b from-cyan-500/40 via-purple-500/20 to-cyan-500/40" />

      {/* Toggle Button */}
      <button
        onClick={onToggleCollapse}
        className="absolute -right-3 top-8 z-50 group"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <div className="relative">
          <div className="w-6 h-6 rounded-full bg-void border border-cyan-500/50 group-hover:border-cyan-400 transition-all duration-300 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            {collapsed ? (
              <ChevronRight className="w-3 h-3 text-cyan-400" />
            ) : (
              <ChevronLeft className="w-3 h-3 text-cyan-400" />
            )}
          </div>
          <div className="absolute inset-0 rounded-full bg-cyan-500/30 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      </button>

      {/* Logo Section */}
      <div className={`relative p-5 transition-all duration-500 ${collapsed ? 'px-3' : 'px-5'}`}>
        {/* Corner accent */}
        <div className="absolute top-0 left-0 w-6 h-6">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-cyan-500 to-transparent" />
          <div className="absolute top-0 left-0 h-full w-[2px] bg-gradient-to-b from-cyan-500 to-transparent" />
        </div>

        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-lg flex items-center justify-center transform group-hover:scale-105 transition-transform duration-300">
              <Gamepad2 className="w-5 h-5 text-void" strokeWidth={2.5} />
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-lg blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
          </div>
          <div
            className={`flex flex-col transition-all duration-500 ${
              collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
            }`}
          >
            <span className="text-lg font-black tracking-tight text-white" style={{ fontFamily: 'var(--font-rajdhani)' }}>
              GAME<span className="text-cyan-400">HUB</span>
            </span>
            <span className="text-[9px] font-bold tracking-[0.2em] text-gray-600 -mt-1">
              COMMAND CENTER
            </span>
          </div>
        </Link>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-steel to-transparent" />

      {/* Navigation */}
      <nav className={`flex-1 py-4 transition-all duration-500 ${collapsed ? 'px-2' : 'px-3'}`}>
        {/* Main Navigation Section */}
        <div className="mb-6">
          {!collapsed && (
            <div className="flex items-center gap-2 px-3 mb-3">
              <span className="text-[10px] font-bold tracking-[0.2em] text-gray-600 uppercase">Navigation</span>
              <div className="flex-1 h-px bg-gradient-to-r from-steel/50 to-transparent" />
            </div>
          )}
          <div className="space-y-1">
            <NavItem icon={Library} label="Dashboard" collapsed={collapsed} href="/dashboard" />
            <NavItem icon={Gamepad2} label="Library" collapsed={collapsed} href="/library" />
            <NavItem icon={Layers} label="Backlog" collapsed={collapsed} href="/backlog" />
          </div>
        </div>

        {/* Stats Section */}
        <div className="mb-6">
          {!collapsed && (
            <div className="flex items-center gap-2 px-3 mb-3">
              <span className="text-[10px] font-bold tracking-[0.2em] text-gray-600 uppercase">Analytics</span>
              <div className="flex-1 h-px bg-gradient-to-r from-steel/50 to-transparent" />
            </div>
          )}
          <div className="space-y-1">
            <NavItem icon={Trophy} label="Achievements" collapsed={collapsed} href="/achievements" />
            <NavItem icon={TrendingUp} label="Stats" collapsed={collapsed} href="/stats" />
          </div>
        </div>

        {/* Social Section */}
        <div>
          {!collapsed && (
            <div className="flex items-center gap-2 px-3 mb-3">
              <span className="text-[10px] font-bold tracking-[0.2em] text-gray-600 uppercase">Social</span>
              <div className="flex-1 h-px bg-gradient-to-r from-steel/50 to-transparent" />
            </div>
          )}
          <div className="space-y-1">
            <NavItem icon={Users} label="Friends" collapsed={collapsed} href="/friends" />
          </div>
        </div>
      </nav>

      {/* User Profile Section */}
      <div className={`relative p-4 transition-all duration-500 ${collapsed ? 'px-2' : 'px-3'}`} ref={userMenuRef}>
        {/* Top divider with glow */}
        <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

        <button
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className={`
            w-full flex items-center gap-3 p-2 rounded-lg transition-all duration-300 group
            hover:bg-cyan-500/5 border border-transparent hover:border-cyan-500/20
            ${collapsed ? 'justify-center' : ''}
          `}
        >
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center font-bold text-xs text-void border border-cyan-500/30">
              {userName.substring(0, 2).toUpperCase()}
            </div>
            {/* Status indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-void flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
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
                <div className="text-sm font-bold text-white truncate group-hover:text-cyan-400 transition-colors" style={{ fontFamily: 'var(--font-rajdhani)' }}>
                  {userName}
                </div>
                <div className="flex items-center gap-1">
                  <Radio className="w-2.5 h-2.5 text-emerald-400" />
                  <span className="text-[10px] font-bold tracking-wider text-emerald-400/80">ONLINE</span>
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-gray-600 group-hover:text-cyan-400 transition-all duration-300 flex-shrink-0 ${
                  userMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </div>
          </div>

          {/* Tooltip for collapsed state */}
          {collapsed && (
            <div className="absolute left-full ml-3 px-3 py-2 bg-abyss border border-cyan-500/30 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 shadow-xl">
              <div className="text-xs font-bold text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-rajdhani)' }}>
                {userName}
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <Radio className="w-2 h-2 text-emerald-400" />
                <span className="text-[9px] text-emerald-400">ONLINE</span>
              </div>
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-abyss border-l border-b border-cyan-500/30 rotate-45" />
            </div>
          )}
        </button>

        {/* Dropdown Menu */}
        {userMenuOpen && (
          <div
            className={`
              absolute z-50 overflow-hidden
              ${collapsed ? 'left-full ml-2 bottom-4 w-48' : 'bottom-full mb-2 left-3 right-3'}
              bg-abyss/95 backdrop-blur-xl border border-cyan-500/30 rounded-xl shadow-2xl shadow-cyan-500/10
            `}
            style={{ animation: 'dropdownSlideIn 0.2s ease-out' }}
          >
            {/* Menu header */}
            <div className="px-4 py-3 border-b border-steel/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center font-bold text-[10px] text-void">
                  {userName.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white truncate" style={{ fontFamily: 'var(--font-rajdhani)' }}>{userName}</div>
                  <div className="text-[10px] text-gray-500 truncate">{userEmail}</div>
                </div>
              </div>
            </div>

            {/* Menu items */}
            <div className="py-2">
              {/* Settings */}
              <Link
                href="/settings"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-cyan-500/10 transition-all duration-200 group"
              >
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center group-hover:bg-cyan-500/20 transition-all">
                  <Settings className="w-4 h-4 text-cyan-400" />
                </div>
                <span className="text-sm font-semibold text-gray-400 group-hover:text-white transition-colors">
                  Settings
                </span>
              </Link>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-steel to-transparent my-2 mx-4" />

              {/* Sign Out */}
              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  handleSignOut();
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-rose-500/10 transition-all duration-200 group"
              >
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center group-hover:bg-rose-500/20 transition-all">
                  <LogOut className="w-4 h-4 text-rose-400" />
                </div>
                <span className="text-sm font-semibold text-rose-400 group-hover:text-rose-300 transition-colors">
                  Sign Out
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom corner accent */}
      <div className="absolute bottom-0 left-0 w-6 h-6">
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-cyan-500 to-transparent" />
        <div className="absolute bottom-0 left-0 h-full w-[2px] bg-gradient-to-t from-cyan-500 to-transparent" />
      </div>
    </aside>
  );
}
