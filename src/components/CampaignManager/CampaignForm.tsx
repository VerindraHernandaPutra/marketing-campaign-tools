import React, { useState } from 'react';
import { Paper, TextInput, Textarea, Button, Group, FileInput, Box, Text, Image, Grid, Stepper, Modal } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { UploadIcon, XIcon } from 'lucide-react';
import PlatformSelector from './PlatformSelector';
import WhatsappFlow from './flows/WhatsappFlow';
import EmailFlow from './flows/EmailFlow';
import SocialMediaFlow from './flows/SocialMediaFlow';
import ProjectMediaModal from './ProjectMediaModal';

const CampaignForm: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [platformData, setPlatformData] = useState<Record<string, Record<string, any>>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      files,
      platformData,
    });
  };

  const nextStep = () => setActiveStep((current) => (current < 3 ? current + 1 : current));
  const prevStep = () => setActiveStep((current) => (current > 0 ? current - 1 : current));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlePlatformDataChange = (platform: string, data: Record<string, any>) => {
    setPlatformData((prev) => ({
      ...prev,
      [platform]: data,
    }));
  };

  const isStepCompleted = (step: number) => {
    if (step === 0) {
      return title.trim() !== '' && content.trim() !== '';
    }
    if (step === 1) {
      return selectedPlatforms.length > 0;
    }
    if (step === 2) {
      return selectedPlatforms.every((platform) => {
        if (platform === 'email') {
          const emailData = platformData.email;
          return emailData && emailData.subject && emailData.fromAddress;
        }
        return true;
      });
    }
    return true;
  };

  const handleStepClick = (step: number) => {
    if (step < activeStep) {
      setActiveStep(step);
      return;
    }

    for (let i = 0; i < step; i++) {
      if (!isStepCompleted(i)) {
        return;
      }
    }
    setActiveStep(step);
  };

  const renderFlow = () => {
    const flows = [];
    if (selectedPlatforms.includes('whatsapp')) {
      flows.push(
        <WhatsappFlow
          key="whatsapp"
          data={platformData.whatsapp || {}}
          onChange={(data) => handlePlatformDataChange('whatsapp', data)}
        />
      );
    }
    if (selectedPlatforms.includes('email')) {
      flows.push(
        <EmailFlow
          key="email"
          data={platformData.email || {}}
          onChange={(data) => handlePlatformDataChange('email', data)}
        />
      );
    }
    if (selectedPlatforms.some((p) => ['facebook', 'instagram', 'twitter', 'linkedin'].includes(p))) {
      flows.push(
        <SocialMediaFlow
          key="social"
        />
      );
    }

    if (flows.length === 0) {
      return <Text>Please select a platform to configure.</Text>;
    }

    return flows;
  };

  return (
    <>
      <Modal opened={isModalOpen} onClose={() => setIsModalOpen(false)} title="Choose from Project">
        <ProjectMediaModal
          onSelect={(selectedFiles) => {
            setFiles([...files, ...selectedFiles]);
            setIsModalOpen(false);
          }}
        />
      </Modal>
      <Paper shadow="sm" p="xl" mb="xl">
        <Stepper active={activeStep} onStepClick={handleStepClick}>
          <Stepper.Step label="Campaign Details" description="Title and content" />
          <Stepper.Step label="Select Platforms" description="Choose where to post" />
          <Stepper.Step label="Configure" description="Platform-specific settings" />
          <Stepper.Step label="Schedule" description="Finalize and schedule" />
        </Stepper>

        <Box mt="xl">
          {activeStep === 0 && (
            <Grid gutter="md">
              <Grid.Col span={12}>
                <TextInput label="Campaign Title" placeholder="Enter campaign title" value={title} onChange={(e) => setTitle(e.currentTarget.value)} required />
              </Grid.Col>
              <Grid.Col span={12}>
                <Textarea label="Content" placeholder="Write your message here..." value={content} onChange={(e) => setContent(e.currentTarget.value)} minRows={4} required />
              </Grid.Col>
              <Grid.Col span={12}>
                <Text size="sm" fw={500} mb="xs">
                  Upload Media
                </Text>
                <Group>
                  <FileInput
                    placeholder="Click to upload images or videos"
                    multiple
                    leftSection={<UploadIcon size={16} />}
                    onChange={(files) => files && handleFileChange(files)}
                    accept="image/*,video/*"
                    style={{ flex: 1 }}
                  />
                  <Button onClick={() => setIsModalOpen(true)}>Choose from Project</Button>
                </Group>
                {files.length > 0 && (
                  <Box mt="md">
                    <Group gap="md">
                      {files.map((file, index) => (
                        <Box key={index} className="relative">
                          <Paper p="xs" withBorder>
                            <Group gap="xs">
                              {file.type.startsWith('image/') ? (
                                <Image src={URL.createObjectURL(file)} alt={file.name} width={60} height={60} fit="cover" />
                              ) : (
                                <Box w={60} h={60} className="bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                  <Text size="xs">Video</Text>
                                </Box>
                              )}
                              <Button size="xs" variant="subtle" color="red" onClick={() => removeFile(index)}>
                                <XIcon size={14} />
                              </Button>
                            </Group>
                          </Paper>
                        </Box>
                      ))}
                    </Group>
                  </Box>
                )}
              </Grid.Col>
            </Grid>
          )}

          {activeStep === 1 && <PlatformSelector selectedPlatforms={selectedPlatforms} onChange={setSelectedPlatforms} />}

          {activeStep === 2 && renderFlow()}

          {activeStep === 3 && (
            <DateTimePicker
              label="Schedule Date & Time"
              placeholder="Pick date and time"
              value={scheduledDate}
              onChange={(value: string | null) => setScheduledDate(value ? new Date(value) : null)}
              minDate={new Date()}
              clearable
            />
          )}
        </Box>

        <Group justify="flex-end" mt="xl">
          {activeStep > 0 && (
            <Button variant="default" onClick={prevStep}>
              Back
            </Button>
          )}
          {activeStep < 3 && <Button onClick={nextStep} disabled={!isStepCompleted(activeStep)}>Next step</Button>}
          {activeStep === 3 && (
            <Button onClick={handleSubmit} color="blue">
              {scheduledDate ? 'Schedule Campaign' : 'Post Now'}
            </Button>
          )}
        </Group>
      </Paper>
    </>
  );
};

export default CampaignForm;