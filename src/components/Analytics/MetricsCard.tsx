import React from 'react';
// 'Box' dihapus dari import karena tidak digunakan
import { Paper, Text, Group } from '@mantine/core';
import { TrendingUpIcon, TrendingDownIcon } from 'lucide-react';

interface MetricsCardProps {
  title: string;
  value: string;
  change: number;
  trend: 'up' | 'down';
}

const MetricsCard: React.FC<MetricsCardProps> = ({
  title,
  value,
  change,
  trend
}) => {
  return <Paper shadow="sm" p="lg" withBorder>
      {/* 'weight' diubah menjadi 'fw' */}
      <Text size="sm" color="dimmed" fw={500} mb="xs">
        {title}
      </Text>
      {/* 'position' diubah menjadi 'justify' */}
      <Group justify="space-between" align="flex-end">
        {/* 'weight' diubah menjadi 'fw' */}
        <Text size="xl" fw={700}>
          {value}
        </Text>
        {/* 'spacing' diubah menjadi 'gap' */}
        <Group gap={4}>
          {trend === 'up' ? <TrendingUpIcon size={16} className="text-green-500" /> : <TrendingDownIcon size={16} className="text-red-500" />}
          {/* 'weight' diubah menjadi 'fw' */}
          <Text size="sm" fw={600} color={trend === 'up' ? 'green' : 'red'}>
            {Math.abs(change)}%
          </Text>
        </Group>
      </Group>
    </Paper>;
};

export default MetricsCard;