<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Guest extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'is_attending' => 'boolean',
            'has_entered' => 'boolean',
            'checked_in_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Guest $guest) {
            if (empty($guest->checkin_code)) {
                $guest->checkin_code = static::generateUniqueCheckinCode();
            }
        });
    }

    public static function generateUniqueCheckinCode(): string
    {
        $chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
        do {
            $code = 'AJ-' . substr(str_shuffle(str_repeat($chars, 5)), 0, 5);
        } while (static::where('checkin_code', $code)->exists());

        return $code;
    }

    public function invitation(): BelongsTo
    {
        return $this->belongsTo(Invitation::class);
    }

    public function table(): BelongsTo
    {
        return $this->belongsTo(WeddingTable::class, 'table_id');
    }
}
