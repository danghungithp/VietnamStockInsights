
import React, { useState, useMemo, useEffect } from 'react';
import { 
  ComposedChart, 
  Bar, 
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Scatter,
  Cell,
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
    const sum = slice.reduce((acc, curr) => acc + curr.close, 0);
    return Math.round(sum / period);
  });
};

const calculateEMA = (data: ChartDataPoint[], period: number) => {
  const k = 2 / (period + 1);
  let prevEMA: number | null = null;
  return data.map((val, index) => {
    if (index === 0) {
      prevEMA = val.close;
      return val.close;
    }
    const currentEMA = val.close * k + (prevEMA as number) * (1 - k);
    prevEMA = currentEMA;
    return Math.round(currentEMA);
  });
};

const calculateRSI = (data: ChartDataPoint[], period: number = 14) => {
  const rsiValues: (number | null)[] = [];
  let gains = 0;
  let losses = 0;

  for (let i = 1; i < data.length; i++) {
    const diff = data[i].close - data[i - 1].close;
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
      <circle cx={cx} cy={cy} r={12} fill={fill} fillOpacity={0.2} stroke={fill} strokeWidth={1} />
      <text x={cx} y={cy + 4} textAnchor="middle" fill={fill} fontSize="10" fontWeight="bold">
        {payload.signalLabel}
      </text>
    </g>
  );
};

