<?php

namespace Modules\Admin\Services\Cms;

use App\Rules\NoExecutableCode;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

/**
 * Closed block registry for the no-code page builder (spec S42/S68).
 *
 * Only the 24 registered block types below are accepted by the API. Every
 * type declares a field schema that drives BOTH:
 *   - server-side validation (rulesFor/validateBlocks) - never trusts the
 *     client, never executes content (no PHP/JS/SQL/HTML injection paths);
 *   - the admin builder form (catalog()) - one source of truth.
 *
 * Rich text is structured plain text (heading + body), not raw HTML, so the
 * React renderer output-encodes everything by construction.
 */
final class BlockRegistry
{
    /** URL schemes a block link may use. Everything else (javascript:, data:, vbscript:, ...) is rejected. */
    private const URL_SCHEMES = ['http', 'https', 'mailto', 'tel'];

    /**
     * The 24 approved block types (spec S42). Keys are the canonical type
     * slugs stored in cms_blocks.type.
     *
     * @var array<string, array{label: string, group: string, fields: array<string, array<string, mixed>>}>
     */
    public const TYPES = [
        'hero' => [
            'label' => 'Hero',
            'group' => 'Content',
            'fields' => [
                'title' => ['type' => 'text', 'label' => 'Title', 'required' => true, 'max' => 200],
                'subtitle' => ['type' => 'textarea', 'label' => 'Subtitle', 'max' => 400],
                'image' => ['type' => 'image', 'label' => 'Background image'],
                'mobile_image' => ['type' => 'image', 'label' => 'Mobile image'],
                'cta_label' => ['type' => 'text', 'label' => 'Button label', 'max' => 60],
                'cta_url' => ['type' => 'url', 'label' => 'Button URL'],
                'align' => ['type' => 'select', 'label' => 'Alignment', 'options' => ['left', 'center', 'right'], 'default' => 'center'],
                'theme' => ['type' => 'select', 'label' => 'Theme', 'options' => ['light', 'dark'], 'default' => 'light'],
            ],
        ],
        'rich_text' => [
            'label' => 'Rich Text',
            'group' => 'Content',
            'fields' => [
                'heading' => ['type' => 'text', 'label' => 'Heading', 'max' => 200],
                'body' => ['type' => 'textarea', 'label' => 'Body', 'required' => true, 'max' => 20000],
            ],
        ],
        'image' => [
            'label' => 'Image',
            'group' => 'Content',
            'fields' => [
                'url' => ['type' => 'image', 'label' => 'Image URL', 'required' => true],
                'alt' => ['type' => 'text', 'label' => 'Alt text', 'max' => 200],
                'caption' => ['type' => 'text', 'label' => 'Caption', 'max' => 300],
                'link' => ['type' => 'url', 'label' => 'Link (optional)'],
            ],
        ],
        'cta' => [
            'label' => 'CTA',
            'group' => 'Content',
            'fields' => [
                'heading' => ['type' => 'text', 'label' => 'Heading', 'required' => true, 'max' => 200],
                'body' => ['type' => 'textarea', 'label' => 'Body', 'max' => 600],
                'button_label' => ['type' => 'text', 'label' => 'Button label', 'required' => true, 'max' => 60],
                'button_url' => ['type' => 'url', 'label' => 'Button URL', 'required' => true],
                'style' => ['type' => 'select', 'label' => 'Style', 'options' => ['primary', 'secondary', 'outline'], 'default' => 'primary'],
            ],
        ],
        'banner' => [
            'label' => 'Banner',
            'group' => 'Content',
            'fields' => [
                'image' => ['type' => 'image', 'label' => 'Banner image', 'required' => true],
                'title' => ['type' => 'text', 'label' => 'Title', 'max' => 160],
                'link' => ['type' => 'url', 'label' => 'Link URL'],
                'open_new_tab' => ['type' => 'bool', 'label' => 'Open in new tab'],
            ],
        ],
        'video' => [
            'label' => 'Video',
            'group' => 'Content',
            'fields' => [
                'url' => ['type' => 'url', 'label' => 'Video URL (YouTube, Vimeo or MP4)', 'required' => true],
                'title' => ['type' => 'text', 'label' => 'Title', 'max' => 200],
                'description' => ['type' => 'text', 'label' => 'Description', 'max' => 400],
                'aspect' => ['type' => 'select', 'label' => 'Aspect ratio', 'options' => ['16:9', '4:3', '1:1'], 'default' => '16:9'],
            ],
        ],
        'gallery' => [
            'label' => 'Gallery',
            'group' => 'Content',
            'fields' => [
                'images' => [
                    'type' => 'list', 'label' => 'Images', 'min' => 1, 'max' => 12,
                    'fields' => [
                        'url' => ['type' => 'image', 'label' => 'Image URL', 'required' => true],
                        'alt' => ['type' => 'text', 'label' => 'Alt text', 'max' => 200],
                        'caption' => ['type' => 'text', 'label' => 'Caption', 'max' => 300],
                    ],
                ],
                'columns' => ['type' => 'int', 'label' => 'Columns', 'min' => 2, 'max' => 4, 'default' => 3],
            ],
        ],
        'spacer' => [
            'label' => 'Spacer',
            'group' => 'Layout',
            'fields' => [
                'size' => ['type' => 'select', 'label' => 'Size', 'options' => ['sm', 'md', 'lg', 'xl'], 'default' => 'md'],
            ],
        ],
        'divider' => [
            'label' => 'Divider',
            'group' => 'Layout',
            'fields' => [
                'style' => ['type' => 'select', 'label' => 'Style', 'options' => ['solid', 'dashed', 'dotted'], 'default' => 'solid'],
            ],
        ],
        'cards' => [
            'label' => 'Cards',
            'group' => 'Lists',
            'fields' => [
                'heading' => ['type' => 'text', 'label' => 'Section heading', 'max' => 200],
                'items' => [
                    'type' => 'list', 'label' => 'Cards', 'min' => 1, 'max' => 12,
                    'fields' => [
                        'title' => ['type' => 'text', 'label' => 'Title', 'required' => true, 'max' => 120],
                        'body' => ['type' => 'textarea', 'label' => 'Body', 'max' => 600],
                        'image' => ['type' => 'image', 'label' => 'Image'],
                        'eyebrow' => ['type' => 'text', 'label' => 'Eyebrow', 'max' => 60],
                        'link' => ['type' => 'url', 'label' => 'Link'],
                    ],
                ],
            ],
        ],
        'stats' => [
            'label' => 'Stats',
            'group' => 'Lists',
            'fields' => [
                'items' => [
                    'type' => 'list', 'label' => 'Stats', 'min' => 1, 'max' => 6,
                    'fields' => [
                        'value' => ['type' => 'text', 'label' => 'Value', 'required' => true, 'max' => 20],
                        'label' => ['type' => 'text', 'label' => 'Label', 'required' => true, 'max' => 60],
                    ],
                ],
            ],
        ],
        'testimonials' => [
            'label' => 'Testimonials',
            'group' => 'Lists',
            'fields' => [
                'items' => [
                    'type' => 'list', 'label' => 'Testimonials', 'min' => 1, 'max' => 10,
                    'fields' => [
                        'name' => ['type' => 'text', 'label' => 'Name', 'required' => true, 'max' => 100],
                        'role' => ['type' => 'text', 'label' => 'Role', 'max' => 100],
                        'quote' => ['type' => 'textarea', 'label' => 'Quote', 'required' => true, 'max' => 1000],
                        'rating' => ['type' => 'int', 'label' => 'Rating', 'min' => 1, 'max' => 5],
                        'avatar' => ['type' => 'image', 'label' => 'Avatar'],
                    ],
                ],
            ],
        ],
        'faq' => [
            'label' => 'FAQ',
            'group' => 'Lists',
            'fields' => [
                'heading' => ['type' => 'text', 'label' => 'Section heading', 'max' => 200],
                'items' => [
                    'type' => 'list', 'label' => 'Questions', 'min' => 1, 'max' => 20,
                    'fields' => [
                        'question' => ['type' => 'text', 'label' => 'Question', 'required' => true, 'max' => 300],
                        'answer' => ['type' => 'textarea', 'label' => 'Answer', 'required' => true, 'max' => 2000],
                    ],
                ],
            ],
        ],
        'featured_content' => [
            'label' => 'Featured Content',
            'group' => 'Lists',
            'fields' => [
                'heading' => ['type' => 'text', 'label' => 'Section heading', 'max' => 200],
                'items' => [
                    'type' => 'list', 'label' => 'Items', 'min' => 1, 'max' => 8,
                    'fields' => [
                        'title' => ['type' => 'text', 'label' => 'Title', 'required' => true, 'max' => 200],
                        'url' => ['type' => 'url', 'label' => 'URL', 'required' => true],
                        'image' => ['type' => 'image', 'label' => 'Image'],
                        'excerpt' => ['type' => 'textarea', 'label' => 'Excerpt', 'max' => 400],
                        'badge' => ['type' => 'text', 'label' => 'Badge', 'max' => 40],
                    ],
                ],
            ],
        ],
        'product_grid' => [
            'label' => 'Product Grid',
            'group' => 'Dynamic',
            'fields' => [
                'heading' => ['type' => 'text', 'label' => 'Section heading', 'max' => 200],
                'source' => ['type' => 'select', 'label' => 'Data source', 'options' => ['latest', 'featured', 'selected'], 'default' => 'latest'],
                'filter' => ['type' => 'text', 'label' => 'Category', 'max' => 120, 'required_if' => ['source', 'selected']],
                'limit' => ['type' => 'int', 'label' => 'Items to show', 'min' => 1, 'max' => 24, 'default' => 8],
                'show_price' => ['type' => 'bool', 'label' => 'Show price'],
            ],
        ],
        'course_grid' => [
            'label' => 'Course Grid',
            'group' => 'Dynamic',
            'fields' => [
                'heading' => ['type' => 'text', 'label' => 'Section heading', 'max' => 200],
                'source' => ['type' => 'select', 'label' => 'Data source', 'options' => ['latest', 'featured', 'selected'], 'default' => 'latest'],
                'filter' => ['type' => 'text', 'label' => 'Category', 'max' => 120, 'required_if' => ['source', 'selected']],
                'limit' => ['type' => 'int', 'label' => 'Items to show', 'min' => 1, 'max' => 24, 'default' => 8],
            ],
        ],
        'doctor_grid' => [
            'label' => 'Doctor Grid',
            'group' => 'Dynamic',
            'fields' => [
                'heading' => ['type' => 'text', 'label' => 'Section heading', 'max' => 200],
                'source' => ['type' => 'select', 'label' => 'Data source', 'options' => ['latest', 'selected'], 'default' => 'latest'],
                'filter' => ['type' => 'text', 'label' => 'Specialty', 'max' => 120, 'required_if' => ['source', 'selected']],
                'limit' => ['type' => 'int', 'label' => 'Items to show', 'min' => 1, 'max' => 24, 'default' => 8],
            ],
        ],
        'expert_grid' => [
            'label' => 'Expert Grid',
            'group' => 'Dynamic',
            'fields' => [
                'heading' => ['type' => 'text', 'label' => 'Section heading', 'max' => 200],
                'source' => ['type' => 'select', 'label' => 'Data source', 'options' => ['latest', 'selected'], 'default' => 'latest'],
                'filter' => ['type' => 'text', 'label' => 'Specialty', 'max' => 120, 'required_if' => ['source', 'selected']],
                'limit' => ['type' => 'int', 'label' => 'Items to show', 'min' => 1, 'max' => 24, 'default' => 8],
            ],
        ],
        'vendor_grid' => [
            'label' => 'Vendor Grid',
            'group' => 'Dynamic',
            'fields' => [
                'heading' => ['type' => 'text', 'label' => 'Section heading', 'max' => 200],
                'source' => ['type' => 'select', 'label' => 'Data source', 'options' => ['latest', 'verified', 'selected'], 'default' => 'latest'],
                'filter' => ['type' => 'text', 'label' => 'Category', 'max' => 120, 'required_if' => ['source', 'selected']],
                'limit' => ['type' => 'int', 'label' => 'Items to show', 'min' => 1, 'max' => 24, 'default' => 8],
            ],
        ],
        'category_grid' => [
            'label' => 'Category Grid',
            'group' => 'Dynamic',
            'fields' => [
                'heading' => ['type' => 'text', 'label' => 'Section heading', 'max' => 200],
                'source' => ['type' => 'select', 'label' => 'Data source', 'options' => ['latest', 'selected'], 'default' => 'latest'],
                'filter' => ['type' => 'text', 'label' => 'Parent category slug', 'max' => 120, 'required_if' => ['source', 'selected']],
                'limit' => ['type' => 'int', 'label' => 'Items to show', 'min' => 1, 'max' => 24, 'default' => 12],
                'show_icons' => ['type' => 'bool', 'label' => 'Show icons'],
            ],
        ],
        'service_grid' => [
            'label' => 'Service Grid',
            'group' => 'Dynamic',
            'fields' => [
                'heading' => ['type' => 'text', 'label' => 'Section heading', 'max' => 200],
                'source' => ['type' => 'select', 'label' => 'Data source', 'options' => ['latest', 'selected'], 'default' => 'latest'],
                'filter' => ['type' => 'text', 'label' => 'Service type', 'max' => 120, 'required_if' => ['source', 'selected']],
                'limit' => ['type' => 'int', 'label' => 'Items to show', 'min' => 1, 'max' => 24, 'default' => 8],
            ],
        ],
        'need_categories' => [
            'label' => 'Need Categories',
            'group' => 'Dynamic',
            'fields' => [
                'heading' => ['type' => 'text', 'label' => 'Section heading', 'max' => 200],
                'limit' => ['type' => 'int', 'label' => 'Items to show', 'min' => 1, 'max' => 24, 'default' => 12],
            ],
        ],
        'healthcare_services' => [
            'label' => 'Healthcare Services',
            'group' => 'Dynamic',
            'fields' => [
                'heading' => ['type' => 'text', 'label' => 'Section heading', 'max' => 200],
                'limit' => ['type' => 'int', 'label' => 'Items to show', 'min' => 1, 'max' => 24, 'default' => 8],
            ],
        ],
        'learning_categories' => [
            'label' => 'Learning Categories',
            'group' => 'Dynamic',
            'fields' => [
                'heading' => ['type' => 'text', 'label' => 'Section heading', 'max' => 200],
                'limit' => ['type' => 'int', 'label' => 'Items to show', 'min' => 1, 'max' => 24, 'default' => 8],
            ],
        ],
    ];

