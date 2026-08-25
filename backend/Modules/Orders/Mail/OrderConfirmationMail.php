<?php

namespace Modules\Orders\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OrderConfirmationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $orderNumber,
        public float $total,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Order {$this->orderNumber} confirmed",
        );
    }

    public function content(): Content
    {
        return new Content(
            text: 'emails.orders.confirmation',
            with: [
                'orderNumber' => $this->orderNumber,
                'total' => number_format($this->total, 2),
            ],
        );
    }
}
