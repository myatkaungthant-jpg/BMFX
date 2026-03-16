import React from 'react';
import { Layout } from '../components/Layout';
import { Bell, Shield, Moon, Smartphone, Globe, CreditCard } from 'lucide-react';
import { useTheme } from '../components/ThemeProvider';

export function Settings() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>
        
        <div className="space-y-6">
          {/* Account Settings */}
          <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Shield className="text-[#9CD5FF] dark:text-emerald-500" size={24} />
                Account & Security
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm mt-1">Manage your password and security preferences.</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Change Password</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Update your account password</p>
                </div>
                <button className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors">
                  Update
                </button>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800/50">
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Add an extra layer of security</p>
                </div>
                <button className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors">
                  Enable
                </button>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Globe className="text-[#9CD5FF] dark:text-emerald-500" size={24} />
                Preferences
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm mt-1">Customize your learning experience.</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="text-zinc-600 dark:text-zinc-400" size={20} />
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Receive updates about new courses</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#9CD5FF] dark:peer-checked:bg-emerald-500"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800/50">
                <div className="flex items-center gap-3">
                  <Moon className="text-zinc-600 dark:text-zinc-400" size={20} />
                  <div>
                    <p className="font-medium">Dark Mode</p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Toggle dark theme</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={theme === 'dark'}
                    onChange={toggleTheme}
                  />
                  <div className="w-11 h-6 bg-zinc-200 dark:bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#9CD5FF] dark:peer-checked:bg-emerald-500"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Billing */}
          <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <CreditCard className="text-[#9CD5FF] dark:text-emerald-500" size={24} />
                Billing & Subscription
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm mt-1">Manage your active plans.</p>
            </div>
            <div className="p-6">
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#9CD5FF] dark:text-emerald-500">Pro Plan</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Active until Dec 31, 2026</p>
                </div>
                <button className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors">
                  Manage
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
