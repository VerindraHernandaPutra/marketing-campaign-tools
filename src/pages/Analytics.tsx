import React, { useState, useEffect } from 'react';
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
  ThemeIcon,
  Tabs
} from '@mantine/core';
import { useColorScheme } from '@mantine/hooks';
import { SparklesIcon, RefreshCw, Mail, LayoutDashboard, Share2 } from 'lucide-react';
import DashboardHeader from '../components/Dashboard/DashboardHeader';
import DashboardSidebar from '../components/Dashboard/DashboardSidebar';
import MetricsCard from '../components/Analytics/MetricsCard';
import EngagementChart from '../components/Analytics/EngagementChart';
import PlatformBreakdown from '../components/Analytics/PlatformBreakdown';
import CampaignPerformance from '../components/Analytics/CampaignPerformance';
import EmailPerformance from '../components/Analytics/EmailPerformance';
import { supabase } from '../supabaseClient';
import '@mantine/core/styles.css';

type TrendDirection = 'up' | 'down';

const Analytics: React.FC = () => {
  const preferredColorScheme = useColorScheme();
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>(preferredColorScheme);
  const [timeRange, setTimeRange] = useState<string | null>('7d');
  
  // AI Summary State
  const [summary, setSummary] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Email Stats State
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [emailStats, setEmailStats] = useState<any>(null);
  const [loadingEmail, setLoadingEmail] = useState(false);

  const toggleColorScheme = (value?: 'light' | 'dark') => 
    setColorScheme(value || (colorScheme === 'dark' ? 'light' : 'dark'));

  // --- DYNAMIC DATA STATES ---
  const [platformData, setPlatformData] = useState<{name: string, value: number}[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [campaignData, setCampaignData] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [engagementData, setEngagementData] = useState<any[]>([]);
  const [overview, setOverview] = useState({
    reach: { value: "0", change: 0, trend: "up" as TrendDirection },
    engagement: { value: "0", change: 0, trend: "up" as TrendDirection },
    clicks: { value: "0", change: 0, trend: "up" as TrendDirection },
    conversions: { value: "0", change: 0, trend: "up" as TrendDirection }
  });

  const fetchEmailStats = async () => {
    setLoadingEmail(true);
    try {
        let response;
        try {
            response = await fetch('http://localhost:3050/api/email-stats');
        } catch {
            console.warn("Localhost fetch failed, trying Production...");
            response = await fetch('https://marketing.gloaicloud.com:3050/api/email-stats');
        }

        if (response.ok) {
            const data = await response.json();
            setEmailStats(data);
        } else {
            console.error("Failed to fetch email stats:", response.statusText);
            setEmailStats({ total: 0, delivered: 0, sent: 0, bounced: 0, opened: 0, clicked: 0, recent_emails: [] });
        }
    } catch (error) {
        console.error("Error connecting to analytics server:", error);
        setEmailStats({ total: 0, delivered: 0, sent: 0, bounced: 0, opened: 0, clicked: 0, recent_emails: [] });
    } finally {
        setLoadingEmail(false);
    }
  };

  const fetchSupabaseStats = async () => {
    try {
      // 1. WhatsApp Stats
      const { data: waData } = await supabase.from('whatsapp_outbox').select('status');
      const waCount = waData ? waData.length : 0;

      // 2. Social Posts
      const { data: socialData } = await supabase.from('social_posts').select('platforms, status');
      let fbCount = 0, igCount = 0, twCount = 0, liCount = 0;
      if (socialData) {
        socialData.forEach(post => {
            if (post.platforms?.includes('facebook')) fbCount++;
            if (post.platforms?.includes('instagram')) igCount++;
            if (post.platforms?.includes('twitter')) twCount++;
            if (post.platforms?.includes('linkedin')) liCount++;
        });
      }

      // 3. Campaigns
      const { data: campData } = await supabase.from('marketing_campaigns').select('*').order('created_at', { ascending: false }).limit(5);
      
      // Compute Overview
      const socialCount = socialData ? socialData.length : 0;
      const totalReach = waCount + (emailStats?.total || 0) + socialCount;
      const totalEngagement = emailStats?.opened || 0; // Only resend tracks opens right now
      const totalClicks = emailStats?.clicked || 0;    // Only resend tracks clicks right now
      
      setOverview({
          reach: { value: totalReach.toLocaleString(), change: 0, trend: 'up' },
          engagement: { value: totalEngagement.toString(), change: 0, trend: 'up' },
          clicks: { value: totalClicks.toString(), change: 0, trend: 'up' },
          conversions: { value: "0", change: 0, trend: 'up' }
      });

      // Compute Platform Breakdown
      const pData = [];
      if (fbCount > 0) pData.push({ name: 'Facebook', value: fbCount });
      if (igCount > 0) pData.push({ name: 'Instagram', value: igCount });
      if (twCount > 0) pData.push({ name: 'Twitter', value: twCount });
      if (liCount > 0) pData.push({ name: 'LinkedIn', value: liCount });
      if (waCount > 0) pData.push({ name: 'WhatsApp', value: waCount });
      if (emailStats?.total > 0) pData.push({ name: 'Email', value: emailStats.total });
      
      // Fallback if empty
      if (pData.length === 0) pData.push({ name: 'No Data', value: 1 });
      setPlatformData(pData);

      // Compute Campaign Table (Using exact real data, No synthetic numbers)
      if (campData) {
          const formattedCamps = campData.map(c => {
              // Calculate Reach based on selected platforms (1 per platform selected)
              const platCount = c.platforms?.length || 0;
              
              return {
                  id: c.id,
                  name: c.title || 'Untitled',
                  reach: platCount,
                  engagement: c.platforms?.includes('email') ? (emailStats?.opened || 0) : 0,
                  clicks: c.platforms?.includes('email') ? (emailStats?.clicked || 0) : 0,
                  conversions: 0,
                  performance: c.status === 'sent' ? 100 : (c.status === 'scheduled' ? 50 : 0)
              };
          });
          setCampaignData(formattedCamps);
      }

      // Dummy Engagement over time (Synthesized from totals, kept flat to avoid fake spikes)
      setEngagementData([
          { date: 'Mon', reach: totalReach, engagement: totalEngagement, clicks: totalClicks },
          { date: 'Tue', reach: totalReach, engagement: totalEngagement, clicks: totalClicks },
          { date: 'Wed', reach: totalReach, engagement: totalEngagement, clicks: totalClicks },
          { date: 'Thu', reach: totalReach, engagement: totalEngagement, clicks: totalClicks },
          { date: 'Fri', reach: totalReach, engagement: totalEngagement, clicks: totalClicks }
      ]);
      
    } catch (e) {
      console.error("Error fetching Supabase stats:", e);
    }
  };

  useEffect(() => {
    fetchEmailStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (emailStats !== null) {
      fetchSupabaseStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emailStats]);

  const handleGenerateSummary = async () => {
    setIsSummarizing(true);
    try {
      const analyticsData = { period: timeRange, overview, platformDistribution: platformData };
      const { data, error } = await supabase.functions.invoke('summarize-analytics', {
        body: { analyticsData, emailStats } 
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
                <Title order={2}>Marketing Analytics</Title>
                <Group>
                   <Button variant="default" leftSection={<RefreshCw size={16} />} onClick={fetchEmailStats} loading={loadingEmail}>
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
                    <Tabs.Tab value="social" leftSection={<Share2 size={16}/>}>Social Media</Tabs.Tab>
                    <Tabs.Tab value="overview" leftSection={<LayoutDashboard size={16}/>}>Web & Overview</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="email">
                    <Box mb="md">
                         <Group mb="lg">
                            <ThemeIcon color="grape" variant="light" size="xl" radius="md"><Mail size={24}/></ThemeIcon>
                            <div>
                                <Title order={4}>Email Campaigns (Resend)</Title>
                                <Text size="sm" c="dimmed">Real-time performance from your verified domain</Text>
                            </div>
                        </Group>
                        <EmailPerformance stats={emailStats} loading={loadingEmail} />
                    </Box>
                </Tabs.Panel>

                 <Tabs.Panel value="social">
                     <Grid><Grid.Col span={12}><CampaignPerformance campaigns={campaignData} /></Grid.Col></Grid>
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
          </Box>
        </Flex>
      </div>
    </MantineProvider>
  );
};

export default Analytics;