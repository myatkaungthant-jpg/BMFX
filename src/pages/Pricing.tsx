import React from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useTheme } from '../components/ThemeProvider';

export function Pricing() {
  const { theme } = useTheme();
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col">
      <header className="px-6 py-4 flex justify-between items-center border-b border-zinc-200 dark:border-zinc-900">
        <Link to="/" className="flex items-center gap-2">
          <img src={theme === 'dark' ? "/logo-black.png" : "/logo.png"} alt="BMFX Logo" className="h-10 w-auto object-contain" />
          <span className="text-2xl font-bold text-[#9CD5FF] dark:text-emerald-500">BMFX</span>
        </Link>
        <Link to="/login" className="px-4 py-2 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors font-medium">Login</Link>
      </header>
      
      <main className="flex-1 flex items-center justify-center p-6 py-12">
        <div className="max-w-md w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-3xl font-bold text-center mb-2">Lifetime Access</h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-center mb-8">Everything you need to become a profitable trader.</p>
          
          <div className="text-center mb-8">
            <span className="text-5xl font-extrabold">$249</span>
            <span className="text-zinc-600 dark:text-zinc-400">/one-time</span>
          </div>
          
          <ul className="space-y-4 mb-8">
            {[
              'Full Course Curriculum (Alpha, Sighma, Money Market)', 
              'Private Telegram Channel Access', 
              'Resource Vault & Templates', 
              'Weekly Live Q&A Sessions', 
              'Lifetime Updates'
            ].map((feature, i) => (
              <li key={i} className="flex items-center gap-3">
                <Check className="text-[#9CD5FF] dark:text-emerald-500 shrink-0" size={20} />
                <span className="text-zinc-700 dark:text-zinc-300">{feature}</span>
              </li>
            ))}
          </ul>
          
          <Link to="/login" className="block w-full py-4 bg-[#7AB8E5] dark:bg-emerald-600 hover:bg-[#9CD5FF] dark:hover:bg-emerald-500 text-white text-center rounded-xl font-bold transition-colors">
            Get Instant Access
          </Link>
        </div>
      </main>
    </div>
  );
}
