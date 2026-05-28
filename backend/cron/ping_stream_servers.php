<?php
/**
 * Cron: ping all active Flussonic stream servers.
 *
 * Schedule this script to run every 1 minute in Windows Task Scheduler
 * (or cPanel / Linux crontab). The script enforces its own interval using
 * the `stream_server_ping_interval` setting stored in the database (minutes).
 *
 * Windows Task Scheduler command:
 *   php C:\wamp64\www\nellaiiptv\backend\cron\ping_stream_servers.php
 *
 * Linux crontab (run every minute, script self-throttles):
 *   * * * * * php /var/www/html/nellaiiptv/backend/cron/ping_stream_servers.php >> /var/log/iptv_ping.log 2>&1
 */

define('BASE_PATH', dirname(__DIR__));

require BASE_PATH . '/vendor/autoload.php';

use Dotenv\Dotenv;
use Illuminate\Database\Capsule\Manager as Capsule;
use App\Models\Setting;
use App\Services\Admin\StreamServerPingService;
use App\Services\Flussonic\FlussonicApiService;

// Load environment variables
$dotenv = Dotenv::createImmutable(BASE_PATH);
$dotenv->load();

date_default_timezone_set('Asia/Kolkata');

// Bootstrap Eloquent ORM
$capsule = new Capsule;
$capsule->addConnection([
    'driver'    => $_ENV['DB_DRIVER']   ?? 'mysql',
    'host'      => $_ENV['DB_HOST']     ?? '127.0.0.1',
    'database'  => $_ENV['DB_DATABASE'] ?? 'nellai_iptv',
    'username'  => $_ENV['DB_USERNAME'] ?? 'root',
    'password'  => $_ENV['DB_PASSWORD'] ?? '',
    'charset'   => 'utf8mb4',
    'collation' => 'utf8mb4_unicode_ci',
    'prefix'    => '',
    'timezone'  => '+05:30',
]);
$capsule->setAsGlobal();
$capsule->bootEloquent();

// Self-throttle: check if enough time has passed since the last successful run
$intervalMinutes = (int)(Setting::get('stream_server_ping_interval', 5));
$lastRun         = Setting::get('stream_server_last_ping_run', null);

if ($lastRun !== null) {
    $elapsedMinutes = (time() - strtotime($lastRun)) / 60;
    if ($elapsedMinutes < $intervalMinutes) {
        echo '[' . date('Y-m-d H:i:s') . "] Skipping: last run was " . round($elapsedMinutes, 1) . " min ago (interval: {$intervalMinutes} min)\n";
        exit(0);
    }
}

echo '[' . date('Y-m-d H:i:s') . "] Starting stream server health check...\n";

// Record run timestamp before pinging so overlapping processes don't double-fire
Setting::set('stream_server_last_ping_run', date('Y-m-d H:i:s'));

// Run pings
$service = new StreamServerPingService(new FlussonicApiService());
$results = $service->pingAll();

echo '[' . date('Y-m-d H:i:s') . "] Done — Total: {$results['total']}, Online: {$results['online']}, Offline: {$results['offline']}\n";

foreach ($results['details'] as $r) {
    $status = strtoupper($r['health_status']);
    $line   = "  [{$status}] {$r['server_name']} ({$r['uuid']})";
    if ($r['error']) {
        $line .= " — " . $r['error'];
    }
    echo $line . "\n";
}
