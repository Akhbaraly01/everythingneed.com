<?php

namespace Modules\Search\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SearchController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = $request->get('q', '');

        if (strlen($query) < 2) {
            return response()->json(['message' => 'Search query must be at least 2 characters'], 422);
        }

        $like = "%{$query}%";
        $type = $request->get('type', 'all');
        $results = [];

        if ($type === 'all' || $type === 'products') {
            $results['products'] = DB::table('products')
                ->where('is_active', true)
                ->where(function ($q) use ($like) {
                    $q->where('name', 'ILIKE', $like)
                        ->orWhere('description', 'ILIKE', $like)
                        ->orWhere('category', 'ILIKE', $like);
                })
                ->limit(10)
                ->get(['id', 'name', 'price', 'image_url as image', 'category']);
        }

        if ($type === 'all' || $type === 'services') {
            $results['services'] = DB::table('need_items')
                ->where('is_available', true)
                ->where(function ($q) use ($like) {
                    $q->where('name', 'ILIKE', $like)
                        ->orWhere('description', 'ILIKE', $like);
                })
                ->limit(10)
                ->get(['id', 'name as title', 'price as budget', 'category_id']);
        }

        if ($type === 'all' || $type === 'courses') {
            $results['courses'] = DB::table('courses')
                ->where(function ($q) use ($like) {
                    $q->where('title', 'ILIKE', $like)
                        ->orWhere('description', 'ILIKE', $like)
                        ->orWhere('instructor_name', 'ILIKE', $like);
                })
                ->limit(10)
                ->get(['id', 'title', 'price', 'instructor_name', 'thumbnail_url as thumbnail']);
        }

        if ($type === 'all' || $type === 'restaurants') {
            $results['restaurants'] = DB::table('restaurants')
                ->where('is_active', true)
                ->where(function ($q) use ($like) {
                    $q->where('name', 'ILIKE', $like)
                        ->orWhere('cuisine_type', 'ILIKE', $like)
                        ->orWhere('city', 'ILIKE', $like);
                })
                ->limit(10)
                ->get(['id', 'name', 'cuisine_type', 'rating', 'image_url as image']);
        }

        if ($type === 'all' || $type === 'hotels') {
            $results['hotels'] = DB::table('hotels')
                ->where('is_active', true)
                ->where(function ($q) use ($like) {
                    $q->where('name', 'ILIKE', $like)
                        ->orWhere('description', 'ILIKE', $like)
                        ->orWhere('city', 'ILIKE', $like);
                })
                ->limit(10)
                ->get(['id', 'name', 'city', 'state', 'country', 'star_rating']);
        }

        if ($type === 'all' || $type === 'jobs') {
            $results['jobs'] = DB::table('job_posts')
                ->where('is_active', true)
                ->where(function ($q) use ($like) {
                    $q->where('title', 'ILIKE', $like)
                        ->orWhere('description', 'ILIKE', $like)
                        ->orWhere('company', 'ILIKE', $like);
                })
                ->limit(10)
                ->get(['id', 'title', 'company', 'location', 'salary_min', 'salary_max', 'currency']);
        }

        return response()->json(['data' => $results, 'query' => $query, 'type' => $type]);
    }
}
