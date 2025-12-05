// [cite: src/components/Layout/Sidebar.tsx]
import React, { useState, useEffect, useRef } from 'react';
import { ScrollArea, Accordion, Group, Text, UnstyledButton, SimpleGrid, useMantineTheme, Divider, Box, MantineTheme, Button, Stack, Loader, Select, Textarea, SegmentedControl, Collapse, NumberInput, Paper, ActionIcon, Badge, Tooltip } from '@mantine/core';
import { 
  ImageIcon, TypeIcon, SquareIcon, CircleIcon, TriangleIcon, FileTextIcon, 
  BoxIcon, HexagonIcon, MinusIcon, BaselineIcon, SparklesIcon, 
  Settings2Icon, PaletteIcon, SunIcon, MaximizeIcon, ScalingIcon,
  MessageSquareIcon, ArrowRightIcon, ApertureIcon, ClockIcon, CloudRainIcon, PaintbrushIcon,
  EyeIcon, CameraIcon
} from 'lucide-react';
import { useFabricCanvas } from '../../context/CanvasContext';
import { useNotification } from '../../context/NotificationContext'; 
import { Rect, Circle, Triangle, Line, Textbox, Ellipse, Polygon, Polyline, Image as FabricImage } from 'fabric';
import { supabase } from '../../supabaseClient';

interface SidebarProps {
  opened: boolean;
  onToggle: () => void;
}

type ChatMessage = {
  id: string;
  role: 'user' | 'ai';
  content?: string;
  imageUrl?: string;
  timestamp: number;
  promptUsed?: string;
};

