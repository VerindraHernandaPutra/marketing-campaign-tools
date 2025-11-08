import React from 'react';
// 'Box' dan 'Avatar' dihapus dari import
import { Paper, Text, Group, Badge, ActionIcon, Menu, Table } from '@mantine/core';
import { MoreVerticalIcon, EditIcon, TrashIcon, EyeIcon, CalendarIcon } from 'lucide-react';

const CampaignList: React.FC = () => {
  const mockCampaigns = [{
    id: '1',
    title: 'Summer Sale Campaign',
    platforms: ['facebook', 'instagram', 'email'],
    scheduledDate: '2024-01-15 10:00 AM',
    status: 'scheduled'
  }, {
    id: '2',
    title: 'Product Launch Announcement',
    platforms: ['whatsapp', 'twitter', 'linkedin'],
    scheduledDate: '2024-01-16 02:00 PM',
    status: 'scheduled'
  }, {
    id: '3',
    title: 'Holiday Greetings',
    platforms: ['email', 'facebook'],
    scheduledDate: '2024-01-10 09:00 AM',
    status: 'completed'
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: 'blue',
      completed: 'green',
      draft: 'gray',
      failed: 'red'
    };
    return colors[status] || 'gray';
  };

  return <Paper shadow="sm" p="xl">
      {/* 'weight' diubah menjadi 'fw' */}
      <Text size="lg" fw={600} mb="md">
        Campaign List
      </Text>
      <Table>
        <thead>
          <tr>
            <th>Campaign Title</th>
            <th>Platforms</th>
            <th>Scheduled Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {mockCampaigns.map(campaign => <tr key={campaign.id}>
              <td>
                {/* 'weight' diubah menjadi 'fw' */}
                <Text fw={500}>{campaign.title}</Text>
              </td>
              <td>
                {/* 'spacing' diubah menjadi 'gap' */}
                <Group gap="xs">
                  {campaign.platforms.map(platform => <Badge key={platform} color={getPlatformColor(platform)} size="sm" variant="dot">
                      {platform}
                    </Badge>)}
                </Group>
              </td>
              <td>
                {/* 'spacing' diubah menjadi 'gap' */}
                <Group gap="xs">
                  <CalendarIcon size={14} />
                  <Text size="sm">{campaign.scheduledDate}</Text>
                </Group>
              </td>
              <td>
                <Badge color={getStatusColor(campaign.status)} variant="light">
                  {campaign.status}
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
                    <Menu.Item leftSection={<EyeIcon size={14} />}>
                      View Details
                    </Menu.Item>
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

export default CampaignList;