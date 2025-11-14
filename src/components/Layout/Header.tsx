import React, { useState } from 'react';
import { Group, ActionIcon, Title, Button, Divider, Menu, useMantineColorScheme, Box, TextInput } from '@mantine/core';
import { MenuIcon, SaveIcon, ShareIcon, DownloadIcon, UndoIcon, RedoIcon, SlidersIcon, MoonIcon, SunIcon } from 'lucide-react';
import { useCanvas } from './CanvasContext';

interface HeaderProps {
  sidebarOpened: boolean;
  onToggleSidebar: () => void;
  propertiesPanelOpened: boolean;
  onTogglePropertiesPanel: () => void;
}

const Header: React.FC<HeaderProps> = ({
  // 'sidebarOpened' dan 'propertiesPanelOpened' dihapus dari destructuring (tidak terpakai)
  onToggleSidebar,
  onTogglePropertiesPanel
}) => {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';
  const { canvasTitle, setCanvasTitle } = useCanvas();
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  return (
    <Box p="xs" h={60}>
      <Group justify="space-between" style={{ height: '100%' }}>
        <Group>
          <ActionIcon onClick={onToggleSidebar} size="lg">
            <MenuIcon size={20} />
          </ActionIcon>
          {isEditingTitle ? (
            <TextInput
              value={canvasTitle}
              onChange={(event) => setCanvasTitle(event.currentTarget.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  setIsEditingTitle(false);
                }
              }}
              autoFocus
            />
          ) : (
            <Title order={3} onClick={() => setIsEditingTitle(true)} style={{ cursor: 'pointer' }}>
              {canvasTitle}
            </Title>
          )}
          <Divider orientation="vertical" />
          <Group gap="xs">
            <Menu shadow="md" width={200}>
              <Menu.Target>
                {/* 'compact' dihapus */}
                <Button variant="subtle">
                  File
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item leftSection={<SaveIcon size={14} />}>Save</Menu.Item>
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
                {/* 'compact' dihapus */}
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
                {/* 'compact' dihapus */}
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
          {/* 'compact' dihapus */}
          <Button variant="subtle" leftSection={<UndoIcon size={16} />}>
            Undo
          </Button>
          {/* 'compact' dihapus */}
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
    </Box>;
};

export default Header;