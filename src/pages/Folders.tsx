import React, { useState } from 'react';
// 'ColorScheme' dihapus
import { MantineProvider, Flex, Container, Title, Box, Group, Button, TextInput, Paper, Text, ActionIcon, Menu, Modal, SimpleGrid, Badge } from '@mantine/core';
import { useColorScheme } from '@mantine/hooks';
import DashboardHeader from '../components/Dashboard/DashboardHeader';
import DashboardSidebar from '../components/Dashboard/DashboardSidebar';
// 'PlusIcon' dihapus
import { SearchIcon, FolderIcon, MoreVerticalIcon, EditIcon, TrashIcon, FolderPlusIcon } from 'lucide-react';
import '@mantine/core/styles.css';

const Folders: React.FC = () => {
  const preferredColorScheme = useColorScheme();
  // Tipe 'ColorScheme' diubah menjadi 'light' | 'dark'
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>(preferredColorScheme);
  const [searchQuery, setSearchQuery] = useState('');
  const [createModalOpened, setCreateModalOpened] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  // Tipe 'ColorScheme' diubah menjadi 'light' | 'dark'
  const toggleColorScheme = (value?: 'light' | 'dark') => setColorScheme(value || (colorScheme === 'dark' ? 'light' : 'dark'));
  const folders = [{
    id: '1',
    name: 'Brand Assets',
    itemCount: 24,
    color: 'blue',
    lastModified: '2 hours ago'
  }, {
    id: '2',
    name: 'Social Media',
    itemCount: 48,
    color: 'pink',
    lastModified: '5 hours ago'
  }, {
    id: '3',
    name: 'Marketing Campaigns',
    itemCount: 36,
    color: 'green',
    lastModified: '1 day ago'
  }, {
    id: '4',
    name: 'Presentations',
    itemCount: 12,
    color: 'orange',
    lastModified: '2 days ago'
  }, {
    id: '5',
    name: 'Print Materials',
    itemCount: 18,
    color: 'purple',
    lastModified: '3 days ago'
  }, {
    id: '6',
    name: 'Client Work',
    itemCount: 56,
    color: 'red',
    lastModified: '1 week ago'
  }];
  const handleCreateFolder = () => {
    console.log('Creating folder:', newFolderName);
    setNewFolderName('');
    setCreateModalOpened(false);
  };
  
  // 'theme', 'withGlobalStyles', dan 'withNormalizeCSS' diperbarui
  return <MantineProvider theme={{}} forceColorScheme={colorScheme}>
      <div className="w-full min-h-screen bg-white dark:bg-gray-900">
        <DashboardHeader colorScheme={colorScheme} toggleColorScheme={toggleColorScheme} />
        <Flex>
          <DashboardSidebar />
          <Box className="flex-1 p-8">
            <Container size="xl">
              {/* 'position' diubah menjadi 'justify' */}
              <Group justify="space-between" mb="xl">
                <Title order={2}>Folders</Title>
                {/* 'leftIcon' diubah menjadi 'leftSection' */}
                <Button leftSection={<FolderPlusIcon size={16} />} color="blue" onClick={() => setCreateModalOpened(true)}>
                  New Folder
                </Button>
              </Group>
              {/* 'icon' diubah menjadi 'leftSection' */}
              <TextInput placeholder="Search folders..." leftSection={<SearchIcon size={16} />} value={searchQuery} onChange={e => setSearchQuery(e.currentTarget.value)} w={300} mb="lg" />
              {/* 'cols' diubah menjadi objek responsif, 'breakpoints' dihapus */}
              <SimpleGrid 
                cols={{ base: 2, sm: 3, md: 4 }} 
                spacing="lg"
              >
                {folders.map(folder => <Paper key={folder.id} shadow="sm" p="lg" className="hover:shadow-lg transition-shadow cursor-pointer">
                    {/* 'position' diubah menjadi 'justify' */}
                    <Group justify="space-between" mb="md">
                      <FolderIcon size={32} className={`text-${folder.color}-500`} />
                      <Menu shadow="md" width={200}>
                        <Menu.Target>
                          <ActionIcon variant="subtle">
                            <MoreVerticalIcon size={16} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item leftSection={<EditIcon size={14} />}>
                            Rename
                          </Menu.Item>
                          <Menu.Divider />
                          <Menu.Item leftSection={<TrashIcon size={14} />} color="red">
                            Delete
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Group>
                    {/* 'weight' diubah menjadi 'fw' */}
                    <Text fw={600} size="lg" mb="xs">
                      {folder.name}
                    </Text>
                    {/* 'position' diubah menjadi 'justify' */}
                    <Group justify="space-between">
                      <Badge color={folder.color} variant="light">
                        {folder.itemCount} items
                      </Badge>
                      <Text size="xs" color="dimmed">
                        {folder.lastModified}
                      </Text>
                    </Group>
                  </Paper>)}
              </SimpleGrid>
            </Container>
          </Box>
        </Flex>
        <Modal opened={createModalOpened} onClose={() => setCreateModalOpened(false)} title="Create New Folder">
          <TextInput label="Folder Name" placeholder="Enter folder name" value={newFolderName} onChange={e => setNewFolderName(e.currentTarget.value)} mb="md" />
          {/* 'position' diubah menjadi 'justify' */}
          <Group justify="flex-end">
            <Button variant="subtle" onClick={() => setCreateModalOpened(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder}>Create</Button>
          </Group>
        </Modal>
      </div>
    </MantineProvider>;
};

export default Folders;