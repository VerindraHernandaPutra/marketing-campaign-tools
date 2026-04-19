import React, { useEffect, useState } from 'react';
import {
  Title, Card, Text, Button, List, LoadingOverlay, Badge, Group, Box, Avatar, Modal, ThemeIcon, Paper, Flex,
  Alert, Divider, Stack
} from '@mantine/core';
import { MessagesSquareIcon, PlusIcon, TrashIcon, CheckCircle2Icon, ShieldCheckIcon, InfoIcon, CheckCircleIcon } from 'lucide-react';
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

const IntegrationsMessenger = () => {
    const { currentOrgId } = useUserRole();
    const { handleConnectFacebook } = useMetaAuth('messenger');
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [loading, setLoading] = useState(false);
    const [connectModalOpen, setConnectModalOpen] = useState(false);

    useEffect(() => {
        if (currentOrgId) fetchIntegrations();
    }, [currentOrgId]);

    const fetchIntegrations = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('organization_integrations')
            .select('*')
            .eq('organization_id', currentOrgId)
            .ilike('platform', 'facebook%');
        
        if (!error && data) {
            setIntegrations(data as Integration[]);
        }
        setLoading(false);
    };

    const handleDisconnectAll = async () => {
        if (!window.confirm('Are you sure you want to disconnect all Facebook Pages?')) return;
        const { data, error } = await supabase.functions.invoke('disconnect-integration', {
            body: { organizationId: currentOrgId, platformPrefix: 'facebook' },
        });
        if (error || data?.error) {
            alert(data?.error || error?.message || 'Failed to disconnect Facebook integration.');
            return;
        }
        setIntegrations([]);
    };

    return (
        <PageShell>
            <Box pos="relative" maw={800} mx="auto">
                <LoadingOverlay visible={loading} />
                
                <Group gap="xs" align="center" mb={4}>
                    <ThemeIcon color="blue" size="lg" radius="md">
                        <MessagesSquareIcon size={18} />
                    </ThemeIcon>
                    <Title order={2}>Messenger (Facebook Pages)</Title>
                    {integrations.length > 0 && (
                        <Badge color="green" variant="light" leftSection={<CheckCircleIcon size={12} />}>
                            Connected
                        </Badge>
                    )}
                </Group>
                <Text c="dimmed" size="sm" mb="xl">
                    Connect Facebook Pages to handle Messenger DMs and manage page-side messaging workflows.
                </Text>

                <Alert icon={<InfoIcon size={16} />} title="Setup Guide" color="blue" mb="lg">
                    <Stack gap={4}>
                        <Text size="sm"><strong>Step 1:</strong> Click <strong>Connect via Meta</strong> below.</Text>
                        <Text size="sm"><strong>Step 2:</strong> Login to Facebook and grant required Page permissions.</Text>
                        <Text size="sm"><strong>Step 3:</strong> Select pages you want to connect.</Text>
                        <Text size="sm"><strong>Step 4:</strong> Return here and verify connected pages in the list.</Text>
                    </Stack>
                </Alert>

                {/* Facebook Consent Modal */}
                <Modal 
                    opened={connectModalOpen} 
                    onClose={() => setConnectModalOpen(false)} 
                    title={
                        <Group gap="sm">
                            <ThemeIcon size="lg" radius="xl" color="blue">
                                <MessagesSquareIcon size={20} />
                            </ThemeIcon>
                            <Title order={4}>Hubungkan Facebook Page</Title>
                        </Group>
                    }
                    size="xl"
                    centered
                >
                    <Text mb="md" c="dimmed">
                        Kami akan meminta izin berikut dari Facebook Page Anda untuk mengaktifkan percakapan Messenger, analitik, dan penerbitan konten.
                    </Text>

                    <Paper withBorder p="md" radius="md" mb="md" bg="var(--mantine-color-gray-0)">
                        <Group mb="sm">
                            <ShieldCheckIcon size={20} color="var(--mantine-color-gray-6)" />
                            <Text fw={600}>Data yang akan kami akses dari akun Anda</Text>
                        </Group>
                        
                        <List spacing="sm" size="sm" center icon={
                            <ThemeIcon color="teal" size={20} radius="xl" variant="light">
                                <CheckCircle2Icon size={14} />
                            </ThemeIcon>
                        }>
                            <List.Item>Profil Facebook Page: nama, ID, foto profil, kategori</List.Item>
                            <List.Item>Percakapan Messenger: menerima & membalas pesan dari pelanggan Anda</List.Item>
                            <List.Item>File media dalam percakapan: gambar, video, audio, file</List.Item>
                            <List.Item>Status terkirim & dibaca pesan</List.Item>
                            <List.Item>Semua Facebook Page yang Anda kelola akan terhubung sekaligus</List.Item>
                            <List.Item>Insights halaman: jangkauan, impresi, pertumbuhan fan, engagement postingan</List.Item>
                            <List.Item>Menerbitkan postingan, foto, dan video di Page Anda (untuk fitur penjadwalan)</List.Item>
                        </List>
                    </Paper>

                    <Paper withBorder p="md" radius="md" mb="xl" bg="var(--mantine-color-blue-0)" style={{ borderColor: 'var(--mantine-color-blue-2)' }}>
                        <Group mb="sm">
                            <InfoIcon size={18} color="var(--mantine-color-blue-6)" />
                            <Text size="sm" c="blue.7" fw={600}>Izin OAuth yang Diminta</Text>
                        </Group>
                        <Flex gap="xs" wrap="wrap">
                            {['public_profile', 'pages_show_list', 'pages_manage_metadata', 'pages_messaging', 'pages_read_engagement', 'read_insights', 'pages_manage_posts', 'pages_manage_engagement', 'publish_video'].map((scope) => (
                                <Badge key={scope} variant="outline" color="blue" radius="sm" style={{ textTransform: 'none' }}>
                                    {scope}
                                </Badge>
                            ))}
                        </Flex>
                    </Paper>

                    <Group justify="flex-end">
                        <Button variant="default" onClick={() => setConnectModalOpen(false)}>
                            Batal
                        </Button>
                        <Button color="green" onClick={() => {
                            setConnectModalOpen(false);
                            handleConnectFacebook();
                        }}>
                            Hubungkan Akun
                        </Button>
                    </Group>
                </Modal>

                <Card shadow="sm" p="xl" radius="md" withBorder>
                    <Stack>
                        {integrations.length > 0 && (
                            <>
                                <Alert color="green" icon={<CheckCircleIcon size={16} />} title="Active Integration">
                                    {integrations.length} Facebook Page(s) connected. Messenger inbox and chat workflows are ready.
                                </Alert>
                                <Divider label="Update Configuration" labelPosition="center" />
                            </>
                        )}

                        <List spacing="sm">
                        {integrations.map(integration => (
                            <List.Item key={integration.id} style={{ padding: '16px', background: 'var(--mantine-color-gray-0)', borderRadius: '8px' }} icon={
                                <Avatar color="blue" variant="light" size="md"><MessagesSquareIcon size={20} /></Avatar>
                            }>
                                <Box>
                                    <Text fw={600} size="lg">{integration.metadata?.name || 'Facebook Page'}</Text>
                                    {integration.metadata?.category && (
                                        <Badge size="xs" variant="light" mt={4} color="gray">{integration.metadata.category}</Badge>
                                    )}
                                </Box>
                            </List.Item>
                        ))}
                        
                        {integrations.length === 0 && (
                            <Box ta="center" py="xl">
                                <MessagesSquareIcon size={48} color="var(--mantine-color-gray-4)" strokeWidth={1} style={{ margin: '0 auto', marginBottom: 12 }} />
                                <Text size="sm" c="dimmed" fs="italic">No Facebook Pages connected yet.</Text>
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
                                variant="filled"
                                color="blue"
                                onClick={() => setConnectModalOpen(true)}
                            >
                                {integrations.length > 0 ? 'Connect More Pages' : 'Connect via Meta'}
                            </Button>
                        </Group>
                    </Stack>
                </Card>
            </Box>
        </PageShell>
    );
};

export default IntegrationsMessenger;
