<?php

namespace Tests\Unit\ValueObjects;

use App\Domain\ValueObjects\Money;
use PHPUnit\Framework\TestCase;
use InvalidArgumentException;

class MoneyTest extends TestCase
{
    public function test_from_cents_creates_money_with_correct_amount(): void
    {
        $money = Money::fromCents(1500);

        $this->assertSame(1500, $money->amount());
        $this->assertSame('USD', $money->currency());
    }

    public function test_from_cents_with_custom_currency(): void
    {
        $money = Money::fromCents(500, 'EUR');

        $this->assertSame(500, $money->amount());
        $this->assertSame('EUR', $money->currency());
    }

    public function test_from_decimal_converts_correctly(): void
    {
        $money = Money::fromDecimal(10.50);

        $this->assertSame(1050, $money->amount());
        $this->assertSame('USD', $money->currency());
    }

    public function test_from_decimal_rounds_correctly(): void
    {
        $money = Money::fromDecimal(10.555);

        $this->assertSame(1056, $money->amount());
    }

    public function test_from_decimal_with_custom_currency(): void
    {
        $money = Money::fromDecimal(25.99, 'GBP');

        $this->assertSame(2599, $money->amount());
        $this->assertSame('GBP', $money->currency());
    }

    public function test_zero_returns_zero_amount(): void
    {
        $money = Money::zero();

        $this->assertSame(0, $money->amount());
        $this->assertSame('USD', $money->currency());
        $this->assertTrue($money->isZero());
    }

    public function test_zero_with_custom_currency(): void
    {
        $money = Money::zero('CAD');

        $this->assertSame(0, $money->amount());
        $this->assertSame('CAD', $money->currency());
    }

    public function test_decimal_returns_float_representation(): void
    {
        $money = Money::fromCents(1500);

        $this->assertSame(15.0, $money->decimal());
    }

    public function test_add_combines_two_money_objects(): void
    {
        $a = Money::fromCents(500);
        $b = Money::fromCents(300);

        $result = $a->add($b);

        $this->assertSame(800, $result->amount());
        $this->assertSame('USD', $result->currency());
    }

    public function test_subtract_subtracts_money_objects(): void
    {
        $a = Money::fromCents(1000);
        $b = Money::fromCents(400);

        $result = $a->subtract($b);

        $this->assertSame(600, $result->amount());
    }

    public function test_multiply_multiplies_amount(): void
    {
        $money = Money::fromCents(500);

        $result = $money->multiply(3);

        $this->assertSame(1500, $result->amount());
        $this->assertSame('USD', $result->currency());
    }

    public function test_multiply_preserves_currency(): void
    {
        $money = Money::fromCents(200, 'EUR');

        $result = $money->multiply(5);

        $this->assertSame('EUR', $result->currency());
    }

    public function test_is_greater_than_or_equal_when_greater(): void
    {
        $a = Money::fromCents(1000);
        $b = Money::fromCents(500);

        $this->assertTrue($a->isGreaterThanOrEqual($b));
    }

    public function test_is_greater_than_or_equal_when_equal(): void
    {
        $a = Money::fromCents(500);
        $b = Money::fromCents(500);

        $this->assertTrue($a->isGreaterThanOrEqual($b));
    }

    public function test_is_greater_than_or_equal_when_less(): void
    {
        $a = Money::fromCents(300);
        $b = Money::fromCents(500);

        $this->assertFalse($a->isGreaterThanOrEqual($b));
    }

    public function test_is_zero_on_zero_amount(): void
    {
        $money = Money::zero();

        $this->assertTrue($money->isZero());
    }

    public function test_is_zero_on_non_zero_amount(): void
    {
        $money = Money::fromCents(1);

        $this->assertFalse($money->isZero());
    }

    public function test_equals_returns_true_for_same_value_and_currency(): void
    {
        $a = Money::fromCents(500, 'USD');
        $b = Money::fromCents(500, 'USD');

        $this->assertTrue($a->equals($b));
    }

    public function test_equals_returns_false_for_different_amount(): void
    {
        $a = Money::fromCents(500);
        $b = Money::fromCents(600);

        $this->assertFalse($a->equals($b));
    }

    public function test_equals_returns_false_for_different_currency(): void
    {
        $a = Money::fromCents(500, 'USD');
        $b = Money::fromCents(500, 'EUR');

        $this->assertFalse($a->equals($b));
    }

    public function test_throws_on_negative_amount(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Money amount cannot be negative');

        Money::fromCents(-100);
    }

    public function test_throws_on_negative_decimal(): void
    {
        $this->expectException(InvalidArgumentException::class);

        Money::fromDecimal(-5.00);
    }

    public function test_throws_on_currency_mismatch_in_add(): void
    {
        $usd = Money::fromCents(500, 'USD');
        $eur = Money::fromCents(300, 'EUR');

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Currency mismatch');

        $usd->add($eur);
    }

    public function test_throws_on_currency_mismatch_in_subtract(): void
    {
        $usd = Money::fromCents(500, 'USD');
        $eur = Money::fromCents(300, 'EUR');

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Currency mismatch');

        $usd->subtract($eur);
    }

    public function test_throws_on_currency_mismatch_in_is_greater_than_or_equal(): void
    {
        $usd = Money::fromCents(500, 'USD');
        $eur = Money::fromCents(300, 'EUR');

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Currency mismatch');

        $usd->isGreaterThanOrEqual($eur);
    }

    public function test_to_array_returns_correct_structure(): void
    {
        $money = Money::fromCents(2500, 'GBP');

        $array = $money->toArray();

        $this->assertIsArray($array);
        $this->assertArrayHasKey('amount', $array);
        $this->assertArrayHasKey('currency', $array);
        $this->assertSame(2500, $array['amount']);
        $this->assertSame('GBP', $array['currency']);
    }

    public function test_to_string_formats_correctly(): void
    {
        $money = Money::fromCents(1500, 'USD');

        $this->assertSame('15.00 USD', (string) $money);
    }

    public function test_to_string_with_zero_amount(): void
    {
        $money = Money::zero('EUR');

        $this->assertSame('0.00 EUR', (string) $money);
    }

    public function test_to_string_with_cents(): void
    {
        $money = Money::fromCents(1234, 'JPY');

        $this->assertSame('12.34 JPY', (string) $money);
    }
}
