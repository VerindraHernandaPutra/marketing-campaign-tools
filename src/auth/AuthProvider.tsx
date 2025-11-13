// src/auth/AuthProvider.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { AuthContext, AuthContextType } from './AuthContext'; // Import from new file
import { Session, User } from '@supabase/supabase-js';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // --- THIS IS THE MISSING LOGIC ---
  useEffect(() => {
    // 1. Get the current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 2. Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // 3. Clean up the listener on unmount
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);
  // --- END OF MISSING LOGIC ---


  // --- THESE ARE THE MISSING FUNCTIONS ---
  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUpWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };
  // --- END OF MISSING FUNCTIONS ---

  const value: AuthContextType = {
    session,
    user,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};