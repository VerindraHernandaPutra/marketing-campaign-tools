import { useEffect, useState } from 'react';
import { Title, Tabs, Card, Text, Button, List, LoadingOverlay, Badge, Group, Container, Box } from '@mantine/core';
import { supabase } from '../supabaseClient';
import { useAuth } from '../auth/useAuth';
import { useUserRole } from '../auth/UserContext';

// Mock Facebook OAuth Config (The user will set these environment variables)
const META_CLIENT_ID = import.meta.env.VITE_META_CLIENT_ID || '';
const REDIRECT_URI = import.meta.env.VITE_META_REDIRECT_URI || window.location.origin + '/integrations/meta-callback';

interface Integration {
  id: string;
  platform: string;
  provider_account_id: string;
  status: string;
  metadata?: any;
  connected_at: string;
}

const Integrations = () => {
    const { user } = useAuth();
    const { currentOrgId } = useUserRole();
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (currentOrgId) {
            fetchIntegrations();
        }
    }, [currentOrgId]);

    const fetchIntegrations = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('organization_integrations')
            .select('*')
            .eq('organization_id', currentOrgId);
        
        if (error) {
            console.error(error);
        } else {
            setIntegrations(data as Integration[]);
        }
        setLoading(false);
    };

    const handleConnectFacebook = () => {
        if (!META_CLIENT_ID) {
            alert("VITE_META_CLIENT_ID is not configured in your .env file!");
            return;
        }

        // Standard Facebook Business Login OAuth scopes
        const scopes = [
            'pages_show_list',
            'pages_read_engagement',
            'pages_manage_posts',
            'pages_manage_metadata',
            'instagram_basic',
            'instagram_manage_messages',
            'pages_messaging', // Critical for Facebook Messages
            'business_management' // Often needed by Meta
        ].join(',');

        const oauthUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${META_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&config_id=&response_type=code&scope=${encodeURIComponent(scopes)}&state=${currentOrgId}`;
        
        // Redirect to Meta's Login Page
        window.location.href = oauthUrl;
    };

    const handleDisconnect = async (id: string, platform: string) => {
        if (!window.confirm(`Are you sure you want to disconnect this ${platform} account?`)) return;
        
        const { error } = await supabase.from('organization_integrations').delete().eq('id', id);
        
        if (error) {
            alert("Error disconnecting account: " + error.message);
        } else {
            setIntegrations(integrations.filter(i => i.id !== id));
            alert("Disconnected successfully!");
        }
    };

    return (
        <Container size="lg" py="xl">
            <LoadingOverlay visible={loading} />
            
            <Title order={2} mb="xl">Organization Integrations</Title>
            <Text c="dimmed" mb="xl">
                Connect your social media and marketing accounts here. Because this is a multi-tenant platform, 
                campaigns you run will use YOUR connected accounts, not the generic platform defaults!
            </Text>

            <Tabs defaultValue="social">
                <Tabs.List mb="md">
                    <Tabs.Tab value="social">Social Media</Tabs.Tab>
                    <Tabs.Tab value="whatsapp">WhatsApp</Tabs.Tab>
                    <Tabs.Tab value="email">Email Domains</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="social">
                    <Card shadow="sm" p="lg" radius="md" withBorder mb="lg">
                        <Group justify="space-between" mb="xs">
                            <Text fw={600} size="lg">Meta (Facebook & Instagram)</Text>
                            <Button variant="light" color="blue" onClick={handleConnectFacebook}>
                                Connect Facebook
                            </Button>
                        </Group>
                        <Text size="sm" c="dimmed" mb="md">
                            Connect your Facebook Pages and Instagram Business accounts to automatically post campaigns and handle DMs natively.
                        </Text>
                        
                        <List spacing="sm">
                            {integrations.filter(i => i.platform.startsWith('facebook') || i.platform.startsWith('instagram')).map(integration => (
                                <List.Item key={integration.id} style={{ padding: '10px', background: '#f8f9fa', borderRadius: '8px' }}>
                                    <Group justify="space-between">
                                        <Box>
                                            <Text fw={500}>{integration.metadata?.name || 'Connected Page'}</Text>
                                            <Badge color="blue" size="sm">{integration.platform}</Badge>
                                        </Box>
                                        <Button variant="subtle" color="red" size="xs" onClick={() => handleDisconnect(integration.id, integration.platform)}>Disconnect</Button>
                                    </Group>
                                </List.Item>
                            ))}
                            
                            {integrations.filter(i => i.platform.startsWith('facebook') || i.platform.startsWith('instagram')).length === 0 && (
                                <Text size="sm" c="dimmed" fs="italic">No Meta accounts connected yet.</Text>
                            )}
                        </List>
                    </Card>

                    <Card shadow="sm" p="lg" radius="md" withBorder>
                        <Group justify="space-between" mb="xs">
                            <Text fw={600} size="lg">Other Platforms</Text>
                            <Button variant="light" color="gray" disabled>Coming Soon</Button>
                        </Group>
                        <Text size="sm" c="dimmed">
                            LinkedIn and X (Twitter) natively connected integrations are currently disabled for Beta.
                        </Text>
                    </Card>
                </Tabs.Panel>

                <Tabs.Panel value="whatsapp">
                   <Card shadow="sm" p="lg" radius="md" withBorder>
                        <Title order={4} mb="sm">WhatsApp Business Cloud</Title>
                        <Text size="sm" mb="md">For true multi-tenant messaging, you will connect your own Meta WhatsApp number.</Text>
                        
                        <Badge color="orange">Under Development</Badge>
                   </Card>
                </Tabs.Panel>

                <Tabs.Panel value="email">
                   <Card shadow="sm" p="lg" radius="md" withBorder>
                        <Title order={4} mb="sm">Resend Custom Domain</Title>
                        <Text size="sm" mb="md">Send emails via your own confirmed domain.</Text>
                        
                        <Badge color="orange">Under Development</Badge>
                   </Card>
                </Tabs.Panel>
            </Tabs>
        </Container>
    );
};

export default Integrations;
