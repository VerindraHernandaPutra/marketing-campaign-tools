import React from 'react';
import { Paper, Text, Group, ActionIcon, Menu, Image, Box, UnstyledButton, Badge, LoadingOverlay } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { MoreVerticalIcon, TrashIcon, CopyIcon, DownloadIcon, PlusCircleIcon } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../auth/useAuth';
import { useUserRole } from '../../auth/UserContext';

interface DesignCardProps {
  design: {
    id: string;
    title: string;
    thumbnail: string;
    updated_at?: string | null;
    category?: string;
    canvas_data?: unknown; 
  };
  isTemplate?: boolean;
  onRefresh?: () => void;
}

function timeAgo(dateString: string | null | undefined): string {
  if (!dateString) return 'just now';
  const date = new Date(dateString);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
}

const DesignCard: React.FC<DesignCardProps> = ({
  design,
  isTemplate,
  onRefresh
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { role, isSuperAdmin } = useUserRole();
  const [loading, setLoading] = React.useState(false);

  // Role Checks
  const canManageTemplates = isSuperAdmin || role === 'operator';
  const canAddToCampaign = isSuperAdmin || role === 'operator' || role === 'marketer';

  // If it's a template, restrict interactions for non-operators
  const isInteractable = !isTemplate || canManageTemplates;

  const handleClick = () => {
    if (isTemplate) {
      // Templates typically open a preview or "Use this template" modal
      // For now, no action on click unless we add a preview feature
    } else {
      navigate(`/editor/${design.id}`);
    }
  };

  const handleDuplicate = async () => {
    if (!user) return;
    // Prevent designers from duplicating templates directly if that's a requirement,
    // but usually they SHOULD be able to duplicate a template to start a new project.
    // For now, we allow duplication for everyone who can see the card.
    
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
        
        const { error } = await supabase.from('projects').insert({
            user_id: user.id,
            // If duplicating a template, the new copy is NOT a template
            title: `${originalData.title} (Copy)`,
            canvas_data: originalData.canvas_data,
            thumbnail_url: originalData.thumbnail_url,
            // Ensure new project inherits organization if needed (not implemented here)
        });
        
        if (error) throw error;
        if (onRefresh) onRefresh();
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      alert('Error duplicating project: ' + message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    // Strict check for template deletion
    if (isTemplate && !canManageTemplates) {
        alert("Only Operators or Admins can delete templates.");
        return;
    }

    if (!confirm('Are you sure you want to delete this project?')) return;
    
    setLoading(true);
    const { error } = await supabase.from('projects').delete().eq('id', design.id);
    setLoading(false);

    if (error) {
      alert('Error deleting: ' + error.message);
    } else {
      if (onRefresh) onRefresh();
    }
  };

  const handleDownload = async () => {
    if (!design.thumbnail) {
      alert("No thumbnail available to download.");
      return;
    }
    
    try {
      const response = await fetch(design.thumbnail);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${design.title}.png`;
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

  return (
    <Paper shadow="sm" className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" withBorder pos="relative">
      <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
      <UnstyledButton onClick={handleClick} className="w-full">
        <Box className="relative aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-800">
          <Image 
            src={design.thumbnail || 'https://placehold.co/600x400?text=No+Preview'} 
            alt={design.title} 
            fit="cover" 
            className="w-full h-full" 
          />
          {isTemplate && (
            <Badge className="absolute top-2 right-2" color="purple" variant="filled" size="sm">
              Template
            </Badge>
          )}
        </Box>
      </UnstyledButton>
      <Box p="md">
        <Group justify="space-between" wrap="nowrap">
          <Box className="flex-1 min-w-0">
            <Text fw={500} size="sm" lineClamp={1}>
              {design.title}
            </Text>

            {design.updated_at && !isTemplate && (
              <Text size="xs" c="dimmed" mt={2}>
                Edited {timeAgo(design.updated_at)}
              </Text>
            )}

            {design.category && isTemplate && (
              <Text size="xs" c="dimmed" mt={2}>
                {design.category}
              </Text>
            )}
          </Box>
          
          {/* Menu Actions */}
          <Menu shadow="md" width={200} position="bottom-end">
            <Menu.Target>
                {/* Hide menu trigger if it's a template and user lacks permission */}
                <ActionIcon 
                    variant="subtle" 
                    onClick={e => e.stopPropagation()}
                    disabled={isTemplate && !canManageTemplates && !canAddToCampaign}
                    style={{ opacity: (isTemplate && !canManageTemplates && !canAddToCampaign) ? 0 : 1 }}
                >
                    <MoreVerticalIcon size={16} />
                </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
                {/* Can Add to Campaign? */}
                {canAddToCampaign && (
                    <Menu.Item leftSection={<PlusCircleIcon size={14} />} onClick={(e) => { e.stopPropagation(); handleAddToCampaign(); }}>
                        Add to Campaign
                    </Menu.Item>
                )}
                
                <Menu.Divider />

                <Menu.Item leftSection={<CopyIcon size={14} />} onClick={(e) => { e.stopPropagation(); handleDuplicate(); }}>
                    Duplicate
                </Menu.Item>
                
                <Menu.Item leftSection={<DownloadIcon size={14} />} onClick={(e) => { e.stopPropagation(); handleDownload(); }}>
                    Download
                </Menu.Item>
                
                {/* Only show Delete if it's NOT a template, OR if user is Operator/Admin */}
                {isInteractable && (
                    <>
                        <Menu.Divider />
                        <Menu.Item leftSection={<TrashIcon size={14} />} color="red" onClick={(e) => { e.stopPropagation(); handleDelete(); }}>
                            Delete
                        </Menu.Item>
                    </>
                )}
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Box>
    </Paper>
  );
};

export default DesignCard;