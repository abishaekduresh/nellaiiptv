<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Helpers\ResponseFormatter;
use App\Models\EmailLog;
use Exception;

class WebhookController
{
    public function handleResend(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();
        $type = $data['type'] ?? null;

        if (!$type || !isset($data['data']['email_id'])) {
            return ResponseFormatter::success($response, null, 'Ignored: No type or email_id');
        }

        $emailId = $data['data']['email_id'];
        $status = str_replace('email.', '', $type);

        try {
            $log = EmailLog::where('provider_id', $emailId)->first();

            if ($log) {
                $log->status = $status;
                $currentMeta = $log->metadata ?? [];
                $currentMeta['events'][] = [
                    'type' => $type,
                    'timestamp' => date('Y-m-d H:i:s')
                ];
                $log->metadata = $currentMeta;
                $log->save();
                return ResponseFormatter::success($response, null, "Updated status to $status");
            }
            return ResponseFormatter::success($response, null, 'Email ID not found in logs');

        } catch (Exception $e) {
            error_log("Webhook Error: " . $e->getMessage());
            return ResponseFormatter::error($response, $e->getMessage(), 500);
        }
    }
}
