<?php

namespace Modules\Admin\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AdminCmsController extends Controller
{
    public function pages(): JsonResponse
    {
        $pages = DB::table('cms_pages')->orderByDesc('updated_at')->get();

        return response()->json(['data' => $pages]);
    }

    public function createPage(Request $request): JsonResponse
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'nullable|string',
        ]);

        $id = DB::table('cms_pages')->insertGetId([
            'title' => $request->title,
            'slug' => Str::slug($request->title),
            'content' => $request->content ?? '',
            'status' => 'draft',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'message' => 'Page created',
            'data' => DB::table('cms_pages')->find($id),
        ], 201);
    }

    public function deletePage(string $id): JsonResponse
    {
        DB::table('cms_pages')->where('id', $id)->delete();

        return response()->json(['message' => 'Page deleted']);
    }

    public function blog(): JsonResponse
    {
        $posts = DB::table('cms_blog_posts')->orderByDesc('published_at')->get();

        return response()->json(['data' => $posts]);
    }

    public function createBlog(Request $request): JsonResponse
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'nullable|string',
        ]);

        $id = DB::table('cms_blog_posts')->insertGetId([
            'title' => $request->title,
            'slug' => Str::slug($request->title),
            'content' => $request->content ?? '',
            'author' => $request->user()->name ?? 'Admin',
            'status' => 'draft',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'message' => 'Blog post created',
            'data' => DB::table('cms_blog_posts')->find($id),
        ], 201);
    }

    public function deleteBlog(string $id): JsonResponse
    {
        DB::table('cms_blog_posts')->where('id', $id)->delete();

        return response()->json(['message' => 'Blog post deleted']);
    }

    public function banners(): JsonResponse
    {
        $banners = DB::table('cms_banners')->orderByDesc('created_at')->get();

        return response()->json(['data' => $banners]);
    }

    public function createBanner(Request $request): JsonResponse
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'position' => 'nullable|string|max:100',
        ]);

        $id = DB::table('cms_banners')->insertGetId([
            'title' => $request->title,
            'position' => $request->position ?? 'homepage',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'message' => 'Banner created',
            'data' => DB::table('cms_banners')->find($id),
        ], 201);
    }

    public function deleteBanner(string $id): JsonResponse
    {
        DB::table('cms_banners')->where('id', $id)->delete();

        return response()->json(['message' => 'Banner deleted']);
    }

    public function announcements(): JsonResponse
    {
        $announcements = DB::table('cms_announcements')->orderByDesc('created_at')->get();

        return response()->json(['data' => $announcements]);
    }

    public function createAnnouncement(Request $request): JsonResponse
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'nullable|string',
            'priority' => 'nullable|string|in:low,medium,high',
        ]);

        $id = DB::table('cms_announcements')->insertGetId([
            'title' => $request->title,
            'content' => $request->content ?? '',
            'priority' => $request->priority ?? 'medium',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'message' => 'Announcement created',
            'data' => DB::table('cms_announcements')->find($id),
        ], 201);
    }

    public function deleteAnnouncement(string $id): JsonResponse
    {
        DB::table('cms_announcements')->where('id', $id)->delete();

        return response()->json(['message' => 'Announcement deleted']);
    }
}
