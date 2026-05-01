<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Models\Feedback;
use App\Models\Customer;
use App\Helpers\ResponseFormatter;
use Ramsey\Uuid\Uuid;
use Exception;

class FeedbackController
{
    private const ALLOWED_FEEDBACK_TYPES = ['general', 'bug', 'feature_request', 'channel_issue', 'subscription'];
    private const ALLOWED_ISSUE_TYPES = [
        'stream_not_working',
        'buffering_frequently',
        'audio_issue',
        'video_quality_issue',
        'wrong_channel',
        'other',
    ];

    public function submit(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody() ?? [];
        $platform = strtolower($request->getHeaderLine('X-Client-Platform') ?: 'web');

        // Resolve optional customer
        $customerId = null;
        $user = $request->getAttribute('user');
        if ($user && isset($user->sub)) {
            $customer = Customer::where('uuid', $user->sub)->first();
            if ($customer) {
                $customerId = $customer->id;
            }
        }

        // Validate feedback_type
        $feedbackType = trim($data['feedback_type'] ?? '');
        if (empty($feedbackType)) {
            return ResponseFormatter::error($response, 'Validation failed', 400, ['feedback_type' => ['Feedback type is required.']]);
        }
        if (!in_array($feedbackType, self::ALLOWED_FEEDBACK_TYPES)) {
            return ResponseFormatter::error($response, 'Validation failed', 400, [
                'feedback_type' => ['Invalid feedback type. Allowed: ' . implode(', ', self::ALLOWED_FEEDBACK_TYPES)]
            ]);
        }

        // Validate rating (optional, 1-5)
        $rating = null;
        if (isset($data['rating']) && $data['rating'] !== '' && $data['rating'] !== null) {
            $rating = (int) $data['rating'];
            if ($rating < 1 || $rating > 5) {
                return ResponseFormatter::error($response, 'Validation failed', 400, ['rating' => ['Rating must be between 1 and 5.']]);
            }
        }

        // Validate issue_type when feedback_type is channel_issue
        $issueType = null;
        if ($feedbackType === 'channel_issue') {
            $issueType = trim($data['issue_type'] ?? '');
            if (empty($issueType)) {
                return ResponseFormatter::error($response, 'Validation failed', 400, ['issue_type' => ['Issue type is required for channel issues.']]);
            }
            if (!in_array($issueType, self::ALLOWED_ISSUE_TYPES)) {
                return ResponseFormatter::error($response, 'Validation failed', 400, [
                    'issue_type' => ['Invalid issue type. Allowed: ' . implode(', ', self::ALLOWED_ISSUE_TYPES)]
                ]);
            }
        }

        // Validate message
        $message = trim($data['message'] ?? '');
        if (empty($message)) {
            return ResponseFormatter::error($response, 'Validation failed', 400, ['message' => ['Message is required.']]);
        }
        if (strlen($message) < 5) {
            return ResponseFormatter::error($response, 'Validation failed', 400, ['message' => ['Message must be at least 5 characters.']]);
        }

        try {
            $feedback = new Feedback();
            $feedback->uuid        = Uuid::uuid4()->toString();
            $feedback->customer_id = $customerId;
            $feedback->feedback_type = $feedbackType;
            $feedback->rating      = $rating;
            $feedback->issue_type  = $issueType;
            $feedback->message     = $message;
            $feedback->platform    = $platform;
            $feedback->status      = 'new';
            $feedback->created_at  = date('Y-m-d H:i:s');
            $feedback->save();

            return ResponseFormatter::success($response, [
                'uuid'          => $feedback->uuid,
                'feedback_type' => $feedback->feedback_type,
                'rating'        => $feedback->rating,
                'issue_type'    => $feedback->issue_type,
                'platform'      => $feedback->platform,
                'status'        => $feedback->status,
                'created_at'    => $feedback->created_at,
            ], 'Thank you for your feedback!', 201);
        } catch (Exception $e) {
            return ResponseFormatter::error($response, 'Failed to submit feedback. Please try again.', 500);
        }
    }
}
