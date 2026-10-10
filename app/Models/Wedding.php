<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Wedding extends Model
{
    protected $guarded = [];

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
}
