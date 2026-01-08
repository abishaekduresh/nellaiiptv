<?php

namespace App\Services;

use App\Models\CustomerActivityLog;

class ActivityLogger
{
    /**
     * Log a customer activity.
     *
     * @param string $customerUuid
     * @param string $type Activity type (LOGIN, LOGOUT, etc.)
     * @param string $description Description of the activity
     * @param array $context Additional context (ip_address, user_agent, platform)
     * @return void
     */
    public function log(int $customerId, string $type, string $description, array $context = [])
    {
        try {
            CustomerActivityLog::create([
                'customer_id' => $customerId,
                'activity_type' => $type,
                'description' => $description,
                'ip_address' => $context['ip_address'] ?? null,
                'user_agent' => $context['user_agent'] ?? null,
                'platform' => $context['platform'] ?? null,
                'created_at' => date('Y-m-d H:i:s')
            ]);
        } catch (\Exception $e) {
            // Silently fail logging to avoid disrupting the main flow
            error_log("Failed to log activity: " . $e->getMessage());
        }
    }
}
