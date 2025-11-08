import React from 'react';
// 'Group' dihapus (tidak terpakai), 'MantineTheme' ditambahkan
import { Paper, Text, Box, UnstyledButton, MantineTheme } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
// 'PlusIcon' dihapus (tidak terpakai)

interface CreateNewCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const CreateNewCard: React.FC<CreateNewCardProps> = ({
  icon,
  title,
  description
}) => {
  const navigate = useNavigate();
  return <UnstyledButton onClick={() => navigate('/editor')}>
      <Paper 
        shadow="sm" 
        p="md" 
        // 1. Logika hover:backgroundColor dipindahkan ke Tailwind className
        // (hover:bg-white dan dark:hover:bg-gray-700 ditambahkan)
        className="border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-500 transition-all cursor-pointer hover:bg-white dark:hover:bg-gray-700" 
        
        // 2. 'style' (pengganti 'sx') tetap sebagai fungsi
        style={(theme: MantineTheme) => ({
          height: 200,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          
          // 3. Gunakan CSS light-dark() (fitur v7) untuk mengganti theme.colorScheme
          // Ini menyelesaikan error "Property 'colorScheme' does not exist"
          backgroundColor: `light-dark(${theme.colors.gray[0]}, ${theme.colors.dark[7]})`,
          
          // Properti '&:hover' dihapus dari sini karena 'style' tidak mendukungnya
        })}
      >
        <Box className="text-purple-600 mb-2">{icon}</Box>
        
        {/* 4. 'weight' -> 'fw' dan 'align' -> 'ta' (perbaikan dari error sebelumnya) */}
        <Text fw={600} size="sm" ta="center">
          {title}
        </Text>
        
        {/* 5. 'align' -> 'ta' (perbaikan dari error sebelumnya) */}
        <Text size="xs" color="dimmed" ta="center" mt={4}>
          {description}
        </Text>
      </Paper>
    </UnstyledButton>;
};

export default CreateNewCard;