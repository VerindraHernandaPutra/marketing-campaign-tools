import React, { useState, useEffect } from 'react';
import { Box, Button, SimpleGrid, Card, Image, Text, Loader, Select, Group, Slider, Stack, Divider } from '@mantine/core';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../auth/useAuth';
import { StaticCanvas } from 'fabric'; 

// Define interfaces
interface CanvasObject {
  type: string;
  src?: string;
  [key: string]: unknown;
}

interface CanvasData {
  width?: number;
  height?: number;
  objects?: CanvasObject[];
  [key: string]: unknown;
}

interface Project {
  id: string;
  title: string;
  thumbnail_url?: string | null;
  canvas_data: CanvasData | null;
}

interface ProjectMediaModalProps {
  onSelect: (files: File[]) => void;
}

const ProjectMediaModal: React.FC<ProjectMediaModalProps> = ({ onSelect }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [media, setMedia] = useState<{ url: string; isProjectDesign: boolean }[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]); // Stores URLs
  const { user } = useAuth();

  // --- Preference States ---
  const [format, setFormat] = useState<'png' | 'jpeg'>('png');
  const [quality, setQuality] = useState(0.8);
  const [multiplier, setMultiplier] = useState(1);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('id, title, thumbnail_url')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
      } else {
        setProjects(data as unknown as Project[]);
      }
      setLoading(false);
    };

    fetchProjects();
  }, [user]);

  useEffect(() => {
    const fetchSelectedCanvas = async () => {
      if (selectedProject) {
        setLoading(true);
        const project = projects.find((p) => p.id === selectedProject);
        
        // Fetch canvas data only when selected (Lazy Load)
        if (project && !project.canvas_data) {
           const { data } = await supabase.from('projects').select('canvas_data').eq('id', selectedProject).single();
           if (data) {
               project.canvas_data = data.canvas_data;
           }
        }

        const images: { url: string; isProjectDesign: boolean }[] = [];

        // 1. Add Project Thumbnail
        const thumbnail = project?.thumbnail_url || 'https://placehold.co/600x400?text=No+Thumbnail';
        images.push({ url: thumbnail, isProjectDesign: true });

        // 2. Add images inside the canvas
        if (project && project.canvas_data && Array.isArray(project.canvas_data.objects)) {
          const canvasImages = project.canvas_data.objects
            .filter((obj: CanvasObject) => obj.type === 'image' && typeof obj.src === 'string')
            .map((obj: CanvasObject) => obj.src as string);
          
          canvasImages.forEach((img: string) => {
            if (!images.find(i => i.url === img)) {
              images.push({ url: img, isProjectDesign: false });
            }
          });
        }
        
        setMedia(images);
        if (images.length > 0) setSelectedMedia([images[0].url]);
        else setSelectedMedia([]);
        setLoading(false);
      } else {
        setMedia([]);
        setSelectedMedia([]);
      }
    };
    
    fetchSelectedCanvas();
  }, [selectedProject, projects]);

  // --- Advanced Generation Logic ---
  const generateImageFromCanvas = async (project: Project): Promise<Blob | null> => {
    if (!project.canvas_data) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const canvasData = project.canvas_data as any;

    // Create a temporary static canvas (invisible)
    const width = canvasData.width || 800;
    const height = canvasData.height || 600;
    
    // Create a temporary canvas element
    const canvasEl = document.createElement('canvas');
    canvasEl.width = width;
    canvasEl.height = height;

    const tempCanvas = new StaticCanvas(canvasEl, {
        width,
        height,
        backgroundColor: '#ffffff'
    });

    // Load data
    await tempCanvas.loadFromJSON(canvasData);
    
    // Ensure background is white if missing (prevents transparency issues in JPEGs)
    if (!tempCanvas.backgroundColor) {
        tempCanvas.backgroundColor = '#ffffff';
    }

    // Render
    tempCanvas.renderAll();

    // Export with preferences
    const dataURL = tempCanvas.toDataURL({
        format: format,
        quality: format === 'jpeg' ? quality : 1,
        multiplier: multiplier,
    });

    // Cleanup
    tempCanvas.dispose();

    // Convert DataURL to Blob
    const res = await fetch(dataURL);
    return await res.blob();
  };

  const handleSelect = async () => {
    setProcessing(true);
    try {
      const files: File[] = await Promise.all(
        selectedMedia.map(async (url) => {
          const project = projects.find((p) => p.id === selectedProject);
          const mediaItem = media.find(m => m.url === url);

          // CASE A: It's the Project Design -> REGENERATE with settings
          if (project && mediaItem?.isProjectDesign && project.canvas_data) {
             try {
                const blob = await generateImageFromCanvas(project);
                if (blob) {
                    const ext = format === 'png' ? 'png' : 'jpg';
                    const filename = `${project.title.replace(/\s+/g, '_')}_${multiplier}x.${ext}`;
                    return new File([blob], filename, { type: `image/${format}` });
                }
             } catch (err) {
                 console.error("Generation failed, falling back to thumbnail URL", err);
             }
          }

          // CASE B: Standard URL Fetch (Raw assets or fallback)
          try {
            // Handle Data URIs (Base64)
            if (url.startsWith('data:')) {
                const res = await fetch(url);
                const blob = await res.blob();
                const mime = url.match(/data:([^;]+);/)?.[1] || 'image/png';
                // Fix: Removed syntax error 'KZ' here
                const ext = mime.split('/')[1];
                return new File([blob], `asset.${ext}`, { type: mime });
            }

            // Handle remote URLs
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');
            
            const blob = await response.blob();
            let filename = url.split('/').pop()?.split('?')[0] || 'media';
            let fileType = blob.type;

            if (!fileType || !fileType.startsWith('image/')) {
               if (filename.endsWith('.png')) fileType = 'image/png';
               else fileType = 'image/jpeg'; 
            }
            if (!filename.includes('.')) filename += '.jpg';

            return new File([blob], filename, { type: fileType });
          } catch (err) {
            console.error("Failed to process image:", err);
            return new File([""], "error.txt", { type: "text/plain" });
          }
        })
      );

      const validFiles = files.filter(f => f.type.startsWith('image/'));
      onSelect(validFiles);

    } catch (error) {
      console.error('Error selecting media:', error);
    } finally {
      setProcessing(false);
    }
  };

  const toggleMediaSelection = (url: string) => {
    setSelectedMedia((prev) =>
      prev.includes(url) ? prev.filter((m) => m !== url) : [...prev, url]
    );
  };

  // Helper to check if a "Full Design" item is selected to show preferences
  const isProjectDesignSelected = selectedMedia.some(url => 
    media.find(m => m.url === url)?.isProjectDesign
  );

  return (
    <Box>
      {loading ? (
        <Loader />
      ) : (
        <>
          <Select
            label="Select a Project"
            placeholder="Choose a project"
            value={selectedProject}
            onChange={setSelectedProject}
            data={projects.map((p) => ({ value: p.id, label: p.title }))}
            mb="md"
          />
          
          {media.length > 0 && (
            <>
            <SimpleGrid cols={3} mb="xl">
                {media.map((item, index) => (
                <Card
                    key={`${item.url.substring(0, 20)}-${index}`}
                    shadow="sm"
                    padding="0"
                    onClick={() => toggleMediaSelection(item.url)}
                    style={{
                    cursor: 'pointer',
                    border: selectedMedia.includes(item.url) ? '3px solid #228be6' : '1px solid #ced4da',
                    }}
                >
                    <Card.Section>
                    <Image 
                        src={item.url} 
                        height={120} 
                        fit="cover" 
                        alt="Media" 
                        fallbackSrc="https://placehold.co/600x400?text=Error+Loading"
                    />
                    {item.isProjectDesign ? (
                        <Text size="xs" ta="center" bg="blue.1" c="blue.9" fw={700} py={4}>Full Design</Text>
                    ) : (
                        <Text size="xs" ta="center" bg="gray.1" c="dimmed" py={4}>Asset</Text>
                    )}
                    </Card.Section>
                </Card>
                ))}
            </SimpleGrid>

            {/* --- Preference Controls (Visible only if Full Design is selected) --- */}
            {isProjectDesignSelected && (
                <Stack gap="sm" p="md" bg="gray.0" style={{ borderRadius: 8 }}>
                    <Text size="sm" fw={600}>Export Preferences (for Full Design)</Text>
                    <Divider />
                    <SimpleGrid cols={2}>
                        <Select
                            label="File Type"
                            data={[
                                { value: 'png', label: 'PNG (High Quality)' },
                                { value: 'jpeg', label: 'JPG (Small Size)' },
                            ]}
                            value={format}
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            onChange={(val: any) => setFormat(val)}
                            allowDeselect={false}
                            size="xs"
                        />
                        <div>
                            <Text size="xs" fw={500} mb={4}>Size / Multiplier ({multiplier}x)</Text>
                            <Slider
                                value={multiplier}
                                onChange={setMultiplier}
                                min={1}
                                max={3}
                                step={0.5}
                                marks={[
                                    { value: 1, label: '1x' },
                                    { value: 2, label: '2x' },
                                    { value: 3, label: '3x' },
                                ]}
                                size="sm"
                            />
                        </div>
                    </SimpleGrid>
                    
                    {format === 'jpeg' && (
                        <div>
                            <Text size="xs" fw={500} mb={4}>Compression Quality ({Math.round(quality * 100)}%)</Text>
                            <Slider
                                value={quality}
                                onChange={setQuality}
                                min={0.1}
                                max={1}
                                step={0.1}
                                size="sm"
                            />
                        </div>
                    )}
                </Stack>
            )}
            </>
          )}
        </>
      )}
      
      <Group justify="flex-end" mt="xl">
        <Button 
            onClick={handleSelect} 
            loading={processing}
            disabled={selectedMedia.length === 0}
        >
            Confirm & Import ({selectedMedia.length})
        </Button>
      </Group>
    </Box>
  );
};

export default ProjectMediaModal;