<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Wedding;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class WeddingController extends Controller
{
    public function edit()
    {
        $wedding = Wedding::firstOrFail();
        return Inertia::render('Admin/WeddingForm', [
            'wedding' => $wedding
        ]);
    }

    public function update(Request $request)
    {

        $wedding = Wedding::firstOrFail();
        $validated = $request->validate([
            'bride_name' => 'required|string',
            'groom_name' => 'required|string',
            'wedding_date' => 'required|date',
            'bride_parents' => 'nullable|array',
            'groom_parents' => 'nullable|array',
            'bride_godparents' => 'nullable|array',
            'groom_godparents' => 'nullable|array',
            'locations' => 'nullable|array',
            'timeline' => 'nullable|array',
            'timeline.*.time' => 'required_with:timeline|string',
            'timeline.*.title' => 'required_with:timeline|string',
            'timeline.*.description' => 'nullable|string',
            'timeline.*.icon_url' => 'nullable|string',
            'gift_registry_url' => 'nullable|string',
            'gift_registry_button_text' => 'nullable|string|max:100',
            'gift_registry_url_2' => 'nullable|string',
            'gift_registry_button_text_2' => 'nullable|string|max:100',
            'gift_registries' => 'nullable|array',
            'bank_transfer_info' => 'nullable|string',
            'dress_code' => 'nullable|string',
            'rsvp_deadline' => 'nullable|date',
            'rsvp_notification_email' => 'nullable|string|max:500',
            'notify_on_rsvp' => 'nullable|boolean',
            'song_title' => 'nullable|string|max:255',
            'song_artist' => 'nullable|string|max:255',
            'background_audio' => 'nullable|file|mimes:mp3,wav,m4a,aac,ogg|max:51200', // max 50mb
            'delete_audio' => 'nullable|boolean',
        ]);

        $normalizeUrl = function (?string $url) {
            if (!$url) return null;
            $url = trim($url);
            if ($url === '') return null;
            if (!str_starts_with($url, 'http://') && !str_starts_with($url, 'https://')) {
                return 'https://' . $url;
            }
            return $url;
        };

        if (isset($validated['gift_registry_url'])) {
            $validated['gift_registry_url'] = $normalizeUrl($validated['gift_registry_url']);
        }
        if (isset($validated['gift_registry_url_2'])) {
            $validated['gift_registry_url_2'] = $normalizeUrl($validated['gift_registry_url_2']);
        }
        if (isset($validated['gift_registries']) && is_array($validated['gift_registries'])) {
            $cleaned = [];
            foreach ($validated['gift_registries'] as $item) {
                if (!empty($item['url'])) {
                    $cleaned[] = [
                        'name' => trim(!empty($item['name']) ? $item['name'] : (!empty($item['title']) ? $item['title'] : 'MESA DE REGALOS')),
                        'url' => $normalizeUrl($item['url']),
                    ];
                }
            }
            $validated['gift_registries'] = $cleaned;
        }

        if (!empty($request->delete_audio)) {
            if ($wedding->background_audio_path) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($wedding->background_audio_path);
            }
            $validated['background_audio_path'] = null;
            $validated['background_music_path'] = null;
        } elseif ($request->hasFile('background_audio')) {
            if ($wedding->background_audio_path) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($wedding->background_audio_path);
            }
            $path = $request->file('background_audio')->store('audio', 'public');
            $validated['background_audio_path'] = $path;
            $validated['background_music_path'] = $path;
        }

        unset($validated['background_audio']);
        unset($validated['delete_audio']);
        
        $wedding->update($validated);
        return redirect()->back()->with('success', 'Configuración de la boda actualizada exitosamente.');
    }

    public function uploadTimelineIcon(Request $request)
    {
        $request->validate([
            'icon' => 'required|file|mimes:svg,png,jpg,jpeg,webp|max:5120',
        ]);

        $path = $request->file('icon')->store('timeline_icons', 'public');
        $url = \Illuminate\Support\Facades\Storage::url($path);

        return response()->json([
            'success' => true,
            'url' => $url,
        ]);
    }
}
