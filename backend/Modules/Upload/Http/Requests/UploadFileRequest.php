<?php

namespace Modules\Upload\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

class UploadFileRequest extends FormRequest
{
    /** Image/document ceiling (KB). Client-side compression usually lands far below this. */
    private const DOCUMENT_MAX_KB = 25600;

    /** Video ceiling (KB) — the browser transcode keeps real traffic around 20-60MB. */
    private const VIDEO_MAX_KB = 512000;

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
            'file' => 'required|file|max:'.self::VIDEO_MAX_KB.'|mimes:jpg,jpeg,png,gif,webp,svg,pdf,doc,docx,xls,xlsx,mp4,webm,mov,m4v,mkv',
            'folder' => ['nullable', 'string', 'max:100', 'regex:/^[A-Za-z0-9_-]+$/'],
        ];
    }

    /**
     * Per-kind size ceilings: videos may be large (they arrive post-transcode),
     * everything else stays in the small-file envelope.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $file = $this->file('file');

            if (!$file || !$file->isValid()) {
                return;
            }

            $mime = $file->getMimeType() ?: '';
            $kilobytes = (int) ceil($file->getSize() / 1024);

            if (str_starts_with($mime, 'video/')) {
                if ($kilobytes > self::VIDEO_MAX_KB) {
                    $validator->errors()->add('file', 'Videos must be under 500MB. Large clips are auto-compressed before upload.');
                }

                return;
            }

            if ($kilobytes > self::DOCUMENT_MAX_KB) {
                $validator->errors()->add('file', 'Files must be under 25MB.');
            }
        });
    }
}
