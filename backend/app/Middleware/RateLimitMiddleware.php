<?php

namespace App\Middleware;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use App\Helpers\ResponseFormatter;
use Slim\Psr7\Response as SlimResponse;

class RateLimitMiddleware implements MiddlewareInterface
{
    private string $storageDir;
    private int $limit;
    private int $window; // seconds

    public function __construct(int $limit = 60, int $window = 60)
    {
        $this->limit = $limit;
        $this->window = $window;
        $this->storageDir = __DIR__ . '/../../storage/cache/ratelimit';
        
        if (!is_dir($this->storageDir)) {
            mkdir($this->storageDir, 0777, true);
        }
    }

    public function process(Request $request, RequestHandler $handler): Response
    {
        // Identify client by IP
        $serverParams = $request->getServerParams();
        $ip = $serverParams['REMOTE_ADDR'] ?? 'unknown';
        
        // Clean old files occasionally (simple garbage collection: 1 in 100 chance)
        if (rand(1, 100) === 1) {
            $this->gc();
        }

        $filename = $this->storageDir . '/' . md5($ip) . '.json';
        $currentTime = time();
        
        $data = ['count' => 0, 'startTime' => $currentTime];
        
        if (file_exists($filename)) {
            $json = file_get_contents($filename);
            $stored = json_decode($json, true);
            if ($stored) {
                if ($currentTime - $stored['startTime'] < $this->window) {
                    $data = $stored;
                }
            }
        }
        
        $data['count']++;
        
        if ($data['count'] > $this->limit) {
            $retryAfter = $this->window - ($currentTime - $data['startTime']);
            $response = new SlimResponse();
            $response = $response->withHeader('Retry-After', (string)$retryAfter);
            return ResponseFormatter::error($response, 'Too Many Requests', 429);
        }
        
        // Save state
        file_put_contents($filename, json_encode($data));

        $response = $handler->handle($request);
        
        // Add headers
        return $response->withHeader('X-RateLimit-Limit', (string)$this->limit)
                        ->withHeader('X-RateLimit-Remaining', (string)($this->limit - $data['count']));
    }

    private function gc()
    {
        $files = glob($this->storageDir . '/*.json');
        $now = time();
        foreach ($files as $file) {
            if ($now - filemtime($file) > $this->window * 2) { // Allow some buffer
                @unlink($file);
            }
        }
    }
}
