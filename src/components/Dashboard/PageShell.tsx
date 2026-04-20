/**
 * PageShell - Shared layout wrapper for all non-Dashboard pages.
 * Uses the same app-shell layout: sidebar full height left, header+content right.
 */
import React, { useState } from 'react';
import DashboardHeader from '../Dashboard/DashboardHeader';
import DashboardSidebar from '../Dashboard/DashboardSidebar';

interface PageShellProps {
  children: React.ReactNode;
  noPadding?: boolean;
}

const PageShell: React.FC<PageShellProps> = ({ children, noPadding = false }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{ display: 'flex', height: '100vh' }} className="bg-white dark:bg-gray-900">
      {/* Sidebar — full height, always visible */}
      <DashboardSidebar collapsed={collapsed} />

      {/* Right column: sticky header + scrollable content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <DashboardHeader
          onToggleSidebar={() => setCollapsed(c => !c)}
        />
        <div style={{ flex: 1, overflowY: 'auto', padding: noPadding ? '0' : '32px' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default PageShell;