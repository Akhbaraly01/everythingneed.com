<?php

namespace Tests\Unit\ValueObjects;

use App\Domain\ValueObjects\Email;
use PHPUnit\Framework\TestCase;
use InvalidArgumentException;

class EmailTest extends TestCase
{
    public function test_from_creates_valid_email(): void
    {
        $email = Email::from('user@example.com');

        $this->assertSame('user@example.com', $email->value());
    }

    public function test_from_normalizes_to_lowercase(): void
    {
        $email = Email::from('User@EXAMPLE.COM');

        $this->assertSame('user@example.com', $email->value());
    }

    public function test_from_trims_whitespace(): void
    {
        $email = Email::from('  user@example.com  ');

        $this->assertSame('user@example.com', $email->value());
    }

    public function test_from_normalizes_and_trims(): void
    {
        $email = Email::from('  USER@Example.COM  ');

        $this->assertSame('user@example.com', $email->value());
    }

    public function test_throws_on_invalid_email_without_at(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Invalid email address');

        Email::from('invalidemail');
    }

    public function test_throws_on_invalid_email_without_domain(): void
    {
        $this->expectException(InvalidArgumentException::class);

        Email::from('user@');
    }

    public function test_throws_on_empty_string(): void
    {
        $this->expectException(InvalidArgumentException::class);

        Email::from('');
    }

    public function test_throws_on_email_with_spaces(): void
    {
        $this->expectException(InvalidArgumentException::class);

        Email::from('user @example.com');
    }

    public function test_domain_extracts_domain(): void
    {
        $email = Email::from('user@example.com');

        $this->assertSame('example.com', $email->domain());
    }

    public function test_domain_with_subdomain(): void
    {
        $email = Email::from('admin@mail.example.co.uk');

        $this->assertSame('mail.example.co.uk', $email->domain());
    }

    public function test_equals_returns_true_for_same_email(): void
    {
        $a = Email::from('user@example.com');
        $b = Email::from('user@example.com');

        $this->assertTrue($a->equals($b));
    }

    public function test_equals_returns_true_for_case_insensitive_match(): void
    {
        $a = Email::from('USER@EXAMPLE.COM');
        $b = Email::from('user@example.com');

        $this->assertTrue($a->equals($b));
    }

    public function test_equals_returns_false_for_different_email(): void
    {
        $a = Email::from('user@example.com');
        $b = Email::from('other@example.com');

        $this->assertFalse($a->equals($b));
    }

    public function test_equals_returns_false_for_different_domain(): void
    {
        $a = Email::from('user@example.com');
        $b = Email::from('user@other.com');

        $this->assertFalse($a->equals($b));
    }

    public function test_to_string_returns_value(): void
    {
        $email = Email::from('user@example.com');

        $this->assertSame('user@example.com', (string) $email);
    }

    public function test_to_string_returns_normalized_value(): void
    {
        $email = Email::from('USER@EXAMPLE.COM');

        $this->assertSame('user@example.com', (string) $email);
    }
}
