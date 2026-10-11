<?php

namespace Tests\Feature\Forms;

use Tests\TestCase;
use Database\Seeders\PermissionSeeder;
use Modules\Admin\Entities\CmsForm;
use Modules\Admin\Entities\CmsFormSubmission;

class DynamicFormTest extends TestCase
{
    private function makeForm(array $overrides = []): CmsForm
    {
        return CmsForm::create(array_merge([
            'name' => 'Contact us',
            'slug' => 'contact-us',
            'status' => 'published',
            'fields' => [
                ['key' => 'full_name', 'label' => 'Full name', 'type' => 'text', 'required' => true, 'visibility' => 'public', 'ordering' => 0],
                ['key' => 'email', 'label' => 'Email', 'type' => 'email', 'required' => true, 'visibility' => 'public', 'ordering' => 1],
                ['key' => 'topic', 'label' => 'Topic', 'type' => 'select', 'required' => true, 'options' => ['sales', 'support'], 'visibility' => 'public', 'ordering' => 2],
                ['key' => 'notes', 'label' => 'Notes', 'type' => 'textarea', 'required' => false, 'visibility' => 'public', 'ordering' => 3],
                ['key' => 'internal_flag', 'label' => 'Internal', 'type' => 'text', 'required' => false, 'visibility' => 'hidden', 'ordering' => 4],
            ],
        ], $overrides));
    }

    private function validPayload(): array
    {
        return [
            'full_name' => 'Ada Lovelace',
            'email' => 'ada@example.com',
            'topic' => 'sales',
            'notes' => 'Please call me back.',
        ];
    }

    public function test_admin_can_create_a_form(): void
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/admin/forms', [
            'name' => 'Job application',
            'slug' => 'job-application',
            'status' => 'published',
            'fields' => [
                ['key' => 'cv_url', 'label' => 'CV link', 'type' => 'file', 'required' => true],
                ['key' => 'years', 'label' => 'Years of experience', 'type' => 'number', 'required' => false, 'max' => 40],
            ],
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.name', 'Job application')
            ->assertJsonPath('data.status', 'published')
            ->assertJsonCount(2, 'data.fields');

