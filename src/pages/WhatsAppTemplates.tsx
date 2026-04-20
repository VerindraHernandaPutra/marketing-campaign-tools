import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Text, Button, Box, Group, Stack, Alert, Badge,
  Loader, Center, TextInput, Divider, Paper, ActionIcon,
  ThemeIcon
} from '@mantine/core';
import PageHeader from '../components/Dashboard/PageHeader';
import {
  MessageSquareIcon, RefreshCwIcon, SearchIcon, CheckCircleIcon,
  XCircleIcon, ClockIcon, AlertCircleIcon, ChevronDownIcon, ChevronUpIcon
} from 'lucide-react';
import PageShell from '../components/Dashboard/PageShell';
import { supabase } from '../supabaseClient';
import { useUserRole } from '../auth/UserContext';
import { useNotification } from '../context/NotificationContext';

interface WaTemplate {
  id: string;
  name: string;
  status: 'APPROVED' | 'REJECTED' | 'PENDING' | 'PAUSED' | 'DISABLED';
  category: string;
  language: string;
  components: Array<{
    type: string;
    text?: string;
    format?: string;
    buttons?: Array<{ type: string; text: string; url?: string; phone_number?: string }>;
  }>;
}

const statusColor: Record<string, string> = {
  APPROVED: 'green',
  REJECTED: 'red',
  PENDING: 'yellow',
  PAUSED: 'orange',
  DISABLED: 'gray',
};

const StatusIcon = ({ status }: { status: string }) => {
  if (status === 'APPROVED') return <CheckCircleIcon size={14} />;
  if (status === 'REJECTED') return <XCircleIcon size={14} />;
  if (status === 'PENDING') return <ClockIcon size={14} />;
  return <AlertCircleIcon size={14} />;
};

const TemplateCard = ({ template }: { template: WaTemplate }) => {
  const [expanded, setExpanded] = useState(false);

  const bodyComponent = template.components.find(c => c.type === 'BODY');
  const headerComponent = template.components.find(c => c.type === 'HEADER');
  const footerComponent = template.components.find(c => c.type === 'FOOTER');
  const buttonsComponent = template.components.find(c => c.type === 'BUTTONS');

  return (
    <Card withBorder radius="md" p="md" style={{ borderLeft: `3px solid var(--mantine-color-${statusColor[template.status] || 'gray'}-5)` }}>
      <Group justify="space-between" mb={4}>
        <Group gap="xs">
          <ThemeIcon size="sm" variant="light" color="green" radius="sm">
            <MessageSquareIcon size={12} />
          </ThemeIcon>
          <Text fw={600} size="sm" style={{ fontFamily: 'monospace' }}>{template.name}</Text>
        </Group>
        <Group gap="xs">
          <Badge size="xs" variant="light" color="gray">{template.language}</Badge>
          <Badge size="xs" variant="light" color="blue">{template.category}</Badge>
          <Badge
            size="xs"
            variant="light"
            color={statusColor[template.status] || 'gray'}
            leftSection={<StatusIcon status={template.status} />}
          >
            {template.status}
          </Badge>
          <ActionIcon size="xs" variant="subtle" onClick={() => setExpanded(p => !p)}>
            {expanded ? <ChevronUpIcon size={12} /> : <ChevronDownIcon size={12} />}
          </ActionIcon>
        </Group>
      </Group>

      {bodyComponent?.text && (
        <Text size="xs" c="dimmed" lineClamp={expanded ? undefined : 2} style={{ whiteSpace: 'pre-wrap' }}>
          {bodyComponent.text}
        </Text>
      )}

      {expanded && (
        <Box mt="sm">
          {headerComponent && (
            <Box mb="xs">
              <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb={2}>Header</Text>
              {headerComponent.format === 'TEXT' && headerComponent.text ? (
                <Text size="xs">{headerComponent.text}</Text>
              ) : (
                <Badge size="xs" variant="outline" color="gray">{headerComponent.format} media</Badge>
              )}
            </Box>
          )}
          {footerComponent?.text && (
            <Box mb="xs">
              <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb={2}>Footer</Text>
              <Text size="xs" c="dimmed">{footerComponent.text}</Text>
            </Box>
          )}
          {buttonsComponent?.buttons && buttonsComponent.buttons.length > 0 && (
            <Box>
              <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb={4}>Buttons</Text>
              <Group gap="xs">
                {buttonsComponent.buttons.map((btn, i) => (
                  <Badge key={i} size="xs" variant="outline" color="blue">
                    {btn.type}: {btn.text}
                  </Badge>
                ))}
              </Group>
            </Box>
          )}
        </Box>
      )}
    </Card>
  );
};

