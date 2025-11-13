import React, { useState, useEffect } from 'react';
import { MantineProvider, Flex, Container, Title, Box, Group, Button, TextInput, Select, SegmentedControl, SimpleGrid, Center, Loader } from '@mantine/core';
import { useColorScheme } from '@mantine/hooks';
import DashboardHeader from '../components/Dashboard/DashboardHeader';
import DashboardSidebar from '../components/Dashboard/DashboardSidebar';
import DesignCard from '../components/Dashboard/DesignCard';
import { PlusIcon, SearchIcon, GridIcon, ListIcon } from 'lucide-react';
import '@mantine/core/styles.css';
import { supabase } from '../supabaseClient';

export type Project = {
  id: string;
  user_id: string;
  title: string;
  canvas_data: unknown; // Using 'unknown' is safer than 'any' when the type is not needed.
  thumbnail_url: string | null;
  created_at: string | null;
  updated_at: string | null;
};

const Projects: React.FC = () => {
  const preferredColorScheme = useColorScheme();
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>(preferredColorScheme);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const toggleColorScheme = (value?: 'light' | 'dark') => setColorScheme(value || (colorScheme === 'dark' ? 'light' : 'dark'));
  
  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false }); 

      if (error) {
        console.error('Error fetching projects:', error);
      } else if (data) {
        setProjects(data);
      }
      setLoading(false);
    };

    fetchProjects();
  }, []);
  
  return <MantineProvider theme={{}} forceColorScheme={colorScheme}>
      <div className="w-full min-h-screen bg-white dark:bg-gray-900">
        <DashboardHeader colorScheme={colorScheme} toggleColorScheme={toggleColorScheme} />
        <Flex>
          <DashboardSidebar />
          <Box className="flex-1 p-8">
            <Container size="xl">
              {/* ... (Group with Title and Button) ... */}
              <Group justify="space-between" mb="xl">
                <Title order={2}>All Projects</Title>
                <Button leftSection={<PlusIcon size={16} />} color="blue">
                  New Project
                </Button>
              </Group>

              {/* ... (Group with Search and Filters) ... */}
              <Group justify="space-between" mb="lg">
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

              {/* FIX 3: Add the loading check here */}
              {loading ? (
                <Center mt="xl">
                  <Loader />
                </Center>
              ) : (
                <SimpleGrid 
                  cols={{ 
                    base: viewMode === 'grid' ? 2 : 1, 
                    sm: viewMode === 'grid' ? 3 : 1, 
                    md: viewMode === 'grid' ? 4 : 1 
                  }} 
                  spacing="lg"
                >
                  {projects.map(project => (
                    <DesignCard 
                      key={project.id} 
                      design={{
                        id: project.id,
                        title: project.title,
                        thumbnail: project.thumbnail_url || 'https://images.unsplash.com/photo-1618005182384-a83a-8bd57fbe?w=400',
                        updated_at: project.updated_at
                      }} 
                    />
                  ))}
                </SimpleGrid>
              )}
            </Container>
          </Box>
        </Flex>
      </div>
    </MantineProvider>;
};

export default Projects;