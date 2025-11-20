import React from 'react';
import { Paper, Text, TextInput, Group, ThemeIcon } from '@mantine/core';
import { MailIcon } from 'lucide-react';

// FIX: Define a specific interface for Email data instead of Record<string, any>
interface EmailData {
  subject?: string;
  fromAddress?: string;
  [key: string]: unknown; // Allow other properties safely
}

interface EmailFlowProps {
  data: EmailData;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (data: any) => void; 
}

const EmailFlow: React.FC<EmailFlowProps> = ({ data, onChange }) => {
  return (
    <Paper shadow="xs" p="md" withBorder radius="md" mb="md">
      <Group mb="md">
        <ThemeIcon color="blue" variant="light" size="lg">
          <MailIcon size={20} />
        </ThemeIcon>
        <div>
            <Text fw={600} size="sm" c="blue">Email Configuration</Text>
            <Text size="xs" c="dimmed">Set up your email sender and subject</Text>
        </div>
      </Group>
      
      <TextInput
        label="Subject Line"
        placeholder="Enter email subject"
        required
        variant="filled"
        name="subject"
        value={data.subject || ''}
        onChange={(e) => onChange({ ...data, subject: e.currentTarget.value })}
        mb="sm"
      />
      <TextInput
        label="From Address"
        placeholder="sender@example.com"
        required
        variant="filled"
        name="fromAddress"
        value={data.fromAddress || ''}
        onChange={(e) => onChange({ ...data, fromAddress: e.currentTarget.value })}
      />
    </Paper>
  );
};

export default EmailFlow;