import { useState } from 'react';
import { TextInput, Button, Paper, Title, Text, Container, Code, Loader, Badge, Group } from '@mantine/core';
import { whatsappService } from '../services/whatsappService';

export default function WhatsAppTest() {
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

    const handleSend = async () => {
        if (!phone) return;
        setLoading(true);
        setStatus(null);
        setLogs([]);

        try {
            addLog(`Queuing message to ${phone}...`);
            const data = await whatsappService.queueMessage(phone);
            addLog(`Message Queued! ID: ${data.id}`);
            setStatus('scheduling');

            // Subscribe to updates
            whatsappService.subscribeToMessage(data.id, (updatedRow) => {
                addLog(`Status Update: ${updatedRow.status}`);
                setStatus(updatedRow.status);
                if (updatedRow.status === 'sent') {
                    addLog('✅ Message Successfully Sent!');
                    setLoading(false);
                } else if (updatedRow.status === 'failed') {
                    addLog('❌ Message Failed to Send.');
                    setLoading(false);
                }
            });

        } catch (error: any) {
            console.error(error);
            addLog(`Error: ${error.message}`);
            setLoading(false);
        }
    };

    return (
        <Container size="sm" py="xl">
            <Paper shadow="xs" p="xl" withBorder>
                <Title order={2} mb="md">WhatsApp Gateway Test</Title>
                <Text c="dimmed" mb="lg">
                    Enter a phone number (with country code, e.g., 62812...) to send a "hello_world" test template.
                </Text>

                <Group align="flex-end" mb="lg">
                    <TextInput
                        label="Phone Number"
                        placeholder="628123456789"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        style={{ flex: 1 }}
                    />
                    <Button onClick={handleSend} disabled={loading || !phone}>
                        {loading ? <Loader size="xs" /> : 'Send Test'}
                    </Button>
                </Group>

                {status && (
                    <Group mb="md">
                        <Text fw={500}>Current Status:</Text>
                        <Badge
                            color={status === 'sent' ? 'green' : status === 'failed' ? 'red' : 'yellow'}
                            size="lg"
                        >
                            {status.toUpperCase()}
                        </Badge>
                    </Group>
                )}

                {logs.length > 0 && (
                    <Code block style={{ minHeight: '150px' }}>
                        {logs.map((log, i) => (
                            <div key={i}>{log}</div>
                        ))}
                    </Code>
                )}
            </Paper>
        </Container>
    );
}
