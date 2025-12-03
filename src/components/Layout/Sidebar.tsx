import React, { useState } from 'react';
import { ScrollArea, Accordion, Group, Text, UnstyledButton, SimpleGrid, useMantineTheme, Divider, Box, MantineTheme, TextInput, Button, Stack, Loader, Select, Textarea, SegmentedControl, Collapse, Tooltip, NumberInput } from '@mantine/core';
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
  BaselineIcon, 
  SparklesIcon,
  Wand2Icon,
  Settings2Icon,
  InfoIcon,
  PaletteIcon,
  CameraIcon,
  SunIcon,
  MaximizeIcon,
  ScalingIcon
} from 'lucide-react';
import { useFabricCanvas } from '../../context/CanvasContext';
import { Rect, Circle, Triangle, Line, Textbox, Ellipse, Polygon, Polyline, Image as FabricImage } from 'fabric';
import { supabase } from '../../supabaseClient';

interface SidebarProps {
  opened: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = () => {
  const theme = useMantineTheme();
  const [activeTab, setActiveTab] = useState<string | null>('elements');
  const [isGenerating, setIsGenerating] = useState(false);
  const { canvas } = useFabricCanvas();

  // Mode state: 'basic' or 'advanced'
  const [promptMode, setPromptMode] = useState('basic');

  // Comprehensive AI Input State
  const [aiParams, setAiParams] = useState({
    subject: '',
    theme: '',
    background: '',
    mood: '',
    purpose: '',
    negativePrompt: '',
    // Advanced Fields
    lighting: '',
    composition: '',
    colorPalette: '',
    texture: '',
    aspectRatio: 'square', // square, landscape, portrait, custom
    width: 1024,
    height: 1024,
    quality: 'standard'
  });

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

  const handleAddMedia = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !canvas) return;

      const reader = new FileReader();
      
