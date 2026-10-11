<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Spec §68 — the CMS must never become a remote-code-execution system.
 *
 * Rejects executable constructs in CMS copy: PHP open tags (<?php, <?=, <%)
 * and script tags (<script, </script, any case). Plain prose is untouched —
 * the rule triggers only on tag openers, so words like "JavaScript" or
 * "description" pass freely. URL-scheme abuse (javascript:) is handled
 * separately by BlockRegistry::safeUrlRule() on URL-typed fields.
 */
class NoExecutableCode implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || $value === '') {
            return;
        }

        if (preg_match('/<\?(php|=)?|<%|<\/script|<script/i', $value)) {
            $fail("The {$attribute} must not contain executable code.");
        }
    }
}
