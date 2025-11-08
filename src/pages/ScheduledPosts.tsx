import React, { useState } from 'react';
import { MantineProvider, ColorScheme, Flex, Container, Title, Box, Tabs } from '@mantine/core';
import { useColorScheme } from '@mantine/hooks';
import DashboardHeader from '../components/Dashboard/DashboardHeader';
import DashboardSidebar from '../components/Dashboard/DashboardSidebar';
import ScheduledCalendar from '../components/ScheduledPosts/ScheduledCalendar';
import ScheduledList from '../components/ScheduledPosts/ScheduledList';
import '@mantine/core/styles.css';
const ScheduledPosts: React.FC = () => {
  const preferredColorScheme = useColorScheme();
  const [colorScheme, setColorScheme] = useState<ColorScheme>(preferredColorScheme);
  const [activeTab, setActiveTab] = useState<string | null>('calendar');
  const toggleColorScheme = (value?: ColorScheme) => setColorScheme(value || (colorScheme === 'dark' ? 'light' : 'dark'));
  return <MantineProvider theme={{
    colorScheme
  }} withGlobalStyles withNormalizeCSS>
      <div className="w-full min-h-screen bg-white dark:bg-gray-900">
        <DashboardHeader colorScheme={colorScheme} toggleColorScheme={toggleColorScheme} />
        <Flex>
          <DashboardSidebar />
          <Box className="flex-1 p-8">
            <Container size="xl">
              <Title order={2} mb="xl">
                Scheduled Posts
              </Title>
              <Tabs value={activeTab} onTabChange={setActiveTab}>
                <Tabs.List>
                  <Tabs.Tab value="calendar">Calendar View</Tabs.Tab>
                  <Tabs.Tab value="list">List View</Tabs.Tab>
                </Tabs.List>
                <Tabs.Panel value="calendar" pt="xl">
                  <ScheduledCalendar />
                </Tabs.Panel>
                <Tabs.Panel value="list" pt="xl">
                  <ScheduledList />
                </Tabs.Panel>
              </Tabs>
            </Container>
          </Box>
        </Flex>
      </div>
    </MantineProvider>;
};
export default ScheduledPosts;