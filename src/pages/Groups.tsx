import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Title, Button, Table, Group, TextInput, Modal, ActionIcon, 
  LoadingOverlay, Paper, Drawer, MultiSelect, Text
} from '@mantine/core';
import { PlusIcon, EditIcon, TrashIcon, UsersIcon } from 'lucide-react';
import { supabase } from '../supabaseClient';
import DashboardHeader from '../components/Dashboard/DashboardHeader';
import DashboardSidebar from '../components/Dashboard/DashboardSidebar';
import { useAuth } from '../auth/useAuth';

interface MarketingGroup {
  id: string;
  name: string;
  description: string;
  client_count?: number;
}

// Define a type for the raw response to avoid 'any'
interface GroupWithCount {
  id: string;
  name: string;
  description: string;
  client_groups: { count: number }[];
}

const Groups: React.FC = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<MarketingGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<MarketingGroup | null>(null);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');

  // Manage Members State
  const [manageOpen, setManageOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [allClients, setAllClients] = useState<{value: string, label: string}[]>([]);
  const [groupMembers, setGroupMembers] = useState<string[]>([]); // Array of client IDs

  // FIX: Wrap fetchGroups in useCallback
  const fetchGroups = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('groups')
      .select('*, client_groups(count)')
      .eq('user_id', user.id);

    if (error) console.error(error);
    else {
      // FIX: Use 'unknown' then cast to specific type to avoid explicit 'any'
      const rawData = data as unknown as GroupWithCount[];
      const formatted = rawData.map((g) => ({
        id: g.id,
        name: g.name,
        description: g.description,
        client_count: g.client_groups?.[0]?.count || 0
      }));
      setGroups(formatted);
    }
    setLoading(false);
  }, [user]);

  // FIX: Add dependency
  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

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
    } catch (error: unknown) { // FIX: Use unknown
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

  // --- Manage Members Logic ---
  const openManageMembers = async (group: MarketingGroup) => {
    setSelectedGroupId(group.id);
    setManageOpen(true);
    
    // Fetch all clients for the select dropdown
    const { data: clients } = await supabase.from('clients').select('id, name').eq('user_id', user!.id);
    setAllClients(clients?.map(c => ({ value: c.id, label: c.name })) || []);

    // Fetch current members of this group
    const { data: members } = await supabase
      .from('client_groups')
      .select('client_id')
      .eq('group_id', group.id);
    
    setGroupMembers(members?.map(m => m.client_id) || []);
  };

  const saveMembers = async () => {
    if (!selectedGroupId) return;
    setLoading(true);

    // Simple strategy: Delete all for this group, then re-insert selected
    // (Not efficient for huge lists, but fine for <1000)
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
    fetchGroups(); // Update counts
  };

  return (
    <div className="w-full min-h-screen bg-white dark:bg-gray-900 flex flex-col">
      <DashboardHeader colorScheme="light" toggleColorScheme={() => {}} />
      <div className="flex flex-1">
        <DashboardSidebar />
        <Container size="xl" py="xl" className="flex-1">
           <Group justify="space-between" mb="lg">
            <Title order={2}>Client Groups</Title>
            <Button leftSection={<PlusIcon size={16} />} onClick={() => {
              setEditingGroup(null); setGroupName(''); setGroupDesc(''); setModalOpen(true);
            }}>
              Create Group
            </Button>
          </Group>

          <Paper shadow="sm" p="md" withBorder>
            <LoadingOverlay visible={loading} />
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Group Name</Table.Th>
                  <Table.Th>Description</Table.Th>
                  <Table.Th>Members</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {groups.map((group) => (
                  <Table.Tr key={group.id}>
                    <Table.Td fw={500}>{group.name}</Table.Td>
                    <Table.Td>{group.description}</Table.Td>
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
              </Table.Tbody>
            </Table>
          </Paper>
        </Container>
      </div>

      {/* Create/Edit Modal */}
      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editingGroup ? "Edit Group" : "Create Group"}>
        <TextInput label="Name" required mb="sm" value={groupName} onChange={e => setGroupName(e.target.value)} />
        <TextInput label="Description" mb="sm" value={groupDesc} onChange={e => setGroupDesc(e.target.value)} />
        <Group justify="flex-end" mt="xl">
          <Button onClick={handleSaveGroup}>Save</Button>
        </Group>
      </Modal>

      {/* Manage Members Drawer */}
      <Drawer opened={manageOpen} onClose={() => setManageOpen(false)} title="Manage Group Members" position="right" size="md">
        <Text size="sm" mb="md" c="dimmed">Select clients to include in this group.</Text>
        <MultiSelect
          label="Select Clients"
          placeholder="Pick clients"
          data={allClients}
          value={groupMembers}
          onChange={setGroupMembers}
          searchable
          nothingFoundMessage="No clients found"
          mb="xl"
        />
        <Button fullWidth onClick={saveMembers}>Save Members</Button>
      </Drawer>
    </div>
  );
};

export default Groups;