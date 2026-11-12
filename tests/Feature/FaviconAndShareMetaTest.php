<?php

use App\Models\Guest;
use App\Models\Invitation;
use App\Models\User;
use App\Models\Wedding;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

function createMetaTestWedding(): Wedding
{
    return Wedding::create([
        'slug' => 'adriana-y-joaquin-'.Str::random(5),
        'bride_name' => 'Adriana',
        'groom_name' => 'Joaquín',
        'wedding_date' => '2027-02-20 00:00:00',
    ]);
}

it('tiene generados los nuevos iconos AJ y la imagen OG predeterminada 1200x630 JPG ligera', function () {
    $svg = file_get_contents(public_path('favicon.svg'));
    expect($svg)->toContain('#28362E')
        ->and($svg)->toContain('#FFF7ED')
        ->and($svg)->not->toContain('#FF2D20');

    expect(file_exists(public_path('favicon.ico')))->toBeTrue()
        ->and(filesize(public_path('favicon.ico')))->toBeGreaterThan(500)
        ->and(file_exists(public_path('apple-touch-icon.png')))->toBeTrue();

    $appleInfo = getimagesize(public_path('apple-touch-icon.png'));
    expect($appleInfo[0])->toBe(180)
        ->and($appleInfo[1])->toBe(180)
        ->and($appleInfo['mime'])->toBe('image/png');

    $ogPath = public_path('images/og-share.jpg');
    expect(file_exists($ogPath))->toBeTrue()
        ->and(filesize($ogPath))->toBeLessThan(300000);

    $ogInfo = getimagesize($ogPath);
    expect($ogInfo[0])->toBe(1200)
        ->and($ogInfo[1])->toBe(630)
        ->and($ogInfo['mime'])->toBe('image/jpeg');
});

it('renderiza metadatos Open Graph generales e iconos actualizados en la raíz (/)', function () {
    createMetaTestWedding();

    $response = $this->get('/');

    $response->assertOk();
    $html = $response->getContent();

    expect($html)
        ->toContain('<meta name="theme-color" content="#28362E">')
        ->toContain('href="/favicon.ico?v=2"')
        ->toContain('href="/favicon.svg?v=2"')
        ->toContain('href="/apple-touch-icon.png?v=2"')
        ->toContain('property="og:title" content="Boda de Adriana &amp; Joaquín • Nuestra Invitación"')
        ->toContain('property="og:description" content="¡Nos casamos! Acompáñanos a celebrar nuestra boda · 20 de febrero de 2027"')
        ->toContain('/images/og-share.jpg?v=1')
        ->toContain('property="og:image:width" content="1200"')
        ->toContain('property="og:image:height" content="630"')
        ->toContain('name="twitter:card" content="summary_large_image"');
});

it('renderiza metadatos Open Graph personalizados por familia y número de pases en /public/rsvp/{token}', function () {
    $wedding = createMetaTestWedding();

    $familyInvitation = Invitation::create([
        'wedding_id' => $wedding->id,
        'name' => 'Familia Pérez López',
        'token' => 'famPerez123',
        'status' => 'pending',
    ]);
    Guest::insert([
        ['invitation_id' => $familyInvitation->id, 'full_name' => 'Carlos Pérez', 'type' => 'adult', 'created_at' => now(), 'updated_at' => now()],
        ['invitation_id' => $familyInvitation->id, 'full_name' => 'María López', 'type' => 'adult', 'created_at' => now(), 'updated_at' => now()],
        ['invitation_id' => $familyInvitation->id, 'full_name' => 'Pedrito Pérez', 'type' => 'child', 'created_at' => now(), 'updated_at' => now()],
    ]);

    $singleInvitation = Invitation::create([
        'wedding_id' => $wedding->id,
        'name' => 'Roberto Gómez',
        'token' => 'robGomez456',
        'status' => 'pending',
    ]);
    Guest::create(['invitation_id' => $singleInvitation->id, 'full_name' => 'Roberto Gómez', 'type' => 'adult']);

    $familyHtml = $this->get('/public/rsvp/famPerez123')->assertOk()->getContent();
    expect($familyHtml)
        ->toContain('property="og:title" content="Invitación para Familia Pérez López • Boda de Adriana &amp; Joaquín"')
        ->toContain('property="og:description" content="¡Nos casamos! Hemos reservado 3 pases en su honor · 20 de febrero de 2027"');

    $singleHtml = $this->get('/public/rsvp/robGomez456')->assertOk()->getContent();
    expect($singleHtml)
        ->toContain('property="og:title" content="Invitación para Roberto Gómez • Boda de Adriana &amp; Joaquín"')
        ->toContain('property="og:description" content="¡Nos casamos! Hemos reservado 1 pase en su honor · 20 de febrero de 2027"');
});

