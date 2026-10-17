<?php

namespace Core\Events\Concerns;

use Core\Services\Contracts\AuditServiceInterface;

/**
 * Listener-side verification for SignsDispatch events. Rejected events are
 * audit-logged (best-effort, never throws) and the handler must return
 * without side effects.
 */
trait VerifiesEvents
{
    /**
     * @param list<string> $senders
     */
    protected function verified(object $event, array $senders): bool
    {
        if (!method_exists($event, 'verify')) {
            return true;
        }

        // Consumer-scoped: each listener class verifies once per envelope,
        // so multi-listener events work while true replays fail closed.
        if ($event->verify($senders, static::class)) {
            return true;
        }

        try {
            app(AuditServiceInterface::class)->log([
                'action' => 'event.rejected',
                'entity_type' => 'domain_event',
                'entity_id' => $event::class,
                'performed_by' => null,
                'new_values' => ['senders' => $senders],
            ]);
        } catch (\Throwable) {
        }

        return false;
    }
}
