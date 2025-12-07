import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Group, ActionIcon, Button, Divider, Menu, useMantineColorScheme, 
  Box, TextInput, Tooltip, useMantineTheme, Text, Modal, Image, Center
} from '@mantine/core';
import { 
  ArrowLeft, Download, Undo2, Redo2, Moon, Sun, Cloud, FileType, LayoutTemplate,
  PanelRightOpen, PanelRightClose, ZoomIn, ZoomOut, Maximize, Eye
} from 'lucide-react';
import { useFabricCanvas } from '../../context/CanvasContext';

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
  onToggleDownloadModal: () => void;
  // --- Undo / Redo Props ---
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  propertiesPanelOpened,
  onTogglePropertiesPanel,
  projectTitle,
  onUpdateTitle,
  onSave,
  onToggleResizeModal,
  onToggleDownloadModal,
  onZoomIn,
  onZoomOut,
  onFitToCanvas,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false
}) => {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const isDark = colorScheme === 'dark';
  const navigate = useNavigate();
  const [newTitle, setNewTitle] = useState(projectTitle);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  
  // Preview Modal State
  const [previewOpened, setPreviewOpened] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const { canvas } = useFabricCanvas(); // Access canvas context for preview generation

  useEffect(() => {
    setNewTitle(projectTitle);
  }, [projectTitle]);

  const handleTitleBlur = () => {
    if (newTitle.trim() && newTitle !== projectTitle) {
      setSaveStatus('saving');
      onUpdateTitle(newTitle);
      setTimeout(() => setSaveStatus('saved'), 800); // Fake save delay for UI feel
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleManualSave = () => {
    setSaveStatus('saving');
    onSave();
    setTimeout(() => setSaveStatus('saved'), 800);
  };

  const handlePreview = () => {
    if (canvas) {
      // Deselect objects to show clean canvas
      canvas.discardActiveObject();
      canvas.requestRenderAll();
      
      const dataUrl = canvas.toDataURL({
        format: 'png',
        multiplier: 2, // Higher quality for preview
      });
      setPreviewImage(dataUrl);
      setPreviewOpened(true);
    }
  };

  return (
    <>
      <Box 
        component="header" 
        h={64} 
        px="md" 
        style={{
          borderBottom: `1px solid ${isDark ? theme.colors.dark[4] : theme.colors.gray[2]}`,
          backgroundColor: isDark ? theme.colors.dark[7] : theme.white,
        }}
      >
        <Group justify="space-between" h="100%" wrap="nowrap">
          
          {/* LEFT SECTION: Navigation & File Info */}
          <Group gap="sm" wrap="nowrap">
            <Tooltip label="Back to Dashboard">
              <ActionIcon 
                variant="subtle" 
                color="gray" 
                size="lg" 
                onClick={() => navigate('/')}
                radius="xl"
              >
                <ArrowLeft size={20} />
              </ActionIcon>
            </Tooltip>

            {/* File Management Area */}
            <Box>
              <Group gap={6} align="center">
                <TextInput
                  value={newTitle}
                  onChange={(e) => {
                      setNewTitle(e.currentTarget.value);
                      setSaveStatus('unsaved');
                  }}
                  onBlur={handleTitleBlur}
                  onKeyDown={handleTitleKeyDown}
                  variant="unstyled"
                  size="sm"
                  w={Math.max(150, newTitle.length * 10)} // Dynamic width
                  styles={{
                    input: {
                      fontWeight: 600,
                      fontSize: '1rem',
                      paddingLeft: 6,
                      paddingRight: 6,
                      borderRadius: 4,
                      transition: 'all 0.2s',
                      color: isDark ? 'white' : '#1f2937',
                      border: '1px solid transparent',
                      '&:hover': {
                        border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                      },
                      '&:focus': {
                        backgroundColor: isDark ? '#111827' : '#fff',
                        border: '1px solid var(--mantine-color-blue-5)',
                      }
                    }
                  }}
                />
                <Tooltip label={saveStatus === 'saved' ? 'All changes saved' : 'Unsaved changes'}>
                  <Box className="flex items-center text-gray-400">
                      {saveStatus === 'saved' ? <Cloud size={14} /> : <div className="w-2 h-2 bg-yellow-500 rounded-full" />}
                  </Box>
                </Tooltip>
              </Group>

              {/* Sub-menu text links */}
              <Group gap={2} mt={-2} mb={10}>
                {/* FILE MENU */}
                <Menu shadow="md" width={200} trigger="hover" openDelay={100} closeDelay={200}>
                  <Menu.Target>
                    <Button variant="subtle" size="compact-xs" color="gray" fw={400} h={20}>File</Button>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item leftSection={<FileType size={14} />} onClick={handleManualSave}>
                      Save
                    </Menu.Item>
                    <Menu.Item leftSection={<LayoutTemplate size={14} />} onClick={onToggleResizeModal}>
                      Resize Canvas
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
                
                {/* EDIT MENU */}
                <Menu shadow="md" width={200} trigger="hover" openDelay={100} closeDelay={200}>
                  <Menu.Target>
                    <Button variant="subtle" size="compact-xs" color="gray" fw={400} h={20}>Edit</Button>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item 
                      leftSection={<Undo2 size={14} />} 
                      onClick={onUndo}
                      disabled={!canUndo}
                      rightSection={<Text size="xs" c="dimmed">Ctrl+Z</Text>}
                    >
                      Undo
                    </Menu.Item>
                    <Menu.Item 
                      leftSection={<Redo2 size={14} />} 
                      onClick={onRedo}
                      disabled={!canRedo}
                      rightSection={<Text size="xs" c="dimmed">Ctrl+Y</Text>}
                    >
                      Redo
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>

                {/* VIEW MENU */}
                <Menu shadow="md" width={220} trigger="hover" openDelay={100} closeDelay={200}>
                  <Menu.Target>
                    <Button variant="subtle" size="compact-xs" color="gray" fw={400} h={20}>View</Button>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Label>Canvas Controls</Menu.Label>
                    <Menu.Item leftSection={<ZoomIn size={14} />} onClick={onZoomIn}>
                      Zoom In
                    </Menu.Item>
                    <Menu.Item leftSection={<ZoomOut size={14} />} onClick={onZoomOut}>
                      Zoom Out
                    </Menu.Item>
                    <Menu.Item leftSection={<Maximize size={14} />} onClick={onFitToCanvas}>
                      Fit to Screen
                    </Menu.Item>
                    
                    <Menu.Divider />
                    <Menu.Label>Interface</Menu.Label>
                    <Menu.Item 
                      leftSection={isDark ? <Sun size={14} /> : <Moon size={14} />} 
                      onClick={() => toggleColorScheme()}
                    >
                      {isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    </Menu.Item>
                    
                    <Menu.Divider />
                    <Menu.Item 
                      leftSection={<Eye size={14} />} 
                      onClick={handlePreview}
                      color="blue"
                    >
                      Preview Design
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Group>
            </Box>
          </Group>

          {/* RIGHT SECTION: Tools & Actions */}
          <Group gap="sm" wrap="nowrap">
            {/* Undo / Redo Group */}
            <Group gap={4} className="bg-gray-100 dark:bg-gray-800 p-1 rounded-md hidden sm:flex">
              <Tooltip label="Undo (Ctrl+Z)">
                  <ActionIcon 
                    variant="subtle" 
                    color="gray" 
                    size="md" 
                    radius="sm" 
                    onClick={onUndo} 
                    disabled={!canUndo}
                    style={{ opacity: !canUndo ? 0.4 : 1 }}
                  >
                      <Undo2 size={16} />
                  </ActionIcon>
              </Tooltip>
              <Tooltip label="Redo (Ctrl+Y)">
                  <ActionIcon 
                    variant="subtle" 
                    color="gray" 
                    size="md" 
                    radius="sm" 
                    onClick={onRedo} 
                    disabled={!canRedo}
                    style={{ opacity: !canRedo ? 0.4 : 1 }}
                  >
                      <Redo2 size={16} />
                  </ActionIcon>
              </Tooltip>
            </Group>

            <Divider orientation="vertical" h={24} className="hidden sm:block" />

            {/* Properties Panel Toggle */}
            <Tooltip label={propertiesPanelOpened ? "Hide Properties" : "Show Properties"}>
              <ActionIcon 
                  onClick={onTogglePropertiesPanel} 
                  size="lg" 
                  variant={propertiesPanelOpened ? "light" : "default"}
                  color={propertiesPanelOpened ? "blue" : "gray"}
                  radius="md"
                  className={!propertiesPanelOpened ? "border-0 bg-transparent" : ""}
              >
                  {propertiesPanelOpened ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
              </ActionIcon>
            </Tooltip>

            {/* Primary Action */}
            <Button 
              variant="gradient" 
              gradient={{ from: 'indigo', to: 'blue' }}
              leftSection={<Download size={16} />}
              onClick={onToggleDownloadModal}
              radius="md"
              className="shadow-sm hover:shadow-md transition-shadow"
            >
              Export
            </Button>
          </Group>
        </Group>
      </Box>

      {/* Preview Modal */}
      <Modal 
        opened={previewOpened} 
        onClose={() => setPreviewOpened(false)} 
        title="Design Preview"
        size="xl"
        centered
        overlayProps={{
          backgroundOpacity: 0.85,
          blur: 3,
          color: '#000' // Dark overlay
        }}
        styles={{
          header: { backgroundColor: 'transparent', color: 'white' },
          content: { backgroundColor: 'transparent', boxShadow: 'none' },
          title: { fontWeight: 700 },
          close: { color: 'white', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }
        }}
      >
        <Center>
          {previewImage && (
            <Image 
              src={previewImage} 
              radius="md" 
              style={{ 
                maxHeight: '80vh', 
                maxWidth: '100%', 
                objectFit: 'contain',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              }} 
            />
          )}
        </Center>
      </Modal>
    </>
  );
};

export default Header;