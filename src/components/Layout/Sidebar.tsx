import React, { useState } from 'react';
import { ScrollArea, Accordion, Group, Text, UnstyledButton, SimpleGrid, useMantineTheme, Divider, Box, MantineTheme } from '@mantine/core';
import { ImageIcon, TypeIcon, SquareIcon, CircleIcon, TriangleIcon, LayoutIcon, FileTextIcon, GridIcon, TableIcon, BoxIcon } from 'lucide-react';
import { useCanvas } from './CanvasContext';
import { fabric } from 'fabric';

interface SidebarProps {
  opened: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = () => {
  const theme = useMantineTheme();
  const [activeTab, setActiveTab] = useState<string | null>('elements');
  const { addElement } = useCanvas();

  const addShape = (shapeType: 'rect' | 'circle' | 'triangle' | 'line') => {
    let shape;
    const options = {
      left: 100,
      top: 100,
      fill: `light-dark(${theme.colors.gray[2]}, ${theme.colors.dark[6]})`,
      width: shapeType === 'line' ? 200 : 100,
      height: shapeType === 'line' ? 2 : 100,
    };

    switch (shapeType) {
      case 'rect':
        shape = new fabric.Rect(options);
        break;
      case 'circle':
        shape = new fabric.Circle({ ...options, radius: 50 });
        break;
      case 'triangle':
        shape = new fabric.Triangle(options);
        break;
      case 'line':
        shape = new fabric.Line([50, 50, 250, 50], { ...options, stroke: options.fill });
        break;
    }
    if (shape) {
      addElement(shape);
    }
  };

  const addText = (textType: 'heading' | 'paragraph' | 'small' | 'medium' | 'big') => {
    let text;
    const options = {
      left: 100,
      top: 100,
      fontFamily: 'Arial',
      fill: `light-dark(${theme.black}, ${theme.white})`,
    };

    switch (textType) {
      case 'heading':
        text = new fabric.Textbox('Heading', { ...options, fontSize: 48, fontWeight: 'bold' });
        break;
      case 'paragraph':
        text = new fabric.Textbox('Paragraph text', { ...options, fontSize: 24 });
        break;
      case 'small':
        text = new fabric.Textbox('Small text', { ...options, fontSize: 16 });
        break;
      case 'medium':
        text = new fabric.Textbox('Medium text', { ...options, fontSize: 32 });
        break;
      case 'big':
        text = new fabric.Textbox('Big text', { ...options, fontSize: 64 });
        break;
    }
    if (text) {
      addElement(text);
    }
  };

  const ElementItem = ({
    icon: Icon,
    label,
    onClick,
  }: {
    icon: React.ElementType;
    label: string;
    onClick: () => void;
  }) => (
    <UnstyledButton
      onClick={onClick}
      className="hover:bg-gray-0 dark:hover:bg-dark-6"
      style={(theme: MantineTheme) => ({
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: theme.spacing.xs,
        borderRadius: theme.radius.md,
        color: `light-dark(${theme.black}, ${theme.colors.dark[0]})`,
      })}
    >
      <Icon size={24} />
      <Text size="xs" mt={4}>
        {label}
      </Text>
    </UnstyledButton>
  );
  
  return <Box p="md" w={300}>
      <Box mt="xs">
        {/* 'position' diubah menjadi 'justify' */}
        <Group justify="center" mb="md">
          {/* 'sx' diubah menjadi 'style', 'theme' diberi tipe, '&:hover' dipindahkan ke 'className', 'colorScheme' diganti 'light-dark()' */}
          <UnstyledButton 
            className="hover:bg-gray-0 dark:hover:bg-dark-6"
            style={(theme: MantineTheme) => ({
              padding: theme.spacing.xs,
              borderRadius: theme.radius.md,
              color: activeTab === 'templates' ? theme.colors.blue[6] : `light-dark(${theme.black}, ${theme.colors.dark[0]})`,
              backgroundColor: activeTab === 'templates' ? `light-dark(${theme.colors.gray[0]}, ${theme.colors.dark[6]})` : 'transparent',
              flex: 1,
              textAlign: 'center'
            })} 
            onClick={() => setActiveTab('templates')}
          >
            <Text>Templates</Text>
          </UnstyledButton>
          {/* 'sx' diubah menjadi 'style', 'theme' diberi tipe, '&:hover' dipindahkan ke 'className', 'colorScheme' diganti 'light-dark()' */}
          <UnstyledButton 
            className="hover:bg-gray-0 dark:hover:bg-dark-6"
            style={(theme: MantineTheme) => ({
              padding: theme.spacing.xs,
              borderRadius: theme.radius.md,
              color: activeTab === 'elements' ? theme.colors.blue[6] : `light-dark(${theme.black}, ${theme.colors.dark[0]})`,
              backgroundColor: activeTab === 'elements' ? `light-dark(${theme.colors.gray[0]}, ${theme.colors.dark[6]})` : 'transparent',
              flex: 1,
              textAlign: 'center'
            })} 
            onClick={() => setActiveTab('elements')}
          >
            <Text>Elements</Text>
          </UnstyledButton>
        </Group>
        <Divider mb="md" />
      </Box>
      <ScrollArea h="calc(100vh - 140px)" mx="-xs" px="xs">
        {activeTab === 'elements' ? <Accordion multiple defaultValue={['shapes']}>
            <Accordion.Item value="shapes">
              <Accordion.Control>Shapes</Accordion.Control>
              <Accordion.Panel>
                <SimpleGrid cols={3} spacing="xs">
                  <ElementItem icon={SquareIcon} label="Square" onClick={() => addShape('rect')} />
                  <ElementItem icon={CircleIcon} label="Circle" onClick={() => addShape('circle')} />
                  <ElementItem icon={TriangleIcon} label="Triangle" onClick={() => addShape('triangle')} />
                  <ElementItem icon={BoxIcon} label="Line" onClick={() => addShape('line')} />
                </SimpleGrid>
              </Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item value="text">
              <Accordion.Control>Text</Accordion.Control>
              <Accordion.Panel>
                <SimpleGrid cols={2} spacing="xs">
                  <ElementItem icon={TypeIcon} label="Heading" onClick={() => addText('heading')} />
                  <ElementItem icon={FileTextIcon} label="Paragraph" onClick={() => addText('paragraph')} />
                  <ElementItem icon={TypeIcon} label="Small" onClick={() => addText('small')} />
                  <ElementItem icon={TypeIcon} label="Medium" onClick={() => addText('medium')} />
                  <ElementItem icon={TypeIcon} label="Big" onClick={() => addText('big')} />
                </SimpleGrid>
              </Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item value="media">
              <Accordion.Control>Media</Accordion.Control>
              <Accordion.Panel>
                <SimpleGrid cols={2} spacing="xs">
                  <ElementItem icon={ImageIcon} label="Image" />
                  <ElementItem icon={GridIcon} label="Grid" />
                </SimpleGrid>
              </Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item value="layouts">
              <Accordion.Control>Layouts</Accordion.Control>
              <Accordion.Panel>
                <SimpleGrid cols={2} spacing="xs">
                  <ElementItem icon={LayoutIcon} label="Layout" />
                  <ElementItem icon={TableIcon} label="Table" />
                </SimpleGrid>
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion> : <SimpleGrid cols={2} spacing="md">
            {Array(8).fill(0).map((_, i) => <div key={i} style={{
          height: 120,
          // 'theme.colorScheme' diganti dengan 'light-dark()'
          backgroundColor: `light-dark(${theme.colors.gray[2]}, ${theme.colors.dark[6]})`,
          borderRadius: theme.radius.md,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
                  <Text size="xs" color="dimmed">
                    Template {i + 1}
                  </Text>
                </div>)}
          </SimpleGrid>}
      </ScrollArea>
    </Box>;
};

export default Sidebar;