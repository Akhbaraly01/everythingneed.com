<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Emergency & support information (spec 21)
    |--------------------------------------------------------------------------
    | Editable directory data rendered on the healthcare hub and the
    | health-services page. Numbers are looked up by country code with a
    | generic fallback - never hard-coded into page components.
    */
    'emergency_numbers' => [
        'NG' => [
            ['label' => 'National Emergency Number', 'number' => '112'],
            ['label' => 'Lagos Emergency (767/112)', 'number' => '767'],
        ],
        'GH' => [
            ['label' => 'National Emergency', 'number' => '112'],
            ['label' => 'Police', 'number' => '191'],
            ['label' => 'Fire Service', 'number' => '192'],
            ['label' => 'Ambulance', 'number' => '193'],
        ],
        'KE' => [
            ['label' => 'National Emergency', 'number' => '999'],
            ['label' => 'St John Ambulance', 'number' => '0721225285'],
        ],
        'DEFAULT' => [
            ['label' => 'International Emergency', 'number' => '112'],
        ],
    ],

    'support_blurb' => 'For urgent medical help, call your local emergency number first. For platform issues with a booking, open a support ticket and include your ticket number.',
];
