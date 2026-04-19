import React, { useEffect, useState } from 'react';
import { Paper, Text, TextInput, Group, ThemeIcon, Box, Divider, Badge, Loader, Avatar } from '@mantine/core';
import { MailIcon, SendIcon } from 'lucide-react';
import { supabase } from '../../../supabaseClient';

interface EmailData {
  subject?: string;
  [key: string]: unknown;
}

interface EmailFlowProps {
  data: EmailData;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (data: any) => void;
  title?: string;
  content?: string;
  orgId?: string;
}

interface ResendIntegration {
  from_name?: string;
  from_email?: string;
}

const EmailFlow: React.FC<EmailFlowProps> = ({ data, onChange, title = '', content = '', orgId }) => {
  const [integration, setIntegration] = useState<ResendIntegration | null>(null);
  const [loadingIntegration, setLoadingIntegration] = useState(false);

  useEffect(() => {
    const fetchIntegration = async () => {
      if (!orgId) return;
      setLoadingIntegration(true);
      const { data: intData } = await supabase
        .from('organization_integrations')
        .select('metadata')
        .eq('organization_id', orgId)
        .eq('platform', 'resend')
        .single();

      if (intData?.metadata) {
        setIntegration({
          from_name: intData.metadata.from_name,
          from_email: intData.metadata.from_email,
        });
      }
      setLoadingIntegration(false);
    };
    fetchIntegration();
  }, [orgId]);

  const effectiveSubject = data.subject || title || 'New Campaign';
  const senderDisplay = integration
    ? `${integration.from_name} <${integration.from_email}>`
    : 'Not configured';

  return (
    <Paper shadow="xs" p="md" withBorder radius="md" mb="md">
      {/* Header */}
      <Group mb="md">
        <ThemeIcon color="blue" variant="light" size="lg">
          <MailIcon size={20} />
        </ThemeIcon>
        <div>
          <Text fw={600} size="sm" c="blue">Email Configuration</Text>
          <Text size="xs" c="dimmed">Set up your email subject line</Text>
        </div>
      </Group>

      {/* Subject input */}
      <TextInput
        label="Subject Line"
        placeholder={title || "Enter email subject"}
        variant="filled"
        name="subject"
        value={data.subject || ''}
        onChange={(e) => onChange({ ...data, subject: e.currentTarget.value })}
        mb="md"
      />

      <Divider mb="md" />

      {/* Sender Info */}
      <Box mb="md">
        <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb={6}>Sender</Text>
        {loadingIntegration ? (
          <Group gap="xs"><Loader size="xs" /><Text size="xs" c="dimmed">Loading integration...</Text></Group>
        ) : integration ? (
          <Group gap="xs">
            <Avatar size="sm" radius="xl" color="blue">
              {integration.from_name?.[0]?.toUpperCase() || 'M'}
            </Avatar>
            <Box>
              <Text size="sm" fw={500}>{integration.from_name}</Text>
              <Text size="xs" c="dimmed">{integration.from_email}</Text>
            </Box>
            <Badge color="green" size="xs" variant="light" ml="auto">Connected</Badge>
          </Group>
        ) : (
          <Group gap="xs">
            <Badge color="orange" size="xs" variant="light">⚠️ Not configured</Badge>
            <Text size="xs" c="dimmed">Go to Platform → Resend (Email) to configure</Text>
          </Group>
        )}
      </Box>

      <Divider mb="md" />

      {/* Live Email Preview */}
      <Box>
        <Group gap="xs" mb={8}>
          <SendIcon size={13} />
          <Text size="xs" fw={600} c="dimmed" tt="uppercase">Email Preview</Text>
        </Group>

        <Box
          p="md"
          style={{
            border: '1px solid #e9ecef',
            borderRadius: 8,
            background: '#fff',
            fontFamily: 'sans-serif',
          }}
        >
          {/* Email header bar */}
          <Box mb={12} pb={10} style={{ borderBottom: '1px solid #f0f0f0' }}>
            <Group gap="xs" mb={4}>
              <Text size="xs" c="dimmed" w={50}>From:</Text>
              <Text size="xs" fw={500}>{senderDisplay}</Text>
            </Group>
            <Group gap="xs" mb={4}>
              <Text size="xs" c="dimmed" w={50}>Subject:</Text>
              <Text size="xs" fw={600}>{effectiveSubject}</Text>
            </Group>
          </Box>

          {/* Email body */}
          <Box style={{ color: '#333', fontSize: 13 }}>
            {title && (
              <Text fw={700} size="sm" mb={6} style={{ color: '#111' }}>{title}</Text>
            )}
            {content ? (
              <Text size="xs" style={{ lineHeight: 1.7, whiteSpace: 'pre-wrap', color: '#444' }}>
                {content.length > 200 ? content.slice(0, 200) + '...' : content}
              </Text>
            ) : (
              <Text size="xs" c="dimmed" fs="italic">Your campaign content will appear here...</Text>
            )}
            <Divider my={8} />
            <Text size="xs" c="dimmed">Sent via Marketing VHP Campaign Manager</Text>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default EmailFlow;