import React, { useEffect, useRef } from 'react';

interface AdvancedChartProps {
  symbol?: string; // e.g., "BINANCE:BTCUSDT"
}

const AdvancedChart: React.FC<AdvancedChartProps> = ({ symbol = "BINANCE:BTCUSDT" }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Prevent double-injection in React 18/19 Strict Mode
    if (containerRef.current) {
      containerRef.current.innerHTML = "";
    }

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;

    // Configuration for the widget
    const settings = {
      "autosize": true,
      "symbol": symbol,
      "interval": "60", // 1 Hour default
      "timezone": "Asia/Bangkok", // Set to your local time
      "theme": "dark",
      "style": "1", // 1 = Candles
      "locale": "en",
      "enable_publishing": false,
      "allow_symbol_change": true, // Critical: Allows students to search other coins
      "calendar": false,
      "support_host": "https://www.tradingview.com",
      "hide_side_toolbar": false, // Shows drawing tools (Trendlines, Fibonacci)
      "container_id": "tv_chart_container"
    };

    script.innerHTML = JSON.stringify(settings);
    containerRef.current?.appendChild(script);

    // Cleanup on unmount
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [symbol]);

  return (
    <div className="w-full h-[600px] bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden shadow-2xl">
      <div 
        id="tv_chart_container" 
        ref={containerRef} 
        className="h-full w-full"
      />
    </div>
  );
};

export default AdvancedChart;
