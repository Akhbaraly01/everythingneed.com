<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

/**
 * Server-side proxy for AI chat completions (§41: secrets never reach the
 * browser). The gateway URL/key live only in backend env configuration.
 */
class AiController extends Controller
{
    private const CONTEXT_PROMPTS = [
        'learn' => 'You are an intelligent learning assistant that helps users with educational content, course recommendations, and research across multiple subjects including technology, business, agriculture, healthcare, and more. Respond in the user\'s preferred language. Provide detailed, helpful, and accurate information.',
        'healthcare' => 'You are a healthcare information assistant that provides general health information and guidance. IMPORTANT: Always remind users to consult healthcare professionals for medical advice. Respond in the user\'s preferred language.',
        'needs' => 'You are a helpful assistant for a platform that covers all human needs - from transportation and housing to jobs, services, and products. Respond in the user\'s preferred language.',
        'general' => 'You are a helpful AI assistant for a multi-service platform. Respond in the user\'s preferred language. Be helpful, accurate, and concise.',
    ];

    private const LANGUAGES = [
        'en' => 'Respond in English.', 'es' => 'Responde en español.', 'fr' => 'Répondez en français.',
        'de' => 'Antworten Sie auf Deutsch.', 'zh' => '请用中文回复。', 'ar' => 'أجب باللغة العربية.',
        'hi' => 'हिंदी में जवाब दें।', 'pt' => 'Responda em português.', 'ru' => 'Отвечайте на русском языке.',
        'ja' => '日本語で回答してください。', 'ko' => '한국어로 답변해 주세요.', 'sw' => 'Jibu kwa Kiswahili.',
    ];

    public function chat(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message' => ['required', 'string', 'max:4000'],
            'context' => ['nullable', 'string', 'in:learn,healthcare,needs,general'],
            'language' => ['nullable', 'string', 'in:en,es,fr,de,zh,ar,hi,pt,ru,ja,ko,sw'],
        ]);

        $gatewayUrl = config('services.ai.gateway_url');
        $apiKey = config('services.ai.api_key');

        if (!$gatewayUrl || !$apiKey) {
            return response()->json([
                'message' => 'AI assistant is not configured on this deployment.',
                'error' => 'Set AI_GATEWAY_URL and AI_API_KEY in backend environment to enable it.',
            ], 503);
        }

        $systemPrompt = self::CONTEXT_PROMPTS[$validated['context'] ?? 'general']
            ."\n\n".self::LANGUAGES[$validated['language'] ?? 'en'];

        try {
            $response = Http::withToken($apiKey)
                ->timeout(45)
                ->post($gatewayUrl, [
                    'model' => config('services.ai.model') ?: 'gpt-4o-mini',
                    'messages' => [
                        ['role' => 'system', 'content' => $systemPrompt],
                        ['role' => 'user', 'content' => $validated['message']],
                    ],
                    'max_tokens' => 1500,
                ]);
        } catch (\Throwable $e) {
            report($e);

            return response()->json(['message' => 'AI service is temporarily unavailable.'], 502);
        }

        if ($response->failed()) {
            return response()->json([
                'message' => 'AI request failed upstream.',
                'error' => $response->status(),
            ], 502);
        }

        $payload = $response->json();
        $text = $payload['choices'][0]['message']['content'] ?? null;

        if (!is_string($text)) {
            return response()->json(['message' => 'Unexpected AI response shape.'], 502);
        }

        return response()->json(['data' => ['content' => $text]]);
    }
}
