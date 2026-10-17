<?php

namespace Core\Events\Concerns;

use Core\Services\Contracts\EventSignerInterface;

/**
 * Opt-in authenticity for domain events. The constructor signs stable
 * scalar claims (ids, statuses — never models); listeners verify before
 * handling. Forgery/tamper/replay at queue-at-rest or cross-boundary
 * replay fails closed with an audit row.
 *
 * Usage in an event class:
 *   use SignsDispatch;
 *   public function __construct(public Payment $payment) { $this->sign('payments'); }
 *   public function signatureClaims(): array { return ['payment_id' => $this->payment->id]; }
 */
trait SignsDispatch
{
    public string $dispatchSender = '';

    public int $dispatchedAt = 0;

    public string $dispatchNonce = '';

    public string $dispatchSignature = '';

    /**
     * @return array<string, scalar|null>
     */
    abstract public function signatureClaims(): array;

    protected function sign(string $sender): void
    {
        $envelope = app(EventSignerInterface::class)->issue(
            static::class,
            $sender,
            $this->signatureClaims()
        );

        $this->dispatchSender = $envelope['sender'];
        $this->dispatchedAt = $envelope['at'];
        $this->dispatchNonce = $envelope['nonce'];
        $this->dispatchSignature = $envelope['signature'];
    }

    /**
     * @param list<string> $senders allowed module senders, e.g. ['payments']
     */
    public function verify(array $senders, string $consumer = ''): bool
    {
        $claims = app(EventSignerInterface::class)->accept([
            'event' => static::class,
            'sender' => $this->dispatchSender,
            'claims' => $this->signatureClaims(),
            'at' => $this->dispatchedAt,
            'nonce' => $this->dispatchNonce,
            'signature' => $this->dispatchSignature,
        ], $senders, 86400, $consumer);

        return $claims !== null;
    }
}
