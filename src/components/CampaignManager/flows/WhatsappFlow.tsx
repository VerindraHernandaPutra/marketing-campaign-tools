import React from 'react';
import { Box, Text, TextInput } from '@mantine/core';

interface WhatsappFlowProps {
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
}

const WhatsappFlow: React.FC<WhatsappFlowProps> = ({ data, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...data, ctaLink: e.currentTarget.value });
  };

  return (
    <Box>
      <Text fw={500} mb="md">WhatsApp Campaign Configuration</Text>
      <TextInput
        label="Call-to-Action Link"
        placeholder="https://example.com"
        description="Optional: Add a link to your website or product."
        value={data.ctaLink || ''}
        onChange={handleChange}
      />
    </Box>
  );
};

export default WhatsappFlow;