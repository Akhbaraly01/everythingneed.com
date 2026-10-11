<?php

namespace Modules\Admin\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AdminMediaUploadRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Route middleware (auth/sanctum + permission:media.manage +
        // manageCms gate) is the guard; this class owns payload validation.
        return true;
    }

    /**
     * Admin library scope: files land under library/{folder} on the public
     * disk. Folders outside the allowlist are rejected - admins cannot
     * escape into user scopes or system paths.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'file' => 'required|file|max:10240|mimes:jpg,jpeg,png,gif,webp,svg,pdf',
            'folder' => ['nullable', 'string', 'max:50', 'in:library,banners,cms,products'],
            'title' => ['nullable', 'string', 'max:250'],
        ];
    }
}
