<?php

namespace App\Controllers\Admin;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Models\ChannelComment;
use App\Helpers\ResponseFormatter;
use Exception;

class ChannelCommentController
{
    public function index(Request $request, Response $response): Response
    {
        try {
            // Check for customer_id filter
            $queryParams = $request->getQueryParams();
            // Filter out 'deleted' comments
            $query = ChannelComment::with(['customer', 'channel'])
                ->where('status', '!=', 'deleted');

            if (!empty($queryParams['customer_id'])) {
                $query->where('customer_id', $queryParams['customer_id']);
            }
            
            if (!empty($queryParams['channel_id'])) {
                $query->where('channel_id', $queryParams['channel_id']);
            }

            $comments = $query->orderBy('created_at', 'desc')->get();
            
            return ResponseFormatter::success($response, $comments, 'Comments retrieved successfully');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 500);
        }
    }

    public function delete(Request $request, Response $response, string $uuid): Response
    {
        try {
            $comment = ChannelComment::where('uuid', $uuid)->first();
            
            if (!$comment) {
                return ResponseFormatter::error($response, 'Comment not found', 404);
            }

            // Soft delete: Update status to 'deleted'
            $comment->status = 'deleted';
            $comment->save();
            
            return ResponseFormatter::success($response, null, 'Comment deleted successfully');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 500);
        }
    }

    public function updateStatus(Request $request, Response $response, string $uuid): Response
    {
        try {
            $comment = ChannelComment::where('uuid', $uuid)->first();
            
            if (!$comment) {
                return ResponseFormatter::error($response, 'Comment not found', 404);
            }

            $currentStatus = $comment->status;
            $newStatus = ($currentStatus === 'active') ? 'inactive' : 'active';
            
            $comment->status = $newStatus;
            $comment->save();
            
            return ResponseFormatter::success($response, ['status' => $newStatus], 'Comment status updated successfully');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 500);
        }
    }
}
