<?php

namespace Core\Traits;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;

trait Auditable
{
    public static function bootAuditable(): void
    {
        static::created(function (Model $model) {
            static::logAudit('created', $model);
        });

        static::updated(function (Model $model) {
            static::logAudit('updated', $model);
        });

        static::deleted(function (Model $model) {
            static::logAudit('deleted', $model);
        });
    }

    protected static function logAudit(string $action, Model $model): void
    {
        AuditLog::create([
            'action' => $action,
            'entity_type' => class_basename($model),
            'entity_id' => $model->getKey(),
            'performed_by' => auth()->id() ?? 'system',
            'new_values' => $model->toArray(),
        ]);
    }
}
