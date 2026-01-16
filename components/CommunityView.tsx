
import React, { useState, useEffect } from 'react';
import { SocialTrend } from '../types';
import { getSocialTrends } from '../services/geminiService';

interface Props {
  onSelectStock: (ticker: string) => void;
}

const AD_LINK = "https://www.effectivegatecpm.com/fysmnc3w?key=e666bce09744cbb36c6891155e9a3662";

const CommunityView: React.FC<Props> = ({ onSelectStock }) => {
  const [trends, setTrends] = useState<SocialTrend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrends = async () => {
      setLoading(true);
      try {
        const res = await getSocialTrends();
        setTrends(Array.isArray(res) ? res : []);
      } catch (e) {
        console.error("Community Trends error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchTrends();
  }, []);

  const handleSelect = (ticker: string) => {
    window.open(AD_LINK, '_blank');
    onSelectStock(ticker);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="glass h-32 rounded-2xl animate-pulse bg-slate-800/50"></div>)}
      </div>
    );
  }

  const safeTrends = Array.isArray(trends) ? trends : [];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Mạch Đập Cộng Đồng</h2>
        <p className="text-slate-400 text-sm">AI phân tích dữ liệu từ Facebook, Zalo, TikTok và các diễn đàn chứng khoán.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {safeTrends.map((trend) => (
          <div 
            key={trend.ticker}
            onClick={() => handleSelect(trend.ticker)}
            className="glass p-6 rounded-2xl hover:border-blue-500/50 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div 
              className="absolute bottom-0 left-0 h-1 bg-blue-500 transition-all duration-1000" 
              style={{ width: `${trend.sentimentScore || 0}%` }}
            ></div>

            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-xl font-black text-white shadow-lg shadow-blue-600/20">
                  {trend.ticker}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                      trend.status === 'Hot' ? 'bg-orange-500/20 text-orange-400' : 
                      trend.status === 'Rising' ? 'bg-emerald-500/20 text-emerald-400' : 
                      'bg-rose-500/20 text-rose-400'
                    }`}>
                      {trend.status || 'Trending'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold">{trend.mentionCount || 'N/A'} lượt nhắc</span>
                  </div>
                  <div className="flex gap-2 mt-1">
                    {(trend.platforms || []).map(p => (
                      <span key={p} className="text-[9px] text-slate-400">#{p}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Tâm lý (AI)</div>
                <div className="text-xl font-black text-blue-400">{trend.sentimentScore || 0}%</div>
              </div>
            </div>

            <p className="text-slate-300 text-sm leading-relaxed line-clamp-2 italic">
              "{trend.reason || 'Dữ liệu đang cập nhật'}"
            </p>
          </div>
        ))}
        {safeTrends.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-500 italic">
            Không tìm thấy xu hướng cộng đồng mới nhất.
          </div>
        )}
      </div>

      <div className="glass p-8 rounded-2xl bg-gradient-to-br from-indigo-600/10 to-transparent border-indigo-500/20">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <i className="fa-solid fa-brain text-indigo-400"></i>
          Nhận định xu hướng xã hội
        </h3>
        <p className="text-slate-300 text-sm leading-relaxed">
          Hiện tại, cộng đồng đang có xu hướng quan tâm mạnh đến nhóm ngành {safeTrends.length > 0 ? 'được nhắc nhiều trong danh sách trên' : 'đang biến động'}. 
          Dòng tiền từ nhà đầu tư cá nhân trên các nền tảng mạng xã hội đang có dấu hiệu "FOMO" nhẹ ở các mã có tin tức hỗ trợ về cổ tức và kết quả kinh doanh quý. 
          Khuyến nghị: Theo dõi sát các điểm đảo chiều tâm lý khi điểm "Tâm lý AI" vượt ngưỡng 85%.
        </p>
      </div>
    </div>
  );
};

export default CommunityView;
