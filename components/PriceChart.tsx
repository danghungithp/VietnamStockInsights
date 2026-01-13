
import React, { useState, useMemo, useEffect } from 'react';
import { 
  ComposedChart, 
  Area, 
  Bar, 
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Scatter,
  Cell,
  LabelList,
  Legend
} from 'recharts';
import { ChartDataPoint } from '../types';
import { getYahooHistoricalData } from '../services/financeService';

interface Props {
  ticker: string;
}

const calculateSMA = (data: ChartDataPoint[], period: number) => {
  return data.map((val, index) => {
    if (index < period - 1) return null;
    const slice = data.slice(index - period + 1, index + 1);
    const sum = slice.reduce((acc, curr) => acc + curr.price, 0);
    return Math.round(sum / period);
  });
};

const calculateEMA = (data: ChartDataPoint[], period: number) => {
  const k = 2 / (period + 1);
  let prevEMA: number | null = null;
  return data.map((val, index) => {
    if (index === 0) {
      prevEMA = val.price;
      return val.price;
    }
    const currentEMA = val.price * k + (prevEMA as number) * (1 - k);
    prevEMA = currentEMA;
    return Math.round(currentEMA);
  });
};

const calculateRSI = (data: ChartDataPoint[], period: number = 14) => {
  const rsiValues: (number | null)[] = [];
  let gains = 0;
  let losses = 0;

  for (let i = 1; i < data.length; i++) {
    const diff = data[i].price - data[i - 1].price;
    if (i <= period) {
      if (diff > 0) gains += diff;
      else losses -= diff;
      
      if (i === period) {
        let avgGain = gains / period;
        let avgLoss = losses / period;
        let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        rsiValues.push(100 - 100 / (1 + rs));
      } else {
        rsiValues.push(null);
      }
    } else {
      const gain = diff > 0 ? diff : 0;
      const loss = diff < 0 ? -diff : 0;
      
      const prevAvgGain = (gains / period); 
      const prevAvgLoss = (losses / period);
      
      const avgGain = (prevAvgGain * (period - 1) + gain) / period;
      const avgLoss = (prevAvgLoss * (period - 1) + loss) / period;
      
      gains = avgGain * period;
      losses = avgLoss * period;
      
      let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      rsiValues.push(100 - 100 / (1 + rs));
    }
  }
  return [null, ...rsiValues];
};

const SignalShape = (props: any) => {
  const { cx, cy, fill, payload } = props;
  if (!payload.signal) return null;

  return (
    <g>
      {payload.signalType === 'BUY' ? (
        <path d={`M${cx},${cy - 10} L${cx - 8},${cy + 5} L${cx + 8},${cy + 5} Z`} fill={fill} stroke="#fff" strokeWidth={1} />
      ) : (
        <path d={`M${cx},${cy + 10} L${cx - 8},${cy - 5} L${cx + 8},${cy - 5} Z`} fill={fill} stroke="#fff" strokeWidth={1} />
      )}
    </g>
  );
};

