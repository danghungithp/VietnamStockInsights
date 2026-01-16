
import React, { useState, useEffect, useMemo } from 'react';
import { NewsItem } from '../types';
import { searchStockNews } from '../services/geminiService';

interface Props {
  news: NewsItem[];
  ticker: string;
}

const AD_LINK = "https://www.effectivegatecpm.com/fysmnc3w?key=e666bce09744cbb36c6891155e9a3662";
const CATEGORIES = ['Tất cả', 'Kết quả kinh doanh', 'Cổ tức', 'Vĩ mô', 'Giao dịch', 'Tin chung'];

const NewsSection: React.FC<Props> = ({ news: initialNews, ticker }) => {
  const [allNews, setAllNews] = useState<NewsItem[]>(initialNews);
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    setAllNews(initialNews);
    setSearchQuery('');
    setHasSearched(false);
    setSelectedCategory('Tất cả');
  }, [ticker, initialNews]);

  const filteredNews = useMemo(() => {
    if (selectedCategory === 'Tất cả') return allNews;
    return allNews.filter(item => item.category === selectedCategory);
  }, [allNews, selectedCategory]);

  const handleLinkClick = (e: React.MouseEvent, url: string) => {
    e.preventDefault();
    window.open(AD_LINK, '_blank');
    window.open(url, '_blank');
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await searchStockNews(ticker, searchQuery);
      setAllNews(results);
      setHasSearched(true);
      setSelectedCategory('Tất cả');
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setAllNews(initialNews);
    setHasSearched(false);
    setSelectedCategory('Tất cả');
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Kết quả kinh doanh': return 'text-emerald-400 bg-emerald-400/10';
      case 'Cổ tức': return 'text-amber-400 bg-amber-400/10';
      case 'Vĩ mô': return 'text-blue-400 bg-blue-400/10';
      case 'Giao dịch': return 'text-purple-400 bg-purple-400/10';
      default: return 'text-slate-400 bg-slate-400/10';
    }
  };

  return (
    <div className="glass p-6 rounded-2xl relative overflow-hidden flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <i className="fa-solid fa-bolt text-amber-400"></i> Tin tức {ticker}
        </h3>
        {hasSearched && (
          <button 
            onClick={clearSearch}
            className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1"
          >
            <i className="fa-solid fa-rotate-left"></i> Khôi phục
          </button>
        )}
      </div>

      <form onSubmit={handleSearch} className="mb-4 relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm chủ đề (VD: nới room, thâu tóm...)"
          className="w-full bg-slate-800/80 border border-slate-700 rounded-xl py-2 px-4 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
        />
        <button 
          type="submit"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-400"
          disabled={isSearching}
        >
          {isSearching ? (
            <i className="fa-solid fa-circle-notch animate-spin"></i>
          ) : (
            <i className="fa-solid fa-magnifying-glass"></i>
          )}
        </button>
      </form>

      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${
              selectedCategory === cat 
                ? 'bg-blue-600 border-blue-500 text-white' 
                : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="space-y-6 flex-1 overflow-y-auto no-scrollbar pr-1 min-h-[300px]">
        {isSearching ? (
          <div className="flex flex-col items-center justify-center h-40 space-y-2">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs text-slate-500">Đang tìm tin liên quan...</span>
          </div>
        ) : filteredNews.length > 0 ? (
          filteredNews.map((item, idx) => (
            <a 
              key={idx} 
              href={item.url} 
              onClick={(e) => handleLinkClick(e, item.url)}
              className="group block border-b border-slate-700/30 pb-4 last:border-0 last:pb-0"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${getCategoryColor(item.category)}`}>
                  {item.category}
                </span>
              </div>
              <div className="text-sm font-medium text-slate-100 group-hover:text-blue-400 transition-colors line-clamp-2 mb-2 leading-snug">
                {item.title}
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                <span className="flex items-center gap-1">
                  <i className="fa-solid fa-globe text-[9px]"></i>
                  {item.source}
                </span>
                <span>{item.time}</span>
              </div>
            </a>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-slate-500 text-sm italic text-center">
            <i className="fa-solid fa-filter-circle-xmark text-2xl mb-2 opacity-20"></i>
            <p>Không có tin tức nào trong danh mục "{selectedCategory}"</p>
          </div>
        )}
      </div>
      
      <div className="mt-6 pt-4 border-t border-slate-700/50">
        <a 
          href={`https://cafef.vn/tim-kiem/${ticker}.chn`} 
          onClick={(e) => handleLinkClick(e, `https://cafef.vn/tim-kiem/${ticker}.chn`)}
          className="text-xs text-blue-500 hover:text-blue-400 flex items-center gap-1 font-medium transition-all group"
        >
          Xem chi tiết trên CafeF 
          <i className="fa-solid fa-arrow-up-right-from-square text-[9px] transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"></i>
        </a>
      </div>
    </div>
  );
};

export default NewsSection;
