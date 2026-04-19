import React, { useEffect, useState } from 'react';
import { Title, Card, Text, Button, List, LoadingOverlay, Badge, Group, Box, Avatar, ThemeIcon, Alert, Stack, Divider } from '@mantine/core';
import { InstagramIcon, PlusIcon, TrashIcon, InfoIcon, CheckCircleIcon } from 'lucide-react';
import PageShell from '../components/Dashboard/PageShell';
import { supabase } from '../supabaseClient';
import { useUserRole } from '../auth/UserContext';
import { useMetaAuth } from '../hooks/useMetaAuth';

interface Integration {
  id: string;
  platform: string;
  provider_account_id: string;
  metadata?: any;
}

const IntegrationsInstagram = () => {
    const { currentOrgId } = useUserRole();
    const { handleConnectFacebook } = useMetaAuth('instagram');
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (currentOrgId) fetchIntegrations();
    }, [currentOrgId]);

    const fetchIntegrations = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('organization_integrations')
            .select('*')
            .eq('organization_id', currentOrgId)
            .ilike('platform', 'instagram%')
            .eq('status', 'active');
        
        if (!error && data) {
            setIntegrations(data as Integration[]);
        }
        setLoading(false);
    };

    const handleDisconnectAll = async () => {
        if (!window.confirm('Are you sure you want to disconnect all Instagram accounts?')) return;
        if (!currentOrgId) return;

        setLoading(true);
        const { data, error } = await supabase.functions.invoke('disconnect-integration', {
            body: {
                organizationId: currentOrgId,
                platformPrefix: 'instagram'
            }
        });

        if (error || data?.error) {
            alert(data?.error || error?.message || 'Failed to disconnect Instagram integration.');
            setLoading(false);
            return;
        }

        await fetchIntegrations();
        setLoading(false);
    };

    return (
        <PageShell>
            <Box pos="relative" maw={800} mx="auto">
                <LoadingOverlay visible={loading} />
                
                <Group gap="xs" align="center" mb={4}>
                    <ThemeIcon color="pink" size="lg" radius="md">
                        <InstagramIcon size={18} />
                    </ThemeIcon>
                    <Title order={2}>Instagram Business</Title>
                    {integrations.length > 0 && (
                        <Badge color="green" variant="light" leftSection={<CheckCircleIcon size={12} />}>
                            Connected
                        </Badge>
                    )}
                </Group>
                <Text c="dimmed" size="sm" mb="xl">
                    Connect Instagram Business accounts for posting workflows and Instagram messaging features.
                </Text>

                <Alert icon={<InfoIcon size={16} />} title="Setup Guide" color="blue" mb="lg">
                    <Stack gap={4}>
                        <Text size="sm"><strong>Step 1:</strong> Click <strong>Connect via Meta</strong>.</Text>
                        <Text size="sm"><strong>Step 2:</strong> Login Facebook and authorize required permissions.</Text>
                        <Text size="sm"><strong>Step 3:</strong> Select the Facebook Page linked to your Instagram Business account.</Text>
                        <Text size="sm"><strong>Step 4:</strong> Confirm the account appears below as connected.</Text>
                    </Stack>
                </Alert>

                <Card shadow="sm" p="xl" radius="md" withBorder>
                    <Stack>
                        {integrations.length > 0 && (
                            <>
                                <Alert color="green" icon={<CheckCircleIcon size={16} />} title="Active Integration">
                                    {integrations.length} Instagram Business account(s) connected and ready.
                                </Alert>
                                <Divider label="Update Configuration" labelPosition="center" />
                            </>
                        )}

                        <List spacing="sm">
                        {integrations.map(integration => (
                            <List.Item key={integration.id} style={{ padding: '16px', background: 'var(--mantine-color-gray-0)', borderRadius: '8px' }} icon={
                                <Avatar color="pink" variant="light" size="md"><InstagramIcon size={20} /></Avatar>
                            }>
                                <Box>
                                    <Group gap="xs">
                                        <Text fw={600} size="lg">{integration.metadata?.name || 'Instagram Business Account'}</Text>
                                    </Group>
                                    {integration.metadata?.facebook_page_name && (
                                        <Text size="xs" c="dimmed">Linked via Facebook Page: {integration.metadata.facebook_page_name}</Text>
                                    )}
                                </Box>
                            </List.Item>
                        ))}
                        
                        {integrations.length === 0 && (
                            <Box ta="center" py="xl">
                                <InstagramIcon size={48} color="var(--mantine-color-gray-4)" strokeWidth={1} style={{ margin: '0 auto', marginBottom: 12 }} />
                                <Text size="sm" c="dimmed" fs="italic">No Instagram Business accounts connected yet.</Text>
                            </Box>
                        )}
                        </List>

                        <Group justify="space-between" mt="sm">
                            {integrations.length > 0 ? (
                                <Button
                                    variant="subtle"
                                    color="red"
                                    leftSection={<TrashIcon size={14} />}
                                    onClick={handleDisconnectAll}
                                >
                                    Disconnect
                                </Button>
                            ) : <Box />}
                            <Button
                                leftSection={<PlusIcon size={16} />}
                                variant="gradient"
                                gradient={{ from: 'pink', to: 'orange' }}
                                onClick={handleConnectFacebook}
                            >
                                {integrations.length > 0 ? 'Connect Another Account' : 'Connect via Meta'}
                            </Button>
                        </Group>
                    </Stack>
                </Card>
            </Box>
        </PageShell>
    );
};

export default IntegrationsInstagram;
