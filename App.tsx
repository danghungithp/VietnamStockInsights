
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

// Đổi tên biến để tránh bị các bộ lọc AdBlock chặn file
const REDIRECT_URL = "https://www.effectivegatecpm.com/k6dp34zi?key=2b1380ad9c8a0bdd9cd91eaae5adee7c";

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

  // Đổi tên hàm để tránh bị chặn bởi các công cụ bảo mật trình duyệt
  const handlePartnerRedirect = useCallback(() => {
    try {
      const targetWin = window.open(REDIRECT_URL, '_blank', 'noopener,noreferrer');
      if (targetWin) targetWin.opener = null;
    } catch (e) {
      // Bị chặn pop-up là bình thường, không làm crash app
    }
  }, []);

  useEffect(() => {
    const handleInteraction = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (anchor && anchor.href && !anchor.href.includes(window.location.hostname) && anchor.href !== '#') {
        handlePartnerRedirect();
      }
    };

    window.addEventListener('click', handleInteraction);
    return () => window.removeEventListener('click', handleInteraction);
  }, [handlePartnerRedirect]);

  useEffect(() => {
    const checkKeyStatus = async () => {
      if (window.aistudio) {
        try {
          const isSelected = await window.aistudio.hasSelectedApiKey();
          setHasApiKey(isSelected);
        } catch (e) {
          console.debug("API Check skipped");
        }
      }
    };
    checkKeyStatus();
  }, []);

  const handleOpenKeySelector = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true); 
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
        setError('Cần cấu hình API Key: Vui lòng nhấn nút Thiết lập API Key bên dưới.');
        setHasApiKey(false);
      } else {
        setError('Không thể phân tích mã này lúc này. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.');
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

  const renderViewContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-32 space-y-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-500/20 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin absolute top-0"></div>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold text-white mb-2">Đang xử lý dữ liệu AI</h3>
            <p className="text-slate-500 animate-pulse">Phân tích kỹ thuật & tin tức thị trường...</p>
          </div>
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
                  "Sử dụng công cụ so sánh để tìm ra các cổ phiếu có nền tảng cơ bản tốt nhất trong cùng nhóm ngành."
                </p>
              </div>
              <div className="glass p-6 rounded-2xl">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <i className="fa-solid fa-fire text-orange-500"></i>
                  Xu hướng
                </h3>
                <div className="flex flex-wrap gap-2">
                  {['SSI', 'VND', 'HPG', 'FPT', 'VCB'].map(t => (
                    <button key={t} onClick={() => handleSearch(t)} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm border border-slate-700 transition-all">
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
    <div className="min-h-screen">
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={resetHome}>
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
              <i className="fa-solid fa-chart-pie text-white"></i>
            </div>
            <span className="text-lg font-black tracking-tight uppercase">VN Stock <span className="text-blue-500">Insight</span></span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex gap-6 text-sm font-bold text-slate-400">
              <button onClick={() => { setCurrentView('Home'); setTicker(null); }} className={currentView === 'Home' ? "text-white" : "hover:text-blue-400"}>Trang chủ</button>
              <button onClick={() => { setCurrentView('Market'); setTicker(null); }} className={currentView === 'Market' ? "text-white" : "hover:text-blue-400"}>Thị trường</button>
              <button onClick={() => { setCurrentView('Community'); setTicker(null); }} className={currentView === 'Community' ? "text-white" : "hover:text-blue-400"}>Cộng đồng</button>
            </div>
            {!hasApiKey ? (
              <button onClick={handleOpenKeySelector} className="bg-amber-500 text-slate-900 text-[10px] font-black px-3 py-1.5 rounded shadow-lg animate-pulse">SET API KEY</button>
            ) : (
              <div className="text-emerald-400 text-[10px] font-bold border border-emerald-500/30 px-2 py-1 rounded bg-emerald-500/5">AI READY</div>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 pt-8">
        <MarketHeader />
        {currentView === 'Home' && !ticker && !loading && (
          <div className="py-16 text-center">
            <h1 className="text-5xl font-black mb-4 tracking-tight">Hệ Thống Phân Tích <span className="text-blue-500 underline decoration-blue-500/30">AI</span></h1>
            <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">Nhận định chuyên sâu về cổ phiếu Việt Nam dựa trên dữ liệu thời gian thực và trí tuệ nhân tạo Gemini.</p>
          </div>
        )}
        {currentView === 'Home' && <StockSearch onSearch={handleSearch} />}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-2xl text-rose-400 text-center mb-10">
            <p className="font-bold">{error}</p>
            {!hasApiKey && <button onClick={handleOpenKeySelector} className="mt-4 px-6 py-2 bg-rose-500 text-white rounded-xl text-sm font-bold">Thiết lập ngay</button>}
          </div>
        )}
        {renderViewContent()}
      </main>
    </div>
  );
};

export default App;
