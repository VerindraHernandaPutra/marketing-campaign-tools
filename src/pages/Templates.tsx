import React, { useState, useEffect, useCallback } from 'react';
import { 
  MantineProvider, Flex, Container, Title, Box, TextInput, 
  SimpleGrid, Button, Group, Loader, Text, Center 
} from '@mantine/core';
import { useColorScheme } from '@mantine/hooks';
import DashboardHeader from '../components/Dashboard/DashboardHeader';
import DashboardSidebar from '../components/Dashboard/DashboardSidebar';
import DesignCard from '../components/Dashboard/DesignCard';
import { SearchIcon, PlusIcon } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useUserRole } from '../auth/UserContext';
import { useAuth } from '../auth/useAuth';
import { useNavigate } from 'react-router-dom';
import '@mantine/core/styles.css';

// Define the shape of our Template (Project)
interface ProjectTemplate {
  id: string;
  title: string;
  thumbnail_url: string | null;
  updated_at: string | null;
  canvas_data: unknown;
  is_template: boolean;
  organization_id: string;
}

const Templates: React.FC = () => {
  const { user } = useAuth();
  const { role, currentOrgId, isSuperAdmin } = useUserRole();
  const navigate = useNavigate();
  
  const preferredColorScheme = useColorScheme();
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>(preferredColorScheme);
  const toggleColorScheme = (value?: 'light' | 'dark') => setColorScheme(value || (colorScheme === 'dark' ? 'light' : 'dark'));

  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Operator Permission Check
  const canManageTemplates = isSuperAdmin || role === 'operator';

  const fetchTemplates = useCallback(async () => {
    if (!currentOrgId) return;
    setLoading(true);

    let query = supabase
      .from('projects')
      .select('*')
      .eq('is_template', true)
      .eq('organization_id', currentOrgId) // Filter by Organization
      .order('updated_at', { ascending: false });

    if (searchQuery) {
      query = query.ilike('title', `%${searchQuery}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching templates:', error);
    } else {
      setTemplates(data as ProjectTemplate[]);
    }
    setLoading(false);
  }, [currentOrgId, searchQuery]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleCreateTemplate = async () => {
    if (!user || !currentOrgId) return;
    
    // Create a new blank project explicitly marked as a template
    const { data, error } = await supabase
      .from('projects')
      .insert({
        title: 'Untitled Template',
        user_id: user.id,
        organization_id: currentOrgId,
        is_template: true, // This makes it a template
        canvas_data: {
          version: "5.3.0",
          width: 1080,
          height: 1080,
          backgroundColor: '#ffffff',
          objects: []
        }
      })
      .select()
      .single();

    if (data) {
      navigate(`/editor/${data.id}`);
    } else if (error) {
      alert("Error creating template: " + error.message);
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
              <Group justify="space-between" mb="xl">
                <div>
                  <Title order={2}>Templates</Title>
                  <Text c="dimmed">
                    {canManageTemplates 
                      ? "Manage organization templates" 
                      : "Choose a template to start your design"}
                  </Text>
                </div>
                
                {/* Only Operators can create new templates */}
                {canManageTemplates && (
                  <Button 
                    leftSection={<PlusIcon size={16} />} 
                    onClick={handleCreateTemplate}
                    color="grape"
                  >
                    Create Template
                  </Button>
                )}
              </Group>

              <TextInput 
                placeholder="Search templates..." 
                leftSection={<SearchIcon size={16} />} 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.currentTarget.value)} 
                w={300} 
                mb="lg" 
              />

              {loading ? (
                <Center h={200}><Loader /></Center>
              ) : (
                <>
                  {templates.length === 0 ? (
                    <Text c="dimmed" ta="center" mt="xl">No templates found.</Text>
                  ) : (
                    <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="lg">
                      {templates.map(template => (
                        <DesignCard 
                          key={template.id} 
                          design={{
                            id: template.id,
                            title: template.title,
                            thumbnail: template.thumbnail_url || '',
                            updated_at: template.updated_at,
                            canvas_data: template.canvas_data
                          }}
                          isTemplate={true} 
                          onRefresh={fetchTemplates}
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

export default Templates;