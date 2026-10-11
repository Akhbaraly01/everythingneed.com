<?php

namespace Modules\Admin\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Modules\Admin\Http\Requests\CmsAnnouncementStoreRequest;
use Modules\Admin\Http\Requests\CmsAnnouncementUpdateRequest;
use Modules\Admin\Http\Requests\CmsBannerStoreRequest;
use Modules\Admin\Http\Requests\CmsBannerUpdateRequest;
use Modules\Admin\Http\Requests\CmsBlogStoreRequest;
use Modules\Admin\Http\Requests\CmsBlogUpdateRequest;
use Modules\Admin\Http\Requests\CmsPageStoreRequest;
use Modules\Admin\Http\Requests\CmsPageUpdateRequest;

class AdminCmsController extends Controller
{
    public function __construct(private \Modules\Admin\Services\Cms\PageBuilderService $builder) {}

    // ── Pages ────────────────────────────────────────────────────────────────

    public function pages(): JsonResponse
    {
        return response()->json([
            'data' => DB::table('cms_pages')->whereNull('deleted_at')->orderByDesc('updated_at')->get(),
        ]);
    }

    public function createPage(CmsPageStoreRequest $request): JsonResponse
    {
        $data = $request->validated();

        $id = (string) Str::uuid();
        $slugInput = $data['slug'] ?? null;
        if ($slugInput !== null && DB::table('cms_pages')->where('slug', $slugInput)->whereNull('deleted_at')->exists()) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => ['slug' => ['This slug is already in use.']],
            ], 422);
        }
        $slug = $slugInput !== null ? $slugInput : $this->uniqueSlug('cms_pages', $data['title']);
        $status = $data['status'] ?? 'draft';

        DB::table('cms_pages')->insert([
            'id' => $id,
            'title' => $data['title'],
            'slug' => $slug,
            'content' => $data['content'] ?? '',
            'description' => $data['description'] ?? null,
            'seo_title' => $data['seo_title'] ?? null,
            'seo_description' => $data['seo_description'] ?? null,
            'seo_image' => $data['seo_image'] ?? null,
            'canonical_url' => $data['canonical_url'] ?? null,
            'visibility' => $data['visibility'] ?? 'public',
            'template' => $data['template'] ?? 'default',
            'menu_placement' => $data['menu_placement'] ?? null,
            'status' => $status,
            'published_at' => $status === 'published' ? now() : null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $page = \Modules\Admin\Entities\CmsPage::find($id);
        // Revision 1 = empty page snapshot (spec S45: history from creation).
        $this->builder->appendRevision($page, 'Page created', $request->user()?->id);

        $this->auditCms('create', $id, $request, [
            'new_values' => ['title' => $data['title'], 'slug' => $slug, 'status' => $status],
        ]);

        return response()->json([
            'message' => 'Page created',
            'data' => DB::table('cms_pages')->find($id),
        ], 201);
    }

    public function updatePage(CmsPageUpdateRequest $request, string $id): JsonResponse
    {
        $data = $request->validated();

        $exists = DB::table('cms_pages')->where('id', $id)->whereNull('deleted_at')->exists();
        if (! $exists) {
            return response()->json(['message' => 'Page not found'], 404);
        }

        $current = DB::table('cms_pages')->find($id);
        $payload = ['updated_at' => now()];

        if (array_key_exists('slug', $data) && $data['slug'] !== null) {
            $collision = DB::table('cms_pages')
                ->where('slug', $data['slug'])
                ->where('id', '!=', $id)
                ->whereNull('deleted_at')
                ->exists();
            if ($collision) {
                return response()->json([
                    'message' => 'Validation failed.',
                    'errors' => ['slug' => ['This slug is already in use.']],
                ], 422);
            }
            $payload['slug'] = $data['slug'];
        } elseif (array_key_exists('title', $data)) {
            $payload['slug'] = $this->uniqueSlug('cms_pages', $data['title'], $id);
        }

        if (array_key_exists('title', $data)) {
            $payload['title'] = $data['title'];
        }
        foreach ([
            'content', 'description', 'seo_title', 'seo_description',
            'seo_image', 'canonical_url', 'visibility', 'template', 'menu_placement',
        ] as $field) {
            if (array_key_exists($field, $data)) {
                $payload[$field] = $data[$field];
            }
        }
        if (array_key_exists('status', $data)) {
            $payload['status'] = $data['status'];
            if ($data['status'] === 'published' && $current->published_at === null) {
                $payload['published_at'] = now();
            }
        }

        DB::table('cms_pages')->where('id', $id)->update($payload);

        $page = \Modules\Admin\Entities\CmsPage::find($id);
        $this->builder->appendRevision($page, 'Details updated', $request->user()?->id);

        // Invalidate both the old and the new public URL caches (spec S109).
        \Illuminate\Support\Facades\Cache::forget('cms.page.'.$current->slug);
        \Illuminate\Support\Facades\Cache::forget('cms.page.'.$page->slug);

        $this->auditCms('update', $id, $request, [
            'old_values' => ['title' => $current->title, 'slug' => $current->slug, 'status' => $current->status],
            'new_values' => [
                'title' => $payload['title'] ?? $current->title,
                'slug'  => $payload['slug'] ?? $current->slug,
                'status' => $payload['status'] ?? $current->status,
            ],
        ]);

        return response()->json([
            'message' => 'Page updated',
            'data' => DB::table('cms_pages')->find($id),
        ]);
    }

    public function deletePage(Request $request, string $id): JsonResponse
    {
        $page = \Modules\Admin\Entities\CmsPage::find($id);
        abort_unless($page !== null && $page->deleted_at === null, 404, 'Page not found');

        DB::table('cms_pages')->where('id', $id)->update(['deleted_at' => now()]);
        \Illuminate\Support\Facades\Cache::forget('cms.page.'.$page->slug);

        $this->auditCms('delete', $id, $request, [
            'old_values' => ['title' => $page->title, 'slug' => $page->slug, 'status' => $page->status],
        ]);

        return response()->json(['message' => 'Page deleted']);
    }

    /**
     * CMS mutations are sensitive (spec §66: publishing + page deletion).
     * Audit failures never block the mutation.
     *
     * @param  array{old_values?: array, new_values?: array}  $values
     */
    private function auditCms(string $action, string $pageId, Request $request, array $values): void
    {
        try {
            app(\Core\Services\Contracts\AuditServiceInterface::class)->log([
                'action'       => $action,
                'entity_type'  => 'cms_page',
                'entity_id'    => $pageId,
                'performed_by' => $request->user()?->id,
                'old_values'   => $values['old_values'] ?? null,
                'new_values'   => $values['new_values'] ?? null,
            ]);
        } catch (\Throwable) {
            // Audit failures must not break CMS mutations.
        }
    }

    // ── Blog ─────────────────────────────────────────────────────────────────

    public function blog(): JsonResponse
    {
        return response()->json([
            'data' => DB::table('cms_blog_posts')->whereNull('deleted_at')->orderByDesc('published_at')->orderByDesc('created_at')->get(),
        ]);
    }

    public function createBlog(CmsBlogStoreRequest $request): JsonResponse
    {
        $data = $request->validated();

        $status = $data['status'] ?? 'draft';
        $id = (string) Str::uuid();
        DB::table('cms_blog_posts')->insert([
            'id' => $id,
            'title' => $data['title'],
            'slug' => $this->uniqueSlug('cms_blog_posts', $data['title']),
            'content' => $data['content'] ?? '',
            'author' => $request->user()->name ?? 'Admin',
            'status' => $status,
            'published_at' => $status === 'published' ? now() : null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'message' => 'Blog post created',
            'data' => DB::table('cms_blog_posts')->find($id),
        ], 201);
    }

    public function updateBlog(CmsBlogUpdateRequest $request, string $id): JsonResponse
    {
        $data = $request->validated();

        $exists = DB::table('cms_blog_posts')->where('id', $id)->whereNull('deleted_at')->exists();
        if (! $exists) {
            return response()->json(['message' => 'Blog post not found'], 404);
        }

        $payload = ['updated_at' => now()];
        if (array_key_exists('title', $data)) {
            $payload['title'] = $data['title'];
            $payload['slug'] = $this->uniqueSlug('cms_blog_posts', $data['title'], $id);
        }
        if (array_key_exists('content', $data)) {
            $payload['content'] = $data['content'] ?? '';
        }
        if (array_key_exists('status', $data)) {
            $payload['status'] = $data['status'];
            if ($data['status'] === 'published') {
                $payload['published_at'] = DB::table('cms_blog_posts')->where('id', $id)->value('published_at') ?? now();
            }
        }

        DB::table('cms_blog_posts')->where('id', $id)->update($payload);

        return response()->json([
            'message' => 'Blog post updated',
            'data' => DB::table('cms_blog_posts')->find($id),
        ]);
    }

    public function deleteBlog(string $id): JsonResponse
    {
        DB::table('cms_blog_posts')->where('id', $id)->update(['deleted_at' => now()]);

        return response()->json(['message' => 'Blog post deleted']);
    }

    // ── Banners ──────────────────────────────────────────────────────────────

    public function banners(): JsonResponse
    {
        return response()->json([
            'data' => DB::table('cms_banners')->whereNull('deleted_at')->orderBy('sort_order')->orderByDesc('created_at')->get(),
        ]);
    }

    public function createBanner(CmsBannerStoreRequest $request): JsonResponse
    {
        $data = $request->validated();

        $id = (string) Str::uuid();
        DB::table('cms_banners')->insert([
            'id' => $id,
            'title' => $data['title'],
            'position' => $data['position'] ?? 'homepage',
            'image_url' => $data['image_url'] ?? null,
            'link_url' => $data['link_url'] ?? null,
            'sort_order' => $data['sort_order'] ?? 0,
            'is_active' => $data['is_active'] ?? true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'message' => 'Banner created',
            'data' => DB::table('cms_banners')->find($id),
        ], 201);
    }

    public function updateBanner(CmsBannerUpdateRequest $request, string $id): JsonResponse
    {
        $data = $request->validated();

        $exists = DB::table('cms_banners')->where('id', $id)->whereNull('deleted_at')->exists();
        if (! $exists) {
            return response()->json(['message' => 'Banner not found'], 404);
        }

        DB::table('cms_banners')->where('id', $id)->update($data + ['updated_at' => now()]);

        return response()->json([
            'message' => 'Banner updated',
            'data' => DB::table('cms_banners')->find($id),
        ]);
    }

    public function deleteBanner(string $id): JsonResponse
    {
        DB::table('cms_banners')->where('id', $id)->update(['deleted_at' => now()]);

        return response()->json(['message' => 'Banner deleted']);
    }

    // ── Announcements ────────────────────────────────────────────────────────

    public function announcements(): JsonResponse
    {
        return response()->json([
            'data' => DB::table('cms_announcements')->whereNull('deleted_at')->orderByDesc('created_at')->get(),
        ]);
    }

    public function createAnnouncement(CmsAnnouncementStoreRequest $request): JsonResponse
    {
        $data = $request->validated();

        $id = (string) Str::uuid();
        DB::table('cms_announcements')->insert([
            'id' => $id,
            'title' => $data['title'],
            'content' => $data['content'] ?? '',
            'priority' => $data['priority'] ?? 'medium',
            'is_active' => $data['is_active'] ?? true,
            'starts_at' => $data['starts_at'] ?? null,
            'ends_at' => $data['ends_at'] ?? null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'message' => 'Announcement created',
            'data' => DB::table('cms_announcements')->find($id),
        ], 201);
    }

    public function updateAnnouncement(CmsAnnouncementUpdateRequest $request, string $id): JsonResponse
    {
        $data = $request->validated();

        $exists = DB::table('cms_announcements')->where('id', $id)->whereNull('deleted_at')->exists();
        if (! $exists) {
            return response()->json(['message' => 'Announcement not found'], 404);
        }

        DB::table('cms_announcements')->where('id', $id)->update($data + ['updated_at' => now()]);

        return response()->json([
            'message' => 'Announcement updated',
            'data' => DB::table('cms_announcements')->find($id),
        ]);
    }

    public function deleteAnnouncement(string $id): JsonResponse
    {
        DB::table('cms_announcements')->where('id', $id)->update(['deleted_at' => now()]);

        return response()->json(['message' => 'Announcement deleted']);
    }

    private function uniqueSlug(string $table, string $title, ?string $ignoreId = null): string
    {
        $base = Str::slug($title) ?: 'item';
        $slug = $base;
        $i = 2;

        while (
            DB::table($table)
                ->where('slug', $slug)
                ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $slug = $base.'-'.$i++;
        }

        return $slug;
    }
}
