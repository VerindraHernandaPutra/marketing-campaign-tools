import React, { useState } from 'react';
// 'ColorScheme' dihapus
import { MantineProvider, Flex, Container, Title, Box, Grid, Select, Group } from '@mantine/core';
import { useColorScheme } from '@mantine/hooks';
import DashboardHeader from '../components/Dashboard/DashboardHeader';
import DashboardSidebar from '../components/Dashboard/DashboardSidebar';
import MetricsCard from '../components/Analytics/MetricsCard';
import EngagementChart from '../components/Analytics/EngagementChart';
import PlatformBreakdown from '../components/Analytics/PlatformBreakdown';
import CampaignPerformance from '../components/Analytics/CampaignPerformance';
import '@mantine/core/styles.css'; // Ini sudah menangani global styles

const Analytics: React.FC = () => {
  const preferredColorScheme = useColorScheme();
  // Tipe 'ColorScheme' diubah menjadi 'light' | 'dark'
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>(preferredColorScheme);
  const [timeRange, setTimeRange] = useState('7d');
  // Tipe 'ColorScheme' diubah menjadi 'light' | 'dark'
  const toggleColorScheme = (value?: 'light' | 'dark') => setColorScheme(value || (colorScheme === 'dark' ? 'light' : 'dark'));

  // 'withGlobalStyles' dan 'withNormalizeCSS' DIHAPUS
  return <MantineProvider theme={{}} forceColorScheme={colorScheme}>
      <div className="w-full min-h-screen bg-white dark:bg-gray-900">
        <DashboardHeader colorScheme={colorScheme} toggleColorScheme={toggleColorScheme} />
        <Flex>
          <DashboardSidebar />
          <Box className="flex-1 p-8">
            <Container size="xl">
              {/* 'position' diubah menjadi 'justify' */}
              <Group justify="space-between" mb="xl">
                <Title order={2}>Analytics Dashboard</Title>
                <Select value={timeRange} onChange={value => setTimeRange(value || '7d')} data={[{
                value: '7d',
                label: 'Last 7 days'
              }, {
                value: '30d',
                label: 'Last 30 days'
              }, {
                value: '90d',
                label: 'Last 90 days'
              }, {
                value: '1y',
                label: 'Last year'
              }]} w={150} />
              </Group>
              <Grid gutter="lg">
                <Grid.Col span={3}>
                  <MetricsCard title="Total Reach" value="125,430" change={12.5} trend="up" />
                </Grid.Col>
                <Grid.Col span={3}>
                  <MetricsCard title="Engagement" value="8,942" change={8.2} trend="up" />
                </Grid.Col>
                <Grid.Col span={3}>
                  <MetricsCard title="Clicks" value="3,284" change={-2.4} trend="down" />
                </Grid.Col>
                <Grid.Col span={3}>
                  <MetricsCard title="Conversions" value="412" change={15.8} trend="up" />
                </Grid.Col>
                <Grid.Col span={8}>
                  <EngagementChart />
                </Grid.Col>
                <Grid.Col span={4}>
                  <PlatformBreakdown />
                </Grid.Col>
                <Grid.Col span={12}>
                  <CampaignPerformance />
                </Grid.Col>
              </Grid>
            </Container>
          </Box>
        </Flex>
      </div>
    </MantineProvider>;
};

export default Analytics;