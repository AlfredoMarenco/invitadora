<?php

use App\Models\Guest;
use App\Models\Invitation;
use App\Models\User;
use App\Models\Wedding;
use Illuminate\Support\Str;

function createAuditWedding(): Wedding
{
    return Wedding::create([
        'slug' => 'boda-'.Str::random(6),
        'bride_name' => 'Adriana',
        'groom_name' => 'Joaquín',
        'wedding_date' => '2027-02-20 00:00:00',
        'gift_registry_button_text' => 'LIVERPOOL',
        'gift_registry_url' => 'https://mesaderegalos.liverpool.com.mx/evento/123',
        'gift_registry_button_text_2' => 'AMAZON',
        'gift_registry_url_2' => 'https://www.amazon.com.mx/wedding/123',
        'gift_registries' => [
            ['name' => 'OBSOLETO', 'url' => 'https://old.example.com'],
        ],
    ]);
}

it('redirige /admin hacia /dashboard', function () {
    $user = User::factory()->create(['role' => 'couple']);

    $this->actingAs($user)
        ->get('/admin')
        ->assertRedirect('/dashboard');
});

it('permite al wedding_planner operar check-in y notificaciones pero bloquea crear o eliminar recursos', function () {
    $wedding = createAuditWedding();
    $planner = User::factory()->create(['role' => 'wedding_planner']);

    $invitation = Invitation::create([
        'wedding_id' => $wedding->id,
        'name' => 'Familia Pérez',
        'token' => Str::random(10),
        'status' => 'responded',
    ]);

    $guest = Guest::create([
        'invitation_id' => $invitation->id,
        'full_name' => 'Carlos Pérez',
        'type' => 'adult',
        'is_attending' => true,
        'checkin_code' => 'AJ-TEST1',
    ]);

    $table = $wedding->tables()->create([
        'name' => 'Mesa 1',
        'capacity' => 10,
        'pos_x' => 200,
        'pos_y' => 220,
    ]);

    // Check-in QR scan y toggle permitidos para wedding_planner
    $this->actingAs($planner)
        ->postJson('/admin/checkin/scan', ['code' => 'AJ-TEST1'])
        ->assertOk();

    $this->actingAs($planner)
        ->put("/admin/guests/{$guest->id}/checkin")
        ->assertRedirect();

    $this->actingAs($planner)
        ->putJson('/admin/notifications/mark-all-read')
        ->assertOk();

    // Operaciones destructivas o de alta siguen bloqueadas (403)
    $this->actingAs($planner)
        ->postJson('/admin/invitations', [
            'name' => 'Intento no autorizado',
            'side' => 'bride',
            'guests' => [['full_name' => 'Invitado', 'type' => 'adult']],
        ])
        ->assertForbidden();

    $this->actingAs($planner)
        ->deleteJson("/admin/tables/{$table->id}")
        ->assertForbidden();
});

it('no marca una invitación pendiente como vista cuando es abierta en modo preview o por un administrador', function () {
    $wedding = createAuditWedding();
    $admin = User::factory()->create(['role' => 'couple']);

    $invitation = Invitation::create([
        'wedding_id' => $wedding->id,
        'name' => 'Familia Ruiz',
        'token' => Str::random(10),
        'status' => 'pending',
    ]);

    Guest::create([
        'invitation_id' => $invitation->id,
        'full_name' => 'Laura Ruiz',
        'type' => 'adult',
    ]);

    // 1. Con ?preview=1 no cambia de pending a viewed
    $this->get("/public/rsvp/{$invitation->token}?preview=1")->assertOk();
    expect($invitation->fresh()->status)->toBe('pending');

    // 2. Autenticado como admin tampoco cambia de pending a viewed
    $this->actingAs($admin)->get("/public/rsvp/{$invitation->token}")->assertOk();
    expect($invitation->fresh()->status)->toBe('pending');

    // 3. Visitante real anónimo sí la marca como viewed
    auth()->logout();
    $this->get("/public/rsvp/{$invitation->token}")->assertOk();
    expect($invitation->fresh()->status)->toBe('viewed');
});

it('prioriza los campos individuales de mesa de regalos editados en el formulario sobre el json legado', function () {
    $wedding = createAuditWedding();

    expect($wedding->gift_registries_list)->toHaveCount(2)
        ->and($wedding->gift_registries_list[0]['name'])->toBe('LIVERPOOL')
        ->and($wedding->gift_registries_list[1]['name'])->toBe('AMAZON');
});
