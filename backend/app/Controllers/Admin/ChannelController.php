<?php

namespace App\Controllers\Admin;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Services\Admin\ChannelService;
use App\Helpers\ResponseFormatter;
use App\Helpers\Validator;
use Exception;

class ChannelController
{
    private $channelService;

    public function __construct(ChannelService $channelService)
    {
        $this->channelService = $channelService;
    }

    public function index(Request $request, Response $response): Response
    {
        $filters = $request->getQueryParams();
        try {
            $channels = $this->channelService->getAll($filters);
            return ResponseFormatter::success($response, $channels, 'Channels retrieved successfully');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 500);
        }
    }

    private function handleUpload($file, $directory)
    {
        if ($file->getError() === UPLOAD_ERR_OK) {
            $extension = pathinfo($file->getClientFilename(), PATHINFO_EXTENSION);
            // Sanitize and rename: timestamp_random.ext
            $filename = time() . '_' . bin2hex(random_bytes(8)) . '.' . $extension;
            
            // Ensure directory exists
            $path = __DIR__ . '/../../../public' . $directory;
            if (!file_exists($path)) {
                mkdir($path, 0777, true);
            }
            $file->moveTo($path . '/' . $filename);
            

            
            // Return relative path for database storage
            return "$directory/$filename";
        }
        return null;
    }

    public function create(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody() ?? [];
        $uploadedFiles = $request->getUploadedFiles();

        // Handle File Uploads
        if (isset($uploadedFiles['thumbnail']) && $uploadedFiles['thumbnail']->getError() === UPLOAD_ERR_OK) {
            $data['thumbnail_url'] = $this->handleUpload($uploadedFiles['thumbnail'], '/uploads/channel/thumbnails');
        }
        
        if (isset($uploadedFiles['logo']) && $uploadedFiles['logo']->getError() === UPLOAD_ERR_OK) {
            $data['logo_url'] = $this->handleUpload($uploadedFiles['logo'], '/uploads/channel/logos');
        }

        $rules = [
            'required' => [['name'], ['hls_url']],
            'optional' => [['allowed_platforms']]
        ];

        $errors = Validator::validate($data, $rules);
        if ($errors) return ResponseFormatter::error($response, 'Validation failed', 400, $errors);

        try {
            $channel = $this->channelService->create($data);
            return ResponseFormatter::success($response, $channel, 'Channel created successfully', 201);
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 500);
        }
    }

    public function show(Request $request, Response $response, string $uuid): Response
    {
        try {
            $channel = $this->channelService->getOne($uuid);
            return ResponseFormatter::success($response, $channel, 'Channel retrieved successfully');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, 'Channel not found', 404);
        }
    }

    private function deleteFile($relativePath)
    {
        if (empty($relativePath)) return;
        
        $baseDir = __DIR__ . '/../../../public';
        // Construct full path - simplistic check, realpath better but just use known structure
        $fullPath = $baseDir . $relativePath;
        
        if (file_exists($fullPath) && is_file($fullPath)) {
            @unlink($fullPath);
        }
    }

    public function update(Request $request, Response $response, string $uuid): Response
    {
        $data = $request->getParsedBody() ?? [];
        $uploadedFiles = $request->getUploadedFiles();

        unset($data['thumbnail_url']);
        unset($data['logo_url']);

        // Fetch old data for cleanup
        try {
            $oldChannel = $this->channelService->getOne($uuid);
            // Access raw attributes directly to bypass Accessor (which adds domain)
            $oldThumbnail = $oldChannel->getAttributes()['thumbnail_url'] ?? null;
            $oldLogo = $oldChannel->getAttributes()['logo_url'] ?? null;
        } catch (\Exception $e) {
            $oldThumbnail = null;
            $oldLogo = null;
        }

        try {
            // Handle File Uploads
            if (isset($uploadedFiles['thumbnail']) && $uploadedFiles['thumbnail']->getError() === UPLOAD_ERR_OK) {
                $data['thumbnail_url'] = $this->handleUpload($uploadedFiles['thumbnail'], '/uploads/channel/thumbnails');
            }
            
            if (isset($uploadedFiles['logo']) && $uploadedFiles['logo']->getError() === UPLOAD_ERR_OK) {
                $data['logo_url'] = $this->handleUpload($uploadedFiles['logo'], '/uploads/channel/logos');
            }

            $channel = $this->channelService->update($uuid, $data);

            // Cleanup Old Files if replaced
            if (isset($data['thumbnail_url']) && $oldThumbnail && $oldThumbnail !== $data['thumbnail_url']) {
                $this->deleteFile($oldThumbnail);
            }
            if (isset($data['logo_url']) && $oldLogo && $oldLogo !== $data['logo_url']) {
                $this->deleteFile($oldLogo);
            }

            return ResponseFormatter::success($response, $channel, 'Channel updated successfully');
        } catch (\Throwable $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 500);
        }
    }

    public function delete(Request $request, Response $response, string $uuid): Response
    {
        try {
            $this->channelService->delete($uuid);
            return ResponseFormatter::success($response, null, 'Channel deleted successfully');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 500);
        }
    }
    public function getAnalytics(Request $request, Response $response, string $uuid): Response
    {
        try {
            $data = $this->channelService->getAnalytics($uuid);
            return ResponseFormatter::success($response, $data, 'Channel analytics retrieved successfully');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 500);
        }
    }
}
