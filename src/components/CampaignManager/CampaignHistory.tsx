// [cite: src/components/CampaignManager/CampaignHistory.tsx]
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Table, Badge, Paper, Text, Loader, Group, ActionIcon, TextInput, Select, Pagination, Stack, Progress, Avatar, Tooltip } from '@mantine/core';
import { EditIcon, TrashIcon, SearchIcon, SortAscIcon, ClockIcon, CalendarIcon, UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../auth/useAuth';
import { useUserRole } from '../../auth/UserContext';

interface Campaign {
  id: string;
  title: string;
  platforms: string[];
  status: string;
  created_at: string;
  updated_at?: string;
  scheduled_date: string | null;
  content?: string;
  platform_data?: {
    target_group_id?: string | null;
    media?: string[];
  };
}

const CampaignHistory: React.FC = () => {
  const { user } = useAuth();
  const { currentOrgId } = useUserRole();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);

  // -- Advanced Table States --
  const [searchQuery, setSearchQuery] = useState('');
  const [activePage, setActivePage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<string>('10');
  const [sortBy, setSortBy] = useState<string>('created_desc');

  // Reset pagination
  useEffect(() => {
    setActivePage(1);
  }, [searchQuery, sortBy, itemsPerPage]);

  const reconcileScheduledCampaigns = useCallback(async (rows: Campaign[]) => {
    const nowTs = Date.now();
    const overdue = rows.filter((row) => {
      if (row.status !== 'scheduled' || !row.scheduled_date) return false;
      const dueTs = new Date(row.scheduled_date).getTime();
      return Number.isFinite(dueTs) && dueTs <= nowTs;
    });

    if (overdue.length === 0) return rows;

    const overdueIds = overdue.map((c) => c.id);

    const { error } = await supabase
      .from('marketing_campaigns')
      .update({ status: 'sent' })
      .in('id', overdueIds)
      .eq('status', 'scheduled');

    if (error) return rows;

    const mapped = rows.map((row) =>
      overdueIds.includes(row.id) && row.status === 'scheduled'
        ? { ...row, status: 'sent' }
        : row
    );

    return mapped;
  }, []);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    let query = supabase
      .from('marketing_campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (currentOrgId) {
      query = supabase
        .from('marketing_campaigns')
        .select('*')
        .eq('organization_id', currentOrgId)
        .order('created_at', { ascending: false });
    }

    const { data, error } = await query;
    if (!error && data) {
      const reconciled = await reconcileScheduledCampaigns(data as Campaign[]);
      setCampaigns(reconciled);
    }

    setLoading(false);
  }, [user, currentOrgId, reconcileScheduledCampaigns]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // --- Data Processing ---
  const processedData = useMemo(() => {
    let data = [...campaigns];

    // 1. Search
    if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        data = data.filter(c => 
            c.title.toLowerCase().includes(query) ||
            c.status.toLowerCase().includes(query) ||
            c.platforms?.some(p => p.toLowerCase().includes(query))
        );
    }

    // 2. Sort
    data.sort((a, b) => {
        switch (sortBy) {
            case 'title_asc': return a.title.localeCompare(b.title);
            case 'title_desc': return b.title.localeCompare(a.title);
            case 'status': return a.status.localeCompare(b.status);
            case 'created_asc': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            case 'created_desc': default: 
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
    });

    // 3. Paginate
    const total = data.length;
    const limit = parseInt(itemsPerPage);
    const totalPages = Math.ceil(total / limit);
    const paginated = data.slice((activePage - 1) * limit, activePage * limit);

    return { data: paginated, total, totalPages };
  }, [campaigns, searchQuery, sortBy, activePage, itemsPerPage]);

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
          case 'scheduling': return 'orange';
          case 'draft': return 'gray';
          case 'failed': return 'red';
          default: return 'gray';
      }
  };

  const getChannelColor = (platform: string) => {
    switch (platform) {
      case 'email': return 'blue';
      case 'whatsapp': return 'teal';
      case 'facebook': return 'indigo';
      case 'instagram': return 'pink';
      case 'twitter': return 'cyan';
      case 'linkedin': return 'grape';
      default: return 'gray';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false
    });
  };

  return (
    <Paper shadow="sm" p="md" withBorder mt="xl">
      <Group justify="space-between" mb="md">
        <Text size="lg" fw={600}>Campaign History</Text>
        <Group gap="xs">
            <TextInput 
                placeholder="Search campaigns..." 
                leftSection={<SearchIcon size={14}/>} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.currentTarget.value)}
                w={250}
            />
            <Select 
                data={[
                    { value: 'created_desc', label: 'Newest First' },
                    { value: 'created_asc', label: 'Oldest First' },
                    { value: 'title_asc', label: 'Title (A-Z)' },
                    { value: 'status', label: 'Status' }
                ]}
                value={sortBy}
                onChange={(v) => setSortBy(v || 'created_desc')}
                leftSection={<SortAscIcon size={14}/>}
                w={160}
                allowDeselect={false}
            />
            <Select 
                data={['5', '10', '25', '50']} 
                value={itemsPerPage} 
                onChange={(v) => setItemsPerPage(v || '10')}
                w={80}
                allowDeselect={false}
            />
        </Group>
      </Group>

      {loading ? <Loader /> : (
        <>
        <Table striped highlightOnHover>
            <Table.Thead>
            <Table.Tr>
                <Table.Th>Campaign</Table.Th>
                <Table.Th>Channels</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Schedule</Table.Th>
                <Table.Th>Progress</Table.Th>
                <Table.Th>Actions</Table.Th>
            </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
            {processedData.data.map((c) => (
                <Table.Tr key={c.id}>
                <Table.Td>
                  <Stack gap={4}>
                    <Group gap="xs">
                      <Avatar size={24} radius="xl" color="blue">{(c.title || '?').charAt(0).toUpperCase()}</Avatar>
                      <Text fw={600} size="sm" lineClamp={1}>{c.title || 'Untitled Campaign'}</Text>
                    </Group>
                    <Text size="xs" c="dimmed" lineClamp={1}>{c.content || 'No content preview'}</Text>
                  </Stack>
                </Table.Td>
                <Table.Td>
                  <Group gap={4}>
                    {(c.platforms || []).map((p) => (
                      <Badge key={p} size="xs" variant="light" color={getChannelColor(p)}>
                        {p.toUpperCase()}
                      </Badge>
                    ))}
                  </Group>
                </Table.Td>
                <Table.Td>
                    <Badge color={getStatusColor(c.status)}>{c.status?.toUpperCase()}</Badge>
                </Table.Td>
                <Table.Td>
                  <Stack gap={2}>
                    <Group gap={4}>
                      {c.scheduled_date ? <CalendarIcon size={13} /> : <ClockIcon size={13} />}
                      <Text size="xs">{formatDate(c.scheduled_date || c.created_at)}</Text>
                    </Group>
                    {c.platform_data?.target_group_id && (
                      <Tooltip label="Target audience selected from group">
                        <Group gap={4}><UserIcon size={12} /><Text size="xs" c="dimmed">Audience Group</Text></Group>
                      </Tooltip>
                    )}
                  </Stack>
                </Table.Td>
                <Table.Td>
                  <Progress
                    size="sm"
                    radius="xl"
                    value={c.status === 'sent' ? 100 : c.status === 'scheduled' ? 65 : c.status === 'scheduling' ? 45 : c.status === 'failed' ? 20 : 30}
                    color={c.status === 'sent' ? 'green' : c.status === 'scheduled' ? 'blue' : c.status === 'failed' ? 'red' : 'gray'}
                  />
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
            {processedData.total === 0 && (
              <Table.Tr><Table.Td colSpan={6} align="center">No campaigns found matching search.</Table.Td></Table.Tr>
            )}
            </Table.Tbody>
        </Table>

        {processedData.totalPages > 1 && (
            <Group justify="space-between" mt="lg">
                <Text size="sm" c="dimmed">
                    Showing {(activePage - 1) * parseInt(itemsPerPage) + 1} - {Math.min(activePage * parseInt(itemsPerPage), processedData.total)} of {processedData.total}
                </Text>
                <Pagination total={processedData.totalPages} value={activePage} onChange={setActivePage} color="blue" />
            </Group>
        )}
        </>
      )}
    </Paper>
  );
};

export default CampaignHistory;