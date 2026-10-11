<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Marketplace tax (spec §33)
    |--------------------------------------------------------------------------
    |
    | Server-computed tax applied to cart and order totals. The rate is a
    | percentage; 0 keeps totals merchandise-only (no configured tax), and the
    | jurisdiction key selects a TaxService rate when set explicitly.
    |
    */

    'tax' => [
        'rate' => (float) env('COMMERCE_TAX_RATE', 0),
        'jurisdiction' => env('COMMERCE_TAX_JURISDICTION'),
    ],

];
