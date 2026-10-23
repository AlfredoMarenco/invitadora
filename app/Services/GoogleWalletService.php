<?php

namespace App\Services;

use App\Models\Guest;
use App\Models\Wedding;
use Illuminate\Support\Facades\Log;

class GoogleWalletService
{
    /**
     * Verificar si las credenciales de Google Wallet están configuradas.
     */
    public function isConfigured(): bool
    {
        $issuerId = config('services.google_wallet.issuer_id');
        $privateKey = config('services.google_wallet.private_key');
        $clientEmail = config('services.google_wallet.client_email');

        return !empty($issuerId) && !empty($privateKey) && !empty($clientEmail);
    }

    /**
     * Generar la URL de Google Wallet "Save to Wallet" para un invitado.
     */
    public function generateSaveUrl(Guest $guest): ?string
    {
        if (!$this->isConfigured()) {
            return null;
        }

        $invitation = $guest->invitation;
        $wedding = $invitation?->wedding ?? Wedding::first();

        $issuerId = config('services.google_wallet.issuer_id');
        $clientEmail = config('services.google_wallet.client_email');
        $privateKey = config('services.google_wallet.private_key');

        $brideName = $wedding->bride_name ?? 'Adriana';
        $groomName = $wedding->groom_name ?? 'Joaquín';

        // Formato de fecha elegante en español
        $weddingDateText = $wedding->wedding_date
            ? $wedding->wedding_date->locale('es')->isoFormat('D [de] MMMM [de] YYYY')
            : '20 de Febrero de 2027';

        $receptionLocation = $wedding->locations['reception'] ?? 'Hacienda San Diego Cutz';
        $ceremonyLocation = $wedding->locations['ceremony'] ?? null;
        $dressCode = $wedding->dress_code ?? null;

        // Los IDs en Google Wallet deben ser alfanuméricos con punto, guión o guión bajo
        $cleanCode = preg_replace('/[^A-Za-z0-9_-]/', '', $guest->checkin_code ?? 'CODE');
        // Versionamos la clase para que Google Wallet no use la plantilla previa en caché
        $classId = "{$issuerId}.wedding_{$wedding->id}_gala_v2";
        $objectId = "{$issuerId}.guest_{$guest->id}_{$cleanCode}_v2";

        // 1. Clase Genérica (Plantilla del Evento)
        $genericClass = [
            'id' => $classId,
            'hexBackgroundColor' => '#28362e',
        ];

        // 2. Módulos de texto visibles en la tarjeta
        $textModules = [
            [
                'id' => 'guest_name',
                'header' => 'INVITADO OFICIAL',
                'body' => $guest->full_name . ($guest->type === 'child' ? ' (Niño/a)' : ' (Adulto)'),
            ],
            [
                'id' => 'table',
                'header' => 'MESA ASIGNADA',
                'body' => $guest->table?->name ?? 'Mesa asignada a la entrada',
            ],
            [
                'id' => 'guest_code',
                'header' => 'CÓDIGO DE CHECK-IN',
                'body' => $guest->checkin_code,
            ],
            [
                'id' => 'date',
                'header' => 'FECHA DE CELEBRACIÓN',
                'body' => $weddingDateText,
            ],
            [
                'id' => 'reception',
                'header' => 'LUGAR DE RECEPCIÓN',
                'body' => $receptionLocation,
            ],
        ];

        if (!empty($ceremonyLocation)) {
            $textModules[] = [
                'id' => 'ceremony',
                'header' => 'CEREMONIA RELIGIOSA',
                'body' => $ceremonyLocation,
            ];
        }

        if (!empty($dressCode)) {
            $textModules[] = [
                'id' => 'dress_code',
                'header' => 'CÓDIGO DE VESTIMENTA',
                'body' => $dressCode,
            ];
        }

        if (!empty($guest->allergies)) {
            $textModules[] = [
                'id' => 'allergies',
                'header' => 'MENÚ ESPECIAL / ALERGIAS',
                'body' => $guest->allergies,
            ];
        }

        // 3. Enlaces interactivos en el reverso del pase (Google Maps, Waze, Mesa de Regalos, Invitación)
        $uris = [];

        // Enlace a Google Maps para recepción
        if (!empty($wedding->locations['reception_maps'])) {
            $uris[] = [
                'kind' => 'walletobjects#uri',
                'uri' => $wedding->locations['reception_maps'],
                'description' => '📍 Cómo llegar a la Recepción (Google Maps)',
            ];
        }

        // Enlace a Waze
        if (!empty($wedding->locations['reception_waze'])) {
            $uris[] = [
                'kind' => 'walletobjects#uri',
                'uri' => $wedding->locations['reception_waze'],
                'description' => '🚗 Navegar con Waze a la Recepción',
            ];
        }

        // Enlace a Mesa de Regalos
        $giftUrl = $wedding->gift_registry_url ?? (!empty($wedding->gift_registries_list[0]['url']) ? $wedding->gift_registries_list[0]['url'] : null);
        if (!empty($giftUrl)) {
            $uris[] = [
                'kind' => 'walletobjects#uri',
                'uri' => $giftUrl,
                'description' => '🎁 Mesa de Regalos de los Novios',
            ];
        }

        // Enlace directo a la invitación web
        if ($invitation && !empty($invitation->token)) {
            $uris[] = [
                'kind' => 'walletobjects#uri',
                'uri' => url("/public/rsvp/{$invitation->token}"),
                'description' => '💌 Ver Invitación Web y Detalles',
            ];
        }

        // 4. Objeto Genérico de Pase Oficial para el invitado
        $genericObject = [
            'id' => $objectId,
            'classId' => $classId,
            'genericType' => 'GENERIC_OTHER',
            'hexBackgroundColor' => '#28362e',
            'cardTitle' => [
                'defaultValue' => [
                    'language' => 'es-419',
                    'value' => "BODA {$brideName} & {$groomName}",
                ],
            ],
            'header' => [
                'defaultValue' => [
                    'language' => 'es-419',
                    'value' => $guest->full_name,
                ],
            ],
            'subheader' => [
                'defaultValue' => [
                    'language' => 'es-419',
                    'value' => 'Pase Oficial de Acceso',
                ],
            ],
            'barcode' => [
                'type' => 'QR_CODE',
                'value' => $guest->checkin_code,
                'alternateText' => $guest->checkin_code,
            ],
            'textModulesData' => $textModules,
        ];

        if (!empty($uris)) {
            $genericObject['linksModuleData'] = [
                'uris' => $uris,
            ];
        }

        // 5. Imagen de portada si es pública (https)
        $firstGalleryImage = $wedding->galleryImages()->where('is_active', true)->first();
        if ($firstGalleryImage && !empty($firstGalleryImage->image_path)) {
            $imageUrl = str_starts_with($firstGalleryImage->image_path, 'http')
                ? $firstGalleryImage->image_path
                : \Illuminate\Support\Facades\Storage::url($firstGalleryImage->image_path);

            if (str_starts_with($imageUrl, 'https://')) {
                $genericObject['heroImage'] = [
                    'sourceUri' => [
                        'uri' => $imageUrl,
                        'description' => "{$brideName} & {$groomName}",
                    ],
                ];
            }
        }

        $payload = [
            'iss' => $clientEmail,
            'aud' => 'google',
            'typ' => 'savetowallet',
            'iat' => time(),
            'payload' => [
                'genericClasses' => [$genericClass],
                'genericObjects' => [$genericObject],
            ],
        ];

        $jwt = $this->signJwt($payload, $privateKey);
        if (!$jwt) {
            return null;
        }

        return "https://pay.google.com/gp/v/save/{$jwt}";
    }

