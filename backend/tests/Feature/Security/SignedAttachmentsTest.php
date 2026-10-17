<?php

namespace Tests\Feature\Security;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Modules\Orders\Entities\Dispute;
use Tests\TestCase;

/**
 * Backlog #2: signed-URL private attachments for dispute / KYC evidence.
 *
 * Dispute evidence uploads land on the private `local` disk and are only
 * reachable through short-lived signed URLs; KYC documents move from the
 * public upload landing zone to the private disk at submit time. Tampered
 * signatures 403, strangers 403/404, and every access is audited.
 */
class SignedAttachmentsTest extends TestCase
{
    use RefreshDatabase;

    private function createDispute(User $owner): Dispute
    {
        return Dispute::create([
            'user_id' => $owner->id,
            'subject' => 'Quality complaint',
            'description' => 'Work not as described.',
            'status' => 'open',
        ]);
    }

    public function test_dispute_evidence_upload_is_private_and_reachable_only_via_signed_url(): void
    {
        Storage::fake('local');
        $owner = $this->createUser();
        $stranger = $this->createUser();
        $dispute = $this->createDispute($owner);

        // File upload path: evidence lands on the private disk.
        $this->actingAs($owner, 'sanctum')
            ->post("/api/disputes/{$dispute->id}/evidence", [
                'file' => UploadedFile::fake()->image('receipt.jpg'),
                'note' => 'The broken item.',
            ])->assertStatus(201)
            ->assertJsonPath('data.disk', 'local');

        $evidenceId = DB::table('dispute_evidence')->where('dispute_id', $dispute->id)->value('id');
        $stored = DB::table('dispute_evidence')->where('id', $evidenceId)->first();
        $this->assertNotNull($stored->file_path);
        $this->assertStringStartsWith('disputes/'.$dispute->id.'/', $stored->file_path);
        Storage::disk('local')->assertExists($stored->file_path);

        // The listing carries a signed URL that streams the real bytes.
        $listing = $this->actingAs($owner, 'sanctum')
            ->getJson("/api/disputes/{$dispute->id}/evidence")->assertOk();
        $signedUrl = $listing->json('data.0.signed_url');
        $this->assertNotNull($signedUrl);
        $this->assertStringContainsString('/signed-storage/stream', $signedUrl);
        $this->get($signedUrl)->assertOk();

        // Strangers cannot list evidence or mint a URL for it.
        $this->actingAs($stranger, 'sanctum')
            ->getJson("/api/disputes/{$dispute->id}/evidence")->assertStatus(404);
    }

    public function test_tampered_or_expired_signed_url_is_rejected(): void
    {
        Storage::fake('local');
        $owner = $this->createUser();
        $dispute = $this->createDispute($owner);

        $this->actingAs($owner, 'sanctum')
            ->post("/api/disputes/{$dispute->id}/evidence", [
                'file' => UploadedFile::fake()->image('photo.png'),
            ])->assertStatus(201);

        $stored = DB::table('dispute_evidence')->where('dispute_id', $dispute->id)->first();
        $signedUrl = $this->actingAs($owner, 'sanctum')
            ->getJson("/api/disputes/{$dispute->id}/evidence")
            ->json('data.0.signed_url');

        // A tampered path no longer matches the HMAC.
        $tampered = str_replace(
            'path='.urlencode($stored->file_path),
            'path='.urlencode('disputes/'.$dispute->id.'/stolen.pdf'),
            $signedUrl
        );
        $this->get($tampered)->assertForbidden();

        // An expired signature is refused: mint a 15-minute URL, then
        // travel past its expiry before fetching it.
        $expiring = \Illuminate\Support\Facades\URL::temporarySignedRoute(
            'signed.storage.stream',
            now()->addMinutes(15),
            ['path' => $stored->file_path, 'disk' => 'local']
        );
        \Carbon\Carbon::setTestNow(now()->addMinutes(16));
        $this->get($expiring)->assertForbidden();
        \Carbon\Carbon::setTestNow();

        // A signed URL for the wrong disk is refused.
        $wrongDisk = \Illuminate\Support\Facades\URL::temporarySignedRoute(
            'signed.storage.stream',
            now()->addMinutes(15),
            ['path' => $stored->file_path, 'disk' => 'public']
        );
        $this->get($wrongDisk)->assertNotFound();
    }

