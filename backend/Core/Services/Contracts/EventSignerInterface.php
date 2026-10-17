<?php

namespace Core\Services\Contracts;

/**
 * HMAC envelope for cross-domain events (Phase 4).
 *
 * In-process PHP cannot hide sender from receiver (shared memory), so the
 * envelope proves AUTHENTICITY + FRESHNESS instead: tampered, replayed, or
 * foreign-sender payloads are rejected at queue-at-rest and listener
 * boundaries. Browsers never verify (no key leaves the server).
 */
interface EventSignerInterface
{
    /**
     * @return array{event: string, sender: string, claims: array, at: int, nonce: string, signature: string}
     */
    public function issue(string $event, string $sender, array $claims, int $ttl = 86400): array;

    /**
     * Returns the claims when the envelope is authentic, fresh, from an
     * allowed sender and never seen before; null otherwise (and the nonce
     * is consumed on first sight so replays always fail closed).
     *
     * $consumer scopes single-use to one listener class: an event with N
     * legitimate listeners verifies N times (once each), while a true
     * replay by the same consumer still fails closed.
     */
    public function accept(array $envelope, array $senders, int $ttl = 86400, string $consumer = ''): ?array;
}
