import React, { useState } from 'react';
// 1. FIX: Added imports for new components (TextInput, Button, Stack)
import { ScrollArea, Accordion, Group, Text, UnstyledButton, SimpleGrid, useMantineTheme, Divider, Box, MantineTheme, TextInput, Button, Stack } from '@mantine/core';
// 2. FIX: Added/Removed icons
import { 
  ImageIcon, 
  TypeIcon, 
  SquareIcon, 
  CircleIcon, 
  TriangleIcon, 
  FileTextIcon, 
  BoxIcon, 
  HexagonIcon, 
  MinusIcon, 
  BaselineIcon, // Added for Subheading
  SparklesIcon  // Added for AI
} from 'lucide-react';
import { useFabricCanvas } from '../../context/CanvasContext';
// 3. FIX: Added 'Image as FabricImage' to the import
import { Rect, Circle, Triangle, Line, Textbox, Ellipse, Polygon, Polyline, Image as FabricImage } from 'fabric';

interface SidebarProps {
  opened: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = () => {
  const theme = useMantineTheme();
  const [activeTab, setActiveTab] = useState<string | null>('elements');
  // 4. FIX: Add state for the AI prompt
  const [aiPrompt, setAiPrompt] = useState('');
  const { canvas } = useFabricCanvas();

  // ... (addShape and addText functions remain the same) ...
  const addShape = (shapeType: 'rect' | 'circle' | 'triangle' | 'line' | 'ellipse' | 'polygon' | 'polyline') => {
    if (!canvas) return;
    
    let shape;
    const options = {
      left: 100,
      top: 100,
      fill: theme.colors.blue[4],
      width: 100,
      height: 100,
    };

    switch (shapeType) {
      case 'rect':
        shape = new Rect(options);
        break;
      case 'circle':
        shape = new Circle({ ...options, radius: 50 });
        break;
      case 'triangle':
        shape = new Triangle(options);
        break;
      case 'line':
        shape = new Line([50, 50, 150, 150], {
          left: 50,
          top: 50,
          stroke: theme.colors.blue[4],
          strokeWidth: 4,
        });
        break;
      case 'ellipse':
        shape = new Ellipse({
          left: 100,
          top: 100,
          rx: 75,
          ry: 50,
          fill: theme.colors.grape[4],
        });
        break;
      case 'polygon':
        shape = new Polygon([
          { x: 50, y: 0 }, { x: 100, y: 25 }, { x: 100, y: 75 },
          { x: 50, y: 100 }, { x: 0, y: 75 }, { x: 0, y: 25 }
        ], {
          left: 150,
          top: 150,
          fill: theme.colors.lime[4],
        });
        break;
      case 'polyline':
        shape = new Polyline([
          { x: 0, y: 0 }, { x: 100, y: 0 }, { x: 0, y: 100 }, { x: 100, y: 100 }
        ], {
          left: 200,
          top: 200,
          fill: '',
          stroke: theme.colors.pink[4],
          strokeWidth: 4
        });
        break;
    }
    
    if (shape) {
      canvas.add(shape);
      canvas.setActiveObject(shape);
      canvas.renderAll();
    }
  };

  const addText = (textType: 'heading' | 'subheading' | 'paragraph') => {
    if (!canvas) return;
    let text;
    
    switch (textType) {
      case 'heading':
        text = new Textbox('Heading', { left: 100, top: 100, fontFamily: 'Arial', fill: '#000000', fontSize: 48, fontWeight: 'bold' });
        break;
      case 'subheading':
        text = new Textbox('Subheading', { left: 100, top: 100, fontFamily: 'Arial', fill: '#000000', fontSize: 32, fontWeight: 'normal' });
        break;
      case 'paragraph':
        text = new Textbox('Paragraph text', { left: 100, top: 100, fontFamily: 'Arial', fill: '#000000', fontSize: 16, width: 250 });
        break;
    }
    if (text) {
      canvas.add(text);
      canvas.setActiveObject(text);
      canvas.renderAll();
    }
  };


  // 5. FIX: Refactor handleAddMedia to use async/await
  const handleAddMedia = () => {
    // Create a hidden file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !canvas) return;

      const reader = new FileReader();
      
      // Make the onload callback async
      reader.onload = async (f) => {
        try {
          const data = f.target?.result as string;
          
          // Await the image loading
          const img = await FabricImage.fromURL(data);

          // Scale image to fit canvas if it's too large
          const canvasWidth = canvas.getWidth();
          const canvasHeight = canvas.getHeight();
          // Calculate scale to fit image within 80% of canvas dimensions
          const scale = Math.min(
            (canvasWidth * 0.8) / (img.width || canvasWidth), 
            (canvasHeight * 0.8) / (img.height || canvasHeight)
          );

          img.set({
            // Center the image
            left: (canvasWidth - (img.width || 0) * scale) / 2,
            top: (canvasHeight - (img.height || 0) * scale) / 2,
            scaleX: scale,
            scaleY: scale,
          });

          canvas.add(img);
          canvas.setActiveObject(img);
          canvas.renderAll();
        } catch (error) {
          console.error("Error loading image:", error);
          alert("Could not load the image.");
        }
      };
      reader.readAsDataURL(file);
    };
    // Trigger the file input click
    input.click();
  };

