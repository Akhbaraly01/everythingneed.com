<?php

namespace Core\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;

class BaseException extends Exception
{
    protected int $statusCode = 500;
    protected array $metadata = [];

    public function __construct(string $message = '', int $statusCode = 500, array $metadata = [])
    {
        parent::__construct($message);
        $this->statusCode = $statusCode;
        $this->metadata = $metadata;
    }

    public function render(): JsonResponse
    {
        return response()->json([
            'error' => [
                'message' => $this->getMessage(),
                'code' => $this->statusCode,
                'metadata' => $this->metadata,
            ],
        ], $this->statusCode);
    }

    public function getStatusCode(): int
    {
        return $this->statusCode;
    }
}
