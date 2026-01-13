
import React, { useState, useEffect } from 'react';
import { AnalysisResult } from '../types';

interface Props {
  result: AnalysisResult;
  ticker: string;
  onPortfolioUpdate?: () => void;
}

const RatioCard = ({ label, value, subtext }: { label: string, value: string | number | undefined, subtext?: string }) => (
  <div className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-xl flex flex-col items-center justify-center text-center">
    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">{label}</span>
    <span className="text-lg font-bold text-white">{value ?? '--'}</span>
    {subtext && <span className="text-[9px] text-slate-500 mt-1">{subtext}</span>}
  </div>
);

const AnalysisDisplay: React.FC<Props> = ({ result, ticker, onPortfolioUpdate }) => {
  const [isInPortfolio, setIsInPortfolio] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('vn_stock_portfolio');
    if (saved) {
      const tickers = JSON.parse(saved) as string[];
      setIsInPortfolio(tickers.includes(ticker));
    }
  }, [ticker]);

  const togglePortfolio = () => {
    const saved = localStorage.getItem('vn_stock_portfolio');
    let tickers: string[] = saved ? JSON.parse(saved) : [];
    
    if (isInPortfolio) {
      tickers = tickers.filter(t => t !== ticker);
    } else {
      tickers.push(ticker);
    }
    
    localStorage.setItem('vn_stock_portfolio', JSON.stringify(tickers));
    setIsInPortfolio(!isInPortfolio);
    if (onPortfolioUpdate) onPortfolioUpdate();
  };

  const getBadgeColor = (rec: string) => {
    switch (rec) {
      case 'BUY': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
      case 'SELL': return 'bg-rose-500/20 text-rose-400 border-rose-500/50';
      case 'HOLD': return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
    }
  };

  const getRecText = (rec: string) => {
    switch (rec) {
      case 'BUY': return 'MUA';
      case 'SELL': return 'BÁN';
      case 'HOLD': return 'NẮM GIỮ';
      default: return 'TRUNG LẬP';
    }
  };

  const ratios = result?.financialRatios || {};

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="glass p-6 rounded-2xl">
        <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-1">
              <h2 className="text-4xl font-extrabold text-white flex items-center gap-3">
                {ticker}
              </h2>
              <button 
                onClick={togglePortfolio}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  isInPortfolio 
                    ? 'bg-blue-600 border-blue-500 text-white' 
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'
                }`}
              >
                <i className={`fa-solid ${isInPortfolio ? 'fa-check' : 'fa-plus'}`}></i>
                {isInPortfolio ? 'Đã lưu' : 'Lưu danh mục'}
              </button>
            </div>
            <p className="text-slate-400 text-sm">Nhận định phân tích tổng hợp bởi Gemini AI</p>
          </div>
          <div className={`px-6 py-3 rounded-xl border-2 font-black text-xl shadow-lg transition-transform hover:scale-105 ${getBadgeColor(result.recommendation)}`}>
            {getRecText(result.recommendation)}
          </div>
        </div>

        <div className="mb-10">
          <h3 className="text-sm font-bold text-slate-400 mb-4 flex items-center gap-2 uppercase tracking-widest">
            <i className="fa-solid fa-gauge-high text-blue-500"></i> Chỉ số tài chính then chốt
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <RatioCard label="P/E" value={ratios.pe} subtext="Giá / Thu nhập" />
            <RatioCard label="EPS" value={ratios.eps?.toLocaleString('vi-VN')} subtext="Thu nhập / CP" />
            <RatioCard label="ROE" value={ratios.roe} subtext="LN / Vốn CSH" />
            <RatioCard label="P/B" value={ratios.pb} subtext="Giá / Giá trị sổ sách" />
            <RatioCard label="Cổ tức" value={ratios.dividendYield} subtext="Tỷ suất cổ tức" />
            <RatioCard label="Vốn hóa" value={ratios.marketCap} subtext="Tổng giá trị" />
          </div>
        </div>

        <div className="prose prose-invert max-w-none">
          <section className="mb-10 bg-slate-800/20 p-5 rounded-xl border border-slate-700/30">
            <h3 className="text-xl font-bold text-blue-400 mb-3 flex items-center gap-2">
              <i className="fa-solid fa-file-lines"></i> Tóm tắt định hướng
            </h3>
            <p className="text-slate-300 leading-relaxed text-base">{result.summary || "Đang cập nhật tóm tắt..."}</p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section>
              <h3 className="text-xl font-bold text-emerald-400 mb-4 flex items-center gap-2 border-b border-emerald-500/20 pb-2">
                <i className="fa-solid fa-chart-line"></i> Phân tích kỹ thuật
              </h3>
              <p className="text-slate-300 leading-relaxed whitespace-pre-line text-sm">{result.technicalAnalysis || "Dữ liệu phân tích kỹ thuật đang được tải..."}</p>
            </section>
            <section>
              <h3 className="text-xl font-bold text-indigo-400 mb-4 flex items-center gap-2 border-b border-indigo-500/20 pb-2">
                <i className="fa-solid fa-building-columns"></i> Phân tích cơ bản
              </h3>
              <p className="text-slate-300 leading-relaxed whitespace-pre-line text-sm">{result.fundamentalAnalysis || "Dữ liệu phân tích cơ bản đang được tải..."}</p>
            </section>
          </div>

          <section className="mt-10 p-5 bg-rose-500/5 border border-rose-500/20 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <i className="fa-solid fa-shield-halved text-6xl text-rose-500"></i>
            </div>
            <h3 className="text-xl font-bold text-rose-400 mb-3 flex items-center gap-2">
              <i className="fa-solid fa-triangle-exclamation"></i> Rủi ro & Cảnh báo
            </h3>
            <p className="text-slate-300 leading-relaxed text-sm relative z-10">{result.risks || "Không có cảnh báo rủi ro đặc biệt."}</p>
          </section>
        </div>
      </div>

      {result.sources && result.sources.length > 0 && (
        <div className="glass p-6 rounded-2xl">
          <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-widest flex items-center gap-2">
            <i className="fa-solid fa-satellite-dish text-blue-400"></i> Nguồn tham khảo tin tức
          </h3>
          <div className="flex flex-wrap gap-2">
            {result.sources.map((source, idx) => (
              <a
                key={idx}
                href={source.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/60 hover:bg-slate-700 rounded-lg text-xs text-blue-400 transition-all border border-slate-700/50 hover:border-blue-500/50"
              >
                <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                <span className="truncate max-w-[150px]">{source.title}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisDisplay;
