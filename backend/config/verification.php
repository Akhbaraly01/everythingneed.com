<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Verification Mail Switch
    |--------------------------------------------------------------------------
    |
    | When false, the app skips sending verification / password-reset mail
    | (email verification notifications and reset mails) so local login and
    | testing stay fast. New web registrations are auto-verified while the
    | switch is off, and API reset tokens remain available in non-production
    | JSON responses. Set MAIL_ENABLED=true to restore real mail delivery.
    |
    */

    'mail_enabled' => env('MAIL_ENABLED', true),

];
