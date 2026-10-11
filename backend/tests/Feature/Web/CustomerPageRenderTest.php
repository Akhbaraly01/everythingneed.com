<?php

namespace Tests\Feature\Web;

use Modules\Healthcare\Entities\Doctor;
use Modules\Learn\Entities\Course;
use Modules\Learn\Entities\CourseLesson;
use Modules\RealEstate\Entities\Property;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Customer-facing Inertia page sweep — the non-admin counterparts of
 * AdminConsoleRenderTest. Auth pages: verified customer renders 200 with the
 * expected component, guest redirects to login. Public pages: always 200.
 */
class CustomerPageRenderTest extends TestCase
{
    /** @return array<string, array{0: string, 1: string}> */
    public static function authPages(): array
    {
        return [
            'orders'            => ['/orders', 'orders/Index'],
            'orders returns'    => ['/orders/returns', 'orders/Returns'],
            'orders disputes'   => ['/orders/disputes', 'orders/Disputes'],
            'wallet'            => ['/wallet', 'wallet/Index'],
            'account'           => ['/account', 'account/Index'],
            'account orders'    => ['/account/orders', 'orders/Index'],
            'account learning'  => ['/account/learning', 'learn/MyLearning'],
            'account bookings'  => ['/account/bookings', 'account/Bookings'],
            'learn my-learning' => ['/learn/my-learning', 'learn/MyLearning'],
            'learn certificates'=> ['/learn/certificates', 'learn/Certificates'],
            'healthcare appts'  => ['/healthcare/appointments', 'healthcare/Appointments'],
            'healthcare rx'     => ['/healthcare/prescriptions', 'healthcare/Prescriptions'],
            'healthcare records'=> ['/healthcare/records', 'healthcare/Records'],
            'healthcare bookings'=> ['/healthcare/bookings', 'healthcare/Bookings'],
            'healthcare home-visit'=> ['/healthcare/bookings/home-visit', 'healthcare/HomeVisit'],
            'healthcare others'=> ['/healthcare/bookings/others', 'healthcare/ServiceRequests'],
        ];
    }

    /** @return array<string, array{0: string, 1: string}> */
    public static function publicPages(): array
    {
        return [
            'healthcare home' => ['/healthcare', 'healthcare/Index'],
            'healthcare labs' => ['/healthcare/labs', 'healthcare/Labs'],
            'healthcare documents' => ['/healthcare/documents', 'healthcare/Documentation'],
            'learn catalog'   => ['/learn/courses', 'learn/Catalog'],
            'properties list' => ['/properties', 'properties/Index'],
        ];
    }

    #[DataProvider('authPages')]
    public function test_authed_verified_customer_renders_the_page(string $url, string $component): void
    {
        $user = $this->createUser(); // factory: verified, role user
        $this->actingAs($user);

        $this->get($url)
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component($component));
    }

    #[DataProvider('authPages')]
    public function test_guests_are_redirected_to_login(string $url, string $component): void
    {
        $this->get($url)->assertRedirect(route('login'));
    }

    /**
     * Regression (H-B): eager loads only resolve when the result set is
     * non-empty, so the data-set sweep above passed while the page threw
     * RelationNotFoundException for every patient who actually has rows
     * (the seeded customer) — surfacing as a browser redirect loop.
     */
    public function test_prescriptions_page_renders_when_the_patient_has_rows(): void
    {
        $user = $this->createUser();
        \Modules\Pharmacy\Entities\Prescription::create([
            'code'         => 'RX-RENDER-REGRESSION',
            'patient_id'   => $user->id,
            'items'        => [['name' => 'Amoxicillin', 'dosage' => '500mg']],
            'status'       => 'active',
            'expires_at'   => now()->addDays(7),
        ]);
        $this->actingAs($user);

        $this->get('/healthcare/prescriptions')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('healthcare/Prescriptions')
                ->where('prescriptions.0.code', 'RX-RENDER-REGRESSION'));
    }

    public function test_records_page_renders_when_the_patient_has_rows(): void
    {
        $user = $this->createUser();
        \Modules\Pharmacy\Entities\Prescription::create([
            'code'         => 'RX-RECORDS-REGRESSION',
            'patient_id'   => $user->id,
            'items'        => [['name' => 'Metformin', 'dosage' => '500mg']],
            'status'       => 'active',
            'expires_at'   => now()->addDays(7),
        ]);
        $this->actingAs($user);

        $this->get('/healthcare/records')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('healthcare/Records'));
    }

    #[DataProvider('publicPages')]
    public function test_public_pages_render_without_auth(string $url, string $component): void
    {
        $this->get($url)
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component($component));
    }

    public function test_detail_pages_render_with_fixtures(): void
    {
        $user = $this->createUser();

        // Learn: course detail + lesson page
        $course = Course::create([
            'title' => 'Render Sweep Course',
            'slug' => 'render-sweep-course',
            'description' => 'Fixture',
            'category' => 'programming',
            'course_type' => 'theory',
            'instructor_name' => 'Jane Doe',
            'price' => 0,
            'duration_hours' => 5,
            'students_count' => 0,
            'is_featured' => false,
        ]);
        $lesson = CourseLesson::create([
            'course_id' => $course->id,
            'title' => 'Lesson One',
            'lesson_order' => 1,
        ]);

        // Property: show + inquiry form pages
        $property = Property::create([
            'title' => 'Render Loft',
            'description' => 'Nice',
            'price' => 1200,
            'address' => '2 Main',
            'city' => 'Accra',
            'country' => 'GH',
            'property_type' => 'apartment',
            'user_id' => $user->id,
        ]);

        // Healthcare: lab booking form (auth) keyed on a lab doctor
        $lab = Doctor::create([
            'full_name' => 'Dr. Render Lab',
            'specialization' => 'Clinical Lab',
            'qualification' => 'MBBS',
            'experience_years' => 5,
            'consultation_fee' => 30.00,
            'virtual_fee' => 25.00,
            'is_available' => true,
        ]);

        // Public detail pages (no auth)
        $this->get("/learn/{$course->id}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('learn/Show'));
        $this->get("/properties/{$property->id}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('properties/Show'));
        $this->get("/properties/{$property->id}/inquiry")
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('properties/Inquiry'));

        // Auth pages
        $this->actingAs($user);
        $this->get("/learn/courses/{$course->id}/lessons/{$lesson->id}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('learn/Lesson'));
        $this->get("/healthcare/labs/{$lab->id}/book")
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('healthcare/LabBooking'));

        // Order detail for its owner
        $order = \Modules\Orders\Entities\Order::create([
            'user_id' => $user->id,
            'order_number' => 'EN-RENDER01',
            'status' => 'pending',
            'subtotal' => 10.00,
            'total_amount' => 10.00,
            'currency' => 'USD',
            'shipping_address' => '1 Test St',
        ]);
        $this->get("/orders/{$order->id}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('orders/Show'));
    }
}