const Sidebar: React.FC<SidebarProps> = () => {
  const theme = useMantineTheme();
  const [activeTab, setActiveTab] = useState<string | null>('elements');
  const [isGenerating, setIsGenerating] = useState(false);
  const { canvas } = useFabricCanvas();
  const notify = useNotification(); 
  const scrollViewport = useRef<HTMLDivElement>(null);

  // --- AI State ---
  const [mode, setMode] = useState<'classic' | 'chat'>('chat');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentPrompt, setCurrentPrompt] = useState('');
  
  // --- Advanced AI Parameters ---
  const [aiParams, setAiParams] = useState({
    // Base
    aspectRatio: 'square', 
    width: 1024,
    height: 1024,
    quality: 'standard',
    
    // Artistic
    medium: '',       // e.g., Photography, Digital Art
    style: '',        // e.g., Minimalist, Cyberpunk
    colorPalette: '', // e.g., Vivid, Pastel
    
    // Photographic
    camera: '',       // e.g., DSLR, Drone
    lens: '',         // e.g., Wide Angle, Macro
    perspective: '',  // e.g., Isometric, Bird's Eye
    lighting: '',     // e.g., Studio, Neon
    
    // Environment
    timeOfDay: '',    // e.g., Sunset, Midnight
    weather: '',      // e.g., Clear, Foggy
    
    // Composition
    composition: '',  // e.g., Rule of Thirds
    complexity: '',   // e.g., Simple, Highly Detailed
    
    // Other
    mood: '',
    texture: '',
    negativePrompt: ''
  });

  // Auto-scroll chat
  useEffect(() => {
    if (scrollViewport.current) {
        scrollViewport.current.scrollTo({ top: scrollViewport.current.scrollHeight, behavior: 'smooth' });
    }
  }, [chatHistory, isGenerating]);

  // --- Helpers ---
  const addToCanvas = async (imageUrl: string) => {
    if (!canvas) return;
    try {
        const img = await FabricImage.fromURL(imageUrl);
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
        notify.success('Image Added', 'Added to canvas successfully');
    } catch (e) {
        console.error(e);
        notify.error('Error', 'Failed to add image to canvas');
    }
  };

  const addShape = (shapeType: string) => {
      if (!canvas) return;
      let shape;
      const options = { left: 100, top: 100, fill: theme.colors.blue[4], width: 100, height: 100 };
      switch (shapeType) {
        case 'rect': shape = new Rect(options); break;
        case 'circle': shape = new Circle({ ...options, radius: 50 }); break;
        case 'triangle': shape = new Triangle(options); break;
        case 'line': shape = new Line([50, 50, 150, 150], { left: 50, top: 50, stroke: theme.colors.blue[4], strokeWidth: 4 }); break;
        case 'ellipse': shape = new Ellipse({ left: 100, top: 100, rx: 75, ry: 50, fill: theme.colors.grape[4] }); break;
        case 'polygon': shape = new Polygon([{ x: 50, y: 0 }, { x: 100, y: 25 }, { x: 100, y: 75 }, { x: 50, y: 100 }, { x: 0, y: 75 }, { x: 0, y: 25 }], { left: 150, top: 150, fill: theme.colors.lime[4] }); break;
        case 'polyline': shape = new Polyline([{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 0, y: 100 }, { x: 100, y: 100 }], { left: 200, top: 200, fill: '', stroke: theme.colors.pink[4], strokeWidth: 4 }); break;
      }
      if (shape) { canvas.add(shape); canvas.setActiveObject(shape); canvas.renderAll(); }
  };
  
  const addText = (textType: string) => {
      if (!canvas) return;
      const text = new Textbox(textType === 'heading' ? 'Heading' : 'Text', { left: 100, top: 100 });
      canvas.add(text);
      canvas.setActiveObject(text);
      canvas.renderAll();
  };

  const handleAddMedia = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (f) => addToCanvas(f.target?.result as string);
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  // --- AI GENERATION ---
  const handleGenerateAI = async () => {
    if (!currentPrompt.trim()) return;
    
    setIsGenerating(true);
    const userMessage = currentPrompt;
    
    // Contextual Prompt Logic
    let finalSubject = userMessage;
    if (mode === 'chat' && chatHistory.length > 0) {
        const lastAiResponse = [...chatHistory].reverse().find(m => m.role === 'ai');
        if (lastAiResponse && lastAiResponse.promptUsed) {
            finalSubject = `${lastAiResponse.promptUsed}. Modification: ${userMessage}`;
        }
    }

    setChatHistory(prev => [...prev, { id: Date.now().toString(), role: 'user', content: userMessage, timestamp: Date.now() }]);
    setCurrentPrompt('');

    try {
        const { data, error } = await supabase.functions.invoke('generate-image', {
            body: { 
                params: { ...aiParams, subject: finalSubject } 
            }
        });

        if (error) throw error;
        
        if (data && data.image) {
            setChatHistory(prev => [
                ...prev, 
                { 
                    id: (Date.now() + 1).toString(), 
                    role: 'ai', 
                    imageUrl: data.image, 
                    promptUsed: finalSubject,
                    timestamp: Date.now() 
                }
            ]);
        }
    } catch (error: unknown) {
        console.error("AI Gen Error:", error);
        const msg = error instanceof Error ? error.message : "Unknown error";
        setChatHistory(prev => [...prev, { id: Date.now().toString(), role: 'ai', content: "Error: " + msg, timestamp: Date.now() }]);
    } finally {
        setIsGenerating(false);
    }
  };

  const ElementItem = ({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void; }) => (
    <UnstyledButton
      onClick={onClick}
      className="hover:bg-gray-0 dark:hover:bg-dark-6"
      style={(theme: MantineTheme) => ({
        display: 'flex', flexDirection: 'column', alignItems: 'center', padding: theme.spacing.xs,
        borderRadius: theme.radius.md, color: `light-dark(${theme.black}, ${theme.colors.dark[0]})`,
      })}
    >
      <Icon size={24} />
      <Text size="xs" mt={4}>{label}</Text>
    </UnstyledButton>
  );

  return (
    <Box p="md" w={300}>
      <Box mt="xs">
        <Group justify="center" mb="md">
          <UnstyledButton 
            className="hover:bg-gray-0 dark:hover:bg-dark-6"
            style={{ padding: 8, borderRadius: 8, flex: 1, textAlign: 'center', 
                     color: activeTab === 'templates' ? theme.colors.blue[6] : 'inherit',
                     backgroundColor: activeTab === 'templates' ? theme.colors.gray[1] : 'transparent' }} 
            onClick={() => setActiveTab('templates')}
          >
            <Text size="sm" fw={500}>Templates</Text>
          </UnstyledButton>
          <UnstyledButton 
            className="hover:bg-gray-0 dark:hover:bg-dark-6"
            style={{ padding: 8, borderRadius: 8, flex: 1, textAlign: 'center',
                     color: activeTab === 'elements' ? theme.colors.blue[6] : 'inherit',
                     backgroundColor: activeTab === 'elements' ? theme.colors.gray[1] : 'transparent' }} 
            onClick={() => setActiveTab('elements')}
          >
            <Text size="sm" fw={500}>Elements</Text>
          </UnstyledButton>
        </Group>
        <Divider mb="md" />
      </Box>

      <ScrollArea h="calc(100vh - 140px)" mx="-xs" px="xs" viewportRef={scrollViewport}>
        {activeTab === 'elements' ? <Accordion multiple defaultValue={['ai']}>
            
            {/* AI IMAGE CREATOR */}
            <Accordion.Item value="ai">
              <Accordion.Control icon={<SparklesIcon size={18} color={theme.colors.blue[6]} />}>
                <Text fw={600}>AI Image Creator</Text>
              </Accordion.Control>
              <Accordion.Panel>
                <Stack gap="xs">
                  <SegmentedControl
                    value={mode}
                    onChange={(val: string) => setMode(val as 'chat' | 'classic')}
                    data={[
                      { label: (<Group gap={6}><MessageSquareIcon size={14} /><Text size="xs">Chat</Text></Group>), value: 'chat' },
                      { label: (<Group gap={6}><Settings2Icon size={14} /><Text size="xs">Form</Text></Group>), value: 'classic' },
                    ]}
                    size="xs" fullWidth mb="xs"
                  />

                  {mode === 'chat' && (
                    <Box>
                        {/* Chat Stream */}
                        <Stack gap="md" mb="md">
                            {chatHistory.length === 0 && (
                                <Paper p="sm" bg="gray.0" className="dark:bg-dark-6">
                                    <Text size="xs" c="dimmed" ta="center">
                                        Describe your vision. Refine it with follow-ups.
                                    </Text>
                                </Paper>
                            )}
                            {chatHistory.map((msg) => (
                                <Box key={msg.id} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '90%', marginLeft: msg.role === 'user' ? 'auto' : 0 }}>
                                    {msg.role === 'user' ? (
                                        <Paper p="xs" radius="md" bg="blue.1" className="dark:bg-blue-900">
                                            <Text size="xs">{msg.content}</Text>
                                        </Paper>
                                    ) : (
                                        <Stack gap={4}>
                                            {msg.imageUrl ? (
                                                <div className="relative group cursor-pointer" onClick={() => msg.imageUrl && addToCanvas(msg.imageUrl)}>
                                                    <img src={msg.imageUrl} alt="AI" style={{ width: '100%', borderRadius: 8, border: '1px solid #eee' }} />
                                                    <Badge className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" size="sm" color="dark">Click to Add</Badge>
                                                </div>
                                            ) : (
                                                <Text size="xs" c="red">{msg.content}</Text>
                                            )}
                                        </Stack>
                                    )}
                                </Box>
                            ))}
                            {isGenerating && (
                                <Group gap={4}>
                                    <Loader size="xs" type="dots" />
                                    <Text size="xs" c="dimmed">Creating...</Text>
                                </Group>
                            )}
                        </Stack>

                        {/* Input */}
                        <Group gap={4} align="flex-end">
                            <Textarea 
                                placeholder="Describe image..."
                                autosize minRows={1} maxRows={4}
                                value={currentPrompt}
                                onChange={(e) => setCurrentPrompt(e.currentTarget.value)}
                                onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerateAI(); } }}
                                style={{ flex: 1 }}
                                size="xs"
                            />
                            <ActionIcon variant="filled" color="blue" size="lg" onClick={handleGenerateAI} disabled={isGenerating || !currentPrompt.trim()}>
                                <ArrowRightIcon size={16} />
                            </ActionIcon>
                        </Group>
                    </Box>
                  )}

                  {mode === 'classic' && (
                    <Stack gap="xs">
                        <Textarea 
                            label="Prompt"
                            placeholder="e.g. A futuristic city with neon lights"
                            autosize minRows={3}
                            value={currentPrompt}
                            onChange={(e) => setCurrentPrompt(e.currentTarget.value)}
                        />
                        <Button onClick={handleGenerateAI} loading={isGenerating} fullWidth variant="gradient" gradient={{ from: 'indigo', to: 'cyan' }}>
                            Generate
                        </Button>
                    </Stack>
                  )}

                  {/* --- ADVANCED SETTINGS --- */}
                  <Accordion variant="separated" radius="md" chevronPosition="left" styles={{ label: { fontSize: 12, fontWeight: 600 }, control: { height: 36 } }} mt="sm">
                    <Accordion.Item value="settings">
                        <Accordion.Control>Advanced Controls</Accordion.Control>
                        <Accordion.Panel>
                            <Stack gap="xs">
                                {/* 1. Technical & Size */}
                                <Divider label="Format" labelPosition="left" />
                                <SimpleGrid cols={2}>
                                    <Select 
                                        label="Ratio" size="xs"
                                        data={['square', 'landscape', 'portrait', 'custom']}
                                        value={aiParams.aspectRatio} onChange={(v) => setAiParams({...aiParams, aspectRatio: v || 'square'})}
                                        leftSection={<MaximizeIcon size={12}/>}
                                        allowDeselect={false}
                                    />
                                    <Select 
                                        label="Detail" size="xs"
                                        data={['Simple', 'Detailed', 'Complex', 'Hyper-detailed']}
                                        value={aiParams.complexity} onChange={(v) => setAiParams({...aiParams, complexity: v || ''})}
                                        leftSection={<ScalingIcon size={12}/>}
                                    />
                                </SimpleGrid>
                                
                                {/* CUSTOM SIZE INPUTS */}
                                <Collapse in={aiParams.aspectRatio === 'custom'}>
                                    <SimpleGrid cols={2} mt="xs">
                                        <NumberInput
                                            label="Width" size="xs"
                                            value={aiParams.width}
                                            onChange={(v) => setAiParams({...aiParams, width: Number(v)})}
                                            min={256} max={2048} step={64}
                                        />
                                        <NumberInput
                                            label="Height" size="xs"
                                            value={aiParams.height}
                                            onChange={(v) => setAiParams({...aiParams, height: Number(v)})}
                                            min={256} max={2048} step={64}
                                        />
                                    </SimpleGrid>
                                </Collapse>

                                {/* 2. Artistic & Medium */}
                                <Divider label="Art Style" labelPosition="left" mt="xs" />
                                <Select 
                                    label="Medium" placeholder="Any" size="xs"
                                    data={['Photography', 'Digital Art', 'Oil Painting', 'Watercolor', '3D Render', 'Sketch', 'Vector Art', 'Anime', 'Pixel Art']}
                                    value={aiParams.medium} onChange={(v) => setAiParams({...aiParams, medium: v || ''})}
                                    leftSection={<PaintbrushIcon size={12}/>}
                                    clearable
                                />
                                <Select 
                                    label="Style" placeholder="Any" size="xs"
                                    data={['Minimalist', 'Abstract', 'Surrealism', 'Cyberpunk', 'Steampunk', 'Pop Art', 'Vintage', 'Realistic', 'Fantasy', 'Noir']}
                                    value={aiParams.style} onChange={(v) => setAiParams({...aiParams, style: v || ''})}
                                    clearable
                                />
                                <Select 
                                    label="Palette" placeholder="Any" size="xs"
                                    data={['Vivid', 'Pastel', 'Monochrome', 'Sepia', 'Warm', 'Cool', 'Neon', 'Muted', 'Earth Tones']}
                                    value={aiParams.colorPalette} onChange={(v) => setAiParams({...aiParams, colorPalette: v || ''})}
                                    leftSection={<PaletteIcon size={12}/>}
                                    clearable
                                />

                                {/* 3. Photography & View */}
                                <Divider label="Camera & View" labelPosition="left" mt="xs" />
                                <SimpleGrid cols={2}>
                                    <Tooltip label="Camera Perspective/Angle">
                                        <Select 
                                            placeholder="View" size="xs"
                                            data={['Isometric', 'Drone View', 'Bird\'s Eye', 'Worm\'s Eye', 'First Person', 'Close Up', 'Macro', 'Wide Shot']}
                                            value={aiParams.perspective} onChange={(v) => setAiParams({...aiParams, perspective: v || ''})}
                                            leftSection={<EyeIcon size={12}/>}
                                            label="Perspective"
                                        />
                                    </Tooltip>
                                    <Tooltip label="Camera Lens Type">
                                        <Select 
                                            placeholder="Lens" size="xs"
                                            data={['Wide Angle', 'Telephoto', 'Macro', 'Fish-eye', '35mm', '85mm', 'Tilt-Shift']}
                                            value={aiParams.lens} onChange={(v) => setAiParams({...aiParams, lens: v || ''})}
                                            leftSection={<ApertureIcon size={12}/>}
                                            label="Lens"
                                        />
                                    </Tooltip>
                                </SimpleGrid>
                                <Select 
                                    placeholder="Camera Body" size="xs"
                                    data={['DSLR', 'Polaroid', 'Drone', 'GoPro', 'CCTV', 'Film Camera']}
                                    value={aiParams.camera} onChange={(v) => setAiParams({...aiParams, camera: v || ''})}
                                    leftSection={<CameraIcon size={12}/>}
                                    label="Camera"
                                    mt="xs"
                                />

                                {/* 4. Environment */}
                                <Divider label="Environment" labelPosition="left" mt="xs" />
                                <SimpleGrid cols={2}>
                                    <Select 
                                        placeholder="Lighting" size="xs"
                                        data={['Natural', 'Studio', 'Golden Hour', 'Blue Hour', 'Neon', 'Volumetric', 'Cinematic', 'Rembrandt']}
                                        value={aiParams.lighting} onChange={(v) => setAiParams({...aiParams, lighting: v || ''})}
                                        leftSection={<SunIcon size={12}/>}
                                    />
                                    <Select 
                                        placeholder="Weather" size="xs"
                                        data={['Clear', 'Cloudy', 'Rainy', 'Foggy', 'Snowy', 'Stormy']}
                                        value={aiParams.weather} onChange={(v) => setAiParams({...aiParams, weather: v || ''})}
                                        leftSection={<CloudRainIcon size={12}/>}
                                    />
                                </SimpleGrid>
                                <Select 
                                    placeholder="Time of Day" size="xs"
                                    data={['Sunrise', 'Morning', 'Noon', 'Afternoon', 'Sunset', 'Night', 'Midnight']}
                                    value={aiParams.timeOfDay} onChange={(v) => setAiParams({...aiParams, timeOfDay: v || ''})}
                                    leftSection={<ClockIcon size={12}/>}
                                    mt="xs"
                                />
                            </Stack>
                        </Accordion.Panel>
                    </Accordion.Item>
                  </Accordion>

                </Stack>
              </Accordion.Panel>
            </Accordion.Item>

            {/* Shapes, Text, etc. */}
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

          </Accordion> 
          : 
          <Text c="dimmed" ta="center" mt="xl">No templates available</Text>
        }
      </ScrollArea>
    </Box>
  );
};

export default Sidebar;