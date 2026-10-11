<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Modules\Admin\Entities\CmsBlock;
use Modules\Admin\Entities\CmsPage;
use Modules\Admin\Services\Cms\BlockResolver;

/**
 * Public renderer for no-code CMS pages (spec S99: /p/{slug}).
 *
 * Published pages are public; drafts render only for users holding the
 * manageCms gate (admin preview). Block structure is cached per slug and
 * invalidated by every builder mutation; dynamic grid items are resolved
 * fresh on each request so listings never show stale data (spec S109).
 */
class CmsPageController extends Controller
{
    public function __construct(private BlockResolver $resolver) {}

    public function show(Request $request, string $slug): \Illuminate\Contracts\Support\Responsable|\Symfony\Component\HttpFoundation\Response
    {
        $page = CmsPage::where('slug', $slug)
            ->whereNull('deleted_at')
            ->first();

        $published = $page !== null && $page->status === 'published';
        if ($page === null || ! $published) {
            $user = $page === null ? null : $request->user();
            $canPreview = $page !== null
                && $user !== null
                && $user->suspended_at === null
                && Gate::forUser($user)->check('manageCms');
            if (! $canPreview) {
                // A draft (or a missing slug) must be indistinguishable from a
                // non-existent page: answer with a real 404 response instead of
                // aborting, because the app exception handler turns thrown
                // web 404s into redirects (soft-404 would leak draft URLs).
                return $this->notFound($request);
            }
        }

        $blocks = $published ? $this->cachedBlocks($page) : $this->blockRows($page);
        $resolved = $this->resolver->resolve($blocks);

        return Inertia::render('Cms/Show', [
            'page' => [
                'id' => $page->id,
                'title' => $page->title,
                'slug' => $page->slug,
                'description' => $page->description,
                'status' => $page->status,
                'template' => $page->template ?? 'default',
                'menu_placement' => $page->menu_placement,
                'blocks' => $resolved,
            ],
            'seo' => [
                'title' => $page->seo_title ?: $page->title,
                'description' => $page->seo_description
                    ?: $page->description
                    ?: 'EverythingNeed',
                'image' => $page->seo_image,
                'canonical' => $page->canonical_url ?: url('/p/'.$page->slug),
                'robots' => $page->visibility === 'unlisted' ? 'noindex,follow' : 'index,follow',
                'published_at' => $page->published_at?->toIso8601String(),
                'updated_at' => $page->updated_at?->toIso8601String(),
                // Spec 88: dynamic CMS pages automatically emit WebPage
                // structured data alongside the OG/Twitter tags.
                'json_ld' => [array_filter([
                    '@context' => 'https://schema.org',
                    '@type' => 'WebPage',
                    'name' => $page->seo_title ?: $page->title,
                    'description' => $page->seo_description ?: $page->description,
                    'url' => $page->canonical_url ?: url('/p/'.$page->slug),
                    'datePublished' => $page->published_at?->toIso8601String(),
                    'dateModified' => $page->updated_at?->toIso8601String(),
                ], fn ($value) => $value !== null)],
            ],
        ]);
    }

    /** Mirror the web catch-all: real 404, never a redirect (spec: no soft-404). */
    private function notFound(Request $request): \Illuminate\Contracts\Support\Responsable|\Symfony\Component\HttpFoundation\Response
    {
        if ($request->expectsJson()) {
            abort(404);
        }

        if ($request->header('X-Inertia')) {
            return redirect()->back()->with('error', 'The requested resource was not found.');
        }

        return inertia('errors/404')->toResponse($request)->setStatusCode(404);
    }

    /** @return array<int, array<string, mixed>> */
    private function cachedBlocks(CmsPage $page): array
    {
        return Cache::remember(
            'cms.page.'.$page->slug,
            (int) config('cms.page_cache_ttl', 900),
            fn (): array => $this->blockRows($page),
        );
    }

    /** @return array<int, array<string, mixed>> */
    private function blockRows(CmsPage $page): array
    {
        return CmsBlock::where('page_id', $page->id)
            ->orderBy('sort_order')
            ->get()
            ->map(fn (CmsBlock $b) => [
                'id' => $b->id,
                'type' => $b->type,
                'data' => $b->data,
                'is_visible' => $b->is_visible,
            ])
            ->values()
            ->all();
    }
}
