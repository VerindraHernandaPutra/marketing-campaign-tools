import React from 'react';
// 'Badge' dihapus dari import karena tidak digunakan
import { Paper, Text, Table, Progress, Group } from '@mantine/core';

const CampaignPerformance: React.FC = () => {
  const campaigns = [{
    id: '1',
    name: 'Summer Sale Campaign',
    reach: 45230,
    engagement: 3420,
    clicks: 1234,
    conversions: 156,
    performance: 85
  }, {
    id: '2',
    name: 'Product Launch',
    reach: 32100,
    engagement: 2890,
    clicks: 987,
    conversions: 98,
    performance: 72
  }, {
    id: '3',
    name: 'Holiday Greetings',
    reach: 28900,
    engagement: 2340,
    clicks: 756,
    conversions: 67,
    performance: 68
  }, {
    id: '4',
    name: 'Newsletter Campaign',
    reach: 19200,
    engagement: 1560,
    clicks: 543,
    conversions: 45,
    performance: 58
  }];

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
      <Table>
        <thead>
          <tr>
            <th>Campaign Name</th>
            <th>Reach</th>
            <th>Engagement</th>
            <th>Clicks</th>
            <th>Conversions</th>
            <th>Performance</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map(campaign => <tr key={campaign.id}>
              <td>
                {/* 'weight' diubah menjadi 'fw' */}
                <Text fw={500}>{campaign.name}</Text>
              </td>
              <td>
                <Text>{campaign.reach.toLocaleString()}</Text>
              </td>
              <td>
                <Text>{campaign.engagement.toLocaleString()}</Text>
              </td>
              <td>
                <Text>{campaign.clicks.toLocaleString()}</Text>
              </td>
              <td>
                <Text>{campaign.conversions}</Text>
              </td>
              <td>
                {/* 'spacing' diubah menjadi 'gap' */}
                <Group gap="xs">
                  <Progress value={campaign.performance} color={getPerformanceColor(campaign.performance)} w={100} />
                  {/* 'weight' diubah menjadi 'fw' */}
                  <Text size="sm" fw={500}>
                    {campaign.performance}%
                  </Text>
                </Group>
              </td>
            </tr>)}
        </tbody>
      </Table>
    </Paper>;
};

export default CampaignPerformance;