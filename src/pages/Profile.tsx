import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import { User, Mail } from 'lucide-react';

export function Profile() {
  const { profile, session } = useAuth();
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
    }
  }, [profile]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user.id) return;
    
    setLoading(true);
    setMessage(null);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', session.user.id)
        .select()
        .single();
        
      if (error) throw error;
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      window.dispatchEvent(new CustomEvent('profile-updated'));
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error updating profile' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Your Profile</h1>
        
        <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 md:p-8">
          <div className="flex items-center gap-6 mb-8 pb-8 border-b border-zinc-200 dark:border-zinc-800">
            <div className="w-20 h-20 rounded-full bg-[#7AB8E5] dark:bg-emerald-600 flex items-center justify-center text-3xl font-bold text-white shrink-0">
              {fullName.charAt(0) || profile?.full_name?.charAt(0) || 'T'}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{profile?.full_name || 'Trader'}</h2>
              <p className="text-zinc-600 dark:text-zinc-400 flex items-center gap-2 mt-1">
                <Mail size={16} />
                {session?.user.email}
              </p>
            </div>
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-lg text-sm border ${
              message.type === 'success' 
                ? 'bg-[#9CD5FF]/10 dark:bg-emerald-500/10 border-[#9CD5FF]/50 dark:border-emerald-500/50 text-[#7AB8E5] dark:text-emerald-400' 
                : 'bg-red-500/10 border-red-500/50 text-red-400'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleUpdate} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2 flex items-center gap-2">
                <User size={16} />
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9CD5FF] dark:focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100 transition-shadow"
                placeholder="Enter your full name"
              />
            </div>

            <div className="pt-4">
              <button 
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-[#7AB8E5] dark:bg-emerald-600 hover:bg-[#9CD5FF] dark:hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
