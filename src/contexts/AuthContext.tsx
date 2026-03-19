import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<{
    session: Session | null;
    user: User | null;
    profile: Profile | null;
    loading: boolean;
  }>({
    session: null,
    user: null,
    profile: null,
    loading: true
  });

  const lastFetchedUserId = useRef<string | null>(null);

  const fetchProfileData = useCallback(async (userId: string, userMetadata?: any): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url, role')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .upsert({
              id: userId,
              email: userMetadata?.email || '',
              full_name: userMetadata?.full_name || 'User',
              avatar_url: userMetadata?.avatar_url,
              role: userMetadata?.role || 'free'
            })
            .select()
            .single();
            
          if (!insertError && newProfile) {
            return newProfile;
          }
        }
        console.error('Error fetching profile:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Error in fetchProfileData:', error);
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const profile = await fetchProfileData(user.id);
      setAuthState(prev => ({ ...prev, profile }));
    }
  }, [fetchProfileData]);

  useEffect(() => {
    let mounted = true;
    console.log('[AuthContext] Initializing auth listener...');

    // Fail-safe: Ensure loading is cleared after 10s no matter what
    const timeout = setTimeout(() => {
      if (mounted && authState.loading) {
        console.warn('[AuthContext] Loading fail-safe triggered. Clearing loading state.');
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    }, 10000);

    // 1. Initial Session Check
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      console.log('[AuthContext] Initial session check:', session ? 'User logged in' : 'No user');
      
      const user = session?.user ?? null;
      
      // Update session/user IMMEDIATELY
      setAuthState(prev => ({ ...prev, session, user, loading: user ? prev.loading : false }));

      let profile = null;
      if (user) {
        profile = await fetchProfileData(user.id, user.user_metadata);
        lastFetchedUserId.current = user.id;
      }
      setAuthState(prev => ({ ...prev, profile, loading: false }));
      clearTimeout(timeout);
    });

    // 2. Auth State Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      console.log('[AuthContext] onAuthStateChange:', event, session ? 'User present' : 'No session');
      
      const user = session?.user ?? null;
      
      // Update session/user IMMEDIATELY so UI can respond
      setAuthState(prev => ({ 
        ...prev, 
        session, 
        user, 
        loading: event === 'INITIAL_SESSION' ? prev.loading : false 
      }));

      let profile = null;
      if (user) {
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || user.id !== lastFetchedUserId.current) {
          console.log('[AuthContext] Fetching fresh profile for user:', user.id, 'Reason:', event);
          profile = await fetchProfileData(user.id, user.user_metadata);
          lastFetchedUserId.current = user.id;
        } else {
          console.log('[AuthContext] Keeping current profile as user ID is unchanged and event is:', event);
          return;
        }
      } else {
        console.log('[AuthContext] No user in auth change, clearing profile.');
        lastFetchedUserId.current = null;
      }
      
      if (mounted) {
        setAuthState(prev => ({ ...prev, profile, loading: false }));
      }
      clearTimeout(timeout);
    });

    const handleProfileUpdate = () => {
      console.log('[AuthContext] Profile update event received.');
      // Re-fetch using the current user ID if available
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user && mounted) {
          fetchProfileData(user.id).then(profile => {
            if (mounted) setAuthState(prev => ({ ...prev, profile }));
          });
        }
      });
    };

    window.addEventListener('profile-updated', handleProfileUpdate);

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
      window.removeEventListener('profile-updated', handleProfileUpdate);
    };
  }, [fetchProfileData]);

  const authValue = useMemo(() => ({
    ...authState,
    refreshProfile
  }), [authState, refreshProfile]);

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
