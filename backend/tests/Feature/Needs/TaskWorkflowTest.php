<?php

namespace Tests\Feature\Needs;

use Tests\TestCase;
use Modules\Needs\Entities\TaskPost;

class TaskWorkflowTest extends TestCase
{
    public function test_full_task_lifecycle(): void
    {
        $owner = $this->actingAsUser();

        // 1. Owner publishes a task
        $created = $this->postJson('/api/tasks', [
            'title' => 'Distribute 500 flyers downtown',
            'description' => 'Hand out flyers near the market square this weekend.',
            'quantity' => 500,
            'budget' => 75,
        ]);

        $created->assertStatus(201)
            ->assertJsonStructure(['message', 'data' => ['id', 'post_number']]);

        $taskId = $created->json('data.id');
        $this->assertEquals('open', $created->json('data.status'));

        // 2. Worker applies
        $worker = $this->actingAsUser();

        $board = $this->getJson('/api/tasks');
        $board->assertOk()->assertJsonFragment(['id' => $taskId]);

        $apply = $this->postJson("/api/tasks/{$taskId}/apply", [
            'message' => 'Available all weekend, done this before.',
        ]);
        $apply->assertStatus(201);
        $applicationId = $apply->json('data.id');

        // Duplicate application blocked
        $this->postJson("/api/tasks/{$taskId}/apply", ['message' => 'again'])
            ->assertStatus(409);

        // 3. Owner approves the worker
        $this->actingAs($owner, 'sanctum');

        $applications = $this->getJson("/api/tasks/{$taskId}/applications");
        $applications->assertOk()->assertJsonCount(1);

        $this->postJson("/api/task-applications/{$applicationId}/approve")
            ->assertOk();
        $this->assertEquals('assigned', TaskPost::find($taskId)->status);

        // 4. Worker submits evidence
        $this->actingAs($worker, 'sanctum');

        $submit = $this->postJson("/api/task-applications/{$applicationId}/submit", [
            'evidence_note' => 'All 500 flyers handed out, photos attached.',
            'evidence_url' => 'https://example.com/evidence.jpg',
        ]);
        $submit->assertOk();
        $this->assertEquals('in_review', TaskPost::find($taskId)->status);

        // 5. Owner verifies then pays
        $this->actingAs($owner, 'sanctum');
        $this->postJson("/api/task-applications/{$applicationId}/verify")->assertOk();

        $paid = $this->postJson("/api/task-applications/{$applicationId}/mark-paid");
        $paid->assertOk();
        $this->assertEquals('paid', $paid->json('data.status'));
        $this->assertEquals('completed', TaskPost::find($taskId)->status);

        // Payout recorded as a payment row
        $this->assertDatabaseHas('payments', [
            'order_id' => $taskId,
            'user_id' => $worker->id,
        ]);
    }

    public function test_worker_cannot_verify_own_submission(): void
    {
        $owner = $this->createUser();
        $task = TaskPost::create([
            'created_by' => $owner->id,
            'post_number' => 'TK-'.uniqid(),
            'title' => 'Water plants for a week',
            'description' => 'Daily watering',
            'budget' => 30,
            'status' => 'assigned',
        ]);

        $worker = $this->actingAsUser();
        $application = \Modules\Needs\Entities\TaskApplication::create([
            'task_post_id' => $task->id,
            'user_id' => $worker->id,
            'status' => 'submitted',
            'evidence_note' => 'done',
        ]);

        $this->postJson("/api/task-applications/{$application->id}/verify")
            ->assertStatus(403);
    }

    public function test_owner_cannot_apply_to_own_task(): void
    {
        $owner = $this->actingAsUser();

        $taskId = $this->postJson('/api/tasks', [
            'title' => 'Walk my dog daily',
            'description' => 'Two walks a day for a week',
            'budget' => 50,
        ])->json('data.id');

        $this->postJson("/api/tasks/{$taskId}/apply", ['message' => 'me'])
            ->assertStatus(422);
    }
}