        $this->assertSame(40, $response->json('data.fields.1.max'));
    }

    public function test_plain_user_cannot_manage_forms(): void
    {
        $this->seed(PermissionSeeder::class);
        $user = $this->createUser();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/admin/forms', ['name' => 'X', 'slug' => 'x', 'fields' => [['key' => 'a', 'label' => 'A', 'type' => 'text']]])
            ->assertForbidden();

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/admin/forms')
            ->assertForbidden();
    }

    public function test_content_manager_can_list_forms(): void
    {
        $this->seed(PermissionSeeder::class);
        $this->makeForm();
        $manager = $this->createUser();
        $this->assignRole($manager, 'content_manager');

        $this->actingAs($manager, 'sanctum')
            ->getJson('/api/admin/forms')
            ->assertOk()
            ->assertJsonPath('data.0.slug', 'contact-us')
            ->assertJsonPath('data.0.fields_count', 5);
    }

    public function test_status_only_update_keeps_definition(): void
    {
        $form = $this->makeForm(['status' => 'draft']);
        $admin = $this->createAdmin();

        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/admin/forms/{$form->id}", ['status' => 'published'])
            ->assertOk()
            ->assertJsonPath('data.status', 'published')
            ->assertJsonPath('data.name', 'Contact us')
            ->assertJsonCount(5, 'data.fields');
    }

    public function test_duplicate_slug_is_rejected(): void
    {
        $this->makeForm();
        $admin = $this->createAdmin();

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/admin/forms', [
                'name' => 'Other',
                'slug' => 'contact-us',
                'fields' => [['key' => 'a', 'label' => 'A', 'type' => 'text']],
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['slug']);
    }

    public function test_published_form_is_readable_publicly_without_hidden_fields(): void
    {
        $this->makeForm();

        $response = $this->getJson('/api/forms/contact-us')->assertOk();

        $this->assertSame('Contact us', $response->json('data.name'));
        $keys = array_column($response->json('data.fields'), 'key');
        $this->assertContains('full_name', $keys);
        $this->assertNotContains('internal_flag', $keys);
    }

    public function test_draft_or_missing_forms_are_not_public(): void
    {
        $this->makeForm(['status' => 'draft', 'slug' => 'draft-form']);

        $this->getJson('/api/forms/draft-form')->assertNotFound();
        $this->getJson('/api/forms/never-existed')->assertNotFound();
    }

    public function test_valid_submission_is_stored_with_unknown_and_hidden_keys_stripped(): void
    {
        $this->makeForm();

        $response = $this->postJson('/api/forms/contact-us/submit', array_merge($this->validPayload(), [
            'internal_flag' => 'tampered',
            'evil_key' => 'nope',
        ]));

        $response->assertCreated();
        $id = $response->json('data.id');

        $submission = CmsFormSubmission::find($id);
        $this->assertNotNull($submission);
        $this->assertNull($submission->user_id);
        $this->assertSame('Ada Lovelace', $submission->data['full_name']);
        $this->assertSame('sales', $submission->data['topic']);
        $this->assertArrayNotHasKey('internal_flag', $submission->data);
        $this->assertArrayNotHasKey('evil_key', $submission->data);
    }

    public function test_authenticated_submission_records_the_user(): void
    {
        $this->makeForm();
        $user = $this->createUser();

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/forms/contact-us/submit', $this->validPayload());

        $response->assertCreated();
        $this->assertSame($user->id, CmsFormSubmission::find($response->json('data.id'))->user_id);
    }

    public function test_schema_validation_rejects_missing_bad_and_unknown_choice_values(): void
    {
        $this->makeForm();

        $missing = $this->postJson('/api/forms/contact-us/submit', ['topic' => 'sales']);
        $missing->assertStatus(422);
        $this->assertArrayHasKey('full_name', $missing->json('errors'));
        $this->assertArrayHasKey('email', $missing->json('errors'));

        $badEmail = $this->postJson('/api/forms/contact-us/submit', array_merge($this->validPayload(), ['email' => 'not-an-email']));
        $badEmail->assertStatus(422);
        $this->assertArrayHasKey('email', $badEmail->json('errors'));

        $badChoice = $this->postJson('/api/forms/contact-us/submit', array_merge($this->validPayload(), ['topic' => 'hacked']));
        $badChoice->assertStatus(422);
        $this->assertArrayHasKey('topic', $badChoice->json('errors'));
    }

    public function test_optional_empty_values_are_accepted(): void
    {
        $this->makeForm();

        $payload = $this->validPayload();
        unset($payload['notes']);

        $this->postJson('/api/forms/contact-us/submit', $payload)->assertCreated();
    }

    public function test_admin_can_list_submissions(): void
    {
        $form = $this->makeForm();
        $this->postJson('/api/forms/contact-us/submit', $this->validPayload())->assertCreated();
        $admin = $this->createAdmin();

        $this->actingAs($admin, 'sanctum')
            ->getJson("/api/admin/forms/{$form->id}/submissions")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.data.full_name', 'Ada Lovelace')
            ->assertJsonPath('data.0.status', 'new');
    }

    public function test_admin_can_delete_a_form(): void
    {
        $form = $this->makeForm();
        $admin = $this->createAdmin();

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/admin/forms/{$form->id}")
            ->assertOk();

        $this->assertSoftDeleted('cms_forms', ['id' => $form->id]);
        $this->getJson('/api/forms/contact-us')->assertNotFound();
    }

    public function test_admin_forms_page_renders_for_content_roles_only(): void
    {
        $admin = $this->createAdmin();
        $this->actingAs($admin, 'web')
            ->get('/admin/forms')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('admin/Forms'));

        $manager = $this->createUser();
        $this->assignRole($manager, 'content_manager');
        $this->actingAs($manager, 'web')
            ->get('/admin/forms')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('admin/Forms'));

        $plain = $this->createUser();
        $this->actingAs($plain, 'web')
            ->get('/admin/forms')
            ->assertRedirect();
    }

    public function test_public_form_page_renders_with_visible_fields(): void
    {
        $this->makeForm();

        $this->get('/forms/contact-us')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('forms/Show')
                ->where('form.slug', 'contact-us')
                ->count('form.fields', 4)
                ->where('form.fields.0.key', 'full_name'));

        $this->get('/forms/unknown-form')->assertRedirect();
    }
}
