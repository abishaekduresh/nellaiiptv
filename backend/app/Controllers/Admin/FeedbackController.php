<?php

namespace App\Controllers\Admin;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Models\Feedback;
use App\Helpers\ResponseFormatter;
use Exception;

class FeedbackController
{
    private const ALLOWED_STATUSES = ['new', 'reviewed', 'resolved'];

    public function index(Request $request, Response $response): Response
    {
        $params = $request->getQueryParams();
        $page    = (int) ($params['page'] ?? 1);
        $perPage = (int) ($params['per_page'] ?? 15);

        $query = Feedback::with(['customer:id,uuid,name,email,phone'])
            ->orderBy('created_at', 'desc');

        if (!empty($params['status'])) {
            $query->where('status', $params['status']);
        }
        if (!empty($params['feedback_type'])) {
            $query->where('feedback_type', $params['feedback_type']);
        }
        if (!empty($params['platform'])) {
            $query->where('platform', $params['platform']);
        }
        if (!empty($params['rating'])) {
            $query->where('rating', (int) $params['rating']);
        }

        $data = $query->paginate($perPage, ['*'], 'page', $page);

        return ResponseFormatter::success($response, $data, 'Feedback retrieved successfully');
    }

    public function updateStatus(Request $request, Response $response, string $uuid): Response
    {
        $body   = $request->getParsedBody() ?? [];
        $status = trim($body['status'] ?? '');

        if (!in_array($status, self::ALLOWED_STATUSES)) {
            return ResponseFormatter::error($response, 'Invalid status. Allowed: ' . implode(', ', self::ALLOWED_STATUSES), 400);
        }

        $feedback = Feedback::where('uuid', $uuid)->first();
        if (!$feedback) {
            return ResponseFormatter::error($response, 'Feedback not found', 404);
        }

        $feedback->status = $status;
        $feedback->save();

        return ResponseFormatter::success($response, null, 'Status updated successfully');
    }

    public function delete(Request $request, Response $response, string $uuid): Response
    {
        try {
            $feedback = Feedback::where('uuid', $uuid)->first();
            if (!$feedback) {
                return ResponseFormatter::error($response, 'Feedback not found', 404);
            }
            $feedback->delete();
            return ResponseFormatter::success($response, null, 'Feedback deleted successfully');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, 'Failed to delete feedback', 500);
        }
    }
}