      reader.onload = async (f) => {
        try {
          const data = f.target?.result as string;
          const img = await FabricImage.fromURL(data);

          const canvasWidth = canvas.getWidth();
          const canvasHeight = canvas.getHeight();
          const scale = Math.min(
            (canvasWidth * 0.8) / (img.width || canvasWidth), 
            (canvasHeight * 0.8) / (img.height || canvasHeight)
          );

          img.set({
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
    input.click();
  };

  const handleGenerateAI = async () => {
    if (!aiParams.subject.trim() || !canvas) return;
    
    setIsGenerating(true);

    try {
        const { data, error } = await supabase.functions.invoke('generate-image', {
            body: { params: aiParams }
        });

        if (error) throw error;
        
        if (data && data.image) {
            const img = await FabricImage.fromURL(data.image);
            
            const canvasWidth = canvas.getWidth();
            const canvasHeight = canvas.getHeight();
            // Scale logic remains simple to fit screen, 
            // but aspect ratio will be preserved from the backend generation
            const scale = Math.min(
                (canvasWidth * 0.6) / (img.width || canvasWidth), 
                (canvasHeight * 0.6) / (img.height || canvasHeight)
            );

            img.set({
                left: (canvasWidth - (img.width || 0) * scale) / 2,
                top: (canvasHeight - (img.height || 0) * scale) / 2,
                scaleX: scale,
                scaleY: scale,
            });

            canvas.add(img);
            canvas.setActiveObject(img);
            canvas.renderAll();
        }
    } catch (error: unknown) {
        console.error("AI Generation Failed:", error);
        const message = error instanceof Error ? error.message : "Unknown error occurred";
        alert("Failed to generate image: " + message);
    } finally {
        setIsGenerating(false);
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

  return (
    <Box p="md" w={300}>
      <Box mt="xs">
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

      <ScrollArea h="calc(100vh - 140px)" mx="-xs" px="xs">
        {activeTab === 'elements' ? <Accordion multiple defaultValue={['ai']}>
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

            <Accordion.Item value="media">
              <Accordion.Control>Media</Accordion.Control>
              <Accordion.Panel>
                <SimpleGrid cols={3} spacing="xs">
                  <ElementItem icon={ImageIcon} label="Image" onClick={handleAddMedia} />
                </SimpleGrid>
              </Accordion.Panel>
            </Accordion.Item>

            <Accordion.Item value="ai">
              <Accordion.Control icon={<SparklesIcon size={18} />}>
                AI Image Generator
              </Accordion.Control>
              <Accordion.Panel>
                <Stack gap="xs">
                  <SegmentedControl
                    value={promptMode}
                    onChange={setPromptMode}
                    data={[
                      { 
                        label: (
                          <Group gap={6}>
                            <Wand2Icon size={14} />
                            <Text size="xs">Basic</Text>
                          </Group>
                        ), 
                        value: 'basic' 
                      },
                      { 
                        label: (
                          <Group gap={6}>
                            <Settings2Icon size={14} />
                            <Text size="xs">Advanced</Text>
                          </Group>
                        ), 
                        value: 'advanced' 
                      },
                    ]}
                    size="xs"
                    fullWidth
                    mb="xs"
                  />

                  <Text size="xs" fw={500} c="dimmed">Subject (Required)</Text>
                  <Textarea 
                    placeholder="e.g. A cat wearing sunglasses"
                    autosize
                    minRows={3}
                    value={aiParams.subject}
                    onChange={(e) => setAiParams({...aiParams, subject: e.currentTarget.value})}
                  />

                  <Text size="xs" fw={500} c="dimmed" mt={4}>Theme / Style</Text>
                  <Select
                    placeholder="Select style"
                    data={[
                      'Photorealistic', 'Cinematic', '3D Render', 'Anime', 'Digital Art', 
                      'Oil Painting', 'Watercolor', 'Cyberpunk', 'Minimalist', 'Sketch', 
                      'Vintage', 'Pop Art', 'Isometric'
                    ]}
                    value={aiParams.theme}
                    onChange={(val) => setAiParams({...aiParams, theme: val || ''})}
                    searchable
                    clearable
                  />

                  {/* ADVANCED FIELDS */}
                  <Collapse in={promptMode === 'advanced'}>
                    <Stack gap="xs" mt="xs">
                      <Divider label="Visual Details" labelPosition="center" />
                      
                      <SimpleGrid cols={2}>
                        <div>
                          <Group gap={4} mb={2}>
                            <SunIcon size={12} style={{ opacity: 0.7 }} />
                            <Text size="xs" fw={500} c="dimmed">Lighting</Text>
                          </Group>
                          <Select
                            placeholder="Select"
                            data={['Natural', 'Studio', 'Neon', 'Golden Hour', 'Cinematic', 'Dark/Moody', 'Softbox']}
                            value={aiParams.lighting}
                            onChange={(val) => setAiParams({...aiParams, lighting: val || ''})}
                            size="xs"
                          />
                        </div>
                        <div>
                          <Group gap={4} mb={2}>
                            <PaletteIcon size={12} style={{ opacity: 0.7 }} />
                            <Text size="xs" fw={500} c="dimmed">Colors</Text>
                          </Group>
                          <Select
                            placeholder="Select"
                            data={['Vibrant', 'Pastel', 'Black & White', 'Warm Tone', 'Cool Tone', 'Muted', 'Neon']}
                            value={aiParams.colorPalette}
                            onChange={(val) => setAiParams({...aiParams, colorPalette: val || ''})}
                            size="xs"
                          />
                        </div>
                      </SimpleGrid>

                      <SimpleGrid cols={2}>
                        <div>
                          <Group gap={4} mb={2}>
                            <CameraIcon size={12} style={{ opacity: 0.7 }} />
                            <Text size="xs" fw={500} c="dimmed">Angle</Text>
                          </Group>
                          <Select
                            placeholder="Select"
                            data={['Wide Shot', 'Close Up', 'Macro', 'Drone View', 'Eye Level', 'Low Angle']}
                            value={aiParams.composition}
                            onChange={(val) => setAiParams({...aiParams, composition: val || ''})}
                            size="xs"
                          />
                        </div>
                        <div>
                          <Group gap={4} mb={2}>
                            <BoxIcon size={12} style={{ opacity: 0.7 }} />
                            <Text size="xs" fw={500} c="dimmed">Texture</Text>
                          </Group>
                          <Select
                            placeholder="Select"
                            data={['Smooth', 'Rough', 'Metallic', 'Wooden', 'Glass', 'Fabric', 'Paper']}
                            value={aiParams.texture}
                            onChange={(val) => setAiParams({...aiParams, texture: val || ''})}
                            size="xs"
                          />
                        </div>
                      </SimpleGrid>

                      <Divider label="Context" labelPosition="center" mt="xs" />

                      <Text size="xs" fw={500} c="dimmed">Background</Text>
                      <TextInput
                        placeholder="e.g. Busy street, White studio, Forest"
                        value={aiParams.background}
                        onChange={(e) => setAiParams({...aiParams, background: e.currentTarget.value})}
                        size="xs"
                      />

                      <SimpleGrid cols={2}>
                          <div>
                            <Text size="xs" fw={500} c="dimmed">Mood</Text>
                            <Select
                                placeholder="Select"
                                data={['Happy', 'Professional', 'Dark', 'Energetic', 'Calm', 'Mysterious', 'Romantic']}
                                value={aiParams.mood}
                                onChange={(val) => setAiParams({...aiParams, mood: val || ''})}
                                size="xs"
                            />
                          </div>
                          <div>
                            <Text size="xs" fw={500} c="dimmed">Purpose</Text>
                            <Select
                                placeholder="Select"
                                data={['Social Media', 'Ad Banner', 'Logo', 'Website', 'Wallpaper']}
                                value={aiParams.purpose}
                                onChange={(val) => setAiParams({...aiParams, purpose: val || ''})}
                                size="xs"
                            />
                          </div>
                      </SimpleGrid>

                      <Divider label="Format & Quality" labelPosition="center" mt="xs" />

                      <SimpleGrid cols={2}>
                        <div>
                           <Group gap={4} mb={2}>
                            <MaximizeIcon size={12} style={{ opacity: 0.7 }} />
                            <Text size="xs" fw={500} c="dimmed">Aspect Ratio</Text>
                          </Group>
                          <Select
                            value={aiParams.aspectRatio}
                            onChange={(val) => setAiParams({...aiParams, aspectRatio: val || 'square'})}
                            data={[
                              { value: 'square', label: 'Square (1:1)' },
                              { value: 'landscape', label: 'Landscape (16:9)' },
                              { value: 'portrait', label: 'Portrait (9:16)' },
                              { value: 'custom', label: 'Custom Size' }
                            ]}
                            size="xs"
                            allowDeselect={false}
                          />
                        </div>
                        <div>
                           <Group gap={4} mb={2}>
                            <SparklesIcon size={12} style={{ opacity: 0.7 }} />
                            <Text size="xs" fw={500} c="dimmed">Quality</Text>
                          </Group>
                          <Select
                            value={aiParams.quality}
                            onChange={(val) => setAiParams({...aiParams, quality: val || 'standard'})}
                            data={[
                              { value: 'standard', label: 'Standard' },
                              { value: 'hd', label: 'High Def (HD)' }
                            ]}
                            size="xs"
                            allowDeselect={false}
                          />
                        </div>
                      </SimpleGrid>

                      {/* CUSTOM SIZE INPUTS */}
                      <Collapse in={aiParams.aspectRatio === 'custom'}>
                        <SimpleGrid cols={2} mt="xs">
                            <div>
                                <Group gap={4} mb={2}>
                                    <ScalingIcon size={12} style={{ opacity: 0.7 }} />
                                    <Text size="xs" fw={500} c="dimmed">Width (px)</Text>
                                </Group>
                                <NumberInput
                                    value={aiParams.width}
                                    onChange={(val) => setAiParams({...aiParams, width: Number(val) || 1024})}
                                    size="xs"
                                    min={256}
                                    max={2048}
                                />
                            </div>
                            <div>
                                <Group gap={4} mb={2}>
                                    <ScalingIcon size={12} style={{ opacity: 0.7 }} />
                                    <Text size="xs" fw={500} c="dimmed">Height (px)</Text>
                                </Group>
                                <NumberInput
                                    value={aiParams.height}
                                    onChange={(val) => setAiParams({...aiParams, height: Number(val) || 1024})}
                                    size="xs"
                                    min={256}
                                    max={2048}
                                />
                            </div>
                        </SimpleGrid>
                      </Collapse>

                      <div>
                        <Group gap={4} mt={4}>
                          <Text size="xs" fw={500} c="dimmed" c="red.4">Negative Prompt</Text>
                          <Tooltip label="Describe what you do NOT want in the image">
                            <InfoIcon size={12} style={{ opacity: 0.5 }} />
                          </Tooltip>
                        </Group>
                        <Textarea 
                          placeholder="e.g. blurry, low quality, text, distorted"
                          autosize
                          minRows={2}
                          value={aiParams.negativePrompt}
                          onChange={(e) => setAiParams({...aiParams, negativePrompt: e.currentTarget.value})}
                          size="xs"
                        />
                      </div>
                    </Stack>
                  </Collapse>

                  <Button 
                    onClick={handleGenerateAI} 
                    leftSection={isGenerating ? <Loader size={16} color="white"/> : <SparklesIcon size={16} />}
                    disabled={isGenerating || !aiParams.subject.trim()}
                    fullWidth
                    mt="sm"
                    variant="gradient" 
                    gradient={{ from: 'indigo', to: 'cyan' }}
                  >
                    {isGenerating ? 'Generating Magic...' : 'Generate Image'}
                  </Button>
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>

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