    /** @return array<string, array{label: string, group: string, fields: array<string, array<string, mixed>>}> */
    public static function all(): array
    {
        return self::TYPES;
    }

    /** @return list<string> */
    public static function types(): array
    {
        return array_keys(self::TYPES);
    }

    public static function has(string $type): bool
    {
        return isset(self::TYPES[$type]);
    }

    /**
     * Builder-facing catalog: type keys with labels, groups and field
     * definitions (so the React form is generated from this same schema).
     */
    public static function catalog(): array
    {
        $out = [];
        foreach (self::TYPES as $type => $def) {
            $out[$type] = [
                'type' => $type,
                'label' => $def['label'],
                'group' => $def['group'],
                'fields' => $def['fields'],
            ];
        }

        return $out;
    }

    /**
     * Validate a full blocks payload (shape + per-type data schemas).
     *
     * @param  array<int, mixed>  $blocks
     * @throws ValidationException
     * @return array<int, array{id: ?string, type: string, data: array<string, mixed>, is_visible: bool}>
     */
    public static function validateBlocks(array $blocks): array
    {
        if (count($blocks) > 100) {
            throw ValidationException::withMessages([
                'blocks' => 'A page may contain at most 100 blocks.',
            ]);
        }

        $errors = [];
        $clean = [];

        foreach (array_values($blocks) as $i => $block) {
            if (! is_array($block)) {
                $errors["blocks.{$i}"] = 'Each block must be an object.';

                continue;
            }

            $type = $block['type'] ?? null;
            if (! is_string($type) || ! self::has($type)) {
                $errors["blocks.{$i}.type"] = sprintf(
                    'Unknown block type "%s". Only the %d registered block types are allowed.',
                    is_string($type) ? $type : get_debug_type($type),
                    count(self::TYPES)
                );

                continue;
            }

            $data = $block['data'] ?? [];
            if (! is_array($data)) {
                $errors["blocks.{$i}.data"] = 'Block data must be an object.';

                continue;
            }

            $validator = Validator::make($data, self::rulesFor($type), [], self::attributesFor($type));
            if ($validator->fails()) {
                foreach ($validator->errors()->messages() as $field => $messages) {
                    $errors["blocks.{$i}.data.{$field}"] = $messages;
                }

                continue;
            }

            $clean[] = [
                'id' => (isset($block['id']) && is_string($block['id']) && preg_match('/^[0-9a-f-]{36}$/i', $block['id'])) ? $block['id'] : null,
                'type' => $type,
                'data' => self::cleanData($type, $validator->validated()),
                'is_visible' => (bool) ($block['is_visible'] ?? true),
            ];
        }

        if ($errors !== []) {
            throw ValidationException::withMessages($errors);
        }

        return $clean;
    }

