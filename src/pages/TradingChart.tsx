import React from 'react';
import AdvancedChart from '../components/AdvancedChart';
import { TrendingUp } from 'lucide-react';

export function TradingChart() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="text-[#9CD5FF] dark:text-emerald-500" />
            Trading Chart
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">
            Analyze markets with premium real-time charts and drawing tools.
          </p>
        </div>
      </div>

      <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-1">
        <AdvancedChart />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <h3 className="font-bold mb-2">Advanced Tools</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Access professional-grade indicators and drawing tools to map out your trade setups.
          </p>
        </div>
        <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <h3 className="font-bold mb-2">Global Markets</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Search for any asset including Forex, Crypto, Stocks, and Commodities via the top-left symbol search.
          </p>
        </div>
        <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <h3 className="font-bold mb-2">Timezone Sync</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Current timezone is locked to Asia/Bangkok for seamless coordination with BMFX sessions.
          </p>
        </div>
      </div>
    </div>
  );
}
