import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Container, 
  Title, 
  Box, 
  Grid, 
  Select, 
  Group, 
  Button, 
  Paper, 
  Text, 
  ThemeIcon,
  Tabs
} from '@mantine/core';
import { SparklesIcon, RefreshCw, Mail, LayoutDashboard, Share2, MessageCircle } from 'lucide-react';
import PageShell from '../components/Dashboard/PageShell';
import MetricsCard from '../components/Analytics/MetricsCard';
import EngagementChart from '../components/Analytics/EngagementChart';
import PlatformBreakdown from '../components/Analytics/PlatformBreakdown';
import CampaignPerformance from '../components/Analytics/CampaignPerformance';
import EmailPerformance from '../components/Analytics/EmailPerformance';
import WhatsAppPerformance from '../components/Analytics/WhatsAppPerformance';
import { supabase } from '../supabaseClient';
import { useUserRole } from '../auth/UserContext';

type TrendDirection = 'up' | 'down';

interface AnalyticsOverviewResponse {
  overview: {
    reach: number;
    engagement: number;
    clicks: number;
    conversions: number;
  };
  platformDistribution: { name: string; value: number }[];
  engagementSeries: { date: string; reach: number; engagement: number; clicks: number }[];
  campaignMetrics: {
    id: string;
    name: string;
    platforms?: string[];
    reach: number;
    engagement: number;
    clicks: number;
    conversions: number;
    likes?: number;
    comments?: number;
    shares?: number;
    hasPlatformErrors?: boolean;
    errorCount?: number;
    lastError?: string | null;
    performance: number;
  }[];
  emailStats: {
    total: number;
    delivered: number;
    sent: number;
    bounced: number;
    opened: number;
    clicked: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recent_emails: any[];
  };
  whatsappStats?: {
    total: number;
    sent: number;
    inProgress: number;
    failed: number;
    received: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recent_messages: any[];
  };
  socialMeta?: {
    lastSyncedAt?: string | null;
    totalPosts?: number;
    failedPosts?: number;
    partialFailedPosts?: number;
  };
}