const WhatsAppTemplates: React.FC = () => {
  const { currentOrgId } = useUserRole();
  const notify = useNotification();
  const [templates, setTemplates] = useState<WaTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [integration, setIntegration] = useState<unknown>(null);
  const [hasIntegration, setHasIntegration] = useState<boolean | null>(null);

  const fetchIntegration = useCallback(async () => {
    if (!currentOrgId) return null;
    const { data } = await supabase
      .from('organization_integrations')
      .select('*')
      .eq('organization_id', currentOrgId)
      .eq('platform', 'whatsapp')
      .single();
    setHasIntegration(!!data);
    setIntegration(data);
    return data;
  }, [currentOrgId]);

  const syncTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const intData = integration || (await fetchIntegration());
      if (!intData) throw new Error('WhatsApp not connected. Please connect it first in Integrations.');

      const wabaId = intData.metadata?.waba_id;
      const token = intData.access_token;

      if (!wabaId || !token) throw new Error('Missing WABA ID or Access Token in integration settings.');

      const res = await fetch(
        `https://graph.facebook.com/v19.0/${wabaId}/message_templates?fields=id,name,status,category,language,components&limit=100`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const json = await res.json();
      if (json.error) throw new Error(json.error.message);

      setTemplates(json.data || []);
      notify.success('Synced!', `Loaded ${(json.data || []).length} templates from Meta.`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to sync templates.';
      notify.error('Sync Failed', message);
    } finally {
      setLoading(false);
    }
  }, [integration, fetchIntegration, notify]);

  useEffect(() => {
    if (currentOrgId) {
      fetchIntegration();
    }
  }, [currentOrgId, fetchIntegration]);

  const filtered = templates.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const approved = filtered.filter(t => t.status === 'APPROVED');
  const pending = filtered.filter(t => t.status === 'PENDING');
  const rejected = filtered.filter(t => t.status === 'REJECTED' || t.status === 'PAUSED' || t.status === 'DISABLED');

  return (
    <PageShell>
        <PageHeader
          icon={<MessageSquareIcon size={22} />}
          title="WhatsApp Templates"
          subtitle="View and sync your approved Meta message templates for WhatsApp campaigns."
          gradient={{ from: 'green', to: 'teal' }}
          action={
            <Button
              leftSection={<RefreshCwIcon size={14} />}
              variant="gradient"
              gradient={{ from: 'green', to: 'teal' }}
              onClick={syncTemplates}
              loading={loading}
              disabled={hasIntegration === false}
            >
              Sync from Meta
            </Button>
          }
        />

        {hasIntegration === false && (
          <Alert color="orange" title="WhatsApp Not Connected" mb="lg" icon={<AlertCircleIcon size={16} />}>
            Please go to <strong>Platform → WhatsApp</strong> integration settings and save your Phone Number ID, WABA ID, and Access Token first!
          </Alert>
        )}

        {hasIntegration && templates.length === 0 && !loading && (
          <Alert color="blue" title="How to use templates" mb="lg" icon={<AlertCircleIcon size={16} />}>
            <Text size="sm">Create and manage templates directly in{' '}
              <a href="https://business.facebook.com/wa/manage/message-templates/" target="_blank" rel="noreferrer">
                Meta Business Manager → WhatsApp Manager → Message Templates
              </a>.
              Once created, click <strong>Sync from Meta</strong> above to load them here!
            </Text>
          </Alert>
        )}

        {templates.length > 0 && (
          <TextInput
            placeholder="Search by name, status, or category..."
            leftSection={<SearchIcon size={14} />}
            value={searchQuery}
            onChange={e => setSearchQuery(e.currentTarget.value)}
            mb="lg"
          />
        )}

        {loading && (
          <Center py="xl">
            <Stack align="center" gap="sm">
              <Loader color="green" />
              <Text size="sm" c="dimmed">Fetching templates from Meta...</Text>
            </Stack>
          </Center>
        )}

        {!loading && templates.length > 0 && (
          <Group mb="lg" grow>
            <Paper withBorder p="sm" radius="md" style={{ borderTop: '3px solid var(--mantine-color-green-5)' }}>
              <Text size="xl" fw={700} c="green">{templates.filter(t => t.status === 'APPROVED').length}</Text>
              <Text size="xs" c="dimmed">Approved</Text>
            </Paper>
            <Paper withBorder p="sm" radius="md" style={{ borderTop: '3px solid var(--mantine-color-yellow-5)' }}>
              <Text size="xl" fw={700} c="yellow">{templates.filter(t => t.status === 'PENDING').length}</Text>
              <Text size="xs" c="dimmed">Pending Review</Text>
            </Paper>
            <Paper withBorder p="sm" radius="md" style={{ borderTop: '3px solid var(--mantine-color-red-5)' }}>
              <Text size="xl" fw={700} c="red">{templates.filter(t => t.status === 'REJECTED').length}</Text>
              <Text size="xs" c="dimmed">Rejected</Text>
            </Paper>
            <Paper withBorder p="sm" radius="md" style={{ borderTop: '3px solid var(--mantine-color-blue-5)' }}>
              <Text size="xl" fw={700} c="blue">{templates.length}</Text>
              <Text size="xs" c="dimmed">Total</Text>
            </Paper>
          </Group>
        )}

        {!loading && filtered.length > 0 && (
          <Stack gap="lg">
            {approved.length > 0 && (
              <Box>
                <Group mb="sm" gap="xs">
                  <CheckCircleIcon size={14} color="var(--mantine-color-green-6)" />
                  <Text fw={600} size="sm" c="green">Approved ({approved.length})</Text>
                </Group>
                <Stack gap="sm">
                  {approved.map(t => <TemplateCard key={t.id} template={t} />)}
                </Stack>
              </Box>
            )}
            {pending.length > 0 && (
              <Box>
                <Divider mb="sm" />
                <Group mb="sm" gap="xs">
                  <ClockIcon size={14} color="var(--mantine-color-yellow-6)" />
                  <Text fw={600} size="sm" c="yellow">Pending Review ({pending.length})</Text>
                </Group>
                <Stack gap="sm">
                  {pending.map(t => <TemplateCard key={t.id} template={t} />)}
                </Stack>
              </Box>
            )}
            {rejected.length > 0 && (
              <Box>
                <Divider mb="sm" />
                <Group mb="sm" gap="xs">
                  <XCircleIcon size={14} color="var(--mantine-color-red-6)" />
                  <Text fw={600} size="sm" c="red">Rejected / Disabled ({rejected.length})</Text>
                </Group>
                <Stack gap="sm">
                  {rejected.map(t => <TemplateCard key={t.id} template={t} />)}
                </Stack>
              </Box>
            )}
          </Stack>
        )}

        {!loading && templates.length > 0 && filtered.length === 0 && (
          <Center py="xl">
            <Text c="dimmed">No templates match your search.</Text>
          </Center>
        )}
    </PageShell>
  );
};

export default WhatsAppTemplates;
