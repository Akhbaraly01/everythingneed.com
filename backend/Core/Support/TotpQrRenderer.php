<?php

namespace Core\Support;

/**
 * TOTP provisioning QR codes, rendered in-process.
 *
 * The otpauth secret must never leave the server inside a third-party QR
 * URL (previous api.qrserver.com calls) — the SVG is generated locally
 * and returned as a data URI.
 */
class TotpQrRenderer
{
    public static function dataUri(string $account, string $secret, ?string $issuer = null): string
    {
        $issuer ??= (string) config('app.name', 'EverythingNeed');

        $otpauth = sprintf(
            'otpauth://totp/%s:%s?secret=%s&issuer=%s',
            urlencode($issuer),
            urlencode($account),
            $secret,
            urlencode($issuer)
        );

        $renderer = new \BaconQrCode\Renderer\ImageRenderer(
            new \BaconQrCode\Renderer\RendererStyle\RendererStyle(240),
            new \BaconQrCode\Renderer\Image\SvgImageBackEnd()
        );

        return 'data:image/svg+xml;base64,' . base64_encode(
            (new \BaconQrCode\Writer($renderer))->writeString($otpauth)
        );
    }
}
