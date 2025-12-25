'use client';

import { useState, ReactNode } from 'react';
import { DashboardSidebar } from '@/components/dashboard';
import { useDashboardData } from '@/lib/hooks';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user } = useDashboardData();

  return (
    <div className="min-h-screen bg-theme-primary text-theme-primary flex overflow-hidden">
      {/* Noise texture overlay */}
      <div className="noise-overlay" />

      {/* Scan line effect */}
      <div className="fixed inset-0 pointer-events-none z-60 overflow-hidden">
        <div className="absolute w-full h-[2px] bg-linear-to-r from-transparent via-cyan-400/15 to-transparent animate-scan-line" />
      </div>

      {/* Grid background */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `
              linear-gradient(90deg, rgba(34, 211, 238, 0.5) 1px, transparent 1px),
              linear-gradient(rgba(34, 211, 238, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px',
          }}
        />
        {/* Hex pattern */}
        <div
          className="absolute inset-0 opacity-[0.01]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15z' fill='none' stroke='%2322d3ee' stroke-width='0.5'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Sidebar */}
      <DashboardSidebar
        userName={user.name}
        userEmail={user.email}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-500 overflow-x-hidden ${sidebarCollapsed ? 'ml-20' : 'ml-72'}`}>
        {children}
      </main>
    </div>
  );
}
