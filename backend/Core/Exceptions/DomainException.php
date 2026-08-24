<?php

namespace Core\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;

class DomainException extends Exception
{
    protected string $errorCode;
    protected int $statusCode = 400;

    public function __construct(string $message, string $errorCode = 'DOMAIN_ERROR', array $metadata = [])
    {
        parent::__construct($message);
        $this->errorCode = $errorCode;
    }

    public function getErrorCode(): string
    {
        return $this->errorCode;
    }

    public function getStatusCode(): int
    {
        return $this->statusCode;
    }

    public function render(): JsonResponse
    {
        return response()->json([
            'message' => $this->getMessage(),
            'error' => $this->errorCode,
        ], $this->statusCode);
    }
}
