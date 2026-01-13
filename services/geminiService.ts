
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, GroundingLink, NewsItem, MarketIndex, MarketMover, SocialTrend } from "../types";

// Hàm khởi tạo AI instance với khóa mới nhất từ process.env.API_KEY
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getMarketOverview = async (): Promise<MarketIndex[]> => {
  const ai = getAI();
  const prompt = `Lấy giá trị hiện tại, điểm thay đổi và % thay đổi của các chỉ số chứng khoán Việt Nam sau: VN-INDEX, HNX-INDEX, UPCOM-INDEX, VN30. Trả về JSON array.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              value: { type: Type.NUMBER },
              change: { type: Type.NUMBER },
              changePercent: { type: Type.NUMBER }
            },
            required: ["name", "value", "change", "changePercent"]
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Market Overview Error:", error);
    return [];
  }
};

export const getMarketMovers = async (): Promise<{ gainers: MarketMover[], losers: MarketMover[], active: MarketMover[] }> => {
  const ai = getAI();
  const prompt = `Tìm danh sách các cổ phiếu biến động mạnh nhất hôm nay tại VN: top tăng giá, top giảm giá và top giao dịch nhiều nhất. Trả về JSON object { gainers: [], losers: [], active: [] }.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            gainers: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { ticker: {type:Type.STRING}, price: {type:Type.NUMBER}, changePercent: {type:Type.NUMBER}, volume: {type:Type.STRING} } } },
            losers: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { ticker: {type:Type.STRING}, price: {type:Type.NUMBER}, changePercent: {type:Type.NUMBER}, volume: {type:Type.STRING} } } },
            active: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { ticker: {type:Type.STRING}, price: {type:Type.NUMBER}, changePercent: {type:Type.NUMBER}, volume: {type:Type.STRING} } } },
          }
        }
      }
    });
    return JSON.parse(response.text || '{"gainers":[],"losers":[],"active":[]}');
  } catch (error: any) {
    if (error.message?.includes("Requested entity was not found")) {
      console.warn("API Key might be invalid or project not found.");
    }
    return { gainers: [], losers: [], active: [] };
  }
};

export const getSocialTrends = async (): Promise<SocialTrend[]> => {
  const ai = getAI();
  const prompt = `Phân tích các hội nhóm Facebook chứng khoán, Zalo, TikTok và diễn đàn F319 để tìm ra 5 mã cổ phiếu đang được cộng đồng quan tâm nhất hiện nay tại Việt Nam. 
  Đánh giá điểm tâm lý (0-100), số lượng nhắc tới và lý do tại sao nó đang "hot". 
  Trả về JSON array.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              ticker: { type: Type.STRING },
              sentimentScore: { type: Type.NUMBER },
              mentionCount: { type: Type.STRING },
              platforms: { type: Type.ARRAY, items: { type: Type.STRING } },
              status: { type: Type.STRING, enum: ['Hot', 'Rising', 'Alert'] },
              reason: { type: Type.STRING }
            },
            required: ["ticker", "sentimentScore", "mentionCount", "platforms", "status", "reason"]
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    return [];
  }
};

export const getAIAnalysis = async (ticker: string): Promise<AnalysisResult> => {
  const ai = getAI();
  const prompt = `Hãy phân tích mã cổ phiếu ${ticker} trên thị trường chứng khoán Việt Nam. Trả về kết quả JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview", // Use Pro for deep analysis
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            technicalAnalysis: { type: Type.STRING },
            fundamentalAnalysis: { type: Type.STRING },
            risks: { type: Type.STRING },
            recommendation: { type: Type.STRING, enum: ['BUY', 'SELL', 'HOLD', 'NEUTRAL'] },
            financialRatios: {
              type: Type.OBJECT,
              properties: {
                pe: { type: Type.NUMBER },
                eps: { type: Type.NUMBER },
                roe: { type: Type.STRING },
                pb: { type: Type.NUMBER },
                dividendYield: { type: Type.STRING },
                marketCap: { type: Type.STRING }
              }
            },
            priceForecast: {
              type: Type.OBJECT,
              properties: {
                targetPrice: { type: Type.NUMBER },
                currentPrice: { type: Type.NUMBER },
                timeframe: { type: Type.STRING },
                confidence: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH'] },
                reasoning: { type: Type.STRING }
              }
            },
            news: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  source: { type: Type.STRING },
                  url: { type: Type.STRING },
                  time: { type: Type.STRING },
                  category: { type: Type.STRING, enum: ['Kết quả kinh doanh', 'Cổ tức', 'Vĩ mô', 'Giao dịch', 'Tin chung'] }
                }
              }
            }
          }
        }
      },
    });

    const result = JSON.parse(response.text || "{}");
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: GroundingLink[] = groundingChunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({
        uri: chunk.web.uri,
        title: chunk.web.title || "Nguồn tin"
      }));

    return { ...result, sources };
  } catch (error) {
    throw error;
  }
};

export const searchStockNews = async (ticker: string, query: string): Promise<NewsItem[]> => {
  const ai = getAI();
  const prompt = `Tìm tin tức về mã ${ticker} liên quan đến: "${query}". Trả về JSON array.`;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      },
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    return [];
  }
};
