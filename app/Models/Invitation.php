<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Invitation extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'rsvp_deadline' => 'date',
        ];
    }

    public function wedding(): BelongsTo
    {
        return $this->belongsTo(Wedding::class);
    }

    public function guests(): HasMany
    {
        return $this->hasMany(Guest::class);
    }
}