    /** @return array<string, mixed> */
    public static function rulesFor(string $type): array
    {
        $def = self::TYPES[$type] ?? null;
        if ($def === null) {
            return [];
        }

        return self::rulesForFields($def['fields']);
    }

    /**
     * URL rule: internal paths, anchors and http(s)/mailto/tel only.
     * javascript:, data:, vbscript: etc. never pass.
     */
    public static function safeUrlRule(): array
    {
        return [
            'nullable',
            'string',
            'max:500',
            function (string $attribute, mixed $value, \Closure $fail): void {
                if (! is_string($value)) {
                    $fail("The {$attribute} must be a URL.");

                    return;
                }

                $value = trim($value);
                if ($value === '') {
                    return;
                }

                if (preg_match('/^([a-z][a-z0-9+.\-]*):/i', $value, $m)) {
                    if (! in_array(strtolower($m[1]), self::URL_SCHEMES, true)) {
                        $fail("The {$attribute} must use an allowed scheme (".implode(', ', self::URL_SCHEMES).").");

                        return;
                    }

                    return;
                }

                if (! str_starts_with($value, '/') && ! str_starts_with($value, '#')) {
                    $fail("The {$attribute} must be an internal path (/...), an anchor (#...) or an http(s) URL.");
                }
            },
        ];
    }

