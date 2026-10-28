<?php

namespace App\Support;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImageOptimizer
{
    /**
     * Redimensiona (lado mayor = $maxDim) y convierte a WebP. Devuelve el binario o null si GD no puede procesarlo.
     */
    public static function toWebp(string $sourcePath, int $maxDim, int $quality): ?string
    {
        if (!extension_loaded('gd') || !function_exists('imagewebp')) {
            return null;
        }

        $info = @getimagesize($sourcePath);
        if (!$info) {
            return null;
        }

        $src = match ($info[2]) {
            IMAGETYPE_JPEG => @imagecreatefromjpeg($sourcePath),
            IMAGETYPE_PNG => @imagecreatefrompng($sourcePath),
            IMAGETYPE_WEBP => @imagecreatefromwebp($sourcePath),
            IMAGETYPE_GIF => @imagecreatefromgif($sourcePath),
            default => false,
        };
        if (!$src) {
            return null;
        }

        if ($info[2] === IMAGETYPE_JPEG && function_exists('exif_read_data')) {
            $exif = @exif_read_data($sourcePath);
            $angle = match ($exif['Orientation'] ?? 1) {
                3 => 180,
                6 => -90,
                8 => 90,
                default => 0,
            };
            if ($angle) {
                $src = imagerotate($src, $angle, 0);
            }
        }

        $w = imagesx($src);
        $h = imagesy($src);
        $scale = min(1, $maxDim / max($w, $h));
        $nw = max(1, (int) round($w * $scale));
        $nh = max(1, (int) round($h * $scale));

        $dst = imagecreatetruecolor($nw, $nh);
        imagealphablending($dst, false);
        imagesavealpha($dst, true);
        imagecopyresampled($dst, $src, 0, 0, 0, 0, $nw, $nh, $w, $h);

        $tmp = tempnam(sys_get_temp_dir(), 'webp_');
        imagewebp($dst, $tmp, $quality);
        imagedestroy($src);
        imagedestroy($dst);
        $data = file_get_contents($tmp);
        @unlink($tmp);

        return $data ?: null;
    }

    /**
     * Guarda la imagen optimizada en el disco público y devuelve su URL.
     */
    public static function store(string $sourcePath, string $dir, int $maxDim, int $quality, ?string $basename = null): ?string
    {
        $data = self::toWebp($sourcePath, $maxDim, $quality);
        if ($data === null) {
            return null;
        }
        $name = $dir . '/' . ($basename ?? Str::random(24)) . '.webp';
        Storage::disk('public')->put($name, $data);

        return Storage::url($name);
    }
}

