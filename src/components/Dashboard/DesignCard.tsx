import React from 'react';
import { Paper, Text, Group, ActionIcon, Menu, Image, Box, UnstyledButton, Badge } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { MoreVerticalIcon, TrashIcon, CopyIcon, FolderIcon, ShareIcon, DownloadIcon } from 'lucide-react';

interface DesignCardProps {
  design: {
    id: string;
    title: string;
    thumbnail: string;
    lastEdited?: string;
    type?: string;
    category?: string;
  };
  isTemplate?: boolean;
}

const DesignCard: React.FC<DesignCardProps> = ({
  design,
  isTemplate
}) => {
  const navigate = useNavigate();
  return <Paper shadow="sm" className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
      <UnstyledButton onClick={() => navigate('/editor')} className="w-full">
        <Box className="relative aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-800">
          <Image src={design.thumbnail} alt={design.title} fit="cover" className="w-full h-full" />
          {isTemplate && <Badge className="absolute top-2 right-2" color="purple" variant="filled" size="sm">
              Template
            </Badge>}
        </Box>
      </UnstyledButton>
      <Box p="md">
        {/* 'position' diubah menjadi 'justify' DAN 'noWrap' diubah menjadi 'wrap="nowrap"' */}
        <Group justify="space-between" wrap="nowrap">
          <Box className="flex-1 min-w-0">
            {/* 'weight' diubah menjadi 'fw' */}
            <Text fw={500} size="sm" lineClamp={1}>
              {design.title}
            </Text>
            {design.lastEdited && <Text size="xs" color="dimmed" mt={2}>
                Edited {design.lastEdited}
              </Text>}
            {design.category && <Text size="xs" color="dimmed" mt={2}>
                {design.category}
              </Text>}
          </Box>
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <ActionIcon variant="subtle" onClick={e => e.stopPropagation()}>
                <MoreVerticalIcon size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<CopyIcon size={14} />}>
                Make a copy
              </Menu.Item>
              <Menu.Item leftSection={<ShareIcon size={14} />}>Share</Menu.Item>
              <Menu.Item leftSection={<DownloadIcon size={14} />}>
                Download
              </Menu.Item>
              <Menu.Item leftSection={<FolderIcon size={14} />}>
                Move to folder
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item leftSection={<TrashIcon size={14} />} color="red">
                Delete
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Box>
    </Paper>;
};

export default DesignCard;