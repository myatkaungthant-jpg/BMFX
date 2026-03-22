import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  formatDistanceToNow, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  format, 
  isSameDay,
  addMonths,
  subMonths,
  addYears,
  subYears,
  startOfWeek
} from 'date-fns';

import { Layout } from '../components/Layout';
import { Toast } from '../components/Toast';
import { useAuth } from '../hooks/useAuth';


import { 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Clock,
  ChevronRight,
  Globe,
  Wallet,
  ArrowUpDown,
  MessageSquare,
  ListFilter,
  LayoutGrid,
  Table as TableIcon,
  Calendar as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  Upload,
  ImageIcon,
  Edit3,
  Trash2,
  Check,
  ChevronsLeft,
  ChevronsRight,
  Calculator
} from 'lucide-react';

import { motion, AnimatePresence } from 'motion/react';
import { PositionSizeCalculator } from '../components/PositionSizeCalculator';





interface Trade {
  id: string;
  symbol: string;
  side: 'Long' | 'Short';
  entry: number;
  sl: number;
  tp: number;
  status: 'Win' | 'Loss' | 'Open';
  mood: string;
  market: string;
  notes: string;
  rulesChecked: boolean[];
  timestamp: Date;
  imageUrl?: string;
  pnlPercentage?: number;
  session?: string;
  exitPrice?: number;
}




