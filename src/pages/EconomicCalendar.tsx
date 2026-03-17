import React, { useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Calendar } from 'lucide-react';

export function EconomicCalendar() {
  useEffect(() => {
    const container = document.getElementById('tradingview-widget-container');
    if (container && !container.querySelector('script')) {
      const script = document.createElement('script');
      script.src = "https://s3.tradingview.com/external-embedding/embed-widget-events.js";
      script.async = true;
      script.innerHTML = JSON.stringify({
        "colorTheme": "light",
        "isTransparent": false,
        "width": "100%",
        "height": "800",
        "locale": "en",
        "importanceFilter": "-1,0,1",
        "countryFilter": "ar,au,br,ca,cn,fr,de,in,id,it,jp,kr,mx,ru,sa,za,es,tr,gb,us,eu"
      });
      container.appendChild(script);
    }
  }, []);

  return (
    <Layout>
      <div className="max-w-none mx-auto space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Economic Calendar</h1>
            <p className="text-zinc-500 dark:text-zinc-400">Track all market events and economic indicators.</p>
          </div>
          <div className="hidden md:flex bg-amber-500/10 border border-amber-500/20 p-2 px-4 rounded-xl items-center gap-2">
            <Calendar className="text-amber-500" size={16} />
            <p className="text-xs text-amber-600 dark:text-amber-400">
              <strong>Tip:</strong> Use filters within the widget to focus on specific regions or impact levels.
            </p>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#9CD5FF]/10 flex items-center justify-center">
              <Calendar className="text-[#9CD5FF]" size={18} />
            </div>
            <h2 className="font-semibold text-zinc-900">Market Events</h2>
          </div>
          
          <div className="p-0 h-[800px] bg-white">
             {/* TradingView Widget Container */}
             <div id="tradingview-widget-container" className="tradingview-widget-container">
                <div className="tradingview-widget-container__widget"></div>
             </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default EconomicCalendar;
