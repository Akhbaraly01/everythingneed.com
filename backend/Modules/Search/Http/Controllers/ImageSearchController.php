<?php

namespace Modules\Search\Http\Controllers;

use App\Http\Controllers\Controller;
use Core\Services\Contracts\SearchServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

/**
 * Search by photo.
 *
 * The shopper either takes a picture with the device camera or picks one
 * from the phone gallery. The image is turned into a marketplace query:
 *
 *   1. When the deployment has an AI gateway (services.ai) the photo is
 *      described by the vision model and the description drives the
 *      search - the same search the keyword box would have run.
 *   2. Without an AI gateway the original file name is used as the
 *      query ("epilator-for-woman" -> "epilator for woman"), which still
 *      finds the product when the shopper saved the picture with a
 *      meaningful name.
 *
 * The photo never leaves the request: it is read into memory, sent to the
 * AI gateway as a data URI and never stored on the platform.
 */
class ImageSearchController extends Controller
{
    private const MAX_BYTES = 5 * 1024 * 1024;

    public function __construct(private SearchServiceInterface $search) {}

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'image' => ['required', 'file', 'image', 'max:'.(self::MAX_BYTES / 1024)],
        ]);

        /** @var \Illuminate\Http\UploadedFile $file */
        $file = $request->file('image');
        $bytes = @file_get_contents($file->getRealPath());

        if ($bytes === false || $bytes === '') {
            return response()->json(['message' => 'The image could not be read.'], 422);
        }

        $query = $this->describe($bytes, $file->getMimeType() ?: 'image/jpeg')
            ?? $this->queryFromFileName($file->getClientOriginalName());

        if ($query === null || $query === '') {
            return response()->json([
                'message' => 'We could not work out what to search for.',
                'error' => 'Add a name to the picture, or configure the AI gateway for photo search.',
            ], 422);
        }

        return response()->json([
            'query' => $query,
            'data' => $this->search->discover($query, 'products'),
        ]);
    }

    /**
     * Ask the vision model for a short marketplace query.
     * Returns null when no AI gateway is configured or the call fails.
     */
    private function describe(string $bytes, string $mimeType): ?string
    {
        $gatewayUrl = config('services.ai.gateway_url');
        $apiKey = config('services.ai.api_key');

        if (! $gatewayUrl || ! $apiKey) {
            return null;
        }

        $dataUri = 'data:'.$mimeType.';base64,'.base64_encode($bytes);

        try {
            $response = Http::withToken($apiKey)
                ->timeout(45)
                ->post($gatewayUrl, [
                    'model' => config('services.ai.model') ?: 'gpt-4o-mini',
                    'messages' => [
                        [
                            'role' => 'system',
                            'content' => 'You turn product photos into short marketplace search queries. '
                                .'Answer with 3 to 8 comma separated keywords in English (product type, colour, '
                                .'material, audience). No sentences, no explanations, no quotes.',
                        ],
                        [
                            'role' => 'user',
                            'content' => [
                                ['type' => 'text', 'text' => 'Describe this product photo as search keywords.'],
                                ['type' => 'image_url', 'image_url' => ['url' => $dataUri]],
                            ],
                        ],
                    ],
                    'max_tokens' => 120,
                ]);
        } catch (\Throwable $e) {
            report($e);

            return null;
        }

        if ($response->failed()) {
            return null;
        }

        $text = $response->json('choices.0.message.content');

        if (! is_string($text)) {
            return null;
        }

        $text = trim(preg_replace('/[\r\n]+/', ' ', $text) ?? '');

        return $text === '' ? null : Str::limit($text, 200, '');
    }

    /** Fallback: use the file name as the query. */
    private function queryFromFileName(string $name): ?string
    {
        $base = pathinfo($name, PATHINFO_FILENAME);
        $base = preg_replace('/[_\-.]+/', ' ', $base) ?? '';
        $base = trim(preg_replace('/\s+/', ' ', $base) ?? '');

        // UUID-ish or hex names carry no meaning for a shopper.
        if ($base === '' || preg_match('/^[0-9a-f]{8,}$/i', $base) === 1) {
            return null;
        }

        return Str::limit($base, 120, '');
    }
}
