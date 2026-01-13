
export interface StockInfo {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
}

export interface MarketIndex {
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

export interface GroundingLink {
  uri: string;
  title: string;
}

export interface FinancialRatios {
  pe?: number;
  eps?: number;
  roe?: string;
  pb?: number;
  dividendYield?: string;
  marketCap?: string;
}

export interface PriceForecast {
  targetPrice: number;
  currentPrice: number;
  timeframe: string;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  reasoning: string;
}

export interface NewsItem {
  title: string;
  source: string;
  url: string;
  time: string;
  category: 'Kết quả kinh doanh' | 'Cổ tức' | 'Vĩ mô' | 'Giao dịch' | 'Tin chung';
}

export interface AnalysisResult {
  summary: string;
  technicalAnalysis: string;
  fundamentalAnalysis: string;
  risks: string;
  recommendation: 'BUY' | 'SELL' | 'HOLD' | 'NEUTRAL';
  financialRatios: FinancialRatios;
  priceForecast: PriceForecast;
  news: NewsItem[];
  sources: GroundingLink[];
}

export interface ChartDataPoint {
  date: string;
  price: number;
  volume: number;
}

export interface PortfolioStock {
  ticker: string;
  addedPrice: number;
  currentPrice: number;
  change: number;
  changePercent: number;
}
