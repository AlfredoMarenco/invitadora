<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Invitation extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            // Serializa como "Y-m-d" para que los inputs type="date" del panel lo lean directo
            'rsvp_deadline' => 'date:Y-m-d',
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

    /**
     * Fecha límite efectiva: la especial de la invitación o, si no tiene, la general de la boda.
     */
    public function effectiveRsvpDeadline(): ?CarbonInterface
    {
        return $this->rsvp_deadline ?? $this->wedding?->rsvp_deadline;
    }

    /**
     * La confirmación se permite durante TODO el día límite (hora de la app)
     * y se cierra a partir de las 00:00 del día siguiente.
     */
    public function isRsvpClosed(): bool
    {
        $deadline = $this->effectiveRsvpDeadline();

        return $deadline !== null && now()->startOfDay()->gt($deadline->copy()->startOfDay());
    }

    /**
     * Datos de fecha límite para exponer a las vistas públicas.
     *
     * @return array{deadline: ?string, closed: bool}
     */
    public function rsvpWindow(): array
    {
        return [
            'deadline' => $this->effectiveRsvpDeadline()?->format('Y-m-d'),
            'closed' => $this->isRsvpClosed(),
        ];
    }
}
