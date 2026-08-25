<?php

namespace Modules\Authentication\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Modules\Authentication\Mail\ResetPasswordMail;
use App\Models\User;

class PasswordResetController extends Controller
{
    /**
     * Always responds 200 (no account enumeration). The reset token is
     * emailed via the configured mailer; it is additionally returned in
     * non-production environments so local tooling can complete the flow.
     */
    public function forgot(Request $request): JsonResponse
    {
        $request->validate(['email' => ['required', 'email']]);

        $user = User::where('email', $request->input('email'))->first();

        if (!$user) {
            return response()->json(['message' => 'If that email exists, a reset link has been sent.']);
        }

        // Suspended accounts cannot reset their way back in.
        if ($user->suspended_at) {
            return response()->json(['message' => 'If that email exists, a reset link has been sent.']);
        }

        $plainToken = Str::random(64);

        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $user->email],
            [
                'token' => Hash::make($plainToken),
                'created_at' => now(),
            ],
        );

        \Illuminate\Support\Facades\Mail::to($user->email)->send(
            new ResetPasswordMail($plainToken, $user->name),
        );

        $response = ['message' => 'If that email exists, a reset link has been sent.'];

        if (app()->environment() !== 'production') {
            $response['token'] = $plainToken;
            $response['dev_note'] = 'Token returned outside production for local development.';
        }

        return response()->json($response);
    }

    public function confirm(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => ['required', 'string'],
            'newPassword' => ['required', 'string', 'min:8'],
        ]);

        $record = DB::table('password_reset_tokens')
            ->where('created_at', '>=', now()->subHour())
            ->get();

        $match = collect($record)->first(function ($row) use ($validated) {
            return Hash::check($validated['token'], $row->token)
                && now()->diffInMinutes(\Carbon\Carbon::parse($row->created_at)) <= 60;
        });

        if (!$match) {
            return response()->json([
                'message' => 'This reset link is invalid or has expired.',
                'errors' => ['token' => ['Invalid or expired reset token.']],
            ], 422);
        }

        $user = User::where('email', $match->email)->first();

        if (!$user) {
            return response()->json(['message' => 'Account not found.'], 404);
        }

        DB::transaction(function () use ($user, $validated, $match) {
            $user->forceFill(['password' => Hash::make($validated['newPassword'])])->save();
            DB::table('password_reset_tokens')->where('email', $match->email)->delete();
            // Invalidate existing API sessions after a credential change.
            $user->tokens()->delete();
        });

        return response()->json(['message' => 'Password updated. You can now sign in with your new password.']);
    }

    /**
     * Authenticated password change: verifies the current password first,
     * then rotates it and revokes all existing API sessions.
     */
    public function change(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'different:current_password'],
        ]);

        $user = $request->user();

        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'message' => 'Current password is incorrect.',
                'errors' => ['current_password' => ['The current password is incorrect.']],
            ], 422);
        }

        DB::transaction(function () use ($request, $user, $validated) {
            $user->forceFill(['password' => Hash::make($validated['password'])])->save();

            // Keep the current session's token; revoke every other device.
            // (Transient tokens in tests have no DB id — fall back to full revoke.)
            $currentId = $request->user()->currentAccessToken()?->id;

            if ($currentId) {
                $user->tokens()->where('id', '!=', $currentId)->delete();
            } else {
                $user->tokens()->delete();
            }
        });

        return response()->json(['message' => 'Password changed successfully.']);
    }
}