    /** @param array<string, array<string, mixed>> $fields @return array<string, mixed> */
    private static function rulesForFields(array $fields): array
    {
        $rules = [];

        foreach ($fields as $name => $field) {
            $prefix = '';
            $suffix = '';

            if (($field['type'] ?? '') === 'list') {
                $min = (int) ($field['min'] ?? 1);
                $max = (int) ($field['max'] ?? 20);
                $base = [$min > 0 ? 'required' : 'nullable', 'array', "min:{$min}", "max:{$max}"];
                if (isset($field['required_if'])) {
                    $base = array_merge(['nullable'], array_diff($base, ['required']));
                    $base[] = 'required_if:'.$field['required_if'][0].','.$field['required_if'][1];
                }
                $rules[$name] = $base;

                $subRules = self::rulesForFields($field['fields'] ?? []);
                foreach ($subRules as $subName => $subRule) {
                    $rules["{$name}.*.{$subName}"] = $subRule;
                }

                continue;
            }

            $base = [];
            if (isset($field['required_if'])) {
                $base[] = 'nullable';
                $base[] = 'required_if:'.$field['required_if'][0].','.$field['required_if'][1];
            } else {
                $base[] = ($field['required'] ?? false) ? 'required' : 'nullable';
            }

            switch ($field['type']) {
                case 'text':
                    $base[] = 'string';
                    $base[] = 'max:'.(int) ($field['max'] ?? 255);
                    $base[] = new NoExecutableCode();
                    break;
                case 'textarea':
                    $base[] = 'string';
                    $base[] = 'max:'.(int) ($field['max'] ?? 5000);
                    $base[] = new NoExecutableCode();
                    break;
                case 'url':
                case 'image':
                    $base = array_merge($base, self::safeUrlRule());
                    break;
                case 'int':
                    $base[] = 'integer';
                    if (isset($field['min'])) {
                        $base[] = 'min:'.(int) $field['min'];
                    }
                    if (isset($field['max'])) {
                        $base[] = 'max:'.(int) $field['max'];
                    }
                    break;
                case 'bool':
                    $base[] = 'boolean';
                    break;
                case 'select':
                    $base[] = 'in:'.implode(',', $field['options'] ?? []);
                    break;
                default:
                    $base[] = 'string';
                    break;
            }

            $rules[$name] = $base;
        }

        return $rules;
    }

