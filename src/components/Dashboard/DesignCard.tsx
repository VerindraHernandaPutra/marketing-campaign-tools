import React from 'react';
import { Paper, Text, Group, ActionIcon, Menu, Image, Box, UnstyledButton, Badge } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { MoreVerticalIcon, TrashIcon, CopyIcon, FolderIcon, ShareIcon, DownloadIcon } from 'lucide-react';
interface DesignCardProps {
  design: {
    id: string;
    title: string;
    thumbnail: string;
    updated_at?: string | null;
    category?: string;
  };
  isTemplate?: boolean;
}

// 2. This function IS used now
function timeAgo(dateString: string | null | undefined): string {
  if (!dateString) return 'just now';
  const date = new Date(dateString);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
}

const DesignCard: React.FC<DesignCardProps> = ({
  design,
  isTemplate
}) => {
  const navigate = useNavigate();

  // 3. This function IS used now
  const handleClick = () => {
    if (isTemplate) {
      // Handle template creation (we can build this next)
      // e.g., create a new project based on this template
    } else {
      navigate(`/editor/${design.id}`);
    }
  };

  return <Paper shadow="sm" className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
      {/* 4. Attach handleClick to the onClick prop */}
      <UnstyledButton onClick={handleClick} className="w-full">
        <Box className="relative aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-800">
          <Image src={design.thumbnail} alt={design.title} fit="cover" className="w-full h-full" />
          {isTemplate && <Badge className="absolute top-2 right-2" color="purple" variant="filled" size="sm">
              Template
            </Badge>}
        </Box>
      </UnstyledButton>
      <Box p="md">
        <Group justify="space-between" wrap="nowrap">
          <Box className="flex-1 min-w-0">
            <Text fw={500} size="sm" lineClamp={1}>
              {design.title}
            </Text>

            {design.updated_at && !isTemplate && (
              <Text size="xs" color="dimmed" mt={2}>
                Edited {timeAgo(design.updated_at)}
              </Text>
            )}

            {design.category && isTemplate && (
              <Text size="xs" color="dimmed" mt={2}>
                {design.category}
              </Text>
            )}
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