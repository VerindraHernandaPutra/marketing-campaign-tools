import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ScrollArea, Accordion, Group, Text, UnstyledButton, SimpleGrid, useMantineTheme, 
  Divider, Box, MantineTheme, Button, Stack, Loader, Select, Textarea, 
  Collapse, NumberInput, Paper, ActionIcon, Badge, Tooltip, 
  FileInput, CloseButton, Image as MantineImage, SegmentedControl,
  useMantineColorScheme, TextInput // Added TextInput
} from '@mantine/core';
import { 
  ImageIcon, TypeIcon, SquareIcon, CircleIcon, TriangleIcon, FileTextIcon, 
  BoxIcon, HexagonIcon, MinusIcon, BaselineIcon, SparklesIcon, 
  Settings2Icon, PaletteIcon, SunIcon, MaximizeIcon, ScalingIcon,
  MessageSquareIcon, ArrowRightIcon, ApertureIcon, ClockIcon, CloudRainIcon, PaintbrushIcon,
  EyeIcon, CameraIcon, UploadIcon, RefreshCw, LayersIcon, TrashIcon, EyeOffIcon, LockIcon, UnlockIcon,
  Shapes, GripVerticalIcon, Edit2Icon, CheckIcon // Added Layer Icons
} from 'lucide-react';
import { useFabricCanvas } from '../../context/CanvasContext';
import { useNotification } from '../../context/NotificationContext'; 
import { Rect, Circle, Triangle, Line, Textbox, Ellipse, Polygon, Polyline, Image as FabricImage, Object as FabricObject } from 'fabric';
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

// Added Interface from source
interface CustomFabricObject extends FabricObject {
    name?: string;
}

