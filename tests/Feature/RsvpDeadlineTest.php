<?php

use App\Models\Guest;
use App\Models\Invitation;
use App\Models\Wedding;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

function makeWedding(?string $deadline = null): Wedding
{
    return Wedding::create([
        'slug' => 'boda-'.Str::random(6),
        'bride_name' => 'Adriana',
        'groom_name' => 'Joaquín',
        'wedding_date' => '2027-02-20 00:00:00',
        'rsvp_deadline' => $deadline,
    ]);
}

function makeInvitation(Wedding $wedding, ?string $deadline = null, string $name = 'Familia Pérez'): Invitation
{
    $invitation = Invitation::create([
        'wedding_id' => $wedding->id,
        'name' => $name,
        'token' => Str::random(10),
        'rsvp_deadline' => $deadline,
    ]);

    Guest::create(['invitation_id' => $invitation->id, 'full_name' => $name, 'type' => 'adult']);

    return $invitation;
}

function rsvpYes(Invitation $invitation)
{
    $guest = $invitation->guests()->first();

    return test()->put("/public/rsvp/{$invitation->token}", [
        'guests' => [['id' => $guest->id, 'is_attending' => true]],
    ]);
}

afterEach(fn () => Carbon::setTestNow());

it('usa la zona horaria de Ciudad de México', function () {
    expect(config('app.timezone'))->toBe('America/Mexico_City');
});

it('permite confirmar durante todo el día límite (hasta las 23:59 hora CDMX)', function () {
    Carbon::setTestNow(Carbon::parse('2026-12-01 23:59:00', 'America/Mexico_City'));
    $invitation = makeInvitation(makeWedding('2026-12-01'));

    rsvpYes($invitation)->assertSessionHasNoErrors();

    expect($invitation->guests()->first()->is_attending)->toBeTrue()
        ->and($invitation->fresh()->status)->toBe('responded');
});

it('bloquea la confirmación a partir del día siguiente a la fecha límite', function () {
    Carbon::setTestNow(Carbon::parse('2026-12-02 00:00:01', 'America/Mexico_City'));
    $invitation = makeInvitation(makeWedding('2026-12-01'));

    rsvpYes($invitation)->assertSessionHasErrors('rsvp');

    expect($invitation->guests()->first()->is_attending)->toBeNull();
});

it('la fecha especial de la invitación tiene prioridad sobre la de la boda', function () {
    Carbon::setTestNow(Carbon::parse('2026-12-10 12:00:00', 'America/Mexico_City'));
    $wedding = makeWedding('2026-12-01'); // general ya cerrada
    $extended = makeInvitation($wedding, '2026-12-15', 'Familia Extendida');
    $shortened = makeInvitation($wedding, '2026-12-05', 'Familia Corta');

    rsvpYes($extended)->assertSessionHasNoErrors();
    rsvpYes($shortened)->assertSessionHasErrors('rsvp');
});

it('permite confirmar si no hay fecha límite configurada', function () {
    $invitation = makeInvitation(makeWedding());

    rsvpYes($invitation)->assertSessionHasNoErrors();
});

it('la confirmación general (sin token) también respeta la fecha límite', function () {
    Carbon::setTestNow(Carbon::parse('2026-12-02 09:00:00', 'America/Mexico_City'));
    makeWedding('2026-12-01');

    $this->post('/public/rsvp/submit', ['name' => 'Nuevo Invitado', 'is_attending' => true])
        ->assertSessionHasErrors('rsvp');

    expect(Invitation::count())->toBe(0);
});

it('la confirmación general respeta la fecha especial de la invitación encontrada', function () {
    Carbon::setTestNow(Carbon::parse('2026-12-10 09:00:00', 'America/Mexico_City'));
    $wedding = makeWedding('2026-12-31');
    makeInvitation($wedding, '2026-12-05', 'Familia Corta');

    $this->post('/public/rsvp/submit', ['name' => 'Familia Corta', 'is_attending' => true])
        ->assertSessionHasErrors('rsvp');
});

it('expone la ventana de confirmación a la vista pública', function () {
    Carbon::setTestNow(Carbon::parse('2026-12-10 09:00:00', 'America/Mexico_City'));
    $invitation = makeInvitation(makeWedding('2026-12-01'), '2026-12-15');

    $this->get("/public/rsvp/{$invitation->token}")
        ->assertInertia(fn ($page) => $page
            ->component('invitation')
            ->where('rsvp.deadline', '2026-12-15')
            ->where('rsvp.closed', false)
            ->missing('invitation.wedding'));
});

it('serializa la fecha límite como Y-m-d para el panel', function () {
    $invitation = makeInvitation(makeWedding('2026-12-01'), '2026-12-15');

    expect($invitation->fresh()->toArray()['rsvp_deadline'])->toBe('2026-12-15')
        ->and($invitation->wedding->toArray()['rsvp_deadline'])->toBe('2026-12-01');
});
