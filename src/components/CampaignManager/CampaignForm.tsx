import React, { useState } from 'react';
import { Paper, TextInput, Textarea, Button, Group, FileInput, Box, Text, Image, Grid, Stepper, Modal, LoadingOverlay } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import '@mantine/dates/styles.css'; 
import { UploadIcon, XIcon, SendIcon, ClockIcon } from 'lucide-react';
import { supabase } from '../../supabaseClient';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [sendingQueue, setSendingQueue] = useState<string[]>([]);
  const [currentSendingIndex, setCurrentSendingIndex] = useState(0);
  const [isSendingSessionActive, setIsSendingSessionActive] = useState(false);

  const handleFileChange = (newFiles: File[]) => {
    setFiles([...files, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const startWhatsappBulkSession = () => {
    const numbersInput = prompt("Enter recipient numbers separated by commas (e.g., 628123456, 628987654):");
    if (!numbersInput) return;

    const numbers = numbersInput.split(',').map(num => num.replace(/\D/g, '')).filter(num => num.length > 5);
    if (numbers.length === 0) {
      alert("No valid numbers found.");
      return;
    }
    setSendingQueue(numbers);
    setCurrentSendingIndex(0);
    setIsSendingSessionActive(true);
  };

  const sendNextMessage = () => {
    if (currentSendingIndex >= sendingQueue.length) {
      alert("All messages sent!");
      setIsSendingSessionActive(false);
      setSendingQueue([]);
      setCurrentSendingIndex(0);
      return;
    }
    const number = sendingQueue[currentSendingIndex];
    const encodedMessage = encodeURIComponent(content);
    const whatsappUrl = `https://wa.me/${number}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
    setCurrentSendingIndex(prev => prev + 1);
  };

  // Helper to convert File to Base64 for email attachment
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the Data URI prefix (e.g., "data:image/png;base64,") so we get raw base64
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  // Modified to accept an optional 'forceImmediate' flag
  const sendEmail = async (forceImmediate = false) => {
    const testEmail = prompt("Enter a test email address (must be your own email if using Resend Free Tier):");
    if (!testEmail) return;

    try {
      const emailConfig = platformData.email || {};
      
      let scheduledAtISO = null;
      
      // Only set scheduledAt if we are NOT forcing immediate send AND a date is set
      if (!forceImmediate && scheduledDate) {
        const dateObj = new Date(scheduledDate);
        const now = new Date();
        const maxDate = new Date(now.getTime() + 72 * 60 * 60 * 1000); 
        
        if (dateObj > maxDate) {
          alert("Error: Resend Free Tier allows scheduling up to 72 hours in advance only.");
          throw new Error("Date exceeds 72-hour limit");
        }
        scheduledAtISO = dateObj.toISOString();
      }

      // Process attachments with Content-ID (CID) for inline display
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const attachments: any[] = [];
      let imageHtml = "";

      if (files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const base64Content = await fileToBase64(file);
          
          const cid = `image-${Date.now()}-${i}`;

          attachments.push({
            filename: file.name,
            content: base64Content,
            content_id: cid,
          });

          // Using cid: reference for inline display
          imageHtml += `<br/><img src="cid:${cid}" alt="${file.name}" style="max-width: 100%; height: auto; border-radius: 8px; margin-top: 10px;" /><br/>`;
        }
      }

      const emailHtml = `
        <div style="font-family: sans-serif; color: #333;">
          <p>${content}</p>
          ${imageHtml}
        </div>
      `;

      console.log("Submitting Email Request:", {
          to: testEmail,
          attachmentsCount: attachments.length,
          scheduledAt: scheduledAtISO
      });

      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: testEmail,
          subject: emailConfig.subject || "New Campaign",
          html: emailHtml,
          from: emailConfig.fromAddress || "marketing@example.com",
          scheduledAt: scheduledAtISO,
          attachments: attachments
        }
      });

      if (error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errorMsg = (error as any).context?.json?.error || error.message || "Unknown Edge Function Error";
        throw new Error(errorMsg);
      }
      
      console.log("Email API Response:", data);

      if (scheduledAtISO) {
         alert(`Email scheduled!`);
      } else {
         alert(`Email sent immediately!`);
      }
      
    } catch (error: unknown) {
      console.error("Email failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      alert("Failed to send email: " + errorMessage);
    }
  };

  const handleSubmit = async (forceImmediate = false) => {
    // Validation: If NOT immediate, we must have a date
    if (!forceImmediate && !scheduledDate) {
      alert("Please select a schedule date before confirming.");
      return;
    }

    if (selectedPlatforms.includes('whatsapp')) {
      startWhatsappBulkSession();
    } 
    else if (selectedPlatforms.includes('email')) {
      setIsSubmitting(true);
      await sendEmail(forceImmediate);
      setIsSubmitting(false);
    }
    else {
      setIsSubmitting(true);
      setTimeout(() => {
        alert(forceImmediate ? "Campaign Posted Immediately!" : `Campaign Scheduled for ${scheduledDate?.toLocaleString()}`);
        setIsSubmitting(false);
      }, 1000);
    }
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
    if (step === 0) return title.trim() !== '' && content.trim() !== '';
    if (step === 1) return selectedPlatforms.length > 0;
    if (step === 2) return selectedPlatforms.every(p => p !== 'email' || (platformData.email?.subject && platformData.email?.fromAddress));
    return true;
  };

  const handleStepClick = (step: number) => {
    if (step < activeStep) setActiveStep(step);
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
      flows.push(<SocialMediaFlow key="social" />);
    }

    if (flows.length === 0) return <Text>Please select a platform to configure.</Text>;
    return flows;
  };

  return (
    <>
      <Modal opened={isModalOpen} onClose={() => setIsModalOpen(false)} title="Choose from Project" size="xl">
        <ProjectMediaModal
          onSelect={(selectedFiles: File[]) => {
            setFiles([...files, ...selectedFiles]);
            setIsModalOpen(false);
          }}
        />
      </Modal>

      <Modal 
        opened={isSendingSessionActive} 
        onClose={() => setIsSendingSessionActive(false)}
        title="Sending WhatsApp Messages"
        closeOnClickOutside={false}
      >
        <Box ta="center">
          <Text mb="md">Sending to <b>{sendingQueue.length}</b> recipients. <br/>Progress: {currentSendingIndex} / {sendingQueue.length}</Text>
          {currentSendingIndex < sendingQueue.length ? (
            <>
              <Text size="sm" color="dimmed" mb="xl">Next: <b>+{sendingQueue[currentSendingIndex]}</b></Text>
              <Button size="lg" onClick={sendNextMessage}>Send Next Message &rarr;</Button>
            </>
          ) : (
            <Button color="green" onClick={() => setIsSendingSessionActive(false)}>Done!</Button>
          )}
        </Box>
      </Modal>

      <Paper shadow="sm" p="xl" mb="xl" pos="relative">
        <LoadingOverlay visible={isSubmitting} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
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
                <Text size="sm" fw={500} mb="xs">Upload Media</Text>
                <Group>
                  <FileInput placeholder="Click to upload images or videos" multiple leftSection={<UploadIcon size={16} />} onChange={(files) => files && handleFileChange(files)} accept="image/*,video/*" style={{ flex: 1 }} />
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
                                <Box w={60} h={60} className="bg-gray-200 dark:bg-gray-700 flex items-center justify-center"><Text size="xs">Video</Text></Box>
                              )}
                              <Button size="xs" variant="subtle" color="red" onClick={() => removeFile(index)}><XIcon size={14} /></Button>
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
            <Box>
              <Text mb="sm" size="sm">Pick a date to schedule, or use "Post Now" to send immediately.</Text>
              <DateTimePicker
                label="Schedule Date & Time"
                placeholder="Pick date and time"
                value={scheduledDate}
                onChange={(value) => setScheduledDate(value)}
                minDate={new Date()}
                clearable
              />
            </Box>
          )}
        </Box>

        <Group justify="flex-end" mt="xl">
          {activeStep > 0 && <Button variant="default" onClick={prevStep}>Back</Button>}
          {activeStep < 3 && <Button onClick={nextStep} disabled={!isStepCompleted(activeStep)}>Next step</Button>}
          {activeStep === 3 && (
            <Group>
              {/* FIX: Added "Post Now" button that bypasses scheduling */}
              <Button 
                variant="light" 
                color="blue"
                leftSection={<SendIcon size={16} />}
                onClick={() => handleSubmit(true)}
              >
                Post Now
              </Button>

              {/* FIX: "Schedule" button is only enabled if a date is picked */}
              <Button 
                leftSection={<ClockIcon size={16} />}
                onClick={() => handleSubmit(false)} 
                color="blue" 
                disabled={!scheduledDate}
              >
                Schedule Campaign
              </Button>
            </Group>
          )}
        </Group>
      </Paper>
    </>
  );
};

export default CampaignForm;