    /**
     * Firmar un JWT con algoritmo RS256 usando OpenSSL nativo de PHP.
     */
    private function signJwt(array $payload, string $privateKey): ?string
    {
        try {
            $header = [
                'alg' => 'RS256',
                'typ' => 'JWT',
            ];

            // Formatear clave privada si no tiene headers PEM
            if (!str_contains($privateKey, 'BEGIN PRIVATE KEY') && !str_contains($privateKey, 'BEGIN RSA PRIVATE KEY')) {
                $privateKey = "-----BEGIN PRIVATE KEY-----\n" . wordwrap(trim($privateKey), 64, "\n", true) . "\n-----END PRIVATE KEY-----";
            }

            $base64UrlHeader = $this->base64UrlEncode(json_encode($header));
            $base64UrlPayload = $this->base64UrlEncode(json_encode($payload));

            $signatureInput = "{$base64UrlHeader}.{$base64UrlPayload}";
            $signature = '';

            $success = openssl_sign($signatureInput, $signature, $privateKey, OPENSSL_ALGO_SHA256);
            if (!$success) {
                Log::error('OpenSSL falló al firmar JWT de Google Wallet: ' . openssl_error_string());
                return null;
            }

            $base64UrlSignature = $this->base64UrlEncode($signature);

            return "{$signatureInput}.{$base64UrlSignature}";
        } catch (\Throwable $e) {
            Log::error('Error firmando JWT para Google Wallet: ' . $e->getMessage());
            return null;
        }
    }

    private function base64UrlEncode(string $data): string
    {
        return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($data));
    }
}