const PriceChart: React.FC<Props> = ({ ticker }) => {
  const [rawData, setRawData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const [showSMA, setShowSMA] = useState(true);
  const [showEMA, setShowEMA] = useState(false);
  const [showRSI, setShowRSI] = useState(true);
  const [showSignals, setShowSignals] = useState(true);
  const [volumeType, setVolumeType] = useState<'bar' | 'area'>('bar');
  const [smaPeriod, setSmaPeriod] = useState(20);
  const [emaPeriod, setEmaPeriod] = useState(10);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(false);
      try {
        const data = await getYahooHistoricalData(ticker);
        if (data.length > 0) {
          setRawData(data);
        } else {
          setError(true);
        }
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [ticker]);

  const processedData = useMemo(() => {
    if (rawData.length === 0) return [];
    const sma = calculateSMA(rawData, smaPeriod);
    const ema = calculateEMA(rawData, emaPeriod);
    const rsi = calculateRSI(rawData, 14);

    let lastSignalType: 'BUY' | 'SELL' | null = null;

    return rawData.map((d, i) => {
      let buySell: 'BUY' | 'SELL' | null = null;
      const currentRSI = rsi[i];
      
      if (showSignals && currentRSI !== null) {
        if (currentRSI < 30 && lastSignalType !== 'BUY') {
          buySell = 'BUY';
          lastSignalType = 'BUY';
        } else if (currentRSI > 70 && lastSignalType !== 'SELL') {
          buySell = 'SELL';
          lastSignalType = 'SELL';
        } else if (currentRSI >= 30 && currentRSI <= 70) {
          lastSignalType = null;
        }
      }

      return {
        ...d,
        sma: sma[i],
        ema: ema[i],
        rsi: currentRSI ? Math.round(currentRSI) : null,
        signal: buySell ? d.price : null,
        signalType: buySell,
        signalLabel: buySell === 'BUY' ? 'M' : buySell === 'SELL' ? 'B' : null
      };
    });
  }, [rawData, smaPeriod, emaPeriod, showSignals]);

  const formatVolume = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    return `${(value / 1000).toFixed(0)}K`;
  };

  if (loading) {
    return (
      <div className="glass p-6 rounded-2xl h-[450px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 text-sm">Đang tải dữ liệu từ Yahoo Finance...</span>
        </div>
      </div>
    );
  }

  if (error || processedData.length === 0) {
    return (
      <div className="glass p-6 rounded-2xl h-[450px] flex items-center justify-center text-slate-500 italic text-center">
        <div>
          <i className="fa-solid fa-triangle-exclamation text-3xl mb-4 text-amber-500"></i>
          <p>Không thể tìm thấy dữ liệu giá thực tế cho mã {ticker} trên Yahoo Finance.</p>
          <p className="text-xs mt-2">Gợi ý: Yahoo Finance hỗ trợ tốt các mã lớn (HPG.VN, SSI.VN...)</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="glass p-6 rounded-2xl flex flex-col">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <i className="fa-solid fa-chart-line text-blue-500"></i>
            Dữ liệu Yahoo Finance ({ticker})
          </h3>
          
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setShowSMA(!showSMA)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border ${showSMA ? 'bg-orange-500/20 border-orange-500 text-orange-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
            >
              SMA {smaPeriod}
            </button>
            <button 
              onClick={() => setShowEMA(!showEMA)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border ${showEMA ? 'bg-purple-500/20 border-purple-500 text-purple-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
            >
              EMA {emaPeriod}
            </button>
            <button 
              onClick={() => setShowRSI(!showRSI)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border ${showRSI ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
            >
              RSI
            </button>
            <button 
              onClick={() => setShowSignals(!showSignals)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border ${showSignals ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
            >
              M/B
            </button>
            <button 
              onClick={() => setVolumeType(volumeType === 'bar' ? 'area' : 'bar')}
              title={`Chuyển sang biểu đồ ${volumeType === 'bar' ? 'Vùng' : 'Cột'}`}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border border-blue-500/50 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20`}
            >
              <i className={`fa-solid ${volumeType === 'bar' ? 'fa-chart-simple' : 'fa-chart-area'} mr-1`}></i>
              {volumeType === 'bar' ? 'Cột' : 'Vùng'}
            </button>
          </div>
        </div>

        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={processedData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#475569" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#475569" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="date" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} minTickGap={40} />
              <YAxis yAxisId="price" stroke="#3b82f6" fontSize={10} tickLine={false} axisLine={false} domain={['auto', 'auto']} tickFormatter={(val) => val.toLocaleString('vi-VN')} />
              <YAxis yAxisId="volume" orientation="right" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} domain={[0, (max: number) => max * 4]} tickFormatter={formatVolume} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                itemStyle={{ fontSize: '12px' }}
                formatter={(val: any, name: string) => [val.toLocaleString('vi-VN'), name]}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.05em', color: '#94a3b8' }} />
              
              {volumeType === 'bar' ? (
                <Bar yAxisId="volume" dataKey="volume" fill="#1e293b" opacity={0.4} barSize={12} name="Khối lượng (Cột)" />
              ) : (
                <Area yAxisId="volume" type="monotone" dataKey="volume" stroke="#1e293b" fill="url(#colorVolume)" strokeWidth={1} name="Khối lượng (Vùng)" dot={false} />
              )}

              <Area yAxisId="price" type="monotone" dataKey="price" stroke="#3b82f6" fill="url(#colorPrice)" strokeWidth={2} dot={false} name="Giá đóng cửa" />
              
              {showSMA && <Line yAxisId="price" type="monotone" dataKey="sma" stroke="#f59e0b" strokeWidth={1.5} dot={false} name={`SMA ${smaPeriod}`} />}
              {showEMA && <Line yAxisId="price" type="monotone" dataKey="ema" stroke="#a855f7" strokeWidth={1.5} dot={false} name={`EMA ${emaPeriod}`} />}
              
              {showSignals && (
                <Scatter yAxisId="price" dataKey="signal" shape={<SignalShape />} name="Tín hiệu M/B">
                  {processedData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.signalType === 'BUY' ? '#10b981' : '#f43f5e'} />
                  ))}
                  <LabelList dataKey="signalLabel" position="top" offset={15} style={{ fontSize: '10px', fontWeight: 'bold', fill: '#fff' }} />
                </Scatter>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {showRSI && (
          <div className="mt-6 border-t border-slate-800 pt-6 h-[150px]">
            <div className="flex justify-between items-center mb-2 px-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Chỉ số RSI (14)</span>
              <span className="text-[10px] font-bold text-cyan-400">{processedData[processedData.length-1]?.rsi}</span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={processedData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" hide />
                <YAxis domain={[0, 100]} ticks={[30, 70]} stroke="#475569" fontSize={9} tickLine={false} axisLine={false} />
                <Line type="monotone" dataKey="rsi" stroke="#06b6d4" strokeWidth={1.5} dot={false} isAnimationActive={false} name="RSI" />
                <Line dataKey={() => 70} stroke="#f43f5e" strokeDasharray="3 3" dot={false} strokeWidth={1} opacity={0.3} />
                <Line dataKey={() => 30} stroke="#10b981" strokeDasharray="3 3" dot={false} strokeWidth={1} opacity={0.3} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default PriceChart;
