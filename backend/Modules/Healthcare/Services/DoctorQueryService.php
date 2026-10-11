<?php

namespace Modules\Healthcare\Services;

use Core\Services\BaseService;
use Core\Services\Contracts\DoctorQueryInterface;
use Illuminate\Support\Facades\DB;

class DoctorQueryService extends BaseService implements DoctorQueryInterface
{
    public function paginateDoctors(array $filters = []): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $query = DB::table('doctors');

        if (is_string($filters['specialty'] ?? null)) {
            $query->where('specialization', $filters['specialty']);
        }

        if (is_string($filters['profession'] ?? null)) {
            $query->where('profession', $filters['profession']);
        }

        if (is_string($filters['qualification'] ?? null) && trim($filters['qualification']) !== '') {
            $query->where('qualification', 'ilike', '%'.trim($filters['qualification']).'%');
        }

        if (is_numeric($filters['experience_min'] ?? null)) {
            $query->where('experience_years', '>=', (int) $filters['experience_min']);
        }

        if (! empty($filters['available'])) {
            $query->where('is_available', true);
        }

        if (! empty($filters['virtual'])) {
            $query->whereNotNull('virtual_fee')->where('virtual_fee', '>', 0);
        }

        $paginator = $query->orderByDesc('rating')->paginate($filters['per_page'] ?? 15);
        $paginator->setCollection($paginator->getCollection()->map(fn ($row) => $this->present($row)));

        return $paginator;
    }

    public function findDoctor(string $id): ?object
    {
        $row = DB::table('doctors')->where('id', $id)->first();

        return $row === null ? null : $this->present($row);
    }

    /**
     * Presentation aliases for cross-module consumers (experts pages): the
     * cards/profiles read name/specialty/image_url while the doctors table
     * stores full_name/specialization/avatar_url. Additive — every original
     * column stays on the payload.
     */
    private function present(object $row): object
    {
        $row->name = $row->full_name;
        $row->specialty = $row->specialization;
        $row->bio = $row->qualification;
        $row->image_url = $row->avatar_url;
        $row->years_experience = $row->experience_years;
        $row->hourly_rate = $row->consultation_fee;

        return $row;
    }

    public function distinctSpecializations(): array
    {
        return DB::table('doctors')
            ->select('specialization')
            ->whereNotNull('specialization')
            ->distinct()
            ->orderBy('specialization')
            ->pluck('specialization')
            ->all();
    }
}
