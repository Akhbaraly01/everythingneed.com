<?php

namespace Modules\Learn\Entities;

use App\Models\Model;

class LearnPlaylist extends Model
{
    public const KIND_CUSTOM = 'custom';
    public const KIND_WATCH_LATER = 'watch_later';

    protected $fillable = ['user_id', 'name', 'kind'];

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class, 'user_id');
    }

    public function items()
    {
        return $this->hasMany(LearnPlaylistItem::class, 'playlist_id')->orderBy('position');
    }
}
