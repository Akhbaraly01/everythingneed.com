<?php

use Illuminate\Support\Facades\Route;
use Modules\Search\Http\Controllers\ImageSearchController;
use Modules\Search\Http\Controllers\SearchController;

Route::prefix('api')->group(function () {
    Route::get('/search', [SearchController::class, 'index']);
    // Search by photo: the image is described (AI vision) and the
    // description drives the same product search.
    Route::post('/search/image', [ImageSearchController::class, 'store'])
        ->middleware('throttle:10,1');
});
