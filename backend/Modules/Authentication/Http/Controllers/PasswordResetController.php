<?php

namespace Modules\Authentication\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Modules\Authentication\Http\Requests\ChangePasswordRequest;
use Modules\Authentication\Http\Requests\ForgotPasswordLinkRequest;
use Modules\Authentication\Http\Requests\ResetPasswordTokenRequest;
use Modules\Authentication\Mail\ResetPasswordMail;
use App\Models\User;

class PasswordResetController extends Controller
{
    /**
     * Always responds 200 (no account enumeration). The reset token is
     * emailed via the configured mailer; it is additionally returned in
     * non-production environments so local tooling can complete the flow.
     */
    public function forgot(ForgotPasswordLinkRequest $request): JsonResponse
    {
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

        // Paused for local testing (MAIL_ENABLED=false): skip the blocking
        // mail send; the token below (non-production) still completes the flow.
        if (config('verification.mail_enabled', true)) {
            \Illuminate\Support\Facades\Mail::to($user->email)->send(
                new ResetPasswordMail($plainToken, $user->name),
            );
        }

        $response = ['message' => 'If that email exists, a reset link has been sent.'];

        // Only expose the plain token in local/testing — never staging/prod.
        if (app()->environment(['local', 'testing'])) {
            $response['token'] = $plainToken;
            $response['dev_note'] = 'Token returned in local development only.';
        }

        return response()->json($response);
    }

    public function confirm(ResetPasswordTokenRequest $request): JsonResponse
    {
        $validated = $request->validated();

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
            $user->forceFill([
                'password' => Hash::make($validated['newPassword']),
                'remember_token' => Str::random(60),
            ])->save();
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
    public function change(ChangePasswordRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $user = $request->user();

        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'message' => 'Current password is incorrect.',
                'errors' => ['current_password' => ['The current password is incorrect.']],
            ], 422);
        }

        DB::transaction(function () use ($request, $user, $validated) {
            $user->forceFill([
                'password' => Hash::make($validated['password']),
                'remember_token' => Str::random(60),
            ])->save();

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
