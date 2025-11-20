import React, { useState, useEffect, useCallback } from 'react';
import { Paper, Table, Badge, Group, ActionIcon, Menu, Text, Select, TextInput, Loader } from '@mantine/core';
import { MoreVerticalIcon, EditIcon, TrashIcon, SearchIcon, CalendarIcon } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../auth/useAuth';
import { useNavigate } from 'react-router-dom';

interface ScheduledPost {
  id: string;
  title: string;
  platforms: string[];
  scheduled_date: string;
  status: string;
  content: string;
}

const ScheduledList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [platformFilter, setPlatformFilter] = useState<string | null>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // FIX: Wrap fetchPosts in useCallback
  const fetchPosts = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // FIX: Use const for query as it is not reassigned
    const query = supabase
      .from('marketing_campaigns')
      .select('*')
      .eq('user_id', user.id)
      .not('scheduled_date', 'is', null)
      .order('scheduled_date', { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching scheduled posts:', error);
    } else if (data) {
      setPosts(data);
    }
    setLoading(false);
  }, [user]);

  // FIX: Add fetchPosts to dependency array
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
    <Paper shadow="sm" p="xl">
      <Group justify="space-between" mb="md">
        <TextInput 
          placeholder="Search posts..." 
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

      {loading ? (
        <Group justify="center" py="xl"><Loader /></Group>
      ) : (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Title</Table.Th>
              <Table.Th>Platforms</Table.Th>
              <Table.Th>Content Preview</Table.Th>
              <Table.Th>Scheduled Date</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredPosts.map(post => (
              <Table.Tr key={post.id}>
                <Table.Td fw={500}>{post.title}</Table.Td>
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
                  <Text size="sm" c="dimmed" lineClamp={1}>
                    {post.content}
                  </Text>
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
                  <Menu shadow="md" width={200}>
                    <Menu.Target>
                      <ActionIcon variant="subtle">
                        <MoreVerticalIcon size={16} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item leftSection={<EditIcon size={14} />} onClick={() => navigate(`/campaign-manager/edit/${post.id}`)}>
                        Edit
                      </Menu.Item>
                      <Menu.Divider />
                      <Menu.Item leftSection={<TrashIcon size={14} />} color="red" onClick={() => handleDelete(post.id)}>
                        Delete
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Table.Td>
              </Table.Tr>
            ))}
            {filteredPosts.length === 0 && (
                 <Table.Tr><Table.Td colSpan={6} align="center">No scheduled posts found</Table.Td></Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      )}
    </Paper>
  );
};

export default ScheduledList;