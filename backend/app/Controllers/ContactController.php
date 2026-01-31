<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Models\ContactMessage;
use App\Helpers\ResponseFormatter;
use App\Helpers\Validator;
use Ramsey\Uuid\Uuid;
use Exception;

class ContactController
{
    public function submit(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody() ?? [];

        $errors = Validator::validate($data, [
            'required' => [['name'], ['email'], ['subject'], ['message']],
            'email' => [['email']],
            'lengthMin' => [['name', 2], ['subject', 3], ['message', 10]]
        ]);

        if ($errors) {
            return ResponseFormatter::error($response, 'Validation failed', 400, $errors);
        }

        try {
            $message = new ContactMessage();
            $message->uuid = Uuid::uuid4()->toString();
            $message->name = trim($data['name']);
            $message->email = trim($data['email']);
            $message->subject = trim($data['subject']);
            $message->message = trim($data['message']);
            $message->status = 'new';
            $message->save();

            // Optional Webhook Trigger
            try {
                $webhookUrl = \App\Models\Setting::get('contact_webhook_url');
                if ($webhookUrl && filter_var($webhookUrl, FILTER_VALIDATE_URL)) {
                    $client = new \GuzzleHttp\Client(['timeout' => 5, 'verify' => false]);
                    $client->post($webhookUrl, [
                        'json' => [
                            'event' => 'contact_form_submission',
                            'data' => [
                                'name' => $message->name,
                                'email' => $message->email,
                                'subject' => $message->subject,
                                'message' => $message->message,
                                'created_at' => $message->created_at->toIso8601String()
                            ]
                        ]
                    ]);
                }
            } catch (\Exception $e) {
                // Log error but don't fail the request
                // error_log("Contact webhook failed: " . $e->getMessage());
            }

            return ResponseFormatter::success($response, null, 'Message sent successfully. We will get back to you soon!', 201);
        } catch (Exception $e) {
            // return ResponseFormatter::error($response, 'Failed to send message: ' . $e->getMessage(), 500);
            return ResponseFormatter::error($response, 'Failed to send message. Please try again.', 500);
        }
    }
}
