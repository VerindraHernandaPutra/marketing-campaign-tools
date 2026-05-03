import React, { useState, useEffect, useMemo } from 'react';
import { Paper, Text, TextInput, Group, ThemeIcon, Alert, Loader, Box, Divider, Badge, Avatar, SimpleGrid, Image, Select } from '@mantine/core';
import { MessageCircleIcon, AlertCircleIcon, WifiIcon, SendIcon, FileTextIcon } from 'lucide-react';
import { supabase } from '../../../supabaseClient';
import { useUserRole } from '../../../auth/UserContext';

interface WhatsappData {
  ctaLink?: string;
  template_name?: string;
  template_language?: string;
  template_param_count?: number;
  [key: string]: unknown;
}

interface WhatsappFlowProps {
  data: WhatsappData;
  onChange: (data: WhatsappData) => void;
  title?: string;
  content?: string;
  previewMediaUrls?: string[];
}

type ConnectionInfo = {
  phone_number: string;
  device_name: string;
  device_status: string;
  waba_id?: string;
  access_token?: string;
};

type WaTemplate = {
  id: string;
  name: string;
  status: string;
  language: string;
  category: string;
  components: { type: string; text?: string }[];
};

// Count {{n}} placeholders in a template's BODY component
function countParams(components: WaTemplate['components']): number {
  const body = components.find(c => c.type === 'BODY');
  if (!body?.text) return 0;
  const matches = body.text.match(/\{\{\d+\}\}/g);
  return matches ? new Set(matches).size : 0;
}

const WhatsappFlow: React.FC<WhatsappFlowProps> = ({ data, onChange, title = '', content = '', previewMediaUrls = [] }) => {
  const { currentOrgId } = useUserRole();
  const [connection, setConnection] = useState<ConnectionInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<WaTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);

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

        if (integError || !integData) throw new Error('WhatsApp not connected. Go to Integrations → WhatsApp.');

        const cleanPhone = String(integData.provider_account_id || '').replace(/\D/g, '');
        setConnection({
          phone_number: cleanPhone,
          device_name: integData.metadata?.device_name || 'My Device',
          device_status: integData.metadata?.device_status || 'connected',
          waba_id: integData.metadata?.waba_id,
          access_token: integData.access_token,
        });
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchConnection();
  }, [currentOrgId]);

  // Fetch approved templates from Meta once we have credentials
  useEffect(() => {
    if (!connection?.waba_id || !connection?.access_token) return;
    const fetchTemplates = async () => {
      setTemplatesLoading(true);
      try {
        const res = await fetch(
          `https://graph.facebook.com/v19.0/${connection.waba_id}/message_templates?fields=id,name,status,category,language,components&limit=100&status=APPROVED`,
          { headers: { Authorization: `Bearer ${connection.access_token}` } }
        );
        const json = await res.json();
        if (json.error) throw new Error(json.error.message);
        setTemplates((json.data || []).filter((t: WaTemplate) => t.status === 'APPROVED'));
      } catch {
        // Non-fatal — user can still proceed but will see no template options
      } finally {
        setTemplatesLoading(false);
      }
    };
    fetchTemplates();
  }, [connection?.waba_id, connection?.access_token]);

  const templateOptions = templates.map(t => ({
    value: t.name,
    label: `${t.name} (${t.language})`,
    language: t.language,
    param_count: countParams(t.components),
  }));

  const selectedTemplate = templates.find(t => t.name === data.template_name);
  const selectedBody = selectedTemplate?.components.find(c => c.type === 'BODY')?.text || '';

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
          <Text size="xs" c="dimmed">Broadcast via Meta WhatsApp Cloud API</Text>
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

      {/* Template selector — REQUIRED for outbound broadcast via Meta Cloud API */}
      <Alert icon={<FileTextIcon size={14} />} color="orange" variant="light" mb="md" title="Template Required">
        Meta's WhatsApp Cloud API requires an approved template for outbound broadcasts.
        Select one of your approved templates below.
      </Alert>

      {templatesLoading ? (
        <Group gap="xs" mb="md">
          <Loader size="xs" />
          <Text size="xs" c="dimmed">Loading approved templates...</Text>
        </Group>
      ) : (
        <Select
          label="Message Template"
          placeholder="Select an approved WhatsApp template"
          description="The campaign content will be passed as the template body parameter."
          required
          mb="md"
          leftSection={<FileTextIcon size={14} />}
          data={templateOptions}
          value={data.template_name || null}
          onChange={(val) => {
            const opt = templateOptions.find(o => o.value === val);
            onChange({
              ...data,
              template_name: val || undefined,
              template_language: opt?.language,
              template_param_count: opt?.param_count,
            });
          }}
          nothingFoundMessage={
            connection?.waba_id
              ? 'No approved templates found. Create one in Meta Business Manager.'
              : 'Connect WhatsApp first to load templates.'
          }
        />
      )}

      {selectedBody && (
        <Box mb="md" p="sm" style={{ background: 'var(--mantine-color-gray-0)', borderRadius: 8, border: '1px solid var(--mantine-color-gray-3)' }}>
          <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb={4}>Template Body</Text>
          <Text size="sm" style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{selectedBody}</Text>
        </Box>
      )}

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
          <Text size="xs" fw={600} c="dimmed" tt="uppercase">Campaign Content Preview</Text>
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
            {messagePreview || 'Your campaign content will appear here...'}
          </Text>
          {data.ctaLink ? (
            <Text size="sm" mt={10} c="blue" style={{ wordBreak: 'break-all' }}>
              {data.ctaLink}
            </Text>
          ) : null}
        </Box>
        {previewMediaUrls.length > 0 && (
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
        )}
      </Box>
    </Paper>
  );
};

export default WhatsappFlow;
