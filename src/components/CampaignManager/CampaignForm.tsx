import React, { useState, useEffect } from 'react';
import { Paper, TextInput, Textarea, Button, Group, FileInput, Box, Text, Stepper, Modal, LoadingOverlay, Select, Title, SimpleGrid, ActionIcon, Image } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import '@mantine/dates/styles.css'; 
import { UploadIcon, SendIcon, ClockIcon, UsersIcon, SaveIcon, XIcon } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../auth/useAuth';
import { useNavigate, useParams } from 'react-router-dom';
import PlatformSelector from './PlatformSelector';
import WhatsappFlow from './flows/WhatsappFlow';
import EmailFlow from './flows/EmailFlow';
import SocialMediaFlow from './flows/SocialMediaFlow';
import ProjectMediaModal from './ProjectMediaModal';

const CampaignForm: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { campaignId } = useParams();

  const [activeStep, setActiveStep] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  
  // State for NEW files to be uploaded
  const [files, setFiles] = useState<File[]>([]);
  // State for EXISTING media URLs (from database)
  const [existingMedia, setExistingMedia] = useState<string[]>([]);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [platformData, setPlatformData] = useState<Record<string, Record<string, any>>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [groups, setGroups] = useState<{value: string, label: string}[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const [sendingQueue, setSendingQueue] = useState<string[]>([]);
  const [currentSendingIndex, setCurrentSendingIndex] = useState(0);
  const [isSendingSessionActive, setIsSendingSessionActive] = useState(false);

  // Fetch Groups
  useEffect(() => {
    const fetchGroups = async () => {
      if (!user) return;
      const { data } = await supabase.from('groups').select('id, name').eq('user_id', user.id);
      if (data) {
        setGroups(data.map(g => ({ value: g.id, label: g.name })));
      }
    };
    fetchGroups();
  }, [user]);

  // Fetch Campaign Logic
  useEffect(() => {
    const fetchCampaign = async () => {
      if (!campaignId || !user) return;
      
      setIsSubmitting(true);
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();
      
      if (error) {
        console.error("Error fetching campaign:", error);
      } else if (data) {
        setTitle(data.title);
        setContent(data.content || '');
        setSelectedPlatforms(data.platforms || []);
        if (data.scheduled_date) {
            setScheduledDate(new Date(data.scheduled_date));
        }
        if (data.platform_data) {
            setPlatformData(data.platform_data);
            if (data.platform_data.target_group_id) {
                setSelectedGroupId(data.platform_data.target_group_id);
            }
            // FIX: Load existing media URLs
            if (Array.isArray(data.platform_data.media)) {
                setExistingMedia(data.platform_data.media);
            }
        }
      }
      setIsSubmitting(false);
    };

    fetchCampaign();
  }, [campaignId, user]);


  const handleFileChange = (newFiles: File[]) => {
    setFiles([...files, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };
  
  // New helper to remove existing media URLs
  const removeExistingMedia = (index: number) => {
    setExistingMedia(existingMedia.filter((_, i) => i !== index));
  };
  
  const getClientsFromGroup = async (groupId: string) => {
    const { data, error } = await supabase
      .from('client_groups')
      .select('clients(phone, email)')
      .eq('group_id', groupId);
    
    if (error || !data) return [];
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((item: any) => item.clients); 
  };

  const startWhatsappBulkSession = async () => {
    // ... (No changes to whatsapp logic)
    let numbers: string[] = [];
    if (selectedGroupId) {
       const clients = await getClientsFromGroup(selectedGroupId);
       // eslint-disable-next-line @typescript-eslint/no-explicit-any
       numbers = clients.map((c: any) => c.phone).filter((p: any) => p).map((p: any) => p.replace(/\D/g, '')); 
    } else {
        const numbersInput = prompt("Enter recipient numbers separated by commas:");
        if (!numbersInput) return;
        numbers = numbersInput.split(',').map(num => num.replace(/\D/g, '')).filter(num => num.length > 5);
    }
    if (numbers.length === 0) { alert("No valid numbers found."); return; }
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
      navigate('/campaign-manager'); 
      return;
    }
    const number = sendingQueue[currentSendingIndex];
    const encodedMessage = encodeURIComponent(content);
    const whatsappUrl = `https://wa.me/${number}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
    setCurrentSendingIndex(prev => prev + 1);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const sendEmail = async (forceImmediate = false) => {
    // ... (Recipients logic same as before)
    let recipients: string[] = [];
    if (selectedGroupId) {
        const clients = await getClientsFromGroup(selectedGroupId);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recipients = clients.map((c: any) => c.email).filter((e: any) => e);
    } else {
        const testEmail = prompt("Enter a test email address:");
        if (testEmail) recipients = [testEmail];
    }
    if (recipients.length === 0) { alert("No valid emails found."); return; }
    
    try {
      const emailConfig = platformData.email || {};
      let scheduledAtISO = null;
      
      if (!forceImmediate && scheduledDate) {
        // ... (Schedule logic same as before)
        const dateObj = new Date(scheduledDate);
        const now = new Date();
        const maxDate = new Date(now.getTime() + 72 * 60 * 60 * 1000); 
        if (dateObj > maxDate) { alert("Error: 72h limit."); throw new Error("Date limit"); }
        scheduledAtISO = dateObj.toISOString();
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const attachments: any[] = [];
      let imageHtml = "";
      
      // Process NEW files
      if (files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const base64Content = await fileToBase64(file);
          const cid = `new-${Date.now()}-${i}`;
          attachments.push({
            filename: file.name,
            content: base64Content,
            content_id: cid,
          });
          imageHtml += `<br/><img src="cid:${cid}" alt="${file.name}" style="max-width: 100%; height: auto;" /><br/>`;
        }
      }

      // Process EXISTING media (URLs)
      // Note: For Resend to inline these from URL, we typically need to download them first or just link them.
      // For simplicity here, we will just LINK them in HTML, as converting URL -> Base64 -> Upload again is inefficient.
      if (existingMedia.length > 0) {
          existingMedia.forEach(url => {
              imageHtml += `<br/><img src="${url}" alt="Campaign Media" style="max-width: 100%; height: auto;" /><br/>`;
          });
      }

      const emailHtml = `<div style="font-family: sans-serif; color: #333;"><p>${content}</p>${imageHtml}</div>`;

      for (const email of recipients) {
          await supabase.functions.invoke('send-email', {
            body: {
              to: email,
              subject: emailConfig.subject || "New Campaign",
              html: emailHtml,
              from: emailConfig.fromAddress || "marketing@example.com",
              scheduledAt: scheduledAtISO,
              attachments: attachments
            }
          });
      }

      if (scheduledAtISO) alert(`Campaign Scheduled!`);
      else alert(`Campaign Sent!`);
      
    } catch (error: unknown) {
      console.error("Email failed:", error);
      const msg = error instanceof Error ? error.message : "Unknown error";
      alert("Failed: " + msg);
      throw error; 
    }
  };

  // NEW Helper: Upload files to Storage
  const uploadFilesToStorage = async (): Promise<string[]> => {
      if (files.length === 0) return [];
      const uploadedUrls: string[] = [];

      for (const file of files) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `${user?.id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
              .from('campaign-media') // MAKE SURE THIS BUCKET EXISTS
              .upload(filePath, file);

          if (uploadError) {
              console.error('Upload error:', uploadError);
              continue;
          }

          const { data } = supabase.storage.from('campaign-media').getPublicUrl(filePath);
          if (data) uploadedUrls.push(data.publicUrl);
      }
      return uploadedUrls;
  };

  const saveCampaignHistory = async (status: string) => {
      if(!user) return;

      // 1. Upload new files first
      const newUploadedUrls = await uploadFilesToStorage();
      
      // 2. Combine with existing
      const finalMediaList = [...existingMedia, ...newUploadedUrls];

      const campaignData = {
          user_id: user.id,
          title: title,
          content: content,
          platforms: selectedPlatforms,
          status: status,
          scheduled_date: scheduledDate,
          platform_data: { 
              ...platformData, 
              target_group_id: selectedGroupId,
              media: finalMediaList // Save the URLs!
          } 
      };

      if (campaignId) {
          await supabase.from('marketing_campaigns').update(campaignData).eq('id', campaignId);
      } else {
          await supabase.from('marketing_campaigns').insert(campaignData);
      }
  };

  const handleSubmit = async (action: 'immediate' | 'schedule' | 'draft') => {
    if (action === 'draft') {
       if (!title) { alert("Title is required for draft."); return; }
       setIsSubmitting(true);
       await saveCampaignHistory('draft');
       setIsSubmitting(false);
       navigate('/campaign-manager');
       return;
    }

    if (action === 'schedule' && !scheduledDate) {
      alert("Please select a date.");
      return;
    }

    setIsSubmitting(true);
    try {
        if (selectedPlatforms.includes('whatsapp')) {
          await startWhatsappBulkSession();
        } 
        else if (selectedPlatforms.includes('email')) {
          await sendEmail(action === 'immediate');
        }
        await saveCampaignHistory(action === 'immediate' ? 'sent' : 'scheduled');
        navigate('/campaign-manager');
    } catch {
        await saveCampaignHistory('failed'); 
    }
    setIsSubmitting(false);
  };

  // ... (Keep boilerplate: handlePlatformDataChange, isStepCompleted, handleStepClick, renderFlow, nextStep, prevStep)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlePlatformDataChange = (platform: string, data: Record<string, any>) => {
    setPlatformData((prev) => ({ ...prev, [platform]: data }));
  };

  const isStepCompleted = (step: number) => {
    if (step === 0) return title.trim() !== '' && content.trim() !== '';
    if (step === 1) return selectedPlatforms.length > 0;
    return true;
  };

  const handleStepClick = (step: number) => { if (step < activeStep) setActiveStep(step); };

  const renderFlow = () => {
      const flows = [];
        if (selectedPlatforms.includes('whatsapp')) {
        flows.push(<WhatsappFlow key="whatsapp" data={platformData.whatsapp || {}} onChange={(data) => handlePlatformDataChange('whatsapp', data)} />);
        }
        if (selectedPlatforms.includes('email')) {
        flows.push(<EmailFlow key="email" data={platformData.email || {}} onChange={(data) => handlePlatformDataChange('email', data)} />);
        }
        if (selectedPlatforms.some((p) => ['facebook', 'instagram', 'twitter', 'linkedin'].includes(p))) {
        flows.push(<SocialMediaFlow key="social" />);
        }
        if (flows.length === 0) return <Text>Please select a platform.</Text>;
        return flows;
  };

  const nextStep = () => setActiveStep((current) => (current < 3 ? current + 1 : current));
  const prevStep = () => setActiveStep((current) => (current > 0 ? current - 1 : current));

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

      {/* WhatsApp Queue Modal */}
      <Modal opened={isSendingSessionActive} onClose={() => setIsSendingSessionActive(false)} title="Sending WhatsApp" closeOnClickOutside={false}>
        <Box ta="center">
          <Text mb="md">Sending to <b>{sendingQueue.length}</b> recipients. <br/>Progress: {currentSendingIndex} / {sendingQueue.length}</Text>
          {currentSendingIndex < sendingQueue.length ? (
             <>
              <Text size="sm" c="dimmed" mb="xl">Next: <b>+{sendingQueue[currentSendingIndex]}</b></Text>
              <Button size="lg" onClick={sendNextMessage}>Send Next Message &rarr;</Button>
             </>
          ) : (
             <Button color="green" onClick={() => {
                 setIsSendingSessionActive(false);
                 saveCampaignHistory('sent'); 
                 navigate('/campaign-manager'); 
             }}>Done!</Button>
          )}
        </Box>
      </Modal>

      <Paper shadow="sm" p="xl" mb="xl" pos="relative">
        <LoadingOverlay visible={isSubmitting} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
        <Stepper active={activeStep} onStepClick={handleStepClick}>
          <Stepper.Step label="Details" description="Content" />
          <Stepper.Step label="Platforms" description="Channels" />
          <Stepper.Step label="Target" description="Audience" /> 
          <Stepper.Step label="Schedule" description="Finish" />
        </Stepper>

        <Box mt="xl">
          {activeStep === 0 && (
             <Box>
               <TextInput label="Title" value={title} onChange={(e) => setTitle(e.currentTarget.value)} required mb="md" />
               <Textarea label="Content" value={content} onChange={(e) => setContent(e.currentTarget.value)} minRows={4} required mb="md" />
               
               <Text size="sm" fw={500} mb="xs">Media</Text>
               <Group>
                 <FileInput 
                    placeholder="Upload files" 
                    multiple 
                    leftSection={<UploadIcon size={16} />} 
                    onChange={(files) => files && handleFileChange(files)} 
                    style={{ flex: 1 }} 
                    value={files}
                 />
                 <Button onClick={() => setIsModalOpen(true)}>Project</Button>
               </Group>
               
               {/* MEDIA PREVIEW GRID (NEW + EXISTING) */}
               {(files.length > 0 || existingMedia.length > 0) && (
                 <SimpleGrid cols={{ base: 3, sm: 4 }} mt="md">
                   {/* 1. Existing Media (From DB) */}
                   {existingMedia.map((url, index) => (
                     <Box key={`exist-${index}`} pos="relative">
                       <Image 
                         src={url} 
                         h={120} 
                         fit="cover" 
                         radius="md" 
                         style={{ border: '1px solid #blue' }}
                       />
                       <ActionIcon 
                         color="red" 
                         variant="filled" 
                         size="sm" 
                         pos="absolute" 
                         top={5} 
                         right={5} 
                         onClick={() => removeExistingMedia(index)}
                       >
                         <XIcon size={12} />
                       </ActionIcon>
                       <Text size="xs" c="dimmed" mt={4} ta="center">Saved Image</Text>
                     </Box>
                   ))}

                   {/* 2. New Files (From Input) */}
                   {files.map((file, index) => (
                     <Box key={`new-${index}`} pos="relative">
                       <Image 
                         src={URL.createObjectURL(file)} 
                         h={120} 
                         fit="cover" 
                         radius="md" 
                         style={{ border: '1px solid #eee' }}
                       />
                       <ActionIcon 
                         color="red" 
                         variant="filled" 
                         size="sm" 
                         pos="absolute" 
                         top={5} 
                         right={5} 
                         onClick={() => removeFile(index)}
                       >
                         <XIcon size={12} />
                       </ActionIcon>
                       <Text size="xs" lineClamp={1} mt={4} ta="center">{file.name}</Text>
                     </Box>
                   ))}
                 </SimpleGrid>
               )}
               {/* End Preview */}

             </Box>
          )}

          {activeStep === 1 && <PlatformSelector selectedPlatforms={selectedPlatforms} onChange={setSelectedPlatforms} />}

          {activeStep === 2 && (
            <Box>
                <Title order={4} mb="md">Target Audience</Title>
                <Select
                    label="Select a Client Group"
                    placeholder="Choose a group (e.g. VIP Clients)"
                    data={groups}
                    value={selectedGroupId}
                    onChange={setSelectedGroupId}
                    clearable
                    mb="xl"
                    leftSection={<UsersIcon size={16}/>}
                />
                {renderFlow()}
            </Box>
          )}

          {activeStep === 3 && (
            <Box>
               <Text mb="sm">Pick a date to schedule, or use "Post Now".</Text>
               <DateTimePicker label="Schedule" value={scheduledDate} onChange={setScheduledDate} minDate={new Date()} clearable />
            </Box>
          )}
        </Box>

        <Group justify="flex-end" mt="xl">
          {activeStep > 0 && <Button variant="default" onClick={prevStep}>Back</Button>}
          {activeStep < 3 && <Button onClick={nextStep} disabled={!isStepCompleted(activeStep)}>Next</Button>}
          {activeStep === 3 && (
            <Group>
               <Button variant="subtle" leftSection={<SaveIcon size={16}/>} onClick={() => handleSubmit('draft')}>Save Draft</Button>
               <Button variant="light" color="blue" leftSection={<SendIcon size={16}/>} onClick={() => handleSubmit('immediate')}>Post Now</Button>
               <Button leftSection={<ClockIcon size={16}/>} onClick={() => handleSubmit('schedule')} color="blue" disabled={!scheduledDate}>Schedule</Button>
            </Group>
          )}
        </Group>
      </Paper>
    </>
  );
};

export default CampaignForm;