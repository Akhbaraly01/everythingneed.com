<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

foreach (Illuminate\Support\Facades\DB::table('users')->where('email', 'like', 'delete-probe-%')->orderBy('created_at')->get(['id', 'email', 'deleted_at']) as $u) {
    echo $u->id . ' | ' . $u->email . ' | ' . ($u->deleted_at ?? 'active') . PHP_EOL;
}
