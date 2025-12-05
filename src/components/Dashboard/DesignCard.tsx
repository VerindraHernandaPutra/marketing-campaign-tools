import React, { useState } from 'react';
import { Paper, Text, Group, ActionIcon, Menu, Image, Box, UnstyledButton, Badge, LoadingOverlay, Tooltip } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { 
  MoreVerticalIcon, 
  TrashIcon, 
  CopyIcon, 
  DownloadIcon, 
  PlusCircleIcon, 
  EditIcon, 
  ExternalLinkIcon,
  PencilIcon,
  LayoutTemplateIcon,
  ImageIcon
} from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../auth/useAuth';
import { useUserRole } from '../../auth/UserContext';
import ConfirmationModal from '../Layout/ConfirmationModal';

interface DesignCardProps {
  design: {
    id: string;
    title: string;
    thumbnail: string | null; 
    updated_at?: string | null;
    category?: string;
    canvas_data?: unknown;
    tags?: string[] | null; 
  };
  isTemplate?: boolean;
  onRefresh?: () => void;
}

function timeAgo(dateString: string | null | undefined): string {
  if (!dateString) return 'just now';
  const date = new Date(dateString);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return "just now";
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  
  return Math.floor(seconds) + "s ago";
}

const DesignCard: React.FC<DesignCardProps> = ({
  design,
  isTemplate,
  onRefresh
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { role, isSuperAdmin, currentOrgId } = useUserRole();
  const [loading, setLoading] = React.useState(false);
  
  // Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // --- PERMISSION LOGIC ---
  const isOperator = isSuperAdmin || role === 'operator';
  const isDesigner = role === 'designer';
  const canManageSource = !isTemplate || isOperator; 
  const canAddToCampaign = isSuperAdmin || role === 'operator' || role === 'marketer';

  const handleEdit = () => {
    navigate(`/editor/${design.id}`);
  };

  const handleOpen = () => {
    window.open(`/editor/${design.id}`, '_blank');
  };

  const handleDuplicate = async (asTemplate = false) => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: original } = await supabase
        .from('projects')
        .select('*')
        .eq('id', design.id)
        .single();

      if (original) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const originalData = original as any;
        
        const { data: newProject, error } = await supabase.from('projects').insert({
            user_id: user.id,
            organization_id: currentOrgId,
            is_template: asTemplate, 
            title: `${originalData.title} (Copy)`,
            canvas_data: originalData.canvas_data,
            thumbnail_url: originalData.thumbnail_url,
            tags: originalData.tags 
        }).select('id').single();
        
        if (error) throw error;
        
        if (!asTemplate && newProject) {
            navigate(`/editor/${newProject.id}`);
        } else if (onRefresh) {
            onRefresh();
        }
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      alert('Error duplicating project: ' + message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = () => {
    if (!canManageSource) {
        alert("You do not have permission to delete this.");
        return;
    }
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    setLoading(true);
    const { error } = await supabase.from('projects').delete().eq('id', design.id);
    setLoading(false);
    setIsDeleteModalOpen(false);

    if (error) {
      alert('Error deleting: ' + error.message);
    } else {
      if (onRefresh) onRefresh();
    }
  };

  const handleDownload = async () => {
    if (!design.thumbnail) {
      alert("No thumbnail available to download. Please open and save the project first.");
      return;
    }
    
    try {
      const response = await fetch(design.thumbnail);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${design.title.replace(/\s+/g, '_')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download image.');
    }
  };

  const handleAddToCampaign = () => {
    navigate('/campaign-manager/new', { 
      state: { 
        importedDesign: {
          title: design.title,
          thumbnail: design.thumbnail
        } 
      } 
    });
  };

  const handleCardClick = () => {
    if (isTemplate) {
      if (isOperator) {
        handleEdit();
      } else {
        if(confirm(`Create a new project from "${design.title}" template?`)) {
            handleDuplicate(false); 
        }
      }
    } else {
      handleEdit();
    }
  };

  const hasThumbnail = design.thumbnail && design.thumbnail.length > 10; 

  return (
    <>
      <ConfirmationModal 
        opened={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Design?"
        message={`Are you sure you want to delete "${design.title}"? This action cannot be undone.`}
        confirmLabel="Delete Forever"
        isDanger
        loading={loading}
      />

      <Paper shadow="sm" className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 dark:border-gray-700" radius="md" pos="relative">
        <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "md", blur: 2 }} />
        
        <UnstyledButton onClick={handleCardClick} className="w-full">
          <Box 
              className="relative w-full aspect-[4/3] bg-gray-100 dark:bg-gray-800 overflow-hidden"
              style={{ 
                  backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                  backgroundSize: '20px 20px',
                  backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
              }}
          >
            {hasThumbnail ? (
              <Image 
                  src={design.thumbnail} 
                  alt={design.title} 
                  fit="contain" 
                  className="w-full h-full object-contain"
                  style={{ backgroundColor: 'white' }} 
              />
            ) : (
              <Box className="w-full h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 p-4 text-center">
                <ImageIcon size={48} className="text-gray-300 mb-2" />
                <Text size="xs" c="dimmed">No Preview</Text>
              </Box>
            )}

            {isTemplate && (
              <Badge className="absolute top-2 right-2 shadow-sm" color="grape" variant="filled" size="sm">
                Template
              </Badge>
            )}
          </Box>
        </UnstyledButton>

        <Box p="md" className="bg-white dark:bg-gray-900">
          <Group justify="space-between" wrap="nowrap" mb={6}>
            <Box className="flex-1 min-w-0">
              <Tooltip label={design.title} openDelay={500}>
                <Text fw={600} size="sm" lineClamp={1} title={design.title}>
                  {design.title}
                </Text>
              </Tooltip>
              <Text size="xs" c="dimmed">
                {isTemplate && isDesigner ? 'Click to Use' : `Edited ${timeAgo(design.updated_at)}`}
              </Text>
            </Box>
            
            <Menu shadow="md" width={220} position="bottom-end">
              <Menu.Target>
                  <ActionIcon variant="subtle" color="gray" onClick={e => e.stopPropagation()}>
                      <MoreVerticalIcon size={18} />
                  </ActionIcon>
              </Menu.Target>

              <Menu.Dropdown>
                  {/* 1. OPERATOR SPECIFIC MENU */}
                  {isTemplate && isOperator && (
                      <>
                          <Menu.Label>Operator Actions</Menu.Label>
                          <Menu.Item 
                              leftSection={<PencilIcon size={14} className="text-blue-500" />} 
                              onClick={(e) => { e.stopPropagation(); handleEdit(); }}
                          >
                              Edit Master Template
                          </Menu.Item>
                          <Menu.Item 
                              leftSection={<LayoutTemplateIcon size={14} className="text-green-500" />} 
                              onClick={(e) => { e.stopPropagation(); handleDuplicate(false); }}
                          >
                              Use for Campaign
                          </Menu.Item>
                          <Menu.Divider />
                      </>
                  )}

                  {/* 2. DESIGNER / STANDARD MENU */}
                  {isTemplate && !isOperator && (
                      <Menu.Item leftSection={<PlusCircleIcon size={14} />} onClick={(e) => { e.stopPropagation(); handleDuplicate(false); }}>
                          Use Template
                      </Menu.Item>
                  )}
                  
                  {!isTemplate && (
                      <Menu.Item leftSection={<EditIcon size={14} />} onClick={(e) => { e.stopPropagation(); handleEdit(); }}>
                          Edit
                      </Menu.Item>
                  )}

                  <Menu.Item leftSection={<ExternalLinkIcon size={14} />} onClick={(e) => { e.stopPropagation(); handleOpen(); }}>
                      Open in New Tab
                  </Menu.Item>

                  {canAddToCampaign && (
                      <Menu.Item leftSection={<PlusCircleIcon size={14} />} onClick={(e) => { e.stopPropagation(); handleAddToCampaign(); }}>
                          Add to Campaign
                      </Menu.Item>
                  )}

                  <Menu.Divider />

                  <Menu.Item leftSection={<CopyIcon size={14} />} onClick={(e) => { e.stopPropagation(); handleDuplicate(design.is_template ?? false); }}>
                      Duplicate
                  </Menu.Item>
                  
                  <Menu.Item leftSection={<DownloadIcon size={14} />} onClick={(e) => { e.stopPropagation(); handleDownload(); }}>
                      Download
                  </Menu.Item>
                  
                  {canManageSource && (
                      <>
                          <Menu.Divider />
                          <Menu.Item leftSection={<TrashIcon size={14} />} color="red" onClick={(e) => { e.stopPropagation(); handleDeleteClick(); }}>
                              Delete
                          </Menu.Item>
                      </>
                  )}
              </Menu.Dropdown>
            </Menu>
          </Group>

          {/* --- TAGS SECTION --- */}
          {design.tags && design.tags.length > 0 && (
              <Group gap={4} mt={8}>
                  {design.tags.slice(0, 2).map(tag => (
                      <Badge key={tag} size="xs" variant="light" color="gray" radius="sm" className="font-normal">
                          {tag}
                      </Badge>
                  ))}
                  {design.tags.length > 2 && (
                      <Text size="xs" c="dimmed" style={{ fontSize: 10 }}>+{design.tags.length - 2}</Text>
                  )}
              </Group>
          )}
        </Box>
      </Paper>
    </>
  );
};

export default DesignCard;