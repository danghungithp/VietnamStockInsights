
import React, { useState } from 'react';

interface Props {
  onSearch: (ticker: string) => void;
}

const POPULAR_TICKERS = ['VCB', 'HPG', 'SSI', 'FPT', 'VIC', 'VHM', 'MWG', 'MSN'];

const StockSearch: React.FC<Props> = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.toUpperCase());
    }
  };

  return (
    <div className="mb-8">
      <form onSubmit={handleSubmit} className="relative group max-w-2xl mx-auto">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nhập mã cổ phiếu (VD: HPG, VCB, SSI...)"
          className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl py-4 px-6 pl-14 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-xl"
        />
        <i className="fa-solid fa-search absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 text-xl group-focus-within:text-blue-500 transition-colors"></i>
        <button 
          type="submit"
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl font-medium transition-all"
        >
          Phân tích
        </button>
      </form>
      <div className="flex flex-wrap justify-center gap-2 mt-4">
        <span className="text-slate-400 text-sm py-1">Phổ biến:</span>
        {POPULAR_TICKERS.map(t => (
          <button
            key={t}
            onClick={() => onSearch(t)}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-semibold text-slate-300 transition-colors"
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
};

export default StockSearch;
