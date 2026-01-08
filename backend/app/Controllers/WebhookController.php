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
        // 1. Verify Signature (in production)
        // For now, we'll assume it's valid or relying on a secret path if needed.
        // Resend uses a symmetric secret for verifying signatures.
        
        $data = $request->getParsedBody();
        $type = $data['type'] ?? null;
        
        // Example payload structure:
        // {
        //   "type": "email.delivered",
        //   "created_at": "2023-01-01T00:00:00.000Z",
        //   "data": {
        //     "created_at": "2023-01-01T00:00:00.000Z",
        //     "email_id": "...",
        //     "from": "...",
        //     "to": ["..."],
        //     "subject": "..."
        //   }
        // }

        if (!$type || !isset($data['data']['email_id'])) {
            return ResponseFormatter::success($response, null, 'Ignored: No type or email_id');
        }

        $emailId = $data['data']['email_id'];
        
        // Map event type to status
        // email.sent -> sent
        // email.delivered -> delivered
        // email.bounced -> bounced
        // email.complained -> complained
        // email.clicked -> clicked
        // email.opened -> opened

        $status = str_replace('email.', '', $type);

        try {
            $log = EmailLog::where('provider_id', $emailId)->first();
            
            if ($log) {
                $log->status = $status;
                
                // Merge metadata if needed, or just append generic info
                $currentMeta = $log->metadata ?? [];
                $currentMeta['events'][] = [
                    'type' => $type,
                    'timestamp' => date('Y-m-d H:i:s')
                ];
                $log->metadata = $currentMeta;
                
                $log->save();
                return ResponseFormatter::success($response, null, "Updated status to $status");
            } else {
                // Could be an email sent from elsewhere or before logging was active
                // Optionally create a new log entry if critical
                return ResponseFormatter::success($response, null, 'Email ID not found in logs');
            }

        } catch (Exception $e) {
            error_log("Webhook Error: " . $e->getMessage());
            return ResponseFormatter::error($response, $e->getMessage(), 500);
        }
    }
}
