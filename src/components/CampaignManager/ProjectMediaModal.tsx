import React, { useState, useEffect } from 'react';
import { Box, Button, SimpleGrid, Card, Image, Text, Loader, Select } from '@mantine/core';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../auth/useAuth';

interface Project {
  id: string;
  title: string;
  canvas_data: any;
}

interface ProjectMediaModalProps {
  onSelect: (files: File[]) => void;
}

const ProjectMediaModal: React.FC<ProjectMediaModalProps> = ({ onSelect }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [media, setMedia] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('id, title, canvas_data')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching projects:', error);
      } else {
        setProjects(data as Project[]);
      }
      setLoading(false);
    };

    fetchProjects();
  }, [user]);

  useEffect(() => {
    if (selectedProject) {
      const project = projects.find((p) => p.id === selectedProject);
      if (project && project.canvas_data) {
        const images = project.canvas_data.objects
          .filter((obj: any) => obj.type === 'image' && obj.src)
          .map((obj: any) => obj.src);
        setMedia(images);
      }
    } else {
      setMedia([]);
    }
    setSelectedMedia([]); // Reset selection when project changes
  }, [selectedProject, projects]);

  const handleSelect = async () => {
    const files: File[] = await Promise.all(
      selectedMedia.map(async (url) => {
        const response = await fetch(url);
        const blob = await response.blob();
        return new File([blob], url.substring(url.lastIndexOf('/') + 1), { type: blob.type });
      })
    );
    onSelect(files);
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
            <Text size="sm" mb="sm">
              Click on the images to select them.
            </Text>
          )}
          <SimpleGrid cols={3}>
            {media.map((url) => (
              <Card
                key={url}
                shadow="sm"
                padding="lg"
                onClick={() => toggleMediaSelection(url)}
                style={{
                  cursor: 'pointer',
                  border: selectedMedia.includes(url) ? '2px solid #228be6' : '1px solid #ced4da',
                }}
              >
                <Card.Section>
                  <Image src={url} height={160} alt="Media" />
                </Card.Section>
              </Card>
            ))}
          </SimpleGrid>
        </>
      )}
      <Button onClick={handleSelect} mt="md" disabled={selectedMedia.length === 0}>
        Select Media
      </Button>
    </Box>
  );
};

export default ProjectMediaModal;