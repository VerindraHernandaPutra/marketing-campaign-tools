import React from 'react';
import { Paper, Text } from '@mantine/core';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const EngagementChart: React.FC = () => {
  const data = [{
    date: 'Jan 1',
    reach: 4000,
    engagement: 2400,
    clicks: 1200
  }, {
    date: 'Jan 3',
    reach: 3000,
    engagement: 1398,
    clicks: 980
  }, {
    date: 'Jan 5',
    reach: 2000,
    engagement: 9800,
    clicks: 1500
  }, {
    date: 'Jan 7',
    reach: 2780,
    engagement: 3908,
    clicks: 1800
  }, {
    date: 'Jan 9',
    reach: 1890,
    engagement: 4800,
    clicks: 1400
  }, {
    date: 'Jan 11',
    reach: 2390,
    engagement: 3800,
    clicks: 1600
  }, {
    date: 'Jan 13',
    reach: 3490,
    engagement: 4300,
    clicks: 2100
  }];

  return <Paper shadow="sm" p="lg" withBorder>
      {/* 'weight' diubah menjadi 'fw' */}
      <Text size="lg" fw={600} mb="md">
        Engagement Over Time
      </Text>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="reach" stroke="#8884d8" strokeWidth={2} />
          <Line type="monotone" dataKey="engagement" stroke="#82ca9d" strokeWidth={2} />
          <Line type="monotone" dataKey="clicks" stroke="#ffc658" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </Paper>;
};

export default EngagementChart;