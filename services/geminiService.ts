
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, GroundingLink, NewsItem, MarketIndex } from "../types";

const API_KEY = process.env.API_KEY || "";

export const getMarketOverview = async (): Promise<MarketIndex[]> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const prompt = `Lấy giá trị hiện tại, điểm thay đổi và % thay đổi của các chỉ số chứng khoán Việt Nam sau: VN-INDEX, HNX-INDEX, UPCOM-INDEX, VN30. 
  Hãy tìm thông tin thực tế mới nhất từ Yahoo Finance hoặc CafeF.
  Trả về định dạng JSON array: [{"name": string, "value": number, "change": number, "changePercent": number}]`;

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

export const getAIAnalysis = async (ticker: string): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const prompt = `Hãy phân tích mã cổ phiếu ${ticker} trên thị trường chứng khoán Việt Nam. 
  Sử dụng dữ liệu từ Yahoo Finance và các nguồn tin tức tài chính uy tín (CafeF, Vietstock).
  Cập nhật thông tin mới nhất về kết quả kinh doanh quý gần nhất, tin tức sự kiện quan trọng, nhận định kỹ thuật và các rủi ro hiện hữu.
  
  Đồng thời, hãy tìm ít nhất 5 tin tức mới nhất liên quan đến mã ${ticker}.
  
  YÊU CẦU ĐẶC BIỆT: Đưa ra một dự báo giá mục tiêu trong vòng 3-6 tháng tới.
  
  Trả về kết quả theo định dạng JSON chuyên nghiệp.`;

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
              },
              required: ["targetPrice", "currentPrice", "timeframe", "confidence", "reasoning"]
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
                },
                required: ["title", "source", "url", "time", "category"]
              }
            }
          },
          required: ["summary", "technicalAnalysis", "fundamentalAnalysis", "risks", "recommendation", "financialRatios", "priceForecast", "news"]
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
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const searchStockNews = async (ticker: string, query: string): Promise<NewsItem[]> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const prompt = `Tìm tin tức về mã ${ticker} liên quan đến: "${query}". Trả về JSON array.`;
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
              title: { type: Type.STRING },
              source: { type: Type.STRING },
              url: { type: Type.STRING },
              time: { type: Type.STRING },
              category: { type: Type.STRING, enum: ['Kết quả kinh doanh', 'Cổ tức', 'Vĩ mô', 'Giao dịch', 'Tin chung'] }
            }
          }
        }
      },
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    return [];
  }
};
