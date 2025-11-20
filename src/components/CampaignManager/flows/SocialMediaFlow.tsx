import React from 'react';
import { Paper, Text, Group, ThemeIcon, Alert } from '@mantine/core';
import { ShareIcon, InfoIcon } from 'lucide-react';

const SocialMediaFlow: React.FC = () => {
  return (
    <Paper shadow="xs" p="md" withBorder radius="md" mb="md">
      <Group mb="md">
        <ThemeIcon color="blue" variant="light" size="lg">
          <ShareIcon size={20} />
        </ThemeIcon>
        <div>
            <Text fw={600} size="sm" c="blue">Social Media</Text>
            <Text size="xs" c="dimmed">Facebook, Instagram, Twitter, LinkedIn</Text>
        </div>
      </Group>
      
      <Alert variant="light" color="blue" title="Ready to post" icon={<InfoIcon size={16}/>}>
        Your content will be shared directly to the selected social platforms using the connected accounts. No further configuration is needed.
      </Alert>
    </Paper>
  );
};

export default SocialMediaFlow;