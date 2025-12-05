import React, { useState } from 'react';
import { Paper, Text, Box, UnstyledButton, MantineTheme, ThemeIcon, Loader } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../auth/useAuth';

interface CreateNewCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  width?: number;
  height?: number;
  // Optional click handler to override default logic
  onClick?: () => void;
}

interface ProjectPayload {
  title: string;
  user_id: string;
  canvas_data: {
    version: string;
    width: number;
    height: number;
    objects: Record<string, unknown>[];
    backgroundColor: string;
  };
}

const CreateNewCard: React.FC<CreateNewCardProps> = ({ icon, title, description, width, height, onClick }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateNew = async () => {
    if (onClick) {
        onClick();
        return;
    }

    if (!user) return;
    setIsCreating(true);

    try {
        const payload: ProjectPayload = { 
            title: title === 'Custom Size' ? 'Untitled Project' : title, 
            user_id: user.id,
            canvas_data: { 
                version: "5.3.0", 
                width: width || 850, 
                height: height || 500, 
                objects: [], 
                backgroundColor: '#ffffff' 
            }
        };

        const { data, error } = await supabase
        .from('projects')
        .insert(payload)
        .select('id') 
        .single();
        
        if (error) throw error;
        if (data) {
            navigate(`/editor/${data.id}`);
        }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        alert('Error creating project: ' + message);
    } finally {
        setIsCreating(false);
    }
  };
  
  return (
    <UnstyledButton onClick={handleCreateNew} disabled={isCreating} className="w-full">
      <Paper 
        shadow="xs" 
        p="sm" 
        className="border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-all cursor-pointer bg-white dark:bg-gray-800 group" 
        radius="md"
        style={(theme: MantineTheme) => ({
          height: 90,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.md,
          backgroundColor: `light-dark(${theme.white}, ${theme.colors.dark[7]})`,
        })}
      >
        <ThemeIcon 
            size={48} 
            radius="xl" 
            variant="light" 
            color="blue" 
            className="shrink-0"
        >
            {isCreating ? <Loader size="sm" color="white"/> : icon}
        </ThemeIcon>
        
        <Box>
            <Text fw={600} size="sm" className="group-hover:text-blue-600 transition-colors">
            {title}
            </Text>

            <Text size="xs" c="dimmed" mt={2}>
            {description}
            </Text>
        </Box>
      </Paper>
    </UnstyledButton>
  );
};

export default CreateNewCard;