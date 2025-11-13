import React from 'react';
import { useAuth } from '../../auth/useAuth';
import { Navigate, Outlet } from 'react-router-dom';
import { Loader, Center } from '@mantine/core';

export const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    // Show a loading spinner while checking auth state
    return (
      <Center style={{ height: '100vh' }}>
        <Loader />
      </Center>
    );
  }

  if (!user) {
    // If not loading and no user, redirect to login
    return <Navigate to="/login" replace />;
  }

  // If user is logged in, render the child route
  return <Outlet />;
};