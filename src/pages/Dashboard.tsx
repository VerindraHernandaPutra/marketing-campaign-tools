import React, { useState } from 'react';
import { MantineProvider } from '@mantine/core';
import { useColorScheme } from '@mantine/hooks';
import DashboardHeader from '../components/Dashboard/DashboardHeader';
import DashboardSidebar from '../components/Dashboard/DashboardSidebar';
import GlobalDashboard from '../components/Dashboard/GlobalDashboard';
import '@mantine/core/styles.css';

const Dashboard: React.FC = () => {
  const preferredColorScheme = useColorScheme();
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>(preferredColorScheme);
  const [collapsed, setCollapsed] = useState(false);

  const toggleColorScheme = (value?: 'light' | 'dark') =>
    setColorScheme(value || (colorScheme === 'dark' ? 'light' : 'dark'));

  return (
    <MantineProvider theme={{}} forceColorScheme={colorScheme}>
      {/* App shell: sidebar (full height left) + right column (header + content) */}
      <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f9fafb' }}>
        {/* Sidebar — full height, never cut */}
        <DashboardSidebar collapsed={collapsed} />

        {/* Right column: header on top, scrollable content below */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <DashboardHeader
            colorScheme={colorScheme}
            toggleColorScheme={toggleColorScheme}
            onToggleSidebar={() => setCollapsed(c => !c)}
          />
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <GlobalDashboard />
          </div>
        </div>
      </div>
    </MantineProvider>
  );
};

export default Dashboard;