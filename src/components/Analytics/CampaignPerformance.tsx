import React from 'react';
// 'Badge' dihapus dari import karena tidak digunakan
import { Paper, Text, Table, Progress, Group, Badge, Stack } from '@mantine/core';

export interface CampaignMetrics {
  id: string;
  name: string;
  platforms?: string[];
  reach: number;
  engagement: number;
  clicks: number;
  conversions: number;
  likes?: number;
  comments?: number;
  shares?: number;
  hasPlatformErrors?: boolean;
  errorCount?: number;
  lastError?: string | null;
  performance: number;
}

interface CampaignPerformanceProps {
  campaigns: CampaignMetrics[];
}

const CampaignPerformance: React.FC<CampaignPerformanceProps> = ({ campaigns }) => {

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'green';
    if (score >= 60) return 'yellow';
    return 'red';
  };

  if (!campaigns || campaigns.length === 0) {
    return (
      <Paper shadow="sm" p="lg" withBorder>
        <Text size="lg" fw={600} mb="md">
          Campaign Performance
        </Text>
        <Text size="sm" c="dimmed">
          No Meta social campaigns found in this period.
        </Text>
      </Paper>
    );
  }

  return <Paper shadow="sm" p="lg" withBorder>
      {/* 'weight' diubah menjadi 'fw' */}
      <Text size="lg" fw={600} mb="md">
        Campaign Performance
      </Text>
      <Table highlightOnHover verticalSpacing="sm" striped mt="md">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Campaign Name</Table.Th>
            <Table.Th>Channel</Table.Th>
            <Table.Th>Reach</Table.Th>
            <Table.Th>Engagement</Table.Th>
            <Table.Th>Likes</Table.Th>
            <Table.Th>Comments</Table.Th>
            <Table.Th>Clicks</Table.Th>
            <Table.Th>Shares</Table.Th>
            <Table.Th>Conversions</Table.Th>
            <Table.Th>Performance</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {campaigns.map(campaign => <Table.Tr key={campaign.id}>
              <Table.Td>
                <Text fw={500} size="sm">{campaign.name}</Text>
                {campaign.hasPlatformErrors && (
                  <Group gap={6} mt={4}>
                    <Badge color="orange" variant="light" size="xs">
                      Platform issue{(campaign.errorCount || 0) > 1 ? 's' : ''}: {campaign.errorCount || 1}
                    </Badge>
                    {campaign.lastError && (
                      <Text size="xs" c="dimmed" truncate style={{ maxWidth: 220 }}>
                        {campaign.lastError}
                      </Text>
                    )}
                  </Group>
                )}
              </Table.Td>
              <Table.Td>
                <Group gap={6} wrap="wrap">
                  {(campaign.platforms || []).length > 0 ? campaign.platforms.map((platform) => (
                    <Badge key={platform} variant="light" size="sm">
                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </Badge>
                  )) : (
                    <Text size="xs" c="dimmed">—</Text>
                  )}
                </Group>
              </Table.Td>
              <Table.Td>
                <Text size="sm">{campaign.reach.toLocaleString()}</Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm">{campaign.engagement.toLocaleString()}</Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm">{(campaign.likes || 0).toLocaleString()}</Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm">{(campaign.comments || 0).toLocaleString()}</Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm">{campaign.clicks.toLocaleString()}</Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm">{(campaign.shares || 0).toLocaleString()}</Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm">{campaign.conversions}</Text>
              </Table.Td>
              <Table.Td>
                <Group gap="xs">
                  <Progress value={campaign.performance} color={getPerformanceColor(campaign.performance)} w={80} size="sm" radius="xl" />
                  <Text size="xs" fw={700} color={getPerformanceColor(campaign.performance)}>
                    {campaign.performance}%
                  </Text>
                </Group>
              </Table.Td>
            </Table.Tr>)}
        </Table.Tbody>
      </Table>
    </Paper>;
};

export default CampaignPerformance;