import React from 'react';
import { Box, Text, Checkbox, SimpleGrid, Paper, Group } from '@mantine/core';
import { MessageCircleIcon, MailIcon, FacebookIcon, InstagramIcon, TwitterIcon, LinkedinIcon } from 'lucide-react';

interface PlatformSelectorProps {
  selectedPlatforms: string[];
  onChange: (platforms: string[]) => void;
}

const platforms = [{
  id: 'whatsapp',
  name: 'WhatsApp',
  icon: MessageCircleIcon,
  color: '#25D366'
}, {
  id: 'email',
  name: 'Email',
  icon: MailIcon,
  color: '#EA4335'
}, {
  id: 'facebook',
  name: 'Facebook',
  icon: FacebookIcon,
  color: '#1877F2'
}, {
  id: 'instagram',
  name: 'Instagram',
  icon: InstagramIcon,
  color: '#E4405F'
}, {
  id: 'twitter',
  name: 'Twitter',
  icon: TwitterIcon,
  color: '#1DA1F2'
}, {
  id: 'linkedin',
  name: 'LinkedIn',
  icon: LinkedinIcon,
  color: '#0A66C2'
}];

const PlatformSelector: React.FC<PlatformSelectorProps> = ({
  selectedPlatforms,
  onChange
}) => {
  const togglePlatform = (platformId: string) => {
    if (selectedPlatforms.includes(platformId)) {
      onChange(selectedPlatforms.filter(id => id !== platformId));
    } else {
      onChange([...selectedPlatforms, platformId]);
    }
  };

  return <Box>
      {/* 'weight' diubah menjadi 'fw' */}
      <Text size="sm" fw={500} mb="xs">
        Select Platforms
      </Text>
      <SimpleGrid cols={3} spacing="md">
        {platforms.map(platform => {
        const Icon = platform.icon;
        const isSelected = selectedPlatforms.includes(platform.id);
        return <Paper key={platform.id} p="md" withBorder className={`cursor-pointer transition-all ${isSelected ? 'border-2 border-blue-500 dark:border-blue-400' : 'border-gray-200 dark:border-gray-700'}`} onClick={() => togglePlatform(platform.id)}>
              {/* 'spacing' diubah menjadi 'gap' */}
              <Group gap="sm">
                <Checkbox checked={isSelected} onChange={() => togglePlatform(platform.id)} onClick={e => e.stopPropagation()} />
                <Icon size={20} style={{
              color: platform.color
            }} />
                {/* 'weight' diubah menjadi 'fw' */}
                <Text size="sm" fw={500}>
                  {platform.name}
                </Text>
              </Group>
            </Paper>;
      })}
      </SimpleGrid>
    </Box>;
};

export default PlatformSelector;