<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Wedding extends Model
{
    protected $guarded = [];

    protected $appends = ['music_url'];

    public function getMusicUrlAttribute(): ?string
    {
        $path = $this->background_audio_path ?? $this->background_music_path;
        if ($path) {
            return str_starts_with($path, 'http') ? $path : \Illuminate\Support\Facades\Storage::url($path);
        }
        return null;
    }

    protected function casts(): array
    {
        return [
            'bride_parents' => 'array',
            'groom_parents' => 'array',
            'bride_godparents' => 'array',
            'groom_godparents' => 'array',
            'locations' => 'array',
            'timeline' => 'array',
            'wedding_date' => 'datetime',
            'rsvp_deadline' => 'date',
        ];
    }

    public function galleryImages(): HasMany
    {
        return $this->hasMany(GalleryImage::class)->orderBy('order');
    }

    public function invitations(): HasMany
    {
        return $this->hasMany(Invitation::class);
    }

    public function hotels(): HasMany
    {
        return $this->hasMany(Hotel::class)->orderBy('order');
    }

    public function tables(): HasMany
    {
        return $this->hasMany(WeddingTable::class)->orderBy('name');
    }
}
