import React, { useState, useEffect } from 'react';
import { Calculator, Target, Wallet, Percent, ArrowRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PositionSizeCalculatorProps {
  entry: string;
  sl: string;
  tp: string;
  // No onApply needed anymore as we use the main form fields directly
}

export const PositionSizeCalculator: React.FC<PositionSizeCalculatorProps> = ({ 
  entry, 
  sl, 
  tp
}) => {
  const [balance, setBalance] = useState('10000');
  const [riskPercent, setRiskPercent] = useState('1');
  const [result, setResult] = useState<{
    units: number;
    lots: number;
    riskAmount: number;
    rewardAmount: number;
    rr: number;
  } | null>(null);

  useEffect(() => {
    calculate();
  }, [balance, riskPercent, entry, sl, tp]);

  const calculate = () => {
    const b = parseFloat(balance);
    const r = parseFloat(riskPercent);
    const e = parseFloat(entry);
    const s = parseFloat(sl);
    const t = parseFloat(tp);

    if (b > 0 && r > 0 && e > 0 && s > 0 && e !== s) {
      const riskAmount = b * (r / 100);
      const priceDiffSL = Math.abs(e - s);
      const units = riskAmount / priceDiffSL;
      const lots = units / 100000; // Standard Forex Lot

      let rewardAmount = 0;
      let rr = 0;
      if (t > 0 && e !== t) {
        const priceDiffTP = Math.abs(e - t);
        rewardAmount = units * priceDiffTP;
        rr = priceDiffTP / priceDiffSL;
      }

      setResult({
        units: parseFloat(units.toFixed(2)),
        lots: parseFloat(lots.toFixed(3)),
        riskAmount: parseFloat(riskAmount.toFixed(2)),
        rewardAmount: parseFloat(rewardAmount.toFixed(2)),
        rr: parseFloat(rr.toFixed(2))
      });
    } else {
      setResult(null);
    }
  };

  return (
    <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 bg-[#7AB8E5]/10 rounded-lg text-[#7AB8E5]">
          <Calculator size={16} />
        </div>
        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">Position Size Calculator</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5 px-1">
            <Wallet size={10} /> Balance ($)
          </label>
          <input 
            type="number"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-[#7AB8E5]/20 focus:outline-none"
            placeholder="10000"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5 px-1">
            <Percent size={10} /> Risk (%)
          </label>
          <input 
            type="number"
            value={riskPercent}
            onChange={(e) => setRiskPercent(e.target.value)}
            className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-[#7AB8E5]/20 focus:outline-none"
            placeholder="1"
          />
        </div>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-4 p-4 bg-zinc-900 rounded-xl border border-zinc-800 space-y-3"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="flex justify-between items-center bg-rose-500/5 p-2 rounded-lg border border-rose-500/10">
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-500/60">Risk:</span>
                <span className="text-xs font-black text-rose-500">${result.riskAmount}</span>
              </div>
              <div className="flex justify-between items-center bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/10">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500/60">Reward:</span>
                <span className="text-xs font-black text-emerald-500">${result.rewardAmount}</span>
              </div>
            </div>

            {result.rr > 0 && (
              <div className="flex justify-center">
                <span className="px-3 py-1 bg-[#7AB8E5]/10 text-[#7AB8E5] rounded-full text-[10px] font-black tracking-widest uppercase border border-[#7AB8E5]/20">
                  Risk/Reward: {result.rr}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-zinc-800">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block">Position Size:</span>
                <span className="text-xl font-black italic tracking-tighter text-[#7AB8E5]">{result.lots} Lots</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block">Units:</span>
                <span className="text-xs font-bold text-zinc-300">{result.units.toLocaleString()}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
