<?php

namespace Modules\Bills\Support;

/**
 * Spec 30 service catalog: availability is derived from config (service
 * enabled + country supported + currency supported + provider resolvable),
 * never hard-coded per page.
 */
final class BillCatalog
{
    public static function services(): array
    {
        return (array) config('bills.services', []);
    }

    public static function find(string $service): ?array
    {
        $services = self::services();

        return $services[strtolower($service)] ?? null;
    }

    /**
     * @return array{available: bool, reasons: string[]}
     */
    public static function availability(string $service, ?string $country, ?string $currency): array
    {
        $reasons = [];
        $catalog = self::find($service);

        if ($catalog === null) {
            return ['available' => false, 'reasons' => ["Unknown service '{$service}'"]];
        }

        if (empty($catalog['enabled'])) {
            $reasons[] = "Service '{$service}' is currently disabled";
        }

        if ($country !== null && !in_array(strtoupper($country), $catalog['countries'] ?? [], true)) {
            $reasons[] = "Country '{$country}' is not supported for '{$service}'";
        }

        if ($currency !== null && !in_array(strtoupper($currency), $catalog['currencies'] ?? [], true)) {
            $reasons[] = "Currency '{$currency}' is not supported for '{$service}'";
        }

        try {
            app(BillProviderResolver::class)->resolve();
        } catch (\InvalidArgumentException $e) {
            $reasons[] = 'Bill provider is not configured';
        } catch (\RuntimeException $e) {
            $reasons[] = 'Bill provider is not available in this environment';
        }

        return ['available' => $reasons === [], 'reasons' => $reasons];
    }

    /** Full catalog shaped for the API, with availability per country/currency. */
    public static function shaped(?string $country, ?string $currency): array
    {
        $out = [];
        foreach (self::services() as $id => $service) {
            $availability = self::availability($id, $country, $currency);
            $out[] = [
                'id' => $id,
                'label' => $service['label'] ?? $id,
                'countries' => $service['countries'] ?? [],
                'currencies' => $service['currencies'] ?? [],
                'fields' => $service['fields'] ?? [],
                'min_amount' => $service['min_amount'] ?? 1,
                'enabled' => (bool) ($service['enabled'] ?? false),
                'available' => $availability['available'],
                'unavailable_reasons' => $availability['reasons'],
            ];
        }

        return $out;
    }
}
