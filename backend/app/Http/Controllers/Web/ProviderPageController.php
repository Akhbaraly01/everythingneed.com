<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Needs\Entities\TaskPost;

/**
 * Provider/worker console pages. Every figure is scoped to the
 * authenticated user's own records (self scope) — no cross-user data.
 */
class ProviderPageController extends Controller
{
    public function dashboard(Request $request): Response
    {
        $userId = $request->user()->id;

        $counts = [
            'task_applications' => DB::table('task_applications')
                ->where('user_id', $userId)->whereNull('deleted_at')->count(),
            'job_applications' => DB::table('job_applications')
                ->where('user_id', $userId)->whereNull('deleted_at')->count(),
            'my_requests' => DB::table('need_requests')
                ->where('user_id', $userId)->whereNull('deleted_at')->count(),
            'building_bookings' => DB::table('building_service_bookings')
                ->where('user_id', $userId)->whereNull('deleted_at')->count(),
        ];

        $opportunities = [
            'open_tasks' => DB::table('task_posts')
                ->where('status', TaskPost::STATUS_OPEN)->whereNull('deleted_at')->count(),
            'open_jobs' => DB::table('job_posts')
                ->where('is_active', true)->whereNull('deleted_at')->count(),
        ];

        $recentTaskApplications = DB::table('task_applications')
            ->join('task_posts', 'task_posts.id', '=', 'task_applications.task_post_id')
            ->where('task_applications.user_id', $userId)
            ->whereNull('task_applications.deleted_at')
            ->orderByDesc('task_applications.created_at')
            ->limit(5)
            ->get([
                'task_applications.id',
                'task_applications.status',
                'task_applications.created_at',
                'task_posts.title',
            ]);

        $recentJobApplications = DB::table('job_applications')
            ->join('job_posts', 'job_posts.id', '=', 'job_applications.job_post_id')
            ->where('job_applications.user_id', $userId)
            ->whereNull('job_applications.deleted_at')
            ->orderByDesc('job_applications.created_at')
            ->limit(5)
            ->get([
                'job_applications.id',
                'job_applications.status',
                'job_applications.created_at',
                'job_posts.title',
            ]);

        return Inertia::render('provider/Dashboard', [
            'counts' => $counts,
            'opportunities' => $opportunities,
            'recentTaskApplications' => $recentTaskApplications,
            'recentJobApplications' => $recentJobApplications,
        ]);
    }
}