    public function test_kyc_documents_move_to_private_disk_and_signed_urls_respect_scoping(): void
    {
        Storage::fake('public');
        Storage::fake('local');
        $user = $this->createUser();
        $stranger = $this->createUser();
        $admin = $this->createAdmin();

        $upload = $this->actingAs($user, 'sanctum')->post('/api/upload', [
            'file' => UploadedFile::fake()->image('id-front.jpg'),
            'folder' => 'kyc-documents',
        ])->assertStatus(201);
        $path = $upload->json('data.path');

        $this->actingAs($user, 'sanctum')->postJson('/api/kyc/submit', [
            'document_type' => 'passport',
            'document_number' => 'DOC-77',
            'document_front_path' => $path,
        ])->assertStatus(201);

        $id = DB::table('kyc_verifications')->where('user_id', $user->id)->value('id');
        $row = DB::table('kyc_verifications')->where('id', $id)->first();

        // The document now lives on the private disk, out of the public zone.
        $this->assertSame('local', $row->disk);
        $this->assertStringStartsWith('kyc/u/'.$user->id.'/', $row->document_front_path);
        Storage::disk('local')->assertExists($row->document_front_path);
        Storage::disk('public')->assertMissing($path);

        // Owner signed URL streams; strangers get nothing.
        $signedUrl = $this->actingAs($user, 'sanctum')
            ->getJson('/api/kyc/documents/front/signed-url')->assertOk()
            ->json('data.url');
        $this->assertStringContainsString('/signed-storage/stream', $signedUrl);
        $this->get($signedUrl)->assertOk();

        $this->actingAs($stranger, 'sanctum')
            ->getJson('/api/kyc/documents/front/signed-url')->assertNotFound();

        // Reviewers mint their own signed URL; plain users are 403.
        $adminUrl = $this->actingAs($admin, 'sanctum')
            ->getJson("/api/kyc/{$id}/documents/front/signed-url")->assertOk()
            ->json('data.url');
        $this->get($adminUrl)->assertOk();
        $this->actingAs($stranger, 'sanctum')
            ->getJson("/api/kyc/{$id}/documents/front/signed-url")->assertStatus(403);

        // Streamed documents still work through the role-gated endpoints.
        $this->actingAs($user, 'sanctum')->get('/api/kyc/documents/front')->assertOk();
        $this->actingAs($stranger, 'sanctum')->get('/api/kyc/documents/front')->assertNotFound();
        $this->actingAs($admin, 'sanctum')->get("/api/kyc/{$id}/documents/front")->assertOk();
    }

    public function test_legacy_public_evidence_rows_keep_their_stored_url(): void
    {
        Storage::fake('local');
        $owner = $this->createUser();
        $dispute = $this->createDispute($owner);

        // A legacy row (pre-backlog) only has file_url on the public side.
        DB::table('dispute_evidence')->insert([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'dispute_id' => $dispute->id,
            'uploaded_by' => $owner->id,
            'file_url' => 'https://example.com/legacy-receipt.jpg',
            'disk' => 'public',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $listing = $this->actingAs($owner, 'sanctum')
            ->getJson("/api/disputes/{$dispute->id}/evidence")->assertOk();

        $this->assertSame(
            'https://example.com/legacy-receipt.jpg',
            $listing->json('data.0.signed_url')
        );
        $this->assertSame(
            'https://example.com/legacy-receipt.jpg',
            $listing->json('data.0.download_url')
        );
    }

    public function test_evidence_uploads_reject_disallowed_types(): void
    {
        Storage::fake('local');
        $owner = $this->createUser();
        $dispute = $this->createDispute($owner);

        $this->actingAs($owner, 'sanctum')
            ->postJson("/api/disputes/{$dispute->id}/evidence", [
                'file_url' => 'not-a-url',
            ])->assertStatus(422);

        $this->actingAs($owner, 'sanctum')
            ->postJson("/api/disputes/{$dispute->id}/evidence", [])
            ->assertStatus(422);
    }
}