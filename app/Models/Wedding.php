<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Wedding extends Model
{
    protected $guarded = [];

    protected $appends = ['music_url', 'gift_registries_list', 'timeline_list', 'venue_elements_list'];

    public function getVenueElementsListAttribute(): array
    {
        if (!empty($this->venue_elements) && is_array($this->venue_elements) && count($this->venue_elements) > 0) {
            return $this->venue_elements;
        }

        return [
            [
                'id' => 'stage-1',
                'type' => 'stage',
                'title' => 'ESCENARIO & GRUPO MUSICAL',
                'subtitle' => 'Zona de Sonido e Iluminación',
                'x' => 450,
                'y' => 30,
                'width' => 380,
                'height' => 75,
                'shape' => 'rectangle',
            ],
            [
                'id' => 'dancefloor-1',
                'type' => 'dancefloor',
                'title' => 'PISTA DE BAILE',
                'subtitle' => 'A & J',
                'x' => 470,
                'y' => 160,
                'width' => 340,
                'height' => 220,
                'shape' => 'rectangle',
            ],
            [
                'id' => 'bar-1',
                'type' => 'bar',
                'title' => 'BARRA LIBRE',
                'subtitle' => 'Mixología & Cócteles',
                'x' => 960,
                'y' => 160,
                'width' => 170,
                'height' => 180,
                'shape' => 'rectangle',
            ],
            [
                'id' => 'entrance-1',
                'type' => 'entrance',
                'title' => 'ACCESO PRINCIPAL',
                'subtitle' => 'Entrada de Invitados',
                'x' => 490,
                'y' => 880,
                'width' => 300,
                'height' => 50,
                'shape' => 'pill',
            ],
        ];
    }

    public function getTimelineListAttribute(): array
    {
        if (!empty($this->timeline) && is_array($this->timeline) && count($this->timeline) > 0) {
            return $this->timeline;
        }

        return [
            [
                'time' => '3:00 PM',
                'title' => 'MISA',
                'description' => 'Ceremonia religiosa',
                'icon_url' => '/resources_canvas/images/5.svg',
            ],
            [
                'time' => '4:30 PM',
                'title' => 'ROMPEHIELOS',
                'description' => 'Cóctel de bienvenida',
                'icon_url' => '/resources_canvas/images/6.svg',
            ],
            [
                'time' => '5:30 PM',
                'title' => 'BRINDIS',
                'description' => 'Brindis con los novios',
                'icon_url' => '/resources_canvas/images/7.svg',
            ],
            [
                'time' => '6:00 PM',
                'title' => 'CENA',
                'description' => 'Banquete de gala',
                'icon_url' => '/resources_canvas/images/8.svg',
            ],
            [
                'time' => '7:00 PM',
                'title' => 'FIESTA',
                'description' => 'Música y baile',
                'icon_url' => '/resources_canvas/images/9.svg',
            ],
            [
                'time' => '10:30 PM',
                'title' => 'CLAUSURA',
                'description' => 'Fin de la celebración',
                'icon_url' => '/resources_canvas/images/10.svg',
            ],
        ];
    }

    public function getMusicUrlAttribute(): ?string
    {
        $path = $this->background_audio_path ?? $this->background_music_path;
        if ($path) {
            return str_starts_with($path, 'http') ? $path : \Illuminate\Support\Facades\Storage::url($path);
        }
        return null;
    }

    public function getGiftRegistriesListAttribute(): array
    {
        if (!empty($this->gift_registries) && is_array($this->gift_registries)) {
            $filtered = [];
            foreach ($this->gift_registries as $item) {
                if (!empty($item['url'])) {
                    $filtered[] = [
                        'name' => !empty($item['name']) ? $item['name'] : (!empty($item['title']) ? $item['title'] : 'MESA DE REGALOS'),
                        'url' => $item['url'],
                    ];
                }
            }
            if (!empty($filtered)) {
                return $filtered;
            }
        }

        $list = [];
        if (!empty($this->gift_registry_url)) {
            $list[] = [
                'name' => $this->gift_registry_button_text ?: 'LIVERPOOL',
                'url' => $this->gift_registry_url,
            ];
        }
        if (!empty($this->gift_registry_url_2)) {
            $list[] = [
                'name' => $this->gift_registry_button_text_2 ?: 'AMAZON',
                'url' => $this->gift_registry_url_2,
            ];
        }
        return $list;
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
            'gift_registries' => 'array',
            'venue_elements' => 'array',
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
