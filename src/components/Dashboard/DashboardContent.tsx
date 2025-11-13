import React, { useState, useEffect } from 'react';
import { Container, Tabs, SimpleGrid, Title, Text, Box, Group, Button, Center, Loader } from '@mantine/core';
import { LayoutIcon, ImageIcon, FileTextIcon } from 'lucide-react';
import CreateNewCard from './CreateNewCard';
import DesignCard from './DesignCard';
import { supabase } from '../../supabaseClient';

// 1. Import the CanvasElement type
import { CanvasElement } from '../Layout/Canvas'; 

// 2. Update the Project type
type Project = {
  id: string;
  user_id: string;
  title: string;
  canvas_data: CanvasElement[] | null;
  thumbnail_url: string | null;
  created_at: string | null;
  updated_at: string | null;
};

const DashboardContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string | null>('recent');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // We leave the mock templates for now
  const templates = [{
    id: 't1',
    title: 'Instagram Story',
    thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400',
    category: 'Social Media'
  }, {
    id: 't2',
    title: 'Business Presentation',
    thumbnail: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=400',
    category: 'Presentation'
  }, {
    id: 't3',
    title: 'Event Poster',
    thumbnail: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400',
    category: 'Marketing'
  }, {
    id: 't4',
    title: 'Resume Template',
    thumbnail: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400',
    category: 'Document'
  }];

  useEffect(() => {
    const fetchRecentProjects = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false }) 
        .limit(4); 

      if (error) {
        console.error('Error fetching recent projects:', error);
      } else if (data) {
        setProjects(data);
      }
      setLoading(false);
    };

    if (activeTab === 'recent') {
      fetchRecentProjects();
    }
  }, [activeTab]); 

  return <Box className="py-8">
      <Container size="xl">
        <Box mb="xl">
          <Title order={2} mb="xs">
            Start creating
          </Title>
          <Text color="dimmed" size="sm" mb="lg">
            Choose a template or start from scratch
          </Text>
          <SimpleGrid 
            cols={{ base: 2, sm: 3, md: 5 }} 
            spacing="md"
          >
            <CreateNewCard icon={<LayoutIcon size={32} />} title="Custom Size" description="Create any design" />
            <CreateNewCard icon={<ImageIcon size={32} />} title="Instagram Post" description="1080 x 1080 px" />
            <CreateNewCard icon={<FileTextIcon size={32} />} title="Presentation" description="1920 x 1080 px" />
            <CreateNewCard icon={<LayoutIcon size={32} />} title="Flyer" description="A4 Portrait" />
            <CreateNewCard icon={<ImageIcon size={32} />} title="Logo" description="500 x 500 px" />
          </SimpleGrid>
        </Box>
        
        <Tabs value={activeTab} onChange={setActiveTab} className="mt-8">
          <Tabs.List>
            <Tabs.Tab value="recent">Recent designs</Tabs.Tab>
            <Tabs.Tab value="templates">Templates</Tabs.Tab>
            <Tabs.Tab value="folders">Folders</Tabs.Tab>
          </Tabs.List>
          
          <Tabs.Panel value="recent" pt="xl">
            <Group justify="space-between" mb="md">
              <Title order={3}>Your designs</Title>
              <Button variant="subtle" size="sm">
                View all
              </Button>
            </Group>
            
            {loading ? (
              <Center mt="xl" style={{ height: 100 }}>
                <Loader />
              </Center>
            ) : (
              <SimpleGrid 
                cols={{ base: 2, sm: 3, md: 4 }} 
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
          </Tabs.Panel>
          
          <Tabs.Panel value="templates" pt="xl">
            <Group justify="space-between" mb="md">
              <Title order={3}>Popular templates</Title>
              <Button variant="subtle" size="sm">
                View all
              </Button>
            </Group>
            <SimpleGrid 
              cols={{ base: 2, sm: 3, md: 4 }} 
              spacing="lg"
            >
              {templates.map(template => <DesignCard key={template.id} design={template} isTemplate />)}
            </SimpleGrid>
          </Tabs.Panel>
          <Tabs.Panel value="folders" pt="xl">
            <Box className="text-center py-12">
              <Text color="dimmed">No folders yet</Text>
              <Button variant="subtle" mt="md">
                Create your first folder
              </Button>
            </Box>
          </Tabs.Panel>
        </Tabs>
      </Container>
    </Box>;
};

export default DashboardContent;