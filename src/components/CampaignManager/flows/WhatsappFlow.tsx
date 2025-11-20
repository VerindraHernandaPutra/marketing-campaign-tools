import React from 'react';
import { Paper, Text, TextInput, Group, ThemeIcon } from '@mantine/core';
import { MessageCircleIcon } from 'lucide-react';

// Define a specific interface for WhatsApp data
interface WhatsappData {
  ctaLink?: string;
  [key: string]: unknown;
}

interface WhatsappFlowProps {
  data: WhatsappData;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (data: any) => void;
}

const WhatsappFlow: React.FC<WhatsappFlowProps> = ({ data, onChange }) => {
  return (
    <Paper shadow="xs" p="md" withBorder radius="md" mb="md">
      <Group mb="md">
        <ThemeIcon color="blue" variant="light" size="lg">
          <MessageCircleIcon size={20} />
        </ThemeIcon>
        <div>
            <Text fw={600} size="sm" c="blue">WhatsApp Configuration</Text>
            <Text size="xs" c="dimmed">Customize your message link</Text>
        </div>
      </Group>

      <TextInput
        label="Call-to-Action Link"
        placeholder="https://example.com"
        description="Optional: Add a link to your website or product."
        variant="filled"
        value={data.ctaLink || ''}
        onChange={(e) => onChange({ ...data, ctaLink: e.currentTarget.value })}
      />
    </Paper>
  );
};

export default WhatsappFlow;