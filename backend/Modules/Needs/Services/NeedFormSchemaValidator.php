<?php

namespace Modules\Needs\Services;

/**
 * Validates category form schemas and request answers.
 *
 * Schemas are plain data (never code): a list of at most 20 fields, each
 * {key, label, type, required, options?}. Allowlisted types only; keys are
 * snake_case slugs so answers stay queryable. Historical requests keep their
 * submitted snapshot, so tightening a schema never retro-breaks them.
 */
class NeedFormSchemaValidator
{
    public const FIELD_TYPES = ['text', 'textarea', 'number', 'select', 'date', 'boolean'];

    public const MAX_FIELDS = 20;

    /**
     * @return array{valid: bool, errors: array<string,string>, schema: array}
     */
    public static function validateSchema(mixed $schema): array
    {
        if ($schema === null || $schema === []) {
            return ['valid' => true, 'errors' => [], 'schema' => []];
        }

        if (! is_array($schema) || array_is_list($schema) === false) {
            return ['valid' => false, 'errors' => ['schema' => 'Schema must be a list of fields'], 'schema' => []];
        }

        if (count($schema) > self::MAX_FIELDS) {
            return ['valid' => false, 'errors' => ['schema' => 'At most ' . self::MAX_FIELDS . ' fields allowed'], 'schema' => []];
        }

        $errors = [];
        $clean = [];
        $keys = [];

        foreach ($schema as $i => $field) {
            $prefix = "fields.{$i}";
            if (! is_array($field)) {
                $errors[$prefix] = 'Field must be an object';
                continue;
            }

            $key = $field['key'] ?? null;
            $label = $field['label'] ?? null;
            $type = $field['type'] ?? null;

            if (! is_string($key) || ! preg_match('/^[a-z][a-z0-9_]{1,40}$/', $key)) {
                $errors["{$prefix}.key"] = 'Key must be snake_case, 2-41 chars';
                continue;
            }
            if (in_array($key, $keys, true)) {
                $errors["{$prefix}.key"] = 'Duplicate field key';
                continue;
            }
            $keys[] = $key;

            if (! is_string($label) || trim($label) === '' || mb_strlen($label) > 120) {
                $errors["{$prefix}.label"] = 'Label is required, max 120 chars';
                continue;
            }

            if (! in_array($type, self::FIELD_TYPES, true)) {
                $errors["{$prefix}.type"] = 'Type must be one of: ' . implode(', ', self::FIELD_TYPES);
                continue;
            }

            $entry = [
                'key' => $key,
                'label' => trim($label),
                'type' => $type,
                'required' => (bool) ($field['required'] ?? false),
            ];

            if ($type === 'select') {
                $options = $field['options'] ?? null;
                if (! is_array($options) || count($options) < 2 || count($options) > 30) {
                    $errors["{$prefix}.options"] = 'Select needs 2-30 options';
                    continue;
                }
                $cleanOptions = [];
                foreach ($options as $opt) {
                    if (! is_string($opt) || trim($opt) === '' || mb_strlen($opt) > 80) {
                        $errors["{$prefix}.options"] = 'Options must be non-empty strings, max 80 chars';
                        continue 2;
                    }
                    $cleanOptions[] = trim($opt);
                }
                $entry['options'] = array_values(array_unique($cleanOptions));
            }

            $clean[] = $entry;
        }

        return ['valid' => $errors === [], 'errors' => $errors, 'schema' => $clean];
    }

    /**
     * @return array<string,string> errors keyed by field key (empty = valid)
     */
    public static function validateAnswers(array $schema, mixed $answers): array
    {
        if ($schema === []) {
            return [];
        }

        if (! is_array($answers)) {
            return ['answers' => 'Answers must be an object keyed by field key'];
        }

        $errors = [];

        foreach ($schema as $field) {
            $key = $field['key'];
            $has = array_key_exists($key, $answers);
            $value = $has ? $answers[$key] : null;
            $blank = ! $has || $value === null || $value === '';

            if ($blank) {
                if ($field['required']) {
                    $errors[$key] = "'{$field['label']}' is required";
                }
                continue;
            }

            switch ($field['type']) {
                case 'number':
                    if (! is_numeric($value)) {
                        $errors[$key] = "'{$field['label']}' must be a number";
                    }
                    break;
                case 'select':
                    if (! in_array($value, $field['options'] ?? [], true)) {
                        $errors[$key] = "'{$field['label']}' is not an allowed option";
                    }
                    break;
                case 'date':
                    if (! is_string($value) || ! preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
                        $errors[$key] = "'{$field['label']}' must be a YYYY-MM-DD date";
                    }
                    break;
                case 'boolean':
                    if (! in_array($value, [true, false, 0, 1, '0', '1'], true)) {
                        $errors[$key] = "'{$field['label']}' must be true or false";
                    }
                    break;
                default: // text, textarea
                    if (! is_string($value) || mb_strlen($value) > 2000) {
                        $errors[$key] = "'{$field['label']}' must be text, max 2000 chars";
                    }
                    break;
            }
        }

        return $errors;
    }
}
