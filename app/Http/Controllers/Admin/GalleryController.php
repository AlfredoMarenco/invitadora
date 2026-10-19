<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Wedding;
use App\Models\GalleryImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

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
            'images.*' => 'file|mimes:jpeg,png,jpg,webp,gif,avif,heic,heif|max:102400', // Hasta 100MB por imagen (sin restricción práctica de tamaño)
        ], [
            'images.required' => 'Debes seleccionar al menos una fotografía.',
            'images.*.mimes' => 'El formato debe ser una imagen válida (JPG, JPEG, PNG, WEBP, GIF, HEIC).',
        ]);

        $maxOrder = $wedding->galleryImages()->max('order') ?? -1;

        foreach ($request->file('images') as $file) {
            $imageUrl = $this->compressAndStoreImage($file);
            $maxOrder++;
            
            $wedding->galleryImages()->create([
                'image_path' => $imageUrl,
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
     * Comprime y optimiza la imagen a formato WebP o JPEG usando GD,
     * corrigiendo orientación EXIF y redimensionando a un máximo de 1920px.
     */
    private function compressAndStoreImage($file): string
    {
        $extension = strtolower($file->getClientOriginalExtension());
        $mime = $file->getMimeType();
        $sourcePath = $file->getRealPath();

        if (extension_loaded('gd') && function_exists('imagewebp')) {
            $srcImage = null;

            if (in_array($extension, ['jpg', 'jpeg']) || str_contains($mime, 'jpeg')) {
                $srcImage = @imagecreatefromjpeg($sourcePath);

                // Corregir rotación EXIF para fotos tomadas con celular
                if ($srcImage && function_exists('exif_read_data')) {
                    $exif = @exif_read_data($sourcePath);
                    if (!empty($exif['Orientation'])) {
                        switch ($exif['Orientation']) {
                            case 3:
                                $srcImage = imagerotate($srcImage, 180, 0);
                                break;
                            case 6:
                                $srcImage = imagerotate($srcImage, -90, 0);
                                break;
                            case 8:
                                $srcImage = imagerotate($srcImage, 90, 0);
                                break;
                        }
                    }
                }
            } elseif ($extension === 'png' || str_contains($mime, 'png')) {
                $srcImage = @imagecreatefrompng($sourcePath);
            } elseif ($extension === 'webp' || str_contains($mime, 'webp')) {
                $srcImage = @imagecreatefromwebp($sourcePath);
            } elseif ($extension === 'gif' || str_contains($mime, 'gif')) {
                $srcImage = @imagecreatefromgif($sourcePath);
            }

            if ($srcImage) {
                $origWidth = imagesx($srcImage);
                $origHeight = imagesy($srcImage);

                // Redimensionar si supera 1920px (Full HD) manteniendo proporción
                $maxDim = 1920;
                $newWidth = $origWidth;
                $newHeight = $origHeight;

                if ($origWidth > $maxDim || $origHeight > $maxDim) {
                    if ($origWidth >= $origHeight) {
                        $newWidth = $maxDim;
                        $newHeight = (int) round(($origHeight / $origWidth) * $maxDim);
                    } else {
                        $newHeight = $maxDim;
                        $newWidth = (int) round(($origWidth / $origHeight) * $maxDim);
                    }
                }

                $dstImage = imagecreatetruecolor($newWidth, $newHeight);
                imagealphablending($dstImage, false);
                imagesavealpha($dstImage, true);

                imagecopyresampled($dstImage, $srcImage, 0, 0, 0, 0, $newWidth, $newHeight, $origWidth, $origHeight);

                // Comprimir en WebP calidad 82 (ahorro ~90% de almacenamiento con fidelidad visual alta)
                $filename = 'gallery/' . Str::random(24) . '.webp';
                $tempPath = tempnam(sys_get_temp_dir(), 'webp_');
                imagewebp($dstImage, $tempPath, 82);

                imagedestroy($srcImage);
                imagedestroy($dstImage);

                Storage::disk('public')->put($filename, file_get_contents($tempPath));
                @unlink($tempPath);

                return Storage::url($filename);
            }
        }

        // Fallback en caso de que GD no pueda procesar el formato
        $path = $file->store('gallery', 'public');
        return Storage::url($path);
    }
}
