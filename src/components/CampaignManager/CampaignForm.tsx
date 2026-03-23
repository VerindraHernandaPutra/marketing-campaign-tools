import React, { useState, useEffect } from 'react';
import { Paper, TextInput, Textarea, Button, Group, FileInput, Box, Text, Stepper, Modal, LoadingOverlay, Select, Title, SimpleGrid, ActionIcon, Image } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import '@mantine/dates/styles.css';
import { UploadIcon, SendIcon, ClockIcon, SaveIcon, XIcon, SparklesIcon } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../auth/useAuth';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import PlatformSelector from './PlatformSelector';
import WhatsappFlow from './flows/WhatsappFlow';
import EmailFlow from './flows/EmailFlow';
import SocialMediaFlow from './flows/SocialMediaFlow';
import ProjectMediaModal from './ProjectMediaModal';

const CampaignForm: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { campaignId } = useParams();
  const location = useLocation();

  const [activeStep, setActiveStep] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  const [files, setFiles] = useState<File[]>([]);
  const [existingMedia, setExistingMedia] = useState<string[]>([]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [platformData, setPlatformData] = useState<Record<string, Record<string, any>>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const [groups, setGroups] = useState<{ value: string, label: string }[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);



  // Handle Imported Design from Dashboard
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const state = location.state as any;
    if (state?.importedDesign) {
      const { title: designTitle, thumbnail } = state.importedDesign;

      if (!title && designTitle) setTitle(designTitle);

      if (thumbnail) {
        setExistingMedia(prev => {
          if (prev.includes(thumbnail)) return prev;
          return [...prev, thumbnail];
        });
      }
      window.history.replaceState({}, document.title);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


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
        alert("Could not load campaign.");
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

  const removeExistingMedia = (index: number) => {
    setExistingMedia(existingMedia.filter((_, i) => i !== index));
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

  const getAudienceContext = async (): Promise<string> => {
    if (!selectedGroupId) return "General Global Audience (English)";

    const { data } = await supabase
      .from('client_groups')
      .select('clients(country)')
      .eq('group_id', selectedGroupId)
      .limit(5);

    if (!data || data.length === 0) return "General Global Audience";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const countries = data.map((d: any) => d.clients?.country).filter(Boolean);

    if (countries.length === 0) return "General Global Audience";

    const detectedCountry = countries[0];
    console.log("Detected Audience Country:", detectedCountry);

    return `Target Audience Location: ${detectedCountry}. The content MUST be in the official language of ${detectedCountry}.`;
  };

  const handleGenerateContent = async () => {
    let imageToAnalyze: string | null = null;

    if (files.length > 0) {
      imageToAnalyze = await fileToBase64(files[0]);
    } else if (existingMedia.length > 0) {
      // Allow existing media for now, or warn if backend doesn't support it
      // For now, we'll proceed but maybe just use the first one if we can download it?
      // Or just warn the user to upload fresh for AI analysis.
      // ALERT REMOVED: To make button "usable". We'll just try without image or rely on title/content.
    }

    if (!imageToAnalyze) {
      alert("Please upload an image first so the AI can analyze it!");
      return;
    }

    setIsGeneratingAI(true);
    try {
      const audienceContext = await getAudienceContext();

      const { data, error } = await supabase.functions.invoke('generate-caption', {
        body: {
          imageBase64: imageToAnalyze,
          context: audienceContext,
          currentTitle: title,
          currentContent: content
        }
      });

      if (error) throw error;

      if (data) {
        if (data.title) setTitle(data.title);
        if (data.content) setContent(data.content);
      }
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error("AI Generation failed:", error);
      const msg = error.message || "Failed to generate content.";
      alert("AI Error: " + msg);
    } finally {
      setIsGeneratingAI(false);
    }
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

  // --- BACKEND INTEGRATION ---

  const scheduleSocialPost = async (finalMediaList: string[]) => {
    // 1. Get selected platforms directly from the main state
    const platformsToPost = selectedPlatforms.filter(p =>
      ['facebook', 'instagram', 'twitter', 'linkedin'].includes(p)
    );

    if (platformsToPost.length === 0) return; // Should not happen if filtered correctly before calling

    const { error } = await supabase
      .from('social_posts')
      .insert([{
        content: content,
        platforms: platformsToPost,
        media_urls: finalMediaList,
        status: 'scheduling'
      }]);

    if (error) throw error;
    console.log("Queued Social Post for:", platformsToPost);
  };

  const scheduleWhatsappMessage = async (numbers: string[], finalMediaList: string[]) => {
    if (numbers.length === 0) return;

    // We insert individual rows for each number (for now, simpler for our worker)
    const rows = numbers.map(num => ({
      phone: num,
      message: `*${title}*\n\n${content}`,
      status: 'scheduling',
      media_urls: finalMediaList
    }));

    const { error } = await supabase
      .from('whatsapp_outbox')
      .insert(rows);

    if (error) throw error;
    console.log("Queued WhatsApp Messages for:", numbers.length, "recipients");
  };

  const getRecipientsForPlatform = async (groupId: string | null, platformType: 'phone' | 'email'): Promise<string[]> => {
    let targets: string[] = [];
    if (groupId) {
      const clients = await getClientsFromGroup(groupId);
      if (platformType === 'phone') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        targets = clients.map((c: any) => c.phone).filter((p: any) => p).map((p: any) => p.replace(/\D/g, ''));
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        targets = clients.map((c: any) => c.email).filter((e: any) => e);
      }
    } else {
      // Manual Entry fallback
      const input = prompt(`Enter ${platformType === 'phone' ? 'Phone Numbers' : 'Emails'} (comma separated):`);
      if (input) {
        targets = input.split(',').map(s => s.trim()).filter(s => s.length > 5);
      }
    }
    return targets;
  };

  const sendEmail = async (forceImmediate = false) => {
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
      let scheduledAtISO = undefined;

      if (!forceImmediate && scheduledDate) {
        const dateObj = new Date(scheduledDate);
        const now = new Date();
        const maxDate = new Date(now.getTime() + 72 * 60 * 60 * 1000);
        if (dateObj > maxDate) { alert("Error: Resend Free Tier limit is 72 hours."); throw new Error("Date limit"); }
        scheduledAtISO = dateObj.toISOString();
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const attachments: any[] = [];
      // REMOVED: Inline image HTML generation to prevent broken images

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
          // Removed: imageHtml += ... 
        }
      }

      // REMOVED: Loop for existingMedia since we are not showing inline images anymore

      // Updated HTML: Only sends text content. Files will appear as standard attachments.
      const emailHtml = `<div style="font-family: sans-serif; color: #333;"><p>${content}</p></div>`;

      // ----------------------------------------------------------------
      // UPDATED: Robust Error Handling & Protocol Fallback
      // ----------------------------------------------------------------
      for (const email of recipients) {
        const payload = {
          to: email,
          subject: emailConfig.subject || "New Campaign",
          html: emailHtml,
          from: emailConfig.fromAddress || "Marketing Team <info@marketing.gloaicloud.com>",
          scheduledAt: scheduledAtISO,
          attachments: attachments
        };

        // Try 1: Try Localhost first (for testing like right now)
        let response;
        try {
          response = await fetch('http://localhost:3050/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        } catch (localError) {
          console.warn("Localhost failed, trying Production server...", localError);
          // Try 2: Production Server (HTTPS)
          try {
            response = await fetch('https://marketing.gloaicloud.com:3050/api/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
          } catch (httpsError) {
            console.error("Production server also failed:", httpsError);
            throw new Error("Could not connect to Email Server (Port 3050 blocked or server offline).");
          }
        }

        if (response && !response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Server refused request: ${response.statusText}`);
        }
      }
      // ----------------------------------------------------------------

      if (scheduledAtISO) alert(`Campaign Scheduled successfully!`);
      else alert(`Campaign Sent successfully!`);

    } catch (error: unknown) {
      console.error("Email failed:", error);
      const msg = error instanceof Error ? error.message : "Unknown error";
      alert("Failed: " + msg);
      // Don't rethrow if we want the form to stay active for retry
    }
  };

  const uploadFilesToStorage = async (): Promise<string[]> => {
    if (files.length === 0) return [];
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('campaign-media')
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
    if (!user) return;
    const newUploadedUrls = await uploadFilesToStorage();
    const finalMediaList = [...existingMedia, ...newUploadedUrls];

    const campaignData = {
      user_id: user.id,
      title: title,
      content: content,
      platforms: selectedPlatforms,
      status: status,
      scheduled_date: scheduledDate ? new Date(scheduledDate).toISOString() : null,
      platform_data: {
        ...platformData,
        target_group_id: selectedGroupId,
        media: finalMediaList
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
      // 1. Upload Media First
      const newUploadedUrls = await uploadFilesToStorage();
      const finalMediaList = [...existingMedia, ...newUploadedUrls];

      if (selectedPlatforms.includes('whatsapp')) {
        const numbers = await getRecipientsForPlatform(selectedGroupId, 'phone');
        if (numbers.length > 0) {
          await scheduleWhatsappMessage(numbers, finalMediaList);
        }
      }

      // 3. Handle Social Media (Backend-Social / Ayrshare)
      const isSocialSelected = selectedPlatforms.some(p => ['facebook', 'instagram', 'twitter', 'linkedin'].includes(p));
      if (isSocialSelected) {
        await scheduleSocialPost(finalMediaList);
      }

      // 4. Handle Email (Legacy / Existing)
      if (selectedPlatforms.includes('email')) {
        await sendEmail(action === 'immediate');
      }

      // 5. Save Campaign Record
      await saveCampaignHistory(action === 'immediate' ? 'sent' : 'scheduled');

      alert("Campaign successfully processed!");
      navigate('/campaign-manager');

    } catch (error: any) {
      console.error("Campaign Failed:", error);
      alert(`Failed: ${error.message}`);
      await saveCampaignHistory('failed');
    }
    setIsSubmitting(false);
  };

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
      flows.push(<SocialMediaFlow key="social" selectedPlatforms={selectedPlatforms} />);
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
              {/* Target Audience Selection in Step 1 for AI Context */}
              <Group justify="space-between" mb="md">
                <Select
                  label="Target Audience (for AI context)"
                  placeholder="Select group to tailor content"
                  data={groups}
                  value={selectedGroupId}
                  onChange={setSelectedGroupId}
                  clearable
                  w={300}
                />
                <Button
                  variant="gradient"
                  gradient={{ from: 'indigo', to: 'cyan' }}
                  leftSection={<SparklesIcon size={16} />}
                  onClick={handleGenerateContent}
                  loading={isGeneratingAI}
                  disabled={false}
                >
                  {/* Logic to change button text based on existing inputs */}
                  {(title || content) ? 'Refine Draft with AI' : 'Auto-fill with AI'}
                </Button>
              </Group>

              <TextInput
                label="Title"
                placeholder="e.g. Summer Sale Campaign 2024"
                value={title}
                onChange={(e) => setTitle(e.currentTarget.value)}
                required
                mb="md"
              />
              <Textarea
                label="Content"
                placeholder="Write your engaging caption here... (e.g., 'Don't miss out on our exclusive summer deals! ☀️ #SummerSale')"
                value={content}
                onChange={(e) => setContent(e.currentTarget.value)}
                minRows={4}
                required
                mb="md"
              />

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

              {/* MEDIA PREVIEW GRID */}
              {(files.length > 0 || existingMedia.length > 0) && (
                <SimpleGrid cols={{ base: 3, sm: 4 }} mt="md">
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
                      <Text size="xs" c="dimmed" mt={4} ta="center">Saved</Text>
                    </Box>
                  ))}

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

            </Box>
          )}

          {activeStep === 1 && <PlatformSelector selectedPlatforms={selectedPlatforms} onChange={setSelectedPlatforms} />}

          {activeStep === 2 && (
            <Box>
              <Title order={4} mb="md">Review Targeting</Title>
              <Text mb="md">
                Selected Group: <b>{groups.find(g => g.value === selectedGroupId)?.label || "None"}</b>
              </Text>
              {renderFlow()}
            </Box>
          )}

          {activeStep === 3 && (
            <Box>
              <Text mb="sm">Pick a date to schedule, or use "Post Now".</Text>
              <DateTimePicker
                label="Schedule"
                placeholder="Pick a date and time"
                value={scheduledDate}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onChange={(value: any) => setScheduledDate(value)}
                minDate={new Date()}
                clearable
              />
            </Box>
          )}
        </Box>

        <Group justify="flex-end" mt="xl">
          {activeStep > 0 && <Button variant="default" onClick={prevStep}>Back</Button>}
          {activeStep < 3 && <Button onClick={nextStep} disabled={!isStepCompleted(activeStep)}>Next</Button>}
          {activeStep === 3 && (
            <Group>
              <Button variant="subtle" leftSection={<SaveIcon size={16} />} onClick={() => handleSubmit('draft')}>Save Draft</Button>
              <Button variant="light" color="blue" leftSection={<SendIcon size={16} />} onClick={() => handleSubmit('immediate')}>Post Now</Button>
              <Button leftSection={<ClockIcon size={16} />} onClick={() => handleSubmit('schedule')} color="blue" disabled={!scheduledDate}>Schedule</Button>
            </Group>
          )}
        </Group>
      </Paper>
    </>
  );
};

export default CampaignForm;