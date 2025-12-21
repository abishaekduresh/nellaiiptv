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

            return ResponseFormatter::success($response, null, 'Message sent successfully. We will get back to you soon!', 201);
        } catch (Exception $e) {
            return ResponseFormatter::error($response, 'Failed to send message. Please try again.', 500);
        }
    }
}
