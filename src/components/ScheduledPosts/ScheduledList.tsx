import React, { useState, useEffect, useCallback } from 'react';
import { 
  Paper, Group, Select, TextInput, Loader, SimpleGrid, 
  Text, Box, SegmentedControl, Tooltip, Table, Badge, ActionIcon, Menu, Center
} from '@mantine/core';
import { 
  SearchIcon, GridIcon, ListIcon, MoreVerticalIcon, 
  EditIcon, TrashIcon, CalendarIcon 
} from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../auth/useAuth';
import { useNavigate } from 'react-router-dom';
import DesignCard from '../Dashboard/DesignCard';

interface ScheduledPost {
  id: string;
  title: string;
  platforms: string[];
  scheduled_date: string;
  status: string;
  content: string;
  platform_data?: {
    media?: string[];
  };
  updated_at?: string;
}

const ScheduledList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [platformFilter, setPlatformFilter] = useState<string | null>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const fetchPosts = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('marketing_campaigns')
      .select('*')
      .eq('user_id', user.id)
      .not('scheduled_date', 'is', null)
      .order('scheduled_date', { ascending: true });

    if (error) {
      console.error('Error fetching scheduled posts:', error);
    } else if (data) {
      setPosts(data);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to cancel this scheduled post?')) {
      const { error } = await supabase.from('marketing_campaigns').delete().eq('id', id);
      if (!error) fetchPosts();
    }
  };

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      whatsapp: 'green',
      email: 'red',
      facebook: 'blue',
      instagram: 'pink',
      twitter: 'cyan',
      linkedin: 'indigo'
    };
    return colors[platform] || 'gray';
  };

  const getStatusColor = (status: string) => {
     if (status === 'sent') return 'green';
     if (status === 'failed') return 'red';
     return 'blue'; // scheduled
  };

  // Client-side filtering
  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          post.content?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlatform = platformFilter === 'all' || !platformFilter || post.platforms?.includes(platformFilter);
    
    return matchesSearch && matchesPlatform;
  });

  return (
    <Box>
      <Group justify="space-between" mb="lg">
        <Group>
            <TextInput 
            placeholder="Search scheduled posts..." 
            leftSection={<SearchIcon size={16} />} 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.currentTarget.value)} 
            w={300} 
            />
            <Select 
            placeholder="Filter by platform" 
            value={platformFilter} 
            onChange={setPlatformFilter} 
            data={[
                { value: 'all', label: 'All Platforms' },
                { value: 'facebook', label: 'Facebook' },
                { value: 'instagram', label: 'Instagram' },
                { value: 'twitter', label: 'Twitter' },
                { value: 'email', label: 'Email' },
                { value: 'whatsapp', label: 'WhatsApp' },
                { value: 'linkedin', label: 'LinkedIn' }
            ]} 
            w={200} 
            />
        </Group>

        <SegmentedControl 
            value={viewMode}
            onChange={(val) => setViewMode(val as 'grid' | 'list')}
            data={[
                { label: <Tooltip label="Grid View"><GridIcon size={16}/></Tooltip>, value: 'grid' },
                { label: <Tooltip label="List View"><ListIcon size={16}/></Tooltip>, value: 'list' },
            ]}
        />
      </Group>

      {loading ? (
        <Center h={200}><Loader /></Center>
      ) : (
        <>
          {filteredPosts.length === 0 ? (
            <Text c="dimmed" ta="center" mt="xl">No scheduled posts found.</Text>
          ) : (
            viewMode === 'grid' ? (
                // GRID VIEW
                <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="lg">
                {filteredPosts.map(post => {
                    const thumbnail = post.platform_data?.media?.[0] || null;
                    const statusTag = post.status.charAt(0).toUpperCase() + post.status.slice(1);
                    const platformTags = post.platforms.map(p => p.charAt(0).toUpperCase() + p.slice(1));
                    const tags = [statusTag, ...platformTags];

                    return (
                    <DesignCard 
                        key={post.id}
                        design={{
                        id: post.id,
                        title: post.title,
                        thumbnail: thumbnail,
                        updated_at: post.scheduled_date,
                        canvas_data: null,
                        tags: tags
                        }}
                        isTemplate={false}
                        onRefresh={fetchPosts}
                    />
                    );
                })}
                </SimpleGrid>
            ) : (
                // TABLE VIEW
                <Paper shadow="sm" withBorder>
                    <Table striped highlightOnHover verticalSpacing="sm">
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Campaign Title</Table.Th>
                                <Table.Th>Platforms</Table.Th>
                                <Table.Th>Scheduled For</Table.Th>
                                <Table.Th>Status</Table.Th>
                                <Table.Th align="right">Actions</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {filteredPosts.map(post => (
                                <Table.Tr key={post.id}>
                                    <Table.Td>
                                        <Text fw={500}>{post.title}</Text>
                                        <Text size="xs" c="dimmed" lineClamp={1}>{post.content}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Group gap="xs">
                                            {post.platforms && post.platforms.map(p => (
                                                <Badge key={p} color={getPlatformColor(p)} variant="light" size="sm">
                                                {p}
                                                </Badge>
                                            ))}
                                        </Group>
                                    </Table.Td>
                                    <Table.Td>
                                        <Group gap="xs">
                                            <CalendarIcon size={14} />
                                            <Text size="sm">{new Date(post.scheduled_date).toLocaleString()}</Text>
                                        </Group>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge color={getStatusColor(post.status)} variant="dot">
                                            {post.status?.toUpperCase()}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Group justify="flex-end">
                                            <Menu shadow="md" width={200}>
                                                <Menu.Target>
                                                    <ActionIcon variant="subtle" color="gray">
                                                        <MoreVerticalIcon size={16} />
                                                    </ActionIcon>
                                                </Menu.Target>
                                                <Menu.Dropdown>
                                                    <Menu.Item leftSection={<EditIcon size={14} />} onClick={() => navigate(`/campaign-manager/edit/${post.id}`)}>
                                                        Edit Campaign
                                                    </Menu.Item>
                                                    <Menu.Divider />
                                                    <Menu.Item leftSection={<TrashIcon size={14} />} color="red" onClick={() => handleDelete(post.id)}>
                                                        Delete
                                                    </Menu.Item>
                                                </Menu.Dropdown>
                                            </Menu>
                                        </Group>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                </Paper>
            )
          )}
        </>
      )}
    </Box>
  );
};

export default ScheduledList;