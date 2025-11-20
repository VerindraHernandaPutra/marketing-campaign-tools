import React, { useState, useEffect } from 'react';
import { Box, Button, SimpleGrid, Card, Image, Text, Loader, Select } from '@mantine/core';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../auth/useAuth';

// Define interfaces
interface CanvasObject {
  type: string;
  src?: string;
  [key: string]: unknown;
}

interface CanvasData {
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
  const [media, setMedia] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('id, title, canvas_data, thumbnail_url')
        .eq('user_id', user.id);

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
    if (selectedProject) {
      const project = projects.find((p) => p.id === selectedProject);
      const images: string[] = [];

      // 1. Add Project Thumbnail
      // FIX: Use a stable placeholder service. 
      // Ideally, saving the project should update thumbnail_url with a real data URI.
      const thumbnail = project?.thumbnail_url || 'https://placehold.co/600x400?text=No+Thumbnail';
      images.push(thumbnail);

      // 2. Add images inside the canvas
      if (project && project.canvas_data && Array.isArray(project.canvas_data.objects)) {
        const canvasImages = project.canvas_data.objects
          .filter((obj: CanvasObject) => obj.type === 'image' && typeof obj.src === 'string')
          .map((obj: CanvasObject) => obj.src as string);
        
        // Deduplicate
        canvasImages.forEach((img: string) => {
          if (!images.includes(img)) {
            images.push(img);
          }
        });
      }
      
      setMedia(images);

      // Auto-select the first image (Thumbnail)
      if (images.length > 0) {
        setSelectedMedia([images[0]]);
      } else {
        setSelectedMedia([]);
      }
    } else {
      setMedia([]);
      setSelectedMedia([]);
    }
  }, [selectedProject, projects]);

  const handleSelect = async () => {
    setProcessing(true);
    try {
      const files: File[] = await Promise.all(
        selectedMedia.map(async (url) => {
          try {
            // Handle Data URIs (Base64) specifically to avoid fetch errors on some browsers
            if (url.startsWith('data:')) {
                const res = await fetch(url);
                const blob = await res.blob();
                // Extract extension from MIME type
                const mime = url.match(/data:([^;]+);/)?.[1] || 'image/png';
                const ext = mime.split('/')[1];
                return new File([blob], `canvas-asset.${ext}`, { type: mime });
            }

            // Handle standard URLs
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');
            
            const blob = await response.blob();
            let filename = url.split('/').pop()?.split('?')[0] || 'media';
            let fileType = blob.type;

            // Fix missing MIME types
            if (!fileType || !fileType.startsWith('image/')) {
               if (filename.endsWith('.png')) fileType = 'image/png';
               else fileType = 'image/jpeg'; 
            }
            
            if (!filename.includes('.')) filename += '.jpg';

            return new File([blob], filename, { type: fileType });
          } catch (err) {
            console.error("Failed to process image:", err);
            // Return a fallback placeholder file to prevent crash
            return new File([""], "error.txt", { type: "text/plain" });
          }
        })
      );

      // Filter out failed files (text/plain)
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
            <Text size="sm" mb="sm" c="dimmed">
               Thumbnail is auto-selected. Click others to add.
            </Text>
          )}

          <SimpleGrid cols={3}>
            {media.map((url, index) => (
              <Card
                key={`${url.substring(0, 20)}-${index}`}
                shadow="sm"
                padding="0"
                onClick={() => toggleMediaSelection(url)}
                style={{
                  cursor: 'pointer',
                  border: selectedMedia.includes(url) ? '3px solid #228be6' : '1px solid #ced4da',
                }}
              >
                <Card.Section>
                  <Image 
                    src={url} 
                    height={120} 
                    fit="cover" 
                    alt="Media" 
                    // Updated fallback to a reliable service
                    fallbackSrc="https://placehold.co/600x400?text=Error+Loading"
                  />
                  {index === 0 && (
                    <Text size="xs" ta="center" bg="gray.1" c="dimmed" py={4}>Project Thumbnail</Text>
                  )}
                </Card.Section>
              </Card>
            ))}
          </SimpleGrid>
        </>
      )}
      <Button 
        onClick={handleSelect} 
        mt="xl" 
        fullWidth
        disabled={selectedMedia.length === 0}
        loading={processing}
      >
        Confirm Selection ({selectedMedia.length})
      </Button>
    </Box>
  );
};

export default ProjectMediaModal;