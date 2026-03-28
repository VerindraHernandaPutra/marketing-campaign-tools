/**
 * PageShell - Shared layout wrapper for all non-Dashboard pages.
 * Uses the same app-shell layout: sidebar full height left, header+content right.
 */
import React, { useState } from 'react';
import DashboardHeader from '../Dashboard/DashboardHeader';
import DashboardSidebar from '../Dashboard/DashboardSidebar';

interface PageShellProps {
  children: React.ReactNode;
}

const PageShell: React.FC<PageShellProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Sidebar — full height, always visible */}
      <DashboardSidebar collapsed={collapsed} />

      {/* Right column: sticky header + scrollable content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <DashboardHeader
          colorScheme="light"
          toggleColorScheme={() => {}}
          onToggleSidebar={() => setCollapsed(c => !c)}
        />
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default PageShell;
