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
        $weddingDateText = $wedding->wedding_date ? $wedding->wedding_date->format('d/m/Y') : '20/02/2027';
        $location = $wedding->locations['reception'] ?? 'Hacienda San Diego Cutz';

        $classId = "{$issuerId}.wedding_{$wedding->id}";
        $objectId = "{$issuerId}.guest_{$guest->id}_{$guest->checkin_code}";

        // Objeto Genérico de Pase Oficial para Google Wallet
        $genericObject = [
            'id' => $objectId,
            'classId' => $classId,
            'genericType' => 'GENERIC_TICKET',
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
                    'value' => 'Pase de Acceso Oficial',
                ],
            ],
            'barcode' => [
                'type' => 'QR_CODE',
                'value' => $guest->checkin_code,
                'alternateText' => $guest->checkin_code,
            ],
            'textModulesData' => [
                [
                    'id' => 'guest_code',
                    'header' => 'CÓDIGO DE ACCESO',
                    'body' => $guest->checkin_code,
                ],
                [
                    'id' => 'table',
                    'header' => 'MESA ASIGNADA',
                    'body' => $guest->table?->name ?? 'Por asignar',
                ],
                [
                    'id' => 'date',
                    'header' => 'FECHA',
                    'body' => $weddingDateText,
                ],
                [
                    'id' => 'venue',
                    'header' => 'LUGAR',
                    'body' => $location,
                ],
            ],
        ];

        $payload = [
            'iss' => $clientEmail,
            'aud' => 'google',
            'typ' => 'savetowallet',
            'iat' => time(),
            'payload' => [
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
