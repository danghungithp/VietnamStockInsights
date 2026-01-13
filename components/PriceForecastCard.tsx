
import React from 'react';
import { PriceForecast } from '../types';

interface Props {
  forecast: PriceForecast;
  ticker: string;
}

const PriceForecastCard: React.FC<Props> = ({ forecast, ticker }) => {
  const upside = ((forecast.targetPrice - forecast.currentPrice) / forecast.currentPrice) * 100;
  const isPositive = upside >= 0;

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case 'HIGH': return 'bg-emerald-500';
      case 'MEDIUM': return 'bg-blue-500';
      case 'LOW': return 'bg-amber-500';
      default: return 'bg-slate-500';
    }
  };

  const getConfidenceText = (level: string) => {
    switch (level) {
      case 'HIGH': return 'Cao';
      case 'MEDIUM': return 'Trung bình';
      case 'LOW': return 'Thấp';
      default: return level;
    }
  };

  return (
    <div className="glass p-6 rounded-2xl relative overflow-hidden group">
      {/* Background Decorative Element */}
      <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl group-hover:bg-blue-600/20 transition-all duration-500"></div>
      
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold flex items-center gap-2 text-white">
          <i className="fa-solid fa-wand-magic-sparkles text-blue-400"></i>
          Dự báo giá AI
        </h3>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-800/50 px-2 py-1 rounded">
          {forecast.timeframe}
        </span>
      </div>

      <div className="space-y-6">
        {/* Target Price Section */}
        <div className="text-center py-4 bg-slate-800/30 rounded-2xl border border-slate-700/30">
          <div className="text-slate-400 text-xs font-semibold mb-1 uppercase tracking-tighter">Giá mục tiêu</div>
          <div className="text-3xl font-black text-white flex items-center justify-center gap-2">
            {forecast.targetPrice.toLocaleString('vi-VN')}
            <span className="text-xs font-normal text-slate-500">VND</span>
          </div>
          <div className={`mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
            <i className={`fa-solid ${isPositive ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}`}></i>
            {isPositive ? '+' : ''}{upside.toFixed(2)}%
            <span className="opacity-60 font-normal">so với hiện tại</span>
          </div>
        </div>

        {/* Confidence Level */}
        <div>
          <div className="flex justify-between items-end mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Độ tin cậy của AI</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md text-white ${getConfidenceColor(forecast.confidence)}`}>
              {getConfidenceText(forecast.confidence)}
            </span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ease-out ${getConfidenceColor(forecast.confidence)} shadow-[0_0_10px_rgba(59,130,246,0.5)]`}
              style={{ width: forecast.confidence === 'HIGH' ? '90%' : forecast.confidence === 'MEDIUM' ? '60%' : '30%' }}
            ></div>
          </div>
        </div>

        {/* Reasoning */}
        <div className="bg-blue-600/5 border border-blue-500/10 p-4 rounded-xl">
          <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-1">
            <i className="fa-solid fa-quote-left text-[8px]"></i> Cơ sở phân tích
          </div>
          <p className="text-slate-300 text-xs leading-relaxed italic">
            "{forecast.reasoning}"
          </p>
        </div>
      </div>
      
      <div className="mt-4 text-[9px] text-slate-500 text-center italic">
        * Dự báo được tạo dựa trên phân tích kỹ thuật & tin tức hiện tại. <br/> Không phải lời khuyên đầu tư tài chính.
      </div>
    </div>
  );
};

export default PriceForecastCard;
