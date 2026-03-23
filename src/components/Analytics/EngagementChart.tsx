import React from 'react';
import { Paper, Text } from '@mantine/core';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export interface EngagementData {
  date: string;
  reach: number;
  engagement: number;
  clicks: number;
}

interface EngagementChartProps {
  data: EngagementData[];
}

const EngagementChart: React.FC<EngagementChartProps> = ({ data }) => {

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