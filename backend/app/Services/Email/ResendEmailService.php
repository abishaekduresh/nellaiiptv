<?php

namespace App\Services\Email;

use Resend; // Use global class if available, or just remove if fully qualified below
use Exception;

class ResendEmailService implements EmailServiceInterface
{
    private $resend;
    private $fromEmail;

    public function __construct()
    {
        $apiKey = $_ENV['RESEND_EMAIL_API_KEY'] ?? null;
        if (!$apiKey) {
            throw new Exception("RESEND_EMAIL_API_KEY is not set in environment");
        }
        $this->resend = \Resend::client($apiKey);
        $this->fromEmail = $_ENV['MAIL_FROM_ADDRESS'] ?? 'onboarding@resend.dev';
    }

    public function send(string $to, string $subject, string $html): bool
    {
        try {
            $result = $this->resend->emails->send([
                'from' => $this->fromEmail,
                'to' => $to,
                'subject' => $subject,
                'html' => $html,
            ]);
            
            // Log to database
            $providerId = $result->id ?? null;
            
            // Try to find customer ID from email
            $customer = \App\Models\Customer::where('email', $to)->first();
            $customerId = $customer ? $customer->id : null;

            \App\Models\EmailLog::create([
                'customer_id' => $customerId,
                'recipient' => $to,
                'subject' => $subject,
                'provider_id' => $providerId,
                'status' => 'sent',
                'metadata' => ['provider' => 'resend']
            ]);

            return true;
        } catch (Exception $e) {
            error_log("Resend Error: " . $e->getMessage());
            
            // Log failure
            $customer = \App\Models\Customer::where('email', $to)->first();
            \App\Models\EmailLog::create([
                'customer_id' => $customer ? $customer->id : null,
                'recipient' => $to,
                'subject' => $subject,
                'status' => 'failed',
                'metadata' => ['error' => $e->getMessage()]
            ]);

            return false;
        }
    }
}
