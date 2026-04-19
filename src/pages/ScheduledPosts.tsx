import React, { useState } from 'react';
import { MantineProvider, Flex, Container, Title, Box, Tabs, Group, Text, ThemeIcon, Button } from '@mantine/core';
import { useColorScheme } from '@mantine/hooks';
import { CalendarDaysIcon, ListIcon, PlusIcon, RocketIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardHeader from '../components/Dashboard/DashboardHeader';
import DashboardSidebar from '../components/Dashboard/DashboardSidebar';
import ScheduledCalendar from '../components/ScheduledPosts/ScheduledCalendar';
import ScheduledList from '../components/ScheduledPosts/ScheduledList';
import '@mantine/core/styles.css';

const ScheduledPosts: React.FC = () => {
  const preferredColorScheme = useColorScheme();
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>(preferredColorScheme);
  const [activeTab, setActiveTab] = useState<string | null>('history');
  const navigate = useNavigate();

  const toggleColorScheme = (value?: 'light' | 'dark') =>
    setColorScheme(value || (colorScheme === 'dark' ? 'light' : 'dark'));

  return (
    <MantineProvider theme={{}} forceColorScheme={colorScheme}>
      <div className="w-full min-h-screen bg-white dark:bg-gray-900">
        <DashboardHeader colorScheme={colorScheme} toggleColorScheme={toggleColorScheme} />
        <Flex>
          <DashboardSidebar />
          <Box className="flex-1 p-8">
            <Container size="xl">

              {/* Page Header */}
              <Group justify="space-between" mb="xl" align="flex-start">
                <Group gap="md">
                  <ThemeIcon size="xl" radius="md" variant="gradient" gradient={{ from: 'indigo', to: 'cyan' }}>
                    <RocketIcon size={22} />
                  </ThemeIcon>
                  <Box>
                    <Title order={2} lh={1}>Campaign Calendar</Title>
                    <Text size="sm" c="dimmed" mt={2}>
                      Track, review and manage all your past and upcoming campaigns
                    </Text>
                  </Box>
                </Group>
                <Button
                  leftSection={<PlusIcon size={16} />}
                  variant="gradient"
                  gradient={{ from: 'indigo', to: 'cyan' }}
                  onClick={() => navigate('/campaign-manager/new')}
                >
                  New Campaign
                </Button>
              </Group>

              {/* Tabs */}
              <Tabs value={activeTab} onChange={setActiveTab} variant="pills" radius="md">
                <Tabs.List mb="xl">
                  <Tabs.Tab
                    value="history"
                    leftSection={<ListIcon size={15} />}
                  >
                    History & All Campaigns
                  </Tabs.Tab>
                  <Tabs.Tab
                    value="calendar"
                    leftSection={<CalendarDaysIcon size={15} />}
                  >
                    Calendar View
                  </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="history">
                  <ScheduledList />
                </Tabs.Panel>

                <Tabs.Panel value="calendar">
                  <ScheduledCalendar />
                </Tabs.Panel>
              </Tabs>

            </Container>
          </Box>
        </Flex>
      </div>
    </MantineProvider>
  );
};

export default ScheduledPosts;