<?php

namespace Tests\Feature\Jobs;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Jobs\Entities\Company;
use Tests\TestCase;

/**
 * N-32 company profiles: one per owner, fixed slug, public page, and
 * automatic attachment of new job posts.
 */
class CompanyProfileTest extends TestCase
{
    use RefreshDatabase;

    private function asUser(User $user): User
    {
        $this->app['auth']->forgetGuards();
        $this->actingAs($user, 'sanctum');

        return $user;
    }

    public function test_owner_creates_reads_updates_and_removes_company(): void
    {
        $owner = $this->createUser();
        $this->asUser($owner);

        // Nothing yet.
        $this->getJson('/api/company')->assertOk()->assertJson(['data' => null]);

        $created = $this->postJson('/api/company', [
            'name' => 'VoltWorks Ltd',
            'industry' => 'Renewable energy',
            'location' => 'Tema, Ghana',
            'website' => 'https://voltworks.example',
            'description' => 'We install solar.',
        ])->assertStatus(201);

        $this->assertSame('voltworks-ltd', $created->json('data.slug'));

        // One per owner.
        $this->postJson('/api/company', ['name' => 'Second Co'])->assertStatus(409);

        // Rename keeps the slug — links must survive.
        $this->putJson('/api/company', ['name' => 'VoltWorks Global'])->assertOk()
            ->assertJsonPath('data.name', 'VoltWorks Global')
            ->assertJsonPath('data.slug', 'voltworks-ltd');

        // Owner can remove; own read is null again.
        $this->deleteJson('/api/company')->assertOk();
        $this->getJson('/api/company')->assertOk()->assertJson(['data' => null]);
    }

    public function test_company_endpoints_require_auth(): void
    {
        $this->getJson('/api/company')->assertStatus(401);
        $this->postJson('/api/company', ['name' => 'Nope'])->assertStatus(401);
        $this->putJson('/api/company', ['name' => 'Nope'])->assertStatus(401);
        $this->deleteJson('/api/company')->assertStatus(401);

        // Removing nothing is a clean 404 for an authed user.
        $user = $this->createUser();
        $this->asUser($user);
        $this->deleteJson('/api/company')->assertStatus(404);
        $this->putJson('/api/company', ['name' => 'Still nothing'])->assertStatus(404);
    }

    public function test_public_profile_is_slug_unique_and_active_only(): void
    {
        // Two owners, same name → distinct slugs.
        $a = $this->createUser();
        $b = $this->createUser();

        $this->asUser($a);
        $this->postJson('/api/company', ['name' => 'Acme Labs'])->assertStatus(201);
        $this->asUser($b);
        $second = $this->postJson('/api/company', ['name' => 'Acme Labs'])->assertStatus(201);
        $this->assertSame('acme-labs-2', $second->json('data.slug'));

        // Public read with attached active jobs.
        $this->asUser($a);
        $this->postJson('/api/jobs', [
            'title' => 'Solar Installer',
            'description' => 'Mount panels.',
            'company' => 'Acme Labs',
            'location' => 'Accra, Ghana',
            'job_type' => 'contract',
        ])->assertStatus(201);

        $public = $this->getJson('/api/companies/acme-labs')->assertOk();
        $this->assertSame('Acme Labs', $public->json('data.name'));
        $this->assertCount(1, $public->json('data.jobs'));
        $this->assertSame('Solar Installer', $public->json('data.jobs.0.title'));

        // Unknown slug 404; removed profile 404.
        $this->getJson('/api/companies/does-not-exist')->assertStatus(404);
        $this->deleteJson('/api/company')->assertOk();
        $this->getJson('/api/companies/acme-labs')->assertStatus(404);
    }

    public function test_new_job_posts_attach_the_owners_company(): void
    {
        $owner = $this->createUser();
        $this->asUser($owner);
        $this->postJson('/api/company', ['name' => 'WireCo'])->assertStatus(201);

        $job = $this->postJson('/api/jobs', [
            'title' => 'Electrician',
            'description' => 'Wiring work.',
            'company' => 'WireCo',
            'location' => 'Accra, Ghana',
            'job_type' => 'full_time',
        ])->assertStatus(201)->json('data');

        $this->assertNotNull($job['company_id']);

        // Public show exposes the profile for a "View company" link.
        $show = $this->getJson('/api/jobs/' . $job['id'])->assertOk()->json('data');
        $this->assertSame('wireco', $show['company_profile']['slug'] ?? null);
        $this->assertSame('WireCo', $show['company']);

        // A poster without a company profile: no link, string intact.
        $other = $this->createUser();
        $this->asUser($other);
        $noProfile = $this->postJson('/api/jobs', [
            'title' => 'Helper',
            'description' => 'General help.',
            'company' => 'Solo Trader',
            'location' => 'Kumasi, Ghana',
            'job_type' => 'part_time',
        ])->assertStatus(201)->json('data');
        $this->assertNull($noProfile['company_id']);
    }

    public function test_web_routes_serve_public_page_and_gate_manage_page(): void
    {
        $owner = $this->createUser();
        $this->asUser($owner);
        $this->postJson('/api/company', ['name' => 'PageCo'])->assertStatus(201);

        $this->get('/companies/pageco')->assertOk();
        $this->get('/companies/missing-co')->assertOk(); // SPA renders not-found state

        // Authed user reaches the manage page; guests are bounced to login.
        $this->get('/jobs/company')->assertOk();
        $this->app['auth']->forgetGuards();
        $this->get('/jobs/company')->assertRedirect();
    }
}
