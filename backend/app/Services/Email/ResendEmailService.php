<?php

namespace App\Services\Email;

use Resend; // Use global class if available, or just remove if fully qualified below
use Exception;

class ResendEmailService implements EmailServiceInterface
{
    private $resend;
    private $fromEmail;
    private bool $skipSsl = false;
    private string $apiKey = '';

    public function __construct()
    {
        $apiKey = $_ENV['RESEND_EMAIL_API_KEY'] ?? $_ENV['RESEND_API_KEY'] ?? getenv('RESEND_EMAIL_API_KEY') ?? getenv('RESEND_API_KEY') ?? null;
        if (!$apiKey) {
            throw new Exception("Resend API Key is not set in environment (Checked RESEND_EMAIL_API_KEY and RESEND_API_KEY)");
        }
        
        // Check for SSL bypass in development (Checking both $_ENV and getenv)
        $skipSslEnv = $_ENV['RESEND_SKIP_SSL'] ?? getenv('RESEND_SKIP_SSL') ?? 'false';
        $skipSsl = ($skipSslEnv === 'true' || $skipSslEnv === true || $skipSslEnv === '1');
        
        error_log("ResendEmailService: SSL Bypass Active: " . ($skipSsl ? "YES" : "NO"));
        
        // Resend::client() does not accept a custom HTTP client — the second arg is ignored.
        // When SSL bypass is needed (WAMP/local dev with broken cacert.pem), we call the
        // Resend REST API directly via cURL so we can control SSL verification ourselves.
        $this->resend = $skipSsl ? null : Resend::client($apiKey);
        $this->skipSsl = $skipSsl;
        $this->apiKey  = $apiKey;
        
        $this->fromEmail = $_ENV['MAIL_FROM_ADDRESS'] ?? getenv('MAIL_FROM_ADDRESS') ?? 'onboarding@resend.dev';
    }

    // Calls the Resend REST API directly via cURL (SSL verification disabled).
    // Used only when RESEND_SKIP_SSL=true — for local dev with broken cacert.pem.
    private function sendViaCurl(string $to, string $subject, string $html): string
    {
        $payload = json_encode([
            'from'    => $this->fromEmail,
            'to'      => [$to],
            'subject' => $subject,
            'html'    => $html,
        ]);

        $ch = curl_init('https://api.resend.com/emails');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $payload,
            CURLOPT_SSL_VERIFYPEER => false,   // bypass broken cacert.pem on WAMP
            CURLOPT_SSL_VERIFYHOST => false,
            CURLOPT_TIMEOUT        => 30,
            CURLOPT_HTTPHEADER     => [
                'Authorization: Bearer ' . $this->apiKey,
                'Content-Type: application/json',
            ],
        ]);

        $response = curl_exec($ch);
        $errno    = curl_errno($ch);
        $error    = curl_error($ch);
        curl_close($ch);

        if ($errno) {
            throw new Exception("cURL error {$errno}: {$error}");
        }

        $decoded = json_decode($response, true);
        if (isset($decoded['statusCode']) && $decoded['statusCode'] >= 400) {
            throw new Exception("Resend API error: " . ($decoded['message'] ?? $response));
        }

        return $decoded['id'] ?? 'unknown';
    }

    public function send(string $to, string $subject, string $html): bool
    {
        error_log("ResendEmailService: Attempting to send email to " . $to);
        try {
            $emailId = null;

            if ($this->skipSsl) {
                // Direct cURL path — SSL verification disabled for local dev
                $emailId = $this->sendViaCurl($to, $subject, $html);
            } else {
                $result  = $this->resend->emails->send([
                    'from'    => $this->fromEmail,
                    'to'      => $to,
                    'subject' => $subject,
                    'html'    => $html,
                ]);
                $emailId = $result->id ?? null;
            }

            error_log("ResendEmailService: Resend API success. ID: " . ($emailId ?? 'unknown'));
            
            // Log to database
            $providerId = $emailId;

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

            // Rethrow so the caller can see the actual error message
            throw $e;
        }
    }
}
