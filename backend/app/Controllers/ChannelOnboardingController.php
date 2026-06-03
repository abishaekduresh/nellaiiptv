<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Models\ChannelOnboarding;
use App\Helpers\ResponseFormatter;
use App\Helpers\Validator;
use Ramsey\Uuid\Uuid;
use Exception;

class ChannelOnboardingController
{
    public function submit(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody() ?? [];

        $errors = Validator::validate($data, [
            'required' => [
                ['channel_name'], ['category'], ['language'], ['stream_url'],
                ['contact_name'], ['contact_email'], ['contact_phone'],
            ],
            'email'     => [['contact_email']],
            'url'       => [['stream_url']],
            'lengthMin' => [['channel_name', 2], ['contact_name', 2]],
        ]);

        if ($errors) {
            return ResponseFormatter::error($response, 'Validation failed', 400, $errors);
        }

        $logoUrl = null;

        $uploadedFiles = $request->getUploadedFiles();
        $logoFile      = $uploadedFiles['logo'] ?? null;

        if ($logoFile && $logoFile->getError() === UPLOAD_ERR_OK) {
            $ext      = strtolower(pathinfo($logoFile->getClientFilename(), PATHINFO_EXTENSION));
            $mimeType = $logoFile->getClientMediaType();

            $allowedExts   = ['png', 'webp'];
            $allowedMimes  = ['image/png', 'image/webp'];

            if (!in_array($ext, $allowedExts) || !in_array($mimeType, $allowedMimes)) {
                return ResponseFormatter::error($response, 'Logo must be a .png or .webp file', 400);
            }

            if ($logoFile->getSize() > 1 * 1024 * 1024) {
                return ResponseFormatter::error($response, 'Logo file size must not exceed 1 MB', 400);
            }

            // Write to temp path to check dimensions
            $tmpPath = sys_get_temp_dir() . '/logo_check_' . uniqid() . '.' . $ext;
            $logoFile->moveTo($tmpPath);

            $info = @getimagesize($tmpPath);
            if (!$info || $info[0] !== 1080 || $info[1] !== 1080) {
                @unlink($tmpPath);
                return ResponseFormatter::error($response, 'Logo must be exactly 1080 × 1080 pixels', 400);
            }

            $uploadDir = __DIR__ . '/../../../public/uploads/channel-logos';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0755, true);
            }

            $filename = 'ch_logo_' . time() . '_' . uniqid() . '.' . $ext;
            $destPath = $uploadDir . DIRECTORY_SEPARATOR . $filename;
            rename($tmpPath, $destPath);

            $logoUrl = '/uploads/channel-logos/' . $filename;
        }

        try {
            $entry = new ChannelOnboarding();
            $entry->uuid          = Uuid::uuid4()->toString();
            $entry->channel_name  = trim($data['channel_name']);
            $entry->logo_url      = $logoUrl;
            $entry->category      = trim($data['category']);
            $entry->language      = trim($data['language']);
            $entry->stream_url    = trim($data['stream_url']);
            $entry->website_url   = isset($data['website_url']) ? trim($data['website_url']) : null;
            $entry->contact_name  = trim($data['contact_name']);
            $entry->contact_email = trim($data['contact_email']);
            $entry->contact_phone = trim($data['contact_phone']);
            $entry->description   = isset($data['description']) ? trim($data['description']) : null;
            $entry->status        = 'pending';
            $entry->created_at    = date('Y-m-d H:i:s');
            $entry->save();

            return ResponseFormatter::success(
                $response,
                null,
                'Channel onboarding request submitted successfully. We will review and get back to you.',
                201
            );
        } catch (Exception $e) {
            return ResponseFormatter::error($response, 'Failed to submit request. Please try again.', 500);
        }
    }
}
