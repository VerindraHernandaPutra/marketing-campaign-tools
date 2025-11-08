import React from 'react';
import { Paper, Text } from '@mantine/core';
// 'Legend' dihapus, 'PieLabelRenderProps' ditambahkan
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, PieLabelRenderProps } from 'recharts';

// Definisikan tipe kustom kita yang *memperluas* tipe bawaan
// Ini memberi tahu TypeScript bahwa tipe kita adalah segalanya dari tipe bawaan PLUS 'percent'
type CustomLabelProps = PieLabelRenderProps & {
  percent: number;
};

const PlatformBreakdown: React.FC = () => {
  const data = [{
    name: 'Facebook',
    value: 35
  }, {
    name: 'Instagram',
    value: 28
  }, {
    name: 'Twitter',
    value: 18
  }, {
    name: 'Email',
    value: 12
  }, {
    name: 'LinkedIn',
    value: 7
  }];
  const COLORS = ['#1877F2', '#E4405F', '#1DA1F2', '#EA4335', '#0A66C2'];

  return <Paper shadow="sm" p="lg" withBorder>
      {/* 'weight' diubah menjadi 'fw' */}
      <Text size="lg" fw={600} mb="md">
        Platform Distribution
      </Text>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie 
            data={data} 
            cx="50%" 
            cy="50%" 
            labelLine={false} 
            // 1. Terima 'props' sebagai tipe bawaan 'PieLabelRenderProps'
            label={(props: PieLabelRenderProps) => {
              // 2. Gunakan type assertion untuk mengakses 'percent' (dan 'name')
              const { name, percent } = props as CustomLabelProps;
              return `${name} ${(percent * 100).toFixed(0)}%`;
            }} 
            outerRadius={80} 
            fill="#8884d8" 
            dataKey="value"
          >
            {/* 'entry' diubah menjadi '_' */}
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </Paper>;
};

export default PlatformBreakdown;