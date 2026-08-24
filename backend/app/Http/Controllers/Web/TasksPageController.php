<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Needs\Entities\TaskApplication;
use Modules\Needs\Entities\TaskPost;

class TasksPageController extends Controller
{
    public function index(Request $request): Response
    {
        $query = TaskPost::with('owner:id,name')->withCount('applications');

        if ($q = trim((string) $request->query('q'))) {
            $query->where(function ($sub) use ($q) {
                $sub->where('title', 'ilike', "%{$q}%")
                    ->orWhere('description', 'ilike', "%{$q}%");
            });
        }

        if ($request->query('mine')) {
            $query->where('created_by', $request->user()->id);
        } else {
            $query->where('status', TaskPost::STATUS_OPEN);
        }

        $tasks = $query->orderByDesc('created_at')->paginate(12)->withQueryString();

        return Inertia::render('tasks/Index', [
            'tasks' => $tasks,
            'filters' => $request->only(['q', 'mine']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('tasks/Create');
    }

    public function show(Request $request, string $id): Response
    {
        $task = TaskPost::with('owner:id,name')->withCount('applications')->findOrFail($id);

        $isOwner = $request->user() && (string) $task->created_by === (string) $request->user()->id;

        $myApplication = $request->user()
            ? TaskApplication::where('task_post_id', $id)->where('user_id', $request->user()->id)->first()
            : null;

        $applications = null;
        if ($isOwner) {
            $applications = TaskApplication::with('worker:id,name')->where('task_post_id', $id)
                ->orderByDesc('created_at')->get();
        }

        return Inertia::render('tasks/Show', [
            'task' => $task,
            'isOwner' => (bool) $isOwner,
            'myApplication' => $myApplication,
            'applications' => $applications,
        ]);
    }

    public function myApplications(Request $request): Response
    {
        $applications = TaskApplication::with('task')
            ->where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->paginate(15);

        return Inertia::render('tasks/MyApplications', [
            'applications' => $applications,
        ]);
    }
}
