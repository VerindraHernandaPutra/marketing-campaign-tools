import React, { useState } from 'react';
// 'ColorScheme' dihapus dari import
import { MantineProvider, Flex } from '@mantine/core';
import { useColorScheme } from '@mantine/hooks';
import DashboardHeader from '../components/Dashboard/DashboardHeader';
import DashboardSidebar from '../components/Dashboard/DashboardSidebar';
import DashboardContent from '../components/Dashboard/DashboardContent';
import '@mantine/core/styles.css';

const Dashboard: React.FC = () => {
  const preferredColorScheme = useColorScheme();
  // Tipe 'ColorScheme' diubah menjadi 'light' | 'dark'
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>(preferredColorScheme);
  // Tipe 'ColorScheme' diubah menjadi 'light' | 'dark'
  const toggleColorScheme = (value?: 'light' | 'dark') => setColorScheme(value || (colorScheme === 'dark' ? 'light' : 'dark'));
  
  // 'theme', 'withGlobalStyles', dan 'withNormalizeCSS' diperbarui
  return <MantineProvider theme={{}} forceColorScheme={colorScheme}>
      <div className="w-full min-h-screen bg-white dark:bg-gray-900">
        <DashboardHeader colorScheme={colorScheme} toggleColorScheme={toggleColorScheme} />
        <Flex>
          <DashboardSidebar />
          <div className="flex-1">
            <DashboardContent />
          </div>
        </Flex>
      </div>
    </MantineProvider>;
};

export default Dashboard;