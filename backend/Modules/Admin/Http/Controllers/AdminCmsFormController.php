<?php

namespace Modules\Admin\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Modules\Admin\Entities\CmsForm;
use Modules\Admin\Entities\CmsFormSubmission;
use Modules\Admin\Http\Requests\StoreCmsFormRequest;

class AdminCmsFormController extends Controller
{
    public const TYPES = [
        'text', 'textarea', 'number', 'email', 'phone', 'date',
        'select', 'multiselect', 'checkbox', 'radio',
        'file', 'image', 'address', 'country', 'currency',
    ];

    public function index(): JsonResponse
    {
        $forms = CmsForm::withCount('submissions')
            ->orderBy('name')
            ->get()
            ->map(fn (CmsForm $form) => [
                'id' => $form->id,
                'name' => $form->name,
                'slug' => $form->slug,
                'status' => $form->status,
                'fields_count' => count($form->fields ?? []),
                'submissions_count' => (int) $form->submissions_count,
                'created_at' => $form->created_at,
            ]);

        return response()->json(['data' => $forms]);
    }

    public function store(StoreCmsFormRequest $request): JsonResponse
    {
        $v = $request->validated();

        $form = CmsForm::create([
            'name' => $v['name'],
            'slug' => $v['slug'],
            'status' => $v['status'] ?? 'draft',
            'fields' => $this->normalize($v['fields']),
        ]);

        return response()->json(['data' => $this->shape($form)], 201);
    }

    public function show(string $formId): JsonResponse
    {
        $form = CmsForm::findOrFail($formId);

        return response()->json(['data' => $this->shape($form)]);
    }

    public function update(StoreCmsFormRequest $request, string $formId): JsonResponse
    {
        $form = CmsForm::findOrFail($formId);
        $v = $request->validated();

        $payload = [];
        foreach (['name', 'slug', 'status'] as $key) {
            if (array_key_exists($key, $v) && $v[$key] !== null) {
                $payload[$key] = $v[$key];
            }
        }
        if (isset($v['fields'])) {
            $payload['fields'] = $this->normalize($v['fields']);
        }

        $form->update($payload);

        return response()->json(['data' => $this->shape($form)]);
    }

    public function destroy(string $formId): JsonResponse
    {
        CmsForm::findOrFail($formId)->delete();

        return response()->json(['message' => 'Form deleted.']);
    }

    public function submissions(string $formId): JsonResponse
    {
        $form = CmsForm::findOrFail($formId);

        $submissions = CmsFormSubmission::where('form_id', $form->id)
            ->latest()
            ->limit(200)
            ->get()
            ->map(fn (CmsFormSubmission $s) => [
                'id' => $s->id,
                'data' => $s->data,
                'status' => $s->status,
                'user_id' => $s->user_id,
                'created_at' => $s->created_at,
            ]);

        return response()->json(['data' => $submissions]);
    }

    public function publicShow(string $slug): JsonResponse
    {
        $form = $this->published($slug);

        if (!$form) {
            return response()->json(['message' => 'Form not found'], 404);
        }

        return response()->json([
            'data' => [
                'name' => $form->name,
                'slug' => $form->slug,
                'fields' => $this->visible($form),
            ],
        ]);
    }

    public function publicSubmit(Request $request, string $slug): JsonResponse
    {
        $form = $this->published($slug);

        if (!$form) {
            return response()->json(['message' => 'Form not found'], 404);
        }

        $fields = $this->visible($form);

        $validator = Validator::make($request->all(), $this->rulesFor($fields));

        if ($validator->fails()) {
            return response()->json([
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        $clean = [];
        foreach ($fields as $field) {
            $key = $field['key'];
            if ($request->exists($key)) {
                $clean[$key] = $request->input($key);
            }
        }

        $submission = CmsFormSubmission::create([
            'form_id' => $form->id,
            'user_id' => $request->user()?->id,
            'data' => $clean,
            'status' => 'new',
        ]);

        return response()->json(['data' => ['id' => $submission->id]], 201);
    }

    private function published(string $slug): ?CmsForm
    {
        return CmsForm::where('slug', $slug)->where('status', 'published')->first();
    }

    private function visible(CmsForm $form): array
    {
        return collect($form->fields ?? [])
            ->filter(fn (array $field) => ($field['visibility'] ?? 'public') !== 'hidden')
            ->values()
            ->all();
    }

    private function normalize(array $fields): array
    {
        return collect($fields)
            ->map(fn (array $field, int $index) => array_merge($field, [
                'ordering' => $field['ordering'] ?? $index,
            ]))
            ->sortBy('ordering')
            ->values()
            ->all();
    }

    private function shape(CmsForm $form): array
    {
        return [
            'id' => $form->id,
            'name' => $form->name,
            'slug' => $form->slug,
            'status' => $form->status,
            'fields' => $form->fields ?? [],
            'created_at' => $form->created_at,
        ];
    }

    private function rulesFor(array $fields): array
    {
        $rules = [];

        foreach ($fields as $field) {
            $key = $field['key'];
            $required = !empty($field['required']);
            $base = [$required ? 'required' : 'nullable'];

            switch ($field['type']) {
                case 'email':
                    $base[] = 'email';
                    break;
                case 'number':
                case 'currency':
                    $base[] = 'numeric';
                    break;
                case 'date':
                    $base[] = 'date';
                    break;
                case 'phone':
                    $base[] = 'regex:/^\+?[0-9][0-9 ()\-]{6,19}$/';
                    break;
                case 'select':
                case 'radio':
                    $base[] = Rule::in($field['options'] ?? []);
                    break;
                case 'multiselect':
                    $base[] = 'array';
                    if ($required) {
                        $base[] = 'min:1';
                    }
                    $rules[$key] = $base;
                    $rules[$key.'.*'] = [Rule::in($field['options'] ?? [])];
                    continue 2;
                case 'checkbox':
                    $base[] = 'boolean';
                    break;
                case 'file':
                case 'image':
                    $base[] = 'string';
                    $base[] = 'max:500';
                    break;
                default:
                    $base[] = 'string';
                    break;
            }

            if (isset($field['max'])) {
                $base[] = 'max:'.$field['max'];
            }

            $rules[$key] = $base;
        }

        return $rules;
    }
}
