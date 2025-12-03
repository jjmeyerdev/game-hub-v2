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
    <div className="min-h-screen bg-void flex">
      {/* Sidebar */}
      <DashboardSidebar
        userName={user.name}
        userEmail={user.email}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-500 ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        {children}
      </main>
    </div>
  );
}
