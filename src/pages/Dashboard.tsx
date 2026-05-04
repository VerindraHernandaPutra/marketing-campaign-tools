import React, { useState } from 'react';
import DashboardHeader from '../components/Dashboard/DashboardHeader';
import DashboardSidebar from '../components/Dashboard/DashboardSidebar';
import GlobalDashboard from '../components/Dashboard/GlobalDashboard';

const Dashboard: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f9fafb' }}>
      <a
        href="#main-content"
        style={{
          position: 'absolute', top: -48, left: 0, zIndex: 9999,
          padding: '10px 16px', background: '#4f46e5', color: 'white',
          borderRadius: '0 0 6px 0', fontWeight: 600, fontSize: '0.875rem',
          textDecoration: 'none', transition: 'top 0.15s',
        }}
        onFocus={(e) => (e.currentTarget.style.top = '0')}
        onBlur={(e) => (e.currentTarget.style.top = '-48px')}
      >
        Skip to content
      </a>

      {/* Sidebar — full height, never cut */}
      <DashboardSidebar collapsed={collapsed} />

      {/* Right column: header on top, scrollable content below */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <DashboardHeader
          onToggleSidebar={() => setCollapsed(c => !c)}
        />
        <main id="main-content" style={{ flex: 1, overflowY: 'auto' }}>
          <GlobalDashboard />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;