  // ... (handleGenerateAI and ElementItem component remain the same) ...
  const handleGenerateAI = () => {
    alert(`AI Generation for prompt: "${aiPrompt}" is not implemented yet.`);
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

  
  return (
    <Box p="md" w={300}>
      {/* ... (Tabs UI remains the same) ... */}
      <Box mt="xs">
        {/* ... (Tabs) ... */}
        <Group justify="center" mb="md">
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

      {/* ... (ScrollArea and Accordion UI remains the same) ... */}
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
                  <ElementItem icon={CircleIcon} label="Ellipse" onClick={() => addShape('ellipse')} />
                  <ElementItem icon={HexagonIcon} label="Polygon" onClick={() => addShape('polygon')} />
                  <ElementItem icon={MinusIcon} label="Polyline" onClick={() => addShape('polyline')} />
                </SimpleGrid>
              </Accordion.Panel>
            </Accordion.Item>
            
            {/* 8. FIX: Updated Text section */}
            <Accordion.Item value="text">
              <Accordion.Control>Text</Accordion.Control>
              <Accordion.Panel>
                <SimpleGrid cols={3} spacing="xs">
                  <ElementItem icon={TypeIcon} label="Heading" onClick={() => addText('heading')} />
                  <ElementItem icon={BaselineIcon} label="Subheading" onClick={() => addText('subheading')} />
                  <ElementItem icon={FileTextIcon} label="Paragraph" onClick={() => addText('paragraph')} />
                </SimpleGrid>
              </Accordion.Panel>
            </Accordion.Item>

            {/* 9. FIX: Updated Media section (removed Grid) */}
            <Accordion.Item value="media">
              <Accordion.Control>Media</Accordion.Control>
              <Accordion.Panel>
                <SimpleGrid cols={3} spacing="xs">
                  <ElementItem icon={ImageIcon} label="Image" onClick={handleAddMedia} />
                </SimpleGrid>
              </Accordion.Panel>
            </Accordion.Item>

            {/* 10. FIX: Added AI Generator section */}
            <Accordion.Item value="ai">
              <Accordion.Control icon={<SparklesIcon size={18} />}>
                AI Generator
              </Accordion.Control>
              <Accordion.Panel>
                <Stack>
                  <TextInput 
                    placeholder="Describe an image to generate..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.currentTarget.value)}
                  />
                  <Button 
                    onClick={handleGenerateAI} 
                    leftSection={<SparklesIcon size={16} />}
                  >
                    Generate
                  </Button>
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>

            {/* 11. FIX: Removed Layouts section */}

          </Accordion> 
          : 
          <SimpleGrid cols={2} spacing="md">
            {Array(8).fill(0).map((_, i) => <div key={i} style={{
          height: 120,
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
    </Box>
  );
};

export default Sidebar;