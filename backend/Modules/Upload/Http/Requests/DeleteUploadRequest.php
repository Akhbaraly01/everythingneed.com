<?php

namespace Modules\Upload\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DeleteUploadRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Route middleware (auth/sanctum + gates) is the guard;
        // this request class owns payload validation only.
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'path' => [
                'required',
                'string',
                'max:500',
                // No absolute paths, no traversal, no backslashes
                'not_regex:(^/|\.\.|\\\\)',
            ],
        ];
    }
}
