import { GoogleGenAI } from "@google/genai";
import { AppData, WorkStatus } from "../types";
import { STATUS_CONFIGS } from "../constants";

const getGeminiClient = () => {
    // Only initialize if key exists to prevent immediate crashes, though app requires it.
    if (!process.env.API_KEY) {
        throw new Error("API Key is missing");
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateDailyAnalysis = async (date: string, dayLog: Record<number, WorkStatus>): Promise<string> => {
    try {
        const ai = getGeminiClient();
        
        // Transform log into a readable summary string
        let logSummary = "";
        let hasData = false;
        
        Object.entries(dayLog).forEach(([hour, status]) => {
            if (status !== WorkStatus.EMPTY) {
                hasData = true;
                logSummary += `- ${hour}:00 to ${Number(hour) + 1}:00 : ${STATUS_CONFIGS[status].label}\n`;
            }
        });

        if (!hasData) {
            return "今天还没有任何记录，无法进行分析。请先记录一些工作状态！";
        }

        const prompt = `
        你是一个幽默、犀利但富有同理心的工作效率助手。
        这是用户在 ${date} 的工作状态记录（按小时）：
        
        ${logSummary}

        请根据这些数据生成一份简短的日报点评（150字以内）。
        
        要求：
        1. 风格可以是稍微带点调侃（如果摸鱼多）或者鼓励（如果认真多）。
        2. 指出用户今天的时间分配特点。
        3. 给出一条简短的改进建议。
        4. 不要使用 Markdown 格式，只返回纯文本。
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });

        return response.text || "无法生成分析，请稍后再试。";
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "AI 分析服务暂时不可用，请检查网络或 API Key 设置。";
    }
};