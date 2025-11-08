import React, { useState } from 'react';
import { Container, Tabs, SimpleGrid, Title, Text, Box, Group, Button } from '@mantine/core';
// 'PlusIcon' dihapus karena tidak terpakai
import { LayoutIcon, ImageIcon, FileTextIcon } from 'lucide-react';
import CreateNewCard from './CreateNewCard';
import DesignCard from './DesignCard';

const DashboardContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string | null>('recent');
  const mockDesigns = [{
    id: '1',
    title: 'Instagram Post',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a-8bd57fbe?w=400',
    lastEdited: '2 hours ago',
    type: 'Social Media'
  }, {
    id: '2',
    title: 'Presentation Slide',
    thumbnail: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400',
    lastEdited: '1 day ago',
    type: 'Presentation'
  }, {
    id: '3',
    title: 'Logo Design',
    thumbnail: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400',
    lastEdited: '3 days ago',
    type: 'Logo'
  }, {
    id: '4',
    title: 'Business Card',
    thumbnail: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400',
    lastEdited: '5 days ago',
    type: 'Print'
  }, {
    id: '5',
    title: 'Flyer Design',
    thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400',
    lastEdited: '1 week ago',
    type: 'Marketing'
  }, {
    id: '6',
    title: 'Social Media Banner',
    thumbnail: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400',
    lastEdited: '1 week ago',
    type: 'Social Media'
  }];
  const templates = [{
    id: 't1',
    title: 'Instagram Story',
    thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400',
    category: 'Social Media'
  }, {
    id: 't2',
    title: 'Business Presentation',
    thumbnail: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=400',
    category: 'Presentation'
  }, {
    id: 't3',
    title: 'Event Poster',
    thumbnail: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400',
    category: 'Marketing'
  }, {
    id: 't4',
    title: 'Resume Template',
    thumbnail: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400',
    category: 'Document'
  }];

  return <Box className="py-8">
      <Container size="xl">
        <Box mb="xl">
          <Title order={2} mb="xs">
            Start creating
          </Title>
          <Text color="dimmed" size="sm" mb="lg">
            Choose a template or start from scratch
          </Text>
          {/* 'cols' diubah menjadi objek untuk responsivitas, 'breakpoints' dihapus */}
          <SimpleGrid 
            cols={{ base: 2, sm: 3, md: 5 }} 
            spacing="md"
          >
            <CreateNewCard icon={<LayoutIcon size={32} />} title="Custom Size" description="Create any design" />
            <CreateNewCard icon={<ImageIcon size={32} />} title="Instagram Post" description="1080 x 1080 px" />
            <CreateNewCard icon={<FileTextIcon size={32} />} title="Presentation" description="1920 x 1080 px" />
            <CreateNewCard icon={<LayoutIcon size={32} />} title="Flyer" description="A4 Portrait" />
            <CreateNewCard icon={<ImageIcon size={32} />} title="Logo" description="500 x 500 px" />
          </SimpleGrid>
        </Box>
        {/* 'onTabChange' diubah menjadi 'onChange' */}
        <Tabs value={activeTab} onChange={setActiveTab} className="mt-8">
          <Tabs.List>
            <Tabs.Tab value="recent">Recent designs</Tabs.Tab>
            <Tabs.Tab value="templates">Templates</Tabs.Tab>
            <Tabs.Tab value="folders">Folders</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="recent" pt="xl">
            {/* 'position' diubah menjadi 'justify' */}
            <Group justify="space-between" mb="md">
              <Title order={3}>Your designs</Title>
              <Button variant="subtle" size="sm">
                View all
              </Button>
            </Group>
            {/* 'cols' diubah menjadi objek untuk responsivitas, 'breakpoints' dihapus */}
            <SimpleGrid 
              cols={{ base: 2, sm: 3, md: 4 }} 
              spacing="lg"
            >
              {mockDesigns.map(design => <DesignCard key={design.id} design={design} />)}
            </SimpleGrid>
          </Tabs.Panel>
          <Tabs.Panel value="templates" pt="xl">
            {/* 'position' diubah menjadi 'justify' */}
            <Group justify="space-between" mb="md">
              <Title order={3}>Popular templates</Title>
              <Button variant="subtle" size="sm">
                View all
              </Button>
            </Group>
            {/* 'cols' diubah menjadi objek untuk responsivitas, 'breakpoints' dihapus */}
            <SimpleGrid 
              cols={{ base: 2, sm: 3, md: 4 }} 
              spacing="lg"
            >
              {templates.map(template => <DesignCard key={template.id} design={template} isTemplate />)}
            </SimpleGrid>
          </Tabs.Panel>
          <Tabs.Panel value="folders" pt="xl">
            <Box className="text-center py-12">
              <Text color="dimmed">No folders yet</Text>
              <Button variant="subtle" mt="md">
                Create your first folder
              </Button>
            </Box>
          </Tabs.Panel>
        </Tabs>
      </Container>
    </Box>;
};

export default DashboardContent;