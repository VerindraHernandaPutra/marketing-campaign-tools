import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Group, Button, TextInput,
  Select, SegmentedControl, SimpleGrid, Center, Loader, Text, Tooltip,
  Paper, Table, Avatar, Badge, ActionIcon, ScrollArea, Chip, Modal, Stack,
  Pagination, ThemeIcon
} from '@mantine/core';
import PageShell from '../components/Dashboard/PageShell';
import PageHeader from '../components/Dashboard/PageHeader';
import DesignCard from '../components/Dashboard/DesignCard';
import CreateNewCard from '../components/Dashboard/CreateNewCard';
import ConfirmationModal from '../components/Layout/ConfirmationModal';
import { 
  PlusIcon, SearchIcon, GridIcon, ListIcon, FilterIcon, 
  TrashIcon, EditIcon, LayoutTemplateIcon, FileTextIcon,
  LayoutIcon, InstagramIcon, FacebookIcon, MailIcon, SortAscIcon, CheckIcon
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../auth/useAuth';
import { useUserRole } from '../auth/UserContext';
import { useNavigate } from 'react-router-dom';

export type Project = {
  id: string;
  user_id: string;
  title: string;
  canvas_data: { width?: number; height?: number; [key: string]: unknown };
  thumbnail_url: string | null;
  created_at: string | null;
  updated_at: string | null;
  tags?: string[] | null;
  is_template?: boolean;
  organization_id?: string;
};

const PROJECT_TAGS = ['All', 'Campaign', 'Template', 'Draft']; 

const Projects: React.FC = () => {
  const { user } = useAuth();
  const { role, isSuperAdmin, currentOrgId } = useUserRole();
  const navigate = useNavigate();
  
  // View & Filter States
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('updated_desc');
  const [selectedTag, setSelectedTag] = useState<string>('All');
  
  // Pagination States
  const [activePage, setActivePage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<string>('12');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creationPreset, setCreationPreset] = useState<{width?: number, height?: number, title: string, tags: string[]} | null>(null);
  const [isCreationLoading, setIsCreationLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  const isOperator = isSuperAdmin || role === 'operator';

  const { data: projects = [], isLoading: loading, refetch: fetchProjects } = useQuery({
    queryKey: ['projects', currentOrgId],
    queryFn: async () => {
        if (!currentOrgId) return [];
        const { data, error } = await supabase
            .from('projects')
            .select('id, user_id, title, thumbnail_url, created_at, updated_at, tags, is_template, organization_id, width:canvas_data->width, height:canvas_data->height')
            .eq('organization_id', currentOrgId)
            .order('updated_at', { ascending: false });

        if (error) throw error;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (data || []).map((d: any) => ({
            ...d,
            canvas_data: { width: d.width, height: d.height }
        })) as Project[];
    },
    enabled: !!currentOrgId,
  });

  // --- Reset Pagination on Filter Change ---
  useEffect(() => {
    setActivePage(1);
  }, [searchQuery, sortBy, selectedTag, itemsPerPage]);

  // --- Process Data (Filter, Sort, Paginate) ---
  const processData = () => {
    let filtered = [...projects];

    // 1. Tag Filtering
    if (selectedTag === 'Campaign') {
        filtered = filtered.filter(p => p.is_template === false);
    } else if (selectedTag === 'Template') {
        filtered = filtered.filter(p => p.is_template === true);
    } else if (selectedTag !== 'All') {
        // Example logic for 'Draft' or other tags if they exist in the tags array
        filtered = filtered.filter(p => p.tags?.includes(selectedTag));
    }

    // 2. Search Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(query) || 
        p.tags?.some(t => t.toLowerCase().includes(query))
      );
    }

    // 3. Sorting
    filtered.sort((a, b) => {
        switch (sortBy) {
            case 'name_asc': return a.title.localeCompare(b.title);
            case 'name_desc': return b.title.localeCompare(a.title);
            case 'created_desc': return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
            case 'updated_desc': default: return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime();
        }
    });

    // 4. Pagination
    const totalItems = filtered.length;
    const limit = parseInt(itemsPerPage);
    const totalPages = Math.ceil(totalItems / limit);
    const start = (activePage - 1) * limit;
    const end = start + limit;
    const paginatedItems = filtered.slice(start, end);

    return { paginatedItems, totalItems, totalPages };
  };

  const { paginatedItems, totalItems, totalPages } = processData();

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

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({ 
            title: title, 
            user_id: user.id,
            organization_id: currentOrgId || undefined,
            is_template: isTemplate,
            tags: tags,
            canvas_data: {
                version: "5.3.0",
                width: finalWidth,
                height: finalHeight,
                backgroundColor: '#ffffff',
                objects: []
            } 
        })
        .select('id') 
        .single();

      if (error) throw error;
      if (data) {
        setIsCreateModalOpen(false);
        setCreationPreset(null);
        navigate(`/editor/${data.id}`);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      alert("Error creating project: " + message);
    } finally {
      setIsCreationLoading(false);
    }
  };

  const handleSizeCardClick = (width?: number, height?: number, title?: string, autoTags: string[] = []) => {
      const finalTitle = title || 'Untitled Project';
      
      if (isOperator) {
          setIsCreateModalOpen(false); // Close first modal
          setCreationPreset({ width, height, title: finalTitle, tags: autoTags });
      } else {
          handleCreateProject(width, height, finalTitle, autoTags, false);
      }
  };

  // --- Actions ---
  const handleDeleteClick = (id: string) => {
      setProjectToDelete(id);
      setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
      if (!projectToDelete) return;
      const { error } = await supabase.from('projects').delete().eq('id', projectToDelete);
      if (!error) {
          fetchProjects();
          setDeleteModalOpen(false);
          setProjectToDelete(null);
      } else {
          alert('Error deleting: ' + error.message);
      }
  };

  const handleDuplicate = async (project: Project, asTemplate: boolean) => {
    if (!user) return;
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
        if (newProject) navigate(`/editor/${newProject.id}`);
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

  const CreationOptions = () => (
    <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
      <CreateNewCard icon={<LayoutIcon size={24} />} title="Custom Size" description="Start from scratch" onClick={() => handleSizeCardClick(undefined, undefined, 'Custom Size', ['Custom'])} />
      <CreateNewCard icon={<InstagramIcon size={24} />} title="Instagram Post" description="1080 x 1080 px" width={1080} height={1080} onClick={() => handleSizeCardClick(1080, 1080, 'Instagram Post', ['Social Media', 'Instagram'])} />
      <CreateNewCard icon={<FacebookIcon size={24} />} title="Facebook Post" description="1200 x 630 px" width={1200} height={630} onClick={() => handleSizeCardClick(1200, 630, 'Facebook Post', ['Social Media', 'Facebook'])} />
      <CreateNewCard icon={<MailIcon size={24} />} title="Email Header" description="600 x 200 px" width={600} height={200} onClick={() => handleSizeCardClick(600, 200, 'Email Header', ['Email', 'Marketing'])} />
    </SimpleGrid>
  );

  return (
    <PageShell>
        <ConfirmationModal
            opened={deleteModalOpen}
            onClose={() => setDeleteModalOpen(false)}
            onConfirm={handleConfirmDelete}
            title="Delete Project?"
            message="Are you sure you want to delete this project? This action cannot be undone."
            confirmLabel="Delete Forever"
            isDanger
        />
        <PageHeader
          icon={<LayoutTemplateIcon size={22} />}
          title="All Projects"
          subtitle="Manage your design projects"
          gradient={{ from: 'indigo', to: 'blue' }}
          action={
            <Group>
              <ViewToggle />
              <Button leftSection={<PlusIcon size={16} />} variant="gradient" gradient={{ from: 'indigo', to: 'blue' }} onClick={() => setIsCreateModalOpen(true)}>
                New Project
              </Button>
            </Group>
          }
        />

              <Box my="md">
                 <Group justify="space-between" mb="md">
                    <Group gap="xs">
                        <TextInput 
                          placeholder="Search projects..." 
                          leftSection={<SearchIcon size={16} />} 
                          value={searchQuery} 
                          onChange={e => setSearchQuery(e.currentTarget.value)} 
                          w={300} 
                        />
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
                 </Group>

                 <ScrollArea type="never" mb="lg">
                    <Group gap="sm" wrap="nowrap">
                        <FilterIcon size={16} className="text-gray-400" />
                        {PROJECT_TAGS.map(tag => (
                            <Chip key={tag} checked={selectedTag === tag} onChange={() => setSelectedTag(tag)} variant="light" color="blue" size="sm">
                                {tag}
                            </Chip>
                        ))}
                    </Group>
                </ScrollArea>
              </Box>

              {loading ? (
                <Center mt="xl" h={200}>
                  <Loader color="blue" />
                </Center>
              ) : (
                <>
                  {totalItems === 0 ? (
                      <Center mt="xl" h={200}>
                          <Stack align="center" gap="xs">
                            <Text c="dimmed">No projects found matching your search.</Text>
                            {searchQuery && <Button variant="subtle" size="xs" onClick={() => setSearchQuery('')}>Clear Search</Button>}
                          </Stack>
                      </Center>
                  ) : (
                      <Stack gap="lg">
                        {viewMode === 'grid' ? (
                            <SimpleGrid 
                                cols={{ base: 1, sm: 2, md: 3, lg: 4 }} 
                                spacing="lg"
                            >
                                {paginatedItems.map(project => (
                                <DesignCard 
                                    key={project.id} 
                                    design={{
                                        id: project.id,
                                        title: project.title,
                                        thumbnail: project.thumbnail_url || '', 
                                        updated_at: project.updated_at,
                                        canvas_data: project.canvas_data,
                                        tags: project.tags
                                    }}
                                    isTemplate={project.is_template}
                                    onRefresh={fetchProjects} 
                                />
                                ))}
                            </SimpleGrid>
                        ) : (
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
                                        {paginatedItems.map(t => (
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
                                                        <Tooltip label="Duplicate">
                                                            <ActionIcon variant="light" color="green" onClick={() => handleDuplicate(t, false)}>
                                                                <LayoutTemplateIcon size={16} />
                                                            </ActionIcon>
                                                        </Tooltip>
                                                        <Tooltip label="Delete">
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
                  )}
                </>
              )}
        {/* Create Project Modal (Size Selection) */}
        <Modal opened={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Project" size="xl">
            <Box mb="lg">
                <Text c="dimmed" size="sm">Select a canvas size to start.</Text>
            </Box>
            <CreationOptions />
        </Modal>

        {/* Operator Choice Modal */}
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
                    <div className="flex flex-col items-start w-full ml-2 text-left">
                        <Text size="md" fw={600}>Create as Template</Text>
                        <Text size="xs" c="dimmed" fw={400} ta="left" style={{ opacity: 0.8, whiteSpace: 'normal', lineHeight: 1.3 }}>
                            Save as a master template for Designers to reuse.
                        </Text>
                    </div>
                    <div className="ml-auto">
                        <ThemeIcon variant="subtle" color="blue"><CheckIcon size={16} /></ThemeIcon>
                    </div>
                </Button>
                <Button 
                    size="xl" 
                    variant="outline" 
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
                    <div className="flex flex-col items-start w-full ml-2 text-left">
                        <Text size="md" fw={600}>Create for Campaign</Text>
                        <Text size="xs" c="dimmed" fw={400} ta="left" style={{ opacity: 0.8, whiteSpace: 'normal', lineHeight: 1.3 }}>
                            Create a standalone design for a specific campaign.
                        </Text>
                    </div>
                    <div className="ml-auto">
                        <ThemeIcon variant="subtle" color="green"><CheckIcon size={16} /></ThemeIcon>
                    </div>
                </Button>
            </Stack>
        </Modal>

    </PageShell>
  );
};

export default Projects;