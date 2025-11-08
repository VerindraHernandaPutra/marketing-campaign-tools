import React, { useState } from 'react';
import { Paper, TextInput, Textarea, Button, Group, FileInput, Box, Text, Image, Grid } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { UploadIcon, XIcon } from 'lucide-react';
import PlatformSelector from './PlatformSelector';

const CampaignForm: React.FC = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);

  const handleFileChange = (newFiles: File[]) => {
    setFiles([...files, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    console.log({
      title,
      content,
      scheduledDate,
      selectedPlatforms,
      files
    });
  };

  return <Paper shadow="sm" p="xl" mb="xl">
      {/* 'weight' diubah menjadi 'fw' */}
      <Text size="lg" fw={600} mb="md">
        Create New Campaign
      </Text>
      {/* Tetap gunakan 'gutter' untuk Grid, bukan 'gap' */}
      <Grid gutter="md">
        <Grid.Col span={12}>
          <TextInput label="Campaign Title" placeholder="Enter campaign title" value={title} onChange={e => setTitle(e.currentTarget.value)} required />
        </Grid.Col>
        <Grid.Col span={12}>
          <Textarea label="Content" placeholder="Write your message here..." value={content} onChange={e => setContent(e.currentTarget.value)} minRows={4} required />
        </Grid.Col>
        <Grid.Col span={12}>
          {/* 'weight' diubah menjadi 'fw' */}
          <Text size="sm" fw={500} mb="xs">
            Upload Media
          </Text>
          <FileInput placeholder="Click to upload images or videos" multiple leftSection={<UploadIcon size={16} />} onChange={files => files && handleFileChange(files)} accept="image/*,video/*" />
          {files.length > 0 && <Box mt="md">
              {/* 'spacing' diubah menjadi 'gap' untuk Group */}
              <Group gap="md">
                {files.map((file, index) => <Box key={index} className="relative">
                    <Paper p="xs" withBorder>
                      {/* 'spacing' diubah menjadi 'gap' untuk Group */}
                      <Group gap="xs">
                        {file.type.startsWith('image/') ? <Image src={URL.createObjectURL(file)} alt={file.name} width={60} height={60} fit="cover" /> : <Box w={60} h={60} className="bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <Text size="xs">Video</Text>
                          </Box>}
                        <Button size="xs" variant="subtle" color="red" onClick={() => removeFile(index)}>
                          <XIcon size={14} />
                        </Button>
                      </Group>
                    </Paper>
                  </Box>)}
              </Group>
            </Box>}
        </Grid.Col>
        <Grid.Col span={12}>
          <PlatformSelector selectedPlatforms={selectedPlatforms} onChange={setSelectedPlatforms} />
        </Grid.Col>
        <Grid.Col span={12}>
          {/* Perbaikan onChange untuk DateTimePicker */}
          <DateTimePicker 
            label="Schedule Date & Time" 
            placeholder="Pick date and time" 
            value={scheduledDate} 
            onChange={(value: string | null) => setScheduledDate(value ? new Date(value) : null)} 
            minDate={new Date()} 
            clearable 
          />
        </Grid.Col>
        <Grid.Col span={12}>
          {/* 'position' diubah menjadi 'justify' untuk Group */}
          <Group justify="flex-end" mt="md">
            <Button variant="outline">Save as Draft</Button>
            <Button onClick={handleSubmit}>
              {scheduledDate ? 'Schedule Campaign' : 'Post Now'}
            </Button>
          </Group>
        </Grid.Col>
      </Grid>
    </Paper>;
};

export default CampaignForm;