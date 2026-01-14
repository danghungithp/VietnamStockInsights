
import React, { useState, useEffect, useCallback } from 'react';
import MarketHeader from './components/MarketHeader';
import StockSearch from './components/StockSearch';
import AnalysisDisplay from './components/AnalysisDisplay';
import PriceChart from './components/PriceChart';
import NewsSection from './components/NewsSection';
import PriceForecastCard from './components/PriceForecastCard';
import PortfolioSection from './components/PortfolioSection';
import MarketView from './components/MarketView';
import CommunityView from './components/CommunityView';
import { getAIAnalysis } from './services/geminiService';
import { AnalysisResult } from './types';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

type View = 'Home' | 'Market' | 'Community';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('Home');
  const [ticker, setTicker] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [portfolioRefresh, setPortfolioRefresh] = useState(0);
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);

  useEffect(() => {
    // Kiểm tra xem API_KEY đã được thiết lập chưa
    if (!process.env.API_KEY || process.env.API_KEY === "undefined") {
      setHasApiKey(false);
      setError("Cấu hình thiếu: Vui lòng thiết lập API_KEY trong Environment Variables trên Vercel.");
    }
  }, []);

  const handleOpenKeySelector = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
      setError(null);
      window.location.reload(); // Tải lại để nhận key mới
    }
  };

  const handleSearch = async (newTicker: string) => {
    if (!hasApiKey) {
      setError("Bạn cần thiết lập API Key để sử dụng tính năng này.");
      return;
    }
    setLoading(true);
    setError(null);
    setTicker(newTicker.toUpperCase());
    setCurrentView('Home');
    try {
      const result = await getAIAnalysis(newTicker);
      setAnalysis(result);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error("Analysis error:", err);
      setError('Không thể phân tích mã này. Vui lòng thử lại sau.');
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePortfolioUpdate = () => {
    setPortfolioRefresh(prev => prev + 1);
  };

  const renderViewContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-32 space-y-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-500/20 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin absolute top-0"></div>
          </div>
          <p className="text-slate-500 animate-pulse font-medium">AI đang phân tích dữ liệu thị trường...</p>
        </div>
      );
    }

    if (ticker && analysis && currentView === 'Home') {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
          <div className="lg:col-span-2 space-y-8">
            <PriceChart ticker={ticker} />
            <AnalysisDisplay result={analysis} ticker={ticker} onPortfolioUpdate={handlePortfolioUpdate} />
          </div>
          <div className="space-y-6">
            <PriceForecastCard forecast={analysis.priceForecast} ticker={ticker} />
            <NewsSection news={analysis.news} ticker={ticker} />
            <PortfolioSection onSelectStock={handleSearch} refreshTrigger={portfolioRefresh} />
          </div>
        </div>
      );
    }

    switch (currentView) {
      case 'Market': return <MarketView onSelectStock={handleSearch} />;
      case 'Community': return <CommunityView onSelectStock={handleSearch} />;
      default:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12 pb-20">
            <div className="lg:col-span-2">
              <PortfolioSection onSelectStock={handleSearch} refreshTrigger={portfolioRefresh} />
            </div>
            <div className="space-y-6">
              <div className="glass p-6 rounded-2xl bg-gradient-to-br from-blue-600/20 to-transparent">
                <h3 className="text-lg font-bold mb-2">Lời khuyên AI</h3>
                <p className="text-sm text-slate-300 leading-relaxed italic">
                  "Theo dõi sát các mã có điểm Tâm lý AI trên 80% để bắt kịp xu hướng dòng tiền."
                </p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a]">
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setTicker(null); setCurrentView('Home'); }}>
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/20">
              <i className="fa-solid fa-chart-pie text-white"></i>
            </div>
            <span className="text-lg font-black tracking-tight uppercase">VN Stock <span className="text-blue-500">Insight</span></span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex gap-6 text-sm font-bold text-slate-400">
              <button onClick={() => { setCurrentView('Home'); setTicker(null); }} className={currentView === 'Home' ? "text-white" : "hover:text-blue-400 transition-colors"}>Trang chủ</button>
              <button onClick={() => { setCurrentView('Market'); setTicker(null); }} className={currentView === 'Market' ? "text-white" : "hover:text-blue-400 transition-colors"}>Thị trường</button>
              <button onClick={() => { setCurrentView('Community'); setTicker(null); }} className={currentView === 'Community' ? "text-white" : "hover:text-blue-400 transition-colors"}>Cộng đồng</button>
            </div>
            {!hasApiKey && (
              <button onClick={handleOpenKeySelector} className="bg-amber-500 hover:bg-amber-400 text-slate-900 text-[10px] font-black px-3 py-1.5 rounded shadow-lg transition-all active:scale-95">SET API KEY</button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 pt-8">
        <MarketHeader />
        {currentView === 'Home' && !ticker && !loading && (
          <div className="py-16 text-center">
            <h1 className="text-5xl font-black mb-4 tracking-tight">Phân Tích Chứng Khoán <span className="text-blue-500">AI</span></h1>
            <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">Sử dụng sức mạnh của Gemini AI để thấu hiểu thị trường Việt Nam.</p>
          </div>
        )}
        {currentView === 'Home' && <StockSearch onSearch={handleSearch} />}
        
        {error && (
          <div className="max-w-2xl mx-auto bg-rose-500/10 border border-rose-500/20 p-6 rounded-2xl text-rose-400 text-center mb-10 shadow-xl">
            <i className="fa-solid fa-circle-exclamation text-2xl mb-3"></i>
            <p className="font-bold">{error}</p>
            {!hasApiKey && (
              <div className="mt-4 flex flex-col items-center gap-4">
                <p className="text-xs text-slate-400">Nếu bạn đang chạy trên Vercel, hãy vào Project Settings -> Environment Variables và thêm <b>API_KEY</b>.</p>
                <button onClick={handleOpenKeySelector} className="px-6 py-2 bg-rose-500 hover:bg-rose-400 text-white rounded-xl text-sm font-bold transition-all">Mở trình thiết lập nhanh</button>
              </div>
            )}
          </div>
        )}

        {renderViewContent()}
      </main>
    </div>
  );
};

export default App;
