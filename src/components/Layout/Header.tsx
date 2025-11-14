import React from 'react';
import { Group, ActionIcon, Title, Button, Divider, Menu, useMantineColorScheme, Box } from '@mantine/core';
// 1. FIX: 'ResizeIcon' renamed to 'ExpandIcon'
import { MenuIcon, SaveIcon, ShareIcon, DownloadIcon, UndoIcon, RedoIcon, SlidersIcon, MoonIcon, SunIcon, ExpandIcon } from 'lucide-react';

interface HeaderProps {
  sidebarOpened: boolean;
  onToggleSidebar: () => void;
  propertiesPanelOpened: boolean;
  onTogglePropertiesPanel: () => void;
  projectTitle: string;
  onSave: () => void;
  onToggleResizeModal: () => void;
}

const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onTogglePropertiesPanel,
  projectTitle,
  onSave,
  onToggleResizeModal
}) => {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Box p="xs" h={60}>
      <Group justify="space-between" style={{ height: '100%' }}>
        <Group>
          <ActionIcon onClick={onToggleSidebar} size="lg">
            <MenuIcon size={20} />
          </ActionIcon>
          
          <Title order={3} style={{ cursor: 'pointer' }}>
            {projectTitle}
          </Title>
         
          <Divider orientation="vertical" />
          <Group gap="xs">
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <Button variant="subtle">
                  File
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item leftSection={<SaveIcon size={14} />} onClick={onSave}>Save</Menu.Item>
                {/* 2. FIX: Use 'ExpandIcon' here */}
                <Menu.Item leftSection={<ExpandIcon size={14} />} onClick={onToggleResizeModal}>
                  Resize
                </Menu.Item>
                <Menu.Item leftSection={<DownloadIcon size={14} />}>
                  Download
                </Menu.Item>
                <Menu.Item leftSection={<ShareIcon size={14} />}>
                  Share
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <Button variant="subtle">
                  Edit
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item leftSection={<UndoIcon size={14} />}>Undo</Menu.Item>
                <Menu.Item leftSection={<RedoIcon size={14} />}>Redo</Menu.Item>
              </Menu.Dropdown>
            </Menu>
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <Button variant="subtle">
                  View
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item>Zoom In</Menu.Item>
                <Menu.Item>Zoom Out</Menu.Item>
                <Menu.Item>Fit to Screen</Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
        <Group>
          <Button variant="subtle" leftSection={<UndoIcon size={16} />}>
            Undo
          </Button>
          <Button variant="subtle" leftSection={<RedoIcon size={16} />}>
            Redo
          </Button>
          <Divider orientation="vertical" />
          <Button color="blue">Share</Button>
          <ActionIcon onClick={() => toggleColorScheme()} size="lg" variant="outline" color={isDark ? 'yellow' : 'blue'}>
            {isDark ? <SunIcon size={18} /> : <MoonIcon size={18} />}
          </ActionIcon>
          <ActionIcon onClick={onTogglePropertiesPanel} size="lg">
            <SlidersIcon size={20} />
          </ActionIcon>
        </Group>
      </Group>
    </Box>
  );
};

export default Header;