    /** @param array<string, array<string, mixed>> $fields @return array<string, string> */
    private static function attributesForFields(array $fields, string $prefix = ''): array
    {
        $attrs = [];
        foreach ($fields as $name => $field) {
            $key = $prefix === '' ? $name : $prefix.'.'.$name;
            $attrs[$key] = $field['label'] ?? $name;
            if (($field['type'] ?? '') === 'list') {
                foreach (self::attributesForFields($field['fields'] ?? [], $key.'.*') as $subKey => $label) {
                    $attrs[$subKey] = $label;
                }
            }
        }

        return $attrs;
    }

    /** @return array<string, string> */
    private static function attributesFor(string $type): array
    {
        return self::attributesForFields(self::TYPES[$type]['fields']);
    }

    /**
     * Whitelist the stored payload to the registered fields only - unknown
     * keys are dropped so the JSON stays structured (spec S68).
     *
     * @param array<string, mixed> $validated
     * @return array<string, mixed>
     */
    private static function cleanData(string $type, array $validated): array
    {
        $fields = self::TYPES[$type]['fields'];
        $out = [];

        foreach ($fields as $name => $field) {
            if (! array_key_exists($name, $validated)) {
                continue;
            }
            $value = $validated[$name];

            if (($field['type'] ?? '') === 'list') {
                $subFields = $field['fields'] ?? [];
                $value = array_map(function ($row) use ($subFields) {
                    if (! is_array($row)) {
                        return $row;
                    }

                    return array_intersect_key($row, $subFields);
                }, is_array($value) ? $value : []);
            }

            $out[$name] = $value;
        }

        return $out;
    }
}
