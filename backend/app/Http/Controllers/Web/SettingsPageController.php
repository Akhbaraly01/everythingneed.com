<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SettingsPageController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('settings/Index', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
            ],
            'settings' => [
                'language' => $user->user_metadata['language'] ?? 'en',
                'currency' => $user->user_metadata['currency'] ?? 'USD',
                'email_notifications' => $user->user_metadata['email_notifications'] ?? true,
                'push_notifications' => $user->user_metadata['push_notifications'] ?? true,
                'marketing_emails' => $user->user_metadata['marketing_emails'] ?? false,
            ],
        ]);
    }
}
