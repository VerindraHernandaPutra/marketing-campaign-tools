import React, { useState } from 'react';
import { MantineProvider, Flex, Container, Title, Box, Button, Group } from '@mantine/core';
import { useColorScheme } from '@mantine/hooks';
import { useNavigate, useParams } from 'react-router-dom'; // Added useParams
import { ArrowLeft } from 'lucide-react';
import DashboardHeader from '../components/Dashboard/DashboardHeader';
import DashboardSidebar from '../components/Dashboard/DashboardSidebar';
import CampaignForm from '../components/CampaignManager/CampaignForm';
import '@mantine/core/styles.css';

const CampaignCreate: React.FC = () => {
  const preferredColorScheme = useColorScheme();
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>(preferredColorScheme);
  const toggleColorScheme = (value?: 'light' | 'dark') => setColorScheme(value || (colorScheme === 'dark' ? 'light' : 'dark'));
  const navigate = useNavigate();
  const { campaignId } = useParams(); // Get ID if editing

  return (
    <MantineProvider theme={{}} forceColorScheme={colorScheme}>
      <div className="w-full min-h-screen bg-white dark:bg-gray-900">
        <DashboardHeader colorScheme={colorScheme} toggleColorScheme={toggleColorScheme} />
        <Flex>
          <DashboardSidebar />
          <Box className="flex-1 p-8">
            <Container size="xl">
              <Group mb="lg">
                <Button variant="subtle" size="sm" leftSection={<ArrowLeft size={16} />} onClick={() => navigate('/campaign-manager')}>
                  Back to Campaigns
                </Button>
              </Group>
              <Title order={2} mb="xl">
                {campaignId ? 'Edit Campaign' : 'Create New Campaign'}
              </Title>
              
              {/* Input Form */}
              <CampaignForm />
            </Container>
          </Box>
        </Flex>
      </div>
    </MantineProvider>
  );
};

export default CampaignCreate;