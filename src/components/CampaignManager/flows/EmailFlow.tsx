import React from 'react';
import { Box, Text, TextInput } from '@mantine/core';

interface EmailFlowProps {
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
}

const EmailFlow: React.FC<EmailFlowProps> = ({ data, onChange }) => {
  return (
    <Box mb="md">
      <Text fw={500} mb="md">Email Campaign Configuration</Text>
      <TextInput
        label="Subject Line"
        placeholder="Enter email subject"
        required
        name="subject"
        value={data.subject || ''}
        onChange={(e) => onChange({ ...data, subject: e.currentTarget.value })}
      />
      <TextInput
        label="From Address"
        placeholder="sender@example.com"
        required
        mt="md"
        name="fromAddress"
        value={data.fromAddress || ''}
        onChange={(e) => onChange({ ...data, fromAddress: e.currentTarget.value })}
      />
    </Box>
  );
};

export default EmailFlow;