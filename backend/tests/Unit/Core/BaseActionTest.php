<?php

namespace Tests\Unit\Core;

use Core\Actions\BaseAction;
use Illuminate\Validation\ValidationException;

class ConcreteAction extends BaseAction
{
    public function execute(array $data): array
    {
        $validated = $this->validate($data, [
            'name' => 'required|string',
            'age' => 'required|integer|min:0',
        ]);

        return ['status' => 'ok', 'data' => $validated];
    }
}

class StrictValidationAction extends BaseAction
{
    public function execute(array $data): array
    {
        $validated = $this->validate($data, [
            'email' => 'required|email',
            'amount' => 'required|numeric|min:0',
        ]);

        return ['status' => 'ok', 'data' => $validated];
    }
}

class MinimalAction extends BaseAction
{
    public function execute(array $data): mixed
    {
        return $data;
    }
}

class BaseActionTest extends \Tests\TestCase
{
    public function test_execute_calls_correctly(): void
    {
        $action = new ConcreteAction();

        $result = $action->execute([
            'name' => 'John',
            'age' => 30,
        ]);

        $this->assertIsArray($result);
        $this->assertSame('ok', $result['status']);
        $this->assertSame('John', $result['data']['name']);
        $this->assertSame(30, $result['data']['age']);
    }

    public function test_validate_passes_valid_data(): void
    {
        $action = new ConcreteAction();

        $result = $action->execute([
            'name' => 'Jane',
            'age' => 25,
        ]);

        $this->assertSame('ok', $result['status']);
        $this->assertSame('Jane', $result['data']['name']);
    }

    public function test_validate_throws_on_missing_required_field(): void
    {
        $this->expectException(ValidationException::class);

        $action = new ConcreteAction();
        $action->execute([
            'name' => 'John',
        ]);
    }

    public function test_validate_throws_on_invalid_type(): void
    {
        $this->expectException(ValidationException::class);

        $action = new ConcreteAction();
        $action->execute([
            'name' => 'John',
            'age' => 'not-a-number',
        ]);
    }

    public function test_validate_throws_on_negative_integer(): void
    {
        $this->expectException(ValidationException::class);

        $action = new ConcreteAction();
        $action->execute([
            'name' => 'John',
            'age' => -5,
        ]);
    }

    public function test_validate_with_email_rule_passes(): void
    {
        $action = new StrictValidationAction();

        $result = $action->execute([
            'email' => 'user@example.com',
            'amount' => 100,
        ]);

        $this->assertSame('ok', $result['status']);
    }

    public function test_validate_with_email_rule_throws_on_invalid_email(): void
    {
        $this->expectException(ValidationException::class);

        $action = new StrictValidationAction();
        $action->execute([
            'email' => 'not-an-email',
            'amount' => 100,
        ]);
    }

    public function test_validate_with_email_rule_throws_on_missing_email(): void
    {
        $this->expectException(ValidationException::class);

        $action = new StrictValidationAction();
        $action->execute([
            'amount' => 100,
        ]);
    }

    public function test_validate_with_email_rule_throws_on_missing_amount(): void
    {
        $this->expectException(ValidationException::class);

        $action = new StrictValidationAction();
        $action->execute([
            'email' => 'user@example.com',
        ]);
    }

    public function test_minimal_action_passes_data_through(): void
    {
        $action = new MinimalAction();

        $data = ['key' => 'value', 'number' => 42];
        $result = $action->execute($data);

        $this->assertSame($data, $result);
    }

    public function test_execute_with_empty_data(): void
    {
        $action = new MinimalAction();

        $result = $action->execute([]);

        $this->assertSame([], $result);
    }
}
