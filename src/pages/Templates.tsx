// [cite: src/pages/Templates.tsx]
import React, { useState, useEffect, useCallback } from 'react';
import { 
  MantineProvider, Flex, Container, Title, Box, TextInput, 
  SimpleGrid, Button, Group, Loader, Text, Center, ScrollArea, Chip,
  SegmentedControl, Tooltip, Modal, Stack, Paper, Table, Avatar, Badge, ActionIcon
} from '@mantine/core';
import { useColorScheme } from '@mantine/hooks';
import DashboardHeader from '../components/Dashboard/DashboardHeader';
import DashboardSidebar from '../components/Dashboard/DashboardSidebar';
import DesignCard from '../components/Dashboard/DesignCard';
import CreateNewCard from '../components/Dashboard/CreateNewCard';
import ConfirmationModal from '../components/Layout/ConfirmationModal';
import { 
  SearchIcon, PlusIcon, FilterIcon, GridIcon, ListIcon, 
  LayoutTemplateIcon, FileTextIcon, TrashIcon, EditIcon, 
  FacebookIcon, InstagramIcon, MailIcon, LayoutIcon 
} from 'lucide-react';
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
  canvas_data: { width?: number; height?: number; [key: string]: unknown };
  is_template: boolean;
  organization_id: string;
  tags?: string[] | null;
}

