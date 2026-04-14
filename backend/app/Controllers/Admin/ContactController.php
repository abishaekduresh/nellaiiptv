<?php

namespace App\Controllers\Admin;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Models\ContactMessage;
use App\Helpers\ResponseFormatter;
use Exception;

class ContactController
{
    /**
     * List all contact messages with pagination
     */
    public function index(Request $request, Response $response): Response
    {
        $page = $request->getQueryParams()['page'] ?? 1;
        $perPage = $request->getQueryParams()['per_page'] ?? 10;

        $messages = ContactMessage::orderBy('created_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);

        return ResponseFormatter::success($response, $messages, 'Contact messages retrieved successfully');
    }

    /**
     * Delete a contact message
     */
    public function delete(Request $request, Response $response, string $uuid): Response
    {
        try {
            $message = ContactMessage::where('uuid', $uuid)->first();

            if (!$message) {
                return ResponseFormatter::error($response, 'Message not found', 404);
            }

            $message->delete();

            return ResponseFormatter::success($response, null, 'Message deleted successfully');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, 'Failed to delete message', 500);
        }
    }
}
