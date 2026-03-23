import React from 'react';
// 'Badge' dihapus dari import karena tidak digunakan
import { Paper, Text, Table, Progress, Group } from '@mantine/core';

export interface CampaignMetrics {
  id: string;
  name: string;
  reach: number;
  engagement: number;
  clicks: number;
  conversions: number;
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

  return <Paper shadow="sm" p="lg" withBorder>
      {/* 'weight' diubah menjadi 'fw' */}
      <Text size="lg" fw={600} mb="md">
        Campaign Performance
      </Text>
      <Table highlightOnHover verticalSpacing="sm" striped mt="md">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Campaign Name</Table.Th>
            <Table.Th>Reach</Table.Th>
            <Table.Th>Engagement</Table.Th>
            <Table.Th>Clicks</Table.Th>
            <Table.Th>Conversions</Table.Th>
            <Table.Th>Performance</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {campaigns.map(campaign => <Table.Tr key={campaign.id}>
              <Table.Td>
                <Text fw={500} size="sm">{campaign.name}</Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm">{campaign.reach.toLocaleString()}</Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm">{campaign.engagement.toLocaleString()}</Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm">{campaign.clicks.toLocaleString()}</Text>
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