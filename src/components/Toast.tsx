import React, { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border ${
        type === 'success' 
          ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400' 
          : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400'
      }`}
    >
      {type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
      <p className="text-sm font-bold">{message}</p>
      <button 
        onClick={onClose}
        className="ml-2 p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
      >
        <X size={16} />
      </button>
    </motion.div>
  );
}
