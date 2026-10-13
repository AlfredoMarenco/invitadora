<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Wedding;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 0. Crear Usuarios con sus roles
        \App\Models\User::factory()->create([
            'name' => 'Super Administrador',
            'email' => 'super@invitadora.test',
            'role' => 'super_user',
        ]);

        \App\Models\User::factory()->create([
            'name' => 'Wedding Planner',
            'email' => 'planner@invitadora.test',
            'role' => 'wedding_planner',
        ]);

        \App\Models\User::factory()->create([
            'name' => 'Ana y Jorge',
            'email' => 'novios@invitadora.test',
            'role' => 'couple',
        ]);

        // 1. Crear una boda de prueba
        $wedding = Wedding::create([
            'slug' => 'ana-y-jorge',
            'bride_name' => 'Ana',
            'groom_name' => 'Jorge',
            'wedding_date' => now()->addDays(30), // La boda es en 30 días
            'locations' => [
                'ceremony' => 'Iglesia de San Juan',
                'reception' => 'Hacienda Los Arcángeles'
            ],
            'dress_code' => 'Formal',
        ]);

        // 2. Crear una invitación familiar
        $invitation = $wedding->invitations()->create([
            'name' => 'Familia Pérez López',
            'phone' => '521234567890',
            'token' => 'aB3x9Z', // Token fijo para que sea fácil de probar
            'status' => 'pending',
        ]);

        // 3. Añadir invitados a esa invitación
        $invitation->guests()->createMany([
            [
                'full_name' => 'Carlos Pérez',
                'type' => 'adult',
            ],
            [
                'full_name' => 'María López',
                'type' => 'adult',
            ],
            [
                'full_name' => 'Pedrito Pérez',
                'type' => 'child',
            ]
        ]);
        
        // Segunda invitación de prueba
        $invitation2 = $wedding->invitations()->create([
            'name' => 'Roberto Gómez',
            'phone' => '529876543210',
            'token' => 'xY9z2W',
            'status' => 'pending',
        ]);

        $invitation2->guests()->create([
            'full_name' => 'Roberto Gómez',
            'type' => 'adult',
        ]);

        // 4. Hoteles recomendados de prueba
        $wedding->hotels()->createMany([
            [
                'name' => 'Hacienda Misné',
                'location' => 'Calle 19 No. 172 x 6-B, Chichí Suárez, Mérida, Yuc.',
                'image_path' => '/images/hotels/hotel_1.jpg',
                'url' => 'https://www.haciendamisne.com.mx/',
                'order' => 0,
                'is_active' => true,
            ],
            [
                'name' => 'Hotel Casa Lucia',
                'location' => 'Calle 60 No. 474-A x 55, Parque Santa Lucía, Centro, Mérida',
                'image_path' => '/images/hotels/hotel_2.jpg',
                'url' => 'https://casalucia.com.mx/',
                'order' => 1,
                'is_active' => true,
            ],
            [
                'name' => 'Mansión Mérida',
                'location' => 'Calle 59 No. 498 entre 58 y 60, Centro Histórico, Mérida',
                'image_path' => '/images/hotels/hotel_3.jpg',
                'url' => 'https://mansionmerida.com/',
                'order' => 2,
                'is_active' => true,
            ],
            [
                'name' => 'Villa Mercedes Curio',
                'location' => 'Av. Colón 500, García Ginerés, Mérida, Yuc.',
                'image_path' => '/images/hotels/hotel_4.jpg',
                'url' => 'https://www.hilton.com/',
                'order' => 3,
                'is_active' => true,
            ],
        ]);
    }
}
