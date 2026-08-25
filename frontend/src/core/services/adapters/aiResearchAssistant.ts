/**
 * AI Research Assistant service.
 * Delegates to the Laravel AI proxy (`POST /api/ai/chat`) so gateway
 * credentials never reach the browser (§41: secrets server-side only).
 *
 * Laravel mapping: App\Http\Controllers\Api\AiController@chat
 */
import { logger } from "@core/logging";
import { http } from "@core/api/RequestBuilder";

export interface AiResearchInput {
  message: string;
  language?: string;
  context?: "learn" | "healthcare" | "needs" | "general";
}

export async function aiResearchAssistant(input: AiResearchInput): Promise<string> {
  const { message, language = "en", context = "general" } = input;

  try {
    const res = await http.post<{ data: { content: string }; message?: string }>(
      "/api/ai/chat",
      { message, context, language },
    );

    return res.data?.content ?? "Sorry, I could not process your request.";
  } catch (err) {
    logger.error("[aiResearch]", err);
    throw err;
  }
}
