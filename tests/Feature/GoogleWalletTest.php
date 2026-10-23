<?php

use App\Models\Guest;
use App\Models\Invitation;
use App\Models\Wedding;
use Illuminate\Support\Str;

it('retorna 404 si el código de pase no existe', function () {
    $this->getJson('/public/pass/CODIGO-INEXISTENTE/google-wallet')
        ->assertNotFound();
});

it('informa amigablemente si las credenciales de Google Wallet no están configuradas en .env', function () {
    $wedding = Wedding::create([
        'slug' => 'boda-'.Str::random(6),
        'bride_name' => 'Adriana',
        'groom_name' => 'Joaquín',
        'wedding_date' => '2027-02-20 00:00:00',
    ]);

    $invitation = Invitation::create([
        'wedding_id' => $wedding->id,
        'name' => 'Familia Test',
        'token' => Str::random(10),
    ]);

    $guest = Guest::create([
        'invitation_id' => $invitation->id,
        'full_name' => 'Invitado Wallet',
        'type' => 'adult',
        'checkin_code' => 'AJ-TEST1',
    ]);

    $response = $this->getJson('/public/pass/AJ-TEST1/google-wallet');

    $response->assertOk()
        ->assertJson([
            'success' => false,
            'configured' => false,
        ]);
});

it('genera el link firmado Save to Google Wallet cuando las credenciales están presentes', function () {
    // Clave RSA privada de prueba de 1024 bits
    $privateKey = "-----BEGIN RSA PRIVATE KEY-----\n" .
        "MIICXAIBAAKCAQEA0wM5Yj3u4k7r9v3KqG5v5W0xN7tK2e6u3y7w1z9v8u7x4a2b\n" .
        "c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4\n" .
        "e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6\n" .
        "a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8\n" .
        "c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0\n" .
        "e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2\n" .
        "a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4\n" .
        "c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6\n" .
        "e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8\n" .
        "a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0\n" .
        "c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2\n" .
        "e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4\n" .
        "a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6\n" .
        "c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8\n" .
        "e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0\n" .
        "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2\n" .
        "c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4\n" .
        "e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6\n" .
        "a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8\n" .
        "c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0\n" .
        "e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2\n" .
        "a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4\n" .
        "c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6\n" .
        "e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8\n" .
        "a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0\n" .
        "c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2\n" .
        "e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4\n" .
        "a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6\n" .
        "c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8\n" .
        "e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0\n" .
        "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2\n" .
        "c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4\n" .
        "-----END RSA PRIVATE KEY-----";

    $mockService = Mockery::mock(\App\Services\GoogleWalletService::class);
    $mockService->shouldReceive('isConfigured')->andReturn(true);
    $mockService->shouldReceive('generateSaveUrl')->andReturn('https://pay.google.com/gp/v/save/mock_jwt_token_123');

    $this->app->instance(\App\Services\GoogleWalletService::class, $mockService);

    $wedding = Wedding::create([
        'slug' => 'boda-'.Str::random(6),
        'bride_name' => 'Adriana',
        'groom_name' => 'Joaquín',
        'wedding_date' => '2027-02-20 00:00:00',
    ]);

    $invitation = Invitation::create([
        'wedding_id' => $wedding->id,
        'name' => 'Familia Con Wallet',
        'token' => Str::random(10),
    ]);

    $guest = Guest::create([
        'invitation_id' => $invitation->id,
        'full_name' => 'Laura Méndez',
        'type' => 'adult',
        'checkin_code' => 'AJ-WALLET',
    ]);

    $response = $this->getJson('/public/pass/AJ-WALLET/google-wallet');

    $response->assertOk()
        ->assertJson(['success' => true, 'configured' => true]);

    expect($response->json('url'))->toBe('https://pay.google.com/gp/v/save/mock_jwt_token_123');
});
