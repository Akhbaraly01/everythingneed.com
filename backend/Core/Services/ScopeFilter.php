<?php

namespace Core\Services;

use Core\DTOs\ScopeContext;
use Core\Enums\PermissionScope;

/**
 * Applies a resolved ScopeContext to a query.
 *
 * Column mapping is passed by the caller (queries use aliases). Missing
 * mappings fail CLOSED (empty result) — a narrowing scope without a wired
 * column must never silently return unscoped rows; the scope tests pin the
 * mappings.
 *
 * Deferred scopes (team/country/region) intentionally do not filter yet.
 */
final class ScopeFilter
{
    /**
     * @param  \Illuminate\Database\Query\Builder|\Illuminate\Database\Eloquent\Builder  $query
     * @param  string  $ownColumn    column holding the owner id (OWN)
     * @param  string  $vendorColumn  column holding the vendor id (VENDOR)
     * @param  string  $domainColumn  column holding the domain key (DOMAIN)
     * @return \Illuminate\Database\Query\Builder|\Illuminate\Database\Eloquent\Builder
     */
    public static function apply(
        $query,
        ScopeContext $ctx,
        string $ownColumn = '',
        string $vendorColumn = '',
        string $domainColumn = '',
    ) {
        if (! $ctx->isNarrowing()) {
            // global + deferred scopes do not narrow rows.
            return $query;
        }

        return match ($ctx->scope) {
            PermissionScope::OWN => $ownColumn !== ''
                ? $query->where($ownColumn, $ctx->userId)
                : $query->whereRaw('1 = 0'), // fail closed: column not wired
            PermissionScope::VENDOR => ($vendorColumn !== '' && $ctx->vendorId !== null)
                ? $query->where($vendorColumn, $ctx->vendorId)
                : $query->whereRaw('1 = 0'), // fail closed: no vendor binding
            PermissionScope::DOMAIN => ($domainColumn !== '' && $ctx->value !== null)
                ? $query->where($domainColumn, $ctx->value)
                : $query->whereRaw('1 = 0'), // fail closed: no domain value
            default => $query,
        };
    }
}
