import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdvancedChart from '../components/AdvancedChart';
import { TrendingUp, ArrowLeft, Zap, Globe, Clock } from 'lucide-react';

const QUICK_PAIRS = [
  { name: 'BTC/USDT', symbol: 'BINANCE:BTCUSDT' },
  { name: 'ETH/USDT', symbol: 'BINANCE:ETHUSDT' },
  { name: 'Gold', symbol: 'SAXO:XAUUSD' },
  { name: 'EUR/USD', symbol: 'FX:EURUSD' },
  { name: 'GBP/USD', symbol: 'FX:GBPUSD' },
  { name: 'US30', symbol: 'CURRENCYCOM:US30' },
];

export function TradingChart() {
  const navigate = useNavigate();
  const [currentSymbol, setCurrentSymbol] = useState(QUICK_PAIRS[0].symbol);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 md:px-10 lg:px-12 py-8 md:py-16 space-y-10 md:space-y-12">
        {/* Premium Navigation & Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-4 md:gap-5">
              <button 
                onClick={() => navigate('/dashboard')}
                className="p-2.5 md:p-3 bg-zinc-100 dark:bg-zinc-900 hover:bg-[#9CD5FF]/10 dark:hover:bg-emerald-500/10 text-zinc-600 dark:text-zinc-400 hover:text-[#9CD5FF] dark:hover:text-emerald-500 rounded-2xl border border-zinc-200 dark:border-zinc-800 transition-all duration-300 group shadow-sm shrink-0"
                title="Back to Dashboard"
              >
                <ArrowLeft size={18} className="md:size-[20px] group-hover:-translate-x-1 transition-transform" />
              </button>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white truncate">
                Trading Chart
              </h1>
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 max-w-xl text-base md:text-lg leading-relaxed font-medium">
              BMFX's professional-grade analysis suite. Real-time data for elite traders.
            </p>
          </div>

          {/* Quick Switcher - Mobile Swappable (Horizontal Scroll) */}
          <div className="flex flex-col gap-3 min-w-0 lg:items-end w-full lg:w-auto">
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-400 dark:text-zinc-500 px-1 lg:text-right">Market Quick Selection</span>
            <div className="bg-zinc-100/80 dark:bg-zinc-900/80 backdrop-blur-xl p-1.5 rounded-[1.25rem] border border-zinc-200 dark:border-zinc-800 flex items-center gap-1.5 shadow-2xl overflow-x-auto no-scrollbar scroll-smooth">
              <div className="flex items-center gap-1.5 flex-nowrap min-w-max px-0.5">
                {QUICK_PAIRS.map((pair) => (
                  <button
                    key={pair.symbol}
                    onClick={() => setCurrentSymbol(pair.symbol)}
                    className={`px-4 py-2.5 rounded-[0.875rem] text-xs font-bold transition-all duration-300 whitespace-nowrap shrink-0 ${
                      currentSymbol === pair.symbol
                        ? 'bg-white dark:bg-zinc-800 text-[#7AB8E5] dark:text-emerald-400 shadow-lg ring-1 ring-zinc-200/50 dark:ring-zinc-700/50'
                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                    }`}
                  >
                    {pair.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

      {/* Main Chart Section with Premium Framing */}
      <div className="relative isolate">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#9CD5FF]/10 dark:bg-emerald-500/5 rounded-full blur-[100px] -z-10 animate-pulse"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[100px] -z-10 animate-pulse delay-1000"></div>
        
        <div className="relative bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 p-2 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] overflow-hidden">
          <AdvancedChart symbol={currentSymbol} />
        </div>
      </div>

      {/* Premium Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="group p-6 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-[#9CD5FF]/50 dark:hover:border-emerald-500/50 transition-all duration-300">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Zap className="text-blue-500" size={20} />
          </div>
          <h3 className="font-bold mb-2 text-zinc-900 dark:text-zinc-100">Advanced Analysis</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Professional-grade indicators and drawing tools (Fibonacci, Trendlines, Patterns) for precise market mapping.
          </p>
        </div>
        
        <div className="group p-6 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-[#9CD5FF]/50 dark:hover:border-emerald-500/50 transition-all duration-300">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Globe className="text-emerald-500" size={20} />
          </div>
          <h3 className="font-bold mb-2 text-zinc-900 dark:text-zinc-100">Global Coverage</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Instant access to Forex, Crypto, Stocks, and Commodities. Use the top-left symbol search to find any asset.
          </p>
        </div>

        <div className="group p-6 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-[#9CD5FF]/50 dark:hover:border-emerald-500/50 transition-all duration-300">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Clock className="text-amber-500" size={20} />
          </div>
          <h3 className="font-bold mb-2 text-zinc-900 dark:text-zinc-100">Timezone-Specific</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Locked to **Asia/Bangkok** timezone to ensure your analysis perfectly aligns with local market sessions.
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}
