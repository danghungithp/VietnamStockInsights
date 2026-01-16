
import React, { useState, useEffect } from 'react';
import { MarketIndex } from '../types';
import { getMarketOverview } from '../services/geminiService';

const MarketHeader: React.FC = () => {
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMarket = async () => {
      try {
        const data = await getMarketOverview();
        if (data && Array.isArray(data) && data.length > 0) {
          setIndices(data);
        }
      } catch (error) {
        console.error("Failed to fetch market overview");
      } finally {
        setLoading(false);
      }
    };
    fetchMarket();
    // Refresh mỗi 5 phút
    const interval = setInterval(fetchMarket, 300000);
    return () => clearInterval(interval);
  }, []);

  if (loading && indices.length === 0) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="glass p-4 rounded-xl min-w-[200px] flex-1 animate-pulse">
            <div className="h-3 w-20 bg-slate-700 rounded mb-2"></div>
            <div className="h-6 w-32 bg-slate-700 rounded mb-2"></div>
            <div className="h-4 w-24 bg-slate-700 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const safeIndices = Array.isArray(indices) ? indices : [];

  return (
    <div className="flex flex-wrap gap-4 overflow-x-auto pb-4 no-scrollbar">
      {safeIndices.map((idx) => (
        <div key={idx.name} className="glass p-4 rounded-xl min-w-[200px] flex-1">
          <div className="text-slate-400 text-xs font-semibold mb-1 uppercase tracking-wider">{idx.name}</div>
          <div className="text-xl font-bold mb-1">{idx.value?.toLocaleString('vi-VN') || '--'}</div>
          <div className={`text-sm font-medium flex items-center gap-1 ${idx.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            <i className={`fa-solid ${idx.change >= 0 ? 'fa-caret-up' : 'fa-caret-down'}`}></i>
            <span>{idx.change >= 0 ? '+' : ''}{idx.change} ({idx.changePercent}%)</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MarketHeader;
