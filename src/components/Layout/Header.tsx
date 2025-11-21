import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Group, ActionIcon, Title, Button, Divider, Menu, useMantineColorScheme, Box, TextInput } from '@mantine/core';
import { ArrowLeft, MenuIcon, SaveIcon, DownloadIcon, UndoIcon, RedoIcon, SlidersIcon, MoonIcon, SunIcon, ExpandIcon } from 'lucide-react';

interface HeaderProps {
  sidebarOpened: boolean;
  onToggleSidebar: () => void;
  propertiesPanelOpened: boolean;
  onTogglePropertiesPanel: () => void;
  projectTitle: string;
  onUpdateTitle: (newTitle: string) => void;
  onSave: () => void;
  onToggleResizeModal: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToCanvas: () => void;
  // NEW PROP
  onToggleDownloadModal: () => void;
}

const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onTogglePropertiesPanel,
  projectTitle,
  onUpdateTitle,
  onSave,
  onToggleResizeModal,
  onToggleDownloadModal
}) => {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';
  const navigate = useNavigate();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState(projectTitle);

  useEffect(() => {
    setNewTitle(projectTitle);
  }, [projectTitle]);

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (newTitle.trim() && newTitle !== projectTitle) {
      onUpdateTitle(newTitle);
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTitleBlur();
    }
  };

  return (
    <Box p="xs" h={60}>
      <Group justify="space-between" style={{ height: '100%' }}>
        <Group>
          <ActionIcon onClick={() => navigate('/campaign-manager')} size="lg">
            <ArrowLeft size={20} />
          </ActionIcon>
          <ActionIcon onClick={onToggleSidebar} size="lg">
            <MenuIcon size={20} />
          </ActionIcon>
          
          {isEditingTitle ? (
            <TextInput
              value={newTitle}
              onChange={(e) => setNewTitle(e.currentTarget.value)}
              onBlur={handleTitleBlur}
              onKeyDown={handleTitleKeyDown}
              autoFocus
              variant="unstyled"
              size="md"
              style={{ width: `${(newTitle.length + 1) * 9}px`, minWidth: '100px', maxWidth: '400px' }}
            />
          ) : (
            <Title order={3} style={{ cursor: 'pointer' }} onClick={() => setIsEditingTitle(true)}>
              {projectTitle}
            </Title>
          )}
         
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
                <Menu.Item leftSection={<ExpandIcon size={14} />} onClick={onToggleResizeModal}>
                  Resize
                </Menu.Item>
                {/* FIX: Wire up the download modal */}
                <Menu.Item leftSection={<DownloadIcon size={14} />} onClick={onToggleDownloadModal}>
                  Download
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