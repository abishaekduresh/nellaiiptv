<?php

namespace App\Controllers\Admin;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Models\ChannelOnboarding;
use App\Helpers\ResponseFormatter;
use Exception;

class ChannelOnboardingController
{
    public function index(Request $request, Response $response): Response
    {
        $params  = $request->getQueryParams();
        $page    = $params['page'] ?? 1;
        $perPage = $params['per_page'] ?? 15;
        $status  = $params['status'] ?? null;

        $query = ChannelOnboarding::orderBy('created_at', 'desc');

        if ($status && in_array($status, ['pending', 'approved', 'rejected'])) {
            $query->where('status', $status);
        }

        $results = $query->paginate($perPage, ['*'], 'page', $page);

        return ResponseFormatter::success($response, $results, 'Channel onboarding requests retrieved successfully');
    }

    public function updateStatus(Request $request, Response $response, string $uuid): Response
    {
        try {
            $entry = ChannelOnboarding::where('uuid', $uuid)->first();
            if (!$entry) {
                return ResponseFormatter::error($response, 'Request not found', 404);
            }

            $data   = $request->getParsedBody() ?? [];
            $status = $data['status'] ?? null;

            if (!in_array($status, ['pending', 'approved', 'rejected'])) {
                return ResponseFormatter::error($response, 'Invalid status value', 400);
            }

            $entry->status      = $status;
            $entry->admin_notes = isset($data['admin_notes']) ? trim($data['admin_notes']) : $entry->admin_notes;
            $entry->save();

            return ResponseFormatter::success($response, null, 'Status updated successfully');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, 'Failed to update status', 500);
        }
    }

    public function delete(Request $request, Response $response, string $uuid): Response
    {
        try {
            $entry = ChannelOnboarding::where('uuid', $uuid)->first();
            if (!$entry) {
                return ResponseFormatter::error($response, 'Request not found', 404);
            }

            $entry->delete();

            return ResponseFormatter::success($response, null, 'Request deleted successfully');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, 'Failed to delete request', 500);
        }
    }
}
