// [cite: src/components/Dashboard/DashboardContent.tsx]
import React, { useState, useEffect, useCallback } from 'react';
import { 
    Container, Tabs, SimpleGrid, Title, Text, Box, Group, Button, 
    Center, Loader, Badge, Modal, ScrollArea, Chip, ActionIcon, 
    Table, SegmentedControl, Paper, Avatar, TagsInput, Tooltip, Stack,
    Pagination, Select, TextInput, ThemeIcon
} from '@mantine/core';
import { 
    LayoutIcon, FacebookIcon, InstagramIcon, MailIcon, PlusIcon, 
    FilterIcon, GridIcon, ListIcon, TrashIcon, EditIcon, LayoutTemplateIcon,
    FileTextIcon, SearchIcon, CheckIcon, SortAscIcon
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

  // Search, Pagination & Sorting States
  const [searchQuery, setSearchQuery] = useState('');
  const [activePage, setActivePage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<string>('12');
  const [sortBy, setSortBy] = useState<string>('updated_desc'); // Default sort

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid'); 
  
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  // Derived slices — no extra fetches needed
  const projects = allProjects;
  const templates = allProjects.filter(p => p.is_template === true);
  const campaignDesigns = allProjects.filter(p => p.is_template === false);
  const loadingTemplates = loadingProjects;
  const loadingCampaigns = loadingProjects;
  
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

  // --- Reset Pagination when Tab or Filters Change ---
  useEffect(() => {
    setActivePage(1);
    setSearchQuery(''); // Optional: Clear search on tab change
    setSortBy('updated_desc'); // Reset sort on tab change
  }, [activeTab, templateFilter, campaignFilter, recentFilter]);

  // --- Helper: Filtering, Sorting & Pagination Logic ---
  const processData = (data: Project[], tagFilter: string, tagList: string[]) => {
    // 1. Filter by Tags & Type
    let filtered = data;
    
    if (tagList === RECENT_TAGS) {
        if (tagFilter === 'Template') filtered = filtered.filter(p => p.is_template === true);
        else if (tagFilter === 'Campaign') filtered = filtered.filter(p => p.is_template === false);
    } else {
        if (tagFilter !== 'All') {
            filtered = filtered.filter(p => p.tags?.includes(tagFilter));
        }
    }

    // 2. Filter by Search Query
    if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(item => 
            item.title.toLowerCase().includes(query) || 
            item.tags?.some(tag => tag.toLowerCase().includes(query))
        );
    }

    // 3. Apply Sorting
    filtered.sort((a, b) => {
        switch (sortBy) {
            case 'name_asc':
                return a.title.localeCompare(b.title);
            case 'name_desc':
                return b.title.localeCompare(a.title);
            case 'created_desc':
                return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
            case 'updated_desc':
            default:
                return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime();
        }
    });

    // 4. Paginate
    const totalItems = filtered.length;
    const limit = parseInt(itemsPerPage);
    const totalPages = Math.ceil(totalItems / limit);
    const start = (activePage - 1) * limit;
    const end = start + limit;
    const paginatedItems = filtered.slice(start, end);

    return { paginatedItems, totalItems, totalPages };
  };

  // --- Fetch Functions ---

  const fetchAllProjects = useCallback(async () => {
      if (!currentOrgId) return;
      setLoadingProjects(true);

      const { data, error } = await supabase
        .from('projects')
        .select('id, user_id, title, thumbnail_url, created_at, updated_at, tags, is_template, organization_id, width:canvas_data->width, height:canvas_data->height')
        .eq('organization_id', currentOrgId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
      } else if (data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setAllProjects((data || []).map((d: any) => ({ ...d, canvas_data: { width: d.width, height: d.height } })) as Project[]);
      }
      setLoadingProjects(false);
  }, [currentOrgId]);

  useEffect(() => {
    fetchAllProjects();
  }, [fetchAllProjects]);

  // --- Creation Logic ---
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

  const handleSizeCardClick = (width?: number, height?: number, title?: string, autoTags: string[] = [], forceCampaign = false) => {
      const finalTitle = title || 'Untitled Project';
      
      if (forceCampaign) {
          handleCreateProject(width, height, finalTitle, autoTags, false);
          setIsDesignModalOpen(false); 
          return;
      }

      if (isOperator) {
          setIsTemplateModalOpen(false);
          setIsDesignModalOpen(false);
          setCreationPreset({ width, height, title: finalTitle, tags: autoTags });
      } else {
          handleCreateProject(width, height, finalTitle, autoTags, false);
      }
  };

  // --- Delete Logic ---
  const handleConfirmDelete = async () => {
      if (!projectToDelete) return;
      
      const { error } = await supabase.from('projects').delete().eq('id', projectToDelete);

      if (!error) {
          fetchAllProjects();
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

  const ProjectTable = ({ data }: { data: Project[] }) => (
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
                                {t.tags?.slice(0,3).map(tag => <Badge key={tag} size="xs" variant="outline">{tag}</Badge>)}
                                {t.tags && t.tags.length > 3 && <Badge size="xs" variant="outline">+{t.tags.length - 3}</Badge>}
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
                                    <ActionIcon variant="light" color="blue" onClick={() => navigate(`/editor/${t.id}`)}><EditIcon size={16} /></ActionIcon>
                                </Tooltip>
                                <Tooltip label="Duplicate">
                                    <ActionIcon variant="light" color="green" onClick={() => handleDuplicateFromTable(t, t.is_template || false)}><LayoutTemplateIcon size={16} /></ActionIcon>
                                </Tooltip>
                                <Tooltip label="Delete">
                                    <ActionIcon variant="light" color="red" onClick={() => deleteProject(t.id)}><TrashIcon size={16} /></ActionIcon>
                                </Tooltip>
                            </Group>
                        </Table.Td>
                    </Table.Tr>
                ))}
            </Table.Tbody>
        </Table>
    </Paper>
  );

  const DataRenderer = ({ 
    data, 
    tagFilter, 
    tagList, 
    refreshFn, 
    isTemplate 
  }: { 
    data: Project[], 
    tagFilter: string, 
    tagList: string[], 
    refreshFn: () => void, 
    isTemplate: boolean 
  }) => {
    const { paginatedItems, totalItems, totalPages } = processData(data, tagFilter, tagList);

    if (totalItems === 0) {
        return (
            <Box py="xl" ta="center" className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                <Text c="dimmed" mb="md">
                    {searchQuery 
                        ? `No results found for "${searchQuery}".` 
                        : "No items found matching your filters."}
                </Text>
                {searchQuery && (
                    <Button variant="subtle" onClick={() => setSearchQuery('')} size="xs">
                        Clear Search
                    </Button>
                )}
            </Box>
        );
    }

    return (
        <Stack gap="lg">
            {viewMode === 'grid' ? (
                <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="lg">
                    {paginatedItems.map(project => (
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
                            isTemplate={isTemplate}
                            onRefresh={refreshFn}
                        />
                    ))}
                </SimpleGrid>
            ) : (
                <ProjectTable data={paginatedItems} />
            )}

            {totalPages > 1 && (
                <Group justify="space-between" mt="md">
                    <Text size="sm" c="dimmed">
                        Showing {(activePage - 1) * parseInt(itemsPerPage) + 1} - {Math.min(activePage * parseInt(itemsPerPage), totalItems)} of {totalItems}
                    </Text>
                    <Pagination 
                        total={totalPages} 
                        value={activePage} 
                        onChange={setActivePage} 
                        color="blue"
                    />
                </Group>
            )}
        </Stack>
    );
  };

  const CreationOptions = ({ isTemplateMode = false, forceCampaign = false }: { isTemplateMode?: boolean, forceCampaign?: boolean }) => (
    <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
      <CreateNewCard 
          icon={<LayoutIcon size={24} />} 
          title="Custom Size" 
          description="Start from scratch"
          onClick={() => isTemplateMode 
            ? handleCreateProject(undefined, undefined, 'Custom Template', ['Custom'], true) 
            : handleSizeCardClick(undefined, undefined, 'Custom Size', ['Custom'], forceCampaign)
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
            : handleSizeCardClick(1080, 1080, 'Instagram Post', ['Social Media', 'Instagram'], forceCampaign)
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
            : handleSizeCardClick(1200, 630, 'Facebook Post', ['Social Media', 'Facebook'], forceCampaign)
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
            : handleSizeCardClick(600, 200, 'Email Header', ['Email', 'Marketing'], forceCampaign)
          }
      />
    </SimpleGrid>
  );

  if (isSuperAdmin) return <Navigate to="/admin" replace />;

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
      <ConfirmationModal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Design?"
        message="Are you sure you want to delete this? This action cannot be undone."
        confirmLabel="Delete Forever"
        isDanger
      />

      <Modal 
        opened={!!creationPreset} 
        onClose={() => setCreationPreset(null)} 
        title={
            <Group gap="xs">
                <ThemeIcon variant="light" color="blue"><PlusIcon size={16} /></ThemeIcon>
                <Text fw={600}>Create New Design</Text>
            </Group>
        }
        size="md"
        centered
        radius="md"
        padding="xl"
      >
        <Text size="sm" c="dimmed" mb="lg">
            You are creating <b>{creationPreset?.title}</b>. How would you like to categorize this design for your team?
        </Text>
        
        <Stack gap="md">
            <Button 
                size="xl" 
                variant="light" 
                color="blue" 
                fullWidth 
                h="auto"
                py="md"
                justify="flex-start"
                leftSection={
                    <ThemeIcon size={40} radius="xl" variant="filled" color="blue">
                        <LayoutTemplateIcon size={20} />
                    </ThemeIcon>
                }
                onClick={() => creationPreset && handleCreateProject(creationPreset.width, creationPreset.height, creationPreset.title + ' Template', creationPreset.tags, true)}
                loading={isCreationLoading}
                styles={{
                    inner: { justifyContent: 'flex-start' },
                    label: { width: '100%', textAlign: 'left' } 
                }}
            >
                <div className="flex flex-col items-start w-full ml-2">
                    <Text size="md" fw={600}>Create as Template</Text>
                    <Text size="xs" c="dimmed" fw={400} style={{ opacity: 0.8, whiteSpace: 'normal', lineHeight: 1.3, textAlign: 'left' }}>
                        Save as a master template for Designers to reuse.
                    </Text>
                </div>
                <div className="ml-auto">
                    <ThemeIcon variant="subtle" color="blue"><CheckIcon size={16} /></ThemeIcon>
                </div>
            </Button>

            <Button 
                size="xl" 
                variant="light" 
                color="green" 
                fullWidth
                h="auto"
                py="md"
                justify="flex-start"
                leftSection={
                    <ThemeIcon size={40} radius="xl" variant="filled" color="green">
                        <FileTextIcon size={20} />
                    </ThemeIcon>
                }
                onClick={() => creationPreset && handleCreateProject(creationPreset.width, creationPreset.height, creationPreset.title, creationPreset.tags, false)}
                loading={isCreationLoading}
                styles={{
                    inner: { justifyContent: 'flex-start' },
                    label: { width: '100%', textAlign: 'left' }
                }}
            >
                <div className="flex flex-col items-start w-full ml-2">
                    <Text size="md" fw={600}>Create for Campaign</Text>
                    <Text size="xs" c="dimmed" fw={400} style={{ opacity: 0.8, whiteSpace: 'normal', lineHeight: 1.3, textAlign: 'left' }}>
                        Create a standalone design for a specific campaign.
                    </Text>
                </div>
                <div className="ml-auto">
                    <ThemeIcon variant="subtle" color="green"><CheckIcon size={16} /></ThemeIcon>
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
          <CreationOptions isTemplateMode={false} />
        </Box>
        
        <Tabs value={activeTab} onChange={setActiveTab} className="mt-8" color="blue">
          <Tabs.List>
            <Tabs.Tab value="recent">Recent designs</Tabs.Tab>
            <Tabs.Tab value="templates">Templates</Tabs.Tab>
            {isOperator && <Tabs.Tab value="campaigns">Campaign Designs</Tabs.Tab>}
          </Tabs.List>
          
          <Box my="md">
             <Group justify="space-between" mb="md">
                <Group gap="xs">
                    <TextInput 
                        placeholder="Search designs..." 
                        leftSection={<SearchIcon size={14}/>} 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.currentTarget.value)}
                        w={300}
                    />
                    
                    {/* ADDED: Sorting Control */}
                    <Select 
                        data={[
                            { value: 'updated_desc', label: 'Recently Updated' },
                            { value: 'created_desc', label: 'Recently Created' },
                            { value: 'name_asc', label: 'Name (A-Z)' },
                            { value: 'name_desc', label: 'Name (Z-A)' },
                        ]}
                        value={sortBy}
                        onChange={(v) => setSortBy(v || 'updated_desc')}
                        w={180}
                        allowDeselect={false}
                        leftSection={<SortAscIcon size={14} />}
                    />

                    <Select 
                        data={['12', '24', '48', '96']} 
                        value={itemsPerPage} 
                        onChange={(v) => setItemsPerPage(v || '12')}
                        w={70}
                        allowDeselect={false}
                    />
                </Group>
                <Group>
                    <ViewToggle />
                    {activeTab === 'recent' && (
                        <Button variant="subtle" size="sm" onClick={fetchAllProjects} color="blue">Refresh</Button>
                    )}
                    {activeTab === 'templates' && (
                        <>
                            {canCreateTemplates && <Button leftSection={<PlusIcon size={16} />} onClick={() => setIsTemplateModalOpen(true)}>New Template</Button>}
                            <Button variant="subtle" size="sm" onClick={fetchAllProjects} color="blue">Refresh</Button>
                        </>
                    )}
                    {activeTab === 'campaigns' && (
                        <>
                            <Button leftSection={<PlusIcon size={16} />} onClick={() => setIsDesignModalOpen(true)}>New Design</Button>
                            <Button variant="subtle" size="sm" onClick={fetchAllProjects} color="blue">Refresh</Button>
                        </>
                    )}
                </Group>
             </Group>

             <ScrollArea type="never" mb="lg">
                <Group gap="sm" wrap="nowrap">
                    <FilterIcon size={16} className="text-gray-400" />
                    {(activeTab === 'recent' ? RECENT_TAGS : TEMPLATE_TAGS).map(tag => {
                        const currentFilter = activeTab === 'recent' ? recentFilter : (activeTab === 'templates' ? templateFilter : campaignFilter);
                        const setFilter = activeTab === 'recent' ? setRecentFilter : (activeTab === 'templates' ? setTemplateFilter : setCampaignFilter);
                        
                        return (
                            <Chip key={tag} checked={currentFilter === tag} onChange={() => setFilter(tag)} variant="light" color="blue" size="sm">
                                {tag}
                            </Chip>
                        );
                    })}
                </Group>
            </ScrollArea>
          </Box>

          <Tabs.Panel value="recent">
            {loadingProjects ? <Center h={100}><Loader /></Center> : <DataRenderer data={projects} tagFilter={recentFilter} tagList={RECENT_TAGS} refreshFn={fetchAllProjects} isTemplate={false} />}
          </Tabs.Panel>

          <Tabs.Panel value="templates">
            {loadingTemplates ? <Center h={100}><Loader /></Center> : <DataRenderer data={templates} tagFilter={templateFilter} tagList={TEMPLATE_TAGS} refreshFn={fetchAllProjects} isTemplate={true} />}
          </Tabs.Panel>

          {isOperator && (
            <Tabs.Panel value="campaigns">
               {loadingCampaigns ? <Center h={100}><Loader /></Center> : <DataRenderer data={campaignDesigns} tagFilter={campaignFilter} tagList={TEMPLATE_TAGS} refreshFn={fetchAllProjects} isTemplate={false} />}
            </Tabs.Panel>
          )}
        </Tabs>
      </Container>

      <Modal opened={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)} title="Create New Template" size="xl">
        <Box mb="lg">
            <Text size="sm" fw={500} mb="xs">Custom Tags</Text>
            <TagsInput placeholder="Enter custom tags..." data={[]} value={newTemplateTags} onChange={setNewTemplateTags} mb="md" />
            <Text c="dimmed" size="sm">Select a preset size below to create the template.</Text>
        </Box>
        <CreationOptions isTemplateMode={true} />
      </Modal>

      <Modal opened={isDesignModalOpen} onClose={() => setIsDesignModalOpen(false)} title="Create Campaign Design" size="xl">
        <Box mb="lg"><Text c="dimmed" size="sm">Select a size to start a new design for your campaigns.</Text></Box>
        <CreationOptions isTemplateMode={false} forceCampaign={true} />
      </Modal>
    </Box>
  );
};

export default DashboardContent;