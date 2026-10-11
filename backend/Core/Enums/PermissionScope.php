<?php

namespace Core\Enums;

/**
 * Row-scope attached to a permission grant (permission_scopes table).
 *
 * Enforcement status:
 *   GLOBAL  - no row filtering (default when no scope row exists)
 *   OWN     - rows owned by the acting user (owner column filter)
 *   VENDOR  - rows bound to the acting user's vendor; fail-closed when the
 *             user has no vendor binding
 *   DOMAIN  - rows in the scope_value domain (e.g. department id); the value
 *             comes from the scope row and is required at grant time
 *   TEAM    - architectured, enforcement deferred (no team model yet)
 *   COUNTRY - architectured, enforcement deferred (geography deferred)
 *   REGION  - architectured, enforcement deferred (geography deferred)
 */
enum PermissionScope: string
{
    case GLOBAL = 'global';
    case OWN = 'own';
    case VENDOR = 'vendor';
    case DOMAIN = 'domain';
    case TEAM = 'team';
    case COUNTRY = 'country';
    case REGION = 'region';

    /**
     * All canonical values (validation for the scopes API).
     *
     * @return list<string>
     */
    public static function values(): array
    {
        return array_map(fn (self $case) => $case->value, self::cases());
    }

    /**
     * Deferred scopes are architected end-to-end (enum, resolver, filter
     * no-op) but do not narrow queries yet — see AUDIT_MATRIX.md W1.6.
     */
    public function isDeferred(): bool
    {
        return match ($this) {
            self::TEAM, self::COUNTRY, self::REGION => true,
            default => false,
        };
    }

    /**
     * How narrowly the scope restricts rows — used to pick the winning row
     * when a user holds several roles with scope rows for one permission.
     * Higher = narrower = wins.
     */
    public function precedence(): int
    {
        return match ($this) {
            self::OWN, self::VENDOR, self::DOMAIN => 3,
            self::TEAM, self::COUNTRY, self::REGION => 2,
            self::GLOBAL => 1,
        };
    }
}
