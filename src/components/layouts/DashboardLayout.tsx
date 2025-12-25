'use client';

import { useState, ReactNode } from 'react';
import { DashboardSidebar } from '@/components/dashboard';
import { useDashboardData } from '@/lib/hooks';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user } = useDashboardData();

  return (
    <div className="min-h-screen bg-[var(--theme-bg-primary)] flex overflow-hidden">
      {/* Sidebar */}
      <DashboardSidebar
        userName={user.name}
        userEmail={user.email}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content */}
      <main
        className={`flex-1 overflow-x-hidden ${sidebarCollapsed ? 'ml-20' : 'ml-72'}`}
        style={{ transition: 'margin-left 400ms cubic-bezier(0.4, 0, 0.2, 1)' }}
      >
        {children}
      </main>
    </div>
  );
}
