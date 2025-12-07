import React, { useState } from 'react';
import { 
  MantineProvider, 
  Flex, 
  Container, 
  Title, 
  Box, 
  Grid, 
  Select, 
  Group, 
  Button, 
  Paper, 
  Text, 
  Loader,
  Alert 
} from '@mantine/core';
import { useColorScheme } from '@mantine/hooks';
import { SparklesIcon, InfoIcon } from 'lucide-react';
import DashboardHeader from '../components/Dashboard/DashboardHeader';
import DashboardSidebar from '../components/Dashboard/DashboardSidebar';
import MetricsCard from '../components/Analytics/MetricsCard';
import EngagementChart from '../components/Analytics/EngagementChart';
import PlatformBreakdown from '../components/Analytics/PlatformBreakdown';
import CampaignPerformance from '../components/Analytics/CampaignPerformance';
import { supabase } from '../supabaseClient';
import '@mantine/core/styles.css';

// Define specific type for trend direction to match MetricsCard props
type TrendDirection = 'up' | 'down';

const Analytics: React.FC = () => {
  const preferredColorScheme = useColorScheme();
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>(preferredColorScheme);
  const [timeRange, setTimeRange] = useState<string | null>('7d');
  
  // AI Summary State
  const [summary, setSummary] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);

  const toggleColorScheme = (value?: 'light' | 'dark') => 
    setColorScheme(value || (colorScheme === 'dark' ? 'light' : 'dark'));

  // --- CENTRALIZED DUMMY DATA ---
  // We keep this in state/variable so we can send it to the AI
  const analyticsData = {
    period: timeRange,
    overview: {
      reach: { value: "125,430", change: 12.5, trend: "up" as TrendDirection },
      engagement: { value: "8,942", change: 8.2, trend: "up" as TrendDirection },
      clicks: { value: "3,284", change: -2.4, trend: "down" as TrendDirection },
      conversions: { value: "412", change: 15.8, trend: "up" as TrendDirection }
    },
    topCampaigns: [
      { name: "Summer Sale Campaign", performance: "85%" },
      { name: "Product Launch", performance: "72%" }
    ],
    platformDistribution: {
      facebook: "35%",
      instagram: "28%",
      twitter: "18%"
    }
  };

  const handleGenerateSummary = async () => {
    setIsSummarizing(true);
    try {
      const { data, error } = await supabase.functions.invoke('summarize-analytics', {
        body: { analyticsData } 
      });

      if (error) throw error;
      
      if (data && data.summary) {
        setSummary(data.summary);
      }
    } catch (err) {
      console.error("AI Summary failed:", err);
      alert('Failed to generate summary. Make sure the Edge Function is deployed.');
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <MantineProvider theme={{}} forceColorScheme={colorScheme}>
      <div className="w-full min-h-screen bg-white dark:bg-gray-900">
        <DashboardHeader colorScheme={colorScheme} toggleColorScheme={toggleColorScheme} />
        
        <Flex>
          <DashboardSidebar />
          
          <Box className="flex-1 p-8 bg-gray-50 dark:bg-gray-900">
            <Container size="xl">
              <Group justify="space-between" mb="xl">
                <Title order={2}>Analytics Dashboard</Title>
                
                <Group>
                   <Button 
                        leftSection={isSummarizing ? <Loader size={16} color="white" /> : <SparklesIcon size={16} />} 
                        variant="gradient" 
                        gradient={{ from: 'violet', to: 'cyan' }}
                        onClick={handleGenerateSummary}
                        disabled={isSummarizing}
                    >
                        {isSummarizing ? 'Analyzing Data...' : 'AI Insight Summary'}
                    </Button>

                    <Select 
                        value={timeRange} 
                        onChange={setTimeRange} 
                        data={[
                            { value: '7d', label: 'Last 7 days' },
                            { value: '30d', label: 'Last 30 days' },
                            { value: '90d', label: 'Last 90 days' },
                            { value: '1y', label: 'Last year' }
                        ]} 
                        w={150} 
                    />
                </Group>
              </Group>

              {/* AI Summary Section */}
              {summary && (
                <Paper p="lg" radius="md" withBorder mb="xl" className="bg-gradient-to-r from-violet-50 to-blue-50 dark:from-violet-900/20 dark:to-blue-900/20 border-violet-200 dark:border-violet-800">
                    <Group align="flex-start" wrap="nowrap">
                        <SparklesIcon size={24} className="text-violet-600 mt-1 flex-shrink-0" />
                        <div>
                            <Text fw={700} size="sm" c="violet" mb={4}>AI PERFORMANCE ANALYSIS</Text>
                            <Text size="sm" style={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>{summary}</Text>
                        </div>
                    </Group>
                </Paper>
              )}

              <Grid gutter="lg">
                <Grid.Col span={3}>
                  <MetricsCard 
                    title="Total Reach" 
                    value={analyticsData.overview.reach.value} 
                    change={analyticsData.overview.reach.change} 
                    trend={analyticsData.overview.reach.trend} 
                  />
                </Grid.Col>
                <Grid.Col span={3}>
                  <MetricsCard 
                    title="Engagement" 
                    value={analyticsData.overview.engagement.value} 
                    change={analyticsData.overview.engagement.change} 
                    trend={analyticsData.overview.engagement.trend} 
                  />
                </Grid.Col>
                <Grid.Col span={3}>
                  <MetricsCard 
                    title="Clicks" 
                    value={analyticsData.overview.clicks.value} 
                    change={analyticsData.overview.clicks.change} 
                    trend={analyticsData.overview.clicks.trend} 
                  />
                </Grid.Col>
                <Grid.Col span={3}>
                  <MetricsCard 
                    title="Conversions" 
                    value={analyticsData.overview.conversions.value} 
                    change={analyticsData.overview.conversions.change} 
                    trend={analyticsData.overview.conversions.trend} 
                  />
                </Grid.Col>

                {/* Charts Section */}
                <Grid.Col span={8}>
                  <EngagementChart />
                </Grid.Col>
                <Grid.Col span={4}>
                  <PlatformBreakdown />
                </Grid.Col>
                
                {/* Tables */}
                <Grid.Col span={12}>
                  <CampaignPerformance />
                </Grid.Col>
              </Grid>

              {!summary && !isSummarizing && (
                 <Alert variant="light" color="blue" title="Pro Tip" icon={<InfoIcon size={16}/>} mt="xl">
                    Click the "AI Insight Summary" button to have AI analyze these numbers and give you a strategy report.
                 </Alert>
              )}

            </Container>
          </Box>
        </Flex>
      </div>
    </MantineProvider>
  );
};

export default Analytics;