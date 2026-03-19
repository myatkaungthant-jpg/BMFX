import React, { useState, useEffect, useRef } from 'react';
import { Bot, User, Send, X, MessageSquare, Sparkles, Loader2, Paperclip, ImageIcon, Trash2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import { useTradingMentor } from '../hooks/useTradingMentor';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation } from 'react-router-dom';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export const TradingCopilot = () => {
  const { profile, loading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [credits, setCredits] = useState<{ daily: number; total: number }>({ daily: 50, total: 50 });
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const { askAI, isLoading, error: aiError } = useTradingMentor();
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { pathname } = useLocation();

  // Hide on public pages
  const isPublicPage = ['/', '/login', '/pricing'].includes(pathname);

  useEffect(() => {
    if (profile?.id) {
      setUserId(profile.id);
      if (profile.role !== 'free') {
        fetchCredits(profile.id);
      }
    }
  }, [profile?.id, profile?.role]);

  const fetchCredits = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('user_credits')
        .select('daily_credits')
        .eq('user_id', uid)
        .single();

      if (error) {
        console.error('Error fetching credits:', error);
        return;
      }

      if (data) {
        setCredits(prev => ({ ...prev, daily: data.daily_credits }));
      }
    } catch (err) {
      console.error('Failed to fetch credits:', err);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File, uid: string): Promise<string | null> => {
    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${uid}/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('post-images')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('post-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (err) {
      console.error('Upload failed:', err);
      return null; // This now includes { text, cost }
    } finally {
      setIsUploading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !selectedImage) || isLoading || isUploading || (credits.daily <= 0 && profile?.role !== 'free') || !userId || profile?.role === 'free') return;

    let imageUrl = null;
    if (selectedImage) {
      imageUrl = await uploadImage(selectedImage, userId);
      if (!imageUrl) {
        setMessages(prev => [...prev, {
          role: 'system',
          content: 'Failed to upload image. Sending text only.',
          timestamp: new Date()
        }]);
      }
    }

    const userMessage: Message = {
      role: 'user',
      content: input || (selectedImage ? 'Sent an image' : ''),
      timestamp: new Date()
    };

    const systemMessage: Message = {
      role: 'system',
      content: 'Attaching recent trade context...',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage, systemMessage]);
    const currentInput = input;
    setInput('');

    try {
      const result = await askAI(currentInput, imageUrl || undefined);

      // Decrement credit in DB based on actual AI cost (default to 10 if not provided)
      const aiCost = result.cost || 10;
      console.log(`DEDUCTING ${aiCost} CREDITS FROM ${userId}. (REASON: ${result.cost ? 'MANUS_SYNC' : 'SAFE_DEFAULT'})`);

      const { error: rpcError } = await supabase.rpc('decrement_user_credit', { 
        user_uuid: userId,
        amount: aiCost
      });
      
      if (rpcError) {
        console.error('Failed to decrement credits:', rpcError);
      } else {
        // Refresh local credit state
        setCredits(prev => ({ ...prev, daily: prev.daily - aiCost }));
      }

      if (result) {
        let finalContent;
        // If there is a task_url, we want to keep the whole JSON for the card UI
        if (result.task_url) {
          finalContent = JSON.stringify(result);
        } else {
          // Otherwise, just extract the text and append the usage summary
          finalContent = result.text || result.content || (typeof result === 'string' ? result : JSON.stringify(result));
          // Append small, styled credit consumption message
          if (aiCost > 0) {
            finalContent += `\n\n---\n*💰 Consumed ${aiCost} credits*`;
          }
        }
        
        const aiMessage: Message = {
          role: 'assistant',
          content: finalContent,
          timestamp: new Date()
        };
        setMessages(prev => [...prev.filter(m => m.role !== 'system' || m.content !== 'Attaching recent trade context...'), aiMessage]);
      }
    } catch (err: any) {
      console.error('CRITICAL CHAT ERROR:', err); // Log the full error object!
      setMessages(prev => [
        ...prev.filter(m => m.role !== 'system' || m.content !== 'Attaching recent trade context...'), 
        {
          role: 'system',
          content: `Error: ${err.message || 'The AI Mentor is currently unavailable. Check console for details.'}`,
          timestamp: new Date()
        }
      ]);
    }

    // Reset image after sending
    setSelectedImage(null);
    setImagePreview(null);
  };

  if (isPublicPage) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-[380px] h-[550px] bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-xl">
                  <Bot className="text-emerald-500" size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-tight italic">BMFX AI Mentor</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Active Now</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {profile?.role !== 'free' && (
                  <div className={`px-2 py-1 rounded-lg border ${credits.daily < 10 ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      Credits: {credits.daily}/{credits.total}
                    </span>
                  </div>
                )}
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Chat Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-zinc-50/50 dark:bg-zinc-950/20"
            >
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-3xl flex items-center justify-center">
                    <Sparkles className="text-emerald-500" size={32} />
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-900 dark:text-zinc-100">Unlock Trading Insights</h4>
                    <p className="text-xs text-zinc-500 mt-1 uppercase tracking-wider font-medium">Ask me about your recent performance or strategy adjustments.</p>
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div 
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${
                    msg.role === 'user' 
                      ? 'bg-zinc-900 dark:bg-[#7AB8E5] text-white dark:text-zinc-950 font-medium rounded-tr-none'
                      : msg.role === 'system'
                        ? 'bg-zinc-100 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-widest italic border border-zinc-200 dark:border-zinc-800'
                        : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 rounded-tl-none border-l-2 border-l-emerald-500 shadow-sm'
                  }`}>
                    {(() => {
                      try {
                        // Check if content is the Manus Task JSON
                        if (msg.role === 'assistant' && msg.content.includes('task_url')) {
                          const taskData = JSON.parse(msg.content);
                          return (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-emerald-500 mb-1">
                                <Sparkles size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Agent Task Started</span>
                              </div>
                              <p className="text-xs font-bold text-zinc-900 dark:text-white leading-tight">
                                {taskData.task_title || 'Analyzing your request...'}
                              </p>
                              <a 
                                href={taskData.task_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="block w-full py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl text-center text-emerald-500 text-[10px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 shadow-sm"
                              >
                                View Live Progress
                              </a>
                            </div>
                          );
                        }
                      } catch (e) {}
                      return msg.content;
                    })()}
                    {msg.role === 'user' && !msg.content && <span className="italic opacity-50 text-[10px]">Image attached</span>}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl rounded-tl-none p-3 space-y-2 w-full max-w-[80%] border-l-2 border-l-emerald-500">
                    <div className="flex items-center gap-2 mb-1">
                       <Loader2 size={12} className="animate-spin text-emerald-500" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-[#7AB8E5]">AI IS TYPING...</span>
                    </div>
                    <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                    <div className="h-2 w-2/3 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            {loading ? (
              <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-center h-20 shrink-0">
                <Loader2 className="animate-spin text-zinc-400" size={20} />
              </div>
            ) : profile?.role === 'free' ? (
              <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-center shrink-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#7AB8E5] mb-2 font-bold italic">Premium Feature</p>
                <p className="text-xs text-zinc-500 mb-3">AI Mentor is available for Student members. Upgrade to unlock!</p>
                <button className="w-full py-2.5 bg-zinc-900 dark:bg-[#7AB8E5] text-white dark:text-zinc-950 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform active:scale-95 shadow-lg">Become a Student</button>
              </div>
            ) : (
              <form 
                onSubmit={handleSend}
                className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleImageSelect}
                />

                {imagePreview && (
                  <div className="mb-3 relative inline-block group">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-20 h-20 object-cover rounded-xl border-2 border-emerald-500 shadow-lg"
                    />
                    <button 
                      type="button"
                      onClick={() => { setSelectedImage(null); setImagePreview(null); }}
                      className="absolute -top-2 -right-2 bg-rose-500 text-white p-1 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading || isUploading || credits.daily <= 0}
                    className="p-2.5 bg-zinc-100 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:text-emerald-500 transition-colors disabled:opacity-50"
                  >
                    <Paperclip size={18} />
                  </button>
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={credits.daily > 0 ? "Ask your trading mentor..." : "Insufficient credits"}
                    disabled={isLoading || isUploading || credits.daily <= 0 || profile?.role === 'free'}
                    className="flex-1 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50 transition-all font-medium"
                  />
                  <button
                    type="submit"
                    disabled={(isLoading || isUploading) || (!input.trim() && !selectedImage) || credits.daily <= 0}
                    className="p-2.5 bg-zinc-900 dark:bg-emerald-600 text-white rounded-xl hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
                  >
                    {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  </button>
                </div>
                {credits.daily <= 10 && credits.daily > 0 && (
                  <p className="text-[9px] text-amber-500 font-bold uppercase tracking-tighter mt-2 text-center">Warning: Low Credits. Balance resets daily.</p>
                )}
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 group relative ${
          isOpen 
            ? 'bg-zinc-900 text-white rotate-90' 
            : 'bg-emerald-500 text-white dark:bg-zinc-100 dark:text-zinc-900'
        }`}
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} className="group-hover:animate-bounce" />}
        {!isOpen && (
           <div className="absolute -top-2 -right-2 bg-zinc-900 dark:bg-emerald-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-lg border-2 border-white dark:border-zinc-950">
             AI
           </div>
        )}
      </button>
    </div>
  );
};
