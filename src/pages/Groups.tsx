// [cite: src/pages/Groups.tsx]
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Container, Title, Button, Table, Group, TextInput, Modal, ActionIcon, 
  LoadingOverlay, Paper, Drawer, MultiSelect, Text, Select, Pagination, Stack
} from '@mantine/core';
import { PlusIcon, EditIcon, TrashIcon, UsersIcon, SearchIcon, SortAscIcon } from 'lucide-react';
import { supabase } from '../supabaseClient';
import DashboardHeader from '../components/Dashboard/DashboardHeader';
import DashboardSidebar from '../components/Dashboard/DashboardSidebar';
import { useAuth } from '../auth/useAuth';

interface MarketingGroup {
  id: string;
  name: string;
  description: string;
  client_count?: number;
  created_at?: string;
}

// Define a type for the raw response to avoid 'any'
interface GroupWithCount {
  id: string;
  name: string;
  description: string;
  created_at: string;
  client_groups: { count: number }[];
}

const Groups: React.FC = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<MarketingGroup[]>([]);
  const [loading, setLoading] = useState(false);

  // -- Advanced Table States --
  const [searchQuery, setSearchQuery] = useState('');
  const [activePage, setActivePage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<string>('10');
  const [sortBy, setSortBy] = useState<string>('name_asc');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<MarketingGroup | null>(null);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');

  // Manage Members State
  const [manageOpen, setManageOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [allClients, setAllClients] = useState<{value: string, label: string}[]>([]);
  const [groupMembers, setGroupMembers] = useState<string[]>([]);

  // Reset pagination
  useEffect(() => {
    setActivePage(1);
  }, [searchQuery, sortBy, itemsPerPage]);

  const fetchGroups = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('groups')
      .select('*, client_groups(count)')
      .eq('user_id', user.id);

    if (error) console.error(error);
    else {
      const rawData = data as unknown as GroupWithCount[];
      const formatted = rawData.map((g) => ({
        id: g.id,
        name: g.name,
        description: g.description,
        created_at: g.created_at,
        client_count: g.client_groups?.[0]?.count || 0
      }));
      setGroups(formatted);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // --- Data Processing ---
  const processedGroups = useMemo(() => {
    let data = [...groups];

    // 1. Search
    if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        data = data.filter(g => 
            g.name.toLowerCase().includes(query) ||
            g.description?.toLowerCase().includes(query)
        );
    }

    // 2. Sort
    data.sort((a, b) => {
        switch (sortBy) {
            case 'name_asc': return a.name.localeCompare(b.name);
            case 'name_desc': return b.name.localeCompare(a.name);
            case 'count_desc': return (b.client_count || 0) - (a.client_count || 0);
            case 'created_desc': default: 
                return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        }
    });

    // 3. Paginate
    const total = data.length;
    const limit = parseInt(itemsPerPage);
    const totalPages = Math.ceil(total / limit);
    const paginated = data.slice((activePage - 1) * limit, activePage * limit);

    return { data: paginated, total, totalPages };
  }, [groups, searchQuery, sortBy, activePage, itemsPerPage]);

  // --- Actions ---
  const handleSaveGroup = async () => {
    if (!user || !groupName) return;
    setLoading(true);
    try {
      if (editingGroup) {
        await supabase.from('groups').update({ name: groupName, description: groupDesc }).eq('id', editingGroup.id);
      } else {
        await supabase.from('groups').insert({ name: groupName, description: groupDesc, user_id: user.id });
      }
      setModalOpen(false);
      fetchGroups();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this group?')) return;
    await supabase.from('groups').delete().eq('id', id);
    fetchGroups();
  };

  const openManageMembers = async (group: MarketingGroup) => {
    setSelectedGroupId(group.id);
    setManageOpen(true);
    
    const { data: clients } = await supabase.from('clients').select('id, name').eq('user_id', user!.id);
    setAllClients(clients?.map(c => ({ value: c.id, label: c.name })) || []);

    const { data: members } = await supabase
      .from('client_groups')
      .select('client_id')
      .eq('group_id', group.id);
    
    setGroupMembers(members?.map(m => m.client_id) || []);
  };

  const saveMembers = async () => {
    if (!selectedGroupId) return;
    setLoading(true);

    await supabase.from('client_groups').delete().eq('group_id', selectedGroupId);

    if (groupMembers.length > 0) {
      const toInsert = groupMembers.map(clientId => ({
        group_id: selectedGroupId,
        client_id: clientId
      }));
      await supabase.from('client_groups').insert(toInsert);
    }

    setLoading(false);
    setManageOpen(false);
    fetchGroups();
  };

  return (
    <div className="w-full min-h-screen bg-white dark:bg-gray-900 flex flex-col">
      <DashboardHeader colorScheme="light" toggleColorScheme={() => {}} />
      <div className="flex flex-1">
        <DashboardSidebar />
        <Container size="xl" py="xl" className="flex-1">
           <Group justify="space-between" mb="lg">
            <div>
                <Title order={2}>Client Groups</Title>
                <Text c="dimmed">Segment your audience</Text>
            </div>
            <Button leftSection={<PlusIcon size={16} />} onClick={() => {
              setEditingGroup(null); setGroupName(''); setGroupDesc(''); setModalOpen(true);
            }}>
              Create Group
            </Button>
          </Group>

          <Paper shadow="sm" p="md" withBorder>
            <LoadingOverlay visible={loading} />
            
             {/* --- Table Controls --- */}
             <Group justify="space-between" mb="md">
                <Group gap="xs">
                    <TextInput
                        placeholder="Search groups..."
                        leftSection={<SearchIcon size={14} />}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.currentTarget.value)}
                        w={250}
                    />
                    <Select 
                        data={[
                            { value: 'name_asc', label: 'Name (A-Z)' },
                            { value: 'name_desc', label: 'Name (Z-A)' },
                            { value: 'count_desc', label: 'Most Members' },
                            { value: 'created_desc', label: 'Newest First' },
                        ]}
                        value={sortBy}
                        onChange={(v) => setSortBy(v || 'name_asc')}
                        leftSection={<SortAscIcon size={14} />}
                        w={180}
                        allowDeselect={false}
                    />
                    <Select 
                        data={['5', '10', '25']} 
                        value={itemsPerPage} 
                        onChange={(v) => setItemsPerPage(v || '10')}
                        w={70}
                        allowDeselect={false}
                    />
                </Group>
            </Group>

            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Group Name</Table.Th>
                  <Table.Th>Description</Table.Th>
                  <Table.Th>Members</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {processedGroups.data.map((group) => (
                  <Table.Tr key={group.id}>
                    <Table.Td fw={500}>{group.name}</Table.Td>
                    <Table.Td>{group.description || '-'}</Table.Td>
                    <Table.Td>{group.client_count} Clients</Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Button size="xs" variant="light" leftSection={<UsersIcon size={14}/>} onClick={() => openManageMembers(group)}>
                          Manage
                        </Button>
                        <ActionIcon variant="subtle" color="blue" onClick={() => {
                           setEditingGroup(group); setGroupName(group.name); setGroupDesc(group.description); setModalOpen(true);
                        }}>
                          <EditIcon size={16} />
                        </ActionIcon>
                        <ActionIcon variant="subtle" color="red" onClick={() => handleDelete(group.id)}>
                          <TrashIcon size={16} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {processedGroups.total === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={4} align="center" style={{ height: 100 }}>
                        <Text c="dimmed">No groups found.</Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>

            {/* --- Pagination --- */}
            {processedGroups.totalPages > 1 && (
                <Group justify="space-between" mt="md">
                    <Text size="sm" c="dimmed">
                        Showing {(activePage - 1) * parseInt(itemsPerPage) + 1} - {Math.min(activePage * parseInt(itemsPerPage), processedGroups.total)} of {processedGroups.total}
                    </Text>
                    <Pagination total={processedGroups.totalPages} value={activePage} onChange={setActivePage} color="blue" />
                </Group>
            )}
          </Paper>
        </Container>
      </div>

      {/* Create/Edit Modal */}
      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editingGroup ? "Edit Group" : "Create Group"}>
        <Stack>
            <TextInput label="Name" required value={groupName} onChange={e => setGroupName(e.target.value)} />
            <TextInput label="Description" value={groupDesc} onChange={e => setGroupDesc(e.target.value)} />
            <Group justify="flex-end" mt="sm">
                <Button onClick={handleSaveGroup}>Save</Button>
            </Group>
        </Stack>
      </Modal>

      {/* Manage Members Drawer */}
      <Drawer opened={manageOpen} onClose={() => setManageOpen(false)} title="Manage Group Members" position="right" size="md">
        <Text size="sm" mb="md" c="dimmed">Select clients to include in this group.</Text>
        <Stack h="calc(100vh - 150px)">
            <MultiSelect
            label="Select Clients"
            placeholder="Pick clients"
            data={allClients}
            value={groupMembers}
            onChange={setGroupMembers}
            searchable
            nothingFoundMessage="No clients found"
            maxDropdownHeight={300}
            />
            <div style={{ flex: 1 }}></div>
            <Button fullWidth onClick={saveMembers}>Save Members</Button>
        </Stack>
      </Drawer>
    </div>
  );
};

export default Groups;