import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Title,
  Button,
  Table,
  Group,
  TextInput,
  Modal,
  ActionIcon,
  Select,
  LoadingOverlay,
  Paper
} from '@mantine/core';
import { PlusIcon, EditIcon, TrashIcon, SearchIcon } from 'lucide-react';
import { supabase } from '../supabaseClient';
import DashboardHeader from '../components/Dashboard/DashboardHeader';
import DashboardSidebar from '../components/Dashboard/DashboardSidebar';
import { useAuth } from '../auth/useAuth';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  instagram?: string;
  facebook?: string;
}

const Clients: React.FC = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<Partial<Client>>({});

  // FIX: Wrap fetchClients in useCallback to safely include in useEffect dependency array
  const fetchClients = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) console.error(error);
    else setClients(data || []);
    setLoading(false);
  }, [user]);

  // FIX: Include fetchClients in dependency array
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleSubmit = async () => {
    if (!user || !formData.name) return;
    setLoading(true);

    try {
      if (editingClient) {
        // Update
        const { error } = await supabase
          .from('clients')
          .update(formData)
          .eq('id', editingClient.id);
        if (error) throw error;
      } else {
        // Create
        const { error } = await supabase
          .from('clients')
          .insert([{ ...formData, user_id: user.id }]);
        if (error) throw error;
      }
      setModalOpen(false);
      fetchClients();
      setFormData({});
      setEditingClient(null);
    } catch (error: unknown) { // FIX: Type error as unknown
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      alert('Error saving client: ' + message);
    } finally {
      setLoading(false);
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

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full min-h-screen bg-white dark:bg-gray-900 flex flex-col">
       <DashboardHeader colorScheme="light" toggleColorScheme={() => {}} />
       <div className="flex flex-1">
        <DashboardSidebar />
        <Container size="xl" py="xl" className="flex-1">
          <Group justify="space-between" mb="lg">
            <Title order={2}>Clients</Title>
            <Button leftSection={<PlusIcon size={16} />} onClick={() => openModal()}>
              Add Client
            </Button>
          </Group>

          <TextInput
            placeholder="Search clients..."
            leftSection={<SearchIcon size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            mb="md"
          />

          <Paper shadow="sm" p="md" withBorder>
            <LoadingOverlay visible={loading} />
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Email</Table.Th>
                  <Table.Th>Phone</Table.Th>
                  <Table.Th>Country</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredClients.map((client) => (
                  <Table.Tr key={client.id}>
                    <Table.Td>{client.name}</Table.Td>
                    <Table.Td>{client.email}</Table.Td>
                    <Table.Td>{client.phone}</Table.Td>
                    <Table.Td>{client.country}</Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <ActionIcon variant="subtle" color="blue" onClick={() => openModal(client)}>
                          <EditIcon size={16} />
                        </ActionIcon>
                        <ActionIcon variant="subtle" color="red" onClick={() => handleDelete(client.id)}>
                          <TrashIcon size={16} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {filteredClients.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={5} align="center">No clients found</Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Paper>
        </Container>
      </div>

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editingClient ? "Edit Client" : "Add New Client"}>
        <TextInput 
          label="Name" required mb="sm"
          value={formData.name || ''}
          onChange={e => setFormData({...formData, name: e.target.value})}
        />
        <TextInput 
          label="Email" mb="sm"
          value={formData.email || ''}
          onChange={e => setFormData({...formData, email: e.target.value})}
        />
        <TextInput 
          label="Phone (WhatsApp)" mb="sm" placeholder="+62..."
          value={formData.phone || ''}
          onChange={e => setFormData({...formData, phone: e.target.value})}
        />
        <Select 
          label="Country" mb="sm"
          data={['Indonesia', 'USA', 'Singapore', 'Malaysia', 'Other']}
          value={formData.country || ''}
          onChange={val => setFormData({...formData, country: val || ''})}
        />
        <TextInput 
          label="Instagram" mb="sm"
          value={formData.instagram || ''}
          onChange={e => setFormData({...formData, instagram: e.target.value})}
        />
        <Group justify="flex-end" mt="xl">
          <Button variant="default" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>Save</Button>
        </Group>
      </Modal>
    </div>
  );
};

export default Clients;