import React, { useState, useEffect } from 'react';
import {
  Title, Card, Text, Button, Box, PasswordInput, TextInput,
  Group, Stack, Alert, Badge, Divider, ThemeIcon
} from '@mantine/core';
import { MailIcon, SaveIcon, InfoIcon, CheckCircleIcon, Trash2Icon, AlertCircleIcon } from 'lucide-react';
import PageShell from '../components/Dashboard/PageShell';
import { useNotification } from '../context/NotificationContext';
import { supabase } from '../supabaseClient';
import { useUserRole } from '../auth/UserContext';

const IntegrationsResend = () => {
  const notify = useNotification();
  const { currentOrgId } = useUserRole();
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Form fields
  const [apiKey, setApiKey] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [fromName, setFromName] = useState('');

  // Load existing config from DB
  useEffect(() => {
    const fetchExisting = async () => {
      if (!currentOrgId) return;
      const { data } = await supabase
        .from('organization_integrations')
        .select('*')
        .eq('organization_id', currentOrgId)
        .eq('platform', 'resend')
        .order('connected_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setIsConnected(true);
        setApiKey('••••••••••••••••••••••••••••••••');
        setFromEmail(data.metadata?.from_email || '');
        setFromName(data.metadata?.from_name || '');
      }
    };
    fetchExisting();
  }, [currentOrgId]);

  const handleSave = async () => {
    if (!apiKey || !fromEmail || !fromName) {
      notify.error('Missing Fields', 'Please fill in all required fields.');
      return;
    }
    if (apiKey.startsWith('••')) {
      notify.error('No Change', 'Please enter a new API key to update.');
      return;
    }

    setLoading(true);
    try {
      // Save to organization_integrations
      const { error: dbError } = await supabase
        .from('organization_integrations')
        .upsert({
          organization_id: currentOrgId,
          platform: 'resend',
          provider_account_id: fromEmail,
          access_token: apiKey,
          metadata: {
            from_email: fromEmail,
            from_name: fromName,
          }
        }, { onConflict: 'organization_id, platform, provider_account_id' });

      if (dbError) throw dbError;

      notify.success('Saved!', 'Resend configuration saved. Send a test email to verify your API key!');
      setIsConnected(true);
    } catch (error: any) {
      notify.error('Error', error.message || 'Failed to save configuration.');
    } finally {
      setLoading(false);
    }
  };


  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to remove the Resend integration?')) return;
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('disconnect-integration', {
      body: { organizationId: currentOrgId, platformPrefix: 'resend' },
    });
    if (error || data?.error) {
      notify.error('Disconnect Failed', data?.error || error?.message || 'Could not disconnect.');
      setLoading(false);
      return;
    }
    setIsConnected(false);
    setApiKey('');
    setFromEmail('');
    setFromName('');
    setLoading(false);
    notify.success('Disconnected', 'Resend integration has been removed.');
  };

  return (
    <PageShell>
      <Box maw={800} mx="auto">
        {/* Header */}
        <Box mb="xl">
          <Group gap="xs" align="center" mb={4}>
            <ThemeIcon color="dark" size="lg" radius="md">
              <MailIcon size={18} />
            </ThemeIcon>
            <Title order={2}>Resend Email API</Title>
            {isConnected && (
              <Badge color="green" variant="light" leftSection={<CheckCircleIcon size={12} />}>
                Connected
              </Badge>
            )}
          </Group>
          <Text c="dimmed" size="sm">
            Connect your Resend account to send beautifully crafted marketing emails directly from your own domain.
          </Text>
        </Box>

        {/* Setup Guide */}
        <Alert icon={<InfoIcon size={16} />} title="Setup Guide" color="blue" mb="lg">
          <Stack gap={4}>
            <Text size="sm"><strong>Step 1:</strong> Create an account at{' '}
              <a href="https://resend.com" target="_blank" rel="noreferrer">resend.com</a>
            </Text>
            <Text size="sm"><strong>Step 2:</strong> Go to <strong>Domains</strong> and add & verify your sending domain.</Text>
            <Text size="sm"><strong>Step 3:</strong> Go to <strong>API Keys</strong> and create a new key with <em>Sending Access</em>.</Text>
            <Text size="sm"><strong>Step 4:</strong> Paste it below along with your verified sender email!</Text>
          </Stack>
        </Alert>

        {/* Config Card */}
        <Card shadow="sm" p="xl" radius="md" withBorder>
          <Stack>
            {isConnected && (
              <>
                <Alert color="green" icon={<CheckCircleIcon size={16} />} title="Active Integration">
                  Your Resend API is connected. Campaigns with Email channel will use the settings below.
                </Alert>
                <Divider label="Update Configuration" labelPosition="center" />
              </>
            )}

            <TextInput
              label="Sender Name"
              placeholder="Marketing VHP"
              value={fromName}
              onChange={(e) => setFromName(e.currentTarget.value)}
              description="The display name your recipients will see."
              required
            />

            <TextInput
              label="Sender Email Address"
              placeholder="hello@yourdomain.com"
              value={fromEmail}
              onChange={(e) => setFromEmail(e.currentTarget.value)}
              description="Must be a verified domain in your Resend account."
              required
            />

            <PasswordInput
              label="Resend API Key"
              placeholder="re_..."
              value={apiKey}
              onChange={(e) => setApiKey(e.currentTarget.value)}
              description="Create a restricted API key with Sending permissions only."
              required
            />

            <Group justify="space-between" mt="md">
              {isConnected && (
                <Button
                  variant="subtle"
                  color="red"
                  leftSection={<Trash2Icon size={14} />}
                  onClick={handleDisconnect}
                  loading={loading}
                >
                  Disconnect
                </Button>
              )}
              <Button
                variant="filled"
                color="dark"
                leftSection={<SaveIcon size={16} />}
                onClick={handleSave}
                loading={loading}
                ml="auto"
              >
                {isConnected ? 'Update Configuration' : 'Save & Connect'}
              </Button>
            </Group>
          </Stack>
        </Card>

        {/* Domain reminder */}
        {!isConnected && (
          <Alert icon={<AlertCircleIcon size={16} />} color="orange" mt="lg" title="Domain Required">
            Resend only allows sending from addresses on a verified domain. During testing you can use{' '}
            <code>onboarding@resend.dev</code> as your From address (Resend's shared test domain).
          </Alert>
        )}
      </Box>
    </PageShell>
  );
};

export default IntegrationsResend;