const Sidebar: React.FC<SidebarProps> = () => {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';

  const [activeTab, setActiveTab] = useState<string | null>('elements');
  const [isGenerating, setIsGenerating] = useState(false);
  const { canvas, selectedObject } = useFabricCanvas();
  const notify = useNotification(); 
  
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // --- Layers State (Updated from Source) ---
  const [layers, setLayers] = useState<CustomFabricObject[]>([]);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Renaming State (Added from Source)
  const [editingLayerId, setEditingLayerId] = useState<number | null>(null);
  const [tempLayerName, setTempLayerName] = useState('');

  // --- AI State ---
  const [mode, setMode] = useState<'classic' | 'chat'>('chat');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentPrompt, setCurrentPrompt] = useState('');
  
  // --- Image Input State ---
  const [aiImage, setAiImage] = useState<File | null>(null);
  const [aiImagePreview, setAiImagePreview] = useState<string | null>(null);
  
  const [aiParams, setAiParams] = useState({
    aspectRatio: 'square', 
    width: 1024,
    height: 1024,
    quality: 'standard',
    medium: '', style: '', colorPalette: '',
    camera: '', lens: '', perspective: '', lighting: '',
    timeOfDay: '', weather: '', mood: '', texture: '',
    composition: '', complexity: '', negativePrompt: ''
  });

  const syncLayers = useCallback(() => {
    if (canvas) {
      setLayers([...canvas.getObjects()].reverse() as CustomFabricObject[]);
    }
  }, [canvas]);

  useEffect(() => {
    if (!canvas) return;
    syncLayers();
    const handleMutation = () => syncLayers();

    canvas.on('object:added', handleMutation);
    canvas.on('object:removed', handleMutation);
    canvas.on('object:modified', handleMutation);
    canvas.on('selection:created', handleMutation); 
    canvas.on('selection:updated', handleMutation);
    canvas.on('selection:cleared', handleMutation);

    return () => {
      canvas.off('object:added', handleMutation);
      canvas.off('object:removed', handleMutation);
      canvas.off('object:modified', handleMutation);
      canvas.off('selection:created', handleMutation);
      canvas.off('selection:updated', handleMutation);
      canvas.off('selection:cleared', handleMutation);
    };
  }, [canvas, syncLayers]);

  // --- Layer Actions (Updated Logic) ---
  const selectLayer = (obj: CustomFabricObject) => {
    if (!canvas) return;
    canvas.setActiveObject(obj);
    canvas.renderAll();
  };

  const deleteLayer = (e: React.MouseEvent, obj: CustomFabricObject) => {
    e.stopPropagation();
    if (!canvas) return;
    canvas.remove(obj);
    canvas.discardActiveObject();
    canvas.renderAll();
  };

  const toggleVisibility = (e: React.MouseEvent, obj: CustomFabricObject) => {
    e.stopPropagation();
    if (!canvas) return;
    obj.set('visible', !obj.visible);
    if (!obj.visible) {
      canvas.discardActiveObject();
    }
    canvas.renderAll();
    syncLayers();
  };

  const toggleLock = (e: React.MouseEvent, obj: CustomFabricObject) => {
    e.stopPropagation();
    if (!canvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isLocked = !(obj as any).lockMovementX;
    obj.set({
      lockMovementX: isLocked,
      lockMovementY: isLocked,
      lockRotation: isLocked,
      lockScalingX: isLocked,
      lockScalingY: isLocked,
      selectable: !isLocked, 
      evented: !isLocked
    });
    canvas.discardActiveObject();
    canvas.renderAll();
    syncLayers();
  };

  // --- Layer Renaming Logic (Added from Source) ---
  const startRenaming = (e: React.MouseEvent, index: number, currentName: string) => {
      e.stopPropagation();
      setEditingLayerId(index);
      setTempLayerName(currentName);
  };

  const saveLayerName = (index: number) => {
      const obj = layers[index];
      if (obj) {
          obj.set('name', tempLayerName);
          setLayers(prev => {
              const newLayers = [...prev];
              newLayers[index] = { ...obj, name: tempLayerName };
              return newLayers;
          });
      }
      setEditingLayerId(null);
  };

  // --- Drag and Drop Logic (Added from Source) ---
  const setDragItem = (index: number | null) => { dragItem.current = index; };
  const setDragOverItem = (index: number | null) => { dragOverItem.current = index; };

  const handleSort = () => {
    if (dragItem.current === null || dragOverItem.current === null || !canvas) return;

    const items = [...layers];
    const draggedItemContent = items.splice(dragItem.current, 1)[0];
    items.splice(dragOverItem.current, 0, draggedItemContent);
    
    setDragItem(null);
    setDragOverItem(null);
    setLayers(items);

    // Sync with Fabric Canvas (Reverse logic as UI is reversed)
    const newStackOrder = [...items].reverse();
    newStackOrder.forEach((obj, index) => {
        canvas.moveObjectTo(obj, index);
    });
    canvas.requestRenderAll();
  };

  const getLayerIcon = (type: string | undefined) => {
    switch(type) {
      case 'i-text':
      case 'textbox': return <TypeIcon size={14} />;
      case 'image': return <ImageIcon size={14} />;
      case 'rect': return <SquareIcon size={14} />;
      case 'circle': return <CircleIcon size={14} />;
      case 'triangle': return <TriangleIcon size={14} />;
      case 'line': return <MinusIcon size={14} />;
      case 'ellipse': return <CircleIcon size={14} />;
      case 'polygon': return <HexagonIcon size={14} />;
      case 'polyline': return <MinusIcon size={14} />;
      default: return <BoxIcon size={14} />;
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getLayerName = (obj: any) => {
    if (obj.name) return obj.name; 
    if (obj.type === 'textbox' || obj.type === 'i-text') {
      return obj.text ? `"${obj.text.substring(0, 15)}${obj.text.length > 15 ? '...' : ''}"` : 'Text Layer';
    }
    return obj.type ? obj.type.charAt(0).toUpperCase() + obj.type.slice(1) : 'Layer';
  };

  useEffect(() => {
    if (chatScrollRef.current) {
        chatScrollRef.current.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [chatHistory, isGenerating, activeTab]);

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

  const handleImageUpload = (file: File | null) => {
    setAiImage(file);
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => setAiImagePreview(e.target?.result as string);
        reader.readAsDataURL(file);
    } else {
        setAiImagePreview(null);
    }
  };

  const resizeAndConvertImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const maxWidth = 800; 
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
          
          const elem = document.createElement('canvas');
          elem.width = width;
          elem.height = height;
          const ctx = elem.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(elem.toDataURL('image/jpeg', 0.8)); 
          } else {
            reject(new Error("Canvas context failed"));
          }
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const resizeDataURL = (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
        const img = new window.Image();
        img.src = dataUrl;
        img.onload = () => {
            const maxWidth = 800;
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                height *= maxWidth / width;
                width = maxWidth;
            }

            const elem = document.createElement('canvas');
            elem.width = width;
            elem.height = height;
            const ctx = elem.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0, width, height);
                resolve(elem.toDataURL('image/jpeg', 0.7)); 
            } else {
                resolve(dataUrl);
            }
        };
        img.onerror = () => resolve(dataUrl); 
    });
  };

  const clearChat = () => {
      if(confirm('Clear conversation history?')) {
          setChatHistory([]);
          setAiImage(null);
          setAiImagePreview(null);
      }
  }

  const handleGenerateAI = async () => {
    if (!currentPrompt.trim() && !aiImage) return;
    
    setIsGenerating(true);
    const userMessage = currentPrompt || (aiImage ? 'Generate based on this image' : '');
    
    setChatHistory(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'user', 
        content: userMessage, 
        timestamp: Date.now(),
        imageUrl: aiImagePreview || undefined 
    }]);
    
    let referenceImageBase64 = undefined;
    
    try {
        if (aiImage) {
            referenceImageBase64 = await resizeAndConvertImage(aiImage);
        } else if (chatHistory.length > 0) {
            const lastImageMsg = [...chatHistory].reverse().find(m => m.imageUrl);
            if (lastImageMsg && lastImageMsg.imageUrl) {
                referenceImageBase64 = await resizeDataURL(lastImageMsg.imageUrl);
            }
        }
    } catch (e) {
        console.error("Image processing failed", e);
        notify.error("Error", "Failed to process image context.");
        setIsGenerating(false);
        return;
    }

    setCurrentPrompt('');
    setAiImage(null);
    setAiImagePreview(null);

    try {
        const { data, error } = await supabase.functions.invoke('generate-image', {
            body: { 
                params: { 
                    ...aiParams, 
                    subject: currentPrompt || "A creative image",
                    referenceImage: referenceImageBase64 
                } 
            }
        });

        if (error) {
            console.error("Supabase Function Error:", error);
            throw new Error(error.message || "Server error");
        }
        
        if (data && data.image) {
            setChatHistory(prev => [
                ...prev, 
                { 
                    id: (Date.now() + 1).toString(), 
                    role: 'ai', 
                    imageUrl: data.image, 
                    promptUsed: currentPrompt,
                    timestamp: Date.now() 
                }
            ]);
        } else if (data && data.error) {
            throw new Error(data.error);
        }
    } catch (error: unknown) {
        console.error("AI Gen Error:", error);
        const msg = error instanceof Error ? error.message : "Unknown error";
        setChatHistory(prev => [...prev, { id: Date.now().toString(), role: 'ai', content: "Error: " + msg, timestamp: Date.now() }]);
        notify.error("Generation Failed", msg);
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
            style={{ 
                padding: 8, 
                borderRadius: 8, 
                flex: 1, 
                textAlign: 'center', 
                color: activeTab === 'layers' 
                    ? (isDark ? theme.white : theme.colors.blue[6]) 
                    : 'inherit',
                backgroundColor: activeTab === 'layers' 
                    ? (isDark ? theme.colors.dark[6] : theme.colors.gray[1]) 
                    : 'transparent' 
            }} 
            onClick={() => setActiveTab('layers')}
          >
            <Group gap={4} justify="center">
                <LayersIcon size={16} />
                <Text size="sm" fw={500}>Layers</Text>
            </Group>
          </UnstyledButton>
          <UnstyledButton 
            className="hover:bg-gray-0 dark:hover:bg-dark-6"
            style={{ 
                padding: 8, 
                borderRadius: 8, 
                flex: 1, 
                textAlign: 'center',
                color: activeTab === 'elements' 
                    ? (isDark ? theme.white : theme.colors.blue[6]) 
                    : 'inherit',
                backgroundColor: activeTab === 'elements' 
                    ? (isDark ? theme.colors.dark[6] : theme.colors.gray[1]) 
                    : 'transparent' 
            }} 
            onClick={() => setActiveTab('elements')}
          >
            <Group gap={4} justify="center">
                <Shapes size={16} />
                <Text size="sm" fw={500}>Elements</Text>
            </Group>
          </UnstyledButton>
        </Group>
        <Divider mb="md" />
      </Box>

      <ScrollArea h="calc(100vh - 140px)" mx="-xs" px="xs">
        
        {/* MODIFIED: Layer Functionality from Source */}
        {activeTab === 'layers' && (
            <Stack gap={6}>
                {layers.length === 0 ? (
                    <Text c="dimmed" ta="center" mt="xl" size="sm">Canvas is empty.</Text>
                ) : (
                    layers.map((obj, index) => {
                        const isActive = selectedObject === obj;
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const isLocked = (obj as any).lockMovementX; 
                        const isEditing = editingLayerId === index;

                        return (
                            <Paper 
                                key={index} 
                                withBorder 
                                p={8} 
                                radius="md"
                                bg={isActive ? (isDark ? theme.colors.blue[9] : 'blue.0') : (isDragging && dragItem.current === index ? (isDark ? theme.colors.dark[5] : theme.colors.gray[1]) : 'transparent')}
                                draggable={!isEditing}
                                onDragStart={() => { setDragItem(index); setIsDragging(true); }}
                                onDragEnter={() => setDragOverItem(index)}
                                onDragEnd={() => { handleSort(); setIsDragging(false); }}
                                onDragOver={(e) => e.preventDefault()}
                                style={{ 
                                    cursor: isEditing ? 'default' : 'grab',
                                    borderColor: isActive ? theme.colors.blue[4] : undefined,
                                    opacity: isDragging && dragItem.current === index ? 0.5 : 1,
                                    transition: 'background-color 0.2s, border-color 0.2s'
                                }}
                                onClick={() => selectLayer(obj)}
                            >
                                <Group justify="space-between" wrap="nowrap" gap="xs">
                                    {/* Left: Drag Handle & Icon */}
                                    <Group gap="xs" wrap="nowrap" align="center">
                                        <div style={{ cursor: 'grab', opacity: 0.4, display: 'flex', alignItems: 'center' }}>
                                            <GripVerticalIcon size={14} />
                                        </div>
                                        <div style={{ opacity: 0.7, color: isDark ? theme.white : theme.colors.gray[7] }}>
                                            {getLayerIcon(obj.type)}
                                        </div>
                                    </Group>

                                    {/* Middle: Name (Editable) */}
                                    <Box style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
                                        {isEditing ? (
                                            <Group gap={4} wrap="nowrap">
                                                <TextInput 
                                                    size="xs" 
                                                    value={tempLayerName} 
                                                    onChange={(e) => setTempLayerName(e.currentTarget.value)}
                                                    onKeyDown={(e) => { if(e.key === 'Enter') saveLayerName(index); }}
                                                    autoFocus
                                                    styles={{ input: { height: 24, paddingLeft: 6, paddingRight: 6 } }}
                                                />
                                                <ActionIcon size="xs" color="green" variant="light" onClick={() => saveLayerName(index)}><CheckIcon size={12}/></ActionIcon>
                                            </Group>
                                        ) : (
                                            <Group gap={4} wrap="nowrap" className="group">
                                                <Text size="sm" fw={500} truncate style={{ cursor: 'text' }} onClick={(e) => startRenaming(e, index, getLayerName(obj))}>
                                                    {getLayerName(obj)}
                                                </Text>
                                                <ActionIcon 
                                                    size="xs" variant="transparent" color="gray" 
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={(e) => startRenaming(e, index, getLayerName(obj))}
                                                >
                                                    <Edit2Icon size={10} />
                                                </ActionIcon>
                                            </Group>
                                        )}
                                    </Box>

                                    {/* Right: Actions */}
                                    <Group gap={4} wrap="nowrap">
                                        <ActionIcon size="sm" variant="subtle" color="gray" onClick={(e) => toggleVisibility(e, obj)}>
                                            {obj.visible ? <EyeIcon size={14} /> : <EyeOffIcon size={14} />}
                                        </ActionIcon>
                                        <ActionIcon size="sm" variant="subtle" color="gray" onClick={(e) => toggleLock(e, obj)}>
                                            {isLocked ? <LockIcon size={14} /> : <UnlockIcon size={14} />}
                                        </ActionIcon>
                                        <ActionIcon size="sm" variant="subtle" color="red" onClick={(e) => deleteLayer(e, obj)}>
                                            <TrashIcon size={14} />
                                        </ActionIcon>
                                    </Group>
                                </Group>
                            </Paper>
                        );
                    })
                )}
            </Stack>
        )}

        {activeTab === 'elements' && (
          <Accordion multiple defaultValue={['ai']}>
            
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
                        {/* DARK MODE ADJUSTMENT: Chat History Area */}
                        <ScrollArea 
                            h={350} 
                            viewportRef={chatScrollRef}
                            type="auto"
                            offsetScrollbars
                            bg={isDark ? theme.colors.dark[7] : theme.colors.gray[0]} // Explicit theme colors
                            p="xs"
                            mb="sm"
                            style={{ 
                                borderRadius: theme.radius.md,
                                border: `1px solid ${isDark ? theme.colors.dark[4] : theme.colors.gray[3]}`
                            }}
                        >
                            <Stack gap="md">
                                {chatHistory.length === 0 && (
                                    <Text size="xs" c="dimmed" ta="center" mt="xl">
                                            Describe your vision or upload a reference image to start.
                                    </Text>
                                )}
                                {chatHistory.map((msg) => (
                                    <Box key={msg.id} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '90%', marginLeft: msg.role === 'user' ? 'auto' : 0 }}>
                                            {msg.role === 'user' ? (
                                                <Paper 
                                                    p="xs" 
                                                    radius="md" 
                                                    bg={isDark ? theme.colors.blue[9] : theme.colors.blue[1]}
                                                    style={{
                                                        color: isDark ? theme.white : theme.black
                                                    }}
                                                >
                                                        {msg.imageUrl && (
                                                            <MantineImage 
                                                                src={msg.imageUrl} 
                                                                radius="sm" 
                                                                h={100} 
                                                                w="auto" 
                                                                fit="contain" 
                                                                mb={msg.content ? "xs" : 0} 
                                                                bg="white"
                                                            />
                                                        )}
                                                        {msg.content && <Text size="xs">{msg.content}</Text>}
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
                                    <Group gap={4} justify="center" mt="xs">
                                            <Loader size="xs" type="dots" />
                                            <Text size="xs" c="dimmed">Generating...</Text>
                                    </Group>
                                )}
                            </Stack>
                        </ScrollArea>

                        <Box>
                            {aiImagePreview && (
                                <Box pos="relative" mb="xs">
                                    <MantineImage src={aiImagePreview} h={60} w="auto" radius="sm" fit="contain" bg="gray.1" style={{ border: '1px solid #ddd' }} />
                                    <ActionIcon 
                                        size="xs" color="red" variant="filled" radius="xl" 
                                        pos="absolute" top={-5} right={-5}
                                        onClick={() => handleImageUpload(null)}
                                    >
                                        <CloseButton size="xs" iconSize={12} />
                                    </ActionIcon>
                                </Box>
                            )}

                            <Group align="flex-start" gap="xs" wrap="nowrap">
                                <Stack gap={4} style={{ flex: 1 }}>
                                    {/* DARK MODE ADJUSTMENT: Input Field */}
                                    <Textarea 
                                        placeholder={aiImage ? "Instructions..." : "Describe image..."}
                                        autosize 
                                        minRows={1} 
                                        maxRows={3}
                                        value={currentPrompt}
                                        onChange={(e) => setCurrentPrompt(e.currentTarget.value)}
                                        onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerateAI(); } }}
                                        size="sm"
                                        radius="md"
                                        styles={{
                                            input: {
                                                backgroundColor: isDark ? theme.colors.dark[6] : theme.white,
                                                color: isDark ? theme.white : theme.black,
                                                borderColor: isDark ? theme.colors.dark[4] : theme.colors.gray[4]
                                            }
                                        }}
                                    />
                                    <Group justify="space-between">
                                        <Group gap={4}>
                                            <Tooltip label="Upload Reference Image">
                                                <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => document.getElementById('chat-image-upload')?.click()}>
                                                    <UploadIcon size={16} />
                                                </ActionIcon>
                                            </Tooltip>
                                            {aiImage && <Text size="xs" c="dimmed" lineClamp={1} maw={100}>{aiImage.name}</Text>}
                                        </Group>
                                        
                                        {chatHistory.length > 0 && (
                                            <Tooltip label="Clear History">
                                                <ActionIcon variant="subtle" color="gray" size="sm" onClick={clearChat}>
                                                    <RefreshCw size={14} />
                                                </ActionIcon>
                                            </Tooltip>
                                        )}
                                    </Group>
                                </Stack>
                                
                                <ActionIcon 
                                    variant="default" 
                                    size="xl" 
                                    radius="md"
                                    onClick={handleGenerateAI} 
                                    disabled={isGenerating || (!currentPrompt.trim() && !aiImage)}
                                    style={{ borderColor: theme.colors.gray[4] }}
                                >
                                    <ArrowRightIcon size={20} />
                                </ActionIcon>
                            </Group>

                            <FileInput 
                                accept="image/png,image/jpeg" 
                                value={aiImage}
                                onChange={handleImageUpload}
                                display="none"
                                id="chat-image-upload"
                            />
                        </Box>
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
                        <FileInput 
                            label="Reference Image"
                            placeholder="Upload an image to guide the AI"
                            accept="image/png,image/jpeg"
                            value={aiImage}
                            onChange={handleImageUpload}
                            leftSection={<UploadIcon size={14}/>}
                            clearable
                        />
                        {aiImagePreview && (
                            <MantineImage src={aiImagePreview} h={100} fit="contain" radius="sm" bg="gray.1" />
                        )}
                        <Button onClick={handleGenerateAI} loading={isGenerating} fullWidth variant="gradient" gradient={{ from: 'indigo', to: 'cyan' }}>
                            Generate
                        </Button>
                    </Stack>
                  )}

                  <Accordion variant="separated" radius="md" chevronPosition="left" styles={{ label: { fontSize: 12, fontWeight: 600 }, control: { height: 36 } }} mt="sm">
                    <Accordion.Item value="settings">
                        <Accordion.Control>Advanced Controls</Accordion.Control>
                        <Accordion.Panel>
                            <Stack gap="xs">
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
        )}
      </ScrollArea>
    </Box>
  );
};

export default Sidebar;