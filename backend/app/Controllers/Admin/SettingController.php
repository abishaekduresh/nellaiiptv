<?php

namespace App\Controllers\Admin;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Models\Setting;
use App\Helpers\ResponseFormatter;
use Slim\Routing\RouteContext;
use GuzzleHttp\Client as HttpClient;
use Exception;

class SettingController
{
    public function index(Request $request, Response $response): Response
    {
        $settings = Setting::all();
        
        // Transform logo_url to absolute URL for admin display
        $settings->transform(function($setting) use ($request) {
            if ($setting->setting_key === 'logo_url' && strpos($setting->setting_value, '/uploads/') === 0) {
                // Check for explicit APP_URL in environment first
                $appUrl = $_ENV['APP_URL'] ?? getenv('APP_URL') ?? $_SERVER['APP_URL'] ?? null;
                if (!empty($appUrl)) {
                    $baseUrl = rtrim($appUrl, '/');
                    $setting->setting_value = $baseUrl . $setting->setting_value;
                } else {
                    // Fallback to auto-detection (best effort for admin)
                    $uri = $request->getUri();
                    $routeContext = RouteContext::fromRequest($request);
                    $basePath = $routeContext->getBasePath();
                    $scheme = $uri->getScheme();
                    $authority = $uri->getAuthority();
                    $base = ($basePath === '/' || $basePath === '') ? '' : $basePath;
                    $setting->setting_value = $scheme . '://' . $authority . $base . $setting->setting_value;
                }
            }
            return $setting;
        });

        return ResponseFormatter::success($response, $settings);
    }

