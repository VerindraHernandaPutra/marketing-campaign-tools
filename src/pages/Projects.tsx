import React, { useState } from 'react';
// 'ColorScheme' dan 'Grid' dihapus dari import
import { MantineProvider, Flex, Container, Title, Box, Group, Button, TextInput, Select, SegmentedControl, SimpleGrid } from '@mantine/core';
import { useColorScheme } from '@mantine/hooks';
import DashboardHeader from '../components/Dashboard/DashboardHeader';
import DashboardSidebar from '../components/Dashboard/DashboardSidebar';
import DesignCard from '../components/Dashboard/DesignCard';
import { PlusIcon, SearchIcon, GridIcon, ListIcon } from 'lucide-react';
import '@mantine/core/styles.css';

const Projects: React.FC = () => {
  const preferredColorScheme = useColorScheme();
  // Tipe 'ColorScheme' diubah menjadi 'light' | 'dark'
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>(preferredColorScheme);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  // Tipe 'ColorScheme' diubah menjadi 'light' | 'dark'
  const toggleColorScheme = (value?: 'light' | 'dark') => setColorScheme(value || (colorScheme === 'dark' ? 'light' : 'dark'));
  const projects = [{
    id: '1',
    title: 'Brand Identity Project',
    thumbnail: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400',
    lastEdited: '2 hours ago',
    type: 'Branding'
  }, {
    id: '2',
    title: 'Social Media Campaign',
    thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400',
    lastEdited: '5 hours ago',
    type: 'Social Media'
  }, {
    id: '3',
    title: 'Marketing Materials',
    thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400',
    lastEdited: '1 day ago',
    type: 'Marketing'
  }, {
    id: '4',
    title: 'Product Presentation',
    thumbnail: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400',
    lastEdited: '2 days ago',
    type: 'Presentation'
  }, {
    id: '5',
    title: 'Website Graphics',
    thumbnail: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400',
    lastEdited: '3 days ago',
    type: 'Web Design'
  }, {
    id: '6',
    title: 'Print Collateral',
    thumbnail: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400',
    lastEdited: '1 week ago',
    type: 'Print'
  }];
  
  // 'theme', 'withGlobalStyles', dan 'withNormalizeCSS' diperbarui
  return <MantineProvider theme={{}} forceColorScheme={colorScheme}>
      <div className="w-full min-h-screen bg-white dark:bg-gray-900">
        <DashboardHeader colorScheme={colorScheme} toggleColorScheme={toggleColorScheme} />
        <Flex>
          <DashboardSidebar />
          <Box className="flex-1 p-8">
            <Container size="xl">
              {/* 'position' diubah menjadi 'justify' */}
              <Group justify="space-between" mb="xl">
                <Title order={2}>All Projects</Title>
                {/* 'leftIcon' diubah menjadi 'leftSection' */}
                <Button leftSection={<PlusIcon size={16} />} color="blue">
                  New Project
                </Button>
              </Group>
              {/* 'position' diubah menjadi 'justify' */}
              <Group justify="space-between" mb="lg">
                {/* 'icon' diubah menjadi 'leftSection' */}
                <TextInput placeholder="Search projects..." leftSection={<SearchIcon size={16} />} value={searchQuery} onChange={e => setSearchQuery(e.currentTarget.value)} w={300} />
                <Group>
                  <Select value={sortBy} onChange={value => setSortBy(value || 'recent')} data={[{
                  value: 'recent',
                  label: 'Recently edited'
                }, {
                  value: 'name',
                  label: 'Name'
                }, {
                  value: 'created',
                  label: 'Date created'
                }, {
                  value: 'type',
                  label: 'Type'
                }]} w={150} />
                  <SegmentedControl value={viewMode} onChange={setViewMode} data={[{
                  label: <GridIcon size={16} />,
                  value: 'grid'
                }, {
                  label: <ListIcon size={16} />,
                  value: 'list'
                }]} />
                </Group>
              </Group>
              {/* 'cols' dan 'breakpoints' diubah menjadi objek 'cols' v7 */}
              <SimpleGrid 
                cols={{ 
                  base: viewMode === 'grid' ? 2 : 1, 
                  sm: viewMode === 'grid' ? 3 : 1, 
                  md: viewMode === 'grid' ? 4 : 1 
                }} 
                spacing="lg"
              >
                {projects.map(project => <DesignCard key={project.id} design={project} />)}
              </SimpleGrid>
            </Container>
          </Box>
        </Flex>
      </div>
    </MantineProvider>;
};

export default Projects;