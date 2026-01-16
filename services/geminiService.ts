
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, GroundingLink, NewsItem, MarketIndex, MarketMover, SocialTrend } from "../types";

// Hàm hỗ trợ parse JSON an toàn từ AI response
const safeParseJSON = (text: string, fallback: any) => {
  try {
    // Loại bỏ markdown code blocks nếu có
    const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("JSON Parse Error:", e, "Text:", text);
    return fallback;
  }
};

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined") {
    throw new Error("API_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey });
};

export const getMarketOverview = async (): Promise<MarketIndex[]> => {
  try {
    const ai = getAI();
    const prompt = `Lấy giá trị hiện tại, điểm thay đổi và % thay đổi của các chỉ số chứng khoán Việt Nam sau: VN-INDEX, HNX-INDEX, UPCOM-INDEX, VN30. Trả về JSON array.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      }
    });
    const data = safeParseJSON(response.text || "[]", []);
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    console.warn("Market Overview failed:", error.message);
    return [];
  }
};

export const getMarketMovers = async (): Promise<{ gainers: MarketMover[], losers: MarketMover[], active: MarketMover[] }> => {
  try {
    const ai = getAI();
    const prompt = `Tìm danh sách các cổ phiếu biến động mạnh nhất hôm nay tại VN: top tăng giá, top giảm giá và top giao dịch nhiều nhất. Trả về JSON object { gainers: [], losers: [], active: [] }.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      }
    });
    const data = safeParseJSON(response.text || "{}", { gainers: [], losers: [], active: [] });
    return {
      gainers: Array.isArray(data.gainers) ? data.gainers : [],
      losers: Array.isArray(data.losers) ? data.losers : [],
      active: Array.isArray(data.active) ? data.active : []
    };
  } catch (error: any) {
    console.warn("Market Movers failed");
    return { gainers: [], losers: [], active: [] };
  }
};

export const getSocialTrends = async (): Promise<SocialTrend[]> => {
  try {
    const ai = getAI();
    const prompt = `Phân tích tâm lý cộng đồng đầu tư chứng khoán Việt Nam hôm nay. Tìm 5 mã đang được nhắc tới nhiều nhất. Trả về JSON array.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      }
    });
    const data = safeParseJSON(response.text || "[]", []);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    return [];
  }
};

export const getAIAnalysis = async (ticker: string): Promise<AnalysisResult> => {
  const ai = getAI();
  const prompt = `Hãy phân tích mã cổ phiếu ${ticker} trên thị trường chứng khoán Việt Nam. Cung cấp dữ liệu chi tiết về kỹ thuật, cơ bản và dự báo giá. Trả về kết quả JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      },
    });

    const result = safeParseJSON(response.text || "{}", {});
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: GroundingLink[] = groundingChunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({
        uri: chunk.web.uri,
        title: chunk.web.title || "Nguồn tin"
      }));

    return { 
      ...result, 
      sources,
      news: Array.isArray(result.news) ? result.news : [],
      financialRatios: result.financialRatios || {},
      priceForecast: result.priceForecast || { targetPrice: 0, currentPrice: 0, timeframe: "N/A", confidence: "LOW", reasoning: "N/A" }
    };
  } catch (error) {
    throw error;
  }
};

export const searchStockNews = async (ticker: string, query: string): Promise<NewsItem[]> => {
  try {
    const ai = getAI();
    const prompt = `Tìm tin tức mới nhất về mã ${ticker} liên quan đến: "${query}". Trả về JSON array các đối tượng NewsItem {title, source, url, time, category}.`;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      },
    });
    const data = safeParseJSON(response.text || "[]", []);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    return [];
  }
};
