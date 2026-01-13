
import React, { useState, useEffect } from 'react';
import { MarketMover } from '../types';
import { getMarketMovers } from '../services/geminiService';

interface Props {
  onSelectStock: (ticker: string) => void;
}

const MarketView: React.FC<Props> = ({ onSelectStock }) => {
  const [data, setData] = useState<{ gainers: MarketMover[], losers: MarketMover[], active: MarketMover[] }>({ gainers: [], losers: [], active: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovers = async () => {
      setLoading(true);
      const res = await getMarketMovers();
      setData(res);
      setLoading(false);
    };
    fetchMovers();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
        {[1, 2, 3].map(i => <div key={i} className="glass h-96 rounded-2xl bg-slate-800/50"></div>)}
      </div>
    );
  }

  const MoverList = ({ title, list, color }: { title: string, list: MarketMover[], color: string }) => (
    <div className="glass p-6 rounded-2xl flex flex-col h-full">
      <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
        <div className={`w-2 h-6 rounded-full bg-${color}-500`}></div>
        {title}
      </h3>
      <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar">
        {list.map((m) => (
          <div 
            key={m.ticker} 
            onClick={() => onSelectStock(m.ticker)}
            className="flex items-center justify-between p-3 bg-slate-800/30 hover:bg-slate-700/50 rounded-xl cursor-pointer transition-all border border-transparent hover:border-slate-600"
          >
            <div>
              <div className="font-black text-white">{m.ticker}</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase">{m.volume} cp</div>
            </div>
            <div className="text-right">
              <div className="font-bold">{m.price.toLocaleString('vi-VN')}</div>
              <div className={`text-xs font-black ${m.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {m.changePercent >= 0 ? '+' : ''}{m.changePercent}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
      <MoverList title="Tăng giá mạnh nhất" list={data.gainers} color="emerald" />
      <MoverList title="Giảm giá mạnh nhất" list={data.losers} color="rose" />
      <MoverList title="Giao dịch sôi động" list={data.active} color="blue" />
    </div>
  );
};

export default MarketView;
