import React from 'react';
import { Box, Text, TextInput } from '@mantine/core';

interface EmailFlowProps {
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
}

const EmailFlow: React.FC<EmailFlowProps> = ({ data, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...data, [e.currentTarget.name]: e.currentTarget.value });
  };

  return (
    <Box>
      <Text fw={500} mb="md">Email Campaign Configuration</Text>
      <TextInput
        label="Subject Line"
        placeholder="Enter email subject"
        required
        name="subject"
        value={data.subject || ''}
        onChange={handleChange}
      />
      <TextInput
        label="From Address"
        placeholder="sender@example.com"
        required
        mt="md"
        name="fromAddress"
        value={data.fromAddress || ''}
        onChange={handleChange}
      />
    </Box>
  );
};

export default EmailFlow;