const TEMPLATE_TAGS = ['All', 'Social Media', 'Instagram', 'Facebook', 'Email', 'Business', 'Custom'];

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
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modal States
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [creationPreset, setCreationPreset] = useState<{width?: number, height?: number, title: string, tags: string[]} | null>(null);
  const [isCreationLoading, setIsCreationLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  // Operator Permission Check
  const isOperator = isSuperAdmin || role === 'operator';
  const canManageTemplates = isOperator;

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

    if (selectedTag !== 'All') {
      query = query.contains('tags', [selectedTag]);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching templates:', error);
    } else {
      setTemplates(data as ProjectTemplate[]);
    }
    setLoading(false);
  }, [currentOrgId, searchQuery, selectedTag]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // --- Creation Logic ---
  const handleCreateProject = async (
    width: number | undefined, 
    height: number | undefined, 
    title: string, 
    tags: string[], 
    isTemplate: boolean
  ) => {
    if (!user || !currentOrgId) return;
    setIsCreationLoading(true);
    
    const finalWidth = width || 850;
    const finalHeight = height || 500;
    const finalTags = tags;

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          title: title,
          user_id: user.id,
          organization_id: currentOrgId,
          is_template: isTemplate,
          tags: finalTags,
          canvas_data: {
            version: "5.3.0",
            width: finalWidth,
            height: finalHeight,
            backgroundColor: '#ffffff',
            objects: []
          }
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setIsTemplateModalOpen(false);
        setCreationPreset(null);
        navigate(`/editor/${data.id}`);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error occurred";
      alert("Error creating template: " + message);
    } finally {
      setIsCreationLoading(false);
    }
  };

  const handleSizeCardClick = (width?: number, height?: number, title?: string, autoTags: string[] = []) => {
      const finalTitle = title || 'Untitled Template';
      
      if (isOperator) {
          setCreationPreset({ width, height, title: finalTitle, tags: autoTags });
      } else {
          // Non-operators usually can't create templates here, but safeguard just in case
          handleCreateProject(width, height, finalTitle, autoTags, true);
      }
  };

  // --- Actions ---
  const handleDeleteClick = (id: string) => {
      setTemplateToDelete(id);
      setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
      if (!templateToDelete) return;
      const { error } = await supabase.from('projects').delete().eq('id', templateToDelete);
      if (!error) {
          fetchTemplates();
          setDeleteModalOpen(false);
          setTemplateToDelete(null);
      } else {
          alert('Error deleting template: ' + error.message);
      }
  };

  const handleDuplicate = async (template: ProjectTemplate) => {
    if (!user || !currentOrgId) return;
    if(!confirm(`Create a new campaign from "${template.title}"?`)) return;

    try {
      const { data: newProject, error } = await supabase.from('projects').insert({
          user_id: user.id,
          organization_id: currentOrgId,
          is_template: false, // Creating instance
          title: `${template.title} (Copy)`,
          canvas_data: template.canvas_data,
          thumbnail_url: template.thumbnail_url,
          tags: template.tags 
      }).select('id').single();
      
      if (error) throw error;
      if (newProject) {
          navigate(`/editor/${newProject.id}`);
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      alert("Error duplicating: " + msg);
    }
  };

  // --- Sub-components ---
  const CreationOptions = () => (
    <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
      <CreateNewCard icon={<LayoutIcon size={24} />} title="Custom Size" description="Start from scratch" onClick={() => handleSizeCardClick(undefined, undefined, 'Custom Template', ['Custom'])} />
      <CreateNewCard icon={<InstagramIcon size={24} />} title="Instagram Post" description="1080 x 1080 px" width={1080} height={1080} onClick={() => handleSizeCardClick(1080, 1080, 'Instagram Template', ['Social Media', 'Instagram'])} />
      <CreateNewCard icon={<FacebookIcon size={24} />} title="Facebook Post" description="1200 x 630 px" width={1200} height={630} onClick={() => handleSizeCardClick(1200, 630, 'Facebook Template', ['Social Media', 'Facebook'])} />
      <CreateNewCard icon={<MailIcon size={24} />} title="Email Header" description="600 x 200 px" width={600} height={200} onClick={() => handleSizeCardClick(600, 200, 'Email Template', ['Email', 'Marketing'])} />
    </SimpleGrid>
  );

  return (
    <MantineProvider theme={{}} forceColorScheme={colorScheme}>
      <div className="w-full min-h-screen bg-white dark:bg-gray-900">
        <DashboardHeader colorScheme={colorScheme} toggleColorScheme={toggleColorScheme} />
        
        <ConfirmationModal
            opened={deleteModalOpen}
            onClose={() => setDeleteModalOpen(false)}
            onConfirm={handleConfirmDelete}
            title="Delete Template?"
            message="Are you sure you want to delete this template? This action cannot be undone."
            confirmLabel="Delete Forever"
            isDanger
        />

        <Flex>
          <DashboardSidebar />
          <Box className="flex-1 p-8">
            <Container size="xl">
              <Group justify="space-between" mb="md">
                <div>
                  <Group gap="xs">
                    <Title order={2}>Templates</Title>
                    <Badge variant="light" color="blue" size="lg" circle>{templates.length}</Badge>
                  </Group>
                  <Text c="dimmed">
                    {canManageTemplates 
                      ? "Manage organization templates" 
                      : "Choose a template to start your design"}
                  </Text>
                </div>
                
                <Group>
                    <SegmentedControl 
                        value={viewMode}
                        onChange={(val) => setViewMode(val as 'grid' | 'list')}
                        data={[
                            { label: <Tooltip label="Grid View"><GridIcon size={16}/></Tooltip>, value: 'grid' },
                            { label: <Tooltip label="List View"><ListIcon size={16}/></Tooltip>, value: 'list' },
                        ]}
                    />
                    {canManageTemplates && (
                    <Button 
                        leftSection={<PlusIcon size={16} />} 
                        onClick={() => setIsTemplateModalOpen(true)}
                        color="blue"
                    >
                        New Template
                    </Button>
                    )}
                </Group>
              </Group>

              <Group justify="space-between" mb="lg">
                 <TextInput 
                    placeholder="Search templates..." 
                    leftSection={<SearchIcon size={16} />} 
                    value={searchQuery} 
                    onChange={e => setSearchQuery(e.currentTarget.value)} 
                    w={300} 
                />
                
                <ScrollArea type="never" w={{ base: '100%', md: 'auto' }}>
                    <Group gap="sm" wrap="nowrap">
                        <FilterIcon size={16} className="text-gray-400" />
                        {TEMPLATE_TAGS.map(tag => (
                            <Chip key={tag} checked={selectedTag === tag} onChange={() => setSelectedTag(tag)} variant="light" color="blue" size="sm">
                                {tag}
                            </Chip>
                        ))}
                    </Group>
                </ScrollArea>
              </Group>

              {loading ? (
                <Center h={200}><Loader /></Center>
              ) : (
                <>
                  {templates.length === 0 ? (
                    <Text c="dimmed" ta="center" mt="xl">No templates found.</Text>
                  ) : (
                    viewMode === 'grid' ? (
                        <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="lg">
                        {templates.map(template => (
                            <DesignCard 
                            key={template.id} 
                            design={{
                                id: template.id,
                                title: template.title,
                                thumbnail: template.thumbnail_url || '',
                                updated_at: template.updated_at,
                                canvas_data: template.canvas_data,
                                tags: template.tags
                            }}
                            isTemplate={true} 
                            onRefresh={fetchTemplates}
                            />
                        ))}
                        </SimpleGrid>
                    ) : (
                        <Paper shadow="sm" withBorder>
                            <Table striped highlightOnHover verticalSpacing="sm">
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Template Name</Table.Th>
                                        <Table.Th>Tags</Table.Th>
                                        <Table.Th>Dimensions</Table.Th>
                                        <Table.Th>Last Updated</Table.Th>
                                        <Table.Th align="right">Actions</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {templates.map(t => (
                                        <Table.Tr key={t.id}>
                                            <Table.Td>
                                                <Group gap="sm">
                                                    <Avatar src={t.thumbnail_url} radius="sm" size="lg" />
                                                    <div>
                                                        <Text fw={500}>{t.title}</Text>
                                                        <Text size="xs" c="dimmed">ID: {t.id.substring(0, 8)}...</Text>
                                                    </div>
                                                </Group>
                                            </Table.Td>
                                            <Table.Td>
                                                <Group gap={4}>
                                                    {t.tags?.map(tag => <Badge key={tag} size="xs" variant="outline">{tag}</Badge>)}
                                                </Group>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="sm">{t.canvas_data?.width || '?'} x {t.canvas_data?.height || '?'}</Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="sm">{new Date(t.updated_at || '').toLocaleDateString()}</Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Group justify="flex-end" gap="xs">
                                                    <Tooltip label="Edit">
                                                        <ActionIcon variant="light" color="blue" onClick={() => navigate(`/editor/${t.id}`)}>
                                                            <EditIcon size={16} />
                                                        </ActionIcon>
                                                    </Tooltip>
                                                    
                                                    <Tooltip label="Use for Campaign">
                                                        <ActionIcon variant="light" color="green" onClick={() => handleDuplicate(t)}>
                                                            <LayoutTemplateIcon size={16} />
                                                        </ActionIcon>
                                                    </Tooltip>
                                                    
                                                    {canManageTemplates && (
                                                        <Tooltip label="Delete">
                                                            <ActionIcon variant="light" color="red" onClick={() => handleDeleteClick(t.id)}>
                                                                <TrashIcon size={16} />
                                                            </ActionIcon>
                                                        </Tooltip>
                                                    )}
                                                </Group>
                                            </Table.Td>
                                        </Table.Tr>
                                    ))}
                                </Table.Tbody>
                            </Table>
                        </Paper>
                    )
                  )}
                </>
              )}
            </Container>
          </Box>
        </Flex>

        {/* Create Template Modal */}
        <Modal opened={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)} title="Create New Template" size="xl">
            <Box mb="lg">
                <Text c="dimmed" size="sm">Select a preset size to create a new master template.</Text>
            </Box>
            <CreationOptions />
        </Modal>

        {/* Operator Choice Modal */}
        <Modal opened={!!creationPreset} onClose={() => setCreationPreset(null)} title="Create New Design" size="md" centered>
            <Text size="sm" c="dimmed" mb="xl">How would you like to categorize this design?</Text>
            <Stack gap="md">
                <Button size="lg" variant="light" color="blue" fullWidth h="auto" py="md" justify="flex-start" leftSection={<LayoutTemplateIcon size={24} />} onClick={() => creationPreset && handleCreateProject(creationPreset.width, creationPreset.height, creationPreset.title, creationPreset.tags, true)} loading={isCreationLoading}>
                    <div className="flex flex-col items-start">
                        <Text size="sm" fw={600}>Create as Template</Text>
                        <Text size="xs" c="dimmed" fw={400} style={{ opacity: 0.8 }}>Visible to Designers</Text>
                    </div>
                </Button>
                <Button size="lg" variant="outline" color="green" fullWidth h="auto" py="md" justify="flex-start" leftSection={<FileTextIcon size={24} />} onClick={() => creationPreset && handleCreateProject(creationPreset.width, creationPreset.height, creationPreset.title, creationPreset.tags, false)} loading={isCreationLoading}>
                    <div className="flex flex-col items-start">
                        <Text size="sm" fw={600}>Create for Campaign</Text>
                        <Text size="xs" c="dimmed" fw={400} style={{ opacity: 0.8 }}>Standard Project</Text>
                    </div>
                </Button>
            </Stack>
        </Modal>

      </div>
    </MantineProvider>
  );
};

export default Templates;