import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Shield, Users } from 'lucide-react';
import { useTheme } from '../components/ThemeProvider';

export function Landing() {
  const { theme } = useTheme();
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Header */}
      <header className="px-6 py-4 flex justify-between items-center border-b border-zinc-200 dark:border-zinc-900">
        <div className="flex items-center gap-2">
          <img src={theme === 'dark' ? "/logo-black.png" : "/logo.png"} alt="BMFX Logo" className="h-10 w-auto object-contain" />
          <h1 className="text-2xl font-bold text-[#9CD5FF] dark:text-emerald-500">BMFX</h1>
        </div>
        <div className="flex gap-4 items-center">
          <Link to="/login" className="px-4 py-2 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors font-medium">Login</Link>
          <Link to="/pricing" className="px-4 py-2 bg-[#7AB8E5] dark:bg-emerald-600 hover:bg-[#9CD5FF] dark:hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors">Get Started</Link>
        </div>
      </header>
      
      {/* Hero */}
      <main className="max-w-5xl mx-auto px-6 py-20 text-center">
        <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
          Welcome To<br/><span className="text-[#9CD5FF] dark:text-emerald-500">Burmese FX Empire</span>
        </h2>
        <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-10 max-w-2xl mx-auto">
          Rule Base Trading Signal
        </p>
        <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-10 max-w-2xl mx-auto">
          Forex Knowledge For Your Trade Life
        </p>
        <Link to="/pricing" className="px-8 py-4 bg-[#7AB8E5] dark:bg-emerald-600 hover:bg-[#9CD5FF] dark:hover:bg-emerald-500 text-white rounded-xl font-bold text-lg transition-colors inline-block">
          Join BMFX Today
        </Link>
        
        {/* Social Proof */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="bg-zinc-50 dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <TrendingUp className="text-[#9CD5FF] dark:text-emerald-500 mb-4" size={32} />
            <h3 className="text-xl font-bold mb-2">Proven Strategies</h3>
            <p className="text-zinc-600 dark:text-zinc-400">Step-by-step frameworks that work in any market condition.</p>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <Users className="text-[#9CD5FF] dark:text-emerald-500 mb-4" size={32} />
            <h3 className="text-xl font-bold mb-2">Elite Community</h3>
            <p className="text-zinc-600 dark:text-zinc-400">Trade alongside funded traders in our exclusive Discord hub.</p>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <Shield className="text-[#9CD5FF] dark:text-emerald-500 mb-4" size={32} />
            <h3 className="text-xl font-bold mb-2">Lifetime Access</h3>
            <p className="text-zinc-600 dark:text-zinc-400">Pay once, get access to all future updates and modules forever.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
