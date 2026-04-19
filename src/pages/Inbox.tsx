import { useState, useEffect, useRef } from 'react';
import {
  Box, Flex, Paper, Text, Avatar, Group, ScrollArea,
  TextInput, ActionIcon, UnstyledButton, Badge, Select,
  Loader, FileButton, CloseButton, Modal
} from '@mantine/core';
import {
  SendIcon, SearchIcon, MessageCircleIcon,
  InstagramIcon, FacebookIcon, PaperclipIcon, UserIcon, ArrowLeftIcon
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useUserRole } from '../auth/UserContext';
import PageShell from '../components/Dashboard/PageShell';

// Types mapped to our new DB Schema
interface Conversation {
  id: string;
  platform: string;
  external_contact_id: string;
  contact_name: string | null;
  unread_count: number;
  last_message_at: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_type: 'contact' | 'agent' | 'system';
  content: string;
  media_url: string | null;
  created_at: string;
}

export default function Inbox() {
  const { currentOrgId } = useUserRole();

  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const resetRef = useRef<() => void>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Filters
  const [channelFilter, setChannelFilter] = useState<string | null>(null);

  useEffect(() => {
    if (!currentOrgId) return;
    fetchConversations();

    // Subscribe to new conversations
    const convosSub = supabase.channel('table-db-changes-convo')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations', filter: `organization_id=eq.${currentOrgId}` }, () => {
        fetchConversations(); // Reload list to update last_message_at or unread counts
      }).subscribe();

    return () => {
      supabase.removeChannel(convosSub);
    };
  }, [currentOrgId]);

  useEffect(() => {
    if (!activeConvo) {
      setMessages([]);
      return;
    }

    fetchMessages(activeConvo.id);

    // Subscribe to real-time messages for THIS conversation
    const msgSub = supabase.channel(`room-${activeConvo.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeConvo.id}` }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message]);
        scrollToBottom();
      }).subscribe();

    return () => {
      supabase.removeChannel(msgSub);
    };
  }, [activeConvo]);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.children[0].scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }, 100);
  };

  const fetchConversations = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('organization_id', currentOrgId)
      .order('last_message_at', { ascending: false });

    if (!error && data) {
      setConversations(data as Conversation[]);
    }
    setIsLoading(false);
  };

  const fetchMessages = async (convoId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convoId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data as Message[]);
      scrollToBottom();
    }
  };

  const handleSendMessage = async () => {
    if ((!inputText.trim() && !file) || !activeConvo) return;
    setIsSending(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      let uploadedMediaUrl = null;
      if (file) {
         const fileExt = file.name.split('.').pop();
         const fileName = `${currentOrgId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
         
         const { error: uploadError } = await supabase.storage
            .from('chat-media')
            .upload(fileName, file);
         
         if (uploadError) throw new Error("Image Upload failed: " + uploadError.message);
         
         const { data: publicUrlData } = supabase.storage.from('chat-media').getPublicUrl(fileName);
         uploadedMediaUrl = publicUrlData.publicUrl;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL || 'https://pigxsklazwilvscxbnvy.supabase.co'}/functions/v1/send-chat-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          conversationId: activeConvo.id,
          content: inputText.trim(),
          mediaUrl: uploadedMediaUrl
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to send");
      }

      setInputText('');
      setFile(null);
      resetRef.current?.();
    } catch (e: any) {
      alert("Error sending message: " + e.message);
    } finally {
      setIsSending(false);
    }
  };

  // UI Helpers
  const getPlatformIcon = (platform: string, size = 16) => {
    if (platform === 'whatsapp') return <MessageCircleIcon size={size} color="#25D366" />;
    if (platform === 'messenger') return <FacebookIcon size={size} color="#00B2FF" />;
    if (platform === 'instagram') return <InstagramIcon size={size} color="#E4405F" />;
    return <MessageCircleIcon size={size} />;
  };

  const filteredConvos = conversations.filter(c => channelFilter ? c.platform === channelFilter : true);

  return (
    <PageShell noPadding>
      <Paper shadow="none" h="100%" radius={0} style={{ overflow: 'hidden' }}>
        <Flex h="100%">
        {/* LEFT COMPONENT - CONVERSATIONS */}
        <Box 
          w={{ base: '100%', sm: 350 }} 
          p="md" 
          style={{ borderRight: '1px solid #eee' }}
          display={{ base: activeConvo ? 'none' : 'block', sm: 'block' }}
        >
          <Text fw={700} size="xl" mb="md">Omnichannel Inbox</Text>

          <Select
            data={[
              { value: '', label: 'All Channels' },
              { value: 'whatsapp', label: 'WhatsApp' },
              { value: 'instagram', label: 'Instagram' },
              { value: 'messenger', label: 'Messenger' }
            ]}
            value={channelFilter}
            onChange={(val) => setChannelFilter(val === '' ? null : val)}
            placeholder="All Channels"
            mb="md"
          />

          <TextInput
            placeholder="Search conversations..."
            leftSection={<SearchIcon size={16} />}
            mb="md"
          />

          <ScrollArea h="calc(100vh - 250px)">
            {isLoading ? <Loader size="sm" mt="xl" mx="auto" display="block" /> : (
              filteredConvos.length === 0 ? (
                <Text c="dimmed" ta="center" mt="xl">No conversations yet</Text>
              ) : (
                filteredConvos.map(convo => (
                  <UnstyledButton
                    key={convo.id}
                    w="100%"
                    p="sm"
                    mb={4}
                    style={{
                      borderRadius: 8,
                      backgroundColor: activeConvo?.id === convo.id ? '#f3f4f6' : 'transparent',
                      transition: 'background-color 0.2s'
                    }}
                    onClick={() => setActiveConvo(convo)}
                  >
                    <Group wrap="nowrap">
                      <Avatar color="blue" radius="xl">
                        {getPlatformIcon(convo.platform, 20)}
                      </Avatar>
                      <Box style={{ flex: 1, overflow: 'hidden' }}>
                        <Text size="sm" fw={600} truncate>{convo.contact_name || convo.external_contact_id}</Text>
                        <Text size="xs" c="dimmed" truncate>{convo.platform}</Text>
                      </Box>
                      {convo.unread_count > 0 && <Badge color="red" size="sm" circle>{convo.unread_count}</Badge>}
                    </Group>
                  </UnstyledButton>
                ))
              )
            )}
          </ScrollArea>
        </Box>

        {/* RIGHT COMPONENT - THREAD */}
        <Box 
          style={{ flex: 1, flexDirection: 'column', backgroundColor: '#f9fafb' }}
          display={{ base: activeConvo ? 'flex' : 'none', sm: 'flex' }}
        >
          {!activeConvo ? (
            <Flex direction="column" align="center" justify="center" h="100%" c="dimmed">
              <MessageCircleIcon size={48} opacity={0.2} style={{ marginBottom: 16 }} />
              <Text size="lg" fw={500}>Select a conversation</Text>
              <Text size="sm">Choose a chat from the left to start replying</Text>
            </Flex>
          ) : (
            <>
              {/* Header */}
              <Paper p="md" shadow="xs" radius={0} style={{ zIndex: 10 }}>
                <Group>
                  {/* Mobile Back Button */}
                  <ActionIcon hiddenFrom="sm" onClick={() => setActiveConvo(null)} variant="subtle">
                    <ArrowLeftIcon size={20} />
                  </ActionIcon>

                  <Avatar color="blue" radius="xl">
                    <UserIcon size={20} />
                  </Avatar>
                  <Box>
                    <Text fw={600}>{activeConvo.contact_name || activeConvo.external_contact_id}</Text>
                    <Group gap="xs">
                      {getPlatformIcon(activeConvo.platform, 12)}
                      <Text size="xs" c="dimmed" style={{ textTransform: 'capitalize' }}>
                        {activeConvo.platform}
                      </Text>
                    </Group>
                  </Box>
                </Group>
              </Paper>

              {/* Messages Area */}
              <ScrollArea style={{ flex: 1, padding: 16 }} viewportRef={scrollRef}>
                <Flex direction="column" gap="md">
                  {messages.map(msg => {
                    const isAgent = msg.sender_type === 'agent' || msg.sender_type === 'system';
                    return (
                      <Flex key={msg.id} justify={isAgent ? 'flex-end' : 'flex-start'}>
                        <Paper
                          p="10px 14px"
                          radius="xl"
                          style={{
                            maxWidth: '75%',
                            backgroundColor: isAgent ? '#0084ff' : '#f0f0f0',
                            color: isAgent ? 'white' : 'black',
                            borderBottomRightRadius: isAgent ? 4 : undefined,
                            borderBottomLeftRadius: !isAgent ? 4 : undefined,
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                          }}
                        >
                          {msg.media_url && (
                             <img 
                               src={msg.media_url} 
                               alt="attachment" 
                               onClick={() => setPreviewImage(msg.media_url)}
                               style={{ 
                                 maxWidth: '100%', 
                                 maxHeight: 250, 
                                 objectFit: 'cover',
                                 borderRadius: 8, 
                                 marginBottom: msg.content ? 8 : 0,
                                 cursor: 'pointer' 
                               }} 
                             />
                          )}
                          {msg.content && (
                            <Text size="md" style={{ wordBreak: 'break-word', lineHeight: 1.4 }}>
                              {msg.content}
                            </Text>
                          )}
                          <Text 
                            size="10px" 
                            style={{ opacity: 0.7 }} 
                            ta="right" 
                            mt={2}
                          >
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </Paper>
                      </Flex>
                    );
                  })}
                </Flex>
              </ScrollArea>

              {/* Optional File Preview */}
              {file && (
                 <Box px="md" py="xs" style={{ borderTop: '1px solid #eee', backgroundColor: 'white' }}>
                   <Badge color="blue" variant="light" size="lg" rightSection={<CloseButton size="xs" onClick={() => { setFile(null); resetRef.current?.(); }} />}>
                     {file.name}
                   </Badge>
                 </Box>
              )}

              {/* Compose Bar */}
              <Paper p="md" shadow="xs" radius={0}>
                <Group wrap="nowrap">
                  <FileButton resetRef={resetRef} onChange={setFile} accept="image/png,image/jpeg,image/webp">
                    {(props) => (
                      <ActionIcon variant="subtle" size="lg" color={file ? "blue" : "gray"} {...props}>
                        <PaperclipIcon size={20} />
                      </ActionIcon>
                    )}
                  </FileButton>

                  <TextInput
                    style={{ flex: 1 }}
                    placeholder="Type a message..."
                    value={inputText}
                    onChange={(e) => setInputText(e.currentTarget.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    autoFocus
                  />

                  <ActionIcon
                    variant="filled"
                    color="blue"
                    size="lg"
                    onClick={handleSendMessage}
                    loading={isSending}
                    disabled={!inputText.trim() && !file}
                  >
                    <SendIcon size={18} />
                  </ActionIcon>
                </Group>
              </Paper>
            </>
          )}
        </Box>
      </Flex>
    </Paper>

      {/* Full Screen Image Preview Modal */}
      <Modal 
        opened={!!previewImage} 
        onClose={() => setPreviewImage(null)} 
        size="auto" 
        centered 
        withCloseButton={false}
        styles={{ content: { backgroundColor: 'transparent', boxShadow: 'none' } }}
      >
        <img 
          src={previewImage || ''} 
          alt="Preview" 
          style={{ maxWidth: '100vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8 }} 
        />
      </Modal>

    </PageShell>
  );
}
