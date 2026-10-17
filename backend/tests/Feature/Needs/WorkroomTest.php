<?php

namespace Tests\Feature\Needs;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Modules\Needs\Entities\NeedFile;
use Modules\Needs\Entities\NeedOffer;
use Modules\Needs\Entities\NeedRequest;
use Tests\TestCase;

/**
 * N-24 workroom: shared files per engaged request. Parties only (owner,
 * accepted provider, moderators), private disk, on-demand signed URLs,
 * uploader/owner delete rules, and hard validation before any write.
 */
class WorkroomTest extends TestCase
{
    use RefreshDatabase;

    private function requestRow(object $owner): NeedRequest
    {
        return NeedRequest::create([
            'user_id' => $owner->id,
            'request_number' => 'NR-'.strtoupper(uniqid()),
            'title' => 'Build me a small app',
            'description' => 'Spec attached once we engage.',
            'status' => NeedRequest::STATUS_PUBLISHED,
            'budget_min' => 500,
            'budget_max' => 900,
        ]);
    }

    /** Engage a provider through the real offer + accept flow. */
    private function acceptProvider(NeedRequest $request, object $owner, object $provider): NeedOffer
    {
        $this->actingAs($provider, 'sanctum')
            ->postJson("/api/need-requests/{$request->id}/offers", ['price' => 700])
            ->assertStatus(201);
        $offer = NeedOffer::where('need_request_id', $request->id)
            ->where('provider_id', $provider->id)
            ->firstOrFail();

        $this->actingAs($owner, 'sanctum')
            ->postJson("/api/need-requests/{$request->id}/offers/{$offer->id}/accept")
            ->assertOk();

        return $offer->refresh();
    }

    public function test_guests_and_strangers_cannot_touch_the_room(): void
    {
        $owner = $this->createUser();
        $request = $this->requestRow($owner);

        $this->getJson("/api/need-requests/{$request->id}/files")->assertStatus(401);
        $this->postJson("/api/need-requests/{$request->id}/files")->assertStatus(401);

        $stranger = $this->createUser();
        $this->actingAs($stranger, 'sanctum')
            ->getJson("/api/need-requests/{$request->id}/files")
            ->assertStatus(403);
        $this->actingAs($stranger, 'sanctum')
            ->postJson("/api/need-requests/{$request->id}/files", [
                'file' => UploadedFile::fake()->create('sneak.pdf', 20, 'application/pdf'),
            ])
            ->assertStatus(403);

        $this->assertSame(0, NeedFile::count());
    }

    public function test_parties_upload_share_and_download_through_signed_urls(): void
    {
        $owner = $this->createUser();
        $provider = $this->createUser();
        $request = $this->requestRow($owner);
        $this->acceptProvider($request, $owner, $provider);

        // Owner uploads the brief.
        $res = $this->actingAs($owner, 'sanctum')
            ->post("/api/need-requests/{$request->id}/files", [
                'file' => UploadedFile::fake()->create('brief.pdf', 120, 'application/pdf'),
            ], ['Accept' => 'application/json']);
        $res->assertStatus(201)
            ->assertJsonPath('data.original_name', 'brief.pdf')
            ->assertJsonPath('data.uploaded_by.name', $owner->name);
        $fileId = $res->json('data.id');

        // Bytes on the PRIVATE disk only.
        $row = NeedFile::findOrFail($fileId);
        $this->assertSame('local', $row->disk);
        Storage::disk('local')->assertExists($row->path);
        Storage::disk('public')->assertMissing($row->path);

        // The accepted provider sees it in their list.
        $list = $this->actingAs($provider, 'sanctum')
            ->getJson("/api/need-requests/{$request->id}/files")
            ->assertOk()
            ->json('data');
        $this->assertCount(1, $list);
        $this->assertSame($fileId, $list[0]['id']);

        // Download URL is minted on demand and actually streams.
        $url = $this->actingAs($provider, 'sanctum')
            ->getJson("/api/need-requests/{$request->id}/files/{$fileId}/url")
            ->assertOk()
            ->assertJsonPath('data.expires_in', 900)
            ->json('data.url');
        $this->assertStringContainsString('signed-storage/stream', $url);
        $this->get($url)->assertOk();

        // A stranger can neither list nor mint a URL.
        $stranger = $this->createUser();
        $this->actingAs($stranger, 'sanctum')
            ->getJson("/api/need-requests/{$request->id}/files/{$fileId}/url")
            ->assertStatus(403);
    }

