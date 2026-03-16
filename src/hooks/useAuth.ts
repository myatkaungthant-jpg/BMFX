import { useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    const handleProfileUpdate = () => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          fetchProfile(session.user.id);
        }
      });
    };

    window.addEventListener('profile-updated', handleProfileUpdate);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('profile-updated', handleProfileUpdate);
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile doesn't exist, try to create it
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: newProfile, error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: user.id,
                email: user.email,
                full_name: user.user_metadata?.full_name || 'User',
                avatar_url: user.user_metadata?.avatar_url,
                role: user.user_metadata?.role || 'student'
              })
              .select()
              .single();
              
            if (!insertError && newProfile) {
              setProfile(newProfile);
              return;
            }
          }
        }
        console.error('Error fetching profile:', error);
      } else {
        setProfile(data);
      }
    } finally {
      setLoading(false);
    }
  };

  return { session, user, profile, loading };
}