const Analytics: React.FC = () => {
  const { currentOrgId } = useUserRole();
  const [timeRange, setTimeRange] = useState<string | null>('7d');
  
  const [summary, setSummary] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);

  const { data: analyticsData, isLoading: loadingAnalytics, refetch: refetchAnalytics } = useQuery<AnalyticsOverviewResponse | null>({
    queryKey: ['analyticsOverview', currentOrgId, timeRange],
    enabled: !!currentOrgId,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('analytics-overview', {
        body: {
          organizationId: currentOrgId,
          timeRange: timeRange || '7d',
        },
      });
      if (error) throw error;
      return data || null;
    },
  });

  const emailStats = analyticsData?.emailStats || null;
  const whatsappStats = analyticsData?.whatsappStats || null;
  const socialMeta = analyticsData?.socialMeta || null;

  const { overview, platformData, campaignData, engagementData, metaCampaigns, whatsappCampaigns } = useMemo(() => {
      const overviewData = {
          reach: { value: (analyticsData?.overview.reach || 0).toLocaleString(), change: 0, trend: 'up' as TrendDirection },
          engagement: { value: (analyticsData?.overview.engagement || 0).toLocaleString(), change: 0, trend: 'up' as TrendDirection },
          clicks: { value: (analyticsData?.overview.clicks || 0).toLocaleString(), change: 0, trend: 'up' as TrendDirection },
          conversions: { value: String(analyticsData?.overview.conversions || 0), change: 0, trend: 'up' as TrendDirection }
      };

      const pData = analyticsData?.platformDistribution && analyticsData.platformDistribution.length > 0
        ? analyticsData.platformDistribution
        : [{ name: 'No Data', value: 1 }];

      const cData = analyticsData?.campaignMetrics || [];
      const eData = analyticsData?.engagementSeries || [];
      const metaCampaigns = cData.filter((campaign) => campaign.platforms?.some((platform) => ['facebook', 'instagram'].includes(String(platform).toLowerCase())));
      const whatsappCampaigns = cData.filter((campaign) => campaign.platforms?.some((platform) => String(platform).toLowerCase() === 'whatsapp'));

      return { overview: overviewData, platformData: pData, campaignData: cData, engagementData: eData, metaCampaigns, whatsappCampaigns };
  }, [analyticsData]);

  const handleGenerateSummary = async () => {
    setIsSummarizing(true);
    try {
      const analyticsPayload = analyticsData || {
        period: timeRange,
        overview,
        platformDistribution: platformData,
        campaignMetrics: campaignData,
      };
      const { data, error } = await supabase.functions.invoke('summarize-analytics', {
        body: { analyticsData: analyticsPayload, emailStats } 
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
    <PageShell>
      <Container size="xl" p={0}>
              <Group justify="space-between" mb="xl">
                <Title order={2}>Marketing Analytics</Title>
                <Group>
                   <Button variant="default" leftSection={<RefreshCw size={16} />} onClick={() => refetchAnalytics()} loading={loadingAnalytics}>
                       Refresh
                   </Button>
                   <Select 
                       value={timeRange} 
                       onChange={setTimeRange} 
                       data={[{ value: '7d', label: 'Last 7 days' }, { value: '30d', label: 'Last 30 days' }]} 
                       w={150} 
                   />
                </Group>
              </Group>

              {/* AI Summary Banner */}
              <Paper p="xl" radius="lg" mb="xl" style={{ 
                  background: 'linear-gradient(135deg, var(--mantine-color-violet-9) 0%, var(--mantine-color-grape-7) 100%)',
                  boxShadow: '0 10px 30px -10px rgba(132, 94, 247, 0.4)',
                  color: 'white'
              }}>
                  <Group justify="space-between" align="center">
                    <Group gap="lg">
                        <ThemeIcon size={56} radius="xl" variant="white" color="violet">
                            <SparklesIcon size={32} />
                        </ThemeIcon>
                        <div>
                            <Text fw={800} size="xl" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>AI Marketing Strategist</Text>
                            <Text size="sm" opacity={0.9} mt={4}>Unlock deep, actionable insights generated instantly from your real campaign data.</Text>
                        </div>
                    </Group>
                    <Button 
                        variant="white" 
                        color="violet" 
                        onClick={handleGenerateSummary} 
                        loading={isSummarizing} 
                        size="md"
                        radius="xl"
                        fw={700}
                        leftSection={<SparklesIcon size={16} />}
                        style={{ boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
                        className="transition-transform hover:scale-105"
                    >
                        {summary ? 'Regenerate Analysis' : 'Generate Analysis'}
                    </Button>
                  </Group>
                  {summary && (
                      <Box mt="xl" p="md" style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
                          <Text size="sm" style={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>{summary}</Text>
                      </Box>
                  )}
              </Paper>

              <Tabs defaultValue="email" variant="pills" radius="md" mb="xl">
                <Tabs.List mb="lg">
                    <Tabs.Tab value="email" leftSection={<Mail size={16}/>}>Email Marketing</Tabs.Tab>
                    <Tabs.Tab value="meta" leftSection={<Share2 size={16}/>}>Meta Social</Tabs.Tab>
                    <Tabs.Tab value="whatsapp" leftSection={<MessageCircle size={16}/>}>WhatsApp</Tabs.Tab>
                    <Tabs.Tab value="overview" leftSection={<LayoutDashboard size={16}/>}>Web & Overview</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="email">
                    <Box mb="md">
                         <Group mb="lg">
                            <ThemeIcon color="grape" variant="light" size="xl" radius="md"><Mail size={24}/></ThemeIcon>
                            <div>
                                <Title order={4}>Email Campaigns (Resend)</Title>
                                <Text size="sm" c="dimmed">Filtered analytics from tracked campaign events</Text>
                            </div>
                        </Group>
                        <EmailPerformance stats={emailStats} loading={loadingAnalytics} />
                    </Box>
                </Tabs.Panel>

                 <Tabs.Panel value="meta">
                     <Box mb="md">
                        <Text size="sm" c="dimmed">
                          Meta Social is for Facebook and Instagram publishing only. It can track reach, engagement, clicks, likes, comments, and shares when Meta returns them for the published post.
                        </Text>
                        <Group gap="md" mt={8}>
                          <Text size="xs" c="dimmed">
                            Last synced: {socialMeta?.lastSyncedAt ? new Date(socialMeta.lastSyncedAt).toLocaleString() : 'No sync yet'}
                          </Text>
                          {(socialMeta?.failedPosts || 0) > 0 && (
                            <Text size="xs" c="red.6">Failed posts: {socialMeta?.failedPosts}</Text>
                          )}
                          {(socialMeta?.partialFailedPosts || 0) > 0 && (
                            <Text size="xs" c="orange.6">Partial failures: {socialMeta?.partialFailedPosts}</Text>
                          )}
                        </Group>
                     </Box>
                     <Grid><Grid.Col span={12}><CampaignPerformance campaigns={metaCampaigns} /></Grid.Col></Grid>
                 </Tabs.Panel>

                 <Tabs.Panel value="whatsapp">
                     <Box mb="md">
                        <Text size="sm" c="dimmed">
                          WhatsApp uses Meta Cloud API delivery stats and inbox activity. Sent, pending, failed, and received counts are split here so it does not mix with Meta social publishing.
                        </Text>
                     </Box>
                     <WhatsAppPerformance stats={whatsappStats} loading={loadingAnalytics} campaigns={whatsappCampaigns} />
                 </Tabs.Panel>
                 
                 <Tabs.Panel value="overview">
                    <Grid gutter="lg">
                        <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
                            <MetricsCard title="Total Reach" value={overview.reach.value} change={overview.reach.change} trend={overview.reach.trend} />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
                            <MetricsCard title="Total Engagement" value={overview.engagement.value} change={overview.engagement.change} trend={overview.engagement.trend} />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
                            <MetricsCard title="Total Clicks" value={overview.clicks.value} change={overview.clicks.change} trend={overview.clicks.trend} />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
                            <MetricsCard title="Conversions" value={overview.conversions.value} change={overview.conversions.change} trend={overview.conversions.trend} />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, lg: 8 }}><EngagementChart data={engagementData} /></Grid.Col>
                        <Grid.Col span={{ base: 12, lg: 4 }}><PlatformBreakdown data={platformData} /></Grid.Col>
                    </Grid>
                 </Tabs.Panel>
              </Tabs>
            </Container>
    </PageShell>
  );
};

export default Analytics;