import React, { useState } from 'react';
// 'Box' dihapus dari import karena tidak terpakai
import { Paper, Table, Badge, Group, ActionIcon, Menu, Text, Select, TextInput } from '@mantine/core';
import { MoreVerticalIcon, EditIcon, TrashIcon, SearchIcon, CalendarIcon } from 'lucide-react';

const ScheduledList: React.FC = () => {
  const [platformFilter, setPlatformFilter] = useState<string | null>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const scheduledPosts = [{
    id: '1',
    title: 'Summer Sale Campaign',
    platform: 'facebook',
    scheduledDate: '2024-01-15 10:00 AM',
    status: 'scheduled',
    content: 'Check out our amazing summer deals!'
  }, {
    id: '2',
    title: 'Product Launch',
    platform: 'instagram',
    scheduledDate: '2024-01-16 02:00 PM',
    status: 'scheduled',
    content: 'Introducing our latest product line...'
  }, {
    id: '3',
    title: 'Weekly Newsletter',
    platform: 'email',
    scheduledDate: '2024-01-18 09:00 AM',
    status: 'scheduled',
    content: 'Your weekly update from our team'
  }, {
    id: '4',
    title: 'Community Update',
    platform: 'twitter',
    scheduledDate: '2024-01-20 04:00 PM',
    status: 'scheduled',
    content: 'Exciting news coming soon!'
  }];
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
  return <Paper shadow="sm" p="xl">
      {/* 'position' diubah menjadi 'justify' */}
      <Group justify="space-between" mb="md">
        {/* 'icon' diubah menjadi 'leftSection' */}
        <TextInput placeholder="Search posts..." leftSection={<SearchIcon size={16} />} value={searchQuery} onChange={e => setSearchQuery(e.currentTarget.value)} w={300} />
        <Select placeholder="Filter by platform" value={platformFilter} onChange={setPlatformFilter} data={[{
        value: 'all',
        label: 'All Platforms'
      }, {
        value: 'facebook',
        label: 'Facebook'
      }, {
        value: 'instagram',
        label: 'Instagram'
      }, {
        value: 'twitter',
        label: 'Twitter'
      }, {
        value: 'email',
        label: 'Email'
      }, {
        value: 'whatsapp',
        label: 'WhatsApp'
      }, {
        value: 'linkedin',
        label: 'LinkedIn'
      }]} w={200} />
      </Group>
      <Table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Platform</th>
            <th>Content Preview</th>
            <th>Scheduled Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {scheduledPosts.map(post => <tr key={post.id}>
              <td>
                {/* 'weight' diubah menjadi 'fw' */}
                <Text fw={500}>{post.title}</Text>
              </td>
              <td>
                <Badge color={getPlatformColor(post.platform)} variant="light">
                  {post.platform}
                </Badge>
              </td>
              <td>
                <Text size="sm" color="dimmed" lineClamp={1}>
                  {post.content}
                </Text>
              </td>
              <td>
                {/* 'spacing' diubah menjadi 'gap' */}
                <Group gap="xs">
                  <CalendarIcon size={14} />
                  <Text size="sm">{post.scheduledDate}</Text>
                </Group>
              </td>
              <td>
                <Badge color="blue" variant="dot">
                  {post.status}
                </Badge>
              </td>
              <td>
                <Menu shadow="md" width={200}>
                  <Menu.Target>
                    <ActionIcon variant="subtle">
                      <MoreVerticalIcon size={16} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item leftSection={<EditIcon size={14} />}>
                      Edit
                    </Menu.Item>
                    <Menu.Divider />
                    <Menu.Item leftSection={<TrashIcon size={14} />} color="red">
                      Delete
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </td>
            </tr>)}
        </tbody>
      </Table>
    </Paper>;
};

export default ScheduledList;