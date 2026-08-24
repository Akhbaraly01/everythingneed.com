<?php

namespace Tests\Unit\Core;

use Core\DTOs\BaseDTO;
use PHPUnit\Framework\TestCase;

class SampleDTO extends BaseDTO
{
    public string $name = '';
    public int $age = 0;
    public string $email = '';
}

class NestedDTO extends BaseDTO
{
    public string $title = '';
    public ?SampleDTO $child = null;
}

class BaseDTOTest extends TestCase
{
    public function test_from_maps_array_to_properties(): void
    {
        $dto = SampleDTO::from([
            'name' => 'John',
            'age' => 30,
            'email' => 'john@example.com',
        ]);

        $this->assertSame('John', $dto->name);
        $this->assertSame(30, $dto->age);
        $this->assertSame('john@example.com', $dto->email);
    }

    public function test_from_with_partial_data(): void
    {
        $dto = SampleDTO::from([
            'name' => 'Jane',
        ]);

        $this->assertSame('Jane', $dto->name);
        $this->assertSame(0, $dto->age);
        $this->assertSame('', $dto->email);
    }

    public function test_from_with_empty_array(): void
    {
        $dto = SampleDTO::from([]);

        $this->assertSame('', $dto->name);
        $this->assertSame(0, $dto->age);
        $this->assertSame('', $dto->email);
    }

    public function test_to_array_returns_correct_structure(): void
    {
        $dto = SampleDTO::from([
            'name' => 'John',
            'age' => 30,
            'email' => 'john@example.com',
        ]);

        $array = $dto->toArray();

        $this->assertIsArray($array);
        $this->assertSame('John', $array['name']);
        $this->assertSame(30, $array['age']);
        $this->assertSame('john@example.com', $array['email']);
    }

    public function test_to_array_with_default_values(): void
    {
        $dto = new SampleDTO([]);

        $array = $dto->toArray();

        $this->assertSame('', $array['name']);
        $this->assertSame(0, $array['age']);
        $this->assertSame('', $array['email']);
    }

    public function test_unmapped_properties_are_ignored(): void
    {
        $dto = SampleDTO::from([
            'name' => 'John',
            'age' => 30,
            'email' => 'john@example.com',
            'unknown_field' => 'should be ignored',
            'another_one' => 42,
        ]);

        $array = $dto->toArray();

        $this->assertArrayNotHasKey('unknown_field', $array);
        $this->assertArrayNotHasKey('another_one', $array);
        $this->assertSame(3, count($array));
    }

    public function test_json_serialize_returns_array(): void
    {
        $dto = SampleDTO::from([
            'name' => 'John',
            'age' => 30,
            'email' => 'john@example.com',
        ]);

        $json = json_encode($dto);
        $decoded = json_decode($json, true);

        $this->assertIsArray($decoded);
        $this->assertSame('John', $decoded['name']);
        $this->assertSame(30, $decoded['age']);
    }

    public function test_nested_dto_to_array_recursively_converts(): void
    {
        $child = SampleDTO::from([
            'name' => 'Child',
            'age' => 5,
            'email' => 'child@example.com',
        ]);

        $parent = NestedDTO::from([
            'title' => 'Parent',
            'child' => $child,
        ]);

        $array = $parent->toArray();

        $this->assertSame('Parent', $array['title']);
        $this->assertIsArray($array['child']);
        $this->assertSame('Child', $array['child']['name']);
    }

    public function test_construct_with_direct_instantiation(): void
    {
        $dto = new SampleDTO([
            'name' => 'Direct',
            'age' => 25,
        ]);

        $this->assertSame('Direct', $dto->name);
        $this->assertSame(25, $dto->age);
    }

    public function test_properties_are_public(): void
    {
        $dto = SampleDTO::from([
            'name' => 'Test',
            'age' => 1,
            'email' => 'test@test.com',
        ]);

        $this->assertSame('Test', $dto->name);
        $dto->name = 'Modified';
        $this->assertSame('Modified', $dto->name);
    }
}
