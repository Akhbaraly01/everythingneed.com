<?php

namespace Modules\Authentication\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ResetPasswordMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $token,
        public string $name,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Reset your EverythingNeed password',
        );
    }

    public function content(): Content
    {
        return new Content(
            text: 'emails.auth.reset-password',
            with: [
                'token' => $this->token,
                'name' => $this->name,
            ],
        );
    }
}
