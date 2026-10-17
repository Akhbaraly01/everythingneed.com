<?php

namespace Tests\Feature;

use Tests\TestCase;

class SecurityHeadersTest extends TestCase
{
    public function test_web_response_carries_security_headers(): void
    {
        $response = $this->get('/login');

        $response->assertOk();
        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $response->assertHeader('X-Frame-Options', 'SAMEORIGIN');
        $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->assertHeader('X-Permitted-Cross-Domain-Policies', 'none');

        $csp = $response->headers->get('Content-Security-Policy');
        $this->assertNotNull($csp);
        $this->assertStringContainsString("default-src 'self'", $csp);
        $this->assertStringContainsString("frame-ancestors 'self'", $csp);
        $this->assertStringContainsString("object-src 'none'", $csp);
        $this->assertStringContainsString("script-src 'self'", $csp);

        // Player embeds stay allowlisted so media never bounces the user
        // out of the app (YouTube/Vimeo/Facebook/TikTok + Jitsi room host).
        $this->assertStringContainsString('frame-src', $csp);
        $this->assertStringContainsString('https://www.youtube-nocookie.com', $csp);
        $this->assertStringContainsString('https://player.vimeo.com', $csp);
        $this->assertStringContainsString('https://www.facebook.com', $csp);
        $this->assertStringContainsString('https://www.tiktok.com', $csp);
        $this->assertStringContainsString('https://meet.jit.si', $csp);

        // Camera/microphone open only for the video-room host.
        $permissions = $response->headers->get('Permissions-Policy');
        $this->assertStringContainsString('camera=(self "https://meet.jit.si")', $permissions);
        $this->assertStringContainsString('microphone=(self "https://meet.jit.si")', $permissions);
        $this->assertStringContainsString('geolocation=()', $permissions);
    }

    public function test_api_response_carries_security_headers(): void
    {
        $response = $this->getJson('/api/health');

        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $response->assertHeader('Content-Security-Policy');
    }

    public function test_hsts_is_not_emitted_over_plain_http(): void
    {
        $response = $this->get('/login');

        $this->assertFalse(
            $response->headers->has('Strict-Transport-Security'),
            'HSTS must only be sent over HTTPS requests.'
        );
    }
}
