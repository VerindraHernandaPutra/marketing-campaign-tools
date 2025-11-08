import React, { useState } from 'react';
// 'ColorScheme', 'Group', dan 'Badge' dihapus dari import
import { MantineProvider, Flex, Container, Title, Box, TextInput, Tabs, SimpleGrid } from '@mantine/core';
import { useColorScheme } from '@mantine/hooks';
import DashboardHeader from '../components/Dashboard/DashboardHeader';
import DashboardSidebar from '../components/Dashboard/DashboardSidebar';
import DesignCard from '../components/Dashboard/DesignCard';
import { SearchIcon } from 'lucide-react';
import '@mantine/core/styles.css';

const Templates: React.FC = () => {
  const preferredColorScheme = useColorScheme();
  // Tipe 'ColorScheme' diubah menjadi 'light' | 'dark'
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>(preferredColorScheme);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>('all');
  // Tipe 'ColorScheme' diubah menjadi 'light' | 'dark'
  const toggleColorScheme = (value?: 'light' | 'dark') => setColorScheme(value || (colorScheme === 'dark' ? 'light' : 'dark'));
  const templates = [{
    id: 't1',
    title: 'Instagram Story Template',
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
    title: 'Professional Resume',
    thumbnail: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400',
    category: 'Document'
  }, {
    id: 't5',
    title: 'Facebook Ad Template',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400',
    category: 'Social Media'
  }, {
    id: 't6',
    title: 'Brand Logo Kit',
    thumbnail: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400',
    category: 'Branding'
  }, {
    id: 't7',
    title: 'Product Catalog',
    thumbnail: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400',
    category: 'Marketing'
  }, {
    id: 't8',
    title: 'Newsletter Template',
    thumbnail: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400',
    category: 'Email'
  }, {
    id: 't9',
    title: 'Business Card',
    thumbnail: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400',
    category: 'Print'
  }, {
    id: 't10',
    title: 'YouTube Thumbnail',
    thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400',
    category: 'Social Media'
  }, {
    id: 't11',
    title: 'Infographic Template',
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400',
    category: 'Marketing'
  }, {
    id: 't12',
    title: 'Certificate Design',
    thumbnail: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400',
    category: 'Document'
  }];
  const categories = [{
    value: 'all',
    label: 'All Templates'
  }, {
    value: 'social',
    label: 'Social Media'
  }, {
    value: 'presentation',
    label: 'Presentations'
  }, {
    value: 'marketing',
    label: 'Marketing'
  }, {
    value: 'document',
    label: 'Documents'
  }, {
    value: 'branding',
    label: 'Branding'
  }, {
    value: 'email',
    label: 'Email'
  }, {
    value: 'print',
    label: 'Print'
  }];
  
  // 'theme', 'withGlobalStyles', dan 'withNormalizeCSS' diperbarui
  return <MantineProvider theme={{}} forceColorScheme={colorScheme}>
      <div className="w-full min-h-screen bg-white dark:bg-gray-900">
        <DashboardHeader colorScheme={colorScheme} toggleColorScheme={toggleColorScheme} />
        <Flex>
          <DashboardSidebar />
          <Box className="flex-1 p-8">
            <Container size="xl">
              <Title order={2} mb="xl">
                Templates
              </Title>
              {/* 'icon' diubah menjadi 'leftSection' */}
              <TextInput placeholder="Search templates..." leftSection={<SearchIcon size={16} />} value={searchQuery} onChange={e => setSearchQuery(e.currentTarget.value)} w={300} mb="lg" />
              {/* 'onTabChange' diubah menjadi 'onChange' */}
              <Tabs value={activeCategory} onChange={setActiveCategory} mb="xl">
                <Tabs.List>
                  {categories.map(category => <Tabs.Tab key={category.value} value={category.value}>
                      {category.label}
                    </Tabs.Tab>)}
                </Tabs.List>
              </Tabs>
              {/* 'cols' dan 'breakpoints' diubah menjadi objek 'cols' v7 */}
              <SimpleGrid 
                cols={{ base: 2, sm: 3, md: 4 }} 
                spacing="lg"
              >
                {templates.map(template => <DesignCard key={template.id} design={template} isTemplate />)}
              </SimpleGrid>
            </Container>
          </Box>
        </Flex>
      </div>
    </MantineProvider>;
};

export default Templates;