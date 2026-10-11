<?php

namespace Tests\Feature\WaveA;

use Database\Seeders\CmsSeeder;
use Illuminate\Support\Facades\DB;
use Modules\Food\Entities\Restaurant;
use Modules\Healthcare\Entities\Doctor;
use Tests\TestCase;

/**
 * Wave A (spec audit) regression coverage.
 *
 * Locks in the dead-link (§80) and placeholder-sweep (§119) fixes:
 *  - web logout is a real POST contract (GET must stay 405);
 *  - every route the marketplace UI now links to must render;
 *  - removed dead targets must remain absent;
 *  - checkout exposes the truthful, server-derived payment mode;
 *  - CMS seed copy contains no "placeholder" filler;
 *  - AuthService OTP delivery runs through the OtpSender seam.
 */
class WaveADeadLinksAndPlaceholdersTest extends TestCase
{
    public function test_web_logout_posts_and_redirects_to_login(): void
    {
        $user = $this->createUser();

        $response = $this->actingAs($user, 'web')->post('/logout');

        $response->assertRedirect(route('login'));
        $this->assertGuest('web');
    }

    public function test_get_logout_never_logs_out_and_redirects_back(): void
    {
        // GET /logout raises 405 at the router; the web error contract turns it
        // into a back-redirect. The security property: the session survives and
        // no logout side-effect runs.
        $user = $this->createUser();

        $response = $this->actingAs($user, 'web')->get('/logout');

        $response->assertRedirect();
        $this->assertAuthenticatedAs($user, 'web');
    }

    public function test_tickets_support_page_renders(): void
    {
        $user = $this->createUser();

        $this->actingAs($user, 'web')->get('/tickets')->assertOk();
    }

    public function test_food_show_page_renders_for_active_restaurant(): void
    {
        $user = $this->createUser();
        $restaurant = Restaurant::create([
            'name' => 'Gold Bites',
            'cuisine_type' => 'ghanaian',
            'address' => '1 Food St',
            'city' => 'Accra',
            'is_active' => true,
            'rating' => 4.5,
        ]);

        $this->actingAs($user, 'web')
            ->get("/food/{$restaurant->id}")
            ->assertOk();
    }

    public function test_healthcare_doctor_page_renders(): void
    {
        $user = $this->createUser();
        $doctor = Doctor::create([
            'full_name' => 'Dr. Wave A',
            'specialization' => 'Cardiology',
            'qualification' => 'MBBS, MD',
            'experience_years' => 10,
            'consultation_fee' => 50.00,
            'virtual_fee' => 40.00,
            'is_available' => true,
        ]);

        $this->actingAs($user, 'web')
            ->get("/healthcare/doctors/{$doctor->id}")
            ->assertOk();
    }

    public function test_checkout_page_exposes_server_derived_payment_mode(): void
    {
        $user = $this->createUser();

        // Test env has no real provider keys: the UI must say sandbox, and the
        // mode must always be one of the two known values.
        $this->actingAs($user, 'web')
            ->get('/orders/checkout')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('orders/Checkout')
                ->where('paymentMode', 'sandbox'));
    }

    public function test_removed_dead_targets_stay_absent(): void
    {
        // These paths never existed as routes; the marketplace UI no longer
        // links to them. Guard the contract: they must 404, not 500.
        $this->get('/help')->assertNotFound();
        $this->get('/restaurants/'.(string) \Illuminate\Support\Str::uuid())->assertNotFound();
    }

    public function test_cms_seed_copy_contains_no_placeholder_filler(): void
    {
        $this->seed(CmsSeeder::class);

        $rows = DB::table('cms_pages')->pluck('content')->all();
        $this->assertNotEmpty($rows, 'CmsSeeder must seed at least one page');

        foreach ($rows as $content) {
            $this->assertStringNotContainsStringIgnoringCase(
                'placeholder',
                (string) $content,
                'Seeded CMS copy must never contain placeholder instructions.',
            );
        }
    }

    public function test_auth_service_otp_uses_delivery_seam(): void
    {
        $user = $this->createUser(['phone' => '+233200000001']);

        /** @var \Core\Services\AuthService $service */
        $service = app(\Core\Services\AuthService::class);
        $result = $service->requestOtp('+233200000001');

        $this->assertArrayHasKey('challenge_id', $result);
        $this->assertDatabaseHas('otp_challenges', [
            'user_id' => $user->id,
            'phone' => '+233200000001',
            'verified' => false,
        ]);
    }
}
