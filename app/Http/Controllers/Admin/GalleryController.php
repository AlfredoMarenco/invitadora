<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Wedding;
use App\Models\GalleryImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Support\ImageOptimizer;

class GalleryController extends Controller
{
    public function index()
    {
        $wedding = Wedding::with(['galleryImages' => function($q) {
            $q->orderBy('order');
        }])->firstOrFail();
        
        return \Inertia\Inertia::render('Admin/GalleryManager', [
            'wedding' => $wedding,
            'images' => $wedding->galleryImages
        ]);
    }

    public function store(Request $request)
    {
        $wedding = Wedding::firstOrFail();

        $request->validate([
            'images' => 'required|array|min:1',
            'images.*' => 'file|mimes:jpeg,png,jpg,webp,gif,avif,heic,heif|max:25600', // Hasta 100MB por imagen (sin restricción práctica de tamaño)
        ], [
            'images.required' => 'Debes seleccionar al menos una fotografía.',
            'images.*.mimes' => 'El formato debe ser una imagen válida (JPG, JPEG, PNG, WEBP, GIF, HEIC).',
        ]);

        $maxOrder = $wedding->galleryImages()->max('order') ?? -1;

        foreach ($request->file('images') as $file) {
            [$imageUrl, $thumbUrl] = self::compressAndStoreImage($file);
            $maxOrder++;
            
            $wedding->galleryImages()->create([
                'image_path' => $imageUrl,
                'thumb_path' => $thumbUrl,
                'order' => $maxOrder,
            ]);
        }

        return back()->with('success', 'Fotografías subidas y optimizadas correctamente.');
    }

    public function destroy(Request $request, GalleryImage $gallery)
    {
        $wedding = Wedding::firstOrFail();
        if ($gallery->wedding_id !== $wedding->id) {
            abort(403);
        }

        $path = str_replace('/storage/', '', $gallery->image_path);
        Storage::disk('public')->delete($path);
        if ($gallery->thumb_path) {
            Storage::disk('public')->delete(str_replace('/storage/', '', $gallery->thumb_path));
        }
        $gallery->delete();

        return back()->with('success', 'Fotografía eliminada correctamente.');
    }

    public function reorder(Request $request)
    {
        $request->validate([
            'orders' => 'required|array',
            'orders.*.id' => 'required|exists:gallery_images,id',
            'orders.*.order' => 'required|integer',
        ]);

        foreach ($request->orders as $item) {
            GalleryImage::where('id', $item['id'])->update(['order' => $item['order']]);
        }

        return back();
    }

    /**
     * Genera versi?n completa (1600px, WebP q72) y miniatura (700px, WebP q68).
     * Devuelve [url_full, url_thumb|null].
     */
    public static function compressAndStoreImage($file): array
    {
        $src = $file->getRealPath();
        $name = Str::random(24);

        $full = ImageOptimizer::store($src, 'gallery', 1600, 72, $name);
        if ($full) {
            return [$full, ImageOptimizer::store($src, 'gallery/thumbs', 700, 68, $name)];
        }

        // Fallback si GD no puede procesar el formato (p. ej. HEIC)
        return [Storage::url($file->store('gallery', 'public')), null];
    }
}
