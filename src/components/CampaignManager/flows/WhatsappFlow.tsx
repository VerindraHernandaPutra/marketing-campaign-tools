import React, { useState, useEffect, useMemo } from 'react';
import { Paper, Text, TextInput, Group, ThemeIcon, Alert, Loader, Box, Divider, Badge, Avatar, SimpleGrid, Image } from '@mantine/core';
import { MessageCircleIcon, AlertCircleIcon, WifiIcon, SendIcon } from 'lucide-react';
import { supabase } from '../../../supabaseClient';
import { useUserRole } from '../../../auth/UserContext';

interface WhatsappData {
  ctaLink?: string;
  [key: string]: unknown;
}

interface WhatsappFlowProps {
  data: WhatsappData;
  onChange: (data: any) => void;
  title?: string;
  content?: string;
  previewMediaUrls?: string[];
}

type ConnectionInfo = {
  phone_number: string;
  device_name: string;
  device_status: string;
};

const WhatsappFlow: React.FC<WhatsappFlowProps> = ({ data, onChange, title = '', content = '', previewMediaUrls = [] }) => {
  const { currentOrgId } = useUserRole();
  const [connection, setConnection] = useState<ConnectionInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConnection = async () => {
        if (!currentOrgId) return;
        setLoading(true);
        setError(null);
        try {
            const { data: integData, error: integError } = await supabase
                .from('organization_integrations')
                .select('*')
                .eq('organization_id', currentOrgId)
                .eq('platform', 'whatsapp')
                .order('connected_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (integError || !integData) throw new Error("WhatsApp (Fonnte) not connected. Go to Integrations → WhatsApp.");

            const cleanPhone = String(integData.provider_account_id || '').replace(/\D/g, '');
            setConnection({
              phone_number: cleanPhone,
              device_name: integData.metadata?.device_name || 'My Device',
              device_status: integData.metadata?.device_status || 'connected',
            });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    fetchConnection();
  }, [currentOrgId]);

  const messagePreview = useMemo(() => {
    const header = title ? `*${title}*` : '';
    const body = content || '';
    return [header, body].filter(Boolean).join('\n\n');
  }, [title, content]);

  return (
    <Paper shadow="xs" p="md" withBorder radius="md" mb="md">
      <Group mb="md">
        <ThemeIcon color="blue" variant="light" size="lg">
          <MessageCircleIcon size={20} />
        </ThemeIcon>
        <div>
            <Text fw={600} size="sm" c="blue">WhatsApp Configuration</Text>
            <Text size="xs" c="dimmed">Broadcast via Fonnte (no Meta templates)</Text>
        </div>
      </Group>

      {loading ? (
        <Group gap="xs" mb="md">
          <Loader size="xs" />
          <Text size="xs" c="dimmed">Checking WhatsApp connection...</Text>
        </Group>
      ) : error ? (
        <Alert icon={<AlertCircleIcon size={16} />} title="WhatsApp Connection Error" color="red" mb="md">
          {error}
        </Alert>
      ) : connection ? (
        <Box mb="md">
          <Divider mb="md" />
          <Group gap="xs" mb={8}>
            <Avatar size="sm" radius="xl" color="blue">
              {connection.device_name?.[0]?.toUpperCase() || 'W'}
            </Avatar>
            <Box style={{ flex: 1 }}>
              <Text size="sm" fw={600}>+{connection.phone_number || '—'}</Text>
              <Text size="xs" c="dimmed">{connection.device_name}</Text>
            </Box>
            <Badge color="green" size="xs" variant="light" leftSection={<WifiIcon size={11} />}>
              {connection.device_status}
            </Badge>
          </Group>
        </Box>
      ) : null}

      <TextInput
        label="Call-to-Action Link"
        placeholder="https://example.com"
        description="Optional: appended to the message body (plain text link)."
        variant="filled"
        value={data.ctaLink || ''}
        onChange={(e) => onChange({ ...data, ctaLink: e.currentTarget.value })}
        mb="md"
      />

      <Divider mb="md" />

      <Box>
        <Group gap="xs" mb={8}>
          <SendIcon size={13} />
          <Text size="xs" fw={600} c="dimmed" tt="uppercase">Message Preview</Text>
        </Group>
        <Box
          p="md"
          style={{
            border: '1px solid #e9ecef',
            borderRadius: 8,
            background: '#fff',
            fontFamily: 'sans-serif',
            whiteSpace: 'pre-wrap',
          }}
        >
          <Text size="sm" style={{ lineHeight: 1.6 }}>
            {messagePreview || 'Your WhatsApp message preview will appear here...'}
          </Text>
          {data.ctaLink ? (
            <Text size="sm" mt={10} c="blue" style={{ wordBreak: 'break-all' }}>
              {data.ctaLink}
            </Text>
          ) : null}
        </Box>
        {previewMediaUrls.length > 0 ? (
          <Box mt="md">
            <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb={8}>Media Preview</Text>
            <SimpleGrid cols={{ base: 2, sm: 3 }}>
              {previewMediaUrls.map((url, idx) => (
                <Image
                  key={`${url}-${idx}`}
                  src={url}
                  h={110}
                  fit="cover"
                  radius="md"
                  style={{ border: '1px solid #e9ecef' }}
                />
              ))}
            </SimpleGrid>
          </Box>
        ) : null}
      </Box>
    </Paper>
  );
};

export default WhatsappFlow;