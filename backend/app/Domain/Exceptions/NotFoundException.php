<?php

namespace App\Domain\Exceptions;

class NotFoundException extends DomainException
{
    public function __construct(string $entityType, string|int $id)
    {
        parent::__construct(
            "{$entityType} with ID [{$id}] not found.",
            ['entity_type' => $entityType, 'entity_id' => $id],
            404
        );
    }
}
