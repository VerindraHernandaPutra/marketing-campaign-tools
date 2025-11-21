import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MantineProvider, Flex, Container, Title, Box, Group, Button, TextInput, Select, SegmentedControl, SimpleGrid, Center, Loader, Text } from '@mantine/core';
import { useColorScheme } from '@mantine/hooks';
import DashboardHeader from '../components/Dashboard/DashboardHeader';
import DashboardSidebar from '../components/Dashboard/DashboardSidebar';
import DesignCard from '../components/Dashboard/DesignCard';
import { PlusIcon, SearchIcon, GridIcon, ListIcon } from 'lucide-react';
import '@mantine/core/styles.css';
import { supabase } from '../supabaseClient';
import { useAuth } from '../auth/useAuth';
import { useNavigate } from 'react-router-dom';

export type Project = {
  id: string;
  user_id: string;
  title: string;
  canvas_data: unknown;
  thumbnail_url: string | null;
  created_at: string | null;
  updated_at: string | null;
};

const Projects: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const preferredColorScheme = useColorScheme();
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>(preferredColorScheme);
  
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string | null>('recent');
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const toggleColorScheme = (value?: 'light' | 'dark') => setColorScheme(value || (colorScheme === 'dark' ? 'light' : 'dark'));

  // FIX: Wrapped in useCallback to pass to DesignCard's onRefresh
  const fetchProjects = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    
    // Fetch all projects for this user
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
    } else if (data) {
      setProjects(data);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // FIX: Implement Search and Sort Logic
  const filteredProjects = useMemo(() => {
    let result = [...projects];

    // 1. Search Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => p.title?.toLowerCase().includes(query));
    }

    // 2. Sort Logic
    if (sortBy === 'name') {
      result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (sortBy === 'created') {
      result.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    } else {
      // Default: 'recent' (updated_at)
      result.sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime());
    }

    return result;
  }, [projects, searchQuery, sortBy]);

  const handleCreateNew = async () => {
     if (!user) return;
     // Create a default blank project
     const { data, error } = await supabase
      .from('projects')
      .insert({ 
        title: 'Untitled Project', 
        user_id: user.id,
        canvas_data: {
            width: 850,
            height: 500,
            backgroundColor: '#ffffff',
            objects: []
        } 
      })
      .select('id') 
      .single();

    if (data) {
        navigate(`/editor/${data.id}`);
    } else if (error) {
        alert("Error creating project: " + error.message);
    }
  };
  
  return (
    <MantineProvider theme={{}} forceColorScheme={colorScheme}>
      <div className="w-full min-h-screen bg-white dark:bg-gray-900">
        <DashboardHeader colorScheme={colorScheme} toggleColorScheme={toggleColorScheme} />
        <Flex>
          <DashboardSidebar />
          <Box className="flex-1 p-8">
            <Container size="xl">
              {/* Header Section */}
              <Group justify="space-between" mb="xl">
                <Title order={2}>All Projects</Title>
                <Button leftSection={<PlusIcon size={16} />} color="blue" onClick={handleCreateNew}>
                  New Project
                </Button>
              </Group>

              {/* Search and Filter Bar */}
              <Group justify="space-between" mb="lg">
                <TextInput 
                  placeholder="Search projects..." 
                  leftSection={<SearchIcon size={16} />} 
                  value={searchQuery} 
                  onChange={e => setSearchQuery(e.currentTarget.value)} 
                  w={300} 
                />
                <Group>
                  <Select 
                    value={sortBy} 
                    onChange={setSortBy} 
                    data={[
                      { value: 'recent', label: 'Recently edited' },
                      { value: 'name', label: 'Name (A-Z)' },
                      { value: 'created', label: 'Date created' }
                    ]} 
                    w={180} 
                  />
                  <SegmentedControl 
                    value={viewMode} 
                    onChange={setViewMode} 
                    data={[
                      { label: <GridIcon size={16} />, value: 'grid' },
                      { label: <ListIcon size={16} />, value: 'list' }
                    ]} 
                  />
                </Group>
              </Group>

              {/* Project Grid/List */}
              {loading ? (
                <Center mt="xl" h={200}>
                  <Loader color="blue" />
                </Center>
              ) : (
                <>
                  {filteredProjects.length === 0 ? (
                      <Center mt="xl" h={200}>
                          <Text c="dimmed">No projects found matching your search.</Text>
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
                        {filteredProjects.map(project => (
                          <DesignCard 
                            key={project.id} 
                            design={{
                              id: project.id,
                              title: project.title,
                              // FIX: Pass the actual thumbnail_url from Supabase
                              thumbnail: project.thumbnail_url || '', 
                              updated_at: project.updated_at,
                              canvas_data: project.canvas_data // Pass data for duplication
                            }}
                            // FIX: Pass refresh function so Delete/Duplicate updates this list
                            onRefresh={fetchProjects} 
                          />
                        ))}
                      </SimpleGrid>
                  )}
                </>
              )}
            </Container>
          </Box>
        </Flex>
      </div>
    </MantineProvider>
  );
};

export default Projects;