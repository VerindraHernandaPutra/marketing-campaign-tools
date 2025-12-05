import React, { useState, useEffect, useCallback } from 'react';
import { 
    Container, Tabs, SimpleGrid, Title, Text, Box, Group, Button, 
    Center, Loader, Badge, Modal, ScrollArea, Chip, ActionIcon, 
    Table, SegmentedControl, Paper, Avatar, TagsInput, Tooltip
} from '@mantine/core';
import { 
    LayoutIcon, FacebookIcon, InstagramIcon, MailIcon, PlusIcon, 
    FilterIcon, GridIcon, ListIcon, TrashIcon, EditIcon, LayoutTemplateIcon
} from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import CreateNewCard from './CreateNewCard';
import DesignCard from './DesignCard';
import MetricsCard from '../Analytics/MetricsCard'; 
import EngagementChart from '../Analytics/EngagementChart';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../auth/useAuth';
import { useUserRole } from '../../auth/UserContext';
import ConfirmationModal from '../Layout/ConfirmationModal';

interface CanvasData {
    width?: number;
    height?: number;
    [key: string]: unknown;
}

type Project = {
  id: string;
  user_id: string;
  title: string;
  canvas_data: CanvasData | null;
  thumbnail_url: string | null;
  created_at: string | null;
  updated_at: string | null;
  is_template?: boolean;
  tags?: string[] | null;
};

// Available tags for filtering
const TEMPLATE_TAGS = ['All', 'Social Media', 'Instagram', 'Facebook', 'Email', 'Business', 'Custom'];