// Custom Candlestick Shape
const Candlestick = (props: any) => {
  const {
    x, y, width, height, open, close, high, low,
  } = props;

  const isUp = close >= open;
  const color = isUp ? '#10b981' : '#f43f5e';

  // The bar represents the body (open/close)
  // Recharts provides x, y, width, height for the bar based on the [open, close] array
  // We need to calculate the ratio to place the whiskers (high/low)
  const ratio = Math.abs(open - close) === 0 ? 1 : height / Math.abs(open - close);
  const highY = y - Math.abs(high - Math.max(open, close)) * ratio;
  const lowY = y + height + Math.abs(Math.min(open, close) - low) * ratio;
  const centerX = x + width / 2;

  return (
    <g>
      {/* Wick (High-Low Line) */}
      <line 
        x1={centerX} 
        y1={highY} 
        x2={centerX} 
        y2={lowY} 
        stroke={color} 
        strokeWidth={1.5} 
      />
      {/* Body (Open-Close Rect) */}
      <rect 
        x={x} 
        y={y} 
        width={width} 
        height={Math.max(height, 1)} 
        fill={color} 
      />
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
  const [showGuide, setShowGuide] = useState(false);

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
    const sma = calculateSMA(rawData, 20);
    const ema = calculateEMA(rawData, 10);
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
        }
      }

      return {
        ...d,
        sma: sma[i],
        ema: ema[i],
        rsi: currentRSI ? Math.round(currentRSI) : null,
        signal: buySell ? d.close : null,
        signalType: buySell,
        signalLabel: buySell === 'BUY' ? 'M' : buySell === 'SELL' ? 'B' : null,
        // Range for the Bar body
        candle: [d.open, d.close]
      };
    });
  }, [rawData, showSignals]);

  const latestSignals = useMemo(() => {
    return [...processedData]
      .filter(d => d.signalType)
      .reverse()
      .slice(0, 3);
  }, [processedData]);

  if (loading) return <div className="glass p-6 rounded-2xl h-[450px] flex items-center justify-center animate-pulse"><span className="text-slate-500">Đang tải biểu đồ kỹ thuật...</span></div>;

  if (error) return <div className="glass p-6 rounded-2xl h-[450px] flex items-center justify-center"><span className="text-rose-400">Không thể tải dữ liệu biểu đồ.</span></div>;

  return (
    <div className="space-y-4">
      <div className="glass p-6 rounded-2xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <i className="fa-solid fa-chart-line text-blue-500"></i>
              Biểu đồ nến {ticker}
            </h3>
            <button 
              onClick={() => setShowGuide(!showGuide)}
              className="text-[10px] text-blue-400 font-bold hover:underline mt-1"
            >
              <i className="fa-solid fa-circle-info mr-1"></i> Cách đọc biểu đồ nến?
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {['SMA', 'EMA', 'RSI', 'M/B'].map((label) => {
              const isActive = label === 'SMA' ? showSMA : label === 'EMA' ? showEMA : label === 'RSI' ? showRSI : showSignals;
              const setFunc = label === 'SMA' ? setShowSMA : label === 'EMA' ? setShowEMA : label === 'RSI' ? setShowRSI : setShowSignals;
              return (
                <button 
                  key={label}
                  onClick={() => setFunc(!isActive)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${isActive ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {showGuide && (
          <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-slate-300 leading-relaxed animate-in fade-in slide-in-from-top-2">
            <p className="mb-2 font-bold text-blue-400 uppercase tracking-wider">Hướng dẫn:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li><strong className="text-emerald-400">Nến xanh:</strong> Giá đóng cửa cao hơn mở cửa (Tăng).</li>
              <li><strong className="text-rose-400">Nến đỏ:</strong> Giá đóng cửa thấp hơn mở cửa (Giảm).</li>
              <li><strong className="text-slate-200">Bóng nến:</strong> Đường thẳng mảnh thể hiện giá cao nhất và thấp nhất trong ngày.</li>
              <li><strong className="text-blue-400">SMA/EMA:</strong> Đường trung bình giúp xác định xu hướng dài hạn và ngắn hạn.</li>
            </ul>
          </div>
        )}

        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={processedData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="date" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis 
                yAxisId="price" 
                stroke="#3b82f6" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                domain={['auto', 'auto']} 
                tickFormatter={(val) => val.toLocaleString('vi-VN')} 
              />
              <YAxis yAxisId="volume" orientation="right" hide />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', fontSize: '11px' }}
                labelStyle={{ color: '#94a3b8', marginBottom: '4px', fontWeight: 'bold' }}
                formatter={(value: any, name: string) => {
                  if (Array.isArray(value)) return [`O: ${value[0].toLocaleString()} - C: ${value[1].toLocaleString()}`, 'OHLC'];
                  return [value.toLocaleString('vi-VN'), name];
                }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
              
              <Bar yAxisId="volume" dataKey="volume" fill="#1e293b" opacity={0.2} name="Khối lượng" />

              {/* Candlestick Body and Wicks */}
              <Bar 
                yAxisId="price" 
                dataKey="candle" 
                shape={<Candlestick />} 
                name="Giá" 
              />
              
              {showSMA && <Line yAxisId="price" type="monotone" dataKey="sma" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="SMA 20" />}
              {showEMA && <Line yAxisId="price" type="monotone" dataKey="ema" stroke="#a855f7" strokeWidth={1.5} dot={false} name="EMA 10" />}
              
              {showSignals && (
                <Scatter yAxisId="price" dataKey="signal" shape={<SignalShape />} name="Tín hiệu M/B">
                  {processedData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.signalType === 'BUY' ? '#10b981' : '#f43f5e'} />
                  ))}
                </Scatter>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {showRSI && (
          <div className="mt-4 h-[100px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={processedData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <YAxis domain={[0, 100]} ticks={[30, 70]} stroke="#475569" fontSize={9} tickLine={false} axisLine={false} />
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <Line type="monotone" dataKey="rsi" stroke="#06b6d4" strokeWidth={1} dot={false} name="RSI" />
                <Line dataKey={() => 70} stroke="#f43f5e" strokeDasharray="5 5" dot={false} opacity={0.3} />
                <Line dataKey={() => 30} stroke="#10b981" strokeDasharray="5 5" dot={false} opacity={0.3} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-slate-800">
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Tín hiệu kỹ thuật gần đây</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {latestSignals.length > 0 ? latestSignals.map((sig, i) => (
              <div key={i} className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 flex items-center justify-between">
                <div>
                  <div className={`text-xs font-black ${sig.signalType === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {sig.signalType === 'BUY' ? 'MUA (RSI < 30)' : 'BÁN (RSI > 70)'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">{sig.date}</div>
                </div>
                <div className="text-xs font-bold text-white">
                  {sig.close.toLocaleString('vi-VN')}
                </div>
              </div>
            )) : (
              <div className="col-span-3 text-center py-4 text-xs text-slate-600 italic">
                Chưa phát hiện tín hiệu mua bán rõ rệt trong giai đoạn này.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceChart;
