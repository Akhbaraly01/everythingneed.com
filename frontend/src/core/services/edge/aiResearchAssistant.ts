/**
 * AI Research Assistant service.
 * Calls an AI gateway for chat completions with context-aware prompts.
 *
 * Laravel mapping: Modules/Learn/Services/AiResearchAssistantService.php
 */
import { logger } from "@core/logging";
import { http } from "@core/api/RequestBuilder";

const AI_GATEWAY_URL = import.meta.env.VITE_AI_GATEWAY_URL || "https://api.openai.com/v1/chat/completions";
const AI_API_KEY = import.meta.env.VITE_AI_API_KEY || "";

interface AiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface AiResponse {
  choices?: Array<{ message: { content: string } }>;
  error?: { message: string };
}

const SYSTEM_PROMPTS: Record<string, string> = {
  learn: `You are an intelligent learning assistant that helps users with educational content, course recommendations, and research across multiple subjects including technology, business, agriculture, healthcare, and more. Respond in the user's preferred language. Provide detailed, helpful, and accurate information.`,
  healthcare: `You are a healthcare information assistant that provides general health information and guidance. IMPORTANT: Always remind users to consult healthcare professionals for medical advice. Respond in the user's preferred language.`,
  needs: `You are a helpful assistant for a platform that covers all human needs - from transportation and housing to jobs, services, and products. Respond in the user's preferred language.`,
  general: `You are a helpful AI assistant for a multi-service platform. Respond in the user's preferred language. Be helpful, accurate, and concise.`,
};

const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  en: "Respond in English.",
  es: "Responde en español.",
  fr: "Répondez en français.",
  de: "Antworten Sie auf Deutsch.",
  zh: "请用中文回复。",
  ar: "أجب باللغة العربية.",
  hi: "हिंदी में जवाब दें।",
  pt: "Responda em português.",
  ru: "Отвечайте на русском языке.",
  ja: "日本語で回答してください。",
  ko: "한국어로 답변해 주세요.",
  sw: "Jibu kwa Kiswahili.",
};

export interface AiResearchInput {
  message: string;
  language?: string;
  context?: "learn" | "healthcare" | "needs" | "general";
}

export async function aiResearchAssistant(input: AiResearchInput): Promise<string> {
  const { message, language = "en", context = "general" } = input;

  const systemPrompt = `${SYSTEM_PROMPTS[context] || SYSTEM_PROMPTS.general}\n\n${LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS.en}`;

  try {
    const data = await http.post<AiResponse>(
      AI_GATEWAY_URL,
      {
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        max_tokens: 1500,
      },
      {
        headers: {
          Authorization: `Bearer ${AI_API_KEY}`,
        },
      }
    );

    if (data.error) {
      throw new Error(data.error.message || "AI request failed");
    }

    return data.choices?.[0]?.message?.content || "Sorry, I could not process your request.";
  } catch (err) {
    logger.error("[aiResearch]", err);
    throw err;
  }
}
