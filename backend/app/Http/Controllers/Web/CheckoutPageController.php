<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CheckoutPageController extends Controller
{
    /**
     * Real gateway drivers vs. the in-process development driver. The UI uses
     * this to describe the payment step truthfully (spec: no false success).
     * Only the mode name is exposed - never credentials.
     */
    private function paymentMode(): string
    {
        $driver = strtolower((string) config('payments.driver', 'mock'));

        return in_array($driver, ['stripe', 'paypal', 'paystack'], true) ? 'live' : 'sandbox';
    }

    public function index(): Response
    {
        return Inertia::render('orders/Checkout', [
            'paymentMode' => $this->paymentMode(),
        ]);
    }
}
