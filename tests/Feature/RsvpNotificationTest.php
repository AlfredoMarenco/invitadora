<?php

use App\Models\Guest;
use App\Models\Invitation;
use App\Models\User;
use App\Models\Wedding;
use App\Notifications\GuestRsvpNotification;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;

function makeWeddingWithEmail(?string $email = 'novios@example.com', bool $notify = true): Wedding
{
    return Wedding::create([
        'slug' => 'boda-'.Str::random(6),
        'bride_name' => 'Adriana',
        'groom_name' => 'Joaquín',
        'wedding_date' => '2027-02-20 00:00:00',
        'rsvp_notification_email' => $email,
        'notify_on_rsvp' => $notify,
    ]);
}

function makeInvitationForNotification(Wedding $wedding, string $name = 'Familia Gómez'): Invitation
{
    $invitation = Invitation::create([
        'wedding_id' => $wedding->id,
        'name' => $name,
        'token' => Str::random(10),
        'status' => 'pending',
    ]);

    Guest::create([
        'invitation_id' => $invitation->id,
        'full_name' => 'Juan Gómez',
        'type' => 'adult',
    ]);

    return $invitation;
}

it('guarda una notificación en base de datos para los administradores al confirmar RSVP', function () {
    $wedding = makeWeddingWithEmail();
    $admin = User::factory()->create(['role' => 'couple', 'email' => 'admin@example.com']);
    $invitation = makeInvitationForNotification($wedding);
    $guest = $invitation->guests->first();

    $this->put("/public/rsvp/{$invitation->token}", [
        'guests' => [
            ['id' => $guest->id, 'is_attending' => true, 'allergies' => 'Sin gluten'],
        ],
        'message_to_couple' => '¡Felicidades a ambos!',
    ])->assertSessionHasNoErrors();

    expect($admin->unreadNotifications()->count())->toBe(1);

    $notification = $admin->notifications()->first();
    expect($notification->data['invitation_name'])->toBe('Familia Gómez')
        ->and($notification->data['attending_count'])->toBe(1)
        ->and($notification->data['message'])->toBe('¡Felicidades a ambos!');
});

it('envía notificación por correo a la dirección de los novios configurada', function () {
    Notification::fake();

    $wedding = makeWeddingWithEmail('novios@boda.com');
    User::factory()->create(['email' => 'couple@example.com']);
    $invitation = makeInvitationForNotification($wedding);
    $guest = $invitation->guests->first();

    $this->put("/public/rsvp/{$invitation->token}", [
        'guests' => [['id' => $guest->id, 'is_attending' => true]],
        'message_to_couple' => 'Allá nos vemos',
    ]);

    Notification::assertSentOnDemand(
        GuestRsvpNotification::class,
        function ($notification, $channels, $notifiable) {
            return $notifiable->routes['mail'] === 'novios@boda.com';
        }
    );
});

it('no envía notificaciones si notify_on_rsvp es false', function () {
    Notification::fake();

    $wedding = makeWeddingWithEmail('novios@boda.com', false);
    $admin = User::factory()->create();
    $invitation = makeInvitationForNotification($wedding);
    $guest = $invitation->guests->first();

    $this->put("/public/rsvp/{$invitation->token}", [
        'guests' => [['id' => $guest->id, 'is_attending' => true]],
    ]);

    Notification::assertNothingSent();
    expect($admin->unreadNotifications()->count())->toBe(0);
});

it('permite al usuario consultar y marcar como leídas las notificaciones en el panel', function () {
    $wedding = makeWeddingWithEmail();
    $admin = User::factory()->create();
    $invitation = makeInvitationForNotification($wedding);
    $guest = $invitation->guests->first();

    $this->put("/public/rsvp/{$invitation->token}", [
        'guests' => [['id' => $guest->id, 'is_attending' => true]],
    ]);

    // Consultar lista
    $response = $this->actingAs($admin)->getJson('/admin/notifications');
    $response->assertOk()
        ->assertJsonStructure(['unread_count', 'notifications'])
        ->assertJson(['unread_count' => 1]);

    $notificationId = $response->json('notifications.0.id');

    // Marcar como leída
    $this->actingAs($admin)->putJson("/admin/notifications/{$notificationId}/read")
        ->assertOk();

    expect($admin->fresh()->unreadNotifications()->count())->toBe(0);
});
