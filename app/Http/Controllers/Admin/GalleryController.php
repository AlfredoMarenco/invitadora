<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Wedding;
use App\Models\GalleryImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

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
            'images' => 'required|array',
            'images.*' => 'image|max:5120', // Max 5MB per image
        ]);

        $maxOrder = $wedding->galleryImages()->max('order') ?? -1;

        foreach ($request->file('images') as $file) {
            $path = $file->store('gallery', 'public');
            $maxOrder++;
            
            $wedding->galleryImages()->create([
                'image_path' => Storage::url($path),
                'order' => $maxOrder,
            ]);
        }

        return back();
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

        return back();
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
}