it('ignora los bots de vista previa (WhatsApp, Facebook, Telegram) al marcar la invitación como Visto', function () {
    $wedding = createMetaTestWedding();

    $invitation = Invitation::create([
        'wedding_id' => $wedding->id,
        'name' => 'Familia Hernández',
        'token' => 'waPreviewToken',
        'status' => 'pending',
    ]);
    Guest::create(['invitation_id' => $invitation->id, 'full_name' => 'Laura Hernández', 'type' => 'adult']);

    $botUserAgents = [
        'WhatsApp/2.24.18.76 i',
        'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        'TelegramBot (like TwitterBot)',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_1) AppleWebKit/601.2.4 (KHTML, like Gecko) Version/9.0.1 Safari/601.2.4 facebookexternalhit/1.1 Facebot Twitterbot/1.0',
    ];

    foreach ($botUserAgents as $ua) {
        $res = $this->withHeaders(['User-Agent' => $ua])->get('/public/rsvp/waPreviewToken');
        $res->assertOk();
        expect($res->getContent())->toContain('Invitación para Familia Hernández');
        expect($invitation->fresh()->status)->toBe('pending');
    }

    // Ahora abre el enlace un invitado real desde su navegador móvil
    $realUserAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
    $this->withHeaders(['User-Agent' => $realUserAgent])
        ->get('/public/rsvp/waPreviewToken')
        ->assertOk();

    expect($invitation->fresh()->status)->toBe('viewed');
});

it('permite subir una imagen OG personalizada 1200x630 JPG y restaurar la predeterminada desde /admin/settings', function () {
    Storage::fake('public');

    $user = User::factory()->create(['role' => 'couple', 'email_verified_at' => now()]);
    $wedding = createMetaTestWedding();

    $uploaded = UploadedFile::fake()->image('nueva-portada-vertical.png', 1000, 1500);

    $this->actingAs($user)
        ->put('/admin/settings', [
            'bride_name' => 'Adriana',
            'groom_name' => 'Joaquín',
            'wedding_date' => '2027-02-20',
            'og_image' => $uploaded,
        ])
        ->assertRedirect();

    $wedding->refresh();
    expect($wedding->og_image_path)->not->toBeNull()
        ->and($wedding->og_image_path)->toEndWith('.jpg');

    $storedRelative = ltrim((string) preg_replace('#^/storage/#', '', (string) $wedding->og_image_path), '/');
    Storage::disk('public')->assertExists($storedRelative);

    $storedBytes = Storage::disk('public')->get($storedRelative);
    $dims = getimagesizefromstring($storedBytes);
    expect($dims[0])->toBe(1200)
        ->and($dims[1])->toBe(630)
        ->and($dims['mime'])->toBe('image/jpeg');

    $html = $this->get('/')->assertOk()->getContent();
    expect($html)->toContain($wedding->og_image_path);

    // Restaurar imagen predeterminada
    $this->actingAs($user)
        ->put('/admin/settings', [
            'bride_name' => 'Adriana',
            'groom_name' => 'Joaquín',
            'wedding_date' => '2027-02-20',
            'delete_og_image' => true,
        ])
        ->assertRedirect();

    $wedding->refresh();
    expect($wedding->og_image_path)->toBeNull();
    Storage::disk('public')->assertMissing($storedRelative);

    $restoredHtml = $this->get('/')->assertOk()->getContent();
    expect($restoredHtml)->toContain('/images/og-share.jpg?v=1');
});
