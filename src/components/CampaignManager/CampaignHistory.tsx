import React, { useEffect, useState, useCallback } from 'react';
import { Table, Badge, Paper, Text, Loader, Group, ActionIcon } from '@mantine/core';
import { EditIcon, TrashIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../auth/useAuth';

const CampaignHistory: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
      if(!user) return;
      setLoading(true);
      const { data, error } = await supabase
          .from('marketing_campaigns')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
      
      if(!error && data) setCampaigns(data);
      setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this campaign?')) {
      const { error } = await supabase.from('marketing_campaigns').delete().eq('id', id);
      if (!error) {
        fetchHistory(); 
      } else {
        alert('Error deleting campaign');
      }
    }
  };

  const getStatusColor = (status: string) => {
      switch (status) {
          case 'sent': return 'green';
          case 'scheduled': return 'blue';
          case 'draft': return 'gray';
          case 'failed': return 'red';
          default: return 'gray';
      }
  };

  // Helper to format date and time
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    // Ensures we interpret the UTC string as local time for display
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short', // e.g., Nov
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false // Changed to false for 24h format
    });
  };

  if (loading) return <Loader />;

  return (
    <Paper shadow="sm" p="md" withBorder mt="xl">
      <Text size="lg" fw={600} mb="md">Campaign History</Text>
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Title</Table.Th>
            <Table.Th>Platforms</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Date & Time</Table.Th> 
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {campaigns.map((c) => (
            <Table.Tr key={c.id}>
              <Table.Td fw={500}>{c.title}</Table.Td>
              <Table.Td>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {c.platforms?.map((p: any) => (
                    <Badge key={p} size="sm" variant="outline" mr={4}>{p}</Badge>
                ))}
              </Table.Td>
              <Table.Td>
                 <Badge color={getStatusColor(c.status)}>{c.status?.toUpperCase()}</Badge>
              </Table.Td>
              <Table.Td>
                  {formatDate(c.scheduled_date || c.created_at)}
              </Table.Td>
              <Table.Td>
                <Group gap="xs">
                  <ActionIcon variant="subtle" color="blue" onClick={() => navigate(`/campaign-manager/edit/${c.id}`)}>
                    <EditIcon size={16} />
                  </ActionIcon>
                  <ActionIcon variant="subtle" color="red" onClick={() => handleDelete(c.id)}>
                    <TrashIcon size={16} />
                  </ActionIcon>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
          {campaigns.length === 0 && (
              <Table.Tr><Table.Td colSpan={5} align="center">No campaigns found</Table.Td></Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </Paper>
  );
};

export default CampaignHistory;