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
      
      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 p-6 py-12 max-w-5xl mx-auto w-full">
        {/* 6 Months Package */}
        <div className="flex-1 w-full max-w-md bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-2xl flex flex-col">
          <h2 className="text-3xl font-bold text-center mb-2">6 Months Access</h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-center mb-8">Essential time to master the fundamentals.</p>
          
          <div className="text-center mb-8">
            <span className="text-5xl font-extrabold">$90</span>
            <span className="text-zinc-600 dark:text-zinc-400">/6 months</span>
          </div>
          
          <ul className="space-y-4 mb-8 flex-1">
            {[
              'Full Course Curriculum (Alpha, Sighma, Money Market)', 
              'Private Telegram Channel Access', 
              'Resource Vault & Templates', 
              'Weekly Live Q&A Sessions'
            ].map((feature, i) => (
              <li key={i} className="flex items-start gap-3">
                <Check className="text-[#9CD5FF] dark:text-emerald-500 shrink-0 mt-0.5" size={20} />
                <span className="text-zinc-700 dark:text-zinc-300">{feature}</span>
              </li>
            ))}
          </ul>
          
          <a href="https://t.me/BMFXEmpire" target="_blank" rel="noopener noreferrer" className="block w-full py-4 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-center rounded-xl font-bold transition-colors">
            Get 6 Months Access
          </a>
        </div>

        {/* 1 Year Package */}
        <div className="flex-1 w-full max-w-md bg-zinc-900 dark:bg-zinc-800 border-2 border-[#7AB8E5] dark:border-emerald-500 rounded-3xl p-8 shadow-2xl relative flex flex-col lg:-translate-y-4">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#7AB8E5] dark:bg-emerald-500 text-white px-4 py-1 rounded-full text-sm font-bold tracking-wide">
            BEST VALUE
          </div>
          <h2 className="text-3xl font-bold text-center mb-2 text-white">1 Year Access</h2>
          <p className="text-zinc-400 text-center mb-8">Full commitment to becoming a profitable trader.</p>
          
          <div className="text-center mb-8 text-white">
            <span className="text-5xl font-extrabold">$150</span>
            <span className="text-zinc-400">/year</span>
          </div>
          
          <ul className="space-y-4 mb-8 flex-1">
            {[
              'Full Course Curriculum (Alpha, Sighma, Money Market)', 
              'Private Telegram Channel Access', 
              'Resource Vault & Templates', 
              'Weekly Live Q&A Sessions',
              'Priority Support'
            ].map((feature, i) => (
              <li key={i} className="flex items-start gap-3 text-white">
                <Check className="text-[#7AB8E5] dark:text-emerald-500 shrink-0 mt-0.5" size={20} />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          
          <a href="https://t.me/BMFXEmpire" target="_blank" rel="noopener noreferrer" className="block w-full py-4 bg-[#7AB8E5] dark:bg-emerald-600 hover:bg-[#9CD5FF] dark:hover:bg-emerald-500 text-white text-center rounded-xl font-bold transition-colors shadow-lg shadow-[#7AB8E5]/20 dark:shadow-emerald-500/20">
            Get 1 Year Access
          </a>
        </div>
      </main>
    </div>
  );
}
