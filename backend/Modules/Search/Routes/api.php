<?php

namespace Modules\Search\Routes;

use Illuminate\Support\Facades\Route;
use Modules\Search\Http\Controllers\SearchController;

Route::prefix('api')->group(function () {
    Route::get('/search', [SearchController::class, 'index']);
});