export function TradingJournal() {
  const { profile, loading: authLoading } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const user = profile; // Use profile instead of local user state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchTrades = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('trading_logs')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedTrades: Trade[] = data.map(t => ({
          id: t.id,
          symbol: t.symbol,
          side: t.side,
          entry: Number(t.entry),
          sl: Number(t.sl),
          tp: Number(t.tp),
          status: t.status,
          mood: t.mood,
          market: t.market,
          notes: t.notes,
          rulesChecked: t.rules_checked,
          timestamp: new Date(t.timestamp),
          imageUrl: t.image_url,
          pnlPercentage: t.pnl_percentage ? Number(t.pnl_percentage) : undefined,
          session: t.session,
          exitPrice: t.exit_price ? Number(t.exit_price) : undefined
        }));
        setTrades(formattedTrades);
      }
    } catch (error) {
      console.error('Error fetching trades:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (profile?.role === 'free') {
      // Free users can only see up to 2 trades, so we DO fetch, 
      // but maybe it's hanging? Let's just catch and finish.
      if (user) {
        fetchTrades(user.id).finally(() => setLoading(false));
      } else if (authLoading === false) {
        setLoading(false);
      }
    } else if (user) {
      fetchTrades(user.id);
    } else if (authLoading === false) {
      setLoading(false);
    }
  }, [profile?.id, authLoading]);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [newTrade, setNewTrade] = useState({
    symbol: '',
    side: 'Long' as 'Long' | 'Short',
    entry: '',
    sl: '',
    tp: '',
    mood: 'Calm',
    market: 'Forex' as string,
    notes: '',
    rulesChecked: [false, false, false],
    imageUrl: '',
    pnlPercentage: '',
    executionDate: format(new Date(), 'yyyy-MM-dd'),
    executionTime: format(new Date(), 'HH:mm'),
    session: 'Tokyo',
    exitPrice: '',
    isClosed: false
  });

  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [showAllLogs, setShowAllLogs] = useState(false);

  const handleCalendarPrev = () => {
    setShowAllLogs(false);
    setCurrentCalendarDate(subMonths(currentCalendarDate, 1));
  };
  const handleCalendarNext = () => {
    setShowAllLogs(false);
    setCurrentCalendarDate(addMonths(currentCalendarDate, 1));
  };
  const handleCalendarToday = () => {
    setShowAllLogs(false);
    setCurrentCalendarDate(new Date());
  };
  
  const handleYearPrev = () => {
    setShowAllLogs(false);
    setCurrentCalendarDate(subYears(currentCalendarDate, 1));
  };
  const handleYearNext = () => {
    setShowAllLogs(false);
    setCurrentCalendarDate(addYears(currentCalendarDate, 1));
  };

  const [activeView, setActiveView] = useState<'table' | 'gallery' | 'calendar'>('table');
  const [aggregation, setAggregation] = useState<'trades' | 'weeks' | 'months'>('trades');

  const markets = ['Forex', 'Crypto', 'Stocks', 'Indices'];

  const filteredTrades = trades.filter(t => {
    if (showAllLogs && activeView !== 'calendar') return true;
    const tradeDate = new Date(t.timestamp);
    return tradeDate.getMonth() === currentCalendarDate.getMonth() &&
           tradeDate.getFullYear() === currentCalendarDate.getFullYear();
  });




  const moods = [
    { label: 'Calm', color: 'emerald' },
    { label: 'Greedy', color: 'amber' },
    { label: 'Anxious', color: 'rose' },
    { label: 'Aggressive', color: 'zinc' }
  ];

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'Calm': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'Greedy': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'Anxious': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      case 'Aggressive': return 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20';
      default: return 'text-zinc-500 bg-zinc-100';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewTrade({ ...newTrade, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const winRate = filteredTrades.length > 0 
    ? Math.round((filteredTrades.filter(t => t.status === 'Win').length / filteredTrades.length) * 100) 
    : 0;

  
  // Calculate Cumulative PnL Series for the Line Graph
  const pnlSeries = (() => {
    const sorted = [...filteredTrades].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    if (aggregation === 'trades') {
      return sorted.reduce((acc, trade) => {
        const last = acc.length > 0 ? acc[acc.length - 1] : 0;
        let result = 0;
        if (trade.status === 'Win') result = 2.5;
        else if (trade.status === 'Loss') result = -1;
        acc.push(last + result);
        return acc;
      }, [0]);
    }

    // Group by week or month
    const groups: Record<string, number> = {};
    sorted.forEach(trade => {
      const date = aggregation === 'weeks' ? startOfWeek(trade.timestamp) : startOfMonth(trade.timestamp);
      const key = format(date, 'yyyy-MM-dd');
      let result = 0;
      if (trade.status === 'Win') result = 2.5;
      else if (trade.status === 'Loss') result = -1;
      groups[key] = (groups[key] || 0) + result;
    });

    const sortedKeys = Object.keys(groups).sort();
    return sortedKeys.reduce((acc, key) => {
      const last = acc.length > 0 ? acc[acc.length - 1] : 0;
      acc.push(last + groups[key]);
      return acc;
    }, [0]);
  })();

  const totalPnL = pnlSeries.length > 0 ? pnlSeries[pnlSeries.length - 1] : 0;

  const wins = filteredTrades.filter(t => t.status === 'Win').length * 2.5;
  const losses = filteredTrades.filter(t => t.status === 'Loss').length * 1.0;
  const profitFactor = losses === 0 ? (wins > 0 ? wins.toFixed(2) : '0.00') : (wins / losses).toFixed(2);

  // Business Logic: RR & PnL Math Engine
  const calculateRR = () => {
    const entry = parseFloat(newTrade.entry);
    const sl = parseFloat(newTrade.sl);
    const tp = parseFloat(newTrade.tp);

    if (!entry || !sl || !tp || entry === sl) return null;

    if (newTrade.side === 'Long') {
      return ((tp - entry) / (entry - sl)).toFixed(2);
    } else {
      return ((entry - tp) / (sl - entry)).toFixed(2);
    }
  };

  const rrRatio = calculateRR();

  // Handle Auto-PnL Calculation
  useEffect(() => {
    if (newTrade.isClosed && newTrade.entry && newTrade.exitPrice) {
      const entry = parseFloat(newTrade.entry);
      const exit = parseFloat(newTrade.exitPrice);
      
      if (entry > 0) {
        let pnl = ((exit - entry) / entry) * 100;
        if (newTrade.side === 'Short') pnl *= -1;
        setNewTrade(prev => ({ ...prev, pnlPercentage: pnl.toFixed(2) }));
      }
    }
  }, [newTrade.exitPrice, newTrade.isClosed, newTrade.entry, newTrade.side]);

  const handleAddTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert('You must be logged in to add trades.');

    if (user.role === 'free' && trades.length >= 2 && !editingTrade) {
      setToast({ message: 'Free limit reached (2 trades). Upgrade to Student for unlimited logs!', type: 'error' });
      return;
    }

    const tradeData = {
      user_id: user.id,
      symbol: newTrade.symbol || 'UNKNOWN',
      side: newTrade.side,
      entry: Number(newTrade.entry),
      sl: Number(newTrade.sl),
      tp: Number(newTrade.tp),
      status: editingTrade ? editingTrade.status : 'Open' as 'Open' | 'Win' | 'Loss',
      mood: newTrade.mood,
      market: newTrade.market,
      notes: newTrade.notes,
      rules_checked: newTrade.rulesChecked,
      timestamp: new Date(`${newTrade.executionDate}T${newTrade.executionTime}`).toISOString(),
      image_url: newTrade.imageUrl || undefined,
      pnl_percentage: Number(newTrade.pnlPercentage) || undefined,
      session: newTrade.session
    };

    try {
      if (editingTrade) {
        const { data, error } = await supabase
          .from('trading_logs')
          .update(tradeData)
          .eq('id', editingTrade.id)
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setTrades(trades.map(t => t.id === editingTrade.id ? {
            ...editingTrade,
            ...tradeData,
            id: editingTrade.id,
            timestamp: new Date(tradeData.timestamp),
            rulesChecked: tradeData.rules_checked,
            imageUrl: tradeData.image_url,
            pnlPercentage: tradeData.pnl_percentage
          } : t));
        }
      } else {
        const { data, error } = await supabase
          .from('trading_logs')
          .insert(tradeData)
          .select()
          .single();

        if (error) throw error;
        if (data) {
          const newTradeObj: Trade = {
            id: data.id,
            symbol: data.symbol,
            side: data.side,
            entry: Number(data.entry),
            sl: Number(data.sl),
            tp: Number(data.tp),
            status: data.status,
            mood: data.mood,
            market: data.market,
            notes: data.notes,
            rulesChecked: data.rules_checked,
            timestamp: new Date(data.timestamp),
            imageUrl: data.image_url,
            pnlPercentage: data.pnl_percentage ? Number(data.pnl_percentage) : undefined,
            session: data.session
          };
          setTrades([newTradeObj, ...trades]);
        }
      }

      setToast({ message: `Trade Logged Successfully`, type: 'success' });
      setIsDrawerOpen(false);
      setEditingTrade(null);
      setNewTrade({
        symbol: '',
        side: 'Long',
        entry: '',
        sl: '',
        tp: '',
        mood: 'Calm',
        market: 'Forex',
        notes: '',
        rulesChecked: [false, false, false],
        imageUrl: '',
        pnlPercentage: '',
        executionDate: format(new Date(), 'yyyy-MM-dd'),
        executionTime: format(new Date(), 'HH:mm'),
        session: 'Tokyo',
        exitPrice: '',
        isClosed: false
      });
    } catch (error: any) {
      console.error('Error saving trade:', error);
      setToast({ message: error.message || 'Error saving trade', type: 'error' });
    }
  };

  const handleEditTrade = (trade: Trade) => {
    if (user?.role === 'free') {
      setToast({ message: 'Editing is a Student feature. Upgrade to unlock!', type: 'error' });
      return;
    }
    setEditingTrade(trade);
    setNewTrade({
      symbol: trade.symbol,
      side: trade.side,
      entry: trade.entry.toString(),
      sl: trade.sl.toString(),
      tp: trade.tp.toString(),
      mood: trade.mood,
      market: trade.market,
      notes: trade.notes,
      rulesChecked: trade.rulesChecked,
      imageUrl: trade.imageUrl || '',
      pnlPercentage: trade.pnlPercentage?.toString() || '',
      executionDate: format(trade.timestamp, 'yyyy-MM-dd'),
      executionTime: format(trade.timestamp, 'HH:mm'),
      session: trade.session || 'Tokyo',
      exitPrice: trade.exitPrice?.toString() || '',
      isClosed: trade.status !== 'Open'
    });
    setIsDrawerOpen(true);
  };

  const handleDeleteTrade = async (id: string) => {
    if (!user) return;
    if (user.role === 'free') {
      setToast({ message: 'Deleting is a Student feature. Upgrade to unlock!', type: 'error' });
      return;
    }
    if (confirm('Are you sure you want to delete this trade?')) {
      try {
        const { error } = await supabase
          .from('trading_logs')
          .delete()
          .eq('id', id);

        if (error) throw error;
        setTrades(trades.filter(t => t.id !== id));
      } catch (error: any) {
        console.error('Error deleting trade:', error);
        alert('Error deleting trade: ' + error.message);
      }
    }
  };


  const toggleRule = (index: number) => {
    const updated = [...newTrade.rulesChecked];
    updated[index] = !updated[index];
    setNewTrade({ ...newTrade, rulesChecked: updated });
  };



  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8">
        {loading ? (
          <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-[#7AB8E5]/20 border-t-[#7AB8E5] rounded-full animate-spin" />
            <p className="text-zinc-400 font-bold text-xs uppercase tracking-widest animate-pulse">Loading Journal...</p>
          </div>
        ) : !user ? (
          <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-900 rounded-3xl flex items-center justify-center border border-zinc-200 dark:border-zinc-800 shadow-inner">
               <AlertCircle size={40} className="text-zinc-500" />
            </div>
            <div>
              <h2 className="text-2xl font-black italic uppercase tracking-tighter">Authentication Required</h2>
              <p className="text-zinc-400 text-sm mt-1 max-w-xs mx-auto">Please login to your account to access your personal trading journal logs.</p>
            </div>
            <button 
              onClick={() => window.location.href = '/login'}
              className="px-8 py-3 bg-zinc-900 dark:bg-[#7AB8E5] text-white dark:text-zinc-950 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-transform"
            >
              Sign In to Continue
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 italic tracking-tight">PREMIUM JOURNAL</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">Track your psychology and performance.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Quick Actions Bar */}
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-inner">
              <button 
                onClick={() => setActiveView('table')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeView === 'table' 
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200 dark:border-zinc-700' 
                    : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
                }`}
              >
                <TableIcon size={14} />
                <span>Table</span>
              </button>
              <button 
                onClick={() => setActiveView('gallery')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeView === 'gallery' 
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200 dark:border-zinc-700' 
                    : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
                }`}
              >
                <LayoutGrid size={14} />
                <span>Gallery</span>
              </button>
              <button 
                onClick={() => setActiveView('calendar')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeView === 'calendar' 
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200 dark:border-zinc-700' 
                    : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
                }`}
              >
                <CalendarIcon size={14} />
                <span>Journal Calendar</span>
              </button>
            </div>

            {/* Global Date Navigation */}
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-inner">
              <button 
                onClick={handleYearPrev}
                title="Previous Year"
                className="p-2 hover:bg-white dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-[#7AB8E5] transition-all active:scale-95"
              >
                <ChevronsLeft size={16} />
              </button>
              <button 
                onClick={handleCalendarPrev}
                title="Previous Month"
                className="p-2 hover:bg-white dark:hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-[#7AB8E5] transition-all active:scale-95"
              >
                <ArrowUpDown size={16} className="rotate-90" />
              </button>
              <div className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100 min-w-[120px] text-center border-x border-zinc-200 dark:border-zinc-800 mx-1">
                {showAllLogs && activeView !== 'calendar' ? 'All Time' : format(currentCalendarDate, 'MMMM yyyy')}
              </div>
              <button 
                onClick={handleCalendarNext}
                title="Next Month"
                className="p-2 hover:bg-white dark:hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-[#7AB8E5] transition-all active:scale-95"
              >
                <ArrowUpDown size={16} className="-rotate-90" />
              </button>
              <button 
                onClick={handleYearNext}
                title="Next Year"
                className="p-2 hover:bg-white dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-[#7AB8E5] transition-all active:scale-95"
              >
                <ChevronsRight size={16} />
              </button>
              
              <div className="ml-1 flex gap-1">
                <button 
                  onClick={handleCalendarToday}
                  className="px-3 py-2 hover:bg-white dark:hover:bg-zinc-800 rounded-lg text-[10px] font-black uppercase tracking-widest text-[#7AB8E5] transition-all active:scale-95 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
                >
                  Today
                </button>
                <button 
                  onClick={() => setShowAllLogs(!showAllLogs)}
                  className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 border ${
                    showAllLogs && activeView !== 'calendar'
                      ? 'bg-[#7AB8E5] text-white border-[#7AB8E5]' 
                      : 'text-zinc-400 hover:bg-white dark:hover:bg-zinc-800 hover:text-zinc-600 border-transparent hover:border-zinc-200 dark:hover:border-zinc-700'
                  }`}
                >
                  All Logs
                </button>
              </div>
            </div>

            {user?.role === 'free' && trades.length >= 2 ? (
              <div className="flex flex-col items-end gap-1">
                <button 
                  disabled
                  className="flex items-center gap-2 bg-zinc-400 dark:bg-zinc-800 text-zinc-200 dark:text-zinc-500 px-6 py-2.5 rounded-xl font-bold cursor-not-allowed opacity-50"
                >
                  <Plus size={20} />
                  <span>Limit Reached</span>
                </button>
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">Upgrade for more</span>
              </div>
            ) : (
              <button 
                onClick={() => setIsDrawerOpen(true)}
                className="flex items-center gap-2 bg-zinc-900 dark:bg-[#7AB8E5] text-white dark:text-zinc-950 px-6 py-2.5 rounded-xl font-bold hover:scale-105 transition-transform active:scale-95 shadow-lg shadow-zinc-900/10 dark:shadow-[#7AB8E5]/20"
              >
                <Plus size={20} />
                <span>Add Entry</span>
              </button>
            )}
          </div>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <TrendingUpIcon size={48} className="text-emerald-500" />
            </div>
            
            <p className="text-zinc-400 text-sm font-medium uppercase tracking-wider">Total PnL</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-4xl font-black italic ${totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {totalPnL >= 0 ? '+' : ''}{totalPnL}R
              </span>
              <span className="text-xs text-zinc-500">Based on Risk Units</span>
            </div>
          </div>


          <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 shadow-xl flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-sm font-medium uppercase tracking-wider">Win Rate</p>
              <div className="mt-2">
                 <span className="text-4xl font-bold text-zinc-100">{winRate}%</span>
              </div>
            </div>
            <div className="relative h-20 w-20">
              <svg className="h-full w-full" viewBox="0 0 36 36">
                <path
                  className="text-zinc-800"
                  strokeDasharray="100, 100"
                  strokeWidth="3"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-500 transition-all duration-1000 ease-out"
                  strokeDasharray={`${winRate}, 100`}
                  strokeWidth="3"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
            </div>
          </div>

          <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 shadow-xl flex flex-col justify-between">
             <div>
                <p className="text-zinc-400 text-sm font-medium uppercase tracking-wider">Profit Factor</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-[#7AB8E5]">{profitFactor}</span>
                  <span className="text-xs text-zinc-500">Gross Profit / Loss</span>
                </div>
             </div>
             <div className="mt-4 h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-[#7AB8E5]" style={{ width: '65%' }}></div>
             </div>
          </div>
        </div>

        {/* Detailed Equity Curve Section - Only in Table View */}

        <AnimatePresence>
          {activeView === 'table' && (
            <motion.div 
              initial={{ height: 0, opacity: 0, marginBottom: 0 }}
              animate={{ height: 'auto', opacity: 1, marginBottom: 32 }}
              exit={{ height: 0, opacity: 0, marginBottom: 0 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm overflow-hidden"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                  <h2 className="text-xl font-black italic uppercase tracking-tighter">Equity Curve</h2>
                  <p className="text-xs text-zinc-400 font-bold mt-1">Cumulative performance trend over time.</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  {/* Aggregation Toggle */}
                  <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-inner">
                    <button 
                      onClick={() => setAggregation('trades')}
                      className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                        aggregation === 'trades' 
                          ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm' 
                          : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                      }`}
                    >
                      Trades
                    </button>
                    <button 
                      onClick={() => setAggregation('weeks')}
                      className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                        aggregation === 'weeks' 
                          ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm' 
                          : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                      }`}
                    >
                      Weeks
                    </button>
                    <button 
                      onClick={() => setAggregation('months')}
                      className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                        aggregation === 'months' 
                          ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm' 
                          : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                      }`}
                    >
                      Months
                    </button>
                  </div>

                  <div className="flex items-center gap-2 px-4 py-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                     <div className={`w-2 h-2 rounded-full ${totalPnL >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                     <span className="text-[10px] font-black uppercase tracking-widest">{totalPnL >= 0 ? 'Profit Growth' : 'Recovery Phase'}</span>
                  </div>
                </div>
              </div>

              <div className="h-48 w-full relative">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 100 200" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="mainPnlGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor={totalPnL >= 0 ? '#10b981' : '#f43f5e'} stopOpacity="0.15" />
                      <stop offset="100%" stopColor={totalPnL >= 0 ? '#10b981' : '#f43f5e'} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  
                  {/* Reference Lines */}
                  <line x1="0" y1="50%" x2="100%" y2="50%" stroke="currentColor" className="text-zinc-100 dark:text-zinc-800" strokeWidth="1" strokeDasharray="4 4" />
                  
                  {/* Area */}
                  {pnlSeries.length > 1 && (
                    <motion.path
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 1 }}
                      d={`
                        M 0,192
                        ${pnlSeries.map((val, i) => {
                          const x = (i / (pnlSeries.length - 1)) * 100;
                          const min = Math.min(...pnlSeries);
                          const max = Math.max(...pnlSeries);
                          const range = Math.max(max - min, 5) || 1;
                          const y = 160 - ((val - min) / range) * 140;
                          return `L ${x},${y}`;
                        }).join(' ')}
                        L 100,192 Z
                      `}
                      fill="url(#mainPnlGradient)"
                    />
                  )}

                  {/* Path */}
                  {pnlSeries.length > 1 && (
                    <motion.path
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 2, ease: "circOut" }}
                      stroke={totalPnL >= 0 ? '#10b981' : '#f43f5e'}
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                      d={pnlSeries.map((val, i) => {
                        const x = (i / (pnlSeries.length - 1)) * 100;
                        const min = Math.min(...pnlSeries);
                        const max = Math.max(...pnlSeries);
                        const range = Math.max(max - min, 5) || 1;
                        const y = 160 - ((val - min) / range) * 140;
                        return (i === 0 ? `M ${x},${y}` : `L ${x},${y}`);
                      }).join(' ')}
                    />
                  )}

                  {/* Data Points */}
                  {pnlSeries.length > 1 && pnlSeries.map((val, i) => {
                    const x = (i / (pnlSeries.length - 1)) * 100;
                    const min = Math.min(...pnlSeries);
                    const max = Math.max(...pnlSeries);
                    const range = Math.max(max - min, 5) || 1;
                    const y = 160 - ((val - min) / range) * 140;
                    return (
                      <circle 
                        key={i} 
                        cx={x} 
                        cy={y} 
                        r="4" 
                        className={`${totalPnL >= 0 ? 'fill-emerald-500' : 'fill-rose-500'} stroke-white dark:stroke-zinc-900 stroke-2 opacity-0 hover:opacity-100 transition-opacity cursor-crosshair`}
                      >
                        <title>{val}R</title>
                      </circle>
                    );
                  })}
                </svg>
              </div>
              
              <div className="mt-8 flex justify-between items-center border-t border-zinc-100 dark:border-zinc-800 pt-6">
                 <div className="flex gap-8">
                    <div>
                       <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Drawdown</p>
                       <p className="text-sm font-bold text-rose-500">0.0R</p>
                    </div>
                    <div>
                       <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Growth</p>
                       <p className="text-sm font-bold text-emerald-500">+{totalPnL.toFixed(1)}R</p>
                    </div>
                 </div>
                 <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Values calculated in real-time</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>


        {/* Content Render Switcher */}
        {activeView === 'table' ? (
          <div className="bg-white dark:bg-zinc-900/50 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
              <h2 className="text-xl font-bold">Recent Trade Logs</h2>
              <div className="flex gap-2">
                 <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-xs font-medium text-zinc-500 uppercase tracking-tighter">Filter: All</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-zinc-500 text-xs font-bold uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800/50">
                    <th className="px-6 py-4">Symbol</th>
                    <th className="px-6 py-4">Date / Time</th>
                    <th className="px-6 py-4">Entry / Targets</th>

                    <th className="px-6 py-4">Mood</th>
                    <th className="px-6 py-4">Rules</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>

                  </tr>

                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                  {filteredTrades.map((trade) => (
                    <tr key={trade.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${trade.side === 'Long' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                            {trade.side === 'Long' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                          </div>
                          <div>
                            <p className="font-bold text-sm tracking-tight italic uppercase">{trade.symbol}</p>
                            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{trade.market}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-sm tracking-tight">{format(trade.timestamp, 'MMM d, yyyy')}</p>
                          <p className="text-[10px] text-[#7AB8E5] font-black uppercase tracking-widest">
                            {format(trade.timestamp, 'HH:mm')}
                          </p>
                        </div>
                      </td>


                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div>
                             <p className="text-xs text-zinc-400 font-medium mb-1 uppercase tracking-tighter flex items-center gap-1"><Clock size={10}/> Entry</p>
                             <p className="font-mono text-xs">{trade.entry}</p>
                          </div>
                          <ChevronRight size={12} className="text-zinc-300" />
                          <div>
                             <p className="text-xs text-zinc-400 font-medium mb-1 uppercase tracking-tighter flex items-center gap-1"><Target size={10}/> SL/TP</p>
                             <p className="font-mono text-xs text-zinc-400">{trade.sl} / <span className="text-emerald-500">{trade.tp}</span></p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getMoodColor(trade.mood)}`}>
                          {trade.mood}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1">
                          {trade.rulesChecked.map((checked, i) => (
                            <div 
                              key={i} 
                              className={`w-2 h-2 rounded-full ${checked ? 'bg-emerald-500' : 'bg-red-400'}`} 
                              title={`Rule ${i+1}: ${checked ? 'Passed' : 'Failed'}`}
                            />
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`
                          px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest
                          ${trade.status === 'Win' ? 'bg-emerald-500 text-white' : ''}
                          ${trade.status === 'Loss' ? 'bg-rose-500 text-white' : ''}
                          ${trade.status === 'Open' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500' : ''}
                        `}>
                          {trade.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                           <button onClick={() => handleEditTrade(trade)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors">
                             <Edit3 size={14} />
                           </button>
                           <button onClick={() => handleDeleteTrade(trade.id)} className="p-2 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-lg text-rose-500 transition-colors">
                             <Trash2 size={14} />
                           </button>
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeView === 'gallery' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTrades.map((trade) => (
              <div 
                key={trade.id} 
                className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-[#7AB8E5]/5 transition-all flex flex-col"
              >
                {/* Visual Header (Image) */}
                <div className="aspect-[16/9] bg-zinc-100 dark:bg-zinc-950 relative overflow-hidden flex items-center justify-center">
                  {trade.imageUrl ? (
                    <img 
                      src={trade.imageUrl} 
                      alt={trade.symbol} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 opacity-20">
                      <LayoutGrid size={48} />
                      <span className="text-[10px] font-black uppercase tracking-widest">No chart attached</span>
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-zinc-900/80 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] text-white font-black uppercase tracking-widest border border-white/10 z-10">
                    {trade.market}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6 flex-1 flex flex-col">
                  {/* Symbol and Icon */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 flex items-center justify-center text-zinc-500">
                      <Globe size={20} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black italic tracking-tighter leading-none">{trade.symbol.includes('/') ? trade.symbol : `${trade.symbol.slice(0,-4)}/${trade.symbol.slice(-4)}`}</h3>
                      <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">
                        {format(new Date(trade.timestamp), 'MMMM d, yyyy')}
                      </p>
                    </div>
                  </div>

                  {/* Financials */}
                  <div className="space-y-4 mb-6">
                    <div>
                      <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest leading-none mb-1">Result</p>
                      <p className={`text-2xl font-black italic tracking-tighter ${trade.status === 'Win' ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {trade.status === 'Win' ? '+' : ''}{trade.status === 'Win' ? (trade.entry * 0.05).toFixed(2) : (trade.entry * -0.02).toFixed(2)} USD
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest leading-none mb-1">Percentage</p>
                      <p className={`text-lg font-bold ${trade.status === 'Win' ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {trade.pnlPercentage ? `${trade.pnlPercentage}%` : trade.status === 'Win' ? '3.45%' : '-1.00%'}
                      </p>
                    </div>
                  </div>

                  {/* Meta Tags */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${trade.side === 'Long' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                      {trade.side}
                    </span>
                    <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-transparent">
                       {trade.market}
                    </span>
                  </div>

                  {/* Status Indicator */}
                  <div className="mt-auto pt-6 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${trade.status === 'Win' ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-200 dark:border-zinc-700'}`}>
                          {trade.status === 'Win' && <Check size={14} className="text-white" />}
                       </div>
                       <span className="text-xs font-black uppercase tracking-widest italic">Win</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleEditTrade(trade)}
                        className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteTrade(trade.id)}
                        className="p-2 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-xl text-rose-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

        ) : (

          <div className="bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black italic uppercase tracking-tighter">Journal Calendar</h2>
                <p className="text-xs text-zinc-400 font-bold mt-1">Daily trading performance.</p>
              </div>

              <div className="flex items-center gap-4 text-xs font-bold text-zinc-500">
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Profits</span>
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500" /> Losses</span>
              </div>
            </div>

            {/* Monthly Calendar View */}
            <div className="grid grid-cols-7 border-t border-l border-zinc-100 dark:border-zinc-800">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-zinc-400 border-r border-b border-zinc-100 dark:border-zinc-800">
                  {day}
                </div>
              ))}
              
              {/* Dynamic Calendar Generation slice */}
              {(() => {
                const monthStart = startOfMonth(currentCalendarDate);
                const monthEnd = endOfMonth(currentCalendarDate);
                const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
                
                // Add padding for start of month
                const startPadding = Array.from({ length: monthStart.getDay() });
                
                return [
                  ...startPadding.map((_, i) => (
                    <div key={`pad-${i}`} className="min-h-[120px] bg-zinc-50/50 dark:bg-zinc-900/10 border-r border-b border-zinc-100 dark:border-zinc-800" />
                  )),
                  ...daysInMonth.map(day => {
                    const dayTrades = trades.filter(t => isSameDay(new Date(t.timestamp), day));
                    const dailyPnL = dayTrades.reduce((acc, t) => {
                      if (t.status === 'Win') return acc + 2.5; // Mock R-units as per existing logic
                      if (t.status === 'Loss') return acc - 1;
                      return acc;
                    }, 0);

                    return (
                      <div key={day.toString()} className="min-h-[120px] p-2 border-r border-b border-zinc-100 dark:border-zinc-800 flex flex-col group hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-xs font-bold ${isSameDay(day, new Date()) ? 'bg-zinc-900 dark:bg-[#7AB8E5] text-white dark:text-zinc-950 w-6 h-6 rounded-full flex items-center justify-center' : 'text-zinc-400'}`}>
                            {format(day, 'd')}
                          </span>
                          {dailyPnL !== 0 && (
                            <div className={`px-1.5 py-0.5 rounded text-[10px] font-black italic tracking-tighter ${dailyPnL > 0 ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
                              {dailyPnL > 0 ? '+' : ''}{dailyPnL}R
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 space-y-2 overflow-hidden">
                          {dayTrades.slice(0, 2).map(t => (
                            <div 
                              key={t.id} 
                              onClick={() => handleEditTrade(t)}
                              className="group/card flex flex-col p-2 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700 shadow-sm transition-all hover:ring-2 hover:ring-[#7AB8E5]/30 cursor-pointer relative"
                            >
                              <div className="flex justify-between items-start mb-1">
                                <div>
                                  <p className="text-[9px] font-black italic tracking-tighter uppercase leading-none">{t.symbol}</p>
                                  <p className="text-[7px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">{t.market}</p>
                                </div>
                                <div className={`px-1 rounded-[4px] text-[7px] font-black uppercase tracking-widest ${t.side === 'Long' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                  {t.side}
                                </div>
                              </div>
                              
                              {t.notes && (
                                <p className="text-[7px] text-zinc-500 line-clamp-2 leading-tight mb-1">{t.notes}</p>
                              )}
                              
                              <div className="flex justify-between items-center mt-auto">
                                <div className="flex flex-col">
                                   <p className={`text-[8px] font-black italic tracking-tighter leading-none ${t.status === 'Win' ? 'text-emerald-500' : t.status === 'Loss' ? 'text-rose-500' : 'text-zinc-500'}`}>
                                     {t.status === 'Win' ? '+' : ''}{t.pnlPercentage ? `${t.pnlPercentage}%` : t.status === 'Win' ? '2.5R' : '-1.0R'}
                                   </p>
                                   <div className="flex items-center gap-1 mt-0.5">
                                      <div className={`px-1 py-0.5 rounded-[3px] text-[6px] font-black uppercase tracking-widest bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400`}>
                                        {t.session || 'Tokyo'}
                                      </div>
                                   </div>
                                </div>
                                <div className={`w-3 h-3 rounded flex items-center justify-center border ${t.status === 'Win' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-zinc-200 dark:border-zinc-600'}`}>
                                  {t.status === 'Win' && <Check size={8} />}
                                </div>
                              </div>
                              
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteTrade(t.id); }}
                                className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center shadow-lg"
                              >
                                <X size={10} />
                              </button>
                            </div>
                          ))}
                          {dayTrades.length > 2 && (
                            <p className="text-[8px] text-zinc-400 font-bold text-center">+{dayTrades.length - 2} more entries</p>
                          )}
                        </div>

                      </div>
                    );
                  })
                ];
              })()}
            </div>
          </div>
        )}



        {/* Side Drawer */}
        <div className={`
          fixed inset-0 z-[60] flex justify-end transition-opacity duration-300
          ${isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}>
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsDrawerOpen(false)}
          />
          <div className={`
            relative w-full max-w-md bg-white dark:bg-zinc-950 h-full shadow-2xl flex flex-col p-8 transition-transform duration-500 ease-out
            ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}
          `}>
             <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 dark:bg-[#7AB8E5] flex items-center justify-center text-white dark:text-zinc-950">
                    <Activity size={24} />
                  </div>
                  <h2 className="text-2xl font-black tracking-tight uppercase">{editingTrade ? 'Edit Trade' : 'New Trade'}</h2>

                </div>
                <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-full transition-colors">
                  <X />
                </button>
             </div>

             <form onSubmit={handleAddTrade} className="space-y-0 flex-1 overflow-y-auto pr-4 -mr-4 custom-scrollbar">
                {/* Property List Style */}
                <div className="space-y-1">
                  {/* Session */}
                  <div className="group flex items-center min-h-[44px] hover:bg-zinc-50 dark:hover:bg-zinc-900/50 rounded-lg px-2 transition-colors">
                    <div className="w-32 flex items-center gap-2 text-zinc-500 text-sm">
                      <Clock size={16} />
                      <span>Session</span>
                    </div>
                    <div className="flex-1 flex gap-2">
                       {['Tokyo', 'London', 'New York'].map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setNewTrade({...newTrade, session: s})}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all border ${
                            newTrade.session === s 
                              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-transparent hover:border-zinc-300'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Symbol */}

                  <div className="group flex items-center min-h-[44px] hover:bg-zinc-50 dark:hover:bg-zinc-900/50 rounded-lg px-2 transition-colors">
                    <div className="w-32 flex items-center gap-2 text-zinc-500 text-sm">
                      <Globe size={16} />
                      <span>Symbol</span>
                    </div>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. BTCUSDT"
                      value={newTrade.symbol}
                      onChange={(e) => setNewTrade({...newTrade, symbol: e.target.value})}
                      className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium placeholder-zinc-300 dark:placeholder-zinc-700"
                    />
                  </div>

                  {/* Market */}
                  <div className="group flex items-center min-h-[44px] hover:bg-zinc-50 dark:hover:bg-zinc-900/50 rounded-lg px-2 transition-colors">
                    <div className="w-32 flex items-center gap-2 text-zinc-500 text-sm">
                      <ListFilter size={16} />
                      <span>Market</span>
                    </div>
                    <div className="flex-1 flex gap-2">
                      {markets.map(m => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setNewTrade({...newTrade, market: m})}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all border ${
                            newTrade.market === m 
                              ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-transparent hover:border-zinc-300'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Side */}
                  <div className="group flex items-center min-h-[44px] hover:bg-zinc-50 dark:hover:bg-zinc-900/50 rounded-lg px-2 transition-colors">
                    <div className="w-32 flex items-center gap-2 text-zinc-500 text-sm">
                      <ArrowUpDown size={16} />
                      <span>Side</span>
                    </div>
                    <div className="flex-1 flex gap-1">
                      <button 
                        type="button"
                        onClick={() => setNewTrade({...newTrade, side: 'Long'})}
                        className={`px-3 py-1 rounded text-xs font-bold transition-all ${newTrade.side === 'Long' ? 'bg-emerald-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}
                      >Long</button>
                      <button 
                        type="button"
                        onClick={() => setNewTrade({...newTrade, side: 'Short'})}
                        className={`px-3 py-1 rounded text-xs font-bold transition-all ${newTrade.side === 'Short' ? 'bg-rose-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}
                      >Short</button>
                    </div>
                  </div>

                  {/* Status (Edit Mode Only or for Historical Logging) */}
                  {editingTrade && (
                    <div className="group flex items-center min-h-[44px] hover:bg-zinc-50 dark:hover:bg-zinc-900/50 rounded-lg px-2 transition-colors">
                      <div className="w-32 flex items-center gap-2 text-zinc-500 text-sm">
                        <CheckCircle2 size={16} />
                        <span>Status</span>
                      </div>
                      <div className="flex-1 flex gap-2">
                        {['Open', 'Win', 'Loss'].map(s => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setEditingTrade({...editingTrade, status: s as any})}
                            className={`px-3 py-1 rounded text-[10px] font-bold transition-all border ${
                              editingTrade.status === s 
                                ? s === 'Win' ? 'bg-emerald-500 text-white border-emerald-500' : s === 'Loss' ? 'bg-rose-500 text-white border-rose-500' : 'bg-zinc-900 text-white border-zinc-900'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-transparent hover:border-zinc-300'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}


                  {/* Position Size Calculator Tool */}
                  <div className="py-4 border-b border-zinc-100 dark:border-zinc-900 px-2">
                    <PositionSizeCalculator 
                      entry={newTrade.entry}
                      sl={newTrade.sl}
                      tp={newTrade.tp}
                    />
                  </div>

                  {/* Entry */}
                  <div className="group flex items-center min-h-[44px] hover:bg-zinc-50 dark:hover:bg-zinc-900/50 rounded-lg px-2 transition-colors">
                    <div className="w-32 flex items-center gap-2 text-zinc-500 text-sm">
                      <Wallet size={16} />
                      <span>Entry</span>
                    </div>
                    <input 
                      type="number" 
                      step="any"
                      required
                      placeholder="0.00"
                      value={newTrade.entry}
                      onChange={(e) => setNewTrade({...newTrade, entry: e.target.value})}
                      className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-mono placeholder-zinc-300"
                    />
                  </div>

                  {/* PnL Percentage */}
                  <div className="group flex flex-col gap-2 min-h-[44px] hover:bg-zinc-50 dark:hover:bg-zinc-900/50 rounded-lg px-2 py-2 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="w-32 flex items-center gap-2 text-zinc-500 text-sm">
                        <TrendingUp size={16} />
                        <span>Closed Trade?</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNewTrade(prev => ({ ...prev, isClosed: !prev.isClosed }))}
                        className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          newTrade.isClosed ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-800'
                        }`}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          newTrade.isClosed ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    {newTrade.isClosed && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-2 mt-2"
                      >
                        <div className="flex items-center">
                          <div className="w-32 flex items-center gap-2 text-zinc-500 text-xs pl-6">
                            <span>Exit Price</span>
                          </div>
                          <input 
                            type="number" 
                            step="any"
                            placeholder="0.00"
                            value={newTrade.exitPrice}
                            onChange={(e) => setNewTrade({...newTrade, exitPrice: e.target.value})}
                            className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-mono placeholder-zinc-300"
                          />
                        </div>
                        <div className="flex items-center">
                          <div className="w-32 flex items-center gap-2 text-zinc-500 text-xs pl-6">
                            <span>Final PnL %</span>
                          </div>
                          <input 
                            type="number" 
                            step="0.01"
                            placeholder="e.g. 3.45"
                            value={newTrade.pnlPercentage}
                            onChange={(e) => setNewTrade({...newTrade, pnlPercentage: e.target.value})}
                            className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-mono placeholder-zinc-300 text-emerald-500"
                          />
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Image Upload */}
                  <div className="group flex flex-col gap-2 min-h-[44px] hover:bg-zinc-50 dark:hover:bg-zinc-900/50 rounded-lg px-2 py-3 transition-colors">
                    <div className="flex items-center gap-2 text-zinc-500 text-sm">
                      <ImageIcon size={16} />
                      <span>Trade Image</span>
                    </div>
                    
                    <div className="flex flex-col gap-3">
                      {newTrade.imageUrl ? (
                        <div className="relative aspect-video rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
                          <img src={newTrade.imageUrl} alt="Trade Preview" className="w-full h-full object-cover" />
                          <button 
                            type="button"
                            onClick={() => setNewTrade({...newTrade, imageUrl: ''})}
                            className="absolute top-2 right-2 p-1.5 bg-zinc-900/80 text-white rounded-full hover:bg-zinc-900 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center aspect-video rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-[#7AB8E5] transition-colors cursor-pointer group/label">
                           <Upload size={24} className="text-zinc-300 group-hover/label:text-[#7AB8E5] transition-colors" />
                           <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-2">Click to upload chart</span>
                           <input 
                             type="file" 
                             className="hidden" 
                             accept="image/*"
                             onChange={handleFileChange}
                           />
                        </label>
                      )}
                    </div>
                  </div>



                  {/* Execution Time & Date */}
                  <div className="grid grid-cols-2 gap-1">
                    <div className="group flex items-center min-h-[44px] hover:bg-zinc-50 dark:hover:bg-zinc-900/50 rounded-lg px-2 transition-colors">
                      <div className="w-12 flex items-center gap-2 text-zinc-500 text-sm">
                        <CalendarIcon size={16} />
                      </div>
                      <input 
                        type="date" 
                        required
                        value={newTrade.executionDate}
                        onChange={(e) => setNewTrade({...newTrade, executionDate: e.target.value})}
                        className="flex-1 bg-transparent border-none focus:ring-0 text-[10px] font-bold uppercase tracking-widest text-zinc-900 dark:text-zinc-100"
                      />
                    </div>
                    <div className="group flex items-center min-h-[44px] hover:bg-zinc-50 dark:hover:bg-zinc-900/50 rounded-lg px-2 transition-colors">
                      <div className="w-12 flex items-center gap-2 text-zinc-500 text-sm">
                        <Clock size={16} />
                      </div>
                      <input 
                        type="time" 
                        required
                        value={newTrade.executionTime}
                        onChange={(e) => setNewTrade({...newTrade, executionTime: e.target.value})}
                        className="flex-1 bg-transparent border-none focus:ring-0 text-[10px] font-bold uppercase tracking-widest text-zinc-900 dark:text-zinc-100"
                      />
                    </div>
                  </div>

                  {/* Limits (SL/TP) */}
                  <div className="group flex items-center min-h-[44px] hover:bg-zinc-50 dark:hover:bg-zinc-900/50 rounded-lg px-2 transition-colors">
                    <div className="w-32 flex items-center gap-2 text-zinc-500 text-sm">
                      <Target size={16} />
                      <span>Limits</span>
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                       <input 
                        type="number" 
                        step="any"
                        placeholder="SL"
                        value={newTrade.sl}
                        onChange={(e) => setNewTrade({...newTrade, sl: e.target.value})}
                        className="w-24 bg-transparent border-none focus:ring-0 text-sm font-mono text-rose-500 placeholder-rose-300/50"
                      />
                      <span className="text-zinc-300">/</span>
                      <input 
                        type="number" 
                        step="any"
                        placeholder="TP"
                        value={newTrade.tp}
                        onChange={(e) => setNewTrade({...newTrade, tp: e.target.value})}
                        className="w-24 bg-transparent border-none focus:ring-0 text-sm font-mono text-emerald-500 placeholder-emerald-300/50"
                      />
                      {rrRatio && (
                        <div className="ml-auto px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[10px] font-black text-emerald-500 animate-in fade-in zoom-in duration-300">
                          {rrRatio} RR
                        </div>
                      )}
                    </div>
                  </div>


                  {/* Mood */}
                  <div className="group flex items-center min-h-[44px] hover:bg-zinc-50 dark:hover:bg-zinc-900/50 rounded-lg px-2 transition-colors">
                    <div className="w-32 flex items-center gap-2 text-zinc-500 text-sm">
                      <Activity size={16} />
                      <span>Mood</span>
                    </div>
                    <div className="flex-1 flex gap-2">
                      {moods.map((m) => (
                        <button 
                          key={m.label}
                          type="button"
                          onClick={() => setNewTrade({...newTrade, mood: m.label})}
                          className={`
                            px-2 py-0.5 rounded text-[10px] font-bold border transition-all
                            ${newTrade.mood === m.label 
                              ? `${getMoodColor(m.label)} border-current` 
                              : 'bg-zinc-100 dark:bg-zinc-800 border-transparent text-zinc-400'
                            }
                          `}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Rules */}
                  <div className="py-4 mt-4 border-t border-zinc-100 dark:border-zinc-900">
                    <div className="flex items-center gap-2 text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-3 px-2">
                      <CheckCircle2 size={12} />
                      <span>Checklist</span>
                    </div>
                    <div className="space-y-1">
                      {['HTF Analysis', 'Confluence', 'Risk Managed'].map((rule, i) => (
                        <button 
                          key={i}
                          type="button"
                          onClick={() => toggleRule(i)}
                          className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-all text-left group"
                        >
                          <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${newTrade.rulesChecked[i] ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-zinc-200 dark:border-zinc-700'}`}>
                             {newTrade.rulesChecked[i] && <CheckCircle2 size={10} />}
                          </div>
                          <span className={`text-xs font-medium ${newTrade.rulesChecked[i] ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500'}`}>{rule}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comments/Notes */}
                  <div className="mt-4 pt-6 border-t border-zinc-100 dark:border-zinc-900">
                    <div className="flex items-center gap-2 text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-3 px-2">
                      <MessageSquare size={12} />
                      <span>Journal / Comments</span>
                    </div>
                    <textarea 
                      placeholder="Add reflections, thoughts, or observations..."
                      value={newTrade.notes}
                      onChange={(e) => setNewTrade({...newTrade, notes: e.target.value})}
                      className="w-full bg-transparent border-none focus:ring-0 text-sm min-h-[120px] resize-none placeholder-zinc-300 dark:placeholder-zinc-700 p-2"
                    />
                  </div>
                </div>

                <div className="pt-8 pb-4">
                   <button 
                    type="submit"
                    className="w-full bg-zinc-900 dark:bg-[#7AB8E5] text-white dark:text-zinc-950 py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-xl shadow-zinc-900/10 dark:shadow-[#7AB8E5]/10 hover:brightness-110 transition-all active:scale-[0.98]"
                   >
                     Log {editingTrade ? 'Update' : 'Entry'}
                   </button>

                </div>
             </form>

          </div>
        </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(null)} 
          />
        )}
      </AnimatePresence>
    </Layout>
  );
}
