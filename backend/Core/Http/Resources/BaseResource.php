<?php

namespace Core\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

abstract class BaseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => class_basename($this->resource),
            'attributes' => $this->resourceAttributes($request),
            'relationships' => $this->resourceRelationships($request),
            'meta' => $this->resourceMeta($request),
        ];
    }

    abstract protected function resourceAttributes(Request $request): array;

    protected function resourceRelationships(Request $request): array
    {
        return [];
    }

    protected function resourceMeta(Request $request): array
    {
        return [
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
