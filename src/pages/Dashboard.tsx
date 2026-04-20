import React, { useState } from 'react';
import DashboardHeader from '../components/Dashboard/DashboardHeader';
import DashboardSidebar from '../components/Dashboard/DashboardSidebar';
import GlobalDashboard from '../components/Dashboard/GlobalDashboard';

const Dashboard: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Sidebar — full height, never cut */}
      <DashboardSidebar collapsed={collapsed} />

      {/* Right column: header on top, scrollable content below */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <DashboardHeader
          onToggleSidebar={() => setCollapsed(c => !c)}
        />
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <GlobalDashboard />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;