import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './useAuth';

export type UserRole = 'admin' | 'operator' | 'designer' | 'marketer' | null;

interface UserContextType {
  role: UserRole;
  currentOrgId: string | null;
  loadingRole: boolean;
  isSuperAdmin: boolean;
  switchOrganization: (orgId: string) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>(null);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loadingRole, setLoadingRole] = useState(true);

  // FIX: Wrapped in useCallback to safely use in useEffect dependency array
  const fetchUserRole = useCallback(async () => {
    // 🔴 CRITICAL FIX: Reset all permissions states immediately.
    // This ensures that if you switch from 'Admin' to 'Designer', 
    // the 'isSuperAdmin' flag doesn't persist.
    setIsSuperAdmin(false);
    setRole(null);
    setCurrentOrgId(null);

    if (!user) {
        setLoadingRole(false);
        return;
    }

    try {
      // 1. Check if Super Admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();

      if (profile?.username === 'superadmin') { 
          setIsSuperAdmin(true);
          // SuperAdmin has implicit 'admin' privileges everywhere contextually
          setRole('admin');
          setLoadingRole(false);
          return; 
      }

      // 2. Fetch Organization Role
      const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id, role')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      if (membership) {
        setCurrentOrgId(membership.organization_id);
        // Cast the string role from DB to our UserRole type
        setRole(membership.role as UserRole);
      } else {
        setRole(null);
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
      setRole(null);
    } finally {
      setLoadingRole(false);
    }
  }, [user]);

  // FIX: Added dependency array
  useEffect(() => {
    fetchUserRole();
  }, [fetchUserRole]);

  const switchOrganization = async (orgId: string) => {
    if (!user) return;
    setLoadingRole(true);
    
    const { data } = await supabase
        .from('organization_members')
        .select('role')
        .eq('user_id', user.id)
        .eq('organization_id', orgId)
        .single();
    
    if (data) {
        setCurrentOrgId(orgId);
        setRole(data.role as UserRole);
    }
    setLoadingRole(false);
  };

  return (
    <UserContext.Provider value={{ role, currentOrgId, loadingRole, isSuperAdmin, switchOrganization }}>
      {children}
    </UserContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useUserRole = () => {
  const context = useContext(UserContext);
  if (context === undefined) throw new Error('useUserRole must be used within UserProvider');
  return context;
};