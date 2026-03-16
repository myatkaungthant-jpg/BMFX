import React, { useState } from 'react';
import { Menu, X, Home, BookOpen, Settings as SettingsIcon, LogOut, MessageSquare, FolderArchive, HelpCircle, ShieldAlert, Send } from 'lucide-react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import { useTheme } from './ThemeProvider';

export function Layout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const { profile } = useAuth();
  const { theme } = useTheme();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const toggleSidebar = () => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(true);
    } else {
      setIsDesktopSidebarOpen(!isDesktopSidebarOpen);
    }
  };

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg whitespace-nowrap transition-colors ${
      isActive
        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:bg-zinc-800/50 hover:text-zinc-900 dark:text-zinc-100'
    }`;

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex">
      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-screen bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 transform transition-all duration-300 ease-in-out flex flex-col
        ${isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'}
        md:sticky md:translate-x-0
        ${isDesktopSidebarOpen ? 'md:w-64' : 'md:w-0 md:overflow-hidden md:border-none'}
      `}>
        <div className="p-4 flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 h-16 shrink-0">
          <div className="flex items-center gap-2">
            <img src={theme === 'dark' ? "/logo-black.png" : "/BMFX.png"} alt="BMFX Logo" className="h-10 w-auto object-contain" />
            <h1 className="text-xl font-bold text-[#9CD5FF] dark:text-emerald-500 whitespace-nowrap">BMFX</h1>
          </div>
          <button className="md:hidden text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:text-zinc-100" onClick={() => setIsSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>
        
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          <div className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-2 px-4 mt-2">Learning</div>
          <NavLink to="/dashboard" className={navLinkClasses}>
            <Home size={20} className="shrink-0" />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/courses" className={navLinkClasses}>
            <BookOpen size={20} className="shrink-0" />
            <span>Curriculum</span>
          </NavLink>

          <div className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-2 px-4 mt-6">Community</div>
          <NavLink to="/community" className={navLinkClasses}>
            <MessageSquare size={20} className="shrink-0" />
            <span>Community Feed</span>
          </NavLink>
          <NavLink to="/resources" className={navLinkClasses}>
            <FolderArchive size={20} className="shrink-0" />
            <span>Resource Vault</span>
          </NavLink>
          <NavLink to="/help" className={navLinkClasses}>
            <HelpCircle size={20} className="shrink-0" />
            <span>Help & FAQ</span>
          </NavLink>
          <a 
            href="https://t.me/BMFXEmpire" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:bg-zinc-800/50 hover:text-zinc-900 dark:text-zinc-100 transition-colors whitespace-nowrap"
          >
            <Send size={20} className="shrink-0" />
            <span>Telegram Group</span>
          </a>

          <div className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-2 px-4 mt-6">Management</div>
          <NavLink to="/settings" className={navLinkClasses}>
            <SettingsIcon size={20} className="shrink-0" />
            <span>Settings</span>
          </NavLink>
          <NavLink to="/admin" className={navLinkClasses}>
            <ShieldAlert size={20} className="shrink-0" />
            <span>Admin</span>
          </NavLink>
        </nav>

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
          <Link to="/profile" className="flex items-center gap-3 mb-4 px-2 hover:bg-zinc-100 dark:bg-zinc-800/50 p-2 rounded-lg transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-[#7AB8E5] dark:bg-emerald-600 flex items-center justify-center font-bold shrink-0">
              {profile?.full_name?.charAt(0) || 'T'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{profile?.full_name || 'Trader'}</p>
            </div>
          </Link>
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-4 py-2 text-zinc-600 dark:text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors whitespace-nowrap"
          >
            <LogOut size={20} className="shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 h-16 px-4 flex items-center gap-4 shrink-0">
          <button 
            className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:text-zinc-100 p-2 -ml-2 rounded-lg hover:bg-zinc-100 dark:bg-zinc-800/50 transition-colors"
            onClick={toggleSidebar}
          >
            <Menu size={24} />
          </button>
          {!isDesktopSidebarOpen && (
             <h2 className="text-lg font-bold text-[#9CD5FF] dark:text-emerald-500 hidden md:block">BMFX</h2>
          )}
        </header>
        
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
