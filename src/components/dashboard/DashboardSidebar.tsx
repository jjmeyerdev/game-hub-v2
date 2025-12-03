'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Gamepad2,
  Library,
  Trophy,
  TrendingUp,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { signOut } from '@/app/actions/auth';
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
      className={`bg-abyss border-r border-steel flex flex-col fixed h-screen transition-all duration-500 ease-in-out ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Toggle Button - Cyber Control Panel Style */}
      <button
        onClick={onToggleCollapse}
        className="absolute -right-4 top-8 z-50 group"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <div className="relative">
          {/* Outer ring with glow */}
          <div className="w-8 h-8 rounded-full bg-abyss border-2 border-steel group-hover:border-cyan-500 transition-all duration-300 flex items-center justify-center shadow-lg">
            {collapsed ? (
              <ChevronRight className="w-4 h-4 text-cyan-400" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-cyan-400" />
            )}
          </div>
          {/* Animated glow effect */}
          <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          {/* Pulse ring on hover */}
          <div className="absolute inset-0 rounded-full border-2 border-cyan-500/50 animate-ping opacity-0 group-hover:opacity-75" />
        </div>
      </button>

      {/* Logo */}
      <div className={`p-6 border-b border-steel transition-all duration-500 ${collapsed ? 'px-4' : 'px-6'}`}>
        <Link href="/" className="flex items-center space-x-2 group">
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-lg flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-300">
              <Gamepad2 className="w-6 h-6 text-void" strokeWidth={2.5} />
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-lg blur-lg opacity-40 group-hover:opacity-60 transition-opacity"></div>
          </div>
          <span
            className={`text-xl font-bold tracking-tight whitespace-nowrap transition-all duration-500 ${
              collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
            }`}
          >
            Game<span className="text-cyan-400">hub</span>
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 p-4 space-y-1 transition-all duration-500 ${collapsed ? 'px-2' : 'px-4'}`}>
        <NavItem icon={Library} label="Dashboard" collapsed={collapsed} href="/dashboard" />
        <NavItem icon={Gamepad2} label="Library" collapsed={collapsed} href="/library" />
        <NavItem icon={Trophy} label="Achievements" collapsed={collapsed} href="/achievements" />
        <NavItem icon={TrendingUp} label="Stats" collapsed={collapsed} href="/stats" />
        <NavItem icon={Users} label="Friends" collapsed={collapsed} href="/friends" />
      </nav>

      {/* User Profile with Dropdown Menu */}
      <div className={`p-4 border-t border-steel transition-all duration-500 ${collapsed ? 'px-2' : 'px-4'} relative`} ref={userMenuRef}>
        <button
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className={`w-full flex items-center ${
            collapsed ? 'justify-center' : 'space-x-3'
          } group hover:bg-deep/50 rounded-lg p-2 -m-2 transition-all duration-300 relative`}
        >
          {/* Avatar with pulse effect */}
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center font-bold text-sm border-2 border-void transition-all duration-300 group-hover:border-cyan-500">
              {userName.substring(0, 2).toUpperCase()}
            </div>
            {/* Animated ring on hover */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 opacity-0 group-hover:opacity-30 blur-md transition-opacity duration-300" />
            {/* Status indicator */}
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-abyss" />
          </div>

          {/* User info and chevron */}
          <div
            className={`flex-1 min-w-0 transition-all duration-500 ${
              collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white truncate group-hover:text-cyan-400 transition-colors">
                  {userName}
                </div>
                <div className="text-xs text-gray-500 truncate">{userEmail}</div>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-gray-500 group-hover:text-cyan-400 transition-all duration-300 flex-shrink-0 ml-2 ${
                  userMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </div>
          </div>

          {/* Tooltip for collapsed state */}
          {collapsed && (
            <span className="absolute left-full ml-4 px-3 py-1.5 bg-deep border border-steel rounded-lg text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              {userName}
            </span>
          )}
        </button>

        {/* Dropdown Menu */}
        {userMenuOpen && (
          <div
            className={`absolute ${
              collapsed ? 'left-full ml-2 bottom-4' : 'bottom-full mb-2 left-0 right-0 mx-4'
            } bg-abyss border-2 border-cyan-500/30 rounded-xl overflow-hidden shadow-2xl z-50`}
            style={{
              animation: 'dropdownSlideIn 0.3s ease-out',
            }}
          >
            {/* Cyber glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/10 pointer-events-none" />
            <div className="absolute inset-0 border border-cyan-500/20 rounded-xl blur-sm pointer-events-none" />

            {/* Menu header */}
            <div className="px-4 py-3 border-b border-steel/50 bg-deep/30 backdrop-blur-sm">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center font-bold text-xs border border-cyan-500/50">
                  {userName.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white truncate">{userName}</div>
                  <div className="text-xs text-cyan-400/70 truncate">{userEmail}</div>
                </div>
              </div>
            </div>

            {/* Menu items */}
            <div className="py-2">
              {/* Settings */}
              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  // Navigate to settings or handle settings
                }}
                className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-cyan-500/10 transition-all duration-200 group"
              >
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center group-hover:bg-cyan-500/20 group-hover:border-cyan-500/40 transition-all">
                  <Settings className="w-4 h-4 text-cyan-400" />
                </div>
                <span className="text-sm font-semibold text-gray-300 group-hover:text-white transition-colors">
                  Settings
                </span>
              </button>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-steel to-transparent my-2" />

              {/* Sign Out */}
              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  handleSignOut();
                }}
                className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-red-500/10 transition-all duration-200 group"
              >
                <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center group-hover:bg-red-500/20 group-hover:border-red-500/40 transition-all">
                  <LogOut className="w-4 h-4 text-red-400" />
                </div>
                <span className="text-sm font-semibold text-red-400 group-hover:text-red-300 transition-colors">
                  Sign Out
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
