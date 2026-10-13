<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Wedding;
use App\Models\Hotel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class HotelController extends Controller
{
    public function index()
    {
        $wedding = Wedding::with(['hotels' => function ($q) {
            $q->orderBy('order');
        }])->firstOrFail();

        // Si aún no hay hoteles registrados, inicializamos con los 4 hoteles recomendados por defecto
        if ($wedding->hotels()->count() === 0) {
            $defaultHotels = [
                [
                    'name' => 'Hacienda Misné',
                    'location' => 'Calle 19 No. 172 x 6-B, Chichí Suárez, Mérida, Yuc.',
                    'url' => 'https://www.haciendamisne.com.mx/',
                    'image_path' => '/images/hotels/hotel_1.jpg',
                    'order' => 0,
                    'is_active' => true,
                ],
                [
                    'name' => 'Hotel Casa Lucia',
                    'location' => 'Calle 60 No. 474-A x 55, Parque Santa Lucía, Centro, Mérida',
                    'url' => 'https://casalucia.com.mx/',
                    'image_path' => '/images/hotels/hotel_2.jpg',
                    'order' => 1,
                    'is_active' => true,
                ],
                [
                    'name' => 'Mansión Mérida',
                    'location' => 'Calle 59 No. 498 entre 58 y 60, Centro Histórico, Mérida',
                    'url' => 'https://mansionmerida.com/',
                    'image_path' => '/images/hotels/hotel_3.jpg',
                    'order' => 2,
                    'is_active' => true,
                ],
                [
                    'name' => 'Villa Mercedes Curio',
                    'location' => 'Av. Colón 500, García Ginerés, Mérida, Yuc.',
                    'url' => 'https://www.hilton.com/',
                    'image_path' => '/images/hotels/hotel_4.jpg',
                    'order' => 3,
                    'is_active' => true,
                ],
            ];

            foreach ($defaultHotels as $hotelData) {
                $wedding->hotels()->create($hotelData);
            }

            $wedding->load(['hotels' => function ($q) {
                $q->orderBy('order');
            }]);
        }

        return Inertia::render('Admin/HotelManager', [
            'wedding' => $wedding,
            'hotels' => $wedding->hotels,
        ]);
    }

    public function store(Request $request)
    {
        $wedding = Wedding::firstOrFail();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'location' => 'required|string|max:500',
            'url' => 'nullable|string|max:500',
            'image' => 'required|image|max:5120', // Máx 5MB
            'is_active' => 'nullable|boolean',
        ]);

        $maxOrder = $wedding->hotels()->max('order') ?? -1;

        $path = $request->file('image')->store('hotels', 'public');

        $wedding->hotels()->create([
            'name' => $validated['name'],
            'location' => $validated['location'],
            'url' => $validated['url'] ?? null,
            'image_path' => Storage::url($path),
            'order' => $maxOrder + 1,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return back()->with('success', 'Hotel agregado exitosamente');
    }

    public function update(Request $request, Hotel $hotel)
    {
        $wedding = Wedding::firstOrFail();
        if ($hotel->wedding_id !== $wedding->id) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'location' => 'required|string|max:500',
            'url' => 'nullable|string|max:500',
            'image' => 'nullable|image|max:5120',
            'is_active' => 'nullable|boolean',
        ]);

        if ($request->hasFile('image')) {
            // Si la imagen anterior estaba en storage, eliminarla
            if (str_starts_with($hotel->image_path, '/storage/')) {
                $oldPath = str_replace('/storage/', '', $hotel->image_path);
                Storage::disk('public')->delete($oldPath);
            }

            $path = $request->file('image')->store('hotels', 'public');
            $hotel->image_path = Storage::url($path);
        }

        $hotel->name = $validated['name'];
        $hotel->location = $validated['location'];
        $hotel->url = $validated['url'] ?? null;
        if ($request->has('is_active')) {
            $hotel->is_active = $request->boolean('is_active');
        }

        $hotel->save();

        return back()->with('success', 'Hotel actualizado exitosamente');
    }

    public function destroy(Hotel $hotel)
    {
        $wedding = Wedding::firstOrFail();
        if ($hotel->wedding_id !== $wedding->id) {
            abort(403);
        }

        if (str_starts_with($hotel->image_path, '/storage/')) {
            $path = str_replace('/storage/', '', $hotel->image_path);
            Storage::disk('public')->delete($path);
        }

        $hotel->delete();

        return back()->with('success', 'Hotel eliminado exitosamente');
    }

    public function reorder(Request $request)
    {
        $request->validate([
            'orders' => 'required|array',
            'orders.*.id' => 'required|exists:hotels,id',
            'orders.*.order' => 'required|integer',
        ]);

        foreach ($request->orders as $item) {
            Hotel::where('id', $item['id'])->update(['order' => $item['order']]);
        }

        return back();
    }

    public function toggle(Hotel $hotel)
    {
        $wedding = Wedding::firstOrFail();
        if ($hotel->wedding_id !== $wedding->id) {
            abort(403);
        }

        $hotel->update(['is_active' => !$hotel->is_active]);

        return back();
    }
}