    public function update(Request $request, Response $response, string $key): Response
    {
        $data = $request->getParsedBody() ?? [];

        try {
            if (!isset($data['value'])) {
                throw new Exception('Value is required');
            }

            $value = $data['value'];
            
            // Handle boolean settings that might come as strings from FormData/JSON
            if ($key === 'is_open_access' || $key === 'maintenance_mode') {
                $value = filter_var($value, FILTER_VALIDATE_BOOLEAN) ? '1' : '0';
            }

            Setting::set($key, $value);
            $setting = Setting::where('setting_key', $key)->first();
            
            return ResponseFormatter::success($response, $setting, 'Setting updated');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 400);
        }
    }

    public function getDisclaimer(Request $request, Response $response): Response
    {
        $disclaimer = Setting::get('disclaimer_text', '');
        return ResponseFormatter::success($response, ['disclaimer' => $disclaimer]);
    }

    /**
     * Return a valid CA bundle path, or false to skip verification (dev only).
     * Handles broken WAMP cacert paths like "C:/wamp64/bin/php/php<your_version>/...".
     */
    /**
     * Return a valid CA bundle path, or false to skip verification (dev fallback).
     * Handles broken WAMP cacert paths like "C:/wamp64/bin/php/php<your_version>/...".
     */
    private function resolveCaBundle(): string|bool
    {
        $vendorDir = dirname(__DIR__, 4) . '/vendor';

        // 1. Vendored CA certs that are already on disk
        $candidates = [
            $vendorDir . '/rmccue/requests/certificates/cacert.pem',
            $vendorDir . '/razorpay/razorpay/libs/Requests-2.0.4/certificates/cacert.pem',
            $vendorDir . '/composer/ca-bundle/res/cacert.pem',
        ];
        foreach ($candidates as $ca) {
            if (file_exists($ca)) return realpath($ca);
        }

        // 2. php.ini curl.cainfo — only if the file actually exists
        $iniCa = ini_get('curl.cainfo');
        if ($iniCa && file_exists($iniCa)) return $iniCa;

        // 3. WAMP glob across PHP versions
        foreach (glob('C:/wamp64/bin/php/php*/extras/ssl/cacert.pem') ?: [] as $f) {
            if (file_exists($f)) return $f;
        }

        // 4. Dev fallback: disable verification
        return false;
    }

    public function uploadLogo(Request $request, Response $response): Response
    {
        $uploadedFiles = $request->getUploadedFiles(); // PSR-7
        $uploadedFile = $uploadedFiles['logo'] ?? null;

        if (!$uploadedFile || $uploadedFile->getError() !== UPLOAD_ERR_OK) {
            return ResponseFormatter::error($response, 'No valid file uploaded', 400);
        }

        $extension = pathinfo($uploadedFile->getClientFilename(), PATHINFO_EXTENSION);
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'svg', 'webp'];
        
        if (!in_array(strtolower($extension), $allowedExtensions)) {
            return ResponseFormatter::error($response, 'Invalid file type. Allowed: jpg, png, svg, webp', 400);
        }

        // Define upload directory
        $directory = __DIR__ . '/../../../public/uploads/branding';
        if (!is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        $filename = 'logo_' . time() . '.' . $extension;
        $path = $directory . DIRECTORY_SEPARATOR . $filename;

        try {
            $uploadedFile->moveTo($path);
            
             $relativeUrl = '/uploads/branding/' . $filename;
             $logoUrl = $relativeUrl;

            $appUrl = $_ENV['APP_URL'] ?? getenv('APP_URL') ?? $_SERVER['APP_URL'] ?? null;
            if (!empty($appUrl)) {
                $baseUrl = rtrim($appUrl, '/');
                $logoUrl = $baseUrl . $relativeUrl;
            } else {
                 $uri = $request->getUri();
                 $routeContext = RouteContext::fromRequest($request);
                 $basePath = $routeContext->getBasePath();
                 $scheme = $request->getHeaderLine('X-Forwarded-Proto') ?: $uri->getScheme();
                 $authority = $request->getHeaderLine('X-Forwarded-Host') ?: $uri->getAuthority();
                 $base = ($basePath === '/' || $basePath === '') ? '' : $basePath;
                 if (empty($authority)) $authority = 'localhost';
                 
                 $logoUrl = $scheme . '://' . $authority . $base . $relativeUrl;
            }

            // Update Setting with PATH ONLY
            Setting::set('logo_path', $relativeUrl);

            return ResponseFormatter::success($response, ['url' => $logoUrl, 'path' => $relativeUrl], 'Logo uploaded successfully');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, 'Failed to upload logo: ' . $e->getMessage(), 500);
        }
    }
    public function testPayment(Request $request, Response $response): Response
    {
        $data    = $request->getParsedBody() ?? [];
        $gateway = $data['gateway'] ?? '';
        $amount  = (int)($data['amount'] ?? 100); // paise

        if ($amount < 100) {
            return ResponseFormatter::error($response, 'Minimum amount is ₹1 (100 paise)', 400);
        }

        // Resolve CA bundle — WAMP sometimes ships with a broken cacert path in php.ini
        $caBundle = $this->resolveCaBundle();
        $httpOpts = ['timeout' => 15, 'verify' => $caBundle];

        try {
            if ($gateway === 'razorpay') {
                $keyId     = trim($_ENV['RAZORPAY_KEY_ID']     ?? getenv('RAZORPAY_KEY_ID')     ?? '');
                $keySecret = trim($_ENV['RAZORPAY_KEY_SECRET'] ?? getenv('RAZORPAY_KEY_SECRET') ?? '');

                if (!$keyId || !$keySecret) {
                    return ResponseFormatter::error($response, 'Razorpay credentials not set in .env (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)', 422);
                }

                $client = new HttpClient($httpOpts);
                $res = $client->post('https://api.razorpay.com/v1/orders', [
                    'auth' => [$keyId, $keySecret],
                    'json' => [
                        'amount'   => $amount,
                        'currency' => 'INR',
                        'receipt'  => 'test_' . time(),
                    ],
                ]);

                $order = json_decode((string)$res->getBody(), true);

                return ResponseFormatter::success($response, [
                    'gateway'  => 'razorpay',
                    'key_id'   => $keyId,
                    'order_id' => $order['id'],
                    'amount'   => $amount,
                    'currency' => 'INR',
                ], 'Razorpay test order created');
            }

            if ($gateway === 'cashfree') {
                $appId       = trim($_ENV['CASHFREE_APP_ID']    ?? getenv('CASHFREE_APP_ID')    ?? '');
                $secretKey   = trim($_ENV['CASHFREE_SECRET_KEY'] ?? getenv('CASHFREE_SECRET_KEY') ?? '');
                $environment = trim($_ENV['CASHFREE_MODE']       ?? getenv('CASHFREE_MODE')       ?? 'production');

                if (!$appId || !$secretKey) {
                    return ResponseFormatter::error($response, 'Cashfree credentials not set in .env (CASHFREE_APP_ID, CASHFREE_SECRET_KEY)', 422);
                }

                $baseUrl = $environment === 'sandbox'
                    ? 'https://sandbox.cashfree.com/pg'
                    : 'https://api.cashfree.com/pg';

                $client = new HttpClient($httpOpts);
                $res = $client->post("$baseUrl/orders", [
                    'headers' => [
                        'x-api-version'  => '2023-08-01',
                        'x-client-id'    => $appId,
                        'x-client-secret'=> $secretKey,
                        'Content-Type'   => 'application/json',
                    ],
                    'json' => [
                        'order_id'       => 'test_' . time(),
                        'order_amount'   => round($amount / 100, 2),
                        'order_currency' => 'INR',
                        'customer_details' => [
                            'customer_id'    => 'admin_test',
                            'customer_email' => 'test@nellaiiptv.com',
                            'customer_phone' => '9999999999',
                        ],
                    ],
                ]);

                $order = json_decode((string)$res->getBody(), true);

                return ResponseFormatter::success($response, [
                    'gateway'            => 'cashfree',
                    'payment_session_id' => $order['payment_session_id'],
                    'order_id'           => $order['order_id'],
                    'environment'        => $environment,
                ], 'Cashfree test order created');
            }

            return ResponseFormatter::error($response, 'Invalid gateway. Use "razorpay" or "cashfree"', 400);

        } catch (\GuzzleHttp\Exception\ClientException $e) {
            $body = json_decode((string)$e->getResponse()->getBody(), true);
            $msg  = $body['error']['description'] ?? $body['message'] ?? $e->getMessage();
            return ResponseFormatter::error($response, "Gateway error: $msg", 502);
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 500);
        }
    }

    public function uploadAppLogoPng(Request $request, Response $response): Response
    {
        $uploadedFiles = $request->getUploadedFiles();
        $uploadedFile = $uploadedFiles['logo'] ?? null;

        if (!$uploadedFile || $uploadedFile->getError() !== UPLOAD_ERR_OK) {
            return ResponseFormatter::error($response, 'No valid file uploaded', 400);
        }

        $extension = pathinfo($uploadedFile->getClientFilename(), PATHINFO_EXTENSION);
        if (strtolower($extension) !== 'png') {
            return ResponseFormatter::error($response, 'Invalid file type. Only PNG allowed', 400);
        }

        // Define upload directory
        $directory = __DIR__ . '/../../../public/uploads/branding';
        if (!is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        $filename = 'app_logo_' . time() . '.png';
        $path = $directory . DIRECTORY_SEPARATOR . $filename;

        try {
            $uploadedFile->moveTo($path);
            
            // Generate Path
             $relativeUrl = '/uploads/branding/' . $filename; // Store only path

            // Generate Display URL
            $logoUrl = $relativeUrl;
            $appUrl = $_ENV['APP_URL'] ?? getenv('APP_URL') ?? $_SERVER['APP_URL'] ?? null;
            if (!empty($appUrl)) {
                $baseUrl = rtrim($appUrl, '/');
                $logoUrl = $baseUrl . $relativeUrl;
            } else {
                 $uri = $request->getUri();
                 $routeContext = RouteContext::fromRequest($request);
                 $basePath = $routeContext->getBasePath();
                 $scheme = $request->getHeaderLine('X-Forwarded-Proto') ?: $uri->getScheme();
                 $authority = $request->getHeaderLine('X-Forwarded-Host') ?: $uri->getAuthority();
                 $base = ($basePath === '/' || $basePath === '') ? '' : $basePath;
                 
                 // If authority is empty (CLI context?), fallback to localhost
                 if (empty($authority)) $authority = 'localhost';
                 
                 $logoUrl = $scheme . '://' . $authority . $base . $relativeUrl;
            }

            // Update Setting with PATH ONLY
            Setting::set('app_logo_png_path', $relativeUrl);

            return ResponseFormatter::success($response, ['url' => $logoUrl, 'path' => $relativeUrl], 'App Logo (PNG) uploaded successfully');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, 'Failed to upload logo: ' . $e->getMessage(), 500);
        }
    }
}
