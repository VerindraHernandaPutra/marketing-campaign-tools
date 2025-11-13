import React, { useState } from 'react';
import { Paper, Text, Box, UnstyledButton, MantineTheme } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../auth/useAuth';

interface CreateNewCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const CreateNewCard: React.FC<CreateNewCardProps> = ({ icon, title, description }) => {
  const navigate = useNavigate();
  const { user } = useAuth(); // Get the current user
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateNew = async () => {
    if (!user) return;
    setIsCreating(true);

    const { data, error } = await supabase
      .from('projects')
      .insert({ 
        title: title, 
        user_id: user.id 
      })
      .select('id') 
      .single();
    
    setIsCreating(false);

    if (error) {
      alert('Error creating project: ' + error.message);
    } else if (data) {
      navigate(`/editor/${data.id}`);
    }
  };
  
  return <UnstyledButton onClick={handleCreateNew} disabled={isCreating}>
      <Paper 
        shadow="sm" 
        p="md" 
        className="border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-500 transition-all cursor-pointer hover:bg-white dark:hover:bg-gray-700" 
        
        style={(theme: MantineTheme) => ({
          height: 200,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: `light-dark(${theme.colors.gray[0]}, ${theme.colors.dark[7]})`,
        })}
      >
        <Box className="text-purple-600 mb-2">{icon}</Box>
        
        <Text fw={600} size="sm" ta="center">
          {title}
        </Text>

        <Text size="xs" color="dimmed" ta="center" mt={4}>
          {description}
        </Text>
      </Paper>
    </UnstyledButton>;
};

export default CreateNewCard;
