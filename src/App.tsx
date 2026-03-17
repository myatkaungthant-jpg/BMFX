import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuth } from './hooks/useAuth';
import { supabase } from './lib/supabaseClient';

// Pages
import { Landing } from './pages/Landing';
import { Pricing } from './pages/Pricing';
import { Dashboard } from './pages/Dashboard';
import { Courses } from './pages/Courses';
import { Lesson } from './pages/Lesson';
import { Feed } from './pages/Feed';
import { Resources } from './pages/Resources';
import { EconomicCalendar } from './pages/EconomicCalendar';
import { Help } from './pages/Help';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { Admin } from './pages/Admin';
import { TradingJournal } from './pages/TradingJournal';
import { AdminRoute } from './components/AdminRoute';

// Initialize React Query client
const queryClient = new QueryClient();

import { useTheme } from './components/ThemeProvider';

const Login = () => {
  const { session } = useAuth();
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (session) return <Navigate to="/dashboard" replace />;
  
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage('Check your email for the confirmation link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <div className="w-full max-w-md p-8 bg-zinc-50 dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800">
        <div className="flex justify-center mb-4">
          <img src={theme === 'dark' ? "/logo-black.png" : "/logo.png"} alt="BMFX Logo" className="h-20 w-auto object-contain mx-auto" />
        </div>
        <h1 className="text-2xl font-bold mb-2 text-center">BMFX</h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-center mb-6">
          {isSignUp ? 'Create your account' : 'Sign in to your account'}
        </p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-4 p-3 bg-[#9CD5FF]/10 dark:bg-emerald-500/10 border border-[#9CD5FF]/50 dark:border-emerald-500/50 text-[#7AB8E5] dark:text-emerald-400 rounded-lg text-sm">
            {message}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9CD5FF] dark:focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100"
              placeholder="trader@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9CD5FF] dark:focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100"
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-[#7AB8E5] dark:bg-emerald-600 hover:bg-[#9CD5FF] dark:hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors mt-2"
          >
            {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-700 dark:text-zinc-300 transition-colors"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
};

import { ThemeProvider } from './components/ThemeProvider';

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/courses" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
            <Route path="/courses/:courseId/lessons/:lessonId" element={<ProtectedRoute><Lesson /></ProtectedRoute>} />
            <Route path="/community" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
            <Route path="/calendar" element={<ProtectedRoute><EconomicCalendar /></ProtectedRoute>} />
            <Route path="/journal" element={<ProtectedRoute><TradingJournal /></ProtectedRoute>} />
            <Route path="/resources" element={<ProtectedRoute><Resources /></ProtectedRoute>} />
            <Route path="/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminRoute><Admin /></AdminRoute></ProtectedRoute>} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
