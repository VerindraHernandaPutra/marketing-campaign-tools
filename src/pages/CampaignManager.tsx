import React, { useState } from 'react';
// 'ColorScheme' dihapus dari import
import { MantineProvider, Flex, Container, Title, Box } from '@mantine/core';
import { useColorScheme } from '@mantine/hooks';
import DashboardHeader from '../components/Dashboard/DashboardHeader';
import DashboardSidebar from '../components/Dashboard/DashboardSidebar';
import CampaignForm from '../components/CampaignManager/CampaignForm';
import CampaignList from '../components/CampaignManager/CampaignList';
import '@mantine/core/styles.css';

const CampaignManager: React.FC = () => {
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
          <Box className="flex-1 p-8">
            <Container size="xl">
              <Title order={2} mb="xl">
                Campaign Manager
              </Title>
              <CampaignForm />
              <CampaignList />
            </Container>
          </Box>
        </Flex>
      </div>
    </MantineProvider>;
};

export default CampaignManager;