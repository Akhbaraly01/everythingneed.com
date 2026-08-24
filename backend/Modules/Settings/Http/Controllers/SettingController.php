<?php

namespace Modules\Settings\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Settings\Entities\UserSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $settings = UserSetting::where('user_id', $request->user()->id)->get();

        return response()->json([
            'data' => $settings->pluck('value', 'key'),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'settings' => 'required|array',
            'settings.*.key' => 'required|string|max:100',
            'settings.*.value' => 'required|string|max:1000',
        ]);

        foreach ($validated['settings'] as $setting) {
            UserSetting::updateOrCreate(
                ['user_id' => $request->user()->id, 'key' => $setting['key']],
                ['value' => $setting['value']]
            );
        }

        return response()->json([
            'message' => 'Settings updated successfully',
        ]);
    }

    public function show(Request $request, string $key): JsonResponse
    {
        $setting = UserSetting::where('user_id', $request->user()->id)
            ->where('key', $key)
            ->first();

        return response()->json([
            'data' => [
                'key' => $key,
                'value' => $setting?->value,
            ],
        ]);
    }

    public function destroy(Request $request, string $key): JsonResponse
    {
        UserSetting::where('user_id', $request->user()->id)
            ->where('key', $key)
            ->delete();

        return response()->json([
            'message' => 'Setting deleted successfully',
        ]);
    }

    public function publicIndex(): JsonResponse
    {
        $flags = \Modules\Settings\Entities\FeatureFlag::where('is_enabled', true)
            ->get(['key', 'name', 'default_value']);

        return response()->json([
            'data' => $flags->mapWithKeys(fn ($f) => [
                $f->key => ['enabled' => true, 'default' => $f->default_value],
            ]),
        ]);
    }

    private function resolveTargetUserId(Request $request, string $userId): ?array
    {
        if ($userId !== $request->user()->id
            && !$request->user()->hasRole('super_admin')
            && !$request->user()->hasRole('administrator')) {
            return null;
        }

        return ['user_id' => $userId];
    }

    public function indexForUser(Request $request, string $userId): JsonResponse
    {
        if (!$this->resolveTargetUserId($request, $userId)) {
            return response()->json(['message' => 'You may only view your own settings'], 403);
        }

        $settings = UserSetting::where('user_id', $userId)->get();

        return response()->json([
            'data' => $settings->pluck('value', 'key'),
        ]);
    }

    public function showForUser(Request $request, string $userId, string $key): JsonResponse
    {
        if (!$this->resolveTargetUserId($request, $userId)) {
            return response()->json(['message' => 'You may only view your own settings'], 403);
        }

        $setting = UserSetting::where('user_id', $userId)->where('key', $key)->first();

        return response()->json([
            'data' => ['key' => $key, 'value' => $setting?->value],
        ]);
    }

    public function updateForUser(Request $request, string $userId): JsonResponse
    {
        if (!$this->resolveTargetUserId($request, $userId)) {
            return response()->json(['message' => 'You may only update your own settings'], 403);
        }

        $validated = $request->validate([
            'settings' => 'required|array',
            'settings.*.key' => 'required|string|max:100',
            'settings.*.value' => 'required|string|max:1000',
        ]);

        foreach ($validated['settings'] as $setting) {
            UserSetting::updateOrCreate(
                ['user_id' => $userId, 'key' => $setting['key']],
                ['value' => $setting['value']]
            );
        }

        return response()->json(['message' => 'Settings updated successfully']);
    }

    public function destroyForUser(Request $request, string $userId, string $key): JsonResponse
    {
        if (!$this->resolveTargetUserId($request, $userId)) {
            return response()->json(['message' => 'You may only delete your own settings'], 403);
        }

        UserSetting::where('user_id', $userId)->where('key', $key)->delete();

        return response()->json(['message' => 'Setting deleted successfully']);
    }
}
