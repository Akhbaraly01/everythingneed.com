<?php

namespace Modules\Learn\Entities;

use App\Models\Model;

class LearnPlaylistItem extends Model
{
    protected $fillable = ['playlist_id', 'post_id', 'position'];

    protected $casts = ['position' => 'integer'];

    public function playlist()
    {
        return $this->belongsTo(LearnPlaylist::class, 'playlist_id');
    }

    public function post()
    {
        return $this->belongsTo(LearnPost::class, 'post_id');
    }
}
