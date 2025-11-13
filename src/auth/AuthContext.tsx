// src/auth/AuthContext.ts
import { createContext } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';

// Define the shape of the context's value
export interface AuthContextType {
  session: Session | null;
  user: User | null;
  signInWithEmail: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  loading: boolean;
}

// Create and export the context
export const AuthContext = createContext<AuthContextType | undefined>(undefined);