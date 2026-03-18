import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useTradingMentor = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const askAI = async (question: string, imageUrl?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Get user session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) throw new Error("Authentication required to use the AI Mentor.");

      // 2. Query the local Supabase trades table (trading_logs) for 5 most recent closed trades
      const { data: trades, error: tradesError } = await supabase
        .from('trading_logs')
        .select('symbol, side, pnl_percentage, mood, rules_checked')
        .eq('user_id', session.user.id)
        .neq('status', 'Open')
        .order('timestamp', { ascending: false })
        .limit(5);

      if (tradesError) throw tradesError;

      // 3. Map this data to safe, anonymous fields
      const recentTrades = (trades || []).map(t => ({
        symbol: t.symbol,
        side: t.side,
        pnl_percent: t.pnl_percentage,
        mood: t.mood,
        checklist: t.rules_checked
      }));

      // 4. Call supabase.functions.invoke('bmfx-ai-mentor')
      const { data, error: functionError } = await supabase.functions.invoke('bmfx-ai-mentor', {
        body: { 
          studentQuestion: question, 
          recentTrades,
          imageUrl
        }
      });

      if (functionError) throw functionError;

      return data;

    } catch (err: any) {
      console.error('Error in useTradingMentor:', err);
      const errorMessage = err.message || 'An unexpected error occurred.';
      setError(errorMessage);
      throw err; // Re-throw to be caught by the component
    } finally {
      setIsLoading(false);
    }
  };

  return { askAI, isLoading, error };
};
