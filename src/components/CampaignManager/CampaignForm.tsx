import React, { useState, useEffect } from 'react';
import { Paper, TextInput, Textarea, Button, Group, FileInput, Box, Text, Stepper, Modal, LoadingOverlay, Select, Title, SimpleGrid, ActionIcon, Image, MultiSelect, Badge, Avatar, ScrollArea, Divider, Stack } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import '@mantine/dates/styles.css';
import { UploadIcon, SendIcon, ClockIcon, SaveIcon, XIcon, SparklesIcon } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../auth/useAuth';
import { useUserRole } from '../../auth/UserContext';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import PlatformSelector from './PlatformSelector';
import WhatsappFlow from './flows/WhatsappFlow';
import EmailFlow from './flows/EmailFlow';
import SocialMediaFlow from './flows/SocialMediaFlow';
import ProjectMediaModal from './ProjectMediaModal';
import CampaignResultModal, { CampaignResult } from './CampaignResultModal';

const CampaignForm: React.FC = () => {
  const { user } = useAuth();
  const { currentOrgId } = useUserRole();
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
  const [campaignResult, setCampaignResult] = useState<CampaignResult | null>(null);

  const [groups, setGroups] = useState<{ value: string, label: string }[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  
  const [clientsList, setClientsList] = useState<{ value: string, label: string }[]>([]);
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [groupClients, setGroupClients] = useState<{ name: string; email?: string; phone?: string; country?: string; instagram?: string; facebook?: string }[]>([]);
  const [localMediaPreviewUrls, setLocalMediaPreviewUrls] = useState<string[]>([]);



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
    const fetchTargets = async () => {
      if (!user) return;
      
      const { data: gData } = await supabase.from('groups').select('id, name').eq('user_id', user.id);
      if (gData) setGroups(gData.map(g => ({ value: g.id, label: g.name })));

      const { data: cData } = await supabase.from('clients').select('id, name, email, phone').eq('user_id', user.id);
      if (cData) setClientsList(cData.map(c => ({ value: c.id, label: `${c.name} ${c.email ? `(${c.email})` : ''}` })));
    };
    fetchTargets();
  }, [currentOrgId]);

  // Fetch clients from selected group for audience preview
  useEffect(() => {
    const fetchGroupClients = async () => {
      if (!selectedGroupId) { setGroupClients([]); return; }
      const { data, error } = await supabase
        .from('client_groups')
        .select('clients(name, email, phone, country, instagram, facebook)')
        .eq('group_id', selectedGroupId);
      if (!error && data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setGroupClients(data.map((item: any) => item.clients).filter(Boolean));
      }
    };
    fetchGroupClients();
  }, [selectedGroupId]);

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setLocalMediaPreviewUrls(urls);

    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [files]);


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
      .select('clients(phone, email, facebook_psid)')
      .eq('group_id', groupId);

    if (error || !data) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((item: any) => item.clients);
  };

  const getSpecificClients = async (clientIds: string[]) => {
    if (clientIds.length === 0) return [];
    const { data, error } = await supabase
      .from('clients')
      .select('phone, email, facebook_psid')
      .in('id', clientIds);

    if (error || !data) return [];
    return data;
  };

  // --- BACKEND INTEGRATION ---

  const scheduleSocialPost = async (finalMediaList: string[], currentCampaignId: string) => {
    // 1. Get selected platforms directly from the main state
    const platformsToPost = selectedPlatforms.filter(p =>
      ['facebook', 'instagram'].includes(p)
    );

    if (platformsToPost.length === 0) return; // Should not happen if filtered correctly before calling

    const { error } = await supabase
      .from('social_posts')
      .insert([{
        campaign_id: currentCampaignId,
        organization_id: currentOrgId,
        content: content,
        platforms: platformsToPost,
        media_urls: finalMediaList,
        status: 'scheduling'
      }]);

    if (error) throw error;
    console.log("Queued Social Post for:", platformsToPost);
  };

  const scheduleWhatsappMessage = async (numbers: string[], finalMediaList: string[], currentCampaignId: string) => {
    if (numbers.length === 0) return;

    const metadata = {
        campaign_id: currentCampaignId,
        title: title,
        content: content
    };

    // We insert individual rows for each number (for now, simpler for our worker)
    const waCta = platformData.whatsapp?.ctaLink ? `\n\n${platformData.whatsapp.ctaLink}` : '';
    const rows = numbers.map(num => ({
      campaign_id: currentCampaignId,
      organization_id: currentOrgId,
      phone: num,
      message: `*${title}*\n\n${content}${waCta}`, // Retained for backwards compatibility if needed
      status: 'scheduling',
      media_urls: finalMediaList,
      metadata: metadata
    }));

    const { error } = await supabase
      .from('whatsapp_outbox')
      .insert(rows);

    if (error) throw error;
    console.log("Queued WhatsApp Messages for:", numbers.length, "recipients");
  };


  const getRecipientsForPlatform = async (groupId: string | null, platformType: 'phone' | 'email' | 'messenger'): Promise<string[]> => {
    let targets: string[] = [];
    let combinedClients: any[] = [];
    
    if (groupId) {
      const groupClients = await getClientsFromGroup(groupId);
      combinedClients = [...combinedClients, ...groupClients];
    }
    
    if (selectedClientIds.length > 0) {
      const specificClients = await getSpecificClients(selectedClientIds);
      combinedClients = [...combinedClients, ...specificClients];
    }

    if (combinedClients.length > 0) {
      if (platformType === 'phone') {
        targets = combinedClients.map(c => c?.phone).filter(p => !!p).map(p => String(p).replace(/\D/g, ''));
      } else {
        targets = combinedClients.map(c => c?.email).filter(e => !!e);
      }
      // Remove duplicates
      targets = Array.from(new Set(targets));
    } else {
      // Manual Entry fallback
      const typeLabel = platformType === 'phone' ? 'Phone Numbers' : 'Emails';
      const input = prompt(`Enter ${typeLabel} (comma separated):`);
      if (input) {
        targets = input.split(',').map(s => s.trim()).filter(s => s.length > 5);
      }
    }
    return targets;
  };

  const sendEmail = async (currentCampaignId: string, forceImmediate = false) => {
    let recipients: string[] = [];
    let combinedClients: any[] = [];
    
    if (selectedGroupId) {
      const groupClients = await getClientsFromGroup(selectedGroupId);
      combinedClients = [...combinedClients, ...groupClients];
    }
    
    if (selectedClientIds.length > 0) {
      const specificClients = await getSpecificClients(selectedClientIds);
      combinedClients = [...combinedClients, ...specificClients];
    }

    if (combinedClients.length > 0) {
      recipients = combinedClients.map(c => c?.email).filter(e => !!e);
      recipients = Array.from(new Set(recipients));
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

      // Build rich email HTML with title as heading
      const firstUrlMatch = (content || '').match(/https?:\/\/[^\s<]+/i);
      const ctaUrl = firstUrlMatch?.[0] || null;
      const linkifiedContent = (content || '')
        .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" style="color:#2563eb;text-decoration:underline;">$1</a>')
        .replace(/\n/g, '<br/>');

      const ctaLabel = (platformData.email?.ctaLabel || 'View Campaign').toString().trim() || 'View Campaign';
      const ctaButtonHtml = ctaUrl
        ? `
          <div style="margin: 28px 0 20px; text-align: center;">
            <a href="${ctaUrl}" target="_blank" rel="noopener noreferrer"
               style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:10px;font-weight:600;">
              ${ctaLabel}
            </a>
          </div>
        `
        : '';

      const emailHtml = `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
          ${title ? `<h2 style="color: #111; margin-bottom: 12px;">${title}</h2>` : ''}
          <p style="line-height: 1.7; margin-bottom: 24px;">${linkifiedContent}</p>
          ${ctaButtonHtml}
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;"/>
          <p style="font-size: 12px; color: #aaa;">Sent via Marketing VHP Campaign Manager</p>
        </div>
      `;

      // ----------------------------------------------------------------
      // UPDATED: Robust Error Handling & Protocol Fallback
      // ----------------------------------------------------------------
      for (const email of recipients) {
        const payload = {
          to: email,
          subject: emailConfig.subject || title || "New Campaign",
          html: emailHtml,
          scheduledAt: scheduledAtISO,
          attachments: attachments,
          organizationId: currentOrgId,
          campaignId: currentCampaignId,
        };

        // Call the Supabase Edge Function directly
        const { data: resultData, error: invokeError } = await supabase.functions.invoke('send-email', {
            body: payload
        });

        if (invokeError) {
            throw new Error(`Edge Function Error: ${invokeError.message || JSON.stringify(invokeError)}`);
        }
        
        if (resultData && resultData.error) {
            throw new Error(resultData.error);
        }
      }
      // ----------------------------------------------------------------

      // Success feedback is handled by CampaignResultModal in handleSubmit.

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

  const upsertCampaignHistory = async (status: string, finalMediaList: string[]): Promise<string | null> => {
    if (!user) return null;

    const campaignData = {
      user_id: user.id,
      organization_id: currentOrgId,
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
      const { error } = await supabase.from('marketing_campaigns').update(campaignData).eq('id', campaignId);
      if (error) throw error;
      return campaignId;
    } else {
      const { data, error } = await supabase.from('marketing_campaigns').insert(campaignData).select('id').single();
      if (error) throw error;
      return data?.id || null;
    }
  };

  const handleSubmit = async (action: 'immediate' | 'schedule' | 'draft') => {
    if (action === 'draft') {
      if (!title) { alert("Title is required for draft."); return; }
      setIsSubmitting(true);
      try {
        const newUploadedUrls = await uploadFilesToStorage();
        const finalMediaList = [...existingMedia, ...newUploadedUrls];
        await upsertCampaignHistory('draft', finalMediaList);
      } finally {
        setIsSubmitting(false);
      }
      setCampaignResult({ type: 'draft', platforms: selectedPlatforms });
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
      const statusToSave = action === 'immediate' ? 'sent' : 'scheduled';
      const currentCampaignId = await upsertCampaignHistory(statusToSave, finalMediaList);
      if (!currentCampaignId) throw new Error('Failed to create campaign record.');

      if (selectedPlatforms.includes('whatsapp')) {
        const numbers = await getRecipientsForPlatform(selectedGroupId, 'phone');
        if (numbers.length > 0) {
          await scheduleWhatsappMessage(numbers, finalMediaList, currentCampaignId);
        }
      }


      // 3. Handle Social Media (Meta Graph API)
      const isSocialSelected = selectedPlatforms.some(p => ['facebook', 'instagram'].includes(p));
      if (isSocialSelected) {
        await scheduleSocialPost(finalMediaList, currentCampaignId);
      }

      // 4. Handle Email (Legacy / Existing)
      if (selectedPlatforms.includes('email')) {
        await sendEmail(currentCampaignId, action === 'immediate');
      }

      // Scheduled email campaigns are accepted by provider first, then delivered later.
      // If schedule time is already due (or past by the time user submits), reconcile to sent.
      if (action === 'schedule' && selectedPlatforms.includes('email') && scheduledDate) {
        const scheduleTs = new Date(scheduledDate).getTime();
        const nowTs = Date.now();
        if (scheduleTs <= nowTs + 60_000) {
          await supabase
            .from('marketing_campaigns')
            .update({ status: 'sent' })
            .eq('id', currentCampaignId)
            .eq('status', 'scheduled');
        }
      }

      setCampaignResult({
        type: action === 'immediate' ? 'sent' : 'scheduled',
        platforms: selectedPlatforms,
        scheduledAt: scheduledDate ? new Date(scheduledDate).toISOString() : undefined,
      });

    } catch (error: unknown) {
      console.error("Campaign Failed:", error);
      const msg = error instanceof Error ? error.message : JSON.stringify(error);
      setCampaignResult({ type: 'error', errorMessage: msg });
      try {
        const newUploadedUrls = await uploadFilesToStorage();
        const finalMediaList = [...existingMedia, ...newUploadedUrls];
        await upsertCampaignHistory('failed', finalMediaList);
      } catch (saveErr) {
        console.error('Failed to persist failed campaign state:', saveErr);
      }
    }
    setIsSubmitting(false);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlePlatformDataChange = (platform: string, data: Record<string, any>) => {
    setPlatformData((prev) => ({ ...prev, [platform]: data }));
  };

  const isStepCompleted = (step: number) => {
    if (step === 0) return selectedPlatforms.length > 0;
    if (step === 1) return title.trim() !== '' && content.trim() !== '';
    return true;
  };

  const handleStepClick = (step: number) => { if (step < activeStep) setActiveStep(step); };

  const renderFlow = () => {
    const flows = [];
    if (selectedPlatforms.includes('whatsapp')) {
      flows.push(
        <WhatsappFlow
          key="whatsapp"
          data={platformData.whatsapp || {}}
          onChange={(data) => handlePlatformDataChange('whatsapp', data)}
          title={title}
          content={content}
          previewMediaUrls={[...existingMedia, ...localMediaPreviewUrls]}
        />
      );
    }
    if (selectedPlatforms.includes('email')) {
      flows.push(<EmailFlow key="email" data={platformData.email || {}} onChange={(data) => handlePlatformDataChange('email', data)} title={title} content={content} orgId={currentOrgId || ''} />);
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
      {/* Campaign Result Modal */}
      <CampaignResultModal
        result={campaignResult}
        onClose={() => setCampaignResult(null)}
        onGoToManager={() => { setCampaignResult(null); navigate('/campaign-manager'); }}
        onRetry={() => { setCampaignResult(null); }}
      />

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
          <Stepper.Step label="Platforms" description="Channels" />
          <Stepper.Step label="Details" description="Content" />
          <Stepper.Step label="Target" description="Audience" />
          <Stepper.Step label="Schedule" description="Finish" />
        </Stepper>

        <Box mt="xl">
          {activeStep === 0 && <PlatformSelector selectedPlatforms={selectedPlatforms} onChange={setSelectedPlatforms} />}

          {activeStep === 1 && (
            <Box>
              <Group justify="flex-end" mb="md">
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


          {activeStep === 2 && (
            <Box>
              <Title order={4} mb="sm">Select Target Audience</Title>
              <Text size="sm" c="dimmed" mb="xl">Choose who will receive this campaign. If both are empty, you will automatically be prompted for manual entry upon sending.</Text>

              <Select
                label="Audience Group"
                placeholder="Select group to broadcast to"
                data={groups}
                value={selectedGroupId}
                onChange={setSelectedGroupId}
                clearable
                w={{base: '100%', sm: 400}}
                mb="sm"
              />

              {/* Group audience preview */}
              {selectedGroupId && (
                <Box mb="lg">
                  {groupClients.length > 0 ? (
                    <>
                      <Group gap="xs" mb="xs">
                        <Badge color="blue" variant="light" size="sm">{groupClients.length} contacts in group</Badge>
                      </Group>
                      <ScrollArea h={groupClients.length > 5 ? 180 : undefined} type="auto">
                        <Stack gap={6}>
                          {groupClients.map((c, i) => (
                            <Group key={i} gap="xs" p={6} style={{ borderRadius: 6, background: '#f8f9fa' }}>
                              <Avatar size="xs" radius="xl" color="blue">{c.name?.[0]?.toUpperCase() || '?'}</Avatar>
                              <Box style={{ flex: 1, minWidth: 0 }}>
                                <Text size="xs" fw={500} truncate>{c.name}</Text>
                                {c.email ? <Text size="xs" c="dimmed" truncate>{c.email}</Text> : null}
                                {c.phone ? <Text size="xs" c="dimmed">{c.phone}</Text> : null}
                                {c.country ? <Text size="xs" c="dimmed">Country: {c.country}</Text> : null}
                                {c.instagram ? <Text size="xs" c="dimmed">IG: {c.instagram}</Text> : null}
                                {c.facebook ? <Text size="xs" c="dimmed">FB: {c.facebook}</Text> : null}
                              </Box>
                            </Group>
                          ))}
                        </Stack>
                      </ScrollArea>
                    </>
                  ) : (
                    <Text size="xs" c="dimmed">No contacts found in this group.</Text>
                  )}
                </Box>
              )}

              <Divider my="md" />

              <Text mb="xl">
                Individual Customers: <b>{selectedClientIds.length > 0 ? `${selectedClientIds.length} users selected` : "None"}</b>
              </Text>

              <Title order={4} mb="md">Platform Context</Title>
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