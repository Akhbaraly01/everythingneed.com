<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Learn\Entities\Course;

class LearnPageController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Course::where('is_published', true);

        if ($category = trim((string) $request->query('category'))) {
            $query->where('category', 'ilike', $category);
        }

        if ($level = trim((string) $request->query('level'))) {
            $query->where('level', 'ilike', $level);
        }

        if ($search = trim((string) $request->query('search'))) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'ilike', "%{$search}%")
                    ->orWhere('description', 'ilike', "%{$search}%");
            });
        }

        $courses = $query->orderByDesc('created_at')->paginate(20)->withQueryString();

        return Inertia::render('learn/Index', [
            'courses' => $courses,
            'filters' => $request->only(['category', 'level', 'search']),
        ]);
    }

    public function show(string $id): Response
    {
        $course = Course::with('lessons')
            ->where('is_published', true)
            ->findOrFail($id);

        return Inertia::render('learn/Show', [
            'course' => $course,
        ]);
    }
}
