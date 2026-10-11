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
        // Source of truth is the per-user settings store (the settings
        // form writes general.*/notifications.* keys there). user_metadata
        // never carried these values, so reading it always fell back to
        // defaults and saved preferences never reloaded.
        $stored = \Modules\Settings\Entities\UserSetting::where('user_id', $user->id)
            ->whereIn('key', [
                'general.language', 'general.currency',
                'notifications.email_notifications', 'notifications.push_notifications',
                'notifications.marketing_emails',
            ])
            ->pluck('value', 'key');

        return Inertia::render('settings/Index', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
            ],
            'settings' => [
                'language' => $stored['general.language'] ?? 'en',
                'currency' => $stored['general.currency'] ?? \Core\Support\Currencies::default(),
                'email_notifications' => ($stored['notifications.email_notifications'] ?? '1') === '1',
                'push_notifications' => ($stored['notifications.push_notifications'] ?? '1') === '1',
                'marketing_emails' => ($stored['notifications.marketing_emails'] ?? '0') === '1',
            ],
        ]);
    }
}
