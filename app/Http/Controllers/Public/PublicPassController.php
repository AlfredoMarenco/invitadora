<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Guest;
use App\Services\GoogleWalletService;
use Illuminate\Http\Request;

class PublicPassController extends Controller
{
    public function __construct(
        protected GoogleWalletService $walletService
    ) {}

    /**
     * Generar o redirigir al pase de Google Wallet.
     */
    public function googleWallet(Request $request, string $code)
    {
        $guest = Guest::where('checkin_code', $code)->first();

        // Si no se encuentra por código, intentar buscar por id si es numérico
        if (!$guest && is_numeric($code)) {
            $guest = Guest::find($code);
        }

        if (!$guest) {
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Pase de invitado no encontrado.',
                ], 404);
            }
            return redirect('/')->withErrors(['wallet' => 'Pase de invitado no encontrado.']);
        }

        if (!$this->walletService->isConfigured()) {
            return response()->json([
                'success' => false,
                'configured' => false,
                'message' => 'Para emitir pases oficiales de Google Wallet se requiere configurar las credenciales gratuitas (Issuer ID y Clave de servicio de Google Cloud) en el archivo .env.',
            ]);
        }

        $url = $this->walletService->generateSaveUrl($guest);

        if (!$url) {
            return response()->json([
                'success' => false,
                'message' => 'No se pudo generar el pase firmado para Google Wallet. Revisa la clave privada.',
            ], 500);
        }

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'configured' => true,
                'url' => $url,
            ]);
        }

        return redirect()->away($url);
    }
}
