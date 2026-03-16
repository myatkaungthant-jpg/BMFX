import React from 'react';
import { Layout } from '../components/Layout';
import { HelpCircle, Send } from 'lucide-react';

export function Help() {
  const faqs = [
    { q: "How do I interact with the community?", a: "Go to the Community Feed tab. You can read posts, like, and comment on discussions." },
    { q: "Can I download videos for offline viewing?", a: "Currently, videos are streaming-only to protect our intellectual property. However, all PDFs and spreadsheets in the Resource Vault can be downloaded." },
    { q: "How do I reset my password?", a: "You can reset your password from the Settings page, or click 'Forgot Password' on the login screen if you're signed out." },
  ];

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Help & FAQ</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">Basic troubleshooting and support.</p>
        
        <div className="space-y-4 mb-12">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
              <h3 className="font-bold text-lg mb-2 flex items-start gap-3">
                <HelpCircle className="text-[#9CD5FF] dark:text-emerald-500 shrink-0 mt-1" size={20} />
                {faq.q}
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400 ml-8">{faq.a}</p>
            </div>
          ))}
        </div>

        <div className="bg-[#9CD5FF]/20 dark:bg-emerald-900/20 border border-[#9CD5FF]/30 dark:border-emerald-500/30 rounded-2xl p-8 text-center">
          <Send className="text-[#9CD5FF] dark:text-emerald-500 mx-auto mb-4" size={32} />
          <h2 className="text-xl font-bold mb-2">Still need help?</h2>
          <p className="text-[#1A4B6E]/80 dark:text-emerald-100/80 mb-6">Join our Telegram community for real-time support and discussions.</p>
          <a 
            href="https://t.me/BMFXEmpire" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="px-6 py-3 bg-[#7AB8E5] dark:bg-emerald-600 hover:bg-[#9CD5FF] dark:hover:bg-emerald-500 text-white rounded-xl font-bold transition-colors inline-block"
          >
            Contact Support on Telegram
          </a>
        </div>
      </div>
    </Layout>
  );
}
