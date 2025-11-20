import React, { useState } from 'react';
import { Paper, Text, Box, UnstyledButton, MantineTheme, ThemeIcon } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../auth/useAuth';

interface CreateNewCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  width?: number;  // Added optional width
  height?: number; // Added optional height
}

const CreateNewCard: React.FC<CreateNewCardProps> = ({ icon, title, description, width, height }) => {
  const navigate = useNavigate();
  const { user } = useAuth(); // Get the current user
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateNew = async () => {
    if (!user) return;
    setIsCreating(true);

    // Construct the payload
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: any = { 
        title: title, 
        user_id: user.id 
    };

    // If dimensions are provided, initialize canvas_data with those specific dimensions
    if (width && height) {
        payload.canvas_data = { 
            width, 
            height, 
            objects: [], // Empty canvas
            background: 'white'
        };
    }

    const { data, error } = await supabase
      .from('projects')
      .insert(payload)
      .select('id') 
      .single();
    
    setIsCreating(false);

    if (error) {
      alert('Error creating project: ' + error.message);
    } else if (data) {
      navigate(`/editor/${data.id}`);
    }
  };
  
  return <UnstyledButton onClick={handleCreateNew} disabled={isCreating} className="w-full">
      <Paper 
        shadow="xs" 
        p="sm" 
        className="border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-all cursor-pointer bg-white dark:bg-gray-800 group" 
        radius="md"
        style={(theme: MantineTheme) => ({
          height: 90, // Minimized height
          display: 'flex',
          flexDirection: 'row', // Horizontal layout to save vertical space
          alignItems: 'center',
          gap: theme.spacing.md,
          backgroundColor: `light-dark(${theme.white}, ${theme.colors.dark[7]})`,
        })}
      >
        {/* Minimized Circle Icon Container */}
        <ThemeIcon 
            size={48} 
            radius="xl" 
            variant="light" 
            color="blue" 
            className="shrink-0"
        >
            {icon}
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
    </UnstyledButton>;
};

export default CreateNewCard;