const DashboardContent: React.FC = () => {
  const { user } = useAuth();
  const { role, isSuperAdmin, currentOrgId } = useUserRole();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string | null>('recent');
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid'); 
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [templates, setTemplates] = useState<Project[]>([]);
  
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [newTemplateTags, setNewTemplateTags] = useState<string[]>([]); 

  // Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  const isMarketer = role === 'marketer' && !isSuperAdmin;
  const canCreateTemplates = role === 'operator' || isSuperAdmin;

  // Fetch Recent Projects
  const fetchRecentProjects = useCallback(async () => {
      if (!user) return;
      setLoadingProjects(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(10); 

      if (error) {
        console.error('Error fetching recent projects:', error);
      } else if (data) {
        setProjects(data as Project[]);
      }
      setLoadingProjects(false);
  }, [user]);

  // Fetch Templates (with Tag Filtering)
  const fetchTemplates = useCallback(async () => {
      if (!currentOrgId) return;
      setLoadingTemplates(true);
      
      let query = supabase
        .from('projects')
        .select('*')
        .eq('organization_id', currentOrgId)
        .eq('is_template', true)
        .order('updated_at', { ascending: false });

      if (selectedTag !== 'All') {
        query = query.contains('tags', [selectedTag]);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching templates:', error);
      } else if (data) {
        setTemplates(data as Project[]);
      }
      setLoadingTemplates(false);
  }, [currentOrgId, selectedTag]);

  useEffect(() => {
    if (activeTab === 'recent') fetchRecentProjects();
    if (activeTab === 'templates') fetchTemplates();
  }, [activeTab, selectedTag, fetchRecentProjects, fetchTemplates]);

  // Handle Template Creation
  const handleCreateTemplateWithDimension = async (width?: number, height?: number, title?: string, autoTags: string[] = []) => {
    if (!user || !currentOrgId) return;
    
    const finalWidth = width || 850;
    const finalHeight = height || 500;
    const finalTitle = title || 'Untitled Template';
    const finalTags = [...autoTags, ...newTemplateTags]; 

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          title: finalTitle,
          user_id: user.id,
          organization_id: currentOrgId,
          is_template: true,
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
        setNewTemplateTags([]);
        setIsTemplateModalOpen(false);
        navigate(`/editor/${data.id}`);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error occurred";
      alert("Error creating template: " + message);
    }
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

  const handleDeleteClick = (id: string) => {
      setTemplateToDelete(id);
      setDeleteModalOpen(true);
  };

  // Reused duplicate logic for table action
  const handleDuplicateFromTable = async (template: Project) => {
    if (!user || !currentOrgId) return;
    if(!confirm(`Create a new campaign from "${template.title}"?`)) return;

    try {
      // 1. Get fresh data
      const { data: original } = await supabase
        .from('projects')
        .select('*')
        .eq('id', template.id)
        .single();

      if (original) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const originalData = original as any;
        
        // 2. Create copy
        const { data: newProject, error } = await supabase.from('projects').insert({
            user_id: user.id,
            organization_id: currentOrgId,
            is_template: false, // Creating instance, not template copy
            title: `${originalData.title} (Copy)`,
            canvas_data: originalData.canvas_data,
            thumbnail_url: originalData.thumbnail_url,
            tags: originalData.tags 
        }).select('id').single();
        
        if (error) throw error;
        
        if (newProject) {
            navigate(`/editor/${newProject.id}`);
        }
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      alert("Error duplicating: " + msg);
    }
  };

  // --- REDIRECT SUPER ADMIN ---
  if (isSuperAdmin) {
      return <Navigate to="/admin" replace />;
  }

  function getGreeting() {
      if (role === 'operator') return "Operator Dashboard";
      if (role === 'designer') return "Designer Studio";
      if (role === 'marketer') return "Marketing Hub";
      return "Dashboard";
  }

  function getSubtitle() {
      if (role === 'operator') return "Manage your organization's campaigns and designs";
      if (role === 'designer') return "Create and manage your visual assets";
      if (role === 'marketer') return "Track performance and schedule campaigns";
      return "Welcome back";
  }

  // Shared Options
  const CreationOptions = ({ isTemplateMode = false }: { isTemplateMode?: boolean }) => (
    <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
      <CreateNewCard 
          icon={<LayoutIcon size={24} />} 
          title="Custom Size" 
          description="Start from scratch"
          onClick={isTemplateMode ? () => handleCreateTemplateWithDimension(undefined, undefined, 'Custom Template', ['Custom']) : undefined}
      />
      <CreateNewCard 
          icon={<InstagramIcon size={24} />} 
          title="Instagram Post" 
          description="1080 x 1080 px" 
          width={1080} 
          height={1080}
          onClick={isTemplateMode ? () => handleCreateTemplateWithDimension(1080, 1080, 'Instagram Template', ['Social Media', 'Instagram']) : undefined}
      />
      <CreateNewCard 
          icon={<FacebookIcon size={24} />} 
          title="Facebook Post" 
          description="1200 x 630 px" 
          width={1200} 
          height={630}
          onClick={isTemplateMode ? () => handleCreateTemplateWithDimension(1200, 630, 'Facebook Template', ['Social Media', 'Facebook']) : undefined}
      />
      <CreateNewCard 
          icon={<MailIcon size={24} />} 
          title="Email Header" 
          description="600 x 200 px" 
          width={600} 
          height={200} 
          onClick={isTemplateMode ? () => handleCreateTemplateWithDimension(600, 200, 'Email Template', ['Email', 'Marketing']) : undefined}
      />
    </SimpleGrid>
  );

  // --- MARKETER VIEW ---
  if (isMarketer) {
    return (
      <Box className="py-8">
        <Container size="xl">
          <Box mb="xl">
            <Group align="center" mb="xs">
                <Title order={2}>{getGreeting()}</Title>
                <Badge color="cyan" variant="light">Marketer</Badge>
            </Group>
            <Text c="dimmed" size="sm">{getSubtitle()}</Text>
          </Box>

          <SimpleGrid cols={3} spacing="lg" mb="xl">
             <MetricsCard title="Active Campaigns" value="4" change={12} trend="up" />
             <MetricsCard title="Total Reach" value="12.5k" change={5.4} trend="up" />
             <MetricsCard title="Engagement Rate" value="4.2%" change={-1.1} trend="down" />
          </SimpleGrid>
          <EngagementChart />
        </Container>
      </Box>
    );
  }

  // --- MAIN DASHBOARD RENDER ---
  return (
    <Box className="py-8">
      <ConfirmationModal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Template?"
        message="Are you sure you want to delete this template? This action cannot be undone."
        confirmLabel="Delete Forever"
        isDanger
      />

      <Container size="xl">
        <Box mb="xl">
          <Group align="center" mb="xs">
            <Title order={2}>{getGreeting()}</Title>
            {role === 'operator' && <Badge color="blue" variant="light">Operator</Badge>}
            {role === 'designer' && <Badge color="pink" variant="light">Designer</Badge>}
          </Group>
          <Text c="dimmed" size="sm" mb="lg">{getSubtitle()}</Text>
          
          {/* Main Dashboard Creation Options */}
          <CreationOptions isTemplateMode={false} />
        </Box>
        
        <Tabs value={activeTab} onChange={setActiveTab} className="mt-8" color="blue">
          <Tabs.List>
            <Tabs.Tab value="recent">Recent designs</Tabs.Tab>
            <Tabs.Tab value="templates">Templates</Tabs.Tab>
          </Tabs.List>
          
          {/* RECENT DESIGNS PANEL */}
          <Tabs.Panel value="recent" pt="xl">
            <Group justify="space-between" mb="md">
              <Title order={3}>Your designs</Title>
              <Button variant="subtle" size="sm" onClick={fetchRecentProjects} color="blue">
                Refresh
              </Button>
            </Group>
            
            {loadingProjects ? (
              <Center mt="xl" style={{ height: 100 }}><Loader color="blue" /></Center>
            ) : (
              <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="lg">
                {projects.length === 0 && <Text c="dimmed">No projects found. Create one above!</Text>}
                {projects.map(project => (
                  <DesignCard 
                    key={project.id} 
                    design={{
                      id: project.id,
                      title: project.title,
                      thumbnail: project.thumbnail_url, 
                      updated_at: project.updated_at,
                      canvas_data: project.canvas_data
                    }}
                    onRefresh={fetchRecentProjects}
                  />
                ))}
              </SimpleGrid>
            )}
          </Tabs.Panel>
          
          {/* TEMPLATES PANEL */}
          <Tabs.Panel value="templates" pt="xl">
            <Group justify="space-between" mb="md" align="center">
              <Group gap="xs">
                <Title order={3}>Organization Templates</Title>
                <Badge variant="dot" color="gray">{templates.length}</Badge>
              </Group>
              <Group>
                {/* View Toggle for Operators */}
                {canCreateTemplates && (
                    <SegmentedControl 
                        value={viewMode}
                        onChange={(val) => setViewMode(val as 'grid' | 'list')}
                        data={[
                            { label: <Tooltip label="Grid View"><GridIcon size={16}/></Tooltip>, value: 'grid' },
                            { label: <Tooltip label="List View"><ListIcon size={16}/></Tooltip>, value: 'list' },
                        ]}
                    />
                )}
                {canCreateTemplates && (
                    <Button leftSection={<PlusIcon size={16} />} onClick={() => setIsTemplateModalOpen(true)} color="blue">
                        New Template
                    </Button>
                )}
                <Button variant="subtle" size="sm" onClick={fetchTemplates} color="blue">Refresh</Button>
              </Group>
            </Group>

            {/* FILTER BAR */}
            <ScrollArea type="never" mb="lg">
                <Group gap="sm" wrap="nowrap">
                    <FilterIcon size={16} className="text-gray-400" />
                    {TEMPLATE_TAGS.map(tag => (
                        <Chip key={tag} checked={selectedTag === tag} onChange={() => setSelectedTag(tag)} variant="light" color="blue" size="sm">
                            {tag}
                        </Chip>
                    ))}
                </Group>
            </ScrollArea>

            {loadingTemplates ? (
              <Center mt="xl" style={{ height: 100 }}><Loader color="blue" /></Center>
            ) : (
              <>
                {templates.length === 0 ? (
                  <Box py="xl" ta="center" className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                    <Text c="dimmed" mb="md">
                        {canCreateTemplates 
                            ? "No templates found. Create one to get started." 
                            : "No templates available. Ask an Operator to create one."}
                    </Text>
                    {canCreateTemplates && selectedTag === 'All' && (
                        <Button leftSection={<PlusIcon size={16} />} onClick={() => setIsTemplateModalOpen(true)} variant="outline">
                            Create First Template
                        </Button>
                    )}
                  </Box>
                ) : (
                  <>
                    {/* GRID VIEW */}
                    {viewMode === 'grid' && (
                        <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="lg">
                            {templates.map(template => (
                            <DesignCard 
                                key={template.id} 
                                design={{
                                    id: template.id,
                                    title: template.title,
                                    thumbnail: template.thumbnail_url,
                                    updated_at: template.updated_at,
                                    canvas_data: template.canvas_data,
                                    tags: template.tags
                                }}
                                isTemplate 
                                onRefresh={fetchTemplates}
                            />
                            ))}
                        </SimpleGrid>
                    )}

                    {/* TABLE VIEW (MANAGEMENT MODE) */}
                    {viewMode === 'list' && (
                        <Paper shadow="sm" withBorder>
                            <Table striped highlightOnHover verticalSpacing="sm">
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Template</Table.Th>
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
                                                    <Tooltip label="Edit Master Source">
                                                        <ActionIcon variant="light" color="blue" onClick={() => navigate(`/editor/${t.id}`)}>
                                                            <EditIcon size={16} />
                                                        </ActionIcon>
                                                    </Tooltip>
                                                    
                                                    <Tooltip label="Use for Campaign (Duplicate)">
                                                        <ActionIcon variant="light" color="green" onClick={() => handleDuplicateFromTable(t)}>
                                                            <LayoutTemplateIcon size={16} />
                                                        </ActionIcon>
                                                    </Tooltip>
                                                    
                                                    <Tooltip label="Delete Template">
                                                        <ActionIcon variant="light" color="red" onClick={() => handleDeleteClick(t.id)}>
                                                            <TrashIcon size={16} />
                                                        </ActionIcon>
                                                    </Tooltip>
                                                </Group>
                                            </Table.Td>
                                        </Table.Tr>
                                    ))}
                                </Table.Tbody>
                            </Table>
                        </Paper>
                    )}
                  </>
                )}
              </>
            )}
          </Tabs.Panel>
        </Tabs>
      </Container>

      {/* TEMPLATE CREATION MODAL */}
      <Modal 
        opened={isTemplateModalOpen} 
        onClose={() => setIsTemplateModalOpen(false)} 
        title="Create New Template" 
        size="xl"
      >
        <Box mb="lg">
            <Text size="sm" fw={500} mb="xs">Custom Tags</Text>
            <TagsInput 
                placeholder="Enter custom tags (e.g. 'Sale', 'Q3')" 
                data={[]} 
                value={newTemplateTags}
                onChange={setNewTemplateTags}
                mb="md"
            />
            <Text c="dimmed" size="sm">Select a preset size below to create the template.</Text>
        </Box>
        <CreationOptions isTemplateMode={true} />
      </Modal>
    </Box>
  );
};

export default DashboardContent;