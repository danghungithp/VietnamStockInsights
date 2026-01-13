
import React, { useState, useEffect } from 'react';
import { PortfolioStock } from '../types';
import { getLatestPrice } from '../services/financeService';

interface Props {
  onSelectStock: (ticker: string) => void;
  refreshTrigger: number;
}

const PortfolioSection: React.FC<Props> = ({ onSelectStock, refreshTrigger }) => {
  const [portfolio, setPortfolio] = useState<PortfolioStock[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPortfolio = async () => {
    setLoading(true);
    const saved = localStorage.getItem('vn_stock_portfolio');
    if (saved) {
      const tickers = JSON.parse(saved) as string[];
      const updatedData = await Promise.all(
        tickers.map(async (ticker) => {
          const data = await getLatestPrice(ticker);
          return data ? (data as PortfolioStock) : null;
        })
      );
      setPortfolio(updatedData.filter(i => i !== null) as PortfolioStock[]);
    } else {
      setPortfolio([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPortfolio();
  }, [refreshTrigger]);

  const removeFromPortfolio = (e: React.MouseEvent, ticker: string) => {
    e.stopPropagation();
    const saved = localStorage.getItem('vn_stock_portfolio');
    if (saved) {
      const tickers = JSON.parse(saved) as string[];
      const filtered = tickers.filter(t => t !== ticker);
      localStorage.setItem('vn_stock_portfolio', JSON.stringify(filtered));
      loadPortfolio();
    }
  };

  if (loading) {
    return (
      <div className="glass p-6 rounded-2xl animate-pulse">
        <div className="h-6 w-40 bg-slate-700 rounded mb-6"></div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-800/50 rounded-xl"></div>)}
        </div>
      </div>
    );
  }

  if (portfolio.length === 0) {
    return (
      <div className="glass p-8 rounded-2xl text-center border-dashed border-slate-700">
        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
          <i className="fa-solid fa-folder-plus text-2xl"></i>
        </div>
        <h3 className="text-white font-bold mb-2">Danh mục trống</h3>
        <p className="text-slate-500 text-sm">Tìm kiếm mã cổ phiếu và nhấn "Thêm vào danh mục" để theo dõi nhanh.</p>
      </div>
    );
  }

  return (
    <div className="glass p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <i className="fa-solid fa-briefcase text-blue-500"></i>
          Danh mục theo dõi
        </h3>
        <button onClick={loadPortfolio} className="text-slate-400 hover:text-white transition-colors">
          <i className="fa-solid fa-arrows-rotate text-xs"></i>
        </button>
      </div>

      <div className="space-y-3">
        {portfolio.map((stock) => (
          <div 
            key={stock.ticker}
            onClick={() => onSelectStock(stock.ticker)}
            className="group flex items-center justify-between p-4 bg-slate-800/30 hover:bg-slate-700/40 rounded-xl border border-slate-700/30 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center font-bold text-white group-hover:bg-blue-600 transition-colors">
                {stock.ticker.substring(0, 1)}
              </div>
              <div>
                <div className="font-bold text-white">{stock.ticker}</div>
                <div className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Yahoo Finance</div>
              </div>
            </div>

            <div className="text-right flex items-center gap-4">
              <div>
                <div className="font-bold text-white">{stock.currentPrice.toLocaleString('vi-VN')}</div>
                <div className={`text-xs font-bold ${stock.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {stock.change >= 0 ? '+' : ''}{stock.change} ({stock.changePercent}%)
                </div>
              </div>
              <button 
                onClick={(e) => removeFromPortfolio(e, stock.ticker)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
              >
                <i className="fa-solid fa-trash-can text-xs"></i>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PortfolioSection;
