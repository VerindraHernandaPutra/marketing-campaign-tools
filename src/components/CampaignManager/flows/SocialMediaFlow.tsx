import React from 'react';
import { Paper, Text, Group, ThemeIcon, SimpleGrid, Alert } from '@mantine/core';
import { ShareIcon, FacebookIcon, InstagramIcon, LinkedinIcon, TwitterIcon, InfoIcon } from 'lucide-react';

interface SocialMediaFlowProps {
  selectedPlatforms?: string[];
}

const SocialMediaFlow: React.FC<SocialMediaFlowProps> = ({ selectedPlatforms = [] }) => {

  const socialOptions = [
    { id: 'facebook', label: 'Facebook', icon: FacebookIcon, color: '#1877F2' },
    { id: 'instagram', label: 'Instagram', icon: InstagramIcon, color: '#E4405F' },
    { id: 'twitter', label: 'X (Twitter)', icon: TwitterIcon, color: '#000000' },
    { id: 'linkedin', label: 'LinkedIn', icon: LinkedinIcon, color: '#0A66C2' },
  ];

  // Filter only the selected ones that are relevant to Social Media
  const activeSocials = socialOptions.filter(opt => selectedPlatforms?.includes(opt.id));

  return (
    <Paper shadow="xs" p="md" withBorder radius="md" mb="md">
      <Group mb="md">
        <ThemeIcon color="blue" variant="light" size="lg">
          <ShareIcon size={20} />
        </ThemeIcon>
        <div>
          <Text fw={600} size="sm" c="blue">Social Media Distribution</Text>
          <Text size="xs" c="dimmed">Content will be posted to these platforms</Text>
        </div>
      </Group>

      {activeSocials.length > 0 ? (
        <SimpleGrid cols={2} spacing="xs">
          {activeSocials.map((opt) => (
            <Alert key={opt.id} variant="light" color="gray" p="xs" title={
              <Group gap={6}>
                <opt.icon size={16} color={opt.color} />
                <Text size="sm">{opt.label}</Text>
              </Group>
            } />
          ))}
        </SimpleGrid>
      ) : (
        <Alert variant="light" color="orange" title="No Social Platform Selected">
          Please select Facebook, Instagram, Twitter, or LinkedIn in the "Platforms" step.
        </Alert>
      )}

      <Alert variant="light" color="blue" mt="md" title="Ready to post" icon={<InfoIcon size={16} />}>
        Your content will be shared directly to the selected platforms using the connected accounts.
      </Alert>
    </Paper>
  );
};

export default SocialMediaFlow;