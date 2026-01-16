
import { ChartDataPoint, PortfolioStock } from "../types";

// Sử dụng AllOrigins với logic xử lý response an toàn hơn
const CORS_PROXY = "https://api.allorigins.win/raw?url=";

export const getYahooHistoricalData = async (ticker: string, range: string = "3mo"): Promise<ChartDataPoint[]> => {
  const symbol = ticker.includes('.') ? ticker : `${ticker}.VN`;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=1d`;

  try {
    const response = await fetch(`${CORS_PROXY}${encodeURIComponent(url)}`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Proxy error: ${response.status} ${errorText}`);
    }
    
    const json = await response.json();
    
    if (!json || !json.chart || !json.chart.result) {
      console.warn("Yahoo API Empty Result for", symbol, json);
      return [];
    }

    const result = json.chart.result[0];
    const timestamps = result.timestamp;
    if (!timestamps) return [];

    const quotes = result.indicators.quote[0];
    const adjClose = result.indicators.adjclose?.[0]?.adjclose || quotes.close;
    
    const { open, high, low, volume: volumes } = quotes;

    return timestamps.map((ts: number, i: number) => {
      const closePrice = adjClose[i] || quotes.close[i];
      if (closePrice === null || closePrice === undefined) return null;

      const date = new Date(ts * 1000);
      return {
        date: date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
        price: Math.round(closePrice),
        open: Math.round(open[i] || closePrice),
        high: Math.round(high[i] || closePrice),
        low: Math.round(low[i] || closePrice),
        close: Math.round(closePrice),
        volume: volumes[i] || 0
      };
    }).filter((item: any) => item !== null);
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
    if (!response.ok) return null;
    
    const json = await response.json();
    if (!json || !json.chart || !json.chart.result) return null;
    
    const result = json.chart.result[0];
    const meta = result.meta;
    if (!meta) return null;

    const currentPrice = meta.regularMarketPrice;
    const prevClose = meta.previousClose;
    const change = currentPrice - prevClose;
    const changePercent = (change / prevClose) * 100;

    return {
      ticker,
      currentPrice: Math.round(currentPrice),
      change: Number(change.toFixed(2)),
      changePercent: Number(changePercent.toFixed(2))
    };
  } catch (error) {
    console.error("Latest Price Error:", error);
    return null;
  }
};
