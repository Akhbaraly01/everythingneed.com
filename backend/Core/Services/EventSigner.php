<?php

namespace Core\Services;

use Core\Services\Contracts\EventSignerInterface;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class EventSigner implements EventSignerInterface
{
    public function issue(string $event, string $sender, array $claims, int $ttl = 86400): array
    {
        $envelope = [
            'event' => $event,
            'sender' => $sender,
            'claims' => $claims,
            'at' => time(),
            'nonce' => (string) Str::uuid(),
        ];
        $envelope['signature'] = $this->sign($envelope);

        return $envelope;
    }

    public function accept(array $envelope, array $senders, int $ttl = 86400, string $consumer = ''): ?array
    {
        foreach (['event', 'sender', 'claims', 'at', 'nonce', 'signature'] as $key) {
            if (!array_key_exists($key, $envelope)) {
                return null;
            }
        }

        if (!is_array($envelope['claims']) || !in_array($envelope['sender'], $senders, true)) {
            return null;
        }

        if (abs(time() - (int) $envelope['at']) > $ttl) {
            return null;
        }

        $expected = $this->sign($envelope);
        if (!is_string($envelope['signature']) || !hash_equals($expected, $envelope['signature'])) {
            return null;
        }

        // Single-use nonce, scoped per consumer listener: replays by the
        // same consumer fail closed even inside the freshness window, while
        // distinct listeners on one event each verify once. add() is atomic
        // on real cache stores.
        $consumed = Cache::add('event-nonce:' . $consumer . ':' . $envelope['nonce'], 1, $ttl);
        if (!$consumed) {
            return null;
        }

        return $envelope['claims'];
    }

    private function sign(array $envelope): string
    {
        $canonical = json_encode(
            [$envelope['event'], $envelope['sender'], $envelope['claims'], (int) $envelope['at'], (string) $envelope['nonce']],
            JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
        );

        return hash_hmac('sha256', (string) $canonical, (string) config('app.key'));
    }
}
