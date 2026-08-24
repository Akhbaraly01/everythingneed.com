<?php

namespace Tests\Unit\ValueObjects;

use App\Domain\ValueObjects\UniqueId;
use PHPUnit\Framework\TestCase;
use InvalidArgumentException;

class UniqueIdTest extends TestCase
{
    public function test_generate_creates_valid_uuid(): void
    {
        $id = UniqueId::generate();

        $this->assertMatchesRegularExpression(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/',
            $id->value()
        );
    }

    public function test_generate_creates_unique_instances(): void
    {
        $id1 = UniqueId::generate();
        $id2 = UniqueId::generate();

        $this->assertNotSame($id1->value(), $id2->value());
    }

    public function test_from_creates_from_valid_uuid_string(): void
    {
        $uuid = '550e8400-e29b-41d4-a716-446655440000';

        $id = UniqueId::from($uuid);

        $this->assertSame($uuid, $id->value());
    }

    public function test_from_creates_from_another_valid_uuid(): void
    {
        $uuid = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

        $id = UniqueId::from($uuid);

        $this->assertSame($uuid, $id->value());
    }

    public function test_throws_on_invalid_uuid(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Invalid UUID');

        UniqueId::from('not-a-valid-uuid');
    }

    public function test_throws_on_empty_string(): void
    {
        $this->expectException(InvalidArgumentException::class);

        UniqueId::from('');
    }

    public function test_throws_on_partial_uuid(): void
    {
        $this->expectException(InvalidArgumentException::class);

        UniqueId::from('550e8400-e29b-41d4-a716');
    }

    public function test_equals_returns_true_for_same_uuid(): void
    {
        $uuid = '550e8400-e29b-41d4-a716-446655440000';
        $a = UniqueId::from($uuid);
        $b = UniqueId::from($uuid);

        $this->assertTrue($a->equals($b));
    }

    public function test_equals_returns_false_for_different_uuid(): void
    {
        $a = UniqueId::from('550e8400-e29b-41d4-a716-446655440000');
        $b = UniqueId::from('6ba7b810-9dad-11d1-80b4-00c04fd430c8');

        $this->assertFalse($a->equals($b));
    }

    public function test_to_string_returns_value(): void
    {
        $uuid = '550e8400-e29b-41d4-a716-446655440000';
        $id = UniqueId::from($uuid);

        $this->assertSame($uuid, (string) $id);
    }
}
