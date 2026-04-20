import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Button,
  Table,
  Group,
  TextInput,
  Modal,
  ActionIcon,
  Select,
  LoadingOverlay,
  Paper,
  Pagination,
  Text,
  Stack,
  ThemeIcon,
  Badge,
  Tooltip
} from '@mantine/core';
import { PlusIcon, EditIcon, TrashIcon, SearchIcon, SortAscIcon, PhoneIcon, MailIcon, MapPinIcon, UsersIcon } from 'lucide-react';
import { supabase } from '../supabaseClient';
import PageShell from '../components/Dashboard/PageShell';
import PageHeader from '../components/Dashboard/PageHeader';
import { useAuth } from '../auth/useAuth';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  instagram?: string;
  facebook?: string;
  created_at?: string;
}

const Clients: React.FC = () => {
  const { user } = useAuth();
  
  // -- Advanced Table States --
  const [searchQuery, setSearchQuery] = useState('');
  const [activePage, setActivePage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<string>('10');
  const [sortBy, setSortBy] = useState<string>('created_desc');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<Partial<Client>>({});

  const { data: clients = [], isLoading: loading, refetch: fetchClients } = useQuery({
    queryKey: ['clients', user?.id],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Client[];
    },
  });

  // Reset pagination when filters/sort change
  useEffect(() => {
    setActivePage(1);
  }, [searchQuery, sortBy, itemsPerPage]);

  // --- Data Processing (Search, Sort, Pagination) ---
  const processedClients = useMemo(() => {
    let data = [...clients];

    // 1. Search
    if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        data = data.filter(c => 
            c.name.toLowerCase().includes(query) ||
            c.email?.toLowerCase().includes(query) ||
            c.country?.toLowerCase().includes(query) ||
            c.phone?.includes(query)
        );
    }

    // 2. Sort
    data.sort((a, b) => {
        switch (sortBy) {
            case 'name_asc': return a.name.localeCompare(b.name);
            case 'name_desc': return b.name.localeCompare(a.name);
            case 'country_asc': return (a.country || '').localeCompare(b.country || '');
            case 'country_desc': return (b.country || '').localeCompare(a.country || '');
            case 'created_asc': return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
            case 'created_desc': default: 
                return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        }
    });

    // 3. Paginate
    const total = data.length;
    const limit = parseInt(itemsPerPage);
    const totalPages = Math.ceil(total / limit);
    const start = (activePage - 1) * limit;
    const end = start + limit;
    const paginatedData = data.slice(start, end);

    return { data: paginatedData, total, totalPages };
  }, [clients, searchQuery, sortBy, activePage, itemsPerPage]);


  // --- Actions ---
  const handleSubmit = async () => {
    if (!user || !formData.name) return;

    try {
      if (editingClient) {
        const { error } = await supabase
          .from('clients')
          .update(formData)
          .eq('id', editingClient.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('clients')
          .insert([{ ...formData, user_id: user.id }]);
        if (error) throw error;
      }
      setModalOpen(false);
      fetchClients();
      setFormData({});
      setEditingClient(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      alert('Error saving client: ' + message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this client?')) return;
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) alert(error.message);
    else fetchClients();
  };

  const openModal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData(client);
    } else {
      setEditingClient(null);
      setFormData({});
    }
    setModalOpen(true);
  };

  return (
    <PageShell>
      <PageHeader
        icon={<UsersIcon size={22} />}
        title="Clients"
        subtitle="Manage your customer database"
        gradient={{ from: 'blue', to: 'violet' }}
        action={
          <Button leftSection={<PlusIcon size={16} />} variant="gradient" gradient={{ from: 'blue', to: 'violet' }} onClick={() => openModal()}>
            Add Client
          </Button>
        }
      />
      <Paper shadow="xs" p="md" withBorder>
            <LoadingOverlay visible={loading} />

             {/* --- Table Controls --- */}
             <Group justify="space-between" mb="md">
                <Group gap="xs">
                    <TextInput
                        placeholder="Search clients..."
                        leftSection={<SearchIcon size={14} />}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.currentTarget.value)}
                        w={250}
                    />
                    <Select 
                        data={[
                            { value: 'created_desc', label: 'Newest First' },
                            { value: 'created_asc', label: 'Oldest First' },
                            { value: 'name_asc', label: 'Name (A-Z)' },
                            { value: 'name_desc', label: 'Name (Z-A)' },
                            { value: 'country_asc', label: 'Country (A-Z)' },
                            { value: 'country_desc', label: 'Country (Z-A)' },
                        ]}
                        value={sortBy}
                        onChange={(v) => setSortBy(v || 'created_desc')}
                        leftSection={<SortAscIcon size={14} />}
                        w={180}
                        allowDeselect={false}
                    />
                    <Select 
                        data={['5', '10', '25', '50']} 
                        value={itemsPerPage} 
                        onChange={(v) => setItemsPerPage(v || '10')}
                        w={80}
                        allowDeselect={false}
                        leftSection={<Text size="xs" c="dimmed">Show</Text>}
                    />
                </Group>
                <Text size="sm" c="dimmed">
                    Total: <b>{processedClients.total}</b>
                </Text>
            </Group>

            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Contact Info</Table.Th>
                  <Table.Th>Country</Table.Th>
                  <Table.Th>Socials</Table.Th>
                  <Table.Th align="right">Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {processedClients.data.map((client) => (
                  <Table.Tr key={client.id}>
                    <Table.Td>
                        <Text fw={600} size="sm">{client.name}</Text>
                        <Text size="xs" c="dimmed">ID: {client.id.substring(0,6)}</Text>
                    </Table.Td>
                    <Table.Td>
                        <Stack gap={2}>
                            {client.email && (
                                <Group gap={6}>
                                    <MailIcon size={12} className="text-gray-400" />
                                    <Text size="sm">{client.email}</Text>
                                </Group>
                            )}
                            {client.phone && (
                                <Group gap={6}>
                                    <PhoneIcon size={12} className="text-gray-400" />
                                    <Text size="sm">{client.phone}</Text>
                                </Group>
                            )}
                            {!client.email && !client.phone && <Text size="sm" c="dimmed">-</Text>}
                        </Stack>
                    </Table.Td>
                    <Table.Td>
                        {/* FIX: Improved UI for Country - cleaner Badge style */}
                        {client.country ? (
                            <Badge 
                                variant="light" 
                                color="gray" 
                                size="sm" 
                                radius="sm"
                                leftSection={<MapPinIcon size={12} style={{ marginTop: 2 }} />}
                                styles={{ root: { textTransform: 'none', fontWeight: 500 } }}
                            >
                                {client.country}
                            </Badge>
                        ) : <Text size="sm" c="dimmed">-</Text>}
                    </Table.Td>
                    <Table.Td>
                        <Group gap={4}>
                            {client.instagram && (
                                <Tooltip label={`Instagram: ${client.instagram}`}>
                                    <ThemeIcon variant="light" color="pink" size="sm" radius="xl">
                                        <Text size="xs" fw={700}>IG</Text>
                                    </ThemeIcon>
                                </Tooltip>
                            )}
                            {client.facebook && (
                                <Tooltip label={`Facebook: ${client.facebook}`}>
                                    <ThemeIcon variant="light" color="blue" size="sm" radius="xl">
                                        <Text size="xs" fw={700}>FB</Text>
                                    </ThemeIcon>
                                </Tooltip>
                            )}
                            {!client.instagram && !client.facebook && <Text size="sm" c="dimmed">-</Text>}
                        </Group>
                    </Table.Td>
                    <Table.Td align="right">
                      <Group justify="flex-end" gap="xs">
                        <ActionIcon variant="light" color="blue" onClick={() => openModal(client)}>
                          <EditIcon size={16} />
                        </ActionIcon>
                        <ActionIcon variant="light" color="red" onClick={() => handleDelete(client.id)}>
                          <TrashIcon size={16} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {processedClients.total === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={5} align="center" style={{ height: 120 }}>
                        <Text c="dimmed">No clients found matching your search.</Text>
                        {searchQuery && <Button variant="subtle" size="xs" onClick={() => setSearchQuery('')} mt="xs">Clear Search</Button>}
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
            
            {/* --- Pagination --- */}
            {processedClients.totalPages > 1 && (
                <Group justify="space-between" mt="lg">
                    <Text size="sm" c="dimmed">
                        Showing {(activePage - 1) * parseInt(itemsPerPage) + 1} - {Math.min(activePage * parseInt(itemsPerPage), processedClients.total)} of {processedClients.total}
                    </Text>
                    <Pagination 
                        total={processedClients.totalPages} 
                        value={activePage} 
                        onChange={setActivePage} 
                        color="blue" 
                    />
                </Group>
            )}

      </Paper>

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editingClient ? "Edit Client" : "Add New Client"}>
        <Stack gap="sm">
            <TextInput 
              label="Name" 
              required 
              placeholder="e.g. John Doe or Acme Corp"
              value={formData.name || ''}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
            <TextInput 
              label="Email" 
              placeholder="client@email.com"
              leftSection={<MailIcon size={14} />}
              value={formData.email || ''}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
            <TextInput 
              label="Phone (WhatsApp)" 
              placeholder="+62812..." 
              leftSection={<PhoneIcon size={14} />}
              value={formData.phone || ''}
              onChange={e => setFormData({...formData, phone: e.target.value})}
            />
            <Select 
              label="Country"
              placeholder="Select country"
              data={['Indonesia', 'USA', 'Singapore', 'Malaysia', 'United Kingdom', 'Other']}
              value={formData.country || ''}
              onChange={val => setFormData({...formData, country: val || ''})}
              searchable
            />
            
            <Text size="sm" fw={500} mt="xs">Social Handles</Text>
            <Group grow>
                <TextInput 
                  placeholder="@instagram" 
                  value={formData.instagram || ''}
                  onChange={e => setFormData({...formData, instagram: e.target.value})}
                />
                <TextInput 
                  placeholder="Facebook Name/URL" 
                  value={formData.facebook || ''}
                  onChange={e => setFormData({...formData, facebook: e.target.value})}
                />
            </Group>

            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit}>Save Client</Button>
            </Group>
        </Stack>
      </Modal>
    </PageShell>
  );
};

export default Clients;