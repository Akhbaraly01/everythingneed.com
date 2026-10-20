<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Core\Localization\AutoTranslateService;
use Core\Localization\TranslationProviderUnavailable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * POST /api/i18n/auto-translate
 *
 * The browser collects visible text nodes and attributes, chunks them
 * under the configured caps, and receives translations aligned by
 * index. Failures return 503 so the client silently keeps the source
 * text (a translation outage must never blank the page).
 */
class AutoTranslateController extends Controller
{
    public function __invoke(Request $request, AutoTranslateService $service): JsonResponse
    {
        if (! $service->enabled()) {
            return response()->json(['message' => 'Automatic translation is disabled.'], 503);
        }

        $maxTexts = max(1, (int) config('auto_translate.max_texts', 60));
        $maxChars = max(1, (int) config('auto_translate.max_chars', 6000));
        $maxLength = max(1, (int) config('auto_translate.max_text_length', 1000));

        $data = $request->validate([
            'target' => ['required', 'string', 'max:12'],
            'texts' => ['required', 'array', 'min:1', 'max:'.$maxTexts],
            'texts.*' => ['required', 'string', 'max:'.$maxLength],
        ]);

        $target = strtolower($data['target']);

        if (! $service->supports($target)) {
            return response()->json(['message' => 'Unsupported target locale.'], 422);
        }

        $texts = array_values($data['texts']);
        $chars = array_sum(array_map(static fn (string $text): int => mb_strlen($text), $texts));

        if ($chars > $maxChars) {
            return response()->json(['message' => 'Translation payload is too large.'], 422);
        }

        try {
            $translations = $service->translate($texts, $target);
        } catch (TranslationProviderUnavailable $e) {
            report($e);

            return response()->json(['message' => 'Translation service is unavailable.'], 503);
        }

        return response()->json(['translations' => $translations]);
    }
}
