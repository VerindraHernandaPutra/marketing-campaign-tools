// [cite: src/components/Dashboard/DashboardContent.tsx]
import React, { useState, useEffect, useCallback } from 'react';
import { 
    Container, Tabs, SimpleGrid, Title, Text, Box, Group, Button, 
    Center, Loader, Badge, Modal, ScrollArea, Chip, ActionIcon, 
    Table, SegmentedControl, Paper, Avatar, TagsInput, Tooltip, Stack
} from '@mantine/core';
import { 
    LayoutIcon, FacebookIcon, InstagramIcon, MailIcon, PlusIcon, 
    FilterIcon, GridIcon, ListIcon, TrashIcon, EditIcon, LayoutTemplateIcon,
    FileTextIcon, MegaphoneIcon
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
  organization_id?: string;
};

// Available tags for filtering
const TEMPLATE_TAGS = ['All', 'Social Media', 'Instagram', 'Facebook', 'Email', 'Business', 'Custom'];
const RECENT_TAGS = ['All', 'Campaign', 'Template', 'Draft']; 

const DashboardContent: React.FC = () => {
  const { user } = useAuth();
  const { role, isSuperAdmin, currentOrgId } = useUserRole();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string | null>('recent');
  
  // Independent Filter States
  const [templateFilter, setTemplateFilter] = useState<string>('All');
  const [campaignFilter, setCampaignFilter] = useState<string>('All');
  const [recentFilter, setRecentFilter] = useState<string>('All');

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid'); 
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [templates, setTemplates] = useState<Project[]>([]);
  const [campaignDesigns, setCampaignDesigns] = useState<Project[]>([]); 
  
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isDesignModalOpen, setIsDesignModalOpen] = useState(false); 
  const [newTemplateTags, setNewTemplateTags] = useState<string[]>([]); 

  // --- Creation Purpose Modal State ---
  const [creationPreset, setCreationPreset] = useState<{width?: number, height?: number, title: string, tags: string[]} | null>(null);
  const [isCreationLoading, setIsCreationLoading] = useState(false);

  // Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  const isMarketer = role === 'marketer' && !isSuperAdmin;
  const isOperator = role === 'operator' || isSuperAdmin;
  const canCreateTemplates = isOperator;

  // --- Fetch Functions ---

  const fetchRecentProjects = useCallback(async () => {
      if (!user) return;
      setLoadingProjects(true);
      
      const query = supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(20); 

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching recent projects:', error);
      } else if (data) {
        let filteredData = data as Project[];
        
        // Client-Side Filtering for Recent Tab
        if (recentFilter === 'Template') {
            filteredData = filteredData.filter(p => p.is_template === true);
        } else if (recentFilter === 'Campaign') {
            filteredData = filteredData.filter(p => p.is_template === false);
        }
        
        setProjects(filteredData);
      }
      setLoadingProjects(false);
  }, [user, recentFilter]);

  const fetchTemplates = useCallback(async () => {
      if (!currentOrgId) return;
      setLoadingTemplates(true);
      
      let query = supabase
        .from('projects')
        .select('*')
        .eq('organization_id', currentOrgId)
        .eq('is_template', true)
        .order('updated_at', { ascending: false });

      if (templateFilter !== 'All') {
        query = query.contains('tags', [templateFilter]);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching templates:', error);
      } else if (data) {
        setTemplates(data as Project[]);
      }
      setLoadingTemplates(false);
  }, [currentOrgId, templateFilter]);

  const fetchCampaignDesigns = useCallback(async () => {
      if (!currentOrgId) return;
      setLoadingCampaigns(true);
      
      let query = supabase
        .from('projects')
        .select('*')
        .eq('organization_id', currentOrgId)
        .eq('is_template', false) 
        .order('updated_at', { ascending: false });

      // Apply Filter
      if (campaignFilter !== 'All') {
        query = query.contains('tags', [campaignFilter]);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching campaign designs:', error);
      } else if (data) {
        setCampaignDesigns(data as Project[]);
      }
      setLoadingCampaigns(false);
  }, [currentOrgId, campaignFilter]); 

  useEffect(() => {
    if (activeTab === 'recent') fetchRecentProjects();
    if (activeTab === 'templates') fetchTemplates();
    if (activeTab === 'campaigns') fetchCampaignDesigns();
  }, [activeTab, recentFilter, templateFilter, campaignFilter, fetchRecentProjects, fetchTemplates, fetchCampaignDesigns]);

  // --- Unified Creation Logic ---
  const handleCreateProject = async (
    width: number | undefined, 
    height: number | undefined, 
    title: string, 
    tags: string[], 
    isTemplate: boolean
  ) => {
    if (!user) return;
    setIsCreationLoading(true);
    
    const finalWidth = width || 850;
    const finalHeight = height || 500;
    const finalTags = [...tags, ...(isTemplate ? newTemplateTags : [])];

    try {
      const payload = {
          title: title,
          user_id: user.id,
          organization_id: currentOrgId || undefined,
          is_template: isTemplate,
          tags: finalTags,
          canvas_data: {
            version: "5.3.0",
            width: finalWidth,
            height: finalHeight,
            backgroundColor: '#ffffff',
            objects: []
          }
      };

      const { data, error } = await supabase
        .from('projects')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      
      if (data) {
        setNewTemplateTags([]);
        setIsTemplateModalOpen(false);
        setIsDesignModalOpen(false); 
        setCreationPreset(null); 
        navigate(`/editor/${data.id}`);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error occurred";
      alert("Error creating project: " + message);
    } finally {
      setIsCreationLoading(false);
    }
  };

  const handleSizeCardClick = (width?: number, height?: number, title?: string, autoTags: string[] = []) => {
      const finalTitle = title || 'Untitled Project';
      
      if (isOperator) {
          setCreationPreset({ width, height, title: finalTitle, tags: autoTags });
      } else {
          handleCreateProject(width, height, finalTitle, autoTags, false);
      }
  };

  // --- Delete Handlers ---
  const handleConfirmDelete = async () => {
      if (!projectToDelete) return;
      
      const { error } = await supabase.from('projects').delete().eq('id', projectToDelete);

      if (!error) {
          fetchTemplates();
          fetchRecentProjects();
          fetchCampaignDesigns();
          
          setDeleteModalOpen(false);
          setProjectToDelete(null);
      } else {
          alert('Error deleting item: ' + error.message);
      }
  };

  const deleteProject = (id: string) => {
      setProjectToDelete(id);
      setDeleteModalOpen(true);
  };

  const handleDuplicateFromTable = async (project: Project, asTemplate: boolean) => {
    if (!user || !currentOrgId) return;
    if(!confirm(`Duplicate "${project.title}"?`)) return;

    try {
        const { data: newProject, error } = await supabase.from('projects').insert({
            user_id: user.id,
            organization_id: currentOrgId,
            is_template: asTemplate, 
            title: `${project.title} (Copy)`,
            canvas_data: project.canvas_data,
            thumbnail_url: project.thumbnail_url,
            tags: project.tags 
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

  const ViewToggle = () => (
    <SegmentedControl 
        value={viewMode}
        onChange={(val) => setViewMode(val as 'grid' | 'list')}
        data={[
            { label: <Tooltip label="Grid View"><GridIcon size={16}/></Tooltip>, value: 'grid' },
            { label: <Tooltip label="List View"><ListIcon size={16}/></Tooltip>, value: 'list' },
        ]}
    />
  );

  const ProjectTable = ({ data, isTemplate }: { data: Project[], isTemplate: boolean }) => (
    <Paper shadow="sm" withBorder>
        <Table striped highlightOnHover verticalSpacing="sm">
            <Table.Thead>
                <Table.Tr>
                    <Table.Th>Name</Table.Th>
                    <Table.Th>Tags</Table.Th>
                    <Table.Th>Dimensions</Table.Th>
                    <Table.Th>Last Updated</Table.Th>
                    <Table.Th align="right">Actions</Table.Th>
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
                {data.map(t => (
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
                                <Tooltip label="Edit Design">
                                    <ActionIcon variant="light" color="blue" onClick={() => navigate(`/editor/${t.id}`)}>
                                        <EditIcon size={16} />
                                    </ActionIcon>
                                </Tooltip>
                                
                                <Tooltip label="Duplicate">
                                    <ActionIcon variant="light" color="green" onClick={() => handleDuplicateFromTable(t, isTemplate)}>
                                        <LayoutTemplateIcon size={16} />
                                    </ActionIcon>
                                </Tooltip>
                                
                                <Tooltip label="Delete">
                                    <ActionIcon variant="light" color="red" onClick={() => deleteProject(t.id)}>
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
  );

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

  // Shared Options Component
  const CreationOptions = ({ isTemplateMode = false }: { isTemplateMode?: boolean }) => (
    <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
      <CreateNewCard 
          icon={<LayoutIcon size={24} />} 
          title="Custom Size" 
          description="Start from scratch"
          onClick={() => isTemplateMode 
            ? handleCreateProject(undefined, undefined, 'Custom Template', ['Custom'], true) 
            : handleSizeCardClick(undefined, undefined, 'Custom Size', ['Custom'])
          }
      />
      <CreateNewCard 
          icon={<InstagramIcon size={24} />} 
          title="Instagram Post" 
          description="1080 x 1080 px" 
          width={1080} 
          height={1080}
          onClick={() => isTemplateMode 
            ? handleCreateProject(1080, 1080, 'Instagram Template', ['Social Media', 'Instagram'], true)
            : handleSizeCardClick(1080, 1080, 'Instagram Post', ['Social Media', 'Instagram'])
          }
      />
      <CreateNewCard 
          icon={<FacebookIcon size={24} />} 
          title="Facebook Post" 
          description="1200 x 630 px" 
          width={1200} 
          height={630}
          onClick={() => isTemplateMode 
            ? handleCreateProject(1200, 630, 'Facebook Template', ['Social Media', 'Facebook'], true)
            : handleSizeCardClick(1200, 630, 'Facebook Post', ['Social Media', 'Facebook'])
          }
      />
      <CreateNewCard 
          icon={<MailIcon size={24} />} 
          title="Email Header" 
          description="600 x 200 px" 
          width={600} 
          height={200} 
          onClick={() => isTemplateMode 
            ? handleCreateProject(600, 200, 'Email Template', ['Email', 'Marketing'], true)
            : handleSizeCardClick(600, 200, 'Email Header', ['Email', 'Marketing'])
          }
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

  return (
    <Box className="py-8">
      {/* ... [Confirmation Modal] ... */}
      <ConfirmationModal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Design?"
        message="Are you sure you want to delete this? This action cannot be undone."
        confirmLabel="Delete Forever"
        isDanger
      />

      {/* --- Operator Creation Choice Modal --- */}
      <Modal 
        opened={!!creationPreset} 
        onClose={() => setCreationPreset(null)} 
        title="Create New Design"
        size="md"
        centered
      >
        <Text size="sm" c="dimmed" mb="xl">
            How would you like to categorize this design?
        </Text>
        
        <Stack gap="md">
            <Button 
                size="lg" 
                variant="light" 
                color="blue" 
                fullWidth 
                h="auto"
                py="md"
                justify="flex-start"
                leftSection={<LayoutTemplateIcon size={24} />}
                onClick={() => creationPreset && handleCreateProject(creationPreset.width, creationPreset.height, creationPreset.title + ' Template', creationPreset.tags, true)}
                loading={isCreationLoading}
            >
                <div className="flex flex-col items-start">
                    <Text size="sm" fw={600}>Create as Template</Text>
                    <Text size="xs" c="dimmed" fw={400} style={{ opacity: 0.8 }}>Visible to Designers</Text>
                </div>
            </Button>

            <Button 
                size="lg" 
                variant="outline" 
                color="green" 
                fullWidth
                h="auto"
                py="md"
                justify="flex-start"
                leftSection={<FileTextIcon size={24} />}
                onClick={() => creationPreset && handleCreateProject(creationPreset.width, creationPreset.height, creationPreset.title, creationPreset.tags, false)}
                loading={isCreationLoading}
            >
                <div className="flex flex-col items-start">
                    <Text size="sm" fw={600}>Create for Campaign</Text>
                    <Text size="xs" c="dimmed" fw={400} style={{ opacity: 0.8 }}>Standard Project</Text>
                </div>
            </Button>
        </Stack>
      </Modal>

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
        
        {/* ... [Rest of the Dashboard: Tabs, Recent, Templates] ... */}
        <Tabs value={activeTab} onChange={setActiveTab} className="mt-8" color="blue">
          <Tabs.List>
            <Tabs.Tab value="recent">Recent designs</Tabs.Tab>
            <Tabs.Tab value="templates">Templates</Tabs.Tab>
            {isOperator && <Tabs.Tab value="campaigns">Campaign Designs</Tabs.Tab>}
          </Tabs.List>
          
          <Tabs.Panel value="recent" pt="xl">
            <Group justify="space-between" mb="md">
              <Group gap="xs">
                <Title order={3}>Your designs</Title>
                <Badge variant="light" color="gray" size="lg" circle>{projects.length}</Badge>
              </Group>
              <Group>
                <ViewToggle />
                <Button variant="subtle" size="sm" onClick={fetchRecentProjects} color="blue">
                    Refresh
                </Button>
              </Group>
            </Group>

            {/* Filter Bar for Recent Designs */}
            <ScrollArea type="never" mb="lg">
                <Group gap="sm" wrap="nowrap">
                    <FilterIcon size={16} className="text-gray-400" />
                    {RECENT_TAGS.map(tag => (
                        <Chip key={tag} checked={recentFilter === tag} onChange={() => setRecentFilter(tag)} variant="light" color="blue" size="sm">
                            {tag}
                        </Chip>
                    ))}
                </Group>
            </ScrollArea>
            
            {loadingProjects ? (
              <Center mt="xl" style={{ height: 100 }}><Loader color="blue" /></Center>
            ) : (
              <>
                {projects.length === 0 ? <Text c="dimmed">No projects found. Create one above!</Text> : (
                    viewMode === 'grid' ? (
                        <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="lg">
                            {projects.map(project => (
                            <DesignCard 
                                key={project.id} 
                                design={{
                                id: project.id,
                                title: project.title,
                                thumbnail: project.thumbnail_url, 
                                updated_at: project.updated_at,
                                canvas_data: project.canvas_data,
                                tags: project.tags // Pass tags here
                                }}
                                isTemplate={project.is_template}
                                onRefresh={fetchRecentProjects}
                            />
                            ))}
                        </SimpleGrid>
                    ) : (
                        <ProjectTable data={projects} isTemplate={false} />
                    )
                )}
              </>
            )}
          </Tabs.Panel>
          
          <Tabs.Panel value="templates" pt="xl">
            <Group justify="space-between" mb="md" align="center">
              <Group gap="xs">
                <Title order={3}>Organization Templates</Title>
                <Badge variant="light" color="blue" size="lg" circle>{templates.length}</Badge>
              </Group>
              <Group>
                <ViewToggle />
                {canCreateTemplates && (
                    <Button leftSection={<PlusIcon size={16} />} onClick={() => setIsTemplateModalOpen(true)} color="blue">
                        New Template
                    </Button>
                )}
                <Button variant="subtle" size="sm" onClick={fetchTemplates} color="blue">Refresh</Button>
              </Group>
            </Group>

            {/* FILTER BAR: Templates */}
            <ScrollArea type="never" mb="lg">
                <Group gap="sm" wrap="nowrap">
                    <FilterIcon size={16} className="text-gray-400" />
                    {TEMPLATE_TAGS.map(tag => (
                        <Chip key={tag} checked={templateFilter === tag} onChange={() => setTemplateFilter(tag)} variant="light" color="blue" size="sm">
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
                    {canCreateTemplates && templateFilter === 'All' && (
                        <Button leftSection={<PlusIcon size={16} />} onClick={() => setIsTemplateModalOpen(true)} variant="outline">
                            Create First Template
                        </Button>
                    )}
                  </Box>
                ) : (
                  <>
                    {viewMode === 'grid' ? (
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
                    ) : (
                        <ProjectTable data={templates} isTemplate={true} />
                    )}
                  </>
                )}
              </>
            )}
          </Tabs.Panel>

          {/* CAMPAIGNS PANEL (SHOWS DESIGNS) */}
          {isOperator && (
            <Tabs.Panel value="campaigns" pt="xl">
                <Group justify="space-between" mb="md">
                    <Group gap="xs">
                        <Title order={3}>Campaign Designs</Title>
                        <Badge variant="light" color="purple" size="lg" circle>{campaignDesigns.length}</Badge>
                    </Group>
                    <Group>
                        <ViewToggle />
                        {/* Button to create Design */}
                        <Button leftSection={<PlusIcon size={16} />} onClick={() => setIsDesignModalOpen(true)} color="blue">
                            New Design
                        </Button>
                        <Button leftSection={<MegaphoneIcon size={16} />} onClick={() => navigate('/campaign-manager')} color="grape" variant="light">
                            Campaign Manager
                        </Button>
                        <Button variant="subtle" size="sm" onClick={fetchCampaignDesigns} color="blue">Refresh</Button>
                    </Group>
                </Group>

                {/* NEW: Filter Bar for Campaign Designs */}
                <ScrollArea type="never" mb="lg">
                    <Group gap="sm" wrap="nowrap">
                        <FilterIcon size={16} className="text-gray-400" />
                        {TEMPLATE_TAGS.map(tag => (
                            <Chip key={tag} checked={campaignFilter === tag} onChange={() => setCampaignFilter(tag)} variant="light" color="blue" size="sm">
                                {tag}
                            </Chip>
                        ))}
                    </Group>
                </ScrollArea>

                {loadingCampaigns ? (
                    <Center mt="xl"><Loader color="blue" /></Center>
                ) : (
                    <>
                    {campaignDesigns.length === 0 ? (
                        <Box py="xl" ta="center" className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                            <Text c="dimmed" mb="md">No specific campaign designs found.</Text>
                            <Button leftSection={<PlusIcon size={16} />} onClick={() => handleSizeCardClick(undefined, undefined, "New Campaign Design", ["Campaign"])} variant="outline">
                                Create New Design
                            </Button>
                        </Box>
                    ) : (
                        <>
                            {viewMode === 'grid' ? (
                                <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="lg">
                                    {campaignDesigns.map(project => (
                                        <DesignCard 
                                            key={project.id} 
                                            design={{
                                                id: project.id,
                                                title: project.title,
                                                thumbnail: project.thumbnail_url, 
                                                updated_at: project.updated_at,
                                                canvas_data: project.canvas_data,
                                                tags: project.tags
                                            }}
                                            onRefresh={fetchCampaignDesigns}
                                        />
                                    ))}
                                </SimpleGrid>
                            ) : (
                                <ProjectTable data={campaignDesigns} isTemplate={false} />
                            )}
                        </>
                    )}
                    </>
                )}
            </Tabs.Panel>
          )}
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

      {/* NEW: CAMPAIGN DESIGN CREATION MODAL */}
      <Modal 
        opened={isDesignModalOpen} 
        onClose={() => setIsDesignModalOpen(false)} 
        title="Create Campaign Design" 
        size="xl"
      >
        <Box mb="lg">
            <Text c="dimmed" size="sm">Select a size to start a new design for your campaigns.</Text>
        </Box>
        {/* We use isTemplateMode={false} here so it triggers standard creation logic (or the operator choice if preferred) */}
        <CreationOptions isTemplateMode={false} />
      </Modal>
    </Box>
  );
};

export default DashboardContent;