    public function test_pending_bidder_stays_out_even_after_someone_else_is_accepted(): void
    {
        $owner = $this->createUser();
        $accepted = $this->createUser();
        $bidder = $this->createUser();
        $request = $this->requestRow($owner);

        // A second provider has a live pending offer while the request
        // is still open…
        $this->actingAs($bidder, 'sanctum')
            ->postJson("/api/need-requests/{$request->id}/offers", ['price' => 650])
            ->assertStatus(201);

        // …and then someone else gets accepted.
        $this->acceptProvider($request, $owner, $accepted);

        // A pending bidder is NOT a party.
        $this->actingAs($bidder, 'sanctum')
            ->getJson("/api/need-requests/{$request->id}/files")
            ->assertStatus(403);

        // And the accepted provider still is.
        $this->actingAs($accepted, 'sanctum')
            ->getJson("/api/need-requests/{$request->id}/files")
            ->assertOk();
    }

    public function test_delete_rules_uploader_or_owner_and_bytes_leave_too(): void
    {
        $owner = $this->createUser();
        $provider = $this->createUser();
        $request = $this->requestRow($owner);
        $this->acceptProvider($request, $owner, $provider);

        // Provider uploads; owner (not uploader) may remove it.
        $res = $this->actingAs($provider, 'sanctum')
            ->post("/api/need-requests/{$request->id}/files", [
                'file' => UploadedFile::fake()->create('deliverable.zip', 50, 'application/zip'),
            ], ['Accept' => 'application/json']);
        $res->assertStatus(201);
        $fileId = $res->json('data.id');
        $row = NeedFile::findOrFail($fileId);

        $this->actingAs($owner, 'sanctum')
            ->deleteJson("/api/need-requests/{$request->id}/files/{$fileId}")
            ->assertOk();
        $this->assertSoftDeleted('need_files', ['id' => $fileId]);
        Storage::disk('local')->assertMissing($row->path);

        // URL for the removed file is gone.
        $this->actingAs($owner, 'sanctum')
            ->getJson("/api/need-requests/{$request->id}/files/{$fileId}/url")
            ->assertStatus(404);
    }

    public function test_accepted_provider_cannot_delete_owners_file(): void
    {
        $owner = $this->createUser();
        $provider = $this->createUser();
        $request = $this->requestRow($owner);
        $this->acceptProvider($request, $owner, $provider);

        $res = $this->actingAs($owner, 'sanctum')
            ->post("/api/need-requests/{$request->id}/files", [
                'file' => UploadedFile::fake()->create('contract.pdf', 30, 'application/pdf'),
            ], ['Accept' => 'application/json']);
        $fileId = $res->json('data.id');

        $this->actingAs($provider, 'sanctum')
            ->deleteJson("/api/need-requests/{$request->id}/files/{$fileId}")
            ->assertStatus(403);
    }

    public function test_upload_validation_refuses_missing_oversize_and_wrong_types(): void
    {
        $owner = $this->createUser();
        $request = $this->requestRow($owner);

        $this->actingAs($owner, 'sanctum')
            ->post("/api/need-requests/{$request->id}/files", [], ['Accept' => 'application/json'])
            ->assertStatus(422);

        $this->actingAs($owner, 'sanctum')
            ->post("/api/need-requests/{$request->id}/files", [
                'file' => UploadedFile::fake()->create('huge.pdf', 11 * 1024, 'application/pdf'),
            ], ['Accept' => 'application/json'])
            ->assertStatus(422);

        $this->actingAs($owner, 'sanctum')
            ->post("/api/need-requests/{$request->id}/files", [
                'file' => UploadedFile::fake()->create('shell.php', 5, 'application/x-httpd-php'),
            ], ['Accept' => 'application/json'])
            ->assertStatus(422);

        $this->assertSame(0, NeedFile::count());
    }
}
