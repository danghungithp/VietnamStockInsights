
import { ChartDataPoint, PortfolioStock } from "../types";

const CORS_PROXY = "https://corsproxy.io/?";

export const getYahooHistoricalData = async (ticker: string, range: string = "3mo"): Promise<ChartDataPoint[]> => {
  const symbol = ticker.includes('.') ? ticker : `${ticker}.VN`;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=1d`;

  try {
    const response = await fetch(`${CORS_PROXY}${encodeURIComponent(url)}`);
    if (!response.ok) throw new Error("Không thể lấy dữ liệu từ Yahoo Finance");
    
    const json = await response.json();
    const result = json.chart.result[0];
    const timestamps = result.timestamp;
    const quotes = result.indicators.quote[0];
    const prices = quotes.close;
    const volumes = quotes.volume;

    return timestamps.map((ts: number, i: number) => {
      const date = new Date(ts * 1000);
      return {
        date: date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
        price: Math.round(prices[i]),
        volume: volumes[i] || 0
      };
    }).filter((item: any) => item.price !== null);
  } catch (error) {
    console.error("Yahoo Finance Fetch Error:", error);
    return [];
  }
};

export const getLatestPrice = async (ticker: string): Promise<Partial<PortfolioStock> | null> => {
  const symbol = ticker.includes('.') ? ticker : `${ticker}.VN`;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1d&interval=1m`;

  try {
    const response = await fetch(`${CORS_PROXY}${encodeURIComponent(url)}`);
    const json = await response.json();
    const result = json.chart.result[0];
    const meta = result.meta;
    const currentPrice = meta.regularMarketPrice;
    const prevClose = meta.previousClose;
    const change = currentPrice - prevClose;
    const changePercent = (change / prevClose) * 100;

    return {
      ticker,
      currentPrice,
      change: Number(change.toFixed(2)),
      changePercent: Number(changePercent.toFixed(2))
    };
  } catch (error) {
    return null;
  }
};
