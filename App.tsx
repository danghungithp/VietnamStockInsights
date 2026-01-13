
import React, { useState, useEffect } from 'react';
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

// Declare aistudio types for window
declare global {
  // Fix: Defining the AIStudio interface explicitly to resolve naming and modifier conflicts
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    // Fix: Using the named AIStudio interface as required by existing global declarations
    aistudio: AIStudio;
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
    const checkApiKey = async () => {
      if (window.aistudio) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      }
    };
    checkApiKey();
  }, []);

  const handleOpenKeySelector = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true); // Assume success per guidelines
    }
  };

  const handleSearch = async (newTicker: string) => {
    setLoading(true);
    setError(null);
    setTicker(newTicker.toUpperCase());
    setCurrentView('Home');
    try {
      const result = await getAIAnalysis(newTicker);
      setAnalysis(result);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      if (err.message?.includes("entity was not found")) {
        setError('Lỗi API Key: Vui lòng cấu hình lại API Key từ Google AI Studio của bạn.');
        setHasApiKey(false);
      } else {
        setError('Có lỗi xảy ra khi phân tích mã cổ phiếu này. Vui lòng thử lại sau.');
      }
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePortfolioUpdate = () => {
    setPortfolioRefresh(prev => prev + 1);
  };

  const resetHome = () => {
    setTicker(null);
    setAnalysis(null);
    setCurrentView('Home');
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-slate-400 animate-pulse text-lg text-center">
            Đang thu thập dữ liệu thị trường &<br/>
            đưa ra dự báo giá bằng AI...
          </div>
        </div>
      );
    }

    if (ticker && analysis && currentView === 'Home') {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
      case 'Market':
        return <MarketView onSelectStock={handleSearch} />;
      case 'Community':
        return <CommunityView onSelectStock={handleSearch} />;
      default:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
            <div className="lg:col-span-2">
              <PortfolioSection onSelectStock={handleSearch} refreshTrigger={portfolioRefresh} />
            </div>
            <div className="space-y-6">
              <div className="glass p-6 rounded-2xl bg-gradient-to-br from-blue-600/20 to-transparent">
                <h3 className="text-lg font-bold mb-2">Gợi ý từ AI</h3>
                <p className="text-sm text-slate-300 leading-relaxed italic">
                  "Theo dõi các mã đầu ngành như HPG, FPT, VCB để có cái nhìn tổng quan về xu hướng thị trường."
                </p>
              </div>
              <div className="glass p-6 rounded-2xl">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <i className="fa-solid fa-fire text-orange-500"></i>
                  Mã đang HOT
                </h3>
                <div className="flex flex-wrap gap-2">
                  {['SSI', 'VND', 'HPG', 'DIG', 'CEO', 'FPT'].map(t => (
                    <button key={t} onClick={() => handleSearch(t)} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors border border-slate-700">
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Navigation */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={resetHome}>
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
              <i className="fa-solid fa-chart-line text-white text-xl"></i>
            </div>
            <span className="text-xl font-bold tracking-tight hidden sm:inline">VN STOCK <span className="text-blue-500">INSIGHT</span></span>
          </div>
          
          <div className="flex items-center gap-4 md:gap-8">
            <div className="hidden md:flex gap-6 text-slate-400 font-medium">
              <button 
                onClick={() => { setCurrentView('Home'); setTicker(null); }} 
                className={currentView === 'Home' ? "text-white" : "hover:text-blue-400 transition-colors"}
              >
                Trang chủ
              </button>
              <button 
                onClick={() => { setCurrentView('Market'); setTicker(null); }} 
                className={currentView === 'Market' ? "text-white" : "hover:text-blue-400 transition-colors"}
              >
                Thị trường
              </button>
              <button 
                onClick={() => { setCurrentView('Community'); setTicker(null); }} 
                className={currentView === 'Community' ? "text-white" : "hover:text-blue-400 transition-colors"}
              >
                Cộng đồng
              </button>
            </div>

            <div className="flex items-center gap-2">
              {!hasApiKey ? (
                <button 
                  onClick={handleOpenKeySelector}
                  className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 text-xs font-bold px-3 py-2 rounded-lg transition-all animate-pulse"
                >
                  <i className="fa-solid fa-key"></i>
                  Thiết lập API Key
                </button>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-emerald-400 text-[10px] font-bold">
                  <i className="fa-solid fa-circle-check"></i>
                  API Connected
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 mt-8">
        <MarketHeader />
        
        {currentView === 'Home' && !ticker && !loading && (
          <div className="mt-12 text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-white to-slate-500 bg-clip-text text-transparent">
              Phân Tích Cổ Phiếu Thông Minh
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Sử dụng khóa API cá nhân của bạn để truy cập sức mạnh AI tối đa từ Google Gemini.
            </p>
          </div>
        )}

        {currentView === 'Home' && <StockSearch onSearch={handleSearch} />}

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-2xl text-rose-400 text-center mb-8 max-w-2xl mx-auto">
            <i className="fa-solid fa-circle-exclamation text-2xl mb-2"></i>
            <p className="font-medium">{error}</p>
            {!hasApiKey && (
              <button 
                onClick={handleOpenKeySelector}
                className="mt-4 px-4 py-2 bg-rose-500 text-white rounded-xl text-sm font-bold hover:bg-rose-400 transition-colors"
              >
                Chọn API Key mới
              </button>
            )}
          </div>
        )}

        {renderContent()}
      </main>

      <footer className="mt-20 border-t border-slate-800 py-10 text-center text-slate-500 text-sm">
        <p>© 2024 VN Stock Insight. Powered by your Google Gemini API Key.</p>
        <div className="flex justify-center gap-4 mt-2">
          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="hover:text-blue-400 underline decoration-blue-500/30">Tài liệu thanh toán & Free Tier</a>
        </div>
      </footer>
    </div>
  );
};

export default App;
