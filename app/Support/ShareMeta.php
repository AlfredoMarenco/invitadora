<?php

namespace App\Support;

use App\Models\Invitation;
use App\Models\Wedding;
use Carbon\CarbonInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class ShareMeta
{
    /**
     * Detecta si la petición proviene de un bot generador de vistas previas
     * (WhatsApp, Facebook/Meta, iMessage, Telegram, X/Twitter, Slack, Discord, etc.)
     * para evitar marcar falsamente la invitación como "Visto".
     */
    public static function isPreviewBot(?Request $request): bool
    {
        if ($request === null) {
            return false;
        }

        if ($request->isMethod('HEAD')) {
            return true;
        }

        $ua = strtolower((string) $request->userAgent());
        if ($ua === '') {
            return false;
        }

        $botSignatures = [
            'whatsapp',
            'facebookexternalhit',
            'facebot',
            'meta-externalagent',
            'meta-externalfetcher',
            'telegrambot',
            'twitterbot',
            'slackbot',
            'slack-imgproxy',
            'discordbot',
            'linkedinbot',
            'pinterest',
            'applebot',
            'skypeuripreview',
            'vkshare',
            'viber',
            'kakaotalk-scrap',
            'line-poker',
            'embedly',
            'quora link preview',
            'outbrain',
            'w3c_validator',
        ];

        foreach ($botSignatures as $signature) {
            if (str_contains($ua, $signature)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Formatea la fecha de la boda en español sin depender del locale del sistema operativo.
     */
    public static function formatSpanishDate(CarbonInterface|string|null $date): string
    {
        if (! $date) {
            return '20 de febrero de 2027';
        }

        try {
            $carbon = $date instanceof CarbonInterface
                ? $date->copy()->utc()
                : Carbon::parse($date, 'UTC');

            $months = [
                1 => 'enero',
                2 => 'febrero',
                3 => 'marzo',
                4 => 'abril',
                5 => 'mayo',
                6 => 'junio',
                7 => 'julio',
                8 => 'agosto',
                9 => 'septiembre',
                10 => 'octubre',
                11 => 'noviembre',
                12 => 'diciembre',
            ];

            $day = $carbon->day;
            $month = $months[$carbon->month] ?? 'febrero';
            $year = $carbon->year;

            return "{$day} de {$month} de {$year}";
        } catch (\Throwable) {
            return '20 de febrero de 2027';
        }
    }

    /**
     * Construye el arreglo de metadatos Open Graph / Twitter Cards para la página de invitación.
     *
     * @return array{
     *     title: string,
     *     description: string,
     *     site_name: string,
     *     url: string,
     *     image: string,
     *     image_type: string,
     *     image_width: int,
     *     image_height: int,
     *     image_alt: string,
     *     locale: string,
     *     type: string
     * }
     */
    public static function forInvitation(?Wedding $wedding, ?Invitation $invitation = null, ?string $canonicalUrl = null): array
    {
        $brideName = trim((string) ($wedding?->bride_name ?: 'Adriana'));
        $groomName = trim((string) ($wedding?->groom_name ?: 'Joaquín'));
        $coupleNames = "{$brideName} & {$groomName}";
        $dateText = self::formatSpanishDate($wedding?->wedding_date);

        if ($invitation !== null && trim((string) $invitation->name) !== '') {
            $guestName = trim((string) $invitation->name);
            $guestCount = $invitation->relationLoaded('guests')
                ? $invitation->guests->count()
                : $invitation->guests()->count();

            $title = "Invitación para {$guestName} • Boda de {$coupleNames}";

            if ($guestCount > 0) {
                $passText = $guestCount === 1 ? '1 pase' : "{$guestCount} pases";
                $description = "¡Nos casamos! Hemos reservado {$passText} en su honor · {$dateText}";
            } else {
                $description = "¡Nos casamos! Nos haría muy felices contar con su presencia · {$dateText}";
            }
        } else {
            $title = "Boda de {$coupleNames} • Nuestra Invitación";
            $description = "¡Nos casamos! Acompáñanos a celebrar nuestra boda · {$dateText}";
        }

        $imageUrl = $wedding?->og_image_url ?: (url('/images/og-share.jpg').'?v=1');
        $cleanImagePath = strtolower((string) parse_url($imageUrl, PHP_URL_PATH));
        $imageType = str_ends_with($cleanImagePath, '.png') ? 'image/png' : 'image/jpeg';

        return [
            'title' => $title,
            'description' => $description,
            'site_name' => "Boda de {$coupleNames}",
            'url' => $canonicalUrl ?: url()->current(),
            'image' => $imageUrl,
            'image_type' => $imageType,
            'image_width' => 1200,
            'image_height' => 630,
            'image_alt' => "Boda de {$coupleNames}",
            'locale' => 'es_MX',
            'type' => 'website',
        ];
    }
}
