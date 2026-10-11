<?php

namespace Modules\Learn\Support;

/**
 * Resolves a pasted video URL into a provider + stable video id at submit
 * time, so playback can be driven by first-party embeds (YouTube/Vimeo/
 * Facebook SDK players) or our own uploaded file - never by an arbitrary
 * embed URL echoed back at render time (open-embed / clickjacking risk).
 */
class VideoResolver
{
    public const PROVIDER_UPLOAD = 'upload';

    /**
     * @return array{provider: string, provider_video_id: string}|null
     *         null = unrecognised host (caller must reject with 422)
     */
    public static function resolve(?string $url): ?array
    {
        if (!$url || !preg_match('#^https?://#i', $url)) {
            return null;
        }

        // Self-hosted uploads served from our storage disk.
        if (preg_match('#/storage/uploads/#', $url)) {
            return [
                'provider' => self::PROVIDER_UPLOAD,
                'provider_video_id' => parse_url($url, PHP_URL_PATH) ?: $url,
            ];
        }

        $host = strtolower((string) parse_url($url, PHP_URL_HOST));
        $host = preg_replace('/^www\./', '', $host);

        if (in_array($host, ['youtu.be', 'm.youtube.com', 'youtube-nocookie.com', 'music.youtube.com'], true)) {
            if ($host === 'youtu.be') {
                $path = (string) parse_url($url, PHP_URL_PATH);
                if (preg_match('#^/([\w-]{6,20})#', $path, $m)) {
                    return ['provider' => 'youtube', 'provider_video_id' => $m[1]];
                }

                return null;
            }
        }

        if (in_array($host, ['youtube.com', 'youtube-nocookie.com', 'm.youtube.com'], true)) {
            parse_str((string) parse_url($url, PHP_URL_QUERY), $q);
            if (!empty($q['v']) && preg_match('/^[\w-]{6,20}$/', $q['v'])) {
                return ['provider' => 'youtube', 'provider_video_id' => $q['v']];
            }
            if (preg_match('#/(?:embed|shorts|live|v)/([\w-]{6,20})#', (string) parse_url($url, PHP_URL_PATH), $m)) {
                return ['provider' => 'youtube', 'provider_video_id' => $m[1]];
            }

            return null;
        }

        if (in_array($host, ['vimeo.com', 'player.vimeo.com'], true)) {
            if (preg_match('#/(?:video/)?(\d{6,12})#', (string) parse_url($url, PHP_URL_PATH), $m)) {
                return ['provider' => 'vimeo', 'provider_video_id' => $m[1]];
            }

            return null;
        }

        if (in_array($host, ['facebook.com', 'm.facebook.com', 'www.facebook.com', 'fb.watch'], true)) {
            if (preg_match('#/videos/(?:\w+/)?(\d{6,20})#', (string) parse_url($url, PHP_URL_PATH), $m)) {
                return ['provider' => 'facebook', 'provider_video_id' => $m[1]];
            }
            if ($host === 'fb.watch' && preg_match('#^/([\w-]{6,30})#', (string) parse_url($url, PHP_URL_PATH), $m)) {
                return ['provider' => 'facebook', 'provider_video_id' => $m[1]];
            }

            return null;
        }

        return null;
    }

    /** Canonical watch URL for a resolved pair (used in share payloads). */
    public static function canonicalUrl(string $provider, string $videoId): ?string
    {
        return match ($provider) {
            'youtube' => 'https://www.youtube.com/watch?v='.$videoId,
            'vimeo' => 'https://vimeo.com/'.$videoId,
            'facebook' => null, // fb URLs are not stable by id alone
            default => null,
        };
    }
}
