<?php

namespace App\Controllers\Admin;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Models\ApiKey;
use App\Helpers\ResponseFormatter;
use Ramsey\Uuid\Uuid;
use Valitron\Validator;

class ApiKeyController
{
    // List all keys
    public function index(Request $request, Response $response): Response
    {
        $keys = ApiKey::where('status', '!=', 'deleted')
            ->orderBy('created_at', 'desc')
            ->get()
            ->makeVisible(['key_string']); // Admin needs to see keys? Or maybe mask them? Usually show once?
            // For simplicity, we send them. The frontend can mask them.

        return ResponseFormatter::success($response, $keys);
    }

    // Create a new key
    public function create(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();
        $v = new Validator($data);
        $v->rule('required', 'title');
        
        if (!$v->validate()) {
            return ResponseFormatter::error($response, 'Validation Failed', 400, $v->errors());
        }

        // Generate Key
        $keyString = 'nk_' . bin2hex(random_bytes(16));

        try {
            $apiKey = ApiKey::create([
                'uuid' => Uuid::uuid4()->toString(),
                'key_string' => $keyString,
                'title' => $data['title'],
                'description' => $data['description'] ?? null,
                'status' => 'active',
                'allowed_platforms' => isset($data['allowed_platforms']) ? implode(',', $data['allowed_platforms']) : 'web,android,ios,tv',
                'expires_at' => !empty($data['expires_at']) ? date('Y-m-d H:i:s', strtotime($data['expires_at'])) : null,
            ]);
        } catch (\Exception $e) {
            file_put_contents(__DIR__ . '/../../../../api_key_error.log', "Create Error: " . $e->getMessage() . "\n", FILE_APPEND);
            return ResponseFormatter::error($response, 'Create Failed: ' . $e->getMessage(), 500);
        }

        return ResponseFormatter::success($response, $apiKey, 201);
    }

    // Update key
    public function update(Request $request, Response $response, string $uuid): Response
    {
        $apiKey = ApiKey::where('uuid', $uuid)->first();

        if (!$apiKey) {
            return ResponseFormatter::error($response, 'API Key not found', 404);
        }

        $data = $request->getParsedBody();

        if (isset($data['title'])) $apiKey->title = $data['title'];
        if (isset($data['description'])) $apiKey->description = $data['description'];
        if (isset($data['status'])) $apiKey->status = $data['status'];
        if (isset($data['allowed_platforms'])) {
            $apiKey->allowed_platforms = is_array($data['allowed_platforms']) 
                ? implode(',', $data['allowed_platforms']) 
                : $data['allowed_platforms'];
        }
        if (array_key_exists('expires_at', $data)) {
             $apiKey->expires_at = !empty($data['expires_at']) ? date('Y-m-d H:i:s', strtotime($data['expires_at'])) : null;
        }

        try {
            $apiKey->save();
        } catch (\Exception $e) {
            file_put_contents(__DIR__ . '/../../../../api_key_error.log', "Update Error: " . $e->getMessage() . "\n", FILE_APPEND);
            return ResponseFormatter::error($response, 'Update Failed: ' . $e->getMessage(), 500);
        }

        return ResponseFormatter::success($response, $apiKey);
    }

    // Delete (Soft Delete)
    public function delete(Request $request, Response $response, string $uuid): Response
    {
        // Debug Log
        file_put_contents(__DIR__ . '/../../../../delete_debug.log', "Delete requested for: $uuid\n", FILE_APPEND);

        try {
            $apiKey = ApiKey::where('uuid', $uuid)->first();

            if (!$apiKey) {
                file_put_contents(__DIR__ . '/../../../../delete_debug.log', "Key not found\n", FILE_APPEND);
                return ResponseFormatter::error($response, 'API Key not found for UUID: ' . $uuid, 404);
            }

            $apiKey->status = 'deleted';
            $apiKey->save();

            file_put_contents(__DIR__ . '/../../../../delete_debug.log', "Key deleted\n", FILE_APPEND);
            return ResponseFormatter::success($response, ['message' => 'API Key deleted']);
        } catch (\Throwable $e) {
            $msg = $e->getMessage() . "\n" . $e->getTraceAsString();
            file_put_contents(__DIR__ . '/../../../../delete_debug.log', "Exception: $msg\n", FILE_APPEND);
            return ResponseFormatter::error($response, 'Delete Failed: ' . $e->getMessage(), 500);
        }
    }
}
