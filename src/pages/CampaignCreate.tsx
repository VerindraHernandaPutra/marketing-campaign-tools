import React from 'react';
import { Flex, Container, Title, Box, Button, Group } from '@mantine/core';
import { useNavigate, useParams } from 'react-router-dom'; // Added useParams
import { ArrowLeft } from 'lucide-react';
import DashboardHeader from '../components/Dashboard/DashboardHeader';
import DashboardSidebar from '../components/Dashboard/DashboardSidebar';
import CampaignForm from '../components/CampaignManager/CampaignForm';
const CampaignCreate: React.FC = () => {
  const navigate = useNavigate();
  const { campaignId } = useParams(); // Get ID if editing

  return (
    <div className="w-full min-h-screen bg-white dark:bg-gray-900">
      <DashboardHeader />
        <Flex>
          <DashboardSidebar />
          <Box component="main" className="flex-1 p-8">
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
  );
};

export default CampaignCreate;