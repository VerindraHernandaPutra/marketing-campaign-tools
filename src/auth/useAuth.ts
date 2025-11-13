// src/auth/useAuth.ts
import { useContext } from 'react';
import { AuthContext } from './AuthContext'; // Import the context from the other file

// Create and export the custom hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};