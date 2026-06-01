<?php

namespace App\Middleware;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use App\Helpers\ResponseFormatter;
use Slim\Psr7\Response as SlimResponse;

class CronSecretMiddleware implements MiddlewareInterface
{
    public function process(Request $request, RequestHandler $handler): Response
    {
        // DB setting takes precedence over env var so admin can rotate without a deploy
        $dbSecret = \App\Models\Setting::get('cron_secret', '');
        $expected = ($dbSecret !== '') ? $dbSecret : ($_ENV['CRON_SECRET'] ?? '');

        if ($expected === '') {
            return ResponseFormatter::error(new SlimResponse(), 'Cron secret not configured. Generate one in Settings → Cron Keys.', 500);
        }

        // Accept secret via X-Cron-Secret header OR ?secret= query param
        $provided = $request->getHeaderLine('X-Cron-Secret');

        if ($provided === '') {
            $provided = $request->getQueryParams()['secret'] ?? '';
        }

        if (!hash_equals($expected, $provided)) {
            return ResponseFormatter::error(new SlimResponse(), 'Unauthorized: invalid cron secret.', 401);
        }

        return $handler->handle($request);
    }
}
