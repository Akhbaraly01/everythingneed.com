<?php

namespace Modules\Admin\Http\Controllers;

use App\Http\Controllers\Controller;
use Core\Services\Contracts\SettingsQueryInterface;
use Core\Services\Contracts\UiTextServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Admin\Http\Requests\AdminToggleFeatureFlagRequest;
use Modules\Admin\Http\Requests\AdminUpdateSettingsRequest;

/**
 * AdminSettingsController
 *
 * Manages system-wide settings and feature flags stored in the database.
 * All routes require auth:sanctum + manageSettings gate (super_admin and
 * administrator — both hold settings.* in the role matrix).
 */
class AdminSettingsController extends Controller
{
    public function __construct(
        private SettingsQueryInterface $settings,
        private UiTextServiceInterface $uiTexts,
    ) {}

    /**
     * Returns all system settings.
     *
     * GET /api/admin/settings
     */
    public function index(): JsonResponse
    {
        return response()->json(['data' => $this->settings->all()]);
    }

    /**
     * Editable system text for the Settings -> UI Text editor:
     * key, label and current value (stored `ui.*` rows override defaults).
     *
     * GET /api/admin/ui-texts
     */
    public function uiTexts(): JsonResponse
    {
        return response()->json(['data' => $this->uiTexts->all()]);
    }

    /**
     * Updates one or more system settings.
     *
     * PUT /api/admin/settings
     */
    public function update(AdminUpdateSettingsRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $this->settings->updateMany($validated['settings'], auth()->id());

        return response()->json(['message' => 'Settings updated successfully']);
    }

    /**
     * Removes one system setting (keys are immutable — delete is the
     * rename path, and it really deletes: no resurrect-on-reload).
     *
     * DELETE /api/admin/settings/{key}
     */
    public function destroy(string $key): JsonResponse
    {
        $result = $this->settings->delete($key, auth()->id());

        if ($result === 'missing') {
            return response()->json(['message' => 'Setting not found'], 404);
        }

        return response()->json(['message' => 'Setting deleted']);
    }

    /**
     * Returns all feature flags.
     *
     * GET /api/admin/feature-flags
     */
    public function featureFlags(): JsonResponse
    {
        return response()->json(['data' => $this->settings->featureFlags()]);
    }

    /**
     * Toggles a single feature flag (unknown keys answer 404 — flags are
     * seeded, never invented by the toggle).
     *
     * PUT /api/admin/feature-flags/{key}
     */
    public function toggleFlag(AdminToggleFeatureFlagRequest $request, string $key): JsonResponse
    {
        $validated = $request->validated();

        $state = $this->settings->toggleFlag($key, (bool) $validated['enabled'], auth()->id());

        if ($state === 'missing') {
            return response()->json(['message' => 'Feature flag not found'], 404);
        }

        return response()->json(['message' => "Feature flag '{$key}' {$state}"]);
    }
}
