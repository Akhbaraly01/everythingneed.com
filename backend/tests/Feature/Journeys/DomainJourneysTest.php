<?php

namespace Tests\Feature\Journeys;

use Modules\Healthcare\Entities\Doctor;
use Modules\Healthcare\Entities\LabTest;
use Modules\Learn\Entities\Course;
use Modules\RealEstate\Entities\Property;
use Tests\TestCase;

class DomainJourneysTest extends TestCase
{
    private function createDoctor(array $attributes = []): Doctor
    {
        return Doctor::create(array_merge([
            'full_name' => fake()->name(),
            'specialization' => 'Cardiology',
            'qualification' => 'MBBS, MD',
            'experience_years' => 10,
            'consultation_fee' => 50.00,
            'virtual_fee' => 40.00,
            'is_available' => true,
        ], $attributes));
    }

    private function createCourse(array $attributes = []): Course
    {
        return Course::create(array_merge([
            'title' => fake()->words(4, true),
            'slug' => fake()->unique()->slug(),
            'description' => fake()->paragraph(),
            'category' => 'programming',
            'course_type' => 'theory',
            'instructor_name' => fake()->name(),
            'price' => 0,
            'duration_hours' => 10.5,
            'students_count' => 0,
            'is_featured' => false,
        ], $attributes));
    }

    public function test_random_assignment_never_double_books_a_slot_and_waitlists_when_full(): void
    {
        $this->createDoctor(['full_name' => 'Dr. A']);
        $this->createDoctor(['full_name' => 'Dr. B']);
        $patient = $this->createUser();
        $this->actingAs($patient, 'sanctum');

        $slot = [
            'appointment_date' => now()->addDay()->toDateString(),
            'appointment_time' => '10:00',
        ];

        // First random booking takes one of the two doctors
        $first = $this->postJson('/api/appointments', [
            'symptoms' => 'Migraine',
            'is_random_assignment' => true,
            ...$slot,
        ]);
        $first->assertStatus(201)->assertJsonPath('data.status', 'assigned');
        $firstDoctor = $first->json('data.doctor.id');
        $this->assertNotNull($firstDoctor);

        // Second booking on the SAME slot must land on the other doctor
        $second = $this->postJson('/api/appointments', [
            'symptoms' => 'Fever',
            'is_random_assignment' => true,
            ...$slot,
        ]);
        $second->assertStatus(201)->assertJsonPath('data.status', 'assigned');
        $secondDoctor = $second->json('data.doctor.id');
        $this->assertNotNull($secondDoctor);
        $this->assertNotSame($firstDoctor, $secondDoctor, 'Slot was double-booked');

        // Third booking: both doctors busy → waitlisted as pending, no clash error
        $third = $this->postJson('/api/appointments', [
            'symptoms' => 'Cough',
            'is_random_assignment' => true,
            ...$slot,
        ]);
        $third->assertStatus(201)->assertJsonPath('data.status', 'pending');
        $thirdDoctor = $third->json('data.doctor.id');
        $this->assertTrue($thirdDoctor === null || !in_array($thirdDoctor, [$firstDoctor, $secondDoctor]));

        // A different slot still assigns immediately
        $other = $this->postJson('/api/appointments', [
            'symptoms' => 'Back pain',
            'is_random_assignment' => true,
            'appointment_date' => now()->addDays(2)->toDateString(),
            'appointment_time' => '14:00',
        ]);
        $other->assertStatus(201)->assertJsonPath('data.status', 'assigned');
    }

    public function test_lab_console_lists_tests_and_books_through_the_real_domain(): void
    {
        $test = LabTest::create([
            'name' => 'Full Blood Count',
            'slug' => 'full-blood-count',
            'description' => 'Routine blood panel',
            'category' => 'blood',
            'price' => 25.00,
            'preparation_instructions' => 'Fast for 8 hours',
            'result_time_hours' => 24,
            'is_active' => true,
        ]);
        $patient = $this->createUser();
        $this->actingAs($patient, 'sanctum');

        $list = $this->getJson('/api/health/labs')->assertOk();
        $this->assertContains($test->id, array_column($list->json('data'), 'id'));

        $booked = $this->postJson('/api/health/labs/book', [
            'lab_test_id' => $test->id,
            'appointment_date' => now()->addDay()->toDateString(),
            'appointment_time' => '09:00',
            'notes' => 'Morning slot preferred',
        ]);
        $booked->assertStatus(201);

        $this->assertDatabaseHas('lab_bookings', [
            'patient_id' => $patient->id,
            'lab_test_id' => $test->id,
            'status' => 'pending',
        ]);
    }

    public function test_property_inquiry_alias_creates_a_viewing_request(): void
    {
        $owner = $this->createUser();
        $property = Property::create([
            'title' => 'Cozy loft',
            'description' => 'Nice',
            'price' => 1000,
            'address' => '1 Main',
            'city' => 'Accra',
            'country' => 'GH',
            'property_type' => 'apartment',
            'user_id' => $owner->id,
        ]);

        // The UI path is /inquiries (Properties Inquiry page)
        $guest = $this->postJson("/api/properties/{$property->id}/inquiries", [
            'name' => 'Anon', 'email' => 'anon@example.test', 'phone' => '+1000000001', 'message' => 'Hi',
        ]);
        $guest->assertStatus(401);

        $buyer = $this->actingAsUser();
        $this->postJson("/api/properties/{$property->id}/inquiries", [
            'name' => 'Vera',
            'email' => 'vera@example.test',
            'phone' => '+1000000000',
            'message' => 'Want to see this weekend',
            'viewing_date' => now()->addDays(3)->toDateString(),
        ])->assertStatus(201);

        $this->assertDatabaseHas('viewing_requests', [
            'property_id' => $property->id,
            'user_id' => $buyer->id,
            'status' => 'pending',
        ]);

        // Validation: message is required
        $this->postJson("/api/properties/{$property->id}/inquiries", [
            'name' => 'Vera', 'email' => 'vera@example.test', 'phone' => '+1000000000',
        ])->assertStatus(422);
    }

    public function test_course_enrollment_journey_from_catalog_to_my_learning(): void
    {
        $course = $this->createCourse(['title' => 'Journey Course']);

        // Guests cannot enroll
        $this->postJson("/api/courses/{$course->id}/enroll")->assertStatus(401);

        $student = $this->actingAsUser();

        // Browse the public catalog
        $catalog = $this->getJson('/api/courses')->assertOk();
        $this->assertContains($course->id, array_column($catalog->json('data'), 'id'));

        // Enroll
        $this->postJson("/api/courses/{$course->id}/enroll")
            ->assertStatus(201)
            ->assertJsonFragment(['message' => 'Enrolled successfully']);
        $this->assertDatabaseHas('enrollments', [
            'course_id' => $course->id,
            'user_id' => $student->id,
            'progress' => 0,
        ]);

        // My learning lists the enrollment for this course
        $mine = $this->getJson('/api/my-courses')->assertOk();
        $this->assertContains($course->id, array_column($mine->json('data'), 'course_id'));

        // Double enrollment rejected, no duplicate row
        $this->postJson("/api/courses/{$course->id}/enroll")->assertStatus(422);
        $this->assertSame(1, \Modules\Learn\Entities\Enrollment::where('course_id', $course->id)
            ->where('user_id', $student->id)->count());
    }
}
