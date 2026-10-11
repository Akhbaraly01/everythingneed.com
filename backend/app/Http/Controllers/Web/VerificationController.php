<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Providers\RouteServiceProvider;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class VerificationController extends Controller
{
    /**
     * Send a fresh verification notification (throttled).
     */
    public function send(Request $request): RedirectResponse
    {
        if ($request->user()->hasVerifiedEmail()) {
            return redirect()->intended('/dashboard?verified=1');
        }

        // Paused for local testing (MAIL_ENABLED=false): verify instantly
        // instead of sending mail. Flip MAIL_ENABLED=true to restore delivery.
        if (!config('verification.mail_enabled', true)) {
            $request->user()->markEmailAsVerified();

            return redirect()->intended('/dashboard?verified=1');
        }

        $request->user()->sendEmailVerificationNotification();

        return back()->with('status', 'verification-link-sent');
    }

    /**
     * Mark the authenticated user's email as verified via signed URL.
     */
    public function verify(Request $request): RedirectResponse
    {
        if (!$request->user()->hasVerifiedEmail()) {
            $request->user()->markEmailAsVerified();
        }

        return redirect()->intended('/dashboard?verified=1');
    }
}
