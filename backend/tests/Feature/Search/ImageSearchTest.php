<?php

namespace Tests\Feature\Search;

use Illuminate\Http\UploadedFile;
use Tests\TestCase;

/**
 * Search by photo.
 *
 * Without an AI gateway the picture name drives the query (the shopper
 * saved the file with a meaningful name); with a gateway the photo is
 * described by the vision model. Either way the request must never
 * store the image and must refuse a non-image upload.
 */
class ImageSearchTest extends TestCase
{
    private function png(string $name): UploadedFile
    {
        // 1x1 transparent PNG.
        $bytes = base64_decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
        );

        $file = tempnam(sys_get_temp_dir(), 'img');
        file_put_contents($file, $bytes);

        return new UploadedFile($file, $name, 'image/png', null, true);
    }

    public function test_picture_name_drives_the_query(): void
    {
        config(['services.ai.gateway_url' => null, 'services.ai.api_key' => null]);

        $response = $this->post('/api/search/image', [
            'image' => $this->png('epilator-for-woman.png'),
        ]);

        $response->assertOk();
        $this->assertSame('epilator for woman', $response->json('query'));
        $this->assertIsArray($response->json('data'));
    }

    public function test_meaningless_file_names_are_refused(): void
    {
        config(['services.ai.gateway_url' => null, 'services.ai.api_key' => null]);

        $this->post('/api/search/image', [
            'image' => $this->png('a1b2c3d4e5f6a7b8c9d0.png'),
        ])->assertStatus(422);
    }

    public function test_non_image_uploads_are_refused(): void
    {
        $file = UploadedFile::fake()->create('notes.pdf', 10, 'application/pdf');

        $this->post('/api/search/image', ['image' => $file])->assertStatus(422);
    }

    public function test_the_image_is_required(): void
    {
        $this->postJson('/api/search/image', [])->assertStatus(422);
    }
}
