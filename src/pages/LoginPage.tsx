import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { Button, TextInput, Paper, Title, Container, Text, MantineProvider } from '@mantine/core';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin@gmail.com');
  const [password, setPassword] = useState('admin');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signInWithEmail } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await signInWithEmail(email, password);

    if (signInError) {
      setError(signInError.message);
    } else {
      navigate('/'); // Navigate to dashboard on success
    }
    setLoading(false);
  };

  return (
    <MantineProvider>
      <Container size={420} my={40}>
        <Title ta="center">Welcome back!</Title>
        <Paper withBorder shadow="md" p={30} mt={30} radius="md">
          <form onSubmit={handleSubmit}>
            <TextInput
              label="Email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              required
            />
            <TextInput
              label="Password"
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              required
              mt="md"
            />
            {error && <Text color="red" size="sm" mt="xs">{error}</Text>}
            <Button type="submit" fullWidth mt="xl" loading={loading}>
              Sign in
            </Button>
          </form>
        </Paper>
      </Container>
    </MantineProvider>
  );
};