import React, { useState, useEffect } from 'react';
import {
  Title, Card, Text, Button, Box, PasswordInput,
  Group, Stack, Alert, Badge, Divider, ThemeIcon, Paper, Anchor, List
} from '@mantine/core';
import {
  MessageCircleIcon, KeyIcon, CheckCircleIcon, Trash2Icon,
  RefreshCwIcon, PhoneIcon, AlertCircleIcon, ExternalLinkIcon, WifiIcon
} from 'lucide-react';
import PageShell from '../components/Dashboard/PageShell';
import { supabase } from '../supabaseClient';
import { useUserRole } from '../auth/UserContext';
import { useNotification } from '../context/NotificationContext';

interface DeviceInfo {
  name: string;
  phone: string;
  status: string;
  battery?: string;
}

interface ConnectedInfo {
  fonnte_token: string;
  phone_number: string;
  device_name: string;
  device_status: string;
}

const IntegrationsWhatsApp = () => {
  const { currentOrgId } = useUserRole();
  const notify = useNotification();

  const [step, setStep] = useState<'credentials' | 'connected'>('credentials');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState('');
  const [connectedInfo, setConnectedInfo] = useState<ConnectedInfo | null>(null);

  // Load existing integration
  useEffect(() => {
    const fetchStatus = async () => {
      if (!currentOrgId) return;
      const { data, error } = await supabase
        .from('organization_integrations')
        .select('*')
        .eq('organization_id', currentOrgId)
        .eq('platform', 'whatsapp')
        .order('connected_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        // If multiple rows exist (or none), don't break the page — just treat as disconnected.
        console.warn('Failed to load WhatsApp integration:', error.message);
        return;
      }

      if (data) {
        setConnectedInfo({
          fonnte_token: data.access_token,
          phone_number: data.provider_account_id,
          device_name: data.metadata?.device_name || 'WhatsApp Device',
          device_status: data.metadata?.device_status || 'connected',
        });
        setStep('connected');
      }
    };
    fetchStatus();
  }, [currentOrgId]);

  // Validate token by calling Fonnte /device endpoint
  const handleConnect = async () => {
    if (!token.trim()) {
      notify.error('Missing Token', 'Please enter your Fonnte API token.');
      return;
    }

    setLoading(true);
    try {
      // Fonnte returns non-JSON bodies for some errors (e.g. "Method Not Allowed"),
      // so parse defensively.
      const res = await fetch('https://api.fonnte.com/device', {
        method: 'POST',
        headers: {
          Authorization: token.trim(),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({}).toString(),
      });

      const raw = await res.text();
      let data: any;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        throw new Error(`Fonnte Error: ${raw || `HTTP ${res.status}`}`);
      }

      if (!data.status) {
        throw new Error(data.message || 'Invalid Fonnte token. Please check and try again.');
      }

      // Fonnte may return a device object or an array depending on account/device setup.
      const device: DeviceInfo =
        (Array.isArray(data.device) ? data.device[0] : data.device) ||
        (Array.isArray(data.data) ? data.data[0] : data.data) ||
        {};

      // Save to database
      const cleanPhone = (device.phone || '').replace(/\D/g, '');
      const { error: dbError } = await supabase
        .from('organization_integrations')
        .upsert({
          organization_id: currentOrgId,
          platform: 'whatsapp',
          provider_account_id: cleanPhone,
          access_token: token.trim(),
          metadata: {
            provider: 'fonnte',
            device_name: device.name || 'My Device',
            device_status: device.status || 'connected',
            battery: device.battery || null,
          }
        }, { onConflict: 'organization_id, platform, provider_account_id' });

      if (dbError) throw dbError;

      setConnectedInfo({
        fonnte_token: token.trim(),
        phone_number: cleanPhone,
        device_name: device.name || 'My Device',
        device_status: device.status || 'connected',
      });
      setStep('connected');
      notify.success('Connected! 🎉', `WhatsApp ${device.phone} is now linked via Fonnte.`);
    } catch (error: any) {
      notify.error('Connection Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Disconnect WhatsApp? Campaign messages and inbox will stop working.')) return;
    setLoading(true);
    await supabase
      .from('organization_integrations')
      .delete()
      .eq('organization_id', currentOrgId)
      .eq('platform', 'whatsapp');

    setConnectedInfo(null);
    setToken('');
    setStep('credentials');
    setLoading(false);
    notify.success('Disconnected', 'WhatsApp Fonnte integration has been removed.');
  };

  const statusColor: Record<string, string> = {
    connect: 'teal', connected: 'teal', disconnect: 'red', disconnected: 'red'
  };

  return (
    <PageShell>
      <Box maw={800} mx="auto">
        {/* Header */}
        <Group gap="xs" align="center" mb={4}>
          <ThemeIcon color="green" size="lg" radius="md">
            <MessageCircleIcon size={18} />
          </ThemeIcon>
          <Title order={2}>WhatsApp Business</Title>
          {step === 'connected' && (
            <Badge color="green" variant="light" leftSection={<CheckCircleIcon size={12} />}>
              Connected
            </Badge>
          )}
        </Group>
        <Text c="dimmed" size="sm" mb="xl">Powered by <strong>Fonnte</strong> — connect your WA Business number directly.</Text>

        <Alert color="blue" variant="light" icon={<AlertCircleIcon size={14} />} mb="lg" title="Setup Guide">
          <Stack gap={6}>
            <Text size="xs">
              <strong>Step 1:</strong> Register/login at{' '}
              <Anchor href="https://fonnte.com" target="_blank" size="xs">fonnte.com <ExternalLinkIcon size={10} /></Anchor>{' '}
              and connect your device by scanning the QR code.
            </Text>
            <Text size="xs">
              <strong>Step 2:</strong> Copy the device API token from <strong>Device Settings</strong>, then paste it here and click <strong>Connect WhatsApp</strong>.
            </Text>
            <Text size="xs">
              <strong>Step 3:</strong> Configure inbound webhook in Fonnte using this URL:
            </Text>
            <Text size="xs" ff="monospace" style={{ wordBreak: 'break-all' }}>
              {`${import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'}/functions/v1/whatsapp-webhook`}
            </Text>
            <Text size="xs">
              <strong>Step 4:</strong> Broadcast flow in this app: Campaign Manager inserts rows into <code>whatsapp_outbox</code> and the <code>send-whatsapp</code> function dispatches to Fonnte.
            </Text>
            <Divider my={4} />
            <Text size="xs" fw={600}>Troubleshooting Checklist</Text>
            <List size="xs" spacing={4}>
              <List.Item>Make sure the connected device status is <strong>connected</strong> in Fonnte.</List.Item>
              <List.Item>Use phone format with country code (example: <code>62812xxxxxxx</code>).</List.Item>
              <List.Item>If status is stuck at <code>scheduling</code>, verify database webhook for <code>whatsapp_outbox</code> is active.</List.Item>
              <List.Item>If broadcasts fail, check <code>whatsapp_outbox.response_data</code> for exact provider error.</List.Item>
              <List.Item>Media sending may require additional Fonnte plan/add-on configuration.</List.Item>
            </List>
          </Stack>
        </Alert>

        {/* ─── CONNECTED VIEW ─── */}
        {step === 'connected' && connectedInfo && (
          <Card shadow="sm" p="xl" radius="md" withBorder>
            <Stack gap="md">
              <Alert color="green" icon={<CheckCircleIcon size={16} />} title="Active Connection">
                Your WhatsApp Business number is linked via Fonnte and ready for campaigns and inbox.
              </Alert>
              <Divider label="Update Configuration" labelPosition="center" />

              <Paper p="md" radius="md" withBorder>
                <Group gap="md">
                  <ThemeIcon color="green" variant="light" size="xl" radius="xl">
                    <PhoneIcon size={20} />
                  </ThemeIcon>
                  <Box style={{ flex: 1 }}>
                    <Text fw={700} size="lg">+{connectedInfo.phone_number}</Text>
                    <Text size="sm" c="dimmed">{connectedInfo.device_name}</Text>
                  </Box>
                  <Badge
                    color={statusColor[connectedInfo.device_status] || 'gray'}
                    variant="light"
                    leftSection={<WifiIcon size={11} />}
                  >
                    {connectedInfo.device_status}
                  </Badge>
                </Group>
              </Paper>

              <Divider />

              <Box p="sm" style={{ background: '#f8f9fa', borderRadius: 8 }}>
                <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb={6}>Webhook URL for Fonnte</Text>
                <Text size="xs" ff="monospace" style={{ wordBreak: 'break-all' }}>
                  {`${import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'}/functions/v1/whatsapp-webhook`}
                </Text>
                <Text size="xs" c="dimmed" mt={4}>
                  Set this as the webhook URL in your Fonnte device settings to receive incoming messages.
                </Text>
              </Box>

              <Group justify="space-between" mt="sm">
                <Button
                  variant="subtle"
                  color="red"
                  leftSection={<Trash2Icon size={14} />}
                  onClick={handleDisconnect}
                  loading={loading}
                >
                  Disconnect
                </Button>
                <Button
                  variant="filled"
                  color="dark"
                  leftSection={<RefreshCwIcon size={14} />}
                  onClick={() => { setStep('credentials'); setToken(''); setConnectedInfo(null); }}
                >
                  Update Configuration
                </Button>
              </Group>
            </Stack>
          </Card>
        )}

        {/* ─── CREDENTIALS FORM ─── */}
        {step === 'credentials' && (
          <Card shadow="sm" p="xl" radius="md" withBorder>
            <Group gap="xs" mb="md">
              <ThemeIcon color="green" variant="light" size="sm" radius="xl">
                <KeyIcon size={12} />
              </ThemeIcon>
              <Text fw={600}>Connect with Fonnte Token</Text>
            </Group>

            <Alert color="blue" variant="light" icon={<AlertCircleIcon size={14} />} mb="lg">
              <Stack gap={4}>
                <Text size="xs">
                  <strong>Step 1:</strong> Register at{' '}
                  <Anchor href="https://fonnte.com" target="_blank" size="xs">fonnte.com <ExternalLinkIcon size={10} /></Anchor>
                </Text>
                <Text size="xs">
                  <strong>Step 2:</strong> Add your WhatsApp Business number → scan QR code to connect device
                </Text>
                <Text size="xs">
                  <strong>Step 3:</strong> Go to <strong>Device Settings</strong> → copy your <strong>API Token</strong>
                </Text>
                <Text size="xs">
                  <strong>Step 4:</strong> Paste it below and click Connect
                </Text>
              </Stack>
            </Alert>

            <Stack gap="md">
              <PasswordInput
                label="Fonnte API Token"
                placeholder="Paste your Fonnte device token here..."
                description="Found in your Fonnte dashboard → Device → API Token"
                value={token}
                onChange={(e) => setToken(e.currentTarget.value)}
                required
              />
              <Button
                fullWidth
                color="green"
                size="md"
                leftSection={<MessageCircleIcon size={16} />}
                onClick={handleConnect}
                loading={loading}
              >
                {loading ? 'Verifying & Connecting...' : 'Connect WhatsApp'}
              </Button>
            </Stack>
          </Card>
        )}
      </Box>
    </PageShell>
  );
};

export default IntegrationsWhatsApp;
