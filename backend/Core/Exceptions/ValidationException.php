<?php

namespace Core\Exceptions;

use Illuminate\Http\JsonResponse;

class ValidationException extends DomainException
{
    protected int $statusCode = 422;
    protected array $errors;

    public function __construct(string $message, array $errors = [])
    {
        parent::__construct($message, 'VALIDATION_ERROR');
        $this->errors = $errors;
    }

    public function getErrors(): array
    {
        return $this->errors;
    }

    public function render(): JsonResponse
    {
        $response = [
            'message' => $this->getMessage(),
            'error' => $this->errorCode,
            'errors' => !empty($this->errors)
                ? $this->errors
                : ['general' => [$this->getMessage()]],
        ];

        return response()->json($response, $this->statusCode);
    }
}
