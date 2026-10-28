<?php

namespace App\Console\Commands;

use App\Models\GalleryImage;
use App\Support\ImageOptimizer;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class OptimizeGallery extends Command
{
    protected $signature = 'gallery:optimize';

    protected $description = 'Recomprime las fotos de la galería (1600px WebP) y genera sus miniaturas';

    public function handle(): int
    {
        $disk = Storage::disk('public');
        $before = $after = 0;

        foreach (GalleryImage::all() as $img) {
            $rel = ltrim(str_replace('/storage/', '', $img->image_path), '/');
            if (!$disk->exists($rel)) {
                $this->warn("No existe: {$rel}");
                continue;
            }
            $abs = $disk->path($rel);
            $before += filesize($abs);
            $name = pathinfo($rel, PATHINFO_FILENAME);

            $full = ImageOptimizer::toWebp($abs, 1600, 72);
            $thumb = ImageOptimizer::toWebp($abs, 700, 68);
            if (!$full || !$thumb) {
                $this->warn("Omitida (GD no la procesa): {$rel}");
                $after += filesize($abs);
                continue;
            }

            $newRel = 'gallery/' . $name . '.webp';
            $disk->put($newRel, $full);
            $disk->put('gallery/thumbs/' . $name . '.webp', $thumb);
            if ($newRel !== $rel) {
                $disk->delete($rel);
            }
            $after += strlen($full);

            $img->update([
                'image_path' => Storage::url($newRel),
                'thumb_path' => Storage::url('gallery/thumbs/' . $name . '.webp'),
            ]);
            $this->info("OK {$name}");
        }

        $this->info(sprintf('Antes: %.2f MB → Después: %.2f MB', $before / 1048576, $after / 1048576));

        return self::SUCCESS;
    }
}

