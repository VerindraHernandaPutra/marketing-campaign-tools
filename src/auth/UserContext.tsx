import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
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
  
  // Track the last processed user to prevent unnecessary re-fetches on tab focus
  const lastProcessedUserId = useRef<string | null>(null);

  const fetchUserRole = useCallback(async () => {
    // 1. OPTIMIZATION: If the user ID hasn't changed, don't wipe the state.
    // This prevents the "flash" when switching tabs.
    if (user?.id === lastProcessedUserId.current) {
        return;
    }

    // 2. CRITICAL FIX: Set loading TRUE before clearing roles.
    // This prevents RoleGuard from seeing "role: null" and showing Access Denied.
    setLoadingRole(true);
    
    // Update the ref
    lastProcessedUserId.current = user?.id || null;

    // Reset permissions
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