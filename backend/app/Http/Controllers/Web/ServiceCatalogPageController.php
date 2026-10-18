<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Services\Entities\ServiceCategory;
use Modules\Services\Entities\ServiceDefinition;

/**
 * M-3: public service catalogue pages. The home rail and the taxonomy grid
 * link here, closing the dead "/services/{id}" links the admin-created
 * services used to have.
 */
class ServiceCatalogPageController extends Controller
{
    public function index(Request $request): Response
    {
        $slug = trim((string) $request->query('category'));
        $category = $slug !== ''
            ? ServiceCategory::where('slug', $slug)->where('is_active', true)->first()
            : null;

        $query = ServiceDefinition::query()
            ->where('status', ServiceDefinition::STATUS_ACTIVE)
            ->with('categoryRef:id,name,slug,icon,color')
            ->orderByDesc('created_at');

        if ($slug !== '') {
            $query->where(function ($q) use ($category, $slug) {
                if ($category) {
                    $ids = [$category->id, ...$category->children()->pluck('id')->all()];
                    $q->whereIn('category_id', $ids);
                }
                $q->orWhere('category', $slug)->orWhere('category', 'ilike', $slug.'%');
            });
        }

        $services = $query->paginate(12)->withQueryString();

        $liveServices = fn ($q) => $q->where('status', ServiceDefinition::STATUS_ACTIVE);

        $categories = ServiceCategory::whereNull('parent_id')
            ->where('is_active', true)
            ->with(['children' => fn ($q) => $q
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->withCount(['services as services_count' => $liveServices])])
            ->withCount(['services as services_count' => $liveServices])
            ->orderBy('sort_order')
            ->get();

        foreach ($categories as $root) {
            $root->services_count = (int) $root->services_count
                + $root->children->sum(fn ($child) => (int) $child->services_count);
        }

        return Inertia::render('services/Index', [
            'categories' => $categories,
            'services' => $services,
            'filters' => ['category' => $slug !== '' ? $slug : null],
            'activeCategory' => $category,
        ]);
    }

    public function show(string $id): Response
    {
        $service = ServiceDefinition::where('status', ServiceDefinition::STATUS_ACTIVE)->find($id);

        abort_unless($service, 404);

        $related = ServiceDefinition::where('status', ServiceDefinition::STATUS_ACTIVE)
            ->where('id', '!=', $service->id)
            ->when($service->category_id, fn ($q) => $q->where('category_id', $service->category_id))
            ->orderByDesc('created_at')
            ->limit(4)
            ->get();

        return Inertia::render('services/Show', [
            'service' => $service->load('categoryRef:id,name,slug,icon,color,parent_id'),
            'related' => $related,
        ]);